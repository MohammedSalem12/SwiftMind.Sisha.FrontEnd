import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ConfigStateService } from '@abp/ng.core';
import { lastValueFrom } from 'rxjs';

import { ParentService } from '@proxy/parents';
import type { ParentStudentDto } from '@proxy/parents/models';
import { AttendanceService } from '@proxy/attendances';
import type { StudentAttendanceReportDto } from '@proxy/attendances/dtos/models';
import { ExamGradeService } from '@proxy/exam-grades';
import type { ExamGradeDto } from '@proxy/exam-grades/dtos/models';

interface ChildSummary {
  link: ParentStudentDto;
  attendance: StudentAttendanceReportDto[];
  grades: ExamGradeDto[];
  avgAttendance: number;
  lastGrade: ExamGradeDto | null;
}

@Component({
  selector: 'app-parent-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './parent-dashboard.component.html',
  styleUrls: ['./parent-dashboard.component.scss'],
})
export class ParentDashboardComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly configStateService = inject(ConfigStateService);
  private readonly parentService = inject(ParentService);
  private readonly attendanceSvc = inject(AttendanceService);
  private readonly examGradeSvc = inject(ExamGradeService);

  loading = signal(true);
  error = signal<string | null>(null);
  children = signal<ChildSummary[]>([]);

  async ngOnInit(): Promise<void> {
    await this.loadDashboard();
  }

  async loadDashboard(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const currentUserId = this.configStateService.getOne('currentUser')?.id;
      if (!currentUserId) {
        this.error.set('لم يتم التعرف على المستخدم');
        return;
      }

      const parent = await lastValueFrom(this.parentService.getByUserId(currentUserId));
      if (!parent?.id) {
        this.error.set('لم يتم العثور على ملف ولي الأمر');
        return;
      }

      const links = await lastValueFrom(this.parentService.getLinkedStudentsByParentId(parent.id));
      if (!links?.length) {
        this.children.set([]);
        return;
      }

      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

      const summaries = await Promise.all(
        links.map(async (link): Promise<ChildSummary> => {
          const studentId = link.studentId!;
          const [attendanceResult, gradesResult] = await Promise.all([
            lastValueFrom(this.attendanceSvc.getStudentAttendanceReport({
              studentId,
              date: dateStr,
              skipCount: 0,
              maxResultCount: 100,
            })).catch(() => null),
            lastValueFrom(this.examGradeSvc.getLastTwoByStudent(studentId)).catch(() => null),
          ]);

          const attendance = attendanceResult?.items ?? [];
          const gradesList = gradesResult ?? [];

          const avgAttendance = attendance.length
            ? Math.round(attendance.reduce((s, r) => s + r.attendancePercentage, 0) / attendance.length)
            : 100;

          const lastGrade = gradesList[0] ?? null;

          return { link, attendance, grades: gradesList, avgAttendance, lastGrade };
        })
      );

      this.children.set(summaries);
    } catch (err: any) {
      console.error('Error loading parent dashboard:', err);
      this.error.set(err?.error?.error?.message || 'حدث خطأ أثناء تحميل البيانات');
    } finally {
      this.loading.set(false);
    }
  }

  gradePercent(g: ExamGradeDto): number {
    return g.maxGrade > 0 ? Math.round((g.grade / g.maxGrade) * 100) : 0;
  }

  overallAttendance(): number {
    const list = this.children();
    if (!list.length) return 0;
    return Math.round(list.reduce((s, c) => s + c.avgAttendance, 0) / list.length);
  }

  viewChild(studentId?: string): void {
    if (studentId) this.router.navigate(['/parent/child', studentId]);
  }

  goBack(): void {
    this.router.navigate(['/parent']);
  }

  trackByStudentId = (_: number, c: ChildSummary) => c.link.studentId;
}
