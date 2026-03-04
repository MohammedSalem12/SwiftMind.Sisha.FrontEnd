import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { CurrentUserInfoService } from '@proxy/common';
import { TeacherService } from '@proxy/teachers';
import type { CourseDto } from '@proxy/courses/dtos/models';
import { StudentEnrollmentService } from '@proxy/student-enrollments';
import type { EnrolledStudentDto } from '@proxy/student-enrollments/dtos/models';

@Component({
  selector: 'app-teacher-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="teacher-home" dir="rtl">
      <div class="container py-4">

        <!-- Welcome Header -->
        <div class="welcome-section mb-4">
          <h1 class="mb-1">مرحباً بك</h1>
          <p class="mb-0" style="opacity:0.85">لوحة التحكم للمعلم</p>
        </div>

        <!-- Loading -->
        <div *ngIf="loading()" class="text-center py-5">
          <div class="spinner-border text-primary" role="status"></div>
        </div>

        <!-- Courses -->
        <div *ngIf="!loading()">
          <div class="section-header mb-3">
            <h2 class="h4 mb-0">المقررات الدراسية</h2>
            <p class="text-muted small mb-0">المقررات المسندة إليك</p>
          </div>

          <div *ngIf="courses().length === 0" class="alert-empty">
            <i class="fas fa-info-circle"></i> لا توجد مقررات مسندة إليك حالياً
          </div>

          <div class="courses-list">
            <div *ngFor="let course of courses(); trackBy: trackById" class="course-block"
                 [class.expanded]="expandedCourseId() === course.id">

              <!-- Course Row -->
              <div class="course-row">
                <div class="course-icon-wrap">
                  <i class="fas fa-book-open"></i>
                </div>
                <div class="course-meta">
                  <div class="course-name">{{ course.nameAr }}</div>
                  <div class="course-sub">
                    <span class="badge-code">{{ course.code }}</span>
                    <span class="badge-grade">{{ course.gradeName }}</span>
                  </div>
                </div>
                <div class="course-actions">
                  <button class="btn-students" (click)="toggleStudents(course)"
                          [class.active]="expandedCourseId() === course.id">
                    <i class="fas fa-users"></i>
                    <span *ngIf="expandedCourseId() !== course.id">الطلاب</span>
                    <span *ngIf="expandedCourseId() === course.id">إخفاء</span>
                    <span *ngIf="enrolledStudentsMap()[course.id]?.length"
                          class="student-count">{{ enrolledStudentsMap()[course.id]?.length }}</span>
                  </button>
                  <button class="btn-groups" (click)="goToGroups(course)">
                    <i class="fas fa-layer-group"></i> المجموعات
                  </button>
                </div>
              </div>

              <!-- Students Panel -->
              <div *ngIf="expandedCourseId() === course.id" class="students-panel">

                <div *ngIf="loadingStudentsCourseId() === course.id" class="students-loading">
                  <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
                  <span>جاري تحميل الطلاب...</span>
                </div>

                <ng-container *ngIf="loadingStudentsCourseId() !== course.id">
                  <div *ngIf="!enrolledStudentsMap()[course.id]?.length" class="no-students">
                    <i class="fas fa-user-slash"></i> لا يوجد طلاب مسجلون في هذا المقرر
                  </div>

                  <div *ngIf="enrolledStudentsMap()[course.id]?.length" class="students-table-wrap">
                    <div class="students-count-bar">
                      <i class="fas fa-user-graduate"></i>
                      {{ enrolledStudentsMap()[course.id]?.length }} طالب مسجل
                    </div>
                    <table class="students-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>اسم الطالب</th>
                          <th>كود الطالب</th>
                          <th>تاريخ التسجيل</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr *ngFor="let s of enrolledStudentsMap()[course.id]; let i = index">
                          <td>{{ i + 1 }}</td>
                          <td>{{ s.studentName }}</td>
                          <td><span class="code-badge">{{ s.studentCode }}</span></td>
                          <td>{{ formatDate(s.enrolledAt) }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </ng-container>

              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="quick-actions mt-5">
          <h3 class="mb-3">روابط سريعة</h3>
          <div class="row g-3">
            <div class="col-6 col-md-3">
              <button class="action-btn w-100" (click)="goToAttendance()">
                <i class="fas fa-clipboard-check"></i>
                <span>الحضور</span>
              </button>
            </div>
            <div class="col-6 col-md-3">
              <button class="action-btn w-100 action-marks" (click)="goToMarksEntry()">
                <i class="fas fa-star-half-alt"></i>
                <span>تسجيل الدرجات</span>
              </button>
            </div>
            <div class="col-6 col-md-3">
              <button class="action-btn w-100" (click)="goToGroups()">
                <i class="fas fa-users"></i>
                <span>المجموعات</span>
              </button>
            </div>
            <div class="col-6 col-md-3">
              <button class="action-btn w-100" (click)="goToFeeds()">
                <i class="fas fa-rss"></i>
                <span>النشرات</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .teacher-home { min-height: calc(100vh - 200px); background: #f0f2f5; }

    .welcome-section {
      padding: 1.5rem 2rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white; border-radius: 14px;
      box-shadow: 0 4px 12px rgba(102,126,234,0.3);
    }
    .welcome-section h1 { font-size: 1.8rem; font-weight: 700; margin: 0; }

    .section-header h2 { font-weight: 700; color: #1a202c; }

    .alert-empty {
      background: #e8f4fd; border: 1px solid #bde0fd; border-radius: 10px;
      padding: 1rem 1.25rem; color: #1e6fa8; font-size: 0.95rem;
      display: flex; align-items: center; gap: 0.5rem;
    }

    .courses-list { display: flex; flex-direction: column; gap: 0.75rem; }

    .course-block {
      background: white; border-radius: 14px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      border: 2px solid transparent; transition: border-color 0.2s;
      overflow: hidden;
    }
    .course-block.expanded { border-color: #667eea; }

    .course-row {
      display: flex; align-items: center; gap: 1rem;
      padding: 1rem 1.25rem;
    }

    .course-icon-wrap {
      width: 48px; height: 48px; flex-shrink: 0;
      background: linear-gradient(135deg, #667eea, #764ba2);
      border-radius: 12px; display: flex; align-items: center;
      justify-content: center; color: white; font-size: 1.2rem;
    }

    .course-meta { flex: 1; min-width: 0; }
    .course-name { font-weight: 700; color: #1a202c; font-size: 1rem; margin-bottom: 0.3rem; }
    .course-sub { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .badge-code {
      background: #ede9fe; color: #667eea; border-radius: 5px;
      padding: 0.15rem 0.5rem; font-size: 0.75rem; font-weight: 700;
    }
    .badge-grade {
      background: #f0fdf4; color: #15803d; border-radius: 5px;
      padding: 0.15rem 0.5rem; font-size: 0.75rem; font-weight: 600;
    }

    .course-actions { display: flex; gap: 0.5rem; flex-shrink: 0; }

    .btn-students {
      background: #f5f3ff; border: 1.5px solid #c4b5fd; color: #667eea;
      border-radius: 8px; padding: 0.4rem 0.85rem; font-size: 0.82rem;
      font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.35rem;
      transition: all 0.15s;
    }
    .btn-students:hover, .btn-students.active {
      background: #667eea; color: white; border-color: #667eea;
    }
    .student-count {
      background: #667eea; color: white; border-radius: 20px;
      padding: 0.05rem 0.45rem; font-size: 0.7rem;
    }
    .btn-students.active .student-count { background: white; color: #667eea; }

    .btn-groups {
      background: white; border: 1.5px solid #e5e7eb; color: #374151;
      border-radius: 8px; padding: 0.4rem 0.85rem; font-size: 0.82rem;
      font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.35rem;
      transition: all 0.15s;
    }
    .btn-groups:hover { border-color: #667eea; color: #667eea; background: #f5f3ff; }

    .students-panel {
      border-top: 1px solid #f0f0f0; padding: 1rem 1.25rem 1.25rem;
      background: #fafbff;
    }

    .students-loading {
      display: flex; align-items: center; gap: 0.5rem;
      color: #6b7280; font-size: 0.9rem; padding: 0.5rem 0;
    }

    .no-students {
      color: #6b7280; font-size: 0.9rem; padding: 0.5rem 0;
      display: flex; align-items: center; gap: 0.5rem;
    }

    .students-count-bar {
      font-size: 0.85rem; font-weight: 600; color: #667eea;
      margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.4rem;
    }

    .students-table-wrap { overflow-x: auto; }
    .students-table {
      width: 100%; border-collapse: collapse; font-size: 0.88rem;
    }
    .students-table th {
      background: #f5f3ff; color: #667eea; font-weight: 700;
      padding: 0.6rem 0.75rem; text-align: right; border-bottom: 2px solid #e5e7eb;
      white-space: nowrap;
    }
    .students-table td {
      padding: 0.55rem 0.75rem; color: #374151; border-bottom: 1px solid #f3f4f6;
      text-align: right;
    }
    .students-table tr:last-child td { border-bottom: none; }
    .students-table tr:hover td { background: #f9f7ff; }
    .code-badge {
      background: #ede9fe; color: #5c46c0; border-radius: 5px;
      padding: 0.1rem 0.45rem; font-size: 0.75rem; font-weight: 700;
    }

    .quick-actions h3 { font-size: 1.3rem; font-weight: 700; color: #1a202c; }
    .action-btn {
      background: white; border: 2px solid #e5e7eb; border-radius: 12px;
      padding: 1.25rem; display: flex; flex-direction: column; align-items: center;
      gap: 0.6rem; cursor: pointer; transition: all 0.2s;
    }
    .action-btn:hover { border-color: #667eea; background: #f5f3ff; transform: translateY(-2px); }
    .action-btn i { font-size: 1.75rem; color: #667eea; }
    .action-btn span { font-size: 0.9rem; font-weight: 600; color: #1a202c; }
    .action-btn.action-marks:hover { border-color: #f5576c; background: #fff0f3; }
    .action-btn.action-marks i { color: #f5576c; }

    @media (max-width: 600px) {
      .course-row { flex-wrap: wrap; }
      .course-actions { width: 100%; }
      .btn-students, .btn-groups { flex: 1; justify-content: center; }
    }
  `],
})
export class TeacherHomeComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly currentUserService = inject(CurrentUserInfoService);
  private readonly teacherService = inject(TeacherService);
  private readonly enrollmentService = inject(StudentEnrollmentService);

  courses = signal<CourseDto[]>([]);
  loading = signal(false);
  expandedCourseId = signal<string | null>(null);
  loadingStudentsCourseId = signal<string | null>(null);
  enrolledStudentsMap = signal<Record<string, EnrolledStudentDto[]>>({});

  async ngOnInit(): Promise<void> {
    await this.loadTeacherCourses();
  }

  private async loadTeacherCourses(): Promise<void> {
    this.loading.set(true);
    try {
      const userInfo = await lastValueFrom(this.currentUserService.getCurrentUserActorInfo());
      const teacherId = userInfo?.actorId;
      if (!teacherId) { this.courses.set([]); return; }
      const courses = await lastValueFrom(this.teacherService.getTeacherCourses(teacherId));
      this.courses.set(courses || []);
    } catch (error) {
      console.error('Error loading teacher courses:', error);
    } finally {
      this.loading.set(false);
    }
  }

  async toggleStudents(course: CourseDto): Promise<void> {
    if (this.expandedCourseId() === course.id) {
      this.expandedCourseId.set(null);
      return;
    }
    this.expandedCourseId.set(course.id);

    // Load only if not already loaded
    if (this.enrolledStudentsMap()[course.id!]) return;

    this.loadingStudentsCourseId.set(course.id!);
    try {
      const students = await lastValueFrom(this.enrollmentService.getEnrolledStudentsByCourse(course.id!));
      this.enrolledStudentsMap.update(m => ({ ...m, [course.id!]: students || [] }));
    } catch (err) {
      console.error('Error loading students:', err);
      this.enrolledStudentsMap.update(m => ({ ...m, [course.id!]: [] }));
    } finally {
      this.loadingStudentsCourseId.set(null);
    }
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  goToGroups(course?: CourseDto): void {
    if (course) {
      this.router.navigate(['/teacher-groups'], { queryParams: { courseId: course.id } });
    } else {
      this.router.navigate(['/teacher-groups']);
    }
  }

  goToAttendance(): void { this.router.navigate(['/attendance']); }
  goToMarksEntry(): void { this.router.navigate(['/marks-entry']); }
  goToFeeds(): void { this.router.navigate(['/feeds']); }
  goToSelfEnroll(): void { this.router.navigate(['/teacher/enroll']); }

  trackById = (_: number, item: CourseDto) => item.id;
}
