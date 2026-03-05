import { CommonModule, Location } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { lastValueFrom } from 'rxjs';

import { AttendanceService } from '@proxy/attendances';
import { StudentAttendanceReportDto } from '@proxy/attendances/dtos/models';
import { CurrentUserInfoService } from '@proxy/common';
import { TeacherService } from '@proxy/teachers';

interface CourseOption { id: string; name: string; nameAr: string; }

@Component({
  selector: 'app-teacher-attendance-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './teacher-attendance-report.component.html',
  styleUrls: ['./teacher-attendance-report.component.scss'],
})
export class TeacherAttendanceReportComponent implements OnInit {
  private readonly location           = inject(Location);
  private readonly attendanceSvc      = inject(AttendanceService);
  private readonly teacherSvc         = inject(TeacherService);
  private readonly currentUserInfoSvc = inject(CurrentUserInfoService);

  teacherId      = signal<string | null>(null);
  courses        = signal<CourseOption[]>([]);
  selectedCourseId = signal<string | null>(null);
  selectedMonth  = signal<string>('');
  records        = signal<StudentAttendanceReportDto[]>([]);
  loading        = signal(false);
  coursesLoading = signal(false);
  error          = signal<string | null>(null);

  totalStudents  = computed(() => this.records().length);
  avgRate        = computed(() => {
    const r = this.records();
    return r.length ? Math.round(r.reduce((s, x) => s + x.attendancePercentage, 0) / r.length) : 0;
  });
  atRiskCount    = computed(() => this.records().filter(r => r.attendancePercentage < 75).length);
  excellentCount = computed(() => this.records().filter(r => r.attendancePercentage >= 90).length);

  sortedRecords = computed(() =>
    [...this.records()].sort((a, b) => b.attendancePercentage - a.attendancePercentage)
  );

  async ngOnInit(): Promise<void> {
    const now = new Date();
    this.selectedMonth.set(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
    await this.loadTeacherCourses();
  }

  private async loadTeacherCourses(): Promise<void> {
    this.coursesLoading.set(true);
    try {
      const userInfo = await lastValueFrom(this.currentUserInfoSvc.getCurrentUserActorInfo());
      const id = userInfo?.actorId;
      if (!id) return;
      this.teacherId.set(id);
      const res: any[] = await lastValueFrom(this.teacherSvc.getTeacherCourses(id));
      this.courses.set((res || []).map(c => ({ id: c.id, name: c.name || c.nameEn || '', nameAr: c.nameAr || '' })));
    } catch {
      this.error.set('حدث خطأ أثناء تحميل المقررات');
    } finally {
      this.coursesLoading.set(false);
    }
  }

  async onCourseChange(courseId: string): Promise<void> {
    this.selectedCourseId.set(courseId || null);
    this.records.set([]);
    if (courseId && this.selectedMonth()) await this.loadReport();
  }

  async onMonthChange(): Promise<void> {
    if (this.selectedCourseId() && this.selectedMonth()) await this.loadReport();
  }

  async loadReport(): Promise<void> {
    const courseId = this.selectedCourseId();
    if (!courseId || !this.selectedMonth()) return;

    this.loading.set(true);
    this.error.set(null);
    try {
      const [year, month] = this.selectedMonth().split('-').map(Number);
      const date = new Date(year, month - 1, 1).toISOString();
      const result = await lastValueFrom(
        this.attendanceSvc.getStudentAttendanceReport({
          courseId,
          date,
          skipCount: 0,
          maxResultCount: 500,
        })
      );
      this.records.set(result?.items || []);
    } catch {
      this.error.set('حدث خطأ أثناء تحميل تقرير الحضور');
    } finally {
      this.loading.set(false);
    }
  }

  rateClass(pct: number): string {
    if (pct >= 90) return 'excellent';
    if (pct >= 75) return 'good';
    return 'poor';
  }

  courseName(c: CourseOption): string { return c.nameAr || c.name; }

  goBack(): void { this.location.back(); }
}
