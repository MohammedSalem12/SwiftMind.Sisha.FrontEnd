import { CommonModule, Location } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LocalizationPipe, LocalizationService } from '@abp/ng.core';
import { AttendanceService } from '@proxy/attendances';
import { CurrentUserInfoService } from '@proxy/common';
import { CourseService } from '@proxy/courses';
import { ExamGradeService } from '@proxy/exam-grades';
import { ExamService } from '@proxy/exams';
import { GroupService } from '@proxy/groups';
import { TeacherService } from '@proxy/teachers';
import { AcademyService } from '@proxy/academies';
import { lastValueFrom } from 'rxjs';

interface StudentGradeEntry {
  enrollmentId: string;
  studentId: string;
  studentCode: string;
  studentName: string;
  gradeId: string | null;
  inputGrade: string;
  savedGrade: number | null;
  savedMaxGrade: number | null;
  saving: boolean;
  rowError: string | null;
  rowSuccess: boolean;
}

interface GroupOption {
  id: string;
  name: string;
  teacherId: string;
  teacherName: string;
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, LocalizationPipe],
  templateUrl: './marks-entry.component.html',
  styleUrls: ['./marks-entry.component.scss'],
})
export class MarksEntryComponent implements OnInit {
  private readonly attendanceSvc      = inject(AttendanceService);
  private readonly examSvc            = inject(ExamService);
  private readonly examGradeSvc       = inject(ExamGradeService);
  private readonly courseSvc          = inject(CourseService);
  private readonly teacherSvc         = inject(TeacherService);
  private readonly groupSvc           = inject(GroupService);
  private readonly academySvc         = inject(AcademyService);
  private readonly currentUserInfoSvc = inject(CurrentUserInfoService);
  private readonly route              = inject(ActivatedRoute);
  private readonly router             = inject(Router);
  private readonly location           = inject(Location);
  private readonly localization       = inject(LocalizationService);

  // Role
  isTeacher = signal(false);
  teacherId = signal<string | null>(null);

  // Locked mode: when arriving with ?courseId= the dropdown becomes a read-only label
  lockedCourseId = signal<string | null>(null);

  // Course
  courses         = signal<any[]>([]);
  selectedCourseId = signal<string | null>(null);
  selectedCourse   = computed(() => {
    const courseId = this.selectedCourseId();
    return this.courses().find(c => c.id === courseId) || null;
  });

  // Exam
  exams            = signal<any[]>([]);
  selectedExamId   = signal<string | null>(null);
  selectedExamName = signal<string>('');
  selectedExam     = computed(() => {
    const examId = this.selectedExamId();
    return this.exams().find(e => e.id === examId) || null;
  });

  // Date (for grade record)
  gradeDate = signal<string>(new Date().toISOString().slice(0, 10));

  // Global max grade for this session
  globalMaxGrade = signal<string>('100');

  // Group
  groups            = signal<GroupOption[]>([]);
  selectedGroupId   = signal<string | null>(null);
  effectiveTeacherId = signal<string | null>(null);

  // Students
  students = signal<StudentGradeEntry[]>([]);

  // Add exam form
  showAddExamForm = signal(false);
  newExamName     = signal('');
  addingExam      = signal(false);

  // UI
  loading     = signal(false);
  saving      = signal(false);
  message     = signal<string | null>(null);
  messageType = signal<'success' | 'error'>('success');

  // Stats
  gradedCount   = computed(() => this.students().filter(s => s.savedGrade !== null).length);
  ungradedCount = computed(() => this.students().filter(s => s.savedGrade === null).length);
  totalCount    = computed(() => this.students().length);

  // Academy helpers
  isAcademyCourse = computed(() => {
    const course = this.selectedCourse();
    return !!(course?.academyId && course?.academyName);
  });

  getAcademyInfo = () => {
    const course = this.selectedCourse();
    return course?.academyId && course?.academyName 
      ? { id: course.academyId, name: course.academyName }
      : null;
  };

  async ngOnInit(): Promise<void> {
    await this.init();
  }

