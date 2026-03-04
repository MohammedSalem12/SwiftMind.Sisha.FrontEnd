import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { AttendanceService } from '@proxy/attendances';
import { StudentAttendanceReportDto } from '@proxy/attendances/dtos/models';
import { ParentService } from '@proxy/parents';
import { ParentStudentDto } from '@proxy/parents/models';
import { ConfigStateService } from '@abp/ng.core';

@Component({
  selector: 'app-child-attendance',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="child-attendance-container">
      <div class="container py-4">
        <!-- Back Button & Header -->
        <div class="page-header mb-4">
          <button class="btn btn-link p-0 back-btn" (click)="goBack()">
            <i class="fas fa-arrow-right me-2"></i>
            العودة
          </button>
          <h1 class="mt-2">
            <i class="fas fa-calendar-check me-2"></i>
            حضور {{ childName() }}
          </h1>
          <p class="text-muted">{{ childCode() }} - {{ childGrade() }}</p>
        </div>

        <!-- Date Filter -->
        <div class="filter-section mb-4">
          <div class="row align-items-center">
            <div class="col-md-4">
              <label class="form-label">الشهر</label>
              <input type="month" 
                     class="form-control" 
                     [value]="selectedMonth()"
                     (change)="onMonthChange($event)">
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div *ngIf="loading()" class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">جاري التحميل...</span>
          </div>
        </div>

        <!-- Error State -->
        <div *ngIf="error()" class="alert alert-danger">
          <i class="fas fa-exclamation-triangle me-2"></i>
          {{ error() }}
        </div>

        <!-- Attendance Content -->
        <div *ngIf="!loading() && !error()">
          <!-- Summary Cards -->
          <div class="row g-3 mb-4">
            <div class="col-md-3">
              <div class="summary-card bg-total">
                <div class="summary-icon">
                  <i class="fas fa-calendar-alt"></i>
                </div>
                <div class="summary-content">
                  <span class="summary-value">{{ totalDays() }}</span>
                  <span class="summary-label">إجمالي الأيام</span>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="summary-card bg-present">
                <div class="summary-icon">
                  <i class="fas fa-check-circle"></i>
                </div>
                <div class="summary-content">
                  <span class="summary-value">{{ presentDays() }}</span>
                  <span class="summary-label">أيام الحضور</span>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="summary-card bg-absent">
                <div class="summary-icon">
                  <i class="fas fa-times-circle"></i>
                </div>
                <div class="summary-content">
                  <span class="summary-value">{{ absentDays() }}</span>
                  <span class="summary-label">أيام الغياب</span>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="summary-card bg-rate">
                <div class="summary-icon">
                  <i class="fas fa-percentage"></i>
                </div>
                <div class="summary-content">
                  <span class="summary-value">{{ attendanceRate() | number:'1.0-0' }}%</span>
                  <span class="summary-label">نسبة الحضور</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Attendance Progress -->
          <div class="attendance-progress-card mb-4">
            <h5>نسبة الحضور الإجمالية</h5>
            <div class="progress-bar-container">
              <div class="progress" style="height: 24px;">
                <div class="progress-bar" 
                     [class.bg-success]="attendanceRate() >= 90"
                     [class.bg-warning]="attendanceRate() >= 75 && attendanceRate() < 90"
                     [class.bg-danger]="attendanceRate() < 75"
                     [style.width.%]="attendanceRate()">
                  {{ attendanceRate() | number:'1.0-0' }}%
                </div>
              </div>
            </div>
            <div class="progress-labels">
              <span [class.active]="attendanceRate() < 75" class="text-danger">
                <i class="fas fa-exclamation-triangle"></i> ضعيف
              </span>
              <span [class.active]="attendanceRate() >= 75 && attendanceRate() < 90" class="text-warning">
                <i class="fas fa-exclamation-circle"></i> مقبول
              </span>
              <span [class.active]="attendanceRate() >= 90" class="text-success">
                <i class="fas fa-check-circle"></i> ممتاز
              </span>
            </div>
          </div>

          <!-- Empty State -->
          <div *ngIf="attendanceRecords().length === 0" class="empty-state">
            <i class="fas fa-calendar-times"></i>
            <h3>لا توجد سجلات حضور</h3>
            <p>لم يتم تسجيل أي بيانات حضور لهذا الشهر</p>
          </div>

          <!-- Attendance Records Table -->
          <div *ngIf="attendanceRecords().length > 0" class="attendance-table-container">
            <h5 class="mb-3">سجل الحضور حسب المقرر</h5>
            <div class="table-responsive">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>المقرر</th>
                    <th>أيام الشهر</th>
                    <th>الحضور</th>
                    <th>الغياب</th>
                    <th>النسبة</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let record of attendanceRecords()">
                    <td>
                      <div class="course-name">
                        <i class="fas fa-book me-2 text-primary"></i>
                        {{ record.courseNameAr || record.courseNameEn }}
                      </div>
                      <small class="text-muted">{{ record.courseCode }}</small>
                    </td>
                    <td>{{ record.totalDaysInMonth }}</td>
                    <td>
                      <span class="badge bg-success">{{ record.attendedDays }}</span>
                    </td>
                    <td>
                      <span class="badge bg-danger" *ngIf="record.absentDays > 0">{{ record.absentDays }}</span>
                      <span class="badge bg-secondary" *ngIf="record.absentDays === 0">0</span>
                    </td>
                    <td>
                      <div class="progress-mini">
                        <div class="progress" style="height: 8px; width: 60px;">
                          <div class="progress-bar" 
                               [class.bg-success]="record.attendancePercentage >= 90"
                               [class.bg-warning]="record.attendancePercentage >= 75 && record.attendancePercentage < 90"
                               [class.bg-danger]="record.attendancePercentage < 75"
                               [style.width.%]="record.attendancePercentage">
                          </div>
                        </div>
                        <span class="percentage-text">{{ record.attendancePercentage | number:'1.0-0' }}%</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Navigation Tabs -->
        <div class="nav-tabs-container mt-4">
          <div class="btn-group w-100" role="group">
            <button class="btn btn-outline-primary" (click)="navigateTo('grades')">
              <i class="fas fa-chart-line me-1"></i>
              الدرجات
            </button>
            <button class="btn btn-primary active">
              <i class="fas fa-calendar-check me-1"></i>
              الحضور
            </button>
            <button class="btn btn-outline-primary" (click)="navigateTo('courses')">
              <i class="fas fa-book me-1"></i>
              المقررات
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .child-attendance-container {
      min-height: calc(100vh - 200px);
      background: #f8f9fa;
    }

    .page-header h1 {
      font-size: 1.75rem;
      font-weight: 600;
      color: #1a202c;
      margin: 0;
    }

    .back-btn {
      color: #667eea;
      text-decoration: none;
      font-weight: 500;
    }

    .filter-section {
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .summary-card {
      display: flex;
      align-items: center;
      padding: 1.25rem;
      border-radius: 12px;
      color: white;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }

    .summary-card.bg-total {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .summary-card.bg-present {
      background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
    }

    .summary-card.bg-absent {
      background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%);
    }

    .summary-card.bg-rate {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }

    .summary-icon {
      width: 45px;
      height: 45px;
      background: rgba(255,255,255,0.2);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-left: 1rem;
    }

    .summary-icon i {
      font-size: 1.25rem;
    }

    .summary-content {
      display: flex;
      flex-direction: column;
    }

    .summary-value {
      font-size: 1.5rem;
      font-weight: 700;
    }

    .summary-label {
      font-size: 0.75rem;
      opacity: 0.9;
    }

    .attendance-progress-card {
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .attendance-progress-card h5 {
      margin-bottom: 1rem;
      font-weight: 600;
      color: #1a202c;
    }

    .progress-labels {
      display: flex;
      justify-content: space-between;
      margin-top: 1rem;
    }

    .progress-labels span {
      opacity: 0.5;
      font-size: 0.875rem;
    }

    .progress-labels span.active {
      opacity: 1;
      font-weight: 600;
    }

    .attendance-table-container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      padding: 1.5rem;
    }

    .attendance-table-container h5 {
      font-weight: 600;
      color: #1a202c;
    }

    .table {
      margin: 0;
    }

    .table thead {
      background: #f8f9fa;
    }

    .table th {
      border: none;
      padding: 1rem;
      font-weight: 600;
      color: #4a5568;
    }

    .table td {
      padding: 1rem;
      vertical-align: middle;
      border-bottom: 1px solid #e2e8f0;
    }

    .course-name {
      font-weight: 500;
      color: #1a202c;
    }

    .progress-mini {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .percentage-text {
      font-weight: 600;
      font-size: 0.875rem;
      min-width: 40px;
    }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .empty-state i {
      font-size: 4rem;
      color: #cbd5e0;
      margin-bottom: 1rem;
    }

    .empty-state h3 {
      color: #4a5568;
      margin-bottom: 0.5rem;
    }

    .nav-tabs-container {
      background: white;
      padding: 1rem;
      border-radius: 12px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    @media (max-width: 768px) {
      .summary-card {
        margin-bottom: 0.5rem;
      }
    }
  `]
})
export class ChildAttendanceComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly attendanceService = inject(AttendanceService);
  private readonly parentService = inject(ParentService);
  private readonly configStateService = inject(ConfigStateService);

  studentId = signal<string>('');
  childName = signal<string>('');
  childCode = signal<string>('');
  childGrade = signal<string>('');
  selectedMonth = signal<string>('');
  attendanceRecords = signal<StudentAttendanceReportDto[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Summary values
  totalDays = signal(0);
  presentDays = signal(0);
  absentDays = signal(0);
  attendanceRate = signal(0);

  async ngOnInit(): Promise<void> {
    const studentIdParam = this.route.snapshot.paramMap.get('studentId');
    if (!studentIdParam) {
      this.error.set('معرف الطالب غير صحيح');
      return;
    }
    this.studentId.set(studentIdParam);
    
    // Set default month to current month
    const now = new Date();
    this.selectedMonth.set(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
    
    await this.loadChildInfo();
    await this.loadAttendance();
  }

  private async loadChildInfo(): Promise<void> {
    try {
      const currentUserId = this.configStateService.getOne('currentUser')?.id;
      if (!currentUserId) return;

      const parent = await lastValueFrom(this.parentService.getByUserId(currentUserId));
      if (parent) {
        const children = await lastValueFrom(this.parentService.getLinkedStudentsByParentId(parent.id!));
        const child = children.find((c: ParentStudentDto) => c.studentId === this.studentId());
        if (child) {
          this.childName.set(child.studentName || '');
          this.childCode.set(child.studentCode || '');
          this.childGrade.set(child.gradeName || '');
        }
      }
    } catch (err) {
      console.error('Error loading child info:', err);
    }
  }

  private async loadAttendance(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      // Parse the selected month
      const [year, month] = this.selectedMonth().split('-').map(Number);
      const date = new Date(year, month - 1, 1).toISOString();

      const result = await lastValueFrom(
        this.attendanceService.getStudentAttendanceReport({
          studentId: this.studentId(),
          date: date,
          skipCount: 0,
          maxResultCount: 100
        })
      );
      
      const items = result.items || [];
      this.attendanceRecords.set(items);
      this.calculateSummary(items);
    } catch (err: any) {
      console.error('Error loading attendance:', err);
      this.error.set('حدث خطأ أثناء تحميل سجل الحضور');
    } finally {
      this.loading.set(false);
    }
  }

  private calculateSummary(records: StudentAttendanceReportDto[]): void {
    if (records.length === 0) {
      this.totalDays.set(0);
      this.presentDays.set(0);
      this.absentDays.set(0);
      this.attendanceRate.set(100);
      return;
    }

    const totals = records.reduce((acc, r) => ({
      totalDays: acc.totalDays + r.totalDaysInMonth,
      attended: acc.attended + r.attendedDays,
      absent: acc.absent + r.absentDays
    }), { totalDays: 0, attended: 0, absent: 0 });

    this.totalDays.set(totals.totalDays);
    this.presentDays.set(totals.attended);
    this.absentDays.set(totals.absent);
    
    const rate = totals.totalDays > 0 
      ? (totals.attended / totals.totalDays) * 100 
      : 100;
    this.attendanceRate.set(rate);
  }

  onMonthChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedMonth.set(input.value);
    this.loadAttendance();
  }

  navigateTo(tab: string): void {
    this.router.navigate(['..', tab], { relativeTo: this.route });
  }

  goBack(): void {
    this.router.navigate(['/parent']);
  }
}
