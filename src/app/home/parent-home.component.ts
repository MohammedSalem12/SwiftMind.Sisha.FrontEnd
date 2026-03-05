import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, ConfigStateService } from '@abp/ng.core';
import { lastValueFrom } from 'rxjs';

import { ParentService } from '@proxy/parents';
import type { ParentDto, ParentStudentDto } from '@proxy/parents/models';
import { NotificationService, NotificationDto } from '@proxy/notifications';
import { EnrollmentRequestService } from '@proxy/student-enrollments';
import type { EnrollmentRequestDto } from '@proxy/student-enrollments/models';
import { EnrollmentRequestStatus } from '@proxy/enums/enrollment-request-status.enum';

@Component({
  selector: 'app-parent-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="parent-home">
      <div class="container py-4">
        <!-- Welcome Header -->
        <div class="welcome-section mb-4">
          <h1 class="mb-2">مرحباً بك</h1>
          <p class="text-muted">لوحة التحكم لولي الأمر</p>
        </div>

        <!-- Loading State -->
        <div *ngIf="loading()" class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">جاري التحميل...</span>
          </div>
        </div>

        <!-- Children Grid -->
        <div *ngIf="!loading()">
          <div class="section-header mb-3">
            <h2 class="h4">أبنائي</h2>
          </div>

          <div *ngIf="children().length === 0" class="alert alert-info">
            <i class="fas fa-info-circle me-2"></i>
            لا توجد بيانات للأبناء حالياً
          </div>

          <div class="row g-4">
            <div class="col-md-6 col-lg-4" *ngFor="let child of children(); trackBy: trackById">
              <div class="child-card">
                <div class="child-card-header">
                  <div class="student-avatar">
                    <i class="fas fa-user-graduate"></i>
                  </div>
                </div>
                <div class="child-card-body">
                  <h3 class="student-name">{{ child.studentName }}</h3>
                  <div class="student-info">
                    <div class="info-item">
                      <i class="fas fa-id-card"></i>
                      <span>{{ child.studentCode }}</span>
                    </div>
                    <div class="info-item" *ngIf="child.gradeName">
                      <i class="fas fa-graduation-cap"></i>
                      <span>{{ child.gradeName }}</span>
                    </div>
                    <div class="info-item">
                      <i class="fas fa-heart"></i>
                      <span>{{ child.relationshipType }}</span>
                    </div>
                    <div class="info-item" *ngIf="child.isEmergencyContact">
                      <i class="fas fa-phone-alt"></i>
                      <span>جهة اتصال طوارئ</span>
                    </div>
                    </div>

                  <!-- Enrolled Courses -->
                  <div *ngIf="getChildCourses(child.studentId!).length > 0" class="child-courses mt-3">
                    <h6 class="courses-title"><i class="fas fa-book-open me-1"></i>المقررات المسجلة</h6>
                    <div class="course-item" *ngFor="let req of getChildCourses(child.studentId!)">
                      <div class="course-name-line">
                        <i class="fas fa-book"></i>
                        <span>{{ req.courseName }}</span>
                        <span class="badge bg-light text-dark ms-auto" *ngIf="req.courseCode">{{ req.courseCode }}</span>
                      </div>
                      <div class="course-meta">
                        <span *ngIf="req.teacherName"><i class="fas fa-chalkboard-teacher me-1"></i>{{ req.teacherName }}</span>
                        <span *ngIf="req.groupName"><i class="fas fa-users me-1"></i>{{ req.groupName }}</span>
                      </div>
                    </div>
                  </div>
                  <div *ngIf="getChildCourses(child.studentId!).length === 0" class="no-courses mt-3">
                    <small class="text-muted"><i class="fas fa-info-circle me-1"></i>لا توجد مقررات مسجلة</small>
                  </div>

                  <button class="btn btn-primary btn-sm w-100 mt-3" (click)="viewChildDetails(child)">
                    <i class="fas fa-eye me-1"></i>
                    عرض التفاصيل
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Notifications -->
        <div *ngIf="!loading() && recentNotifications().length > 0" class="mt-4">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h2 class="h4">آخر الأحداث</h2>
            <button class="btn btn-link" (click)="goToNotifications()">عرض الكل →</button>
          </div>
          <div class="list-group">
            <div *ngFor="let n of recentNotifications()" class="list-group-item" [class.bg-light]="!n.isRead">
              <div class="d-flex justify-content-between">
                <div>
                  <h6 class="mb-1">{{ n.title }}</h6>
                  <p class="mb-0 text-muted small">{{ n.message }}</p>
                </div>
                <small class="text-muted">{{ n.creationTime | date:'short' }}</small>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="quick-actions mt-5">
          <h3 class="mb-3">روابط سريعة</h3>
          <div class="row g-3">
            <div class="col-md-3">
              <button class="action-btn w-100" (click)="goToLinkChild()">
                <i class="fas fa-link"></i>
                <span>ربط ابن/ابنة</span>
              </button>
            </div>
            <div class="col-md-3">
              <button class="action-btn w-100" (click)="goToEnrollmentApproval()">
                <i class="fas fa-clipboard-check"></i>
                <span>طلبات التسجيل</span>
              </button>
            </div>
            <div class="col-md-3">
              <button class="action-btn w-100" (click)="goToDashboard()">
                <i class="fas fa-chart-line"></i>
                <span>لوحة المتابعة</span>
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
    .parent-home {
      min-height: calc(100vh - 200px);
      background: #f8f9fa;
    }

    .welcome-section {
      padding: 2rem;
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
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

    .child-card {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
      height: 100%;
    }

    .child-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
    }

    .child-card-header {
      background: var(--ngx-hero-gradient);
      padding: 2rem;
      text-align: center;
    }

    .student-avatar {
      width: 80px;
      height: 80px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 3px solid rgba(255, 255, 255, 0.3);
    }

    .student-avatar i {
      font-size: 2rem;
      color: white;
    }

    .child-card-body {
      padding: 1.5rem;
    }

    .student-name {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1a202c;
      margin-bottom: 1rem;
      text-align: center;
    }

    .student-info {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .info-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: #6b7280;
    }

    .info-item i {
      color: var(--ngx-primary);
      width: 20px;
    }

    .btn-primary {
      background: var(--ngx-hero-gradient);
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-weight: 500;
    }

    .btn-primary:hover {
      background: linear-gradient(135deg, #5568d3 0%, #6a4190 100%);
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
      border-color: #f093fb;
      background: #fef3ff;
      transform: translateY(-2px);
    }

    .action-btn i {
      font-size: 2rem;
      color: #f093fb;
    }

    .action-btn span {
      font-size: 1rem;
      font-weight: 500;
      color: #1a202c;
    }

    .child-courses {
      border-top: 1px solid #f0f0f0;
      padding-top: 0.75rem;
    }

    .courses-title {
      font-size: 0.85rem;
      font-weight: 600;
      color: #4a5568;
      margin-bottom: 0.5rem;
    }

    .course-item {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 0.5rem 0.75rem;
      margin-bottom: 0.4rem;
    }

    .course-name-line {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.85rem;
      font-weight: 600;
      color: #1a202c;
    }

    .course-name-line i {
      color: var(--ngx-primary);
      width: 16px;
      font-size: 0.75rem;
    }

    .course-meta {
      display: flex;
      gap: 0.75rem;
      margin-top: 0.25rem;
      padding-right: 1.25rem;
      font-size: 0.78rem;
      color: #6b7280;
    }

    .course-meta i {
      color: #a0aec0;
    }

    .no-courses {
      text-align: center;
      padding: 0.5rem;
    }

    @media (max-width: 768px) {
      .welcome-section h1 {
        font-size: 1.5rem;
      }
      
      .child-card-body {
        padding: 1rem;
      }
    }
  `],
})
export class ParentHomeComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly configStateService = inject(ConfigStateService);
  private readonly router = inject(Router);
  private readonly parentService = inject(ParentService);
  private readonly notificationService = inject(NotificationService);
  private readonly enrollmentRequestService = inject(EnrollmentRequestService);

  children = signal<ParentStudentDto[]>([]);
  childCoursesMap = signal<Record<string, EnrollmentRequestDto[]>>({});
  recentNotifications = signal<NotificationDto[]>([]);
  loading = signal(false);
  currentParent = signal<ParentDto | null>(null);

  async ngOnInit(): Promise<void> {
    await Promise.all([
      this.loadParentChildren(),
      this.loadRecentNotifications()
    ]);
  }

  private async loadRecentNotifications(): Promise<void> {
    try {
      const notifications = await lastValueFrom(this.notificationService.getMyNotifications());
      this.recentNotifications.set(notifications.slice(0, 5));
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }

  private async loadParentChildren(): Promise<void> {
    this.loading.set(true);
    try {
      // Get current parent info using the user ID
      const currentUserId = this.configStateService.getOne('currentUser')?.id;
      if (!currentUserId) {
        console.error('No user ID found');
        return;
      }

      // Get parent by user ID
      const parent = await lastValueFrom(this.parentService.getByUserId(currentUserId));
      if (parent) {
        this.currentParent.set(parent);

        // Get parent's students
        const students = await lastValueFrom(this.parentService.getLinkedStudentsByParentId(parent.id!));
        this.children.set(students as ParentStudentDto[]);

        // Load enrollment data for all children
        await this.loadChildrenCourses(students as ParentStudentDto[]);
      }
    } catch (error) {
      console.error('Error loading parent children:', error);
    } finally {
      this.loading.set(false);
    }
  }

  private async loadChildrenCourses(children: ParentStudentDto[]): Promise<void> {
    try {
      const allRequests = await lastValueFrom(this.enrollmentRequestService.getList());
      if (!allRequests) return;

      const studentIds = new Set(children.map(c => c.studentId));
      const map: Record<string, EnrollmentRequestDto[]> = {};

      for (const req of allRequests) {
        if (!req.studentId || !studentIds.has(req.studentId)) continue;
        if (req.status !== EnrollmentRequestStatus.Approved) continue;

        if (!map[req.studentId]) map[req.studentId] = [];
        // Avoid duplicate courses
        if (!map[req.studentId].some(r => r.courseId === req.courseId)) {
          map[req.studentId].push(req);
        }
      }

      this.childCoursesMap.set(map);
    } catch (error) {
      console.error('Error loading children courses:', error);
    }
  }

  getChildCourses(studentId: string): EnrollmentRequestDto[] {
    return this.childCoursesMap()[studentId] || [];
  }

  viewChildDetails(child: ParentStudentDto): void {
    this.router.navigate(['/parent/child', child.studentId]);
  }

  goToNotifications(): void {
    this.router.navigate(['/notifications']);
  }

  goToEnrollmentApproval(): void {
    this.router.navigate(['/parent-enrollment-approval']);
  }

  goToLinkChild(): void {
    this.router.navigate(['/parent/link-child']);
  }

  goToDashboard(): void {
    this.router.navigate(['/parents/dashboard']);
  }

  goToFeeds(): void {
    this.router.navigate(['/feeds']);
  }

  goToProfile(): void {
    this.router.navigate(['/account/manage']);
  }

  trackById = (_: number, item: ParentStudentDto) => item.studentId;
}