  private async init(): Promise<void> {
    try {
      const userInfo = await lastValueFrom(this.currentUserInfoSvc.getCurrentUserActorInfo());
      const actorType = userInfo?.actorType;
      const actorId   = userInfo?.actorId;

      const qpCourseId = this.route.snapshot.queryParamMap.get('courseId');
      const qpTeacherId = this.route.snapshot.queryParamMap.get('teacherId');

      if (actorType === 'Teacher' && actorId) {
        this.isTeacher.set(true);
        this.teacherId.set(actorId);
        this.effectiveTeacherId.set(actorId);
        await this.loadTeacherCourses(actorId);
      } else if (qpTeacherId) {
        // Secretary arriving from a specific teacher's course list
        this.isTeacher.set(false);
        this.teacherId.set(qpTeacherId);
        this.effectiveTeacherId.set(qpTeacherId);
        await this.loadTeacherCourses(qpTeacherId);
      } else {
        this.isTeacher.set(false);
        await this.loadAllCourses();
      }

      const qpAcademyId = this.route.snapshot.queryParamMap.get('academyId');

      if (qpAcademyId) {
        // Academy ID provided directly — fetch academy and tag the locked course immediately
        await this.enrichLockedCourseWithAcademy(qpCourseId, qpAcademyId);
      } else {
        // No academy ID — scan all academies to find if course belongs to one
        await this.enrichCoursesWithAcademyInfo();
      }

      if (qpCourseId && this.courses().some(c => c.id === qpCourseId)) {
        this.lockedCourseId.set(qpCourseId);
        await this.onCourseChange(qpCourseId);
      }
    } catch (e) {
      console.error('Failed to initialize marks-entry:', e);
    }
  }

  private async enrichLockedCourseWithAcademy(courseId: string | null, academyId: string): Promise<void> {
    if (!courseId) return;
    try {
      const [academy, course] = await Promise.all([
        lastValueFrom(this.academySvc.get(academyId)).catch(() => null),
        this.courses().some(c => c.id === courseId)
          ? Promise.resolve(null)
          : lastValueFrom(this.courseSvc.get(courseId)).catch(() => null),
      ]);
      if (!academy) return;
      const academyName = academy.nameAr || academy.nameEn || '';
      if (course) {
        // Course was not in list — add it with academy tags
        this.courses.update(list => [...list, { ...course, academyId, academyName }]);
      } else {
        // Course already in list — just tag it
        this.courses.update(list =>
          list.map(c => c.id === courseId ? { ...c, academyId, academyName } : c)
        );
      }
    } catch (e) {
      console.error('Failed to load academy/course info', e);
    }
  }

  private async enrichCoursesWithAcademyInfo(): Promise<void> {
    try {
      const academies = await lastValueFrom(this.academySvc.getList()).catch(() => [] as any[]);
      if (!academies?.length) return;

      // Build courseId → academy lookup via parallel requests
      const courseAcademyMap = new Map<string, { academyId: string; academyName: string }>();
      await Promise.all(
        academies.map(async (academy: any) => {
          if (!academy.id) return;
          try {
            const courses = await lastValueFrom(this.academySvc.getAcademyCourses(academy.id));
            (courses || []).forEach((c: any) => {
              if (c.courseId) {
                courseAcademyMap.set(c.courseId, {
                  academyId: academy.id,
                  academyName: academy.nameAr || academy.nameEn || '',
                });
              }
            });
          } catch { /* ignore per-academy errors */ }
        })
      );

      if (!courseAcademyMap.size) return;

      // Enrich courses array
      this.courses.update(list =>
        list.map(c => {
          const info = courseAcademyMap.get(c.id);
          return info ? { ...c, academyId: info.academyId, academyName: info.academyName } : c;
        })
      );
    } catch (e) {
      console.error('Failed to enrich courses with academy info', e);
    }
  }

