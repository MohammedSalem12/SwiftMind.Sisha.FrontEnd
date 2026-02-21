import { AuthService, ConfigStateService, ListService } from '@abp/ng.core';
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { CourseService } from '@proxy/courses';
import type { CourseDto } from '@proxy/courses/dtos';
import { ParentService } from '@proxy/parents';
import type { ParentStudentDto } from '@proxy/parents/models';

@Component({
  selector: 'app-student-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="student-home">
      <div class="container py-4">
        <!-- Welcome Header -->
        <div class="welcome-section mb-4">
          <h1 class="mb-2">مرحباً بك في SwiftMind</h1>
          <p class="text-muted">المقررات الدراسية الخاصة بك</p>
        </div>

        <!-- Loading State -->
        <div *ngIf="loading()" class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">جاري التحميل...</span>
          </div>
        </div>

        <!-- Courses Grid -->
        <div *ngIf="!loading()" class="courses-grid">
          <div *ngIf="courses().length === 0" class="alert alert-info">
            <i class="fas fa-info-circle me-2"></i>
            لا توجد مقررات متاحة للصف {{ currentGrade() }} حالياً
          </div>

          <div class="row g-4">
            <div class="col-md-6 col-lg-4" *ngFor="let course of courses(); trackBy: trackById">
              <div class="course-card" (click)="viewCourseDetails(course)">
                <div class="course-card-body">
                  <div class="course-icon">
                    <i class="fas fa-book"></i>
                  </div>
                  <h3 class="course-title">{{ course.nameAr }}</h3>
                  <p class="course-subtitle" *ngIf="course.nameEn">{{ course.nameEn }}</p>
                  <div class="course-meta">
                    <span class="badge bg-primary">{{ course.code }}</span>
                    <span class="badge bg-secondary">{{ course.gradeName }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Pending Parent Link Requests -->
        <div *ngIf="pendingParentLinks().length > 0" class="mt-4">
          <h2 class="h4 mb-3">طلبات ربط ولي أمر</h2>
          <div class="list-group">
            <div *ngFor="let link of pendingParentLinks()" class="list-group-item d-flex justify-content-between align-items-center">
              <div>
                <strong>{{ link.relationshipType }}</strong> يطلب ربط حسابه بك
              </div>
              <div class="d-flex gap-2">
                <button class="btn btn-success btn-sm" (click)="confirmParentLink(link)">
                  <i class="fas fa-check"></i> موافقة
                </button>
                <button class="btn btn-danger btn-sm" (click)="rejectParentLink(link)">
                  <i class="fas fa-times"></i> رفض
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="quick-actions mt-5">
          <h3 class="mb-3">روابط سريعة</h3>
          <div class="row g-3">
            <div class="col-md-4">
              <button class="action-btn w-100" (click)="goToCourses()">
                <i class="fas fa-book-open"></i>
                <span>جميع المقررات</span>
              </button>
            </div>
            <div class="col-md-4">
              <button class="action-btn w-100" (click)="goToFeeds()">
                <i class="fas fa-rss"></i>
                <span>النشرات</span>
              </button>
            </div>
            <div class="col-md-4">
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
    .student-home {
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

    .courses-grid {
      margin-top: 2rem;
    }

    .course-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      height: 100%;
    }

    .course-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
    }

    .course-card-body {
      text-align: center;
    }

    .course-icon {
      width: 64px;
      height: 64px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1rem;
    }

    .course-icon i {
      font-size: 1.5rem;
      color: white;
    }

    .course-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1a202c;
      margin-bottom: 0.5rem;
    }

    .course-subtitle {
      font-size: 0.875rem;
      color: #6b7280;
      margin-bottom: 1rem;
    }

    .course-meta {
      display: flex;
      gap: 0.5rem;
      justify-content: center;
      flex-wrap: wrap;
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
      border-color: #667eea;
      background: #f0f4ff;
      transform: translateY(-2px);
    }

    .action-btn i {
      font-size: 2rem;
      color: #667eea;
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
      
      .course-card {
        padding: 1rem;
      }
    }
  `],
  providers: [ListService],
})
export class StudentHomeComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly configStateService = inject(ConfigStateService);
  private readonly router = inject(Router);
  private readonly courseService = inject(CourseService);
  private readonly parentService = inject(ParentService);

  courses = signal<CourseDto[]>([]);
  pendingParentLinks = signal<ParentStudentDto[]>([]);
  loading = signal(false);

  async ngOnInit(): Promise<void> {
    await Promise.all([
      this.loadStudentCourses(),
      this.loadPendingParentLinks()
    ]);
  }

  private async loadPendingParentLinks(): Promise<void> {
    try {
      const links = await lastValueFrom(this.parentService.getPendingLinksForCurrentStudent());
      this.pendingParentLinks.set(links || []);
    } catch (error) {
      console.error('Error loading pending parent links:', error);
    }
  }

  async confirmParentLink(link: ParentStudentDto): Promise<void> {
    try {
      await lastValueFrom(this.parentService.confirmParentStudentLink(link.parentId!, link.studentId!));
      await this.loadPendingParentLinks();
    } catch (error) {
      console.error('Error confirming parent link:', error);
    }
  }

  async rejectParentLink(link: ParentStudentDto): Promise<void> {
    if (!confirm('هل أنت متأكد من رفض ربط ولي الأمر؟')) return;
    try {
      await lastValueFrom(this.parentService.rejectParentStudentLink(link.parentId!, link.studentId!));
      await this.loadPendingParentLinks();
    } catch (error) {
      console.error('Error rejecting parent link:', error);
    }
  }

  private async loadStudentCourses(): Promise<void> {
    this.loading.set(true);
    try {
      // Get courses for current student - backend filters by grade from token
      const courses = await lastValueFrom(
        this.courseService.getCoursesForCurrentStudent()
      );
      this.courses.set(courses || []);
    } catch (error) {
      console.error('Error loading student courses:', error);
    } finally {
      this.loading.set(false);
    }
  }

  viewCourseDetails(course: CourseDto): void {
    // Navigate to course teachers page
    this.router.navigate(['/courses', course.id, 'teachers']);
  }

  goToCourses(): void {
    this.router.navigate(['/courses']);
  }

  goToFeeds(): void {
    this.router.navigate(['/feeds']);
  }

  goToProfile(): void {
    this.router.navigate(['/account/manage']);
  }

  trackById = (_: number, item: CourseDto) => item.id;
}
