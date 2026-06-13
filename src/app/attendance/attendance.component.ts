import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { AttendanceService } from '@proxy/attendances';
import { CurrentUserInfoService } from '@proxy/common';
import { CourseService } from '@proxy/courses';
import { GroupService } from '@proxy/groups';
import { TeacherService } from '@proxy/teachers';
import { AcademyService } from '@proxy/academies';
import type { AcademyDto } from '@proxy/academies/models';
import type { GroupScheduleDto } from '@proxy/groups/dtos/models';
import { lastValueFrom } from 'rxjs';

interface StudentEntry {
  enrollmentId: string;
  studentId: string;
  studentCode: string;
  studentName: string;
  isAbsent: boolean;
  attendanceId: string | null;
  selected: boolean;
}

interface GroupOption {
  id: string;
  name: string;
  teacherId: string;
  teacherName: string;
  schedules: GroupScheduleDto[];
}

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './attendance.component.html',
  styleUrls: ['./attendance.component.scss'],
})
export class AttendanceComponent implements OnInit {
  private readonly attendanceSvc = inject(AttendanceService);
  private readonly courseSvc = inject(CourseService);
  private readonly teacherSvc = inject(TeacherService);
  private readonly groupSvc = inject(GroupService);
  private readonly academySvc = inject(AcademyService);
  private readonly currentUserInfoSvc = inject(CurrentUserInfoService);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);

  // Role state
  isTeacher = signal(false);
  teacherId = signal<string | null>(null);

  // Locked mode: when arriving with ?courseId= the dropdown becomes a read-only label
  lockedCourseId = signal<string | null>(null);

  // Academy context (when arriving with ?academyId=)
  academy = signal<AcademyDto | null>(null);

  // Course
  courses = signal<any[]>([]);
  selectedCourseId = signal<string | null>(null);
  selectedCourseName = signal<string>('');

  // Group (before date — user picks group first, then dates from schedule)
  groups = signal<GroupOption[]>([]);
  selectedGroupId = signal<string | null>(null);
  effectiveTeacherId = signal<string | null>(null);

  // Schedule dates (computed from selected group's schedule)
  scheduleDates = signal<{ date: string; label: string }[]>([]);
  weekOffset = signal(0);
  weekLabel = signal('');

  // Date (default today)
  attendanceDate = signal<string>(new Date().toISOString().slice(0, 10));

  // Students
  students = signal<StudentEntry[]>([]);

  // UI
  loading = signal(false);
  saving = signal(false);
  message = signal<string | null>(null);
  messageType = signal<'success' | 'error'>('success');
  showStats = signal(false);

  // Paging
  page = signal(1);
  readonly pageSize = 20;
  totalStudentCount = signal(0);
  totalPages = computed(() => Math.max(1, Math.ceil(this.totalStudentCount() / this.pageSize)));

  // Computed stats
  presentCount = computed(() => this.students().filter(s => !s.isAbsent).length);
  absentCount = computed(() => this.students().filter(s => s.isAbsent).length);
  selectedCount = computed(() => this.students().filter(s => s.selected).length);
  allSelected = computed(
    () => this.students().length > 0 && this.students().every(s => s.selected)
  );

  // Pie chart data (SVG donut, circumference = 2π×40 ≈ 251.33)
  readonly C = 251.33;
  pieChart = computed(() => {
    const total = this.students().length;
    const present = this.presentCount();
    const absent = this.absentCount();
    if (total === 0) return { presentDash: `0 ${this.C}`, absentDash: `0 ${this.C}`, absentOffset: 0, presentPct: 0, absentPct: 0 };
    const pLen = (present / total) * this.C;
    const aLen = (absent / total) * this.C;
    return {
      presentDash: `${pLen} ${this.C}`,
      absentDash: `${aLen} ${this.C}`,
      absentOffset: -pLen,
      presentPct: Math.round((present / total) * 100),
      absentPct: Math.round((absent / total) * 100),
    };
  });

  async ngOnInit(): Promise<void> {
    await this.init();
  }

  private async init(): Promise<void> {
    try {
      const userInfo = await lastValueFrom(this.currentUserInfoSvc.getCurrentUserActorInfo());
      const actorType = userInfo?.actorType;
      const actorId = userInfo?.actorId;

      const qpCourseId  = this.route.snapshot.queryParamMap.get('courseId');
      const qpTeacherId = this.route.snapshot.queryParamMap.get('teacherId');
      const qpAcademyId = this.route.snapshot.queryParamMap.get('academyId');

      if (actorType === 'Teacher' && actorId) {
        this.isTeacher.set(true);
        this.teacherId.set(actorId);
        this.effectiveTeacherId.set(actorId);
        await this.loadTeacherCourses(actorId);
      } else if (qpTeacherId) {
        this.isTeacher.set(false);
        this.teacherId.set(qpTeacherId);
        this.effectiveTeacherId.set(qpTeacherId);
        await this.loadTeacherCourses(qpTeacherId);
      } else {
        this.isTeacher.set(false);
        await this.loadAllCourses();
      }

      // If academy course: fetch academy + inject course into list if missing
      if (qpAcademyId && qpCourseId) {
        await this.enrichLockedAcademyCourse(qpCourseId, qpAcademyId);
      }

      // Auto-select and lock course
      if (qpCourseId && this.courses().some(c => c.id === qpCourseId)) {
        this.lockedCourseId.set(qpCourseId);
        await this.onCourseChange(qpCourseId);
      }
    } catch (e) {
      console.error('Failed to initialize attendance component:', e);
    }
  }

  private async enrichLockedAcademyCourse(courseId: string, academyId: string): Promise<void> {
    try {
      const [academy, courseFromApi] = await Promise.all([
        lastValueFrom(this.academySvc.get(academyId)).catch(() => null),
        this.courses().some(c => c.id === courseId)
          ? Promise.resolve(null)
          : lastValueFrom(this.courseSvc.get(courseId)).catch(() => null),
      ]);
      if (academy) this.academy.set(academy);
      const academyName = academy?.nameAr || academy?.nameEn || '';
      if (courseFromApi) {
        // Not in list — add it tagged with academy info
        this.courses.update(list => [...list, { ...courseFromApi, academyId, academyName }]);
      } else {
        // Already in list — just tag it
        this.courses.update(list =>
          list.map(c => c.id === courseId ? { ...c, academyId, academyName } : c)
        );
      }
    } catch (e) {
      console.error('Failed to enrich academy course', e);
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
    this.groups.set([]);
    this.students.set([]);
    this.message.set(null);
    this.page.set(1);

    const course = this.courses().find(c => c.id === courseId);
    this.selectedCourseName.set(course ? (course.nameAr || course.nameEn || '') : '');

    if (!courseId) return;

    this.effectiveTeacherId.set(this.teacherId());

    await this.loadGroups(courseId);
    // Don't load students yet — wait for group selection
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
            schedules: g.schedules || [],
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
              schedules: g.schedules || [],
            }))
        );
      }
    } catch (e) {
      console.error('Failed to load groups', e);
      this.groups.set([]);
    }
  }

  async onGroupChange(groupId: string): Promise<void> {
    this.selectedGroupId.set(groupId || null);
    this.students.set([]);
    this.message.set(null);
    this.page.set(1);
    this.weekOffset.set(0);

    if (groupId) {
      const group = this.groups().find(g => g.id === groupId);
      this.effectiveTeacherId.set(group?.teacherId || this.teacherId());
      // Compute schedule dates from group's schedule
      this.computeScheduleDates(group?.schedules || []);
    } else {
      this.effectiveTeacherId.set(this.teacherId());
      this.scheduleDates.set([]);
      this.weekLabel.set('');
    }

    await this.loadStudents();
  }

  private _currentSchedules: GroupScheduleDto[] = [];

  private computeScheduleDates(schedules?: GroupScheduleDto[]): void {
    if (schedules) this._currentSchedules = schedules;
    const sched = this._currentSchedules;
    if (sched.length === 0) {
      this.scheduleDates.set([]);
      this.weekLabel.set('');
      return;
    }

    const ARABIC_DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const scheduleDays = sched.map(s => s.dayOfWeek); // 0=Sunday .. 6=Saturday

    const dates: { date: string; label: string }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find start of target week (Saturday as first day for Arabic calendar)
    const todayDow = today.getDay(); // 0=Sun
    const satOffset = todayDow === 6 ? 0 : -(todayDow + 1); // offset to previous Saturday
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() + satOffset + (this.weekOffset() * 7));

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    // Week label
    this.weekLabel.set(
      `${weekStart.getDate()}/${weekStart.getMonth() + 1} — ${weekEnd.getDate()}/${weekEnd.getMonth() + 1}`
    );

    // Generate only this week's schedule days (Sat–Fri = 7 days)
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      const jsDow = d.getDay();
      if (scheduleDays.includes(jsDow)) {
        const iso = d.toISOString().slice(0, 10);
        const dayName = ARABIC_DAYS[jsDow];
        const label = `${dayName} ${d.getDate()}/${d.getMonth() + 1}`;
        dates.push({ date: iso, label });
      }
    }

    this.scheduleDates.set(dates);

    // Auto-select today if it's a schedule day, otherwise pick the most recent past schedule date
    const todayIso = today.toISOString().slice(0, 10);
    if (dates.some(d => d.date === todayIso)) {
      this.attendanceDate.set(todayIso);
    } else {
      const pastDates = dates.filter(d => d.date <= todayIso);
      if (pastDates.length > 0) {
        this.attendanceDate.set(pastDates[pastDates.length - 1].date);
      } else if (dates.length > 0) {
        this.attendanceDate.set(dates[0].date);
      }
    }
  }

  prevWeek(): void {
    this.weekOffset.update(v => v - 1);
    this.computeScheduleDates();
  }

  nextWeek(): void {
    this.weekOffset.update(v => v + 1);
    this.computeScheduleDates();
  }

  goToCurrentWeek(): void {
    this.weekOffset.set(0);
    this.computeScheduleDates();
  }

  selectScheduleDate(date: string): void {
    this.attendanceDate.set(date);
    this.message.set(null);
    this.page.set(1);
    if (this.selectedCourseId()) {
      this.loadStudents();
    }
  }

  async onDateChange(date: string): Promise<void> {
    this.attendanceDate.set(date);
    this.message.set(null);
    this.page.set(1);
    if (this.selectedCourseId()) {
      await this.loadStudents();
    }
  }

  toggleStats(): void {
    this.showStats.update(v => !v);
  }

  async goToPage(p: number): Promise<void> {
    if (p < 1 || p > this.totalPages()) return;
    this.page.set(p);
    await this.loadStudents();
  }

  private async loadStudents(): Promise<void> {
    const courseId = this.selectedCourseId();
    if (!courseId) return;

    this.loading.set(true);
    this.students.set([]);

    try {
      const params: any = {
        courseId,
        date: this.attendanceDate(),
        skipCount: (this.page() - 1) * this.pageSize,
        maxResultCount: this.pageSize,
      };

      if (this.effectiveTeacherId()) {
        params.teacherId = this.effectiveTeacherId();
      }

      const response: any = await lastValueFrom(
        this.attendanceSvc.getStudentAttendanceStatus(params)
      );

      this.totalStudentCount.set(response?.totalCount ?? 0);

      const rawEntries: StudentEntry[] = (response?.items || []).map((item: any) => ({
        enrollmentId: item.enrollmentId,
        studentId: item.studentId,
        studentCode: item.studentCode || '',
        studentName:
          item.fullName ||
          `${item.firstName || ''} ${item.lastName || ''}`.trim(),
        isAbsent: item.isAbsent,
        attendanceId: item.attendanceId || null,
        selected: false,
      }));

      // Deduplicate by studentId — prefer the row that has an absence record
      const seen = new Map<string, StudentEntry>();
      for (const entry of rawEntries) {
        const prev = seen.get(entry.studentId);
        if (!prev || (!prev.isAbsent && entry.isAbsent)) {
          seen.set(entry.studentId, entry);
        }
      }
      this.students.set(Array.from(seen.values()));
    } catch (e) {
      console.error('Failed to load students:', e);
      this.students.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  toggleSelectAll(): void {
    const shouldSelect = !this.allSelected();
    this.students.update(list => list.map(s => ({ ...s, selected: shouldSelect })));
  }

  toggleSelect(index: number): void {
    this.students.update(list => {
      const updated = [...list];
      updated[index] = { ...updated[index], selected: !updated[index].selected };
      return updated;
    });
  }

  async markSelectedAbsent(): Promise<void> {
    const toMark = this.students().filter(s => s.selected && !s.isAbsent);
    if (toMark.length === 0) {
      this.showMessage('لا يوجد طلاب محددون غير مسجل غيابهم', 'error');
      return;
    }
    await this.markAbsentBatch(toMark);
  }

  async markAllAbsent(): Promise<void> {
    const toMark = this.students().filter(s => !s.isAbsent);
    if (toMark.length === 0) {
      this.showMessage('جميع الطلاب مسجلون كغائبين بالفعل', 'error');
      return;
    }
    await this.markAbsentBatch(toMark);
  }

  private async markAbsentBatch(toMark: StudentEntry[]): Promise<void> {
    this.saving.set(true);
    this.message.set(null);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const s of toMark) {
        try {
          await lastValueFrom(
            this.attendanceSvc.create(
              {
                enrollmentId: s.enrollmentId,
                date: new Date(this.attendanceDate()).toISOString(),
                isAbsent: true,
                note: '--',
              },
              { skipHandleError: true }
            )
          );
          successCount++;
        } catch {
          failCount++;
        }
      }
      await this.loadStudents();
      const msg =
        failCount > 0
          ? `تم تسجيل غياب ${successCount} طالب — فشل ${failCount}`
          : `تم تسجيل غياب ${successCount} طالب بنجاح وإرسال الإشعارات`;
      this.showMessage(msg, failCount > 0 ? 'error' : 'success');
    } finally {
      this.saving.set(false);
    }
  }

  async toggleStudentAbsent(student: StudentEntry, index: number): Promise<void> {
    this.saving.set(true);
    this.message.set(null);
    try {
      if (student.isAbsent) {
        // Remove absence
        if (student.attendanceId) {
          await lastValueFrom(this.attendanceSvc.delete(student.attendanceId, { skipHandleError: true }));
        } else {
          // Fallback: search by enrollmentId + date
          const records: any = await lastValueFrom(
            this.attendanceSvc.getList({ skipCount: 0, maxResultCount: 100 } as any)
          );
          const targetDate = this.attendanceDate();
          const record = (records?.items || []).find(
            (r: any) =>
              r.enrollmentId === student.enrollmentId &&
              new Date(r.date).toISOString().slice(0, 10) === targetDate
          );
          if (record?.id) {
            await lastValueFrom(this.attendanceSvc.delete(record.id, { skipHandleError: true }));
          }
        }
        this.showMessage('تم إلغاء الغياب', 'success');
      } else {
        await lastValueFrom(
          this.attendanceSvc.create(
            {
              enrollmentId: student.enrollmentId,
              date: new Date(this.attendanceDate()).toISOString(),
              isAbsent: true,
              note: '--',
            },
            { skipHandleError: true }
          )
        );
        this.showMessage('تم تسجيل الغياب وإرسال الإشعار', 'success');
      }
      await this.loadStudents();
    } catch (e: any) {
      console.error('Toggle attendance failed:', e);
      const msg = e?.error?.error?.message || 'فشلت العملية، يرجى المحاولة مرة أخرى';
      this.showMessage(msg, 'error');
    } finally {
      this.saving.set(false);
    }
  }

  private showMessage(text: string, type: 'success' | 'error'): void {
    this.message.set(text);
    this.messageType.set(type);
    setTimeout(() => this.message.set(null), 5000);
  }

  goBack(): void { this.location.back(); }

  trackByEnrollment = (_: number, item: StudentEntry) => item.enrollmentId;
}
