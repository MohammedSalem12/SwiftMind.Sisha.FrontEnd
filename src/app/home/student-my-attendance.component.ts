import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { StudentService } from '@proxy/students';
import { AttendanceService } from '@proxy/attendances';
import type { StudentAttendanceReportDto } from '@proxy/attendances/dtos/models';
import { CurrentUserInfoService } from '@proxy/common';

@Component({
  selector: 'app-student-my-attendance',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="my-attendance">
      <div class="container py-4">
        <button class="btn btn-link mb-3 p-0" (click)="goBack()">
          <i class="fas fa-arrow-right me-1"></i> العودة للرئيسية
        </button>

        <h2 class="mb-4"><i class="fas fa-clipboard-check me-2"></i>سجل الحضور</h2>

        <div *ngIf="loading()" class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">جاري التحميل...</span>
          </div>
        </div>

        <div *ngIf="!loading()">
          <div *ngIf="reports().length === 0" class="alert alert-info">
            <i class="fas fa-info-circle me-2"></i>لا توجد بيانات حضور متاحة
          </div>

          <!-- Overall Stats -->
          <div *ngIf="reports().length > 0" class="stats-row mb-4">
            <div class="stat-card">
              <div class="stat-value text-success">{{ getOverallAttendance() | number:'1.0-0' }}%</div>
              <div class="stat-label">نسبة الحضور الكلية</div>
            </div>
            <div class="stat-card">
              <div class="stat-value text-primary">{{ getTotalPresent() }}</div>
              <div class="stat-label">أيام الحضور</div>
            </div>
            <div class="stat-card">
              <div class="stat-value text-danger">{{ getTotalAbsent() }}</div>
              <div class="stat-label">أيام الغياب</div>
            </div>
          </div>

          <!-- Per-Course Reports -->
          <div class="row g-3">
            <div class="col-md-6 col-lg-4" *ngFor="let report of reports()">
              <div class="report-card">
                <div class="report-header">
                  <h5 class="mb-0">{{ report.courseNameAr || report.courseNameEn }}</h5>
                  <span class="badge" [class.bg-success]="report.attendancePercentage >= 90"
                        [class.bg-warning]="report.attendancePercentage >= 75 && report.attendancePercentage < 90"
                        [class.bg-danger]="report.attendancePercentage < 75">
                    {{ report.attendancePercentage | number:'1.0-0' }}%
                  </span>
                </div>
                <div class="report-body">
                  <div class="progress mb-3" style="height:10px">
                    <div class="progress-bar" role="progressbar"
                         [class.bg-success]="report.attendancePercentage >= 90"
                         [class.bg-warning]="report.attendancePercentage >= 75 && report.attendancePercentage < 90"
                         [class.bg-danger]="report.attendancePercentage < 75"
                         [style.width.%]="report.attendancePercentage"></div>
                  </div>
                  <div class="d-flex justify-content-between text-muted small">
                    <span><i class="fas fa-check text-success me-1"></i>حضور: {{ report.attendedDays }}</span>
                    <span><i class="fas fa-times text-danger me-1"></i>غياب: {{ report.absentDays }}</span>
                    <span><i class="fas fa-calendar me-1"></i>الإجمالي: {{ report.totalDaysInMonth }}</span>
                  </div>
                  <div *ngIf="report.courseCode" class="mt-2">
                    <small class="text-muted"><i class="fas fa-code me-1"></i>{{ report.courseCode }}</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .my-attendance { min-height: calc(100vh - 200px); background: #f8f9fa; }
    h2 { font-weight: 600; color: #1a202c; }
    .stats-row { display: flex; gap: 1rem; flex-wrap: wrap; }
    .stat-card { flex: 1; min-width: 150px; background: white; border-radius: 10px; padding: 1.25rem; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .stat-value { font-size: 2rem; font-weight: 700; }
    .stat-label { font-size: 0.875rem; color: #6b7280; margin-top: 0.25rem; }
    .report-card { background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); height: 100%; }
    .report-header { padding: 1rem 1.25rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f0f0f0; }
    .report-header h5 { font-size: 0.95rem; font-weight: 600; color: #1a202c; }
    .report-body { padding: 1rem 1.25rem; }
  `],
})
export class StudentMyAttendanceComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly attendanceService = inject(AttendanceService);
  private readonly currentUserInfoService = inject(CurrentUserInfoService);

  reports = signal<StudentAttendanceReportDto[]>([]);
  loading = signal(false);

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    try {
      const userInfo = await lastValueFrom(this.currentUserInfoService.getCurrentUserActorInfo());
      const studentId = userInfo?.actorId;
      if (!studentId) return;

      const result = await lastValueFrom(
        this.attendanceService.getStudentAttendanceReport({
          studentId,
          skipCount: 0,
          maxResultCount: 100,
        })
      );
      this.reports.set(result.items || []);
    } catch (error) {
      console.error('Error loading attendance:', error);
    } finally {
      this.loading.set(false);
    }
  }

  getOverallAttendance(): number {
    const r = this.reports();
    if (r.length === 0) return 0;
    const totalPresent = r.reduce((sum, x) => sum + x.attendedDays, 0);
    const totalDays = r.reduce((sum, x) => sum + x.totalDaysInMonth, 0);
    return totalDays > 0 ? (totalPresent / totalDays) * 100 : 0;
  }

  getTotalPresent(): number {
    return this.reports().reduce((sum, x) => sum + x.attendedDays, 0);
  }

  getTotalAbsent(): number {
    return this.reports().reduce((sum, x) => sum + x.absentDays, 0);
  }

  goBack(): void {
    this.router.navigate(['/student']);
  }
}
