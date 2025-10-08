import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListService, PagedResultDto } from '@abp/ng.core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import type { StudentDto } from '@proxy/students';
import { StudentService } from '@proxy/students';
import { StudentEnrollmentService as EnrollmentService } from '@proxy/student-enrollments';
import { CourseService } from '@proxy/courses';
import { AttendanceService } from '@proxy/attendances';
import type { EnrollmentDto } from '@proxy/student-enrollments/dtos/models';
import type { CourseDto } from '@proxy/courses/dtos/models';
import type { AttendanceDto } from '@proxy/attendances/dtos/models';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './students.component.html',
  styleUrls: ['./students.component.scss'],
  providers: [ListService],
})
export class StudentsComponent implements OnInit {
  readonly list = inject(ListService);
  private readonly studentsSvc = inject(StudentService);
  private readonly router = inject(Router);
  private readonly enrollmentSvc = inject(EnrollmentService);
  private readonly courseSvc = inject(CourseService);
  private readonly attendanceSvc = inject(AttendanceService);

  filter = signal<string>('');
  // expose Math for template
  readonly Math = Math;

  students = signal<StudentDto[]>([]);
  totalCount = signal(0);
  loading = signal(false);

  // selected student for details view
  selected = signal<StudentDto | null>(null);

  // details data
  enrolledCourses = signal<CourseDto[]>([]);
  monthlyAttendance = signal<{ month: string; percent: number }[]>([]);

  // pagination
  page = signal(1);
  pageSize = signal(10);

  ngOnInit(): void {
    this.hookList();
  }

  hookList(): void {
    this.list.hookToQuery((query) => {
      this.loading.set(true);
      const req = {
        skipCount: (this.page() - 1) * this.pageSize(),
        maxResultCount: this.pageSize(),
        sorting: query.sort ?? 'creationTime desc',
      } as any;

      return this.studentsSvc.getList(req).pipe();
    }).subscribe({
      next: (res: PagedResultDto<StudentDto>) => {
        this.students.set(res.items ?? []);
        this.totalCount.set(res.totalCount ?? 0);
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.loading.set(false);
      },
    });
  }

  onPageChange(p: number) {
    if (p < 1) return;
    this.page.set(p);
    this.list.get();
  }

  onPageSizeChange(size: number) {
    this.pageSize.set(size);
    this.page.set(1);
    this.list.get();
  }

  onFilter(value: string) {
    this.filter.set(value);
    this.page.set(1);
    this.list.get();
  }

  goToAddStudent() {
    this.router.navigate(['/add-student']);
  }

  goToEnroll(id: any) {
    this.router.navigate(['/enroll', id]);
  }

  showDetails(s: StudentDto) {
    // navigate to dedicated student details page
    this.router.navigate(['/students', s.id]);
  }

  closeDetails() {
    this.selected.set(null);
    this.enrolledCourses.set([]);
    this.monthlyAttendance.set([]);
  }

  private async loadDetailsForStudent(studentId?: string) {
    if (!studentId) return;

    try {
      // Fetch enrollments for this student (fetch all and filter client-side)
      const enrollRes = await lastValueFrom(this.enrollmentSvc.getList({ skipCount: 0, maxResultCount: 1000 } as any));
      const enrolls = (enrollRes as PagedResultDto<EnrollmentDto>).items?.filter(e => e.studentId === studentId) ?? [];

      // Fetch courses for those enrollments
      const courseIds = Array.from(new Set(enrolls.map(e => e.courseId).filter(Boolean)));
      const courses: CourseDto[] = [];
      for (const cid of courseIds) {
        try {
          const c = await lastValueFrom(this.courseSvc.get(cid as string));
          courses.push(c as CourseDto);
        } catch {
          // ignore missing course
        }
      }
      this.enrolledCourses.set(courses);

      // Fetch attendance records for these enrollments and compute monthly percentages
      const enrollmentIds = enrolls.map(e => e.id).filter(Boolean);

      // The server limits MaxResultCount to 1000; page through results to collect all attendances
      const pageSize = 1000;
      let skip = 0;
      const allAtts: AttendanceDto[] = [];
      while (true) {
        const pageRes = await lastValueFrom(this.attendanceSvc.getList({ skipCount: skip, maxResultCount: pageSize } as any));
        const pageItems = (pageRes as PagedResultDto<AttendanceDto>).items ?? [];
        allAtts.push(...pageItems);
        if (pageItems.length < pageSize) break; // no more pages
        skip += pageSize;
      }

      const studentAtts = allAtts.filter(a => enrollmentIds.includes(a.enrollmentId || ''));

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
    } catch (err) {
      console.error('Failed to load student details', err);
      this.enrolledCourses.set([]);
      this.monthlyAttendance.set([]);
    }
  }

  // helper to get avatar URL from extra properties (if available) or return null
  getAvatarUrl(s: StudentDto | null) {
    try {
      const anys = s as any;
      return anys?.extraProperties?.imageUrl || anys?.imageUrl || null;
    } catch {
      return null;
    }
  }

  trackById = (_: number, item: StudentDto) => item.id;
}
