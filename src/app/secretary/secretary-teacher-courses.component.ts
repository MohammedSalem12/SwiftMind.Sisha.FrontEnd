import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { TeacherService } from '@proxy/teachers';
import { CourseService } from '@proxy/courses';
import type { CourseDto } from '@proxy/courses/dtos/models';

@Component({
  selector: 'app-secretary-teacher-courses',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page" dir="rtl">

      <!-- Header -->
      <div class="page-header">
        <button class="back-btn" (click)="goBack()">
          <i class="fas fa-arrow-right"></i>
        </button>
        <div class="header-info">
          <h1>{{ teacherName() || 'المعلم' }}</h1>
          <p class="opacity-75 mb-0">{{ courses().length }} مقرر</p>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading()" class="loading-state">
        <div class="spinner-border text-primary" role="status"></div>
        <p class="mt-2 text-muted">جاري تحميل المقررات...</p>
      </div>

      <!-- Error -->
      <div *ngIf="error()" class="alert alert-danger mx-3 mt-3">
        <i class="fas fa-exclamation-circle me-2"></i>{{ error() }}
      </div>

      <!-- Course list -->
      <div class="course-list" *ngIf="!loading()">
        <div *ngIf="courses().length === 0 && !error()" class="empty-state">
          <i class="fas fa-book-open fa-3x text-muted mb-3"></i>
          <h4>لا توجد مقررات</h4>
          <p class="text-muted">لم يتم تسجيل أي مقرر لهذا المعلم بعد</p>
        </div>

        <div
          class="course-card"
          *ngFor="let course of courses(); trackBy: trackById">

          <div class="course-info">
            <div class="course-icon">
              <i class="fas fa-book"></i>
            </div>
            <div class="course-details">
              <h3>{{ course.nameAr || course.nameEn }}</h3>
              <span class="course-code" *ngIf="course.code">
                <i class="fas fa-hashtag me-1"></i>{{ course.code }}
              </span>
            </div>
          </div>

          <div class="course-actions">
            <button
              class="action-btn attendance"
              (click)="goToAttendance(course)">
              <i class="fas fa-clipboard-list"></i>
              <span>الحضور والغياب</span>
            </button>
            <button
              class="action-btn marks"
              (click)="goToMarks(course)">
              <i class="fas fa-star-half-alt"></i>
              <span>إدخال الدرجات</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page {
      min-height: 100vh;
      background: #f8f9fa;
      padding-bottom: calc(80px + env(safe-area-inset-bottom));
    }

    .page-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: calc(.75rem + env(safe-area-inset-top)) 1rem .75rem;
      display: flex;
      align-items: center;
      gap: .875rem;
      position: sticky;
      top: 0;
      z-index: 50;
    }

    .back-btn {
      width: 40px; height: 40px; border-radius: 50%;
      background: rgba(255,255,255,.2); border: none;
      color: white; font-size: 1rem; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }

    .header-info h1 { font-size: 1.2rem; font-weight: 700; margin: 0; }

    .loading-state {
      text-align: center;
      padding: 3rem 1rem;
    }

    .course-list {
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: .875rem;
    }

    .empty-state {
      text-align: center;
      padding: 3rem 1rem;
      color: #6c757d;
    }
    .empty-state h4 { color: #343a40; margin-top: .75rem; }

    .course-card {
      background: white;
      border-radius: 16px;
      border: 1.5px solid #e9ecef;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,.06);
    }

    .course-info {
      display: flex;
      align-items: center;
      gap: .875rem;
      padding: 1rem 1rem .75rem;
    }

    .course-icon {
      width: 48px; height: 48px; border-radius: 12px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 1.25rem; flex-shrink: 0;
    }

    .course-details { flex: 1; min-width: 0; }
    .course-details h3 {
      margin: 0 0 .2rem;
      font-size: 1rem;
      font-weight: 600;
      color: #1a1a2e;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .course-code {
      font-size: .8rem;
      color: #667eea;
      font-weight: 500;
    }

    .course-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      border-top: 1px solid #f0f0f0;
    }

    .action-btn {
      border: none;
      padding: .875rem .5rem;
      font-size: .85rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: .35rem;
      min-height: 64px;
      transition: background .15s;
    }
    .action-btn i { font-size: 1.1rem; }

    .action-btn.attendance {
      background: #f0f9ff;
      color: #0284c7;
      border-left: 1px solid #e0f2fe;
    }
    .action-btn.attendance:hover, .action-btn.attendance:active {
      background: #e0f2fe;
    }

    .action-btn.marks {
      background: #fefce8;
      color: #ca8a04;
    }
    .action-btn.marks:hover, .action-btn.marks:active {
      background: #fef9c3;
    }
  `],
})
export class SecretaryTeacherCoursesComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly teacherService = inject(TeacherService);

  teacherName = signal<string>('');
  courses = signal<CourseDto[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  private currentTeacherId: string | null = null;

  async ngOnInit(): Promise<void> {
    const teacherId = this.route.snapshot.paramMap.get('teacherId');
    if (!teacherId) {
      this.error.set('معرّف المعلم غير موجود');
      return;
    }
    this.currentTeacherId = teacherId;
    await this.loadCourses(teacherId);
  }

  private async loadCourses(teacherId: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const courses = await lastValueFrom(
        this.teacherService.getTeacherCourses(teacherId, { skipHandleError: true })
      );
      this.courses.set(courses ?? []);

      // Try to get teacher name from state or a separate call
      const history = window.history.state as any;
      if (history?.teacherName) {
        this.teacherName.set(history.teacherName);
      }
    } catch (err: any) {
      this.error.set(err?.error?.error?.message || 'حدث خطأ أثناء تحميل المقررات');
      console.error('Error loading teacher courses:', err);
    } finally {
      this.loading.set(false);
    }
  }

  goToAttendance(course: CourseDto): void {
    const qp: any = { courseId: course.id };
    if (this.currentTeacherId) qp['teacherId'] = this.currentTeacherId;
    this.router.navigate(['/attendance'], { queryParams: qp });
  }

  goToMarks(course: CourseDto): void {
    const qp: any = { courseId: course.id };
    if (this.currentTeacherId) qp['teacherId'] = this.currentTeacherId;
    this.router.navigate(['/marks-entry'], { queryParams: qp });
  }

  goBack(): void {
    this.router.navigate(['/secretary']);
  }

  trackById = (_: number, item: CourseDto) => item.id;
}
