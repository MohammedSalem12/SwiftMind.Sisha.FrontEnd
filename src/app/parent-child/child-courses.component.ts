import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { RestService, ConfigStateService } from '@abp/ng.core';
import { ParentService } from '@proxy/parents';
import { ParentStudentDto } from '@proxy/parents/models';

interface EnrollmentWithDetailsDto {
  id: string;
  studentId: string;
  courseId: string;
  teacherId: string;
  groupId?: string;
  enrolledAt: string;
  courseName?: string;
  courseCode?: string;
  teacherName?: string;
  groupName?: string;
  gradeName?: string;
}

@Component({
  selector: 'app-child-courses',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="child-courses-container">
      <div class="container py-4">
        <!-- Back Button & Header -->
        <div class="page-header mb-4">
          <button class="btn btn-link p-0 back-btn" (click)="goBack()">
            <i class="fas fa-arrow-right me-2"></i>
            العودة
          </button>
          <h1 class="mt-2">
            <i class="fas fa-book me-2"></i>
            مقررات {{ childName() }}
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

        <!-- Courses Content -->
        <div *ngIf="!loading() && !error()">
          <!-- Summary Card -->
          <div class="summary-section mb-4">
            <div class="row g-3">
              <div class="col-md-4">
                <div class="summary-card bg-courses">
                  <div class="summary-icon">
                    <i class="fas fa-book-open"></i>
                  </div>
                  <div class="summary-content">
                    <span class="summary-value">{{ enrollments().length }}</span>
                    <span class="summary-label">المقررات المسجلة</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div *ngIf="enrollments().length === 0" class="empty-state">
            <i class="fas fa-book-reader"></i>
            <h3>لا توجد مقررات مسجلة</h3>
            <p>لم يتم تسجيل الطالب في أي مقرر بعد</p>
          </div>

          <!-- Courses Grid -->
          <div *ngIf="enrollments().length > 0" class="courses-grid">
            <div class="row g-4">
              <div class="col-md-6 col-lg-4" *ngFor="let enrollment of enrollments()">
                <div class="course-card">
                  <div class="course-card-header">
                    <div class="course-icon">
                      <i class="fas fa-book"></i>
                    </div>
                  </div>
                  <div class="course-card-body">
                    <h3 class="course-title">{{ enrollment.courseName || 'مقرر' }}</h3>
                    <span class="course-code badge bg-primary mb-3">{{ enrollment.courseCode }}</span>
                    
                    <div class="course-details">
                      <div class="detail-item" *ngIf="enrollment.teacherName">
                        <i class="fas fa-chalkboard-teacher"></i>
                        <span>{{ enrollment.teacherName }}</span>
                      </div>
                      <div class="detail-item" *ngIf="enrollment.groupName">
                        <i class="fas fa-users"></i>
                        <span>{{ enrollment.groupName }}</span>
                      </div>
                      <div class="detail-item">
                        <i class="fas fa-calendar-alt"></i>
                        <span>{{ enrollment.enrolledAt | date:'shortDate' }}</span>
                      </div>
                    </div>

                    <div class="course-actions mt-3">
                      <button class="btn btn-outline-primary btn-sm" (click)="viewCourseGrades(enrollment)">
                        <i class="fas fa-chart-line me-1"></i>
                        الدرجات
                      </button>
                      <button class="btn btn-outline-secondary btn-sm" (click)="viewCourseAttendance(enrollment)">
                        <i class="fas fa-calendar-check me-1"></i>
                        الحضور
                      </button>
                    </div>
                  </div>
                </div>
              </div>
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
            <button class="btn btn-outline-primary" (click)="navigateTo('attendance')">
              <i class="fas fa-calendar-check me-1"></i>
              الحضور
            </button>
            <button class="btn btn-primary active">
              <i class="fas fa-book me-1"></i>
              المقررات
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .child-courses-container {
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

    .summary-card {
      display: flex;
      align-items: center;
      padding: 1.5rem;
      border-radius: 12px;
      color: white;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }

    .summary-card.bg-courses {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
      font-size: 2rem;
      font-weight: 700;
    }

    .summary-label {
      font-size: 0.875rem;
      opacity: 0.9;
    }

    .course-card {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      transition: all 0.3s ease;
      height: 100%;
    }

    .course-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 16px rgba(0,0,0,0.15);
    }

    .course-card-header {
      background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
      padding: 2rem;
      text-align: center;
    }

    .course-icon {
      width: 70px;
      height: 70px;
      background: rgba(255,255,255,0.2);
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 3px solid rgba(255,255,255,0.3);
    }

    .course-icon i {
      font-size: 1.75rem;
      color: white;
    }

    .course-card-body {
      padding: 1.5rem;
      text-align: center;
    }

    .course-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1a202c;
      margin-bottom: 0.5rem;
    }

    .course-code {
      font-size: 0.875rem;
    }

    .course-details {
      text-align: right;
      margin-top: 1rem;
    }

    .detail-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0;
      border-bottom: 1px solid #f0f0f0;
      font-size: 0.875rem;
      color: #6b7280;
    }

    .detail-item:last-child {
      border-bottom: none;
    }

    .detail-item i {
      color: #667eea;
      width: 20px;
    }

    .course-actions {
      display: flex;
      gap: 0.5rem;
      justify-content: center;
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
      .course-actions {
        flex-direction: column;
      }
    }
  `]
})
export class ChildCoursesComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly restService = inject(RestService);
  private readonly parentService = inject(ParentService);
  private readonly configStateService = inject(ConfigStateService);

  studentId = signal<string>('');
  childName = signal<string>('');
  childCode = signal<string>('');
  childGrade = signal<string>('');
  enrollments = signal<EnrollmentWithDetailsDto[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    const studentIdParam = this.route.snapshot.paramMap.get('studentId');
    if (!studentIdParam) {
      this.error.set('معرف الطالب غير صحيح');
      return;
    }
    this.studentId.set(studentIdParam);
    await this.loadChildInfo();
    await this.loadEnrollments();
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

  private async loadEnrollments(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      // Call the student enrollment endpoint to get enrollments
      // This will need a backend endpoint that supports filtering by studentId
      const result = await lastValueFrom(
        this.restService.request<any, any>({
          method: 'GET',
          url: '/api/app/student-enrollment/by-student',
          params: { studentId: this.studentId() }
        })
      );
      
      this.enrollments.set(result || []);
    } catch (err: any) {
      // If the endpoint doesn't exist yet, try alternative approach
      console.error('Error loading enrollments:', err);
      
      // Fallback: Try to get enrollments from exam grades
      try {
        await this.loadEnrollmentsFromGrades();
      } catch {
        this.error.set('حدث خطأ أثناء تحميل المقررات');
      }
    } finally {
      this.loading.set(false);
    }
  }

  private async loadEnrollmentsFromGrades(): Promise<void> {
    // Extract unique courses from exam grades as fallback
    try {
      const gradesResult = await lastValueFrom(
        this.restService.request<any, any>({
          method: 'GET',
          url: `/api/app/exam-grade/grades-by-student/${this.studentId()}`,
          params: { skipCount: 0, maxResultCount: 100 }
        })
      );

      const items = gradesResult?.items || [];
      const uniqueCourses = new Map<string, EnrollmentWithDetailsDto>();
      
      for (const grade of items) {
        if (grade.enrollmentId && !uniqueCourses.has(grade.enrollmentId)) {
          uniqueCourses.set(grade.enrollmentId, {
            id: grade.enrollmentId,
            studentId: this.studentId(),
            courseId: '',
            teacherId: '',
            enrolledAt: '',
            courseName: grade.courseName,
            courseCode: grade.courseCode || ''
          });
        }
      }

      this.enrollments.set(Array.from(uniqueCourses.values()));
    } catch (err) {
      console.error('Fallback also failed:', err);
      this.enrollments.set([]);
    }
  }

  viewCourseGrades(enrollment: EnrollmentWithDetailsDto): void {
    this.navigateTo('grades');
  }

  viewCourseAttendance(enrollment: EnrollmentWithDetailsDto): void {
    this.navigateTo('attendance');
  }

  navigateTo(tab: string): void {
    this.router.navigate(['..', tab], { relativeTo: this.route });
  }

  goBack(): void {
    this.router.navigate(['/parent']);
  }
}