  private async loadTeacherCourses(teacherId: string): Promise<void> {
    this.loading.set(true);
    try {
      const res: any[] = await lastValueFrom(this.teacherSvc.getTeacherCourses(teacherId));
      this.courses.set(res || []);
    } catch (e) {
      console.error('Failed to load teacher courses', e);
      this.courses.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  private async loadAllCourses(): Promise<void> {
    this.loading.set(true);
    try {
      const res: any = await lastValueFrom(
        this.courseSvc.getList({ skipCount: 0, maxResultCount: 1000 } as any)
      );
      this.courses.set(res?.items || []);
    } catch (e) {
      console.error('Failed to load all courses', e);
      this.courses.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  async onCourseChange(courseId: string): Promise<void> {
    this.selectedCourseId.set(courseId || null);
    this.selectedGroupId.set(null);
    this.selectedExamId.set(null);
    this.selectedExamName.set('');
    this.groups.set([]);
    this.exams.set([]);
    this.students.set([]);
    this.message.set(null);

    if (!courseId) return;

    this.effectiveTeacherId.set(this.teacherId());
    await Promise.all([this.loadGroups(courseId), this.loadExams(courseId)]);
  }

  private async loadGroups(courseId: string): Promise<void> {
    try {
      if (this.teacherId()) {
        // Teacher (own courses) or Secretary (specific teacher's courses)
        const res: any[] = await lastValueFrom(
          this.groupSvc.getGroupsByCourseAndTeacher(courseId, this.teacherId()!)
        );
        this.groups.set(
          (res || []).map(g => ({
            id: g.groupId || g.id,
            name: g.name || '',
            teacherId: g.teacherId || '',
            teacherName: g.teacherName || '',
          }))
        );
      } else {
        // Admin without specific teacher context: load all groups and filter
        const res: any = await lastValueFrom(this.groupSvc.getList());
        const allGroups: any[] = res?.items || [];
        this.groups.set(
          allGroups
            .filter(g => g.courseId === courseId)
            .map(g => ({
              id: g.id || g.groupId,
              name: g.name || '',
              teacherId: g.teacherId || '',
              teacherName: g.teacherName || '',
            }))
        );
      }
    } catch (e) {
      console.error('Failed to load groups', e);
      this.groups.set([]);
    }
  }

  private async loadExams(courseId: string): Promise<void> {
    try {
      const res: any = await lastValueFrom(
        this.examSvc.getExamsByCourse(courseId, { skipCount: 0, maxResultCount: 200 } as any)
      );
      const exams = res?.items || [];
      // Enrich exams with academy information from the selected course
      const course = this.selectedCourse();
      const enrichedExams = exams.map((exam: any) => ({
        ...exam,
        academyId: course?.academyId,
        academyName: course?.academyName,
        courseName: course?.nameAr || course?.nameEn,
      }));
      this.exams.set(enrichedExams);
    } catch (e) {
      console.error('Failed to load exams', e);
      this.exams.set([]);
    }
  }

  async onGroupChange(groupId: string): Promise<void> {
    this.selectedGroupId.set(groupId || null);
    this.students.set([]);
    this.message.set(null);

    if (groupId) {
      const group = this.groups().find(g => g.id === groupId);
      this.effectiveTeacherId.set(group?.teacherId || this.teacherId());
    } else {
      this.effectiveTeacherId.set(this.teacherId());
    }

    if (this.selectedExamId()) {
      await this.loadStudents();
    }
  }

  async onExamChange(examId: string): Promise<void> {
    this.selectedExamId.set(examId || null);
    this.students.set([]);
    this.message.set(null);

    const exam = this.exams().find(e => e.id === examId);
    this.selectedExamName.set(exam?.examName || '');

    if (examId && this.selectedCourseId()) {
      await this.loadStudents();
    }
  }

  async addExam(): Promise<void> {
    const name     = this.newExamName().trim();
    const courseId = this.selectedCourseId();
    const course   = this.selectedCourse();
    if (!name || !courseId) return;

    this.addingExam.set(true);
    try {
      const dto: any = {
        examName: name,
        courseId,
        teacherId: this.effectiveTeacherId() || '',
        groupId:   this.selectedGroupId() || undefined,
        // Include academy information if course is academy-related
        academyId: course?.academyId || undefined,
        examDescription: course?.academyName 
          ? `امتحان لمقرر "${course.nameAr || course.nameEn}" في أكاديمية ${course.academyName}`
          : undefined,
      };
      const created: any = await lastValueFrom(
        this.examSvc.create(dto, { skipHandleError: true })
      );
      this.newExamName.set('');
      this.showAddExamForm.set(false);
      await this.loadExams(courseId);
      if (created?.id) await this.onExamChange(created.id);
      
      // Show success message with academy context
      const successMsg = course?.academyName 
        ? `تم إنشاء الامتحان بنجاح لمقرر "${course.nameAr || course.nameEn}" في أكاديمية ${course.academyName}`
        : 'تم إنشاء الامتحان بنجاح';
      this.showMessage(successMsg, 'success');
    } catch (e: any) {
      const msg = e?.error?.error?.message || this.l('MarksEntry:ErrorCreateExamFailed');
      this.showMessage(msg, 'error');
    } finally {
      this.addingExam.set(false);
    }
  }

  private async loadStudents(): Promise<void> {
    const courseId = this.selectedCourseId();
    const examId   = this.selectedExamId();
    if (!courseId || !examId) return;

    this.loading.set(true);
    this.students.set([]);

    try {
      const params: any = {
        courseId,
        date: this.gradeDate(),
        skipCount: 0,
        maxResultCount: 1000,
      };
      if (this.effectiveTeacherId()) params.teacherId = this.effectiveTeacherId();

      const [studentsRes, gradesRes] = await Promise.all([
        lastValueFrom(this.attendanceSvc.getStudentAttendanceStatus(params)),
        lastValueFrom(this.examGradeSvc.getGradesByExam(examId)),
      ]);

      const grades: any[]  = (gradesRes as any) || [];
      const gradeLookup    = new Map(grades.map((g: any) => [g.enrollmentId, g]));

      const rawEntries: StudentGradeEntry[] = ((studentsRes as any)?.items || []).map((item: any) => {
        const existing = gradeLookup.get(item.enrollmentId);
        return {
          enrollmentId: item.enrollmentId,
          studentId:    item.studentId,
          studentCode:  item.studentCode || '',
          studentName:  item.fullName || `${item.firstName || ''} ${item.lastName || ''}`.trim(),
          gradeId:      existing?.id || null,
          inputGrade:   existing != null ? String(existing.grade) : '',
          savedGrade:   existing?.grade ?? null,
          savedMaxGrade: existing?.maxGrade ?? null,
          saving:       false,
          rowError:     null,
          rowSuccess:   false,
        };
      });

      // Deduplicate by studentId — prefer the row that already has a grade
      const seen = new Map<string, StudentGradeEntry>();
      for (const entry of rawEntries) {
        const prev = seen.get(entry.studentId);
        if (!prev || (prev.savedGrade === null && entry.savedGrade !== null)) {
          seen.set(entry.studentId, entry);
        }
      }
      this.students.set(Array.from(seen.values()));
    } catch (e) {
      console.error('Failed to load students with grades:', e);
      this.students.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  async saveGrade(index: number): Promise<void> {
    const student  = this.students()[index];
    const grade    = parseFloat(student.inputGrade);
    const maxGrade = parseFloat(this.globalMaxGrade());

    if (isNaN(grade) || grade < 0) {
      this.updateStudent(index, { rowError: this.l('MarksEntry:ErrorInvalidGrade'), rowSuccess: false });
      return;
    }
    if (isNaN(maxGrade) || maxGrade <= 0) {
      this.updateStudent(index, { rowError: this.l('MarksEntry:ErrorInvalidMaxGrade'), rowSuccess: false });
      return;
    }
    if (grade > maxGrade) {
      this.updateStudent(index, {
        rowError: this.l('MarksEntry:ErrorGradeExceedsMax', String(maxGrade)),
        rowSuccess: false,
      });
      return;
    }

    this.updateStudent(index, { saving: true, rowError: null, rowSuccess: false });
    try {
      const dto = {
        enrollmentId: student.enrollmentId,
        examId:       this.selectedExamId()!,
        grade,
        maxGrade,
        date: new Date(this.gradeDate()).toISOString(),
      };

      if (student.gradeId) {
        await lastValueFrom(
          this.examGradeSvc.update(student.gradeId, dto, { skipHandleError: true })
        );
      } else {
        const created: any = await lastValueFrom(
          this.examGradeSvc.create(dto, { skipHandleError: true })
        );
        this.updateStudent(index, { gradeId: created?.id || null });
      }

      this.updateStudent(index, { savedGrade: grade, savedMaxGrade: maxGrade, rowSuccess: true, rowError: null });
      setTimeout(() => this.updateStudent(index, { rowSuccess: false }), 2500);
    } catch (e: any) {
      const msg = e?.error?.error?.message || this.l('MarksEntry:ErrorSaveFailed');
      this.updateStudent(index, { rowError: msg, rowSuccess: false });
    } finally {
      this.updateStudent(index, { saving: false });
    }
  }

  async saveAll(): Promise<void> {
    const indices = this.students()
      .map((s, i) => ({ s, i }))
      .filter(({ s }) => s.inputGrade !== '' && !isNaN(parseFloat(s.inputGrade)))
      .map(({ i }) => i);

    if (indices.length === 0) {
      this.showMessage(this.l('MarksEntry:ErrorNoGrades'), 'error');
      return;
    }

    this.saving.set(true);
    this.message.set(null);
    await Promise.all(indices.map(i => this.saveGrade(i)));
    this.saving.set(false);

    const errors = this.students().filter(s => s.rowError !== null).length;
    const ok     = indices.length - errors;
    this.showMessage(
      errors > 0
        ? this.l('MarksEntry:SaveAllPartial', String(ok), String(errors))
        : this.l('MarksEntry:SaveAllSuccess', String(ok)),
      errors > 0 ? 'error' : 'success'
    );
  }

  updateGradeInput(index: number, value: string): void {
    this.updateStudent(index, { inputGrade: value, rowError: null, rowSuccess: false });
  }

  private updateStudent(index: number, partial: Partial<StudentGradeEntry>): void {
    this.students.update(list => {
      const updated = [...list];
      updated[index] = { ...updated[index], ...partial };
      return updated;
    });
  }

  private showMessage(text: string, type: 'success' | 'error'): void {
    this.message.set(text);
    this.messageType.set(type);
    setTimeout(() => this.message.set(null), 5000);
  }

  gradePct(entry: StudentGradeEntry): number {
    if (entry.savedGrade === null || !entry.savedMaxGrade) return 0;
    return Math.round((entry.savedGrade / entry.savedMaxGrade) * 100);
  }

  /** CSS-safe class suffix — always English, language-independent */
  gradeClass(pct: number): string {
    if (pct >= 90) return 'excellent';
    if (pct >= 75) return 'very-good';
    if (pct >= 60) return 'good';
    if (pct >= 50) return 'acceptable';
    return 'failed';
  }

  /** Localized display label */
  gradeLabel(pct: number): string {
    if (pct >= 90) return this.l('MarksEntry:GradeExcellent');
    if (pct >= 75) return this.l('MarksEntry:GradeVeryGood');
    if (pct >= 60) return this.l('MarksEntry:GradeGood');
    if (pct >= 50) return this.l('MarksEntry:GradeAcceptable');
    return this.l('MarksEntry:GradeFailed');
  }

  trackByStudentId = (_: number, item: StudentGradeEntry) => item.studentId;

  viewReport(): void {
    const examId = this.selectedExamId();
    if (examId) this.router.navigate(['/marks-entry/report', examId]);
  }

  goBack(): void { this.location.back(); }

  /** Shorthand for `this.localization.instant('::' + key, ...params)` */
  private l(key: string, ...params: string[]): string {
    return this.localization.instant(`::${key}`, ...params);
  }
}
