import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { StudentEnrollmentService as EnrollmentService } from '@proxy/student-enrollments';
import { CourseService } from '@proxy/courses';
import { AttendanceService } from '@proxy/attendances';
import { TeacherService } from '@proxy/teachers';
import { StudentService } from '@proxy/students';
import { ExamGradeService } from '@proxy/exam-grades';
import type { EnrollmentDto } from '@proxy/student-enrollments/dtos/models';
import type { CourseDto } from '@proxy/courses/dtos/models';
import type { AttendanceDto } from '@proxy/attendances/dtos/models';
import type { TeacherDto } from '@proxy/teachers/models';
import type { StudentDto } from '@proxy/students/models';
import type { ExamGradeDto } from '@proxy/exam-grades/dtos/models';

@Component({
  selector: 'app-student-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './student-detail.component.html',
  styleUrls: ['./student-detail.component.scss']
})
export class StudentDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly enrollmentSvc = inject(EnrollmentService);
  private readonly courseSvc = inject(CourseService);
  private readonly attendanceSvc = inject(AttendanceService);
  private readonly teacherSvc = inject(TeacherService);
  private readonly studentSvc = inject(StudentService);
  private readonly examGradeSvc = inject(ExamGradeService);

  loading = signal(false);
  studentId = signal<string | null>(null);
  enrollments = signal<EnrollmentDto[]>([]);
  courses = signal<CourseDto[]>([]);
  courseMap = signal<Record<string, CourseDto | undefined>>({});
  teachers = signal<Record<string, TeacherDto | null>>({});
  student = signal<StudentDto | null>(null);
  profilePic = signal<string | null>(null);
  lastEvaluations = signal<ExamGradeDto[]>([]);
  monthlyAttendance = signal<{ month: string; percent: number }[]>([]);
  totalPresent = signal<number>(0);
  totalAbsent = signal<number>(0);
  totalRecords = signal<number>(0);
  // editing enrollment
  editingEnrollmentId = signal<string | null>(null);
  editTeacherId = signal<string | null>(null);
  savingEdit = signal(false);

  // derived signals/helpers
  getFullName() {
    const s = this.student();
    if (!s) return 'Student';
    return [s.firstName, s.middleName, s.lastName].filter(Boolean).join(' ');
  }

  getInitials() {
    const s = this.student();
    const a = (s?.firstName || '').charAt(0) || '';
    const b = (s?.lastName || '').charAt(0) || '';
    return (a + b).toUpperCase();
  }

  private buildCourseMap() {
    const map: Record<string, CourseDto | undefined> = {};
    for (const c of this.courses()) if (c.id) map[c.id] = c;
    this.courseMap.set(map);
  }

  getCourse(courseId?: string) {
    if (!courseId) return null;
    return this.courseMap()[courseId] ?? null;
  }

  getCourseName(courseId?: string) {
    const c = this.getCourse(courseId);
    return (c && (c.nameEn || c.nameAr)) || 'Course';
  }

  getCourseInitial(courseId?: string) {
    const name = this.getCourseName(courseId);
    return name ? name.charAt(0) : '?';
  }

  teacherDisplayName(tid?: string | null) {
    if (!tid) return 'Not assigned';
    const t = this.teachers()[tid];
    if (!t) return '-';
    return `${t.firstName || ''} ${t.lastName || ''}`.trim() || '-';
  }

  strokeDash(percent: number) { return `${percent},100`; }

  strokeColor(percent: number) {
    return percent >= 75 ? '#10b981' : (percent >= 50 ? '#f59e0b' : '#ef4444');
  }

  overallPercent() {
    const months = this.monthlyAttendance();
    if (!months || months.length === 0) return 0;
    // average of monthly percentages
    const avg = Math.round(months.reduce((s, m) => s + (m.percent || 0), 0) / months.length);
    return avg;
  }

  examInitial(ev: any) { return (ev?.examName || 'E').charAt(0); }

  formatDate(d?: string) {
    if (!d) return '-';
    try { return new Date(d).toLocaleDateString(); } catch { return '-'; }
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(pm => {
      const id = pm.get('id');
      this.studentId.set(id);
      if (id) void this.loadDetails(id);
    });
  }

  async loadDetails(studentId: string) {
    this.loading.set(true);
    try {
      // fetch student basic info
      try {
        const sd = await lastValueFrom(this.studentSvc.get(studentId));
        this.student.set(sd);
        const anys = sd as any;
        this.profilePic.set(anys?.extraProperties?.imageUrl || anys?.imageUrl || null);
      } catch {}

      // fetch enrollments (page up to 1000)
      const enrollRes = await lastValueFrom(this.enrollmentSvc.getList({ skipCount: 0, maxResultCount: 1000 } as any));
      const allEnrolls = (enrollRes as any).items ?? [];
      const enrolls = allEnrolls.filter((e: EnrollmentDto) => e.studentId === studentId);
      this.enrollments.set(enrolls);

      // fetch courses and teachers for each enrollment
      const courseIds = Array.from(new Set(enrolls.map(e => e.courseId).filter(Boolean)));
      const coursesArr: CourseDto[] = [];
      const teacherMap: Record<string, TeacherDto | null> = {};
      for (const cid of courseIds) {
        try {
          const c = await lastValueFrom(this.courseSvc.get(cid as string));
          coursesArr.push(c as CourseDto);
        } catch { }
      }
      this.courses.set(coursesArr);
      this.buildCourseMap();

      // for each enrollment, fetch teacher by enrollment.teacherId if present
      for (const e of enrolls) {
        const tid = e.teacherId;
        if (tid && !teacherMap[tid]) {
          try {
            const t = await lastValueFrom(this.teacherSvc.get(tid as string));
            teacherMap[tid] = t as TeacherDto;
          } catch {
            teacherMap[tid] = null;
          }
        }
      }
      this.teachers.set(teacherMap);

      // fetch attendance pages (1000) and filter by enrollmentIds
      const enrollmentIds = enrolls.map(e => e.id).filter(Boolean);
      const pageSize = 1000; let skip = 0; const allAtts: AttendanceDto[] = [];
      while (true) {
        const pageRes = await lastValueFrom(this.attendanceSvc.getList({ skipCount: skip, maxResultCount: pageSize } as any));
        const pageItems = (pageRes as any).items ?? [];
        allAtts.push(...pageItems);
        if (pageItems.length < pageSize) break;
        skip += pageSize;
      }
      const studentAtts = allAtts.filter(a => enrollmentIds.includes(a.enrollmentId || ''));

  // compute overall totals
  const total = studentAtts.length;
  const abs = studentAtts.filter(a => a.isAbsent).length;
  const pres = total - abs;
  this.totalRecords.set(total);
  this.totalAbsent.set(abs);
  this.totalPresent.set(pres);

      // compute last 6 months
      const now = new Date();
      const months: { key: string; label: string; start: Date; end: Date }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const start = new Date(d.getFullYear(), d.getMonth(), 1);
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
        const label = start.toLocaleString(undefined, { month: 'short', year: 'numeric' });
        months.push({ key: `${start.getFullYear()}-${start.getMonth() + 1}`, label, start, end });
      }
      const monthly = months.map(m => {
        const records = studentAtts.filter(a => {
          if (!a.date) return false;
          const dt = new Date(a.date);
          return dt >= m.start && dt < m.end;
        });
        const total = records.length;
        const absents = records.filter(r => r.isAbsent).length;
        const present = total - absents;
        const percent = total === 0 ? 0 : Math.round((present / total) * 100);
        return { month: m.label, percent };
      });
      this.monthlyAttendance.set(monthly);

      // fetch exam grades (page through exam-grade and filter by enrollmentIds)
      const allGrades: ExamGradeDto[] = [];
      let gskip = 0;
      const gpage = 1000;
      while (true) {
        const gres = await lastValueFrom(this.examGradeSvc.getList({ skipCount: gskip, maxResultCount: gpage } as any));
        const gitems = (gres as any).items ?? [];
        allGrades.push(...gitems);
        if (gitems.length < gpage) break;
        gskip += gpage;
      }
      const studentGrades = allGrades.filter(g => enrollmentIds.includes(g.enrollmentId || ''));
      // take most recent 6
      studentGrades.sort((a,b) => (new Date(b.date || '')).getTime() - (new Date(a.date || '')).getTime());
      this.lastEvaluations.set(studentGrades.slice(0,6));
      // reset any editing state
      this.editingEnrollmentId.set(null);
      this.editTeacherId.set(null);
    } catch (err) {
      console.error('Failed to load student detail', err);
      this.enrollments.set([]);
      this.courses.set([]);
      this.teachers.set({});
      this.monthlyAttendance.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  startEdit(enroll: EnrollmentDto) {
    if (!enroll?.id) return;
    this.editingEnrollmentId.set(enroll.id as string);
    this.editTeacherId.set(enroll.teacherId ?? null);
  }

  cancelEdit() {
    this.editingEnrollmentId.set(null);
    this.editTeacherId.set(null);
  }

  async saveEdit() {
    const eid = this.editingEnrollmentId();
    if (!eid) return;
    const enroll = this.enrollments().find(e => e.id === eid);
    if (!enroll) return this.cancelEdit();
    this.savingEdit.set(true);
    try {
      const payload = {
        studentId: enroll.studentId as any,
        courseId: enroll.courseId as any,
        teacherId: this.editTeacherId() as any,
        enrolledAt: enroll.enrolledAt || new Date().toISOString()
      } as any;
      await lastValueFrom(this.enrollmentSvc.update(eid, payload));
      // reload details
      if (this.studentId()) await this.loadDetails(this.studentId() as string);
    } catch (err) {
      console.error('Failed to save enrollment edit', err);
    } finally {
      this.savingEdit.set(false);
      this.cancelEdit();
    }
  }
}
