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

      <!-- Top Bar -->
      <div class="top-bar">
        <button class="top-back-btn" (click)="goBack()">
          <i class="fas fa-arrow-right"></i>
        </button>
        <div class="top-bar-text">
          @if (course()) {
            <h1>{{ course()!.nameAr || course()!.nameEn }}</h1>
            <div class="top-chips">
              @if (course()!.code) {
                <span class="top-chip">{{ course()!.code }}</span>
              }
              @if (course()!.gradeName) {
                <span class="top-chip">{{ course()!.gradeName }}</span>
              }
            </div>
          } @else if (loading()) {
            <h1>تحميل...</h1>
          }
        </div>
        <div class="top-icon">
          <i class="fas fa-book-open"></i>
        </div>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>جاري تحميل بيانات المقرر...</p>
        </div>
      }

      <!-- Error -->
      @if (error() && !loading()) {
        <div class="error-banner">
          <i class="fas fa-exclamation-circle"></i>{{ error() }}
        </div>
      }

      @if (!loading()) {
        <div class="content">

          <!-- Enrollment Status -->
          <div class="section-card">
            <div class="section-title">
              <i class="fas fa-user-check"></i> حالة التسجيل · Enrollment
            </div>

            @if (!enrollment()) {
              <div class="not-enrolled">
                <i class="fas fa-info-circle"></i>
                <span>لم تسجّل في هذا المقرر بعد</span>
                <button class="btn-enroll" (click)="goToEnroll()">
                  <i class="fas fa-plus"></i> سجّل الآن
                </button>
              </div>
            } @else {
              <div class="enrollment-info">
                <div class="info-row">
                  <span class="info-label"><i class="fas fa-certificate"></i> الحالة</span>
                  <span class="status-badge" [class]="statusClass()">{{ statusLabel() }}</span>
                </div>
                @if (enrollment()!.teacherName) {
                  <div class="info-row">
                    <span class="info-label"><i class="fas fa-chalkboard-teacher"></i> المعلم</span>
                    <span class="info-value">{{ enrollment()!.teacherName }}</span>
                  </div>
                }
                @if (enrollment()!.groupName) {
                  <div class="info-row">
                    <span class="info-label"><i class="fas fa-users"></i> المجموعة</span>
                    <span class="info-value">{{ enrollment()!.groupName }}</span>
                  </div>
                }
              </div>
            }
          </div>

          <!-- Schedule -->
          @if (group() && group()!.schedules?.length) {
            <div class="section-card">
              <div class="section-title">
                <i class="fas fa-calendar-alt"></i> جدول الحصص · Schedule
              </div>
              <div class="schedules">
                @for (s of group()!.schedules; track $index) {
                  <div class="schedule-row">
                    <span class="day-chip">{{ getDayName(s.dayOfWeek) }}</span>
                    <span class="schedule-time">
                      <i class="fas fa-clock"></i>
                      {{ formatTime(s.startTime) }} — {{ formatTime(s.endTime) }}
                    </span>
                    @if (s.location) {
                      <span class="schedule-location">
                        <i class="fas fa-map-marker-alt"></i>{{ s.location }}
                      </span>
                    }
                  </div>
                }
              </div>
            </div>
          }

          <!-- Attendance -->
          @if (attendance()) {
            <div class="section-card">
              <div class="section-title">
                <i class="fas fa-calendar-check"></i> الحضور — {{ currentMonthLabel() }}
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
                <i class="fas fa-info-circle"></i>
                @if (attendance()!.attendancePercentage >= 90) {
                  ممتاز! حافظ على هذا المستوى
                } @else if (attendance()!.attendancePercentage >= 75) {
                  جيد — حاول تحسين الحضور
                } @else {
                  تحذير — نسبة الحضور أقل من 75%
                }
              </div>
            </div>
          }

          @if (enrollment() && !attendance() && !loadingAttendance()) {
            <div class="section-card">
              <div class="section-title"><i class="fas fa-calendar-check"></i> الحضور</div>
              <div class="empty-sub">لا توجد بيانات حضور لهذا الشهر</div>
            </div>
          }

          <!-- Grades -->
          @if (grades().length > 0) {
            <div class="section-card">
              <div class="section-title">
                <i class="fas fa-star"></i> الدرجات · Grades
              </div>
              <div class="grades-list">
                @for (g of grades(); track $index) {
                  <div class="grade-row">
                    <div class="grade-exam">
                      <div class="exam-name">{{ g.examName || 'تقييم' }}</div>
                      @if (g.examCode) {
                        <div class="exam-code">{{ g.examCode }}</div>
                      }
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
                }
              </div>
              @if (grades().length > 1) {
                <div class="grades-avg">
                  <span>المتوسط العام</span>
                  <span class="avg-val" [class]="avgClass()">{{ avgGrade() }}%</span>
                </div>
              }
            </div>
          }

          @if (enrollment() && grades().length === 0 && !loadingGrades()) {
            <div class="section-card">
              <div class="section-title"><i class="fas fa-star"></i> الدرجات</div>
              <div class="empty-sub">لا توجد درجات مسجّلة بعد</div>
            </div>
          }

        </div>
      }
    </div>
  `,
  styles: [`
    $purple-start: #667eea;
    $purple-end: #764ba2;

    .profile-page {
      min-height: 100vh;
      background: #f4f5fb;
      padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
    }

    /* ── Top Bar ─────────────────────────────────── */
    .top-bar {
      background: linear-gradient(145deg, $purple-start 0%, $purple-end 100%);
      padding: calc(env(safe-area-inset-top, 0px) + 0.6rem) 1rem 0.6rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      position: sticky;
      top: 0;
      z-index: 40;
      box-shadow: 0 2px 12px rgba(102, 126, 234, 0.25);
    }

    .top-back-btn {
      flex-shrink: 0;
      width: 38px; height: 38px;
      border-radius: 50%;
      background: rgba(255,255,255,0.15);
      border: 1.5px solid rgba(255,255,255,0.25);
      color: #fff;
      font-size: 0.9rem;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      min-width: 44px; min-height: 44px;
      transition: background 0.15s;
      &:active { background: rgba(255,255,255,0.28); }
    }

    .top-bar-text {
      flex: 1; min-width: 0;
      h1 {
        margin: 0;
        font-size: 1.05rem;
        font-weight: 800;
        color: #fff;
        line-height: 1.2;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    .top-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
      margin-top: 0.15rem;
    }

    .top-chip {
      font-size: 0.62rem;
      font-weight: 600;
      background: rgba(255,255,255,0.2);
      color: #fff;
      padding: 0.1rem 0.4rem;
      border-radius: 12px;
    }

    .top-icon {
      width: 38px; height: 38px;
      border-radius: 50%;
      background: rgba(255,255,255,0.15);
      border: 1.5px solid rgba(255,255,255,0.25);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      i { font-size: 1rem; color: #fff; }
    }

    /* ── Loading / Error ──────────────────────────── */
    .loading-state {
      display: flex; flex-direction: column; align-items: center;
      gap: 0.75rem; padding: 3rem 1rem; color: #9ca3af;
      p { font-size: 0.9rem; margin: 0; }
    }
    .spinner {
      width: 36px; height: 36px;
      border: 3px solid #e5e7eb; border-top-color: $purple-start;
      border-radius: 50%; animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .error-banner {
      margin: 0.75rem 1rem;
      background: #fef2f2; color: #dc2626;
      border: 1px solid #fecaca; border-radius: 12px;
      padding: 0.75rem 1rem; font-size: 0.88rem;
      display: flex; align-items: center; gap: 0.5rem;
      i { flex-shrink: 0; }
    }

    /* ── Content ──────────────────────────────────── */
    .content { padding: 0.75rem 1rem; display: flex; flex-direction: column; gap: 0.75rem; }

    .section-card {
      background: white; border-radius: 14px;
      padding: 1rem; box-shadow: 0 2px 10px rgba(0,0,0,0.07);
    }
    .section-title {
      font-size: 0.88rem; font-weight: 700; color: #4a4a6a;
      margin-bottom: 0.875rem;
      display: flex; align-items: center; gap: 0.4rem;
      i { color: $purple-start; font-size: 0.8rem; }
    }

    /* ── Enrollment ───────────────────────────────── */
    .not-enrolled {
      display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;
      font-size: 0.88rem; color: #9ca3af;
      i { color: #667eea; }
    }
    .btn-enroll {
      background: linear-gradient(145deg, $purple-start, $purple-end);
      color: white; border: none; border-radius: 10px;
      padding: 0.5rem 1rem; font-size: 0.82rem; font-weight: 700;
      cursor: pointer; white-space: nowrap;
      min-height: 44px;
      display: flex; align-items: center; gap: 0.3rem;
      box-shadow: 0 4px 12px rgba(102,126,234,0.3);
    }
    .enrollment-info { display: flex; flex-direction: column; gap: 0.6rem; }
    .info-row {
      display: flex; align-items: center; gap: 0.75rem;
      font-size: 0.88rem;
    }
    .info-label {
      color: #9ca3af; white-space: nowrap; min-width: 90px;
      display: flex; align-items: center; gap: 0.3rem;
      i { font-size: 0.75rem; color: $purple-start; }
    }
    .info-value { font-weight: 600; color: #1a202c; }

    .status-badge {
      display: inline-flex; align-items: center;
      padding: 0.25rem 0.65rem; border-radius: 10px;
      font-size: 0.78rem; font-weight: 700;
    }
    .status-pending  { background: #fffbeb; color: #d97706; }
    .status-approved { background: #f0fdf4; color: #15803d; }
    .status-rejected { background: #fef2f2; color: #dc2626; }

    /* ── Schedule ─────────────────────────────────── */
    .schedules { display: flex; flex-direction: column; gap: 0.5rem; }
    .schedule-row {
      display: flex; align-items: center; flex-wrap: wrap; gap: 0.5rem;
      background: #f5f3ff; border: 1px solid #ede9fe;
      border-radius: 10px;
      padding: 0.6rem 0.75rem; font-size: 0.82rem;
    }
    .day-chip {
      background: linear-gradient(145deg, $purple-start, $purple-end);
      color: #fff;
      padding: 0.2rem 0.6rem; border-radius: 8px;
      font-weight: 700; font-size: 0.75rem;
    }
    .schedule-time {
      color: #4a4a6a;
      display: flex; align-items: center; gap: 0.3rem;
      i { font-size: 0.7rem; color: $purple-start; }
    }
    .schedule-location {
      color: #9ca3af;
      display: flex; align-items: center; gap: 0.25rem;
      i { font-size: 0.7rem; }
    }

    /* ── Attendance ───────────────────────────────── */
    .attendance-stats {
      display: flex; gap: 0.4rem; margin-bottom: 0.875rem;
    }
    .att-stat {
      flex: 1; text-align: center; padding: 0.75rem 0.5rem;
      border-radius: 10px;
    }
    .att-stat.present { background: #f0fdf4; }
    .att-stat.absent  { background: #fef2f2; }
    .att-stat.total   { background: #f5f3ff; }
    .att-num { font-size: 1.5rem; font-weight: 800; }
    .att-stat.present .att-num { color: #15803d; }
    .att-stat.absent .att-num  { color: #dc2626; }
    .att-stat.total .att-num   { color: #5b21b6; }
    .att-label { font-size: 0.72rem; color: #9ca3af; margin-top: 0.1rem; }

    .att-bar-wrap {
      display: flex; align-items: center; gap: 0.75rem;
      margin-bottom: 0.5rem;
    }
    .att-bar {
      flex: 1; height: 8px; background: #e5e7eb;
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
      &.rate-poor      { color: #dc2626; }
    }
    .att-note {
      font-size: 0.78rem; padding: 0.5rem 0.6rem;
      border-radius: 8px;
      display: flex; align-items: center; gap: 0.3rem;
      i { font-size: 0.72rem; flex-shrink: 0; }
      &.rate-excellent { background: #f0fdf4; color: #15803d; }
      &.rate-good      { background: #fffbeb; color: #d97706; }
      &.rate-poor      { background: #fef2f2; color: #dc2626; }
    }

    /* ── Grades ───────────────────────────────────── */
    .grades-list { display: flex; flex-direction: column; gap: 0.875rem; }
    .grade-row {
      display: flex; flex-direction: column; gap: 0.3rem;
    }
    .grade-exam {
      display: flex; align-items: baseline; gap: 0.5rem;
      .exam-name { font-weight: 600; color: #1a202c; font-size: 0.9rem; }
      .exam-code { font-size: 0.75rem; color: #9ca3af; }
    }
    .grade-score {
      display: flex; align-items: baseline; gap: 0.2rem;
      .score-num {
        font-size: 1.3rem; font-weight: 800;
        &.grade-excellent { color: #15803d; }
        &.grade-good      { color: #d97706; }
        &.grade-poor      { color: #dc2626; }
      }
      .score-max { font-size: 0.82rem; color: #9ca3af; }
    }
    .grade-bar-wrap {
      display: flex; align-items: center; gap: 0.6rem;
    }
    .grade-bar {
      flex: 1; height: 6px; background: #e5e7eb;
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
      &.grade-poor      { color: #dc2626; }
    }
    .grades-avg {
      display: flex; justify-content: space-between; align-items: center;
      margin-top: 0.875rem; padding-top: 0.75rem;
      border-top: 1px solid #e5e7eb;
      font-size: 0.88rem; color: #4a4a6a; font-weight: 600;
    }
    .avg-val {
      font-size: 1rem; font-weight: 800;
      &.grade-excellent { color: #15803d; }
      &.grade-good      { color: #d97706; }
      &.grade-poor      { color: #dc2626; }
    }

    /* ── Empty sub ────────────────────────────────── */
    .empty-sub {
      font-size: 0.85rem; color: #9ca3af; text-align: center; padding: 0.75rem 0;
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

  private studentId = signal<string | null>(null);

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
      if (student?.id) this.studentId.set(student.id);

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

      // Load grades using getGradesByStudent (works with student entity ID)
      if (student?.id && enroll?.status === EnrollmentRequestStatus.Approved) {
        this.loadingGrades.set(true);
        try {
          const gradesResult = await lastValueFrom(
            this.examGradeService.getGradesByStudent(student.id, {
              skipCount: 0,
              maxResultCount: 100,
            })
          );
          // Filter grades to only show ones for this course
          const courseName = course?.nameAr || course?.nameEn || '';
          const allGrades = gradesResult?.items ?? [];
          const courseGrades = courseName
            ? allGrades.filter(g => g.courseName === courseName || g.courseName === (course?.nameEn || '') || g.courseName === (course?.nameAr || ''))
            : allGrades;
          this.grades.set(courseGrades.length > 0 ? courseGrades : allGrades);
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
