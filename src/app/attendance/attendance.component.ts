import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceAbsenteesListComponent } from './attendance-absentees-list.component';
import { lastValueFrom } from 'rxjs';
import { StudentEnrollmentService as EnrollmentService } from '@proxy/student-enrollments';
import { CourseService } from '@proxy/courses';
import { StudentService } from '@proxy/students';
import { TeacherService } from '@proxy/teachers';
import { AttendanceService } from '@proxy/attendances';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, AttendanceAbsenteesListComponent],
  templateUrl: './attendance.component.html',
  styleUrls: ['./attendance.component.scss']
})
export class AttendanceComponent implements OnInit {
  private readonly enrollmentSvc = inject(EnrollmentService);
  private readonly courseSvc = inject(CourseService);
  private readonly studentSvc = inject(StudentService);
  private readonly teacherSvc = inject(TeacherService);
  private readonly attendanceSvc = inject(AttendanceService);

  loading = signal(false);
  teachers = signal<any[]>([]);
  selectedTeacherId = signal<string | null>(null);

  courses = signal<any[]>([]);
  selectedCourseId = signal<string | null>(null);

  students = signal<{ enrollmentId: string; studentId: string; studentName?: string; selected?: boolean; alreadyAbsent?: boolean }[]>([]);
  // today's absentees for selected course+teacher
  todaysAbsentees = signal<{ attendanceId?: string; enrollmentId: string; studentName: string; date: string; note?: string }[]>([]);
  deletingAttendanceId = signal<string | null>(null);

  attendanceDate = signal<string>(new Date().toISOString().slice(0,10)); // yyyy-mm-dd
  saving = signal(false);
  message = signal<string | null>(null);
  note = signal<string>('');

  ngOnInit(): void {
    void this.loadTeachers();
  }

