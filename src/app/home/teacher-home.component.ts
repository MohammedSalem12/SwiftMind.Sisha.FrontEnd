import { AuthService, ConfigStateService } from '@abp/ng.core';
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { CurrentUserInfoService } from '@proxy/common';
import { TeacherService } from '@proxy/teachers';
import type { CourseDto } from '@proxy/courses/dtos/models';

@Component({
  selector: 'app-teacher-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="teacher-home">
      <div class="container py-4">
        <!-- Welcome Header -->
        <div class="welcome-section mb-4">
          <h1 class="mb-2">مرحباً بك</h1>
          <p class="text-muted">لوحة التحكم للمعلم</p>
        </div>

        <!-- Loading State -->
        <div *ngIf="loading()" class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">جاري التحميل...</span>
          </div>
        </div>

        <!-- Courses Grid -->
        <div *ngIf="!loading()">
          <div class="section-header mb-3">
            <h2 class="h4">المجموعات والدورات التدريبية</h2>
            <p class="text-muted">المجموعات والدورات المسندة إليك</p>
          </div>

          <div *ngIf="courses().length === 0" class="alert alert-info">
            <i class="fas fa-info-circle me-2"></i>
            لا توجد مجموعات مسندة إليك حالياً
          </div>

          <div class="row g-4">
            <div class="col-md-6 col-lg-4" *ngFor="let course of courses(); trackBy: trackById">
              <div class="course-card">
                <div class="course-card-header">
                  <div class="course-icon">
                    <i class="fas fa-book-open"></i>
                  </div>
                </div>
                <div class="course-card-body">
                  <h3 class="course-title">{{ course.nameAr }} / {{ course.nameEn }}</h3>
                  <div class="group-info">
                    <div class="info-item">
                      <i class="fas fa-code"></i>
                      <span>{{ course.code }}</span>
                    </div>
                    <div class="info-item">
                      <i class="fas fa-graduation-cap"></i>
                      <span>{{ course.gradeName }}</span>
                    </div>
                  </div>
                  <div class="action-buttons mt-3">
                    <button class="btn btn-primary btn-sm" (click)="viewCourseDetails(course)">
                      <i class="fas fa-eye me-1"></i>
                      عرض التفاصيل
                    </button>
                    <button class="btn btn-outline-secondary btn-sm" (click)="goToGroups(course)">
                      <i class="fas fa-users me-1"></i>
                      المجموعات
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="quick-actions mt-5">
          <h3 class="mb-3">روابط سريعة</h3>
          <div class="row g-3">
            <div class="col-md-3">
              <button class="action-btn w-100" (click)="goToEnrollmentRequests()">
                <i class="fas fa-inbox"></i>
                <span>طلبات التسجيل</span>
              </button>
            </div>
            <div class="col-md-3">
              <button class="action-btn w-100" (click)="goToGroups()">
                <i class="fas fa-users"></i>
                <span>المجموعات</span>
              </button>
            </div>
            <div class="col-md-3">
              <button class="action-btn w-100" (click)="goToAttendance()">
                <i class="fas fa-clipboard-check"></i>
                <span>الحضور</span>
              </button>
            </div>
            <div class="col-md-3">
              <button class="action-btn w-100" (click)="goToFeeds()">
                <i class="fas fa-rss"></i>
                <span>النشرات</span>
              </button>
            </div>
          </div>
          <div class="row g-3 mt-2">
            <div class="col-md-3">
              <button class="action-btn w-100" (click)="goToSelfEnroll()">
                <i class="fas fa-plus-circle"></i>
                <span>التسجيل في مقررات</span>
              </button>
            </div>
            <div class="col-md-3">
              <button class="action-btn w-100" (click)="goToProfile()">
                <i class="fas fa-user"></i>
                <span>حسابي</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .teacher-home {
      min-height: calc(100vh - 200px);
      background: #f8f9fa;
    }

    .welcome-section {
      padding: 2rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .welcome-section h1 {
      font-size: 2rem;
      font-weight: 600;
      margin: 0;
    }

    .section-header h2 {
      font-weight: 600;
      color: #1a202c;
    }

    .course-card {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
      height: 100%;
    }

    .course-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
    }

    .course-card-header {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      padding: 2rem;
      text-align: center;
    }

    .course-icon {
      width: 80px;
      height: 80px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 3px solid rgba(255, 255, 255, 0.3);
    }

    .course-icon i {
      font-size: 2rem;
      color: white;
    }

    .course-card-body {
      padding: 1.5rem;
    }

    .course-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1a202c;
      margin-bottom: 1rem;
      text-align: center;
    }

    .group-info {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    .info-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: #6b7280;
    }

    .info-item i {
      color: #4facfe;
      width: 20px;
    }

    .action-buttons {
      display: flex;
      gap: 0.5rem;
    }

    .btn-primary {
      flex: 1;
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-weight: 500;
    }

    .btn-primary:hover {
      background: linear-gradient(135deg, #3d8ed9 0%, #00d4e6 100%);
    }

    .btn-outline-secondary {
      flex: 1;
      border: 2px solid #e5e7eb;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-weight: 500;
      background: white;
      color: #6b7280;
    }

    .btn-outline-secondary:hover {
      border-color: #4facfe;
      background: #f0f9ff;
      color: #4facfe;
    }

    .quick-actions h3 {
      font-size: 1.5rem;
      font-weight: 600;
      color: #1a202c;
    }

    .action-btn {
      background: white;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .action-btn:hover {
      border-color: #4facfe;
      background: #f0f9ff;
      transform: translateY(-2px);
    }

    .action-btn i {
      font-size: 2rem;
      color: #4facfe;
    }

    .action-btn span {
      font-size: 1rem;
      font-weight: 500;
      color: #1a202c;
    }

    @media (max-width: 768px) {
      .welcome-section h1 {
        font-size: 1.5rem;
      }
      
      .course-card-body {
        padding: 1rem;
      }

      .action-buttons {
        flex-direction: column;
      }
    }
  `],
})
export class TeacherHomeComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly configStateService = inject(ConfigStateService);
  private readonly router = inject(Router);
  private readonly currentUserService = inject(CurrentUserInfoService);
  private readonly teacherService = inject(TeacherService);

  courses = signal<CourseDto[]>([]);
  loading = signal(false);

  async ngOnInit(): Promise<void> {
    await this.loadTeacherCourses();
  }

  private async loadTeacherCourses(): Promise<void> {
    this.loading.set(true);
    try {
      // Get teacher's actor ID from current user info
      const userInfo = await lastValueFrom(
        this.currentUserService.getCurrentUserActorInfo()
      );
      const teacherId = userInfo?.actorId;
      if (!teacherId) {
        console.warn('No teacher ID found for current user');
        this.courses.set([]);
        return;
      }

      // Get enrolled courses for the teacher
      const courses = await lastValueFrom(
        this.teacherService.getTeacherCourses(teacherId)
      );
      this.courses.set(courses || []);
    } catch (error) {
      console.error('Error loading teacher courses:', error);
    } finally {
      this.loading.set(false);
    }
  }

  viewCourseDetails(course: CourseDto): void {
    this.router.navigate(['/courses', course.id, 'groups']);
  }

  goToGroups(course?: CourseDto): void {
    if (course) {
      this.router.navigate(['/teacher-groups'], { queryParams: { courseId: course.id } });
    } else {
      this.router.navigate(['/teacher-groups']);
    }
  }

  goToEnrollmentRequests(): void {
    this.router.navigate(['/enrollment-requests']);
  }

  goToAttendance(): void {
    this.router.navigate(['/attendance']);
  }

  goToFeeds(): void {
    this.router.navigate(['/feeds']);
  }

  goToSelfEnroll(): void {
    this.router.navigate(['/teacher/enroll']);
  }

  goToProfile(): void {
    this.router.navigate(['/account/manage']);
  }

  trackById = (_: number, item: CourseDto) => item.id;
}
