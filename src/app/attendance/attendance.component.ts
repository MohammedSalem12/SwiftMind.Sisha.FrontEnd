import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AttendanceService } from '@proxy/attendances';
import { CurrentUserInfoService } from '@proxy/common';
import { CourseService } from '@proxy/courses';
import { GroupService } from '@proxy/groups';
import { TeacherService } from '@proxy/teachers';
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
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './attendance.component.html',
  styleUrls: ['./attendance.component.scss'],
})
export class AttendanceComponent implements OnInit {
  private readonly attendanceSvc = inject(AttendanceService);
  private readonly courseSvc = inject(CourseService);
  private readonly teacherSvc = inject(TeacherService);
  private readonly groupSvc = inject(GroupService);
  private readonly currentUserInfoSvc = inject(CurrentUserInfoService);
  private readonly route = inject(ActivatedRoute);

  // Role state
  isTeacher = signal(false);
  teacherId = signal<string | null>(null);

  // Course
  courses = signal<any[]>([]);
  selectedCourseId = signal<string | null>(null);
  selectedCourseName = signal<string>('');

  // Date (default today)
  attendanceDate = signal<string>(new Date().toISOString().slice(0, 10));

  // Group (optional)
  groups = signal<GroupOption[]>([]);
  selectedGroupId = signal<string | null>(null);
  effectiveTeacherId = signal<string | null>(null);

  // Students
  students = signal<StudentEntry[]>([]);

  // UI
  loading = signal(false);
  saving = signal(false);
  message = signal<string | null>(null);
  messageType = signal<'success' | 'error'>('success');

  // Computed stats
  presentCount = computed(() => this.students().filter(s => !s.isAbsent).length);
  absentCount = computed(() => this.students().filter(s => s.isAbsent).length);
  selectedCount = computed(() => this.students().filter(s => s.selected).length);
  allSelected = computed(
    () => this.students().length > 0 && this.students().every(s => s.selected)
  );

  async ngOnInit(): Promise<void> {
    await this.init();
  }

  private async init(): Promise<void> {
    try {
      const userInfo = await lastValueFrom(this.currentUserInfoSvc.getCurrentUserActorInfo());
      const actorType = userInfo?.actorType;
      const actorId = userInfo?.actorId;

      if (actorType === 'Teacher' && actorId) {
        this.isTeacher.set(true);
        this.teacherId.set(actorId);
        this.effectiveTeacherId.set(actorId);
        await this.loadTeacherCourses(actorId);
      } else {
        this.isTeacher.set(false);
        await this.loadAllCourses();
      }

      // Auto-select course from query params if provided
      const qpCourseId = this.route.snapshot.queryParamMap.get('courseId');
      if (qpCourseId && this.courses().some(c => c.id === qpCourseId)) {
        await this.onCourseChange(qpCourseId);
      }
    } catch (e) {
      console.error('Failed to initialize attendance component:', e);
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

    const course = this.courses().find(c => c.id === courseId);
    this.selectedCourseName.set(course ? (course.nameAr || course.nameEn || '') : '');

    if (!courseId) return;

    this.effectiveTeacherId.set(this.teacherId());

    await this.loadGroups(courseId);
    await this.loadStudents();
  }

  private async loadGroups(courseId: string): Promise<void> {
    try {
      if (this.isTeacher() && this.teacherId()) {
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
        // Secretary/Admin: load all groups and filter by courseId
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

    await this.loadStudents();
  }

  async onDateChange(date: string): Promise<void> {
    this.attendanceDate.set(date);
    this.message.set(null);
    if (this.selectedCourseId()) {
      await this.loadStudents();
    }
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
        skipCount: 0,
        maxResultCount: 1000,
      };

      if (this.effectiveTeacherId()) {
        params.teacherId = this.effectiveTeacherId();
      }

      const response: any = await lastValueFrom(
        this.attendanceSvc.getStudentAttendanceStatus(params)
      );

      const entries: StudentEntry[] = (response?.items || []).map((item: any) => ({
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

      this.students.set(entries);
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
            this.attendanceSvc.create({
              enrollmentId: s.enrollmentId,
              date: new Date(this.attendanceDate()).toISOString(),
              isAbsent: true,
              note: '--',
            })
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
          await lastValueFrom(this.attendanceSvc.delete(student.attendanceId));
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
            await lastValueFrom(this.attendanceSvc.delete(record.id));
          }
        }
        this.showMessage('تم إلغاء الغياب', 'success');
      } else {
        await lastValueFrom(
          this.attendanceSvc.create({
            enrollmentId: student.enrollmentId,
            date: new Date(this.attendanceDate()).toISOString(),
            isAbsent: true,
            note: '--',
          })
        );
        this.showMessage('تم تسجيل الغياب وإرسال الإشعار', 'success');
      }
      await this.loadStudents();
    } catch (e) {
      console.error('Toggle attendance failed:', e);
      this.showMessage('فشلت العملية، يرجى المحاولة مرة أخرى', 'error');
    } finally {
      this.saving.set(false);
    }
  }

  private showMessage(text: string, type: 'success' | 'error'): void {
    this.message.set(text);
    this.messageType.set(type);
    setTimeout(() => this.message.set(null), 5000);
  }

  trackByEnrollment = (_: number, item: StudentEntry) => item.enrollmentId;
}
