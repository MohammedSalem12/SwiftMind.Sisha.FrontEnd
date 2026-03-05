import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { CourseService } from '@proxy/courses';
import type { CourseDto } from '@proxy/courses/dtos/models';
import { TeacherService } from '@proxy/teachers';
import type { TeacherEnrollmentResultDto } from '@proxy/teachers';

@Component({
  selector: 'app-teacher-self-enroll',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="self-enroll-page">
      <div class="container py-4">
        <!-- Header -->
        <div class="page-header mb-4">
          <div class="d-flex align-items-center gap-3">
            <button class="btn btn-outline-light btn-sm" (click)="goBack()">
              <i class="fas fa-arrow-right"></i>
            </button>
            <div>
              <h1 class="mb-1">التسجيل في المقررات</h1>
              <p class="mb-0 opacity-75">اختر المقررات التي تريد التسجيل فيها</p>
            </div>
          </div>
        </div>

        <!-- Loading -->
        <div *ngIf="loading()" class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">جاري التحميل...</span>
          </div>
          <p class="mt-2 text-muted">جاري تحميل المقررات...</p>
        </div>

        <!-- Result Message -->
        <div *ngIf="result()" class="result-card mb-4" [class.success]="result()!.success" [class.error]="!result()!.success">
          <div class="result-icon">
            <i [class]="result()!.success ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'"></i>
          </div>
          <div class="result-body">
            <h4>{{ result()!.success ? 'تم التسجيل بنجاح' : 'تنبيه' }}</h4>
            <p>{{ result()!.message }}</p>
            <div *ngIf="result()!.enrolledCourses?.length" class="mt-2">
              <strong>المقررات المسجلة:</strong>
              <ul class="mb-0">
                <li *ngFor="let c of result()!.enrolledCourses">{{ c }}</li>
              </ul>
            </div>
            <div *ngIf="result()!.alreadyEnrolledCourses?.length" class="mt-2">
              <strong>مسجل مسبقاً:</strong>
              <ul class="mb-0">
                <li *ngFor="let c of result()!.alreadyEnrolledCourses">{{ c }}</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Course List -->
        <div *ngIf="!loading() && courses().length > 0">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h3 class="h5 mb-0">المقررات المتاحة ({{ courses().length }})</h3>
            <button
              class="btn btn-primary"
              [disabled]="selectedCourseIds().length === 0 || submitting()"
              (click)="submitEnrollment()">
              <i class="fas fa-check me-1"></i>
              تسجيل ({{ selectedCourseIds().length }})
            </button>
          </div>

          <div class="row g-3">
            <div class="col-md-6 col-lg-4" *ngFor="let course of courses(); trackBy: trackById">
              <div
                class="course-select-card"
                [class.selected]="isSelected(course.id!)"
                (click)="toggleCourse(course.id!)">
                <div class="select-indicator">
                  <i [class]="isSelected(course.id!) ? 'fas fa-check-square' : 'far fa-square'"></i>
                </div>
                <div class="course-info">
                  <h5>{{ course.nameAr }}</h5>
                  <p class="text-muted mb-1">{{ course.nameEn }}</p>
                  <div class="d-flex gap-3">
                    <span class="badge bg-light text-dark">
                      <i class="fas fa-code me-1"></i>{{ course.code }}
                    </span>
                    <span *ngIf="course.gradeName" class="badge bg-light text-dark grade-badge">
                      <i class="fas fa-graduation-cap me-1"></i>{{ course.gradeName }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty -->
        <div *ngIf="!loading() && courses().length === 0 && !result()" class="text-center py-5">
          <i class="fas fa-book-open fa-3x text-muted mb-3"></i>
          <h4>لا توجد مقررات متاحة</h4>
          <p class="text-muted">لا توجد مقررات متاحة للتسجيل حالياً</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .self-enroll-page {
      min-height: calc(100vh - 200px);
      background: #f8f9fa;
    }

    .page-header {
      padding: 1.5rem 2rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 12px;
    }

    .page-header h1 { font-size: 1.75rem; font-weight: 600; }

    .result-card {
      display: flex;
      gap: 1rem;
      padding: 1.5rem;
      border-radius: 12px;
      align-items: flex-start;
    }

    .result-card.success {
      background: #d4edda;
      border: 1px solid #c3e6cb;
    }

    .result-card.error {
      background: #fff3cd;
      border: 1px solid #ffc107;
    }

    .result-icon { font-size: 2rem; }
    .result-card.success .result-icon { color: #28a745; }
    .result-card.error .result-icon { color: #ffc107; }

    .course-select-card {
      display: flex;
      gap: 1rem;
      padding: 1.25rem;
      background: white;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      height: 100%;
    }

    .course-select-card:hover {
      border-color: #667eea;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
    }

    .course-select-card.selected {
      border-color: #667eea;
      background: #f0f0ff;
    }

    .select-indicator {
      font-size: 1.5rem;
      color: #667eea;
      padding-top: 0.25rem;
    }

    .course-info h5 {
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 0.25rem;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      padding: 0.5rem 1.5rem;
      border-radius: 8px;
    }

    .grade-badge {
      font-size: 0.9rem !important;
      font-weight: 600 !important;
      padding: 0.4rem 0.6rem !important;
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%) !important;
      color: white !important;
      border-radius: 6px;
      letter-spacing: 0.02em;
      box-shadow: 0 2px 4px rgba(245, 158, 11, 0.2);
    }

    .grade-badge i {
      font-size: 0.85rem;
      opacity: 0.9;
    }
  `],
})
export class TeacherSelfEnrollComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly courseService = inject(CourseService);
  private readonly teacherService = inject(TeacherService);

  courses = signal<CourseDto[]>([]);
  selectedCourseIds = signal<string[]>([]);
  loading = signal(false);
  submitting = signal(false);
  result = signal<TeacherEnrollmentResultDto | null>(null);

  async ngOnInit() {
    await this.loadCourses();
  }

  private async loadCourses() {
    this.loading.set(true);
    try {
      const res = await lastValueFrom(
        this.courseService.getList({ skipCount: 0, maxResultCount: 1000 })
      );
      this.courses.set(res.items || []);
    } catch (err) {
      console.error('Error loading courses:', err);
    } finally {
      this.loading.set(false);
    }
  }

  toggleCourse(courseId: string) {
    this.selectedCourseIds.update(ids =>
      ids.includes(courseId) ? ids.filter(id => id !== courseId) : [...ids, courseId]
    );
  }

  isSelected(courseId: string): boolean {
    return this.selectedCourseIds().includes(courseId);
  }

  async submitEnrollment() {
    if (this.selectedCourseIds().length === 0) return;
    this.submitting.set(true);
    this.result.set(null);
    try {
      const res = await lastValueFrom(
        this.teacherService.selfEnrollInCourses(this.selectedCourseIds())
      );
      this.result.set(res);
      if (res.success) {
        this.selectedCourseIds.set([]);
      }
    } catch (err) {
      console.error('Error enrolling:', err);
      this.result.set({
        success: false,
        message: 'حدث خطأ أثناء التسجيل. يرجى المحاولة مرة أخرى.',
        enrolledCourses: [],
        alreadyEnrolledCourses: [],
        failedCourses: [],
      });
    } finally {
      this.submitting.set(false);
    }
  }

  goBack() {
    this.router.navigate(['/teacher']);
  }

  trackById = (_: number, item: CourseDto) => item.id;
}
