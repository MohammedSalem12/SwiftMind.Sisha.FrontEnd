import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { CourseService } from '@proxy/courses';
import type { CourseDto } from '@proxy/courses/dtos/models';
import { EnrollmentRequestService } from '@proxy/student-enrollments';
import type { EnrollmentRequestDto } from '@proxy/student-enrollments/models';
import { EnrollmentRequestStatus } from '@proxy/enums/enrollment-request-status.enum';
import { GroupService } from '@proxy/groups';
import type { GroupWithSchedulesDto } from '@proxy/groups/dtos/models';
import { AttendanceService } from '@proxy/attendances';
import type { StudentAttendanceReportDto } from '@proxy/attendances/dtos/models';
import { ExamGradeService } from '@proxy/exam-grades';
import type { ExamGradeDto } from '@proxy/exam-grades/dtos/models';
import { StudentService } from '@proxy/students';

@Component({
  selector: 'app-student-course-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="profile-page" dir="rtl">

      <!-- Hero Header -->
      <div class="hero-header">
        <button class="back-btn" (click)="goBack()">
          <i class="fas fa-arrow-right"></i>
        </button>
        <div class="hero-text" *ngIf="course()">
          <h1>{{ course()!.nameAr || course()!.nameEn }}</h1>
          <div class="hero-meta">
            <span *ngIf="course()!.code" class="hero-chip">{{ course()!.code }}</span>
            <span *ngIf="course()!.gradeName" class="hero-chip">{{ course()!.gradeName }}</span>
          </div>
        </div>
        <div class="hero-text" *ngIf="!course() && loading()">
          <h1>تحميل...</h1>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading()" class="loading-state">
        <div class="spinner"></div>
        <p>جاري تحميل بيانات المقرر...</p>
      </div>

      <!-- Error -->
      <div *ngIf="error() && !loading()" class="error-banner">
        <i class="fas fa-exclamation-circle me-2"></i>{{ error() }}
      </div>

      <div *ngIf="!loading()" class="content">

        <!-- ── Enrollment Status ─────────────────────────── -->
        <div class="section-card">
          <div class="section-title">
            <i class="fas fa-user-check me-2"></i>حالة التسجيل
          </div>

          <div *ngIf="!enrollment()" class="not-enrolled">
            <i class="fas fa-info-circle me-2"></i>لم تسجّل في هذا المقرر بعد
            <button class="btn-enroll" (click)="goToEnroll()">
              <i class="fas fa-plus me-1"></i> سجّل الآن
            </button>
          </div>

          <div *ngIf="enrollment()" class="enrollment-info">
            <div class="info-row">
              <span class="info-label"><i class="fas fa-certificate me-1"></i>الحالة</span>
              <span class="status-badge" [class]="statusClass()">{{ statusLabel() }}</span>
            </div>
            <div class="info-row" *ngIf="enrollment()!.teacherName">
              <span class="info-label"><i class="fas fa-chalkboard-teacher me-1"></i>المعلم</span>
              <span class="info-value">{{ enrollment()!.teacherName }}</span>
            </div>
            <div class="info-row" *ngIf="enrollment()!.groupName">
              <span class="info-label"><i class="fas fa-users me-1"></i>المجموعة</span>
              <span class="info-value">{{ enrollment()!.groupName }}</span>
            </div>
          </div>
        </div>

        <!-- ── Schedule ──────────────────────────────────── -->
        <div class="section-card" *ngIf="group() && group()!.schedules?.length">
          <div class="section-title">
            <i class="fas fa-calendar-alt me-2"></i>جدول الحصص
          </div>
          <div class="schedules">
            <div class="schedule-row" *ngFor="let s of group()!.schedules">
              <span class="day-chip">{{ getDayName(s.dayOfWeek) }}</span>
              <span class="schedule-time">
                <i class="fas fa-clock me-1"></i>
                {{ formatTime(s.startTime) }} — {{ formatTime(s.endTime) }}
              </span>
              <span class="schedule-location" *ngIf="s.location">
                <i class="fas fa-map-marker-alt me-1"></i>{{ s.location }}
              </span>
            </div>
          </div>
        </div>

        <!-- ── Attendance ─────────────────────────────────── -->
        <div class="section-card" *ngIf="attendance()">
          <div class="section-title">
            <i class="fas fa-calendar-check me-2"></i>الحضور — {{ currentMonthLabel() }}
          </div>
          <div class="attendance-stats">
            <div class="att-stat present">
              <div class="att-num">{{ attendance()!.attendedDays }}</div>
              <div class="att-label">حضور</div>
            </div>
            <div class="att-stat absent">
              <div class="att-num">{{ attendance()!.absentDays }}</div>
              <div class="att-label">غياب</div>
            </div>
            <div class="att-stat total">
              <div class="att-num">{{ attendance()!.totalDaysInMonth }}</div>
              <div class="att-label">إجمالي</div>
            </div>
          </div>
          <div class="att-bar-wrap">
            <div class="att-bar">
              <div class="att-fill"
                   [style.width.%]="attendance()!.attendancePercentage"
                   [class]="attBarClass()"></div>
            </div>
            <span class="att-pct" [class]="attPctClass()">{{ attendance()!.attendancePercentage }}%</span>
          </div>
          <div class="att-note" [class]="attBarClass()">
            <i class="fas fa-info-circle me-1"></i>
            <ng-container *ngIf="attendance()!.attendancePercentage >= 90">ممتاز! حافظ على هذا المستوى</ng-container>
            <ng-container *ngIf="attendance()!.attendancePercentage >= 75 && attendance()!.attendancePercentage < 90">جيد — حاول تحسين الحضور</ng-container>
            <ng-container *ngIf="attendance()!.attendancePercentage < 75">تحذير — نسبة الحضور أقل من 75%</ng-container>
          </div>
        </div>

        <div class="section-card" *ngIf="enrollment() && !attendance() && !loadingAttendance()">
          <div class="section-title"><i class="fas fa-calendar-check me-2"></i>الحضور</div>
          <div class="empty-sub">لا توجد بيانات حضور لهذا الشهر</div>
        </div>

        <!-- ── Grades ─────────────────────────────────────── -->
        <div class="section-card" *ngIf="grades().length > 0">
          <div class="section-title">
            <i class="fas fa-star me-2"></i>الدرجات
          </div>
          <div class="grades-list">
            <div *ngFor="let g of grades()" class="grade-row">
              <div class="grade-exam">
                <div class="exam-name">{{ g.examName || 'اختبار' }}</div>
                <div class="exam-code" *ngIf="g.examCode">{{ g.examCode }}</div>
              </div>
              <div class="grade-score">
                <span class="score-num" [class]="gradeClass(g)">{{ g.grade }}</span>
                <span class="score-max">/ {{ g.maxGrade }}</span>
              </div>
              <div class="grade-bar-wrap">
                <div class="grade-bar">
                  <div class="grade-fill" [class]="gradeClass(g)"
                       [style.width.%]="gradePercent(g)"></div>
                </div>
                <span class="grade-pct" [class]="gradeClass(g)">{{ gradePercent(g) }}%</span>
              </div>
            </div>
          </div>
          <div class="grades-avg" *ngIf="grades().length > 1">
            <span>المتوسط العام</span>
            <span class="avg-val" [class]="avgClass()">{{ avgGrade() }}%</span>
          </div>
        </div>

        <div class="section-card" *ngIf="enrollment() && grades().length === 0 && !loadingGrades()">
          <div class="section-title"><i class="fas fa-star me-2"></i>الدرجات</div>
          <div class="empty-sub">لا توجد درجات مسجّلة بعد</div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .profile-page {
      min-height: 100vh;
      background: #f4f6fb;
      padding-bottom: env(safe-area-inset-bottom);
    }

    /* ── Hero ────────────────────────────────────── */
    .hero-header {
      background: var(--ngx-hero-gradient);
      padding: 1.25rem 1rem;
      display: flex; align-items: flex-start; gap: 0.75rem;
    }
    .back-btn {
      background: rgba(255,255,255,0.2); border: none; color: white;
      width: 40px; height: 40px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 1rem; cursor: pointer; flex-shrink: 0; margin-top: 2px;
      touch-action: manipulation;
    }
    .hero-text {
      flex: 1;
      h1 { font-size: 1.1rem; font-weight: 700; color: white; margin: 0 0 0.4rem; }
    }
    .hero-meta { display: flex; flex-wrap: wrap; gap: 0.4rem; }
    .hero-chip {
      background: rgba(255,255,255,0.22); color: white;
      padding: 0.15rem 0.55rem; border-radius: 6px;
      font-size: 0.75rem; font-weight: 600;
    }

    /* ── Loading / Error ──────────────────────────── */
    .loading-state {
      display: flex; flex-direction: column; align-items: center;
      gap: 0.75rem; padding: 3rem 1rem; color: #718096;
      p { font-size: 0.9rem; margin: 0; }
    }
    .spinner {
      width: 36px; height: 36px;
      border: 3px solid #e2e8f0; border-top-color: var(--ngx-primary);
      border-radius: 50%; animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .error-banner {
      margin: 0.75rem 1rem;
      background: #fff5f5; color: #c53030;
      border: 1px solid #feb2b2; border-radius: 10px;
      padding: 0.75rem 1rem; font-size: 0.88rem;
    }

    /* ── Content ──────────────────────────────────── */
    .content { padding: 0.75rem; display: flex; flex-direction: column; gap: 0.75rem; }

    .section-card {
      background: white; border-radius: 14px;
      padding: 1rem; box-shadow: 0 1px 6px rgba(0,0,0,0.07);
    }
    .section-title {
      font-size: 0.88rem; font-weight: 700; color: #4a5568;
      margin-bottom: 0.875rem;
      i { color: var(--ngx-primary); }
    }

    /* ── Enrollment ───────────────────────────────── */
    .not-enrolled {
      display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;
      font-size: 0.88rem; color: #718096;
    }
    .btn-enroll {
      background: var(--ngx-hero-gradient);
      color: white; border: none; border-radius: 8px;
      padding: 0.4rem 0.9rem; font-size: 0.82rem;
      cursor: pointer; white-space: nowrap;
    }
    .enrollment-info { display: flex; flex-direction: column; gap: 0.6rem; }
    .info-row {
      display: flex; align-items: center; gap: 0.75rem;
      font-size: 0.88rem;
    }
    .info-label { color: #718096; white-space: nowrap; min-width: 90px; }
    .info-value { font-weight: 600; color: #1a202c; }

    .status-badge {
      display: inline-flex; align-items: center;
      padding: 0.2rem 0.65rem; border-radius: 8px;
      font-size: 0.78rem; font-weight: 700;
    }
    .status-pending  { background: #fffbeb; color: #d97706; }
    .status-approved { background: #f0fdf4; color: #15803d; }
    .status-rejected { background: #fff5f5; color: #c53030; }

    /* ── Schedule ─────────────────────────────────── */
    .schedules { display: flex; flex-direction: column; gap: 0.5rem; }
    .schedule-row {
      display: flex; align-items: center; flex-wrap: wrap; gap: 0.5rem;
      background: #f7fafc; border-radius: 8px;
      padding: 0.5rem 0.75rem; font-size: 0.82rem;
    }
    .day-chip {
      background: #edf2ff; color: var(--ngx-primary);
      padding: 0.15rem 0.5rem; border-radius: 4px;
      font-weight: 700; font-size: 0.75rem;
    }
    .schedule-time { color: #4a5568; }
    .schedule-location { color: #718096; }

    /* ── Attendance ───────────────────────────────── */
    .attendance-stats {
      display: flex; gap: 0; margin-bottom: 0.875rem;
    }
    .att-stat {
      flex: 1; text-align: center; padding: 0.75rem 0.5rem;
      border-radius: 10px; margin: 0 0.2rem;
    }
    .att-stat.present { background: #f0fdf4; }
    .att-stat.absent  { background: #fff5f5; }
    .att-stat.total   { background: #f7fafc; }
    .att-num {
      font-size: 1.5rem; font-weight: 800;
      .att-stat.present & { color: #15803d; }
      .att-stat.absent &  { color: #c53030; }
      .att-stat.total &   { color: #4a5568; }
    }
    .att-label { font-size: 0.72rem; color: #718096; margin-top: 0.1rem; }

    .att-bar-wrap {
      display: flex; align-items: center; gap: 0.75rem;
      margin-bottom: 0.5rem;
    }
    .att-bar {
      flex: 1; height: 8px; background: #e2e8f0;
      border-radius: 4px; overflow: hidden;
    }
    .att-fill {
      height: 100%; border-radius: 4px; transition: width 0.4s ease;
      &.rate-excellent { background: #22c55e; }
      &.rate-good      { background: #f59e0b; }
      &.rate-poor      { background: #ef4444; }
    }
    .att-pct {
      font-size: 0.85rem; font-weight: 700; white-space: nowrap;
      &.rate-excellent { color: #15803d; }
      &.rate-good      { color: #d97706; }
      &.rate-poor      { color: #c53030; }
    }
    .att-note {
      font-size: 0.78rem; padding: 0.4rem 0.6rem;
      border-radius: 6px;
      &.rate-excellent { background: #f0fdf4; color: #15803d; }
      &.rate-good      { background: #fffbeb; color: #d97706; }
      &.rate-poor      { background: #fff5f5; color: #c53030; }
    }

    /* ── Grades ───────────────────────────────────── */
    .grades-list { display: flex; flex-direction: column; gap: 0.875rem; }
    .grade-row {
      display: flex; flex-direction: column; gap: 0.3rem;
    }
    .grade-exam {
      display: flex; align-items: baseline; gap: 0.5rem;
      .exam-name { font-weight: 600; color: #1a202c; font-size: 0.9rem; }
      .exam-code { font-size: 0.75rem; color: #a0aec0; }
    }
    .grade-score {
      display: flex; align-items: baseline; gap: 0.2rem;
      .score-num {
        font-size: 1.3rem; font-weight: 800;
        &.grade-excellent { color: #15803d; }
        &.grade-good      { color: #d97706; }
        &.grade-poor      { color: #c53030; }
      }
      .score-max { font-size: 0.82rem; color: #a0aec0; }
    }
    .grade-bar-wrap {
      display: flex; align-items: center; gap: 0.6rem;
    }
    .grade-bar {
      flex: 1; height: 6px; background: #e2e8f0;
      border-radius: 3px; overflow: hidden;
    }
    .grade-fill {
      height: 100%; border-radius: 3px; transition: width 0.4s ease;
      &.grade-excellent { background: #22c55e; }
      &.grade-good      { background: #f59e0b; }
      &.grade-poor      { background: #ef4444; }
    }
    .grade-pct {
      font-size: 0.75rem; font-weight: 700; white-space: nowrap;
      &.grade-excellent { color: #15803d; }
      &.grade-good      { color: #d97706; }
      &.grade-poor      { color: #c53030; }
    }
    .grades-avg {
      display: flex; justify-content: space-between; align-items: center;
      margin-top: 0.875rem; padding-top: 0.75rem;
      border-top: 1px solid #e2e8f0;
      font-size: 0.88rem; color: #4a5568; font-weight: 600;
    }
    .avg-val {
      font-size: 1rem; font-weight: 800;
      &.grade-excellent { color: #15803d; }
      &.grade-good      { color: #d97706; }
      &.grade-poor      { color: #c53030; }
    }

    /* ── Empty sub ────────────────────────────────── */
    .empty-sub {
      font-size: 0.85rem; color: #a0aec0; text-align: center; padding: 0.75rem 0;
    }

    @media (min-width: 480px) {
      .content { max-width: 480px; margin: 0 auto; }
    }
  `]
})
export class StudentCourseProfileComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly courseService = inject(CourseService);
  private readonly enrollmentRequestService = inject(EnrollmentRequestService);
  private readonly groupService = inject(GroupService);
  private readonly attendanceService = inject(AttendanceService);
  private readonly examGradeService = inject(ExamGradeService);
  private readonly studentService = inject(StudentService);

  courseId = signal<string>('');
  course = signal<CourseDto | null>(null);
  enrollment = signal<EnrollmentRequestDto | null>(null);
  group = signal<GroupWithSchedulesDto | null>(null);
  attendance = signal<StudentAttendanceReportDto | null>(null);
  grades = signal<ExamGradeDto[]>([]);

  loading = signal(false);
  loadingAttendance = signal(false);
  loadingGrades = signal(false);
  error = signal<string | null>(null);

  currentMonthLabel = computed(() => {
    const now = new Date();
    return now.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
  });

  statusLabel = computed(() => {
    const e = this.enrollment();
    if (!e) return '';
    switch (e.status) {
      case EnrollmentRequestStatus.Approved: return 'مسجّل ✓';
      case EnrollmentRequestStatus.Pending:  return 'قيد المراجعة';
      case EnrollmentRequestStatus.Rejected: return 'مرفوض';
      default: return '';
    }
  });

  statusClass = computed(() => {
    switch (this.enrollment()?.status) {
      case EnrollmentRequestStatus.Approved: return 'status-badge status-approved';
      case EnrollmentRequestStatus.Pending:  return 'status-badge status-pending';
      case EnrollmentRequestStatus.Rejected: return 'status-badge status-rejected';
      default: return 'status-badge';
    }
  });

  attBarClass = computed(() => {
    const pct = this.attendance()?.attendancePercentage ?? 0;
    if (pct >= 90) return 'rate-excellent';
    if (pct >= 75) return 'rate-good';
    return 'rate-poor';
  });

  attPctClass = computed(() => this.attBarClass());

  avgGrade = computed(() => {
    const gs = this.grades();
    if (!gs.length) return 0;
    return Math.round(gs.reduce((s, g) => s + (g.maxGrade ? g.grade / g.maxGrade * 100 : 0), 0) / gs.length);
  });

  avgClass = computed(() => this.gradeClass({ grade: this.avgGrade(), maxGrade: 100 } as any));

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('courseId');
    if (!id) { this.router.navigate(['/student/courses']); return; }
    this.courseId.set(id);

    this.loading.set(true);
    this.error.set(null);

    try {
      const [course, requests, student] = await Promise.all([
        lastValueFrom(this.courseService.get(id)).catch(() => null),
        lastValueFrom(this.enrollmentRequestService.getRequestsForCurrentStudent()).catch(() => [] as any),
        lastValueFrom(this.studentService.getCurrentStudent()).catch(() => null),
      ]);

      if (course) this.course.set(course);

      // Find the enrollment request for this course
      const enroll = (requests as any[]).find((r: any) => r.courseId === id) ?? null;
      this.enrollment.set(enroll);

      // Load group schedule when we have teacher + course
      if (enroll?.teacherId) {
        try {
          const groups = await lastValueFrom(
            this.groupService.getGroupsForTeacherAndCourse(enroll.teacherId, id)
          );
          const myGroup = enroll.groupId
            ? groups.find(g => g.groupId === enroll.groupId) ?? groups[0] ?? null
            : groups[0] ?? null;
          this.group.set(myGroup);
        } catch { /* non-critical */ }
      }

      // Load attendance for current month
      if (student?.id) {
        this.loadingAttendance.set(true);
        try {
          const now = new Date();
          const date = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
          const attResult = await lastValueFrom(
            this.attendanceService.getStudentAttendanceReport({
              courseId: id,
              studentId: student.id,
              date,
              skipCount: 0,
              maxResultCount: 1,
            })
          );
          const record = attResult?.items?.[0] ?? null;
          this.attendance.set(record);
        } catch { /* non-critical */ } finally {
          this.loadingAttendance.set(false);
        }
      }

      // Load grades when enrollment exists and is approved
      const enrollmentId = enroll?.id;
      if (enrollmentId && enroll.status === EnrollmentRequestStatus.Approved) {
        this.loadingGrades.set(true);
        try {
          const gs = await lastValueFrom(
            this.examGradeService.getGradesByEnrollment(enrollmentId)
          );
          this.grades.set(gs ?? []);
        } catch { /* non-critical */ } finally {
          this.loadingGrades.set(false);
        }
      }

    } catch (err) {
      console.error('Error loading course profile:', err);
      this.error.set('حدث خطأ أثناء تحميل بيانات المقرر');
    } finally {
      this.loading.set(false);
    }
  }

  gradePercent(g: ExamGradeDto): number {
    return g.maxGrade ? Math.round(g.grade / g.maxGrade * 100) : 0;
  }

  gradeClass(g: ExamGradeDto): string {
    const pct = this.gradePercent(g);
    if (pct >= 85) return 'grade-excellent';
    if (pct >= 60) return 'grade-good';
    return 'grade-poor';
  }

  getDayName(dayOfWeek: number): string {
    return ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][dayOfWeek] ?? '';
  }

  formatTime(time: string): string {
    if (!time) return '';
    const parts = time.split(':');
    if (parts.length >= 2) {
      const h = parseInt(parts[0]);
      const period = h >= 12 ? 'م' : 'ص';
      const disp = h > 12 ? h - 12 : h === 0 ? 12 : h;
      return `${disp}:${parts[1]} ${period}`;
    }
    return time;
  }

  goBack(): void { this.router.navigate(['/student/courses']); }
  goToEnroll(): void { this.router.navigate(['/student/enroll', this.courseId()]); }
}
