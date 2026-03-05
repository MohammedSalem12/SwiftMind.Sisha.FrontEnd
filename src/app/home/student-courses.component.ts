import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { CourseService } from '@proxy/courses';
import type { StudentCourseDto } from '@proxy/courses/dtos/models';

@Component({
  selector: 'app-student-courses',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="student-courses" dir="rtl">
      <div class="container py-4">

        <!-- Header -->
        <div class="page-header mb-4">
          <button class="btn-back" (click)="goBack()">
            <i class="fas fa-arrow-right"></i>
          </button>
          <div>
            <h1 class="mb-0">المقررات الدراسية</h1>
            <p class="mb-0 subtitle">اختر مقرراً للتسجيل فيه</p>
          </div>
        </div>

        <!-- Loading -->
        <div *ngIf="loading()" class="text-center py-5">
          <div class="spinner-border text-primary" role="status"></div>
          <p class="mt-3 text-muted">جاري تحميل المقررات...</p>
        </div>

        <!-- Error -->
        <div *ngIf="error()" class="alert-error">
          <i class="fas fa-exclamation-triangle"></i> {{ error() }}
        </div>

        <!-- Empty -->
        <div *ngIf="!loading() && !error() && courses().length === 0" class="empty-state">
          <i class="fas fa-book-open empty-icon"></i>
          <p>لا توجد مقررات متاحة لصفك حالياً</p>
        </div>

        <!-- Courses Grid -->
        <div *ngIf="!loading() && courses().length > 0" class="courses-grid">
          <div *ngFor="let c of courses(); trackBy: trackById" class="course-card"
               [class.enrolled]="c.isEnrolled"
               [class.pending]="c.hasPendingRequest && !c.isEnrolled"
               (click)="openProfile(c)"
               style="cursor:pointer">

            <div class="card-top">
              <div class="code">{{ c.code || '-' }}</div>
              <div class="grade-badge">{{ c.gradeName }}</div>
            </div>

            <div class="card-body-content">
              <div class="course-name">
                {{ c.nameAr }}
                <span class="inline-grade" *ngIf="c.gradeName">• {{ c.gradeName }}</span>
              </div>
              <div class="course-name-en" *ngIf="c.nameEn">{{ c.nameEn }}</div>
            </div>

            <div class="card-footer">
              <!-- Already enrolled -->
              <div *ngIf="c.isEnrolled" class="status-badge enrolled-badge">
                <i class="fas fa-check-circle"></i> مسجّل
              </div>

              <!-- Pending request -->
              <div *ngIf="c.hasPendingRequest && !c.isEnrolled" class="status-badge pending-badge">
                <i class="fas fa-clock"></i> قيد المراجعة
              </div>

              <!-- Enroll button -->
              <button *ngIf="!c.isEnrolled && !c.hasPendingRequest"
                      class="btn-enroll"
                      (click)="enrollInCourse(c); $event.stopPropagation()">
                <i class="fas fa-plus"></i> سجّل
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .student-courses { min-height: calc(100vh - 120px); background: #f0f2f5; }

    .page-header {
      display: flex; align-items: center; gap: 1rem;
      background: var(--ngx-hero-gradient);
      color: white; padding: 1.5rem; border-radius: 14px;
      box-shadow: 0 4px 12px rgba(51, 102, 255,0.3);
    }
    .page-header h1 { font-size: 1.5rem; font-weight: 700; color: white; }
    .page-header .subtitle { color: rgba(255,255,255,0.85); font-size: 0.9rem; }

    .btn-back {
      background: rgba(255,255,255,0.2); border: none; border-radius: 10px;
      width: 40px; height: 40px; color: white; font-size: 1rem;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; flex-shrink: 0; transition: background 0.2s;
    }
    .btn-back:hover { background: rgba(255,255,255,0.3); }

    .alert-error {
      background: #fee2e2; border: 1px solid #fca5a5; border-radius: 10px;
      padding: 0.85rem 1rem; color: #dc2626; display: flex; align-items: center; gap: 0.5rem;
    }

    .empty-state {
      text-align: center; padding: 3rem 1rem; color: #6b7280;
    }
    .empty-icon { font-size: 3rem; color: #d1d5db; display: block; margin-bottom: 1rem; }

    .courses-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 1rem;
    }

    .course-card {
      background: white; border-radius: 14px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.07);
      border: 2px solid transparent;
      display: flex; flex-direction: column; gap: 0;
      overflow: hidden; transition: box-shadow 0.2s, border-color 0.2s;
    }
    .course-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.12); }
    .course-card.enrolled { border-color: #22c55e; }
    .course-card.pending { border-color: #f59e0b; }

    .card-top {
      display: flex; justify-content: space-between; align-items: center;
      padding: 0.75rem 1rem 0;
    }
    .code { color: #6b7280; font-size: 0.8rem; font-weight: 600; }
    .grade-badge {
      background: #eef6ff; color: #1976d2; padding: 0.15rem 0.6rem;
      border-radius: 6px; font-size: 0.75rem; font-weight: 600;
    }

    .card-body-content { padding: 0.75rem 1rem; flex: 1; }
    .course-name { font-weight: 700; color: #1a202c; font-size: 0.95rem; margin-bottom: 0.25rem; }
    .inline-grade { color: #6b7280; font-weight: 600; font-size: 0.8rem; margin-left: 0.5rem; }
    .course-name-en { color: #6b7280; font-size: 0.82rem; }

    .card-footer {
      padding: 0.75rem 1rem;
      border-top: 1px solid #f3f4f6;
      display: flex; justify-content: flex-end;
    }

    .status-badge {
      display: flex; align-items: center; gap: 0.35rem;
      padding: 0.35rem 0.85rem; border-radius: 8px;
      font-size: 0.82rem; font-weight: 600;
    }
    .enrolled-badge { background: #f0fdf4; color: #15803d; }
    .pending-badge { background: #fffbeb; color: #d97706; }

    .btn-enroll {
      background: var(--ngx-hero-gradient);
      color: white; border: none; border-radius: 8px;
      padding: 0.4rem 1rem; font-size: 0.85rem; font-weight: 600;
      cursor: pointer; display: flex; align-items: center; gap: 0.35rem;
      transition: opacity 0.2s;
    }
    .btn-enroll:hover { opacity: 0.9; }

    @media (max-width: 600px) {
      .courses-grid { grid-template-columns: 1fr 1fr; gap: 0.75rem; }
      .page-header { padding: 1rem; }
      .page-header h1 { font-size: 1.25rem; }
    }
  `]
})
export class StudentCoursesComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly courseService = inject(CourseService);

  courses = signal<StudentCourseDto[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const result = await lastValueFrom(this.courseService.getCoursesForCurrentStudent());
      this.courses.set(result || []);
    } catch (err) {
      console.error('Error loading student courses:', err);
      this.error.set('حدث خطأ أثناء تحميل المقررات');
    } finally {
      this.loading.set(false);
    }
  }

  openProfile(course: StudentCourseDto): void {
    this.router.navigate(['/student/course', course.id]);
  }

  enrollInCourse(course: StudentCourseDto): void {
    this.router.navigate(['/student/enroll', course.id]);
  }

  goBack(): void {
    this.router.navigate(['/student']);
  }

  trackById = (_: number, c: StudentCourseDto) => c.id;
}
