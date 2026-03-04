import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { ExamGradeService } from '@proxy/exam-grades';
import type { ExamGradeDto } from '@proxy/exam-grades/dtos/models';
import { CurrentUserInfoService } from '@proxy/common';

@Component({
  selector: 'app-student-my-grades',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="my-grades">
      <div class="container py-4">
        <button class="btn btn-link mb-3 p-0" (click)="goBack()">
          <i class="fas fa-arrow-right me-1"></i> العودة للرئيسية
        </button>

        <h2 class="mb-4"><i class="fas fa-chart-bar me-2"></i>درجاتي</h2>

        <div *ngIf="loading()" class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">جاري التحميل...</span>
          </div>
        </div>

        <div *ngIf="!loading()">
          <div *ngIf="grades().length === 0" class="alert alert-info">
            <i class="fas fa-info-circle me-2"></i>لا توجد درجات متاحة حالياً
          </div>

          <!-- Stats -->
          <div *ngIf="grades().length > 0" class="stats-row mb-4">
            <div class="stat-card">
              <div class="stat-value" [class]="getAvgClass()">{{ getAveragePercentage() | number:'1.0-0' }}%</div>
              <div class="stat-label">المعدل العام</div>
            </div>
            <div class="stat-card">
              <div class="stat-value text-primary">{{ grades().length }}</div>
              <div class="stat-label">عدد الاختبارات</div>
            </div>
            <div class="stat-card">
              <div class="stat-value text-success">{{ getHighestPercentage() | number:'1.0-0' }}%</div>
              <div class="stat-label">أعلى درجة</div>
            </div>
          </div>

          <!-- Grades Table -->
          <div class="grades-card" *ngIf="grades().length > 0">
            <div class="table-responsive">
              <table class="table table-hover mb-0">
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
                    <td class="fw-bold">{{ grade.examName || '-' }}</td>
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
    </div>
  `,
  styles: [`
    .my-grades { min-height: calc(100vh - 200px); background: #f8f9fa; }
    h2 { font-weight: 600; color: #1a202c; }
    .stats-row { display: flex; gap: 1rem; flex-wrap: wrap; }
    .stat-card { flex: 1; min-width: 150px; background: white; border-radius: 10px; padding: 1.25rem; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .stat-value { font-size: 2rem; font-weight: 700; }
    .stat-label { font-size: 0.875rem; color: #6b7280; margin-top: 0.25rem; }
    .grades-card { background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .table th { font-weight: 600; color: #6b7280; font-size: 0.875rem; border-bottom: 2px solid #e5e7eb; }
    .table td { vertical-align: middle; }
  `],
})
export class StudentMyGradesComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly examGradeService = inject(ExamGradeService);
  private readonly currentUserInfoService = inject(CurrentUserInfoService);

  grades = signal<ExamGradeDto[]>([]);
  loading = signal(false);

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    try {
      const userInfo = await lastValueFrom(this.currentUserInfoService.getCurrentUserActorInfo());
      const studentId = userInfo?.actorId;
      if (!studentId) return;

      const result = await lastValueFrom(
        this.examGradeService.getGradesByStudent(studentId, {
          skipCount: 0,
          maxResultCount: 200,
        })
      );
      this.grades.set(result.items || []);
    } catch (error) {
      console.error('Error loading grades:', error);
    } finally {
      this.loading.set(false);
    }
  }

  getPercentage(grade: ExamGradeDto): number {
    if (!grade.maxGrade || grade.maxGrade === 0) return 0;
    return (grade.grade / grade.maxGrade) * 100;
  }

  getAveragePercentage(): number {
    const g = this.grades();
    if (g.length === 0) return 0;
    const total = g.reduce((sum, x) => sum + this.getPercentage(x), 0);
    return total / g.length;
  }

  getHighestPercentage(): number {
    const g = this.grades();
    if (g.length === 0) return 0;
    return Math.max(...g.map(x => this.getPercentage(x)));
  }

  getAvgClass(): string {
    const avg = this.getAveragePercentage();
    if (avg >= 90) return 'text-success';
    if (avg >= 75) return 'text-info';
    if (avg >= 60) return 'text-warning';
    return 'text-danger';
  }

  goBack(): void {
    this.router.navigate(['/student']);
  }
}
