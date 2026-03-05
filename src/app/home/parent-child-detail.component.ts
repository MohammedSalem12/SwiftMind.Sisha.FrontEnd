import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { StudentService } from '@proxy/students';
import type { StudentDto } from '@proxy/students/models';
import { AttendanceService } from '@proxy/attendances';
import type { StudentAttendanceReportDto } from '@proxy/attendances/dtos/models';
import { ExamGradeService } from '@proxy/exam-grades';
import type { ExamGradeDto } from '@proxy/exam-grades/dtos/models';

@Component({
  selector: 'app-parent-child-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="child-detail">
      <div class="container py-4">
        <!-- Back Button -->
        <button class="btn btn-link mb-3 p-0" (click)="goBack()">
          <i class="fas fa-arrow-right me-1"></i> العودة للرئيسية
        </button>

        <!-- Loading -->
        <div *ngIf="loading()" class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">جاري التحميل...</span>
          </div>
        </div>

        <div *ngIf="!loading() && student()">
          <!-- Student Header -->
          <div class="student-header mb-4">
            <div class="d-flex align-items-center gap-3">
              <div class="avatar"><i class="fas fa-user-graduate"></i></div>
              <div>
                <h1 class="mb-1">{{ getStudentName() }}</h1>
                <div class="d-flex gap-3 flex-wrap">
                  <span class="badge bg-light text-dark"><i class="fas fa-id-card me-1"></i>{{ student()!.studentCode }}</span>
                  <span *ngIf="student()!.currentGrade" class="badge bg-light text-dark"><i class="fas fa-graduation-cap me-1"></i>الصف {{ student()!.currentGrade }}</span>
                  <span *ngIf="student()!.schoolName" class="badge bg-light text-dark"><i class="fas fa-school me-1"></i>{{ student()!.schoolName }}</span>
                </div>
                <div class="mt-2">
                  <button class="btn btn-success btn-sm" (click)="enrollInCourse()">
                    <i class="fas fa-plus-circle me-1"></i> تسجيل في مقرر
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Tabs -->
          <div class="tabs mb-4">
            <button class="tab-btn" [class.active]="activeTab() === 'attendance'" (click)="activeTab.set('attendance')">
              <i class="fas fa-clipboard-check me-1"></i> الحضور
            </button>
            <button class="tab-btn" [class.active]="activeTab() === 'grades'" (click)="activeTab.set('grades')">
              <i class="fas fa-chart-bar me-1"></i> الدرجات
            </button>
          </div>

          <!-- Attendance Tab -->
          <div *ngIf="activeTab() === 'attendance'">
            <div *ngIf="attendanceLoading()" class="text-center py-4">
              <div class="spinner-border spinner-border-sm text-primary"></div>
            </div>
            <div *ngIf="!attendanceLoading()">
              <div *ngIf="attendanceReports().length === 0" class="alert alert-info">
                <i class="fas fa-info-circle me-2"></i>لا توجد بيانات حضور متاحة
              </div>
              
              <!-- Overall Attendance Summary -->
              <div class="attendance-summary mb-4" *ngIf="attendanceReports().length > 0">
                <div class="summary-card">
                  <div class="summary-header">
                    <h4 class="mb-0">
                      <i class="fas fa-calendar-check me-2 text-success"></i>
                      ملخص الحضور الإجمالي
                    </h4>
                  </div>
                  <div class="summary-body">
                    <div class="row text-center">
                      <div class="col-4">
                        <div class="summary-stat">
                          <div class="stat-number text-success">{{ getTotalAttendedDays() }}</div>
                          <div class="stat-label">جلسات حضرها</div>
                        </div>
                      </div>
                      <div class="col-4">
                        <div class="summary-stat">
                          <div class="stat-number text-danger">{{ getTotalAbsentDays() }}</div>
                          <div class="stat-label">جلسات غاب عنها</div>
                        </div>
                      </div>
                      <div class="col-4">
                        <div class="summary-stat">
                          <div class="stat-number text-primary">{{ getTotalSessions() }}</div>
                          <div class="stat-label">إجمالي الجلسات</div>
                        </div>
                      </div>
                    </div>
                    <div class="mt-3">
                      <div class="alert alert-success mb-0" *ngIf="getTotalAbsentDays() === 0">
                        <i class="fas fa-check-circle me-2"></i>
                        <strong>ممتاز!</strong> الطالب حضر جميع الجلسات الدراسية
                      </div>
                      <div class="alert alert-warning mb-0" *ngIf="getTotalAbsentDays() > 0 && getTotalAbsentDays() <= 3">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        <strong>تنبيه:</strong> الطالب غاب عن {{ getTotalAbsentDays() }} جلسات فقط
                      </div>
                      <div class="alert alert-danger mb-0" *ngIf="getTotalAbsentDays() > 3">
                        <i class="fas fa-times-circle me-2"></i>
                        <strong>ملاحظة:</strong> الطالب غاب عن {{ getTotalAbsentDays() }} جلسات
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Absent Sessions List (only if there are absences) -->
              <div *ngIf="getTotalAbsentDays() > 0" class="absent-sessions mb-4">
                <h5 class="mb-3">
                  <i class="fas fa-list-ul me-2 text-danger"></i>
                  الجلسات التي غاب عنها الطالب
                </h5>
                <div class="row g-3">
                  <div class="col-md-6 col-lg-4" *ngFor="let report of getAbsentReports()">
                    <div class="absent-card">
                      <div class="absent-header">
                        <h6 class="mb-0">{{ report.courseNameAr || report.courseNameEn }}</h6>
                        <span class="badge bg-danger">{{ report.absentDays }} غياب</span>
                      </div>
                      <div class="absent-body">
                        <div class="d-flex justify-content-between text-muted small">
                          <span><i class="fas fa-times text-danger me-1"></i>غياب: {{ report.absentDays }}</span>
                          <span><i class="fas fa-check text-success me-1"></i>حضور: {{ report.attendedDays }}</span>
                          <span><i class="fas fa-calendar me-1"></i>الإجمالي: {{ report.totalDaysInMonth }}</span>
                        </div>
                        <div class="progress mt-2" style="height:6px">
                          <div class="progress-bar bg-danger" [style.width.%]="(report.absentDays / report.totalDaysInMonth) * 100"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Course-wise Attendance Details -->
              <div class="course-attendance">
                <h5 class="mb-3">
                  <i class="fas fa-chart-bar me-2 text-primary"></i>
                  تفاصيل الحضور حسب المقرر
                </h5>
                <div class="row g-3">
                  <div class="col-md-6 col-lg-4" *ngFor="let report of attendanceReports()">
                    <div class="report-card">
                      <div class="report-header">
                        <h6 class="mb-0">{{ report.courseNameAr || report.courseNameEn }}</h6>
                        <span class="badge" [class.bg-success]="report.attendancePercentage >= 90"
                              [class.bg-warning]="report.attendancePercentage >= 75 && report.attendancePercentage < 90"
                              [class.bg-danger]="report.attendancePercentage < 75">
                          {{ report.attendancePercentage | number:'1.0-0' }}%
                        </span>
                      </div>
                      <div class="report-body">
                        <div class="progress mb-2" style="height:8px">
                          <div class="progress-bar" [class.bg-success]="report.attendancePercentage >= 90"
                               [class.bg-warning]="report.attendancePercentage >= 75 && report.attendancePercentage < 90"
                               [class.bg-danger]="report.attendancePercentage < 75"
                               [style.width.%]="report.attendancePercentage"></div>
                        </div>
                        <div class="d-flex justify-content-between text-muted small">
                          <span><i class="fas fa-check text-success me-1"></i>حضور: {{ report.attendedDays }}</span>
                          <span><i class="fas fa-times text-danger me-1"></i>غياب: {{ report.absentDays }}</span>
                          <span><i class="fas fa-calendar me-1"></i>الإجمالي: {{ report.totalDaysInMonth }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Grades Tab -->
          <div *ngIf="activeTab() === 'grades'">
            <div *ngIf="gradesLoading()" class="text-center py-4">
              <div class="spinner-border spinner-border-sm text-primary"></div>
            </div>
            <div *ngIf="!gradesLoading()">
              <div *ngIf="grades().length === 0" class="alert alert-info">
                <i class="fas fa-info-circle me-2"></i>لا توجد درجات متاحة
              </div>
              <div class="table-responsive" *ngIf="grades().length > 0">
                <table class="table table-hover">
                  <thead>
                    <tr>
                      <th>الاختبار</th>
                      <th>المقرر</th>
                      <th>التاريخ</th>
                      <th>الدرجة</th>
                      <th>النسبة</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let grade of grades()">
                      <td>{{ grade.examName || '-' }}</td>
                      <td>{{ grade.courseName || '-' }}</td>
                      <td>{{ grade.date | date:'shortDate' }}</td>
                      <td>{{ grade.grade }} / {{ grade.maxGrade }}</td>
                      <td>
                        <span class="badge" [class.bg-success]="getPercentage(grade) >= 90"
                              [class.bg-info]="getPercentage(grade) >= 75 && getPercentage(grade) < 90"
                              [class.bg-warning]="getPercentage(grade) >= 60 && getPercentage(grade) < 75"
                              [class.bg-danger]="getPercentage(grade) < 60">
                          {{ getPercentage(grade) | number:'1.0-0' }}%
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- Not Found -->
        <div *ngIf="!loading() && !student()" class="alert alert-warning">
          <i class="fas fa-exclamation-triangle me-2"></i>لم يتم العثور على بيانات الطالب
        </div>
      </div>
    </div>
  `,
  styles: [`
    .child-detail { min-height: calc(100vh - 200px); background: #f8f9fa; }
    .student-header { padding: 1.5rem; background: white; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .student-header h1 { font-size: 1.5rem; font-weight: 600; color: #1a202c; }
    .avatar { width: 64px; height: 64px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
    .avatar i { font-size: 1.5rem; color: white; }
    .tabs { display: flex; gap: 0.5rem; border-bottom: 2px solid #e5e7eb; padding-bottom: 0; }
    .tab-btn { background: none; border: none; padding: 0.75rem 1.5rem; font-weight: 500; color: #6b7280; border-bottom: 3px solid transparent; margin-bottom: -2px; cursor: pointer; transition: all 0.2s; }
    .tab-btn.active { color: #667eea; border-bottom-color: #667eea; }
    .tab-btn:hover { color: #667eea; }
    .report-card { background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .report-header { padding: 1rem 1.25rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f0f0f0; }
    .report-header h5, .report-header h6 { font-weight: 600; color: #1a202c; }
    .report-body { padding: 1rem 1.25rem; }
    
    /* New Attendance Summary Styles */
    .attendance-summary .summary-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .summary-header {
      padding: 1.25rem;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
    }
    .summary-header h4 {
      font-size: 1.1rem;
      font-weight: 600;
    }
    .summary-body {
      padding: 1.5rem;
    }
    .summary-stat {
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
      margin-bottom: 0.5rem;
    }
    .stat-number {
      font-size: 1.8rem;
      font-weight: 700;
      margin-bottom: 0.25rem;
    }
    .stat-label {
      font-size: 0.85rem;
      color: #6b7280;
      font-weight: 500;
    }
    
    /* Absent Sessions Styles */
    .absent-sessions .absent-card {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 10px;
      overflow: hidden;
    }
    .absent-header {
      padding: 0.75rem 1rem;
      background: #fee2e2;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .absent-header h6 {
      font-size: 0.9rem;
      font-weight: 600;
      color: #991b1b;
      margin: 0;
    }
    .absent-body {
      padding: 0.75rem 1rem;
    }
    
    .table th { font-weight: 600; color: #6b7280; font-size: 0.875rem; border-bottom: 2px solid #e5e7eb; }
    .table td { vertical-align: middle; }
    @media (max-width: 768px) { 
      .student-header h1 { font-size: 1.25rem; } 
      .tabs { overflow-x: auto; }
      .summary-stat { margin-bottom: 1rem; }
    }
  `],
})
export class ParentChildDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly studentService = inject(StudentService);
  private readonly attendanceService = inject(AttendanceService);
  private readonly examGradeService = inject(ExamGradeService);

  student = signal<StudentDto | null>(null);
  attendanceReports = signal<StudentAttendanceReportDto[]>([]);
  grades = signal<ExamGradeDto[]>([]);
  loading = signal(false);
  attendanceLoading = signal(false);
  gradesLoading = signal(false);
  activeTab = signal<'attendance' | 'grades'>('attendance');

  private studentId = '';

  async ngOnInit(): Promise<void> {
    this.studentId = this.route.snapshot.paramMap.get('studentId') || '';
    if (!this.studentId) {
      this.router.navigate(['/parent']);
      return;
    }
    this.loading.set(true);
    try {
      const student = await lastValueFrom(this.studentService.get(this.studentId));
      this.student.set(student);
    } catch (error) {
      console.error('Error loading student:', error);
    } finally {
      this.loading.set(false);
    }
    // Load data in parallel
    await Promise.all([this.loadAttendance(), this.loadGrades()]);
  }

  private async loadAttendance(): Promise<void> {
    this.attendanceLoading.set(true);
    try {
      const result = await lastValueFrom(
        this.attendanceService.getStudentAttendanceReport({
          studentId: this.studentId,
          skipCount: 0,
          maxResultCount: 100,
        })
      );
      this.attendanceReports.set(result.items || []);
    } catch (error) {
      console.error('Error loading attendance:', error);
    } finally {
      this.attendanceLoading.set(false);
    }
  }

  private async loadGrades(): Promise<void> {
    this.gradesLoading.set(true);
    try {
      const result = await lastValueFrom(
        this.examGradeService.getGradesByStudent(this.studentId, {
          skipCount: 0,
          maxResultCount: 100,
        })
      );
      this.grades.set(result.items || []);
    } catch (error) {
      console.error('Error loading grades:', error);
    } finally {
      this.gradesLoading.set(false);
    }
  }

  getStudentName(): string {
    const s = this.student();
    if (!s) return '';
    return [s.firstName, s.middleName, s.lastName].filter(Boolean).join(' ');
  }

  getPercentage(grade: ExamGradeDto): number {
    if (!grade.maxGrade || grade.maxGrade === 0) return 0;
    return (grade.grade / grade.maxGrade) * 100;
  }

  getTotalAttendedDays(): number {
    return this.attendanceReports().reduce((total, report) => total + (report.attendedDays || 0), 0);
  }

  getTotalAbsentDays(): number {
    return this.attendanceReports().reduce((total, report) => total + (report.absentDays || 0), 0);
  }

  getTotalSessions(): number {
    return this.attendanceReports().reduce((total, report) => total + (report.totalDaysInMonth || 0), 0);
  }

  getAbsentReports(): StudentAttendanceReportDto[] {
    return this.attendanceReports().filter(report => (report.absentDays || 0) > 0);
  }

  enrollInCourse(): void {
    this.router.navigate(['/parent/enroll-child', this.studentId]);
  }

  goBack(): void {
    this.router.navigate(['/parent']);
  }
}
