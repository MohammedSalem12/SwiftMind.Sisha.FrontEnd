import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { ExamGradeService } from '@proxy/exam-grades';
import { ExamGradeDto } from '@proxy/exam-grades/dtos/models';
import { ParentService } from '@proxy/parents';
import { ParentStudentDto } from '@proxy/parents/models';
import { ConfigStateService } from '@abp/ng.core';

@Component({
  selector: 'app-child-grades',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="child-grades-container">
      <div class="container py-4">
        <!-- Back Button & Header -->
        <div class="page-header mb-4">
          <button class="btn btn-link p-0 back-btn" (click)="goBack()">
            <i class="fas fa-arrow-right me-2"></i>
            العودة
          </button>
          <h1 class="mt-2">
            <i class="fas fa-chart-line me-2"></i>
            درجات {{ childName() }}
          </h1>
          <p class="text-muted">{{ childCode() }} - {{ childGrade() }}</p>
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

        <!-- Grades Content -->
        <div *ngIf="!loading() && !error()">
          <!-- Summary Cards -->
          <div class="row g-3 mb-4">
            <div class="col-md-4">
              <div class="summary-card bg-primary">
                <div class="summary-icon">
                  <i class="fas fa-clipboard-list"></i>
                </div>
                <div class="summary-content">
                  <span class="summary-value">{{ totalExams() }}</span>
                  <span class="summary-label">عدد الاختبارات</span>
                </div>
              </div>
            </div>
            <div class="col-md-4">
              <div class="summary-card bg-success">
                <div class="summary-icon">
                  <i class="fas fa-percentage"></i>
                </div>
                <div class="summary-content">
                  <span class="summary-value">{{ averageGrade() | number:'1.1-1' }}%</span>
                  <span class="summary-label">المعدل العام</span>
                </div>
              </div>
            </div>
            <div class="col-md-4">
              <div class="summary-card bg-info">
                <div class="summary-icon">
                  <i class="fas fa-trophy"></i>
                </div>
                <div class="summary-content">
                  <span class="summary-value">{{ highestGrade() | number:'1.1-1' }}%</span>
                  <span class="summary-label">أعلى درجة</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div *ngIf="grades().length === 0" class="empty-state">
            <i class="fas fa-clipboard-check"></i>
            <h3>لا توجد درجات</h3>
            <p>لم يتم تسجيل أي درجات لهذا الطالب حتى الآن</p>
          </div>

          <!-- Grades Table -->
          <div *ngIf="grades().length > 0" class="grades-table-container">
            <div class="table-responsive">
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
                    <td>
                      <div class="exam-name">
                        <i class="fas fa-file-alt me-2 text-primary"></i>
                        {{ grade.examName || 'اختبار' }}
                      </div>
                      <small class="text-muted">{{ grade.examCode }}</small>
                    </td>
                    <td>{{ grade.courseName }}</td>
                    <td>{{ grade.date | date:'shortDate' }}</td>
                    <td>
                      <span class="grade-badge">
                        {{ grade.grade }} / {{ grade.maxGrade }}
                      </span>
                    </td>
                    <td>
                      <div class="progress-container">
                        <div class="progress" style="height: 8px; width: 80px;">
                          <div class="progress-bar" 
                               [class.bg-success]="getPercentage(grade) >= 75"
                               [class.bg-warning]="getPercentage(grade) >= 50 && getPercentage(grade) < 75"
                               [class.bg-danger]="getPercentage(grade) < 50"
                               [style.width.%]="getPercentage(grade)">
                          </div>
                        </div>
                        <span class="percentage-text" 
                              [class.text-success]="getPercentage(grade) >= 75"
                              [class.text-warning]="getPercentage(grade) >= 50 && getPercentage(grade) < 75"
                              [class.text-danger]="getPercentage(grade) < 50">
                          {{ getPercentage(grade) | number:'1.0-0' }}%
                        </span>
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
            <button class="btn btn-primary active">
              <i class="fas fa-chart-line me-1"></i>
              الدرجات
            </button>
            <button class="btn btn-outline-primary" (click)="navigateTo('attendance')">
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
    .child-grades-container {
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

    .back-btn:hover {
      color: #5558d3;
    }

    .summary-card {
      display: flex;
      align-items: center;
      padding: 1.5rem;
      border-radius: 12px;
      color: white;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }

    .summary-card.bg-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .summary-card.bg-success {
      background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
    }

    .summary-card.bg-info {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }

    .summary-icon {
      width: 50px;
      height: 50px;
      background: rgba(255,255,255,0.2);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-left: 1rem;
    }

    .summary-icon i {
      font-size: 1.5rem;
    }

    .summary-content {
      display: flex;
      flex-direction: column;
    }

    .summary-value {
      font-size: 1.75rem;
      font-weight: 700;
    }

    .summary-label {
      font-size: 0.875rem;
      opacity: 0.9;
    }

    .grades-table-container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      overflow: hidden;
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

    .exam-name {
      font-weight: 500;
      color: #1a202c;
    }

    .grade-badge {
      background: #e2e8f0;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-weight: 600;
    }

    .progress-container {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .percentage-text {
      font-weight: 600;
      min-width: 45px;
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

    .empty-state p {
      color: #718096;
    }

    .nav-tabs-container {
      background: white;
      padding: 1rem;
      border-radius: 12px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    @media (max-width: 768px) {
      .summary-card {
        margin-bottom: 1rem;
      }
    }
  `]
})
export class ChildGradesComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly examGradeService = inject(ExamGradeService);
  private readonly parentService = inject(ParentService);
  private readonly configStateService = inject(ConfigStateService);

  studentId = signal<string>('');
  childName = signal<string>('');
  childCode = signal<string>('');
  childGrade = signal<string>('');
  grades = signal<ExamGradeDto[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Computed values
  totalExams = signal(0);
  averageGrade = signal(0);
  highestGrade = signal(0);

  async ngOnInit(): Promise<void> {
    const studentIdParam = this.route.snapshot.paramMap.get('studentId');
    if (!studentIdParam) {
      this.error.set('معرف الطالب غير صحيح');
      return;
    }
    this.studentId.set(studentIdParam);
    await this.loadChildInfo();
    await this.loadGrades();
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

  private async loadGrades(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const result = await lastValueFrom(
        this.examGradeService.getGradesByStudent(this.studentId(), {
          skipCount: 0,
          maxResultCount: 100
        })
      );
      const items = result.items || [];
      this.grades.set(items);
      this.calculateSummary(items);
    } catch (err: any) {
      console.error('Error loading grades:', err);
      this.error.set('حدث خطأ أثناء تحميل الدرجات');
    } finally {
      this.loading.set(false);
    }
  }

  private calculateSummary(grades: ExamGradeDto[]): void {
    this.totalExams.set(grades.length);

    if (grades.length === 0) {
      this.averageGrade.set(0);
      this.highestGrade.set(0);
      return;
    }

    const percentages = grades.map(g => this.getPercentage(g));
    const average = percentages.reduce((sum, p) => sum + p, 0) / percentages.length;
    const highest = Math.max(...percentages);

    this.averageGrade.set(average);
    this.highestGrade.set(highest);
  }

  getPercentage(grade: ExamGradeDto): number {
    if (!grade.maxGrade || grade.maxGrade === 0) return 0;
    return (grade.grade / grade.maxGrade) * 100;
  }

  navigateTo(tab: string): void {
    this.router.navigate(['..', tab], { relativeTo: this.route });
  }

  goBack(): void {
    this.router.navigate(['/parent']);
  }
}