  async loadTeachers() {
    this.loading.set(true);
    try {
      const res: any = await lastValueFrom(this.teacherSvc.getList({ skipCount: 0, maxResultCount: 1000 } as any));
      this.teachers.set(res.items ?? []);
    } catch (e) {
      console.error(e);
      this.teachers.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  async onTeacherChange(id?: string) {
    const newTeacher = id || null;
    const prevCourse = this.selectedCourseId();
    this.selectedTeacherId.set(newTeacher);
    this.courses.set([]);
    this.students.set([]);
    this.todaysAbsentees.set([]);
    if (!newTeacher) {
      this.selectedCourseId.set(null);
      return;
    }
    await this.loadCoursesForTeacher(newTeacher);
    // if previously selected course still belongs to this teacher, keep it
    if (prevCourse) {
      const found = this.courses().find(c => c.id === prevCourse);
      if (found) {
        this.selectedCourseId.set(prevCourse);
        await this.loadStudentsForCourse(prevCourse, newTeacher);
        await this.loadTodaysAbsentees();
        return;
      } else {
        this.selectedCourseId.set(null);
      }
    }
  }

  async loadCoursesForTeacher(teacherId: string) {
    this.loading.set(true);
    try {
      // Use the teacher API to fetch courses assigned to this teacher
      const res: any[] = await lastValueFrom(this.teacherSvc.getTeacherCourses(teacherId));
      const normalized = (res ?? []).map(c => ({ ...c, gradeId: c.gradeId ?? null, gradeName: c.gradeName ?? '' }));
      this.courses.set(normalized);
    } catch (e) {
      console.error(e);
      this.courses.set([]);
    } finally { this.loading.set(false); }
  }

  async onCourseChange(courseId?: string) {
    this.selectedCourseId.set(courseId || null);
    this.students.set([]);
    this.todaysAbsentees.set([]);
    if (!courseId) return;
    await this.loadStudentsForCourse(courseId, this.selectedTeacherId());
    // after students loaded, load today's absentees for this selection
    await this.loadTodaysAbsentees();
  }

  async loadTodaysAbsentees() {
    const courseId = this.selectedCourseId();
    const teacherId = this.selectedTeacherId();
    if (!courseId) { this.todaysAbsentees.set([]); return; }
    this.loading.set(true);
    try {
      // find enrollments for this course (and teacher) to get enrollmentIds
      const enrolls: any[] = [];
      let skip = 0; const page = 1000;
      while (true) {
        const r: any = await lastValueFrom(this.enrollmentSvc.getList({ skipCount: skip, maxResultCount: page } as any));
        const items = r.items ?? [];
        enrolls.push(...items.filter((e: any) => e.courseId === courseId && (!teacherId || e.teacherId === teacherId)));
        if (items.length < page) break;
        skip += page;
      }
      const enrollmentIds = enrolls.map(e => e.id).filter(Boolean);

      // fetch attendance in pages and filter by enrollmentIds and date
      const targetDate = new Date(this.attendanceDate()).toISOString().slice(0,10);
      const matches: any[] = [];
      skip = 0;
      while (true) {
        const r: any = await lastValueFrom(this.attendanceSvc.getList({ skipCount: skip, maxResultCount: page } as any));
        const items = r.items ?? [];
        for (const it of items) {
          if (!it.enrollmentId) continue;
          if (!enrollmentIds.includes(it.enrollmentId)) continue;
          if (!it.date) continue;
          const d = new Date(it.date).toISOString().slice(0,10);
          if (d !== targetDate) continue;
          if (!it.isAbsent) continue;
          matches.push(it);
        }
        if (items.length < page) break;
        skip += page;
      }

      // map to student names by fetching students for matched enrollmentIds
      const absList: { attendanceId?: string; enrollmentId: string; studentName: string; date: string; note?: string }[] = [];
      for (const m of matches) {
        const enr = enrolls.find(e => e.id === m.enrollmentId);
        let name = m.enrollmentId;
        if (enr) {
          try { const st: any = await lastValueFrom(this.studentSvc.get(enr.studentId)); name = `${st.firstName || ''} ${st.lastName || ''}`.trim(); } catch {}
        }
        absList.push({ attendanceId: m.id, enrollmentId: m.enrollmentId, studentName: name, date: m.date, note: m.note });
      }

      this.todaysAbsentees.set(absList);
    } catch (e) {
      console.error('Failed to load today\'s absentees', e);
      this.todaysAbsentees.set([]);
    } finally { this.loading.set(false); }
  }

  async cancelAttendance(attendanceId?: string) {
    if (!attendanceId) return;
    // find enrollmentId associated with this attendance (if any) so we can update students list after delete
    const rec = this.todaysAbsentees().find(x => x.attendanceId === attendanceId);
    const affectedEnrollmentId = rec?.enrollmentId;
    this.deletingAttendanceId.set(attendanceId);
    try {
      await lastValueFrom(this.attendanceSvc.delete(attendanceId));
      // optimistically remove the deleted attendance from today's list so UI updates immediately
      this.todaysAbsentees.set(this.todaysAbsentees().filter(x => x.attendanceId !== attendanceId));
      // reload todays absentees and students list to ensure full sync
      await this.loadTodaysAbsentees();
      if (this.selectedCourseId()) {
        await this.loadStudentsForCourse(this.selectedCourseId() as string, this.selectedTeacherId());
        // ensure the affected student is not selected anymore (safety)
        if (affectedEnrollmentId) {
          const newStudents = this.students().map(s => s.enrollmentId === affectedEnrollmentId ? { ...s, selected: false } : s);
          this.students.set(newStudents);
        }
      }
      this.message.set('تم إلغاء الحضور/الغياب');
    } catch (e) {
      console.error('Failed to cancel attendance', e);
      this.message.set('فشل إلغاء الحضور/الغياب');
    } finally {
      this.deletingAttendanceId.set(null);
    }
  }

  // helper used from template to set date and reload today's absentees
  setDateAndReload(dateStr: string) {
    this.attendanceDate.set(dateStr);
    void this.loadTodaysAbsentees();
  }

  async loadStudentsForCourse(courseId: string, teacherId?: string | null) {
    this.loading.set(true);
    try {
      // fetch enrollments and filter by courseId (and teacherId when provided)
      const enrolls: any[] = [];
      let skip = 0; const page = 1000;
      while (true) {
        const r: any = await lastValueFrom(this.enrollmentSvc.getList({ skipCount: skip, maxResultCount: page } as any));
        const items = r.items ?? [];
        enrolls.push(...items.filter((e: any) => e.courseId === courseId && (!teacherId || e.teacherId === teacherId)));
        if (items.length < page) break;
        skip += page;
      }
      // fetch attendances for the selected date and build a set of absent enrollmentIds
      const targetDate = new Date(this.attendanceDate()).toISOString().slice(0,10);
      const absentEnrollmentIds = new Set<string>();
      skip = 0;
      while (true) {
        const r: any = await lastValueFrom(this.attendanceSvc.getList({ skipCount: skip, maxResultCount: page } as any));
        const items = r.items ?? [];
        for (const it of items) {
          if (!it.enrollmentId) continue;
          if (!it.date) continue;
          const d = new Date(it.date).toISOString().slice(0,10);
          if (d !== targetDate) continue;
          if (!it.isAbsent) continue;
          absentEnrollmentIds.add(it.enrollmentId);
        }
        if (items.length < page) break;
        skip += page;
      }
      // fetch student info for each enrollment
      const sList: any[] = [];
      for (const e of enrolls) {
        try {
          const st: any = await lastValueFrom(this.studentSvc.get(e.studentId));
          sList.push({ enrollmentId: e.id, studentId: e.studentId, studentName: `${st.firstName || ''} ${st.lastName || ''}`.trim(), selected: false, alreadyAbsent: absentEnrollmentIds.has(e.id) });
        } catch {
          sList.push({ enrollmentId: e.id, studentId: e.studentId, studentName: e.studentId, selected: false, alreadyAbsent: absentEnrollmentIds.has(e.id) });
        }
      }
      this.students.set(sList);
    } catch (e) {
      console.error(e);
      this.students.set([]);
    } finally { this.loading.set(false); }
  }

  toggleStudent(i: number) {
    const arr = [...this.students()]; arr[i].selected = !arr[i].selected; this.students.set(arr);
  }

  async markAttendances() {
    const selected = this.students().filter(s => s.selected);
    if (selected.length === 0) { this.message.set('No student selected'); return; }
    this.saving.set(true); this.message.set(null);
    try {
      const date = this.attendanceDate();
      const note = this.note();
      for (const s of selected) {
        const payload = { enrollmentId: s.enrollmentId, date: new Date(date).toISOString(), isAbsent: true, note } as any;
        try { await lastValueFrom(this.attendanceSvc.create(payload)); } catch (e) { console.error('create attendance failed', e); }
      }
      // reload today's absentees after marking
      await this.loadTodaysAbsentees();
      // reload students list so UI reflects state
      if (this.selectedCourseId()) await this.loadStudentsForCourse(this.selectedCourseId() as string, this.selectedTeacherId());
  this.message.set('Attendances recorded');
    } catch (e) {
      console.error(e);
  this.message.set('Failed to record attendances');
    } finally { this.saving.set(false); }
  }

  async markAbsent(enrollmentId: string) {
    if (!enrollmentId) return;
    this.saving.set(true);
    try {
      const payload = { enrollmentId, gradeId : '11111111-1111-1111-1111-111111111104' , date: new Date(this.attendanceDate()).toISOString(), isAbsent: true, note: this.note() } as any;
      await lastValueFrom(this.attendanceSvc.create(payload));
      // refresh lists
      await this.loadTodaysAbsentees();
      if (this.selectedCourseId()) await this.loadStudentsForCourse(this.selectedCourseId() as string, this.selectedTeacherId());
      this.message.set('تم تسجيل الغياب');
    } catch (e) {
      console.error('Failed to mark absent', e);
      this.message.set('فشل تسجيل الغياب');
    } finally {
      this.saving.set(false);
    }
  }
}
