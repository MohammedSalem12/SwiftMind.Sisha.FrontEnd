import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { StudentService } from '@proxy/students';
import type { StudentDto } from '@proxy/students/models';
import { AttendanceService } from '@proxy/attendances';
import type { StudentAttendanceReportDto } from '@proxy/attendances/dtos/models';
import { ExamGradeService } from '@proxy/exam-grades';
import type { ExamGradeDto } from '@proxy/exam-grades/dtos/models';
import { EnrollmentRequestService } from '@proxy/student-enrollments';
import type { EnrollmentRequestDto } from '@proxy/student-enrollments/models';
import { EnrollmentRequestStatus } from '@proxy/enums/enrollment-request-status.enum';
import { CourseService } from '@proxy/courses';
import { GroupService } from '@proxy/groups';
import type { GroupWithSchedulesDto } from '@proxy/groups/dtos/models';

@Component({
  selector: 'app-parent-child-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="child-detail" dir="rtl">

      <!-- Hero Header -->
      <div class="hero">
        <div class="hero-blob hero-blob-1"></div>
        <div class="hero-blob hero-blob-2"></div>
        <div class="hero-top-row">
          <button class="back-btn" (click)="goBack()">
            <i class="fas fa-arrow-right"></i>
          </button>
          <div class="hero-avatar">
            <span>{{ getStudentName() | slice:0:1 }}</span>
          </div>
        </div>

        @if (loading()) {
          <div class="hero-skeleton"></div>
        } @else if (student()) {
          <div class="hero-info">
            <h1 class="hero-name">{{ getStudentName() }}</h1>
            <div class="hero-chips">
              <span class="hero-chip"><i class="fas fa-id-card"></i>{{ student()!.studentCode }}</span>
              @if (student()!.currentGrade) {
                <span class="hero-chip"><i class="fas fa-graduation-cap"></i>الصف {{ student()!.currentGrade }}</span>
              }
              @if (student()!.schoolName) {
                <span class="hero-chip"><i class="fas fa-school"></i>{{ student()!.schoolName }}</span>
              }
            </div>
          </div>
        }

        <!-- Stats Row -->
        <div class="stats-row">
          <div class="stat-box">
            <span class="stat-val stat-val--green">{{ getOverallAttendancePercent() }}%</span>
            <span class="stat-lbl">الحضور</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-box">
            <span class="stat-val stat-val--blue">{{ getAverageGradePercent() }}%</span>
            <span class="stat-lbl">متوسط الدرجات</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-box">
            <span class="stat-val" [class.stat-val--red]="getTotalAbsentDays() > 0" [class.stat-val--green]="getTotalAbsentDays() === 0">{{ getTotalAbsentDays() }}</span>
            <span class="stat-lbl">الغيابات</span>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs-bar">
        <button class="tab" [class.tab--active]="activeTab() === 'attendance'" (click)="activeTab.set('attendance')">
          <i class="fas fa-clipboard-check"></i>
          <span>الحضور</span>
        </button>
        <button class="tab" [class.tab--active]="activeTab() === 'grades'" (click)="activeTab.set('grades')">
          <i class="fas fa-chart-bar"></i>
          <span>الدرجات</span>
        </button>
        <button class="tab" [class.tab--active]="activeTab() === 'courses'" (click)="activeTab.set('courses')">
          <i class="fas fa-book-open"></i>
          <span>المقررات</span>
          @if (enrolledCourses().length > 0) {
            <span class="tab-count">{{ enrolledCourses().length }}</span>
          }
        </button>
      </div>

      <!-- Export & Schedule buttons -->
      <div class="action-row">
        <button class="action-btn action-schedule" (click)="goToSchedule()">
          <i class="fas fa-calendar-alt"></i> جدول الحصص · Schedule
        </button>
        <button class="action-btn action-export" (click)="exportCsv()">
          <i class="fas fa-file-csv"></i> تصدير CSV · Export
        </button>
      </div>

      <!-- ── Attendance Tab ── -->
      @if (activeTab() === 'attendance') {
        @if (attendanceLoading()) {
          <div class="loading-area">
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
          </div>
        } @else if (attendanceReports().length === 0) {
          <div class="empty-state">
            <div class="empty-icon"><i class="fas fa-clipboard-check"></i></div>
            <p>لا توجد بيانات حضور</p>
            <small>No attendance records available</small>
          </div>
        } @else {

          <!-- Summary Banner -->
          <div class="section-pad">
            <div class="summary-banner"
              [class.summary-banner--green]="getTotalAbsentDays() === 0"
              [class.summary-banner--amber]="getTotalAbsentDays() > 0 && getTotalAbsentDays() <= 3"
              [class.summary-banner--red]="getTotalAbsentDays() > 3">
              <div class="summary-icon">
                <i class="fas" [class.fa-check-circle]="getTotalAbsentDays() === 0" [class.fa-exclamation-triangle]="getTotalAbsentDays() > 0 && getTotalAbsentDays() <= 3" [class.fa-times-circle]="getTotalAbsentDays() > 3"></i>
              </div>
              <div class="summary-text">
                @if (getTotalAbsentDays() === 0) {
                  <strong>ممتاز!</strong> الطالب حضر جميع الجلسات الدراسية
                } @else if (getTotalAbsentDays() <= 3) {
                  <strong>تنبيه:</strong> الطالب غاب عن {{ getTotalAbsentDays() }} جلسات فقط
                } @else {
                  <strong>ملاحظة:</strong> الطالب غاب عن {{ getTotalAbsentDays() }} جلسة
                }
              </div>
              <div class="summary-totals">
                <span class="total-chip total-chip--green">{{ getTotalAttendedDays() }} حضور</span>
                <span class="total-chip total-chip--red">{{ getTotalAbsentDays() }} غياب</span>
                <span class="total-chip total-chip--gray">{{ getTotalSessions() }} إجمالي</span>
              </div>
            </div>
          </div>

          <!-- Course Attendance Cards -->
          <div class="section-label">
            <i class="fas fa-book-open"></i>
            <span>تفاصيل حسب المقرر · By Course</span>
            <span class="count-pill">{{ attendanceReports().length }}</span>
          </div>
          <div class="cards-list">
            @for (report of attendanceReports(); track report.courseId) {
              <div class="attend-card" [class.attend-card--alert]="(report.absentDays || 0) > 0">
                <div class="attend-card-icon"
                  [class.attend-card-icon--green]="report.attendancePercentage >= 90"
                  [class.attend-card-icon--amber]="report.attendancePercentage >= 75 && report.attendancePercentage < 90"
                  [class.attend-card-icon--red]="report.attendancePercentage < 75">
                  <i class="fas fa-book"></i>
                </div>
                <div class="attend-card-body">
                  <div class="attend-course-name">{{ report.courseNameAr || report.courseNameEn }}</div>
                  <div class="attend-bar-wrap">
                    <div class="attend-bar">
                      <div class="attend-bar-fill"
                        [class.fill--green]="report.attendancePercentage >= 90"
                        [class.fill--amber]="report.attendancePercentage >= 75 && report.attendancePercentage < 90"
                        [class.fill--red]="report.attendancePercentage < 75"
                        [style.width.%]="report.attendancePercentage"></div>
                    </div>
                  </div>
                  <div class="attend-chips">
                    <span class="mini-chip chip-green"><i class="fas fa-check"></i>{{ report.attendedDays }}</span>
                    <span class="mini-chip chip-red"><i class="fas fa-times"></i>{{ report.absentDays }}</span>
                    <span class="mini-chip chip-gray"><i class="fas fa-calendar"></i>{{ report.totalDaysInMonth }}</span>
                  </div>
                </div>
                <div class="attend-pct"
                  [class.pct--green]="report.attendancePercentage >= 90"
                  [class.pct--amber]="report.attendancePercentage >= 75 && report.attendancePercentage < 90"
                  [class.pct--red]="report.attendancePercentage < 75">
                  {{ report.attendancePercentage | number:'1.0-0' }}%
                </div>
              </div>
            }
          </div>
        }
      }

      <!-- ── Grades Tab ── -->
      @if (activeTab() === 'grades') {
        @if (gradesLoading()) {
          <div class="loading-area">
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
          </div>
        } @else if (grades().length === 0) {
          <div class="empty-state">
            <div class="empty-icon"><i class="fas fa-chart-bar"></i></div>
            <p>لا توجد درجات</p>
            <small>No grades available yet</small>
          </div>
        } @else {
          <div class="section-label">
            <i class="fas fa-star"></i>
            <span>نتائج الاختبارات · Exam Results</span>
            <span class="count-pill">{{ grades().length }}</span>
          </div>
          <div class="cards-list">
            @for (grade of grades(); track grade.id) {
              <div class="grade-card">
                <div class="grade-card-icon"
                  [class.grade-icon--green]="getPercentage(grade) >= 90"
                  [class.grade-icon--blue]="getPercentage(grade) >= 75 && getPercentage(grade) < 90"
                  [class.grade-icon--amber]="getPercentage(grade) >= 60 && getPercentage(grade) < 75"
                  [class.grade-icon--red]="getPercentage(grade) < 60">
                  <i class="fas fa-star"></i>
                </div>
                <div class="grade-card-body">
                  <div class="grade-exam-name">{{ grade.examName || 'اختبار' }}</div>
                  <div class="grade-course-name">{{ grade.courseName }}</div>
                  <div class="grade-meta">
                    <span class="mini-chip chip-gray"><i class="fas fa-calendar"></i>{{ grade.date | date:'shortDate' }}</span>
                    <span class="mini-chip chip-purple"><i class="fas fa-pencil-alt"></i>{{ grade.grade }} / {{ grade.maxGrade }}</span>
                  </div>
                </div>
                <div class="grade-pct"
                  [class.pct--green]="getPercentage(grade) >= 90"
                  [class.pct--blue]="getPercentage(grade) >= 75 && getPercentage(grade) < 90"
                  [class.pct--amber]="getPercentage(grade) >= 60 && getPercentage(grade) < 75"
                  [class.pct--red]="getPercentage(grade) < 60">
                  {{ getPercentage(grade) | number:'1.0-0' }}%
                </div>
              </div>
            }
          </div>
        }
      }

      <!-- ── Courses Tab ── -->
      @if (activeTab() === 'courses') {
        @if (coursesLoading()) {
          <div class="loading-area">
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
          </div>
        } @else if (enrolledCourses().length === 0) {
          <div class="empty-state">
            <div class="empty-icon"><i class="fas fa-book-open"></i></div>
            <p>لا توجد مقررات مسجلة</p>
            <small>No enrolled courses yet</small>
          </div>
        } @else {
          <div class="section-label">
            <i class="fas fa-book-open"></i>
            <span>المقررات المسجلة · Enrolled Courses</span>
            <span class="count-pill">{{ enrolledCourses().length }}</span>
          </div>
          <div class="cards-list">
            @for (req of enrolledCourses(); track req.id) {
              <div class="course-rich-card">
                <!-- Header row -->
                <div class="crc-header">
                  <div class="crc-icon"><i class="fas fa-book-open"></i></div>
                  <div class="crc-title">
                    <div class="crc-name">{{ req.courseName }}</div>
                    @if (req.teacherName) {
                      <div class="crc-teacher"><i class="fas fa-chalkboard-teacher"></i> {{ req.teacherName }}</div>
                    }
                  </div>
                </div>

                <!-- Group & next session -->
                @if (getGroupForEnrollment(req.id); as grp) {
                  <div class="crc-group-bar">
                    <span class="crc-group-name"><i class="fas fa-layer-group"></i> {{ grp.name }}</span>
                    @if (getNextSession(grp)) {
                      <span class="crc-next"><i class="fas fa-clock"></i> {{ getNextSession(grp) }}</span>
                    }
                  </div>

                  <!-- Schedule chips -->
                  @if (grp.schedules?.length) {
                    <div class="crc-schedules">
                      @for (s of grp.schedules; track s.dayOfWeek) {
                        <span class="crc-sched-chip">
                          <i class="fas fa-calendar-day"></i> {{ formatSchedule(s) }}
                        </span>
                      }
                    </div>
                  }

                  @if (grp.location) {
                    <div class="crc-location"><i class="fas fa-map-marker-alt"></i> {{ grp.location }}</div>
                  }
                } @else if (req.groupName) {
                  <div class="crc-group-bar">
                    <span class="crc-group-name"><i class="fas fa-layer-group"></i> {{ req.groupName }}</span>
                  </div>
                }
              </div>
            }
          </div>
        }
      }

      <!-- Not Found -->
      @if (!loading() && !student()) {
        <div class="empty-state">
          <div class="empty-icon"><i class="fas fa-user-slash"></i></div>
          <p>لم يتم العثور على بيانات الطالب</p>
        </div>
      }

      <!-- Fixed Bottom Bar -->
      <div class="bottom-bar">
        <button class="enroll-btn" (click)="enrollInCourse()">
          <i class="fas fa-plus-circle"></i>
          <span>تسجيل في مقرر</span>
          <span class="enroll-btn-en">Enroll Course</span>
        </button>
      </div>

    </div>
  `,
  styles: [`
    $purple: #667eea;
    $purple-end: #764ba2;
    $purple-grad: linear-gradient(135deg, $purple, $purple-end);

    .child-detail {
      min-height: 100vh;
      background: #f4f3ff;
      direction: rtl;
      padding-bottom: calc(88px + env(safe-area-inset-bottom));
    }

    /* ── Hero ── */
    .hero {
      position: relative;
      background: $purple-grad;
      padding: 1.25rem 1.25rem 1.5rem;
      overflow: hidden;
    }
    .hero-blob {
      position: absolute; border-radius: 50%;
      opacity: 0.12; background: #fff; pointer-events: none;
    }
    .hero-blob-1 { width: 200px; height: 200px; top: -60px; left: -60px; }
    .hero-blob-2 { width: 130px; height: 130px; bottom: -40px; right: -30px; }

    .hero-top-row {
      position: relative; z-index: 1;
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 1rem;
    }
    .back-btn {
      width: 40px; height: 40px;
      background: rgba(255,255,255,0.18); border: 1.5px solid rgba(255,255,255,0.35);
      border-radius: 50%; color: #fff; font-size: 0.95rem;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      &:active { background: rgba(255,255,255,0.28); }
    }
    .hero-avatar {
      width: 52px; height: 52px;
      background: rgba(255,255,255,0.2); border: 2px solid rgba(255,255,255,0.4);
      border-radius: 50%; display: flex; align-items: center; justify-content: center;
      span { font-size: 1.4rem; font-weight: 800; color: #fff; }
    }
    .hero-info { position: relative; z-index: 1; margin-bottom: 1.25rem; }
    .hero-name { font-size: 1.45rem; font-weight: 800; color: #fff; margin: 0 0 0.5rem; }
    .hero-chips { display: flex; flex-wrap: wrap; gap: 0.3rem; }
    .hero-chip {
      display: inline-flex; align-items: center; gap: 0.3rem;
      background: rgba(255,255,255,0.18); border: 1px solid rgba(255,255,255,0.3);
      color: #fff; border-radius: 20px; padding: 0.2rem 0.55rem;
      font-size: 0.68rem; font-weight: 500;
      i { font-size: 0.6rem; }
    }
    .hero-skeleton {
      height: 28px; width: 180px;
      background: rgba(255,255,255,0.2); border-radius: 8px;
      margin-bottom: 1.25rem;
      animation: pulse 1.4s ease-in-out infinite;
    }
    @keyframes pulse { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }

    /* Stats Row */
    .stats-row {
      position: relative; z-index: 1;
      background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25);
      border-radius: 16px; padding: 0.85rem 0.5rem;
      display: flex; align-items: center; justify-content: space-around;
      backdrop-filter: blur(4px);
    }
    .stat-box { display: flex; flex-direction: column; align-items: center; gap: 0.2rem; flex: 1; }
    .stat-divider { width: 1px; height: 36px; background: rgba(255,255,255,0.3); }
    .stat-val { font-size: 1.35rem; font-weight: 800; color: #fff; }
    .stat-val--green { color: #6ee7b7; }
    .stat-val--blue  { color: #93c5fd; }
    .stat-val--red   { color: #fca5a5; }
    .stat-lbl { font-size: 0.65rem; color: rgba(255,255,255,0.75); font-weight: 500; text-align: center; }

    /* ── Tabs ── */
    .tabs-bar {
      display: flex; gap: 0; background: #fff;
      border-bottom: 1px solid #e9e6ff;
      padding: 0.5rem 1rem; gap: 0.5rem;
      position: sticky; top: 0; z-index: 10;
    }
    .tab {
      flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.4rem;
      padding: 0.65rem 0.5rem; background: #f4f3ff; border: 1.5px solid #e9e6ff;
      border-radius: 12px; cursor: pointer; font-size: 0.8rem; font-weight: 600;
      color: #6b7280; transition: all 0.15s;
      i { font-size: 0.85rem; }
      &:active { transform: scale(0.97); }
    }
    .tab--active {
      background: $purple-grad; border-color: transparent; color: #fff;
    }

    /* ── Loading ── */
    .loading-area { padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem; }
    @keyframes shimmer { 0% { background-position: -600px 0; } 100% { background-position: 600px 0; } }
    .skeleton-card {
      height: 80px; border-radius: 14px;
      background: linear-gradient(90deg, #e9e6ff 25%, #f4f3ff 50%, #e9e6ff 75%);
      background-size: 600px 100%; animation: shimmer 1.5s infinite;
    }

    /* ── Empty State ── */
    .empty-state { text-align: center; padding: 3rem 1.5rem; }
    .empty-icon {
      width: 72px; height: 72px; background: linear-gradient(135deg, #f0f4ff, #e8e0ff);
      border-radius: 50%; display: flex; align-items: center; justify-content: center;
      margin: 0 auto 1rem;
      i { font-size: 1.75rem; color: $purple-end; }
    }
    .empty-state p { font-size: 0.95rem; font-weight: 600; color: #374151; margin: 0 0 0.25rem; }
    .empty-state small { font-size: 0.78rem; color: #9ca3af; }

    /* ── Section Label ── */
    .section-label {
      display: flex; align-items: center; gap: 0.5rem;
      padding: 0 1rem; margin: 1rem 0 0.5rem;
      font-size: 0.85rem; font-weight: 600; color: #374151;
      i { color: $purple; }
    }
    .count-pill {
      background: $purple-grad; color: #fff;
      border-radius: 20px; padding: 0.1rem 0.5rem;
      font-size: 0.7rem; font-weight: 700;
    }
    .section-pad { padding: 0.75rem 1rem 0; }

    /* ── Summary Banner ── */
    .summary-banner {
      border-radius: 14px; padding: 0.85rem;
      display: flex; flex-direction: column; gap: 0.5rem;
    }
    .summary-banner--green { background: #d1fae5; border: 1.5px solid #6ee7b7; }
    .summary-banner--amber { background: #fef3c7; border: 1.5px solid #fcd34d; }
    .summary-banner--red   { background: #fee2e2; border: 1.5px solid #fca5a5; }

    .summary-icon {
      font-size: 1.1rem;
      .summary-banner--green & { color: #059669; }
      .summary-banner--amber & { color: #d97706; }
      .summary-banner--red   & { color: #dc2626; }
    }
    .summary-text {
      font-size: 0.85rem; color: #1a202c; line-height: 1.4;
      strong { font-weight: 700; }
    }
    .summary-totals { display: flex; flex-wrap: wrap; gap: 0.35rem; }
    .total-chip {
      display: inline-flex; align-items: center; gap: 0.2rem;
      border-radius: 20px; padding: 0.18rem 0.5rem;
      font-size: 0.68rem; font-weight: 600;
    }
    .total-chip--green { background: #d1fae5; color: #059669; }
    .total-chip--red   { background: #fee2e2; color: #dc2626; }
    .total-chip--gray  { background: #f3f4f6; color: #6b7280; }

    /* ── Cards List ── */
    .cards-list { display: flex; flex-direction: column; gap: 0.65rem; padding: 0 1rem 1rem; }

    /* Attendance Card */
    .attend-card {
      display: flex; align-items: center; gap: 0.75rem;
      background: #fff; border-radius: 14px; padding: 0.85rem;
      border: 1.5px solid #e9e6ff;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
      &--alert { border-color: #fca5a5; }
    }
    .attend-card-icon {
      width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      i { font-size: 1.1rem; color: #fff; }
      &--green { background: linear-gradient(135deg, #10b981, #059669); }
      &--amber { background: linear-gradient(135deg, #f59e0b, #d97706); }
      &--red   { background: linear-gradient(135deg, #ef4444, #dc2626); }
    }
    .attend-card-body { flex: 1; min-width: 0; }
    .attend-course-name {
      font-size: 0.88rem; font-weight: 700; color: #1a202c;
      margin-bottom: 0.4rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .attend-bar-wrap { margin-bottom: 0.35rem; }
    .attend-bar {
      height: 6px; background: #e9e6ff; border-radius: 3px; overflow: hidden;
    }
    .attend-bar-fill {
      height: 100%; border-radius: 3px; transition: width 0.4s ease;
      &.fill--green { background: #10b981; }
      &.fill--amber { background: #f59e0b; }
      &.fill--red   { background: #ef4444; }
    }
    .attend-chips { display: flex; flex-wrap: wrap; gap: 0.25rem; }
    .attend-pct {
      font-size: 1rem; font-weight: 800; flex-shrink: 0;
      &.pct--green { color: #10b981; }
      &.pct--amber { color: #f59e0b; }
      &.pct--red   { color: #ef4444; }
    }

    /* Mini chips */
    .mini-chip {
      display: inline-flex; align-items: center; gap: 0.18rem;
      font-size: 0.62rem; font-weight: 600; padding: 0.12rem 0.38rem;
      border-radius: 20px;
      i { font-size: 0.55rem; }
    }
    .chip-green  { background: #d1fae5; color: #059669; }
    .chip-red    { background: #fee2e2; color: #dc2626; }
    .chip-gray   { background: #f3f4f6; color: #6b7280; }
    .chip-purple { background: #ede9fe; color: $purple-end; }

    /* Grade Card */
    .grade-card {
      display: flex; align-items: center; gap: 0.75rem;
      background: #fff; border-radius: 14px; padding: 0.85rem;
      border: 1.5px solid #e9e6ff;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    }
    .grade-card-icon {
      width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      i { font-size: 1.1rem; color: #fff; }
      &.grade-icon--green { background: linear-gradient(135deg, #10b981, #059669); }
      &.grade-icon--blue  { background: linear-gradient(135deg, #3b82f6, #2563eb); }
      &.grade-icon--amber { background: linear-gradient(135deg, #f59e0b, #d97706); }
      &.grade-icon--red   { background: linear-gradient(135deg, #ef4444, #dc2626); }
    }
    .grade-card-body { flex: 1; min-width: 0; }
    .grade-exam-name { font-size: 0.9rem; font-weight: 700; color: #1a202c; margin-bottom: 0.15rem; }
    .grade-course-name { font-size: 0.75rem; color: #6b7280; margin-bottom: 0.35rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .grade-meta { display: flex; flex-wrap: wrap; gap: 0.25rem; }
    .grade-pct {
      font-size: 1rem; font-weight: 800; flex-shrink: 0;
      &.pct--green { color: #10b981; }
      &.pct--blue  { color: #3b82f6; }
      &.pct--amber { color: #f59e0b; }
      &.pct--red   { color: #ef4444; }
    }

    /* ── Tab count badge ── */
    .tab-count {
      background: $purple-grad; color: #fff;
      border-radius: 20px; padding: 0.05rem 0.4rem;
      font-size: 0.62rem; font-weight: 700;
    }

    /* ── Action Row ── */
    .action-row {
      display: flex; gap: 8px; padding: 0 1rem 0.75rem;
    }
    .action-btn {
      flex: 1; padding: 8px; border: none; border-radius: 10px;
      font-size: 12px; font-weight: 600; cursor: pointer; min-height: 40px;
      display: flex; align-items: center; justify-content: center; gap: 5px;
    }
    .action-schedule { background: rgba(59,130,246,.1); color: #3b82f6; }
    .action-export { background: rgba(16,185,129,.1); color: #059669; }

    /* ── Course Rich Cards ── */
    .course-rich-card {
      background: #fff; border-radius: 16px; padding: 1rem;
      border: 1.5px solid #e9e6ff;
      box-shadow: 0 2px 10px rgba(0,0,0,0.04);
    }
    .crc-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.6rem; }
    .crc-icon {
      width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
      background: $purple-grad;
      display: flex; align-items: center; justify-content: center;
      i { font-size: 1.1rem; color: #fff; }
      box-shadow: 0 3px 10px rgba(102,126,234,0.25);
    }
    .crc-title { flex: 1; min-width: 0; }
    .crc-name { font-size: 0.95rem; font-weight: 700; color: #1a202c; }
    .crc-teacher {
      font-size: 0.75rem; color: #6b7280; display: flex; align-items: center; gap: 0.3rem; margin-top: 0.15rem;
      i { font-size: 0.65rem; color: $purple; }
    }
    .crc-group-bar {
      display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;
      background: rgba(102,126,234,0.06); border-radius: 10px; padding: 0.5rem 0.65rem;
      margin-bottom: 0.5rem;
    }
    .crc-group-name {
      font-size: 0.78rem; font-weight: 700; color: #4a4a6a;
      display: flex; align-items: center; gap: 0.3rem;
      i { font-size: 0.65rem; color: $purple; }
    }
    .crc-next {
      font-size: 0.7rem; font-weight: 600; color: #059669;
      background: rgba(16,185,129,0.1); padding: 0.2rem 0.5rem; border-radius: 8px;
      display: flex; align-items: center; gap: 0.25rem;
      i { font-size: 0.58rem; }
    }
    .crc-schedules { display: flex; flex-wrap: wrap; gap: 0.3rem; margin-bottom: 0.4rem; }
    .crc-sched-chip {
      font-size: 0.68rem; font-weight: 600; color: #4a4a6a;
      background: #f5f3ff; padding: 0.2rem 0.5rem; border-radius: 6px;
      display: flex; align-items: center; gap: 0.2rem;
      i { font-size: 0.55rem; color: #764ba2; }
    }
    .crc-location {
      font-size: 0.72rem; color: #9ca3af; display: flex; align-items: center; gap: 0.3rem;
      i { font-size: 0.6rem; }
    }

    /* ── Bottom Bar ── */
    .bottom-bar {
      position: fixed; bottom: 0; right: 0; left: 0;
      padding: 0.75rem 1rem;
      padding-bottom: calc(0.75rem + env(safe-area-inset-bottom));
      background: rgba(255,255,255,0.95); backdrop-filter: blur(8px);
      border-top: 1px solid #e9e6ff; z-index: 100;
    }
    .enroll-btn {
      width: 100%; background: $purple-grad; color: #fff;
      border: none; border-radius: 14px; padding: 0.85rem 1.5rem;
      font-size: 1rem; font-weight: 700; cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 0.5rem;
      min-height: 52px; box-shadow: 0 4px 16px rgba(102,126,234,0.35);
      transition: opacity 0.2s, transform 0.2s;
      &:active { opacity: 0.9; transform: scale(0.98); }
    }
    .enroll-btn-en { font-size: 0.75rem; font-weight: 400; opacity: 0.75; }
  `],
})
export class ParentChildDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly studentService = inject(StudentService);
  private readonly attendanceService = inject(AttendanceService);
  private readonly examGradeService = inject(ExamGradeService);
  private readonly enrollmentRequestSvc = inject(EnrollmentRequestService);
  private readonly courseService = inject(CourseService);
  private readonly groupService = inject(GroupService);

  readonly EnrollmentRequestStatus = EnrollmentRequestStatus;

  student = signal<StudentDto | null>(null);
  attendanceReports = signal<StudentAttendanceReportDto[]>([]);
  grades = signal<ExamGradeDto[]>([]);
  enrolledCourses = signal<EnrollmentRequestDto[]>([]);
  loading = signal(false);
  attendanceLoading = signal(false);
  gradesLoading = signal(false);
  coursesLoading = signal(false);
  activeTab = signal<'attendance' | 'grades' | 'courses'>('attendance');
  courseGroups = signal<Map<string, GroupWithSchedulesDto>>(new Map());

  private studentId = '';

  async ngOnInit(): Promise<void> {
    this.studentId = this.route.snapshot.paramMap.get('studentId') || '';
    if (!this.studentId) {
      this.router.navigate(['/parent']);
      return;
    }
    this.loading.set(true);
    try {
      const student = await lastValueFrom(this.studentService.get(this.studentId));
      this.student.set(student);
    } catch (error) {
      console.error('Error loading student:', error);
    } finally {
      this.loading.set(false);
    }
    // Load data in parallel
    await Promise.all([this.loadAttendance(), this.loadGrades(), this.loadEnrolledCourses()]);
  }

  private async loadAttendance(): Promise<void> {
    this.attendanceLoading.set(true);
    try {
      const result = await lastValueFrom(
        this.attendanceService.getStudentAttendanceReport({
          studentId: this.studentId,
          skipCount: 0,
          maxResultCount: 100,
        })
      );
      // Recalculate attendance days based on schedule (default: Sat=6, Tue=2)
      const recalculated = (result.items || []).map(r => this.recalcAttendance(r));
      this.attendanceReports.set(recalculated);
    } catch (error) {
      console.error('Error loading attendance:', error);
    } finally {
      this.attendanceLoading.set(false);
    }
  }

  private recalcAttendance(report: StudentAttendanceReportDto): StudentAttendanceReportDto {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const today = now.getDate();
    // Default schedule days: Saturday (6), Tuesday (2), Thursday (4)
    const scheduleDays = [6, 2, 4];
    let totalDays = 0;
    for (let day = 1; day <= today; day++) {
      const d = new Date(year, month, day);
      if (scheduleDays.includes(d.getDay())) totalDays++;
    }
    const absentDays = report.absentDays;
    const attendedDays = Math.max(0, totalDays - absentDays);
    const pct = totalDays > 0 ? Math.round(attendedDays / totalDays * 100) : 0;
    return { ...report, totalDaysInMonth: totalDays, attendedDays, attendancePercentage: pct };
  }

  private async loadGrades(): Promise<void> {
    this.gradesLoading.set(true);
    try {
      const result = await lastValueFrom(
        this.examGradeService.getGradesByStudent(this.studentId, {
          skipCount: 0,
          maxResultCount: 100,
        })
      );
      this.grades.set(result.items || []);
    } catch (error) {
      console.error('Error loading grades:', error);
    } finally {
      this.gradesLoading.set(false);
    }
  }

  private async loadEnrolledCourses(): Promise<void> {
    this.coursesLoading.set(true);
    try {
      const all = await lastValueFrom(this.enrollmentRequestSvc.getList({ skipHandleError: true } as any));
      // Filter: only this student's approved enrollments
      const forThisStudent = (all || []).filter(
        r => r.studentId === this.studentId && r.status === EnrollmentRequestStatus.Approved
      );

      // If courseName is missing, fetch course details to fill them
      const missingCourseIds = forThisStudent
        .filter(r => !r.courseName && r.courseId)
        .map(r => r.courseId!)
        .filter((id, i, arr) => arr.indexOf(id) === i);

      if (missingCourseIds.length > 0) {
        const courseMap = new Map<string, string>();
        await Promise.all(missingCourseIds.map(async (cid) => {
          try {
            const course = await lastValueFrom(this.courseService.get(cid));
            if (course) courseMap.set(cid, course.nameAr || course.nameEn || '');
          } catch { /* skip */ }
        }));
        for (const req of forThisStudent) {
          if (!req.courseName && req.courseId && courseMap.has(req.courseId)) {
            req.courseName = courseMap.get(req.courseId);
          }
        }
      }

      this.enrolledCourses.set(forThisStudent);

      // Load group details (schedules) for each enrollment
      const groupMap = new Map<string, GroupWithSchedulesDto>();
      await Promise.all(forThisStudent.map(async (req) => {
        if (!req.teacherId || !req.courseId) return;
        try {
          const groups = await lastValueFrom(
            this.groupService.getGroupsForTeacherAndCourse(req.teacherId, req.courseId)
          );
          const myGroup = req.groupId
            ? groups?.find(g => g.groupId === req.groupId) ?? groups?.[0]
            : groups?.[0];
          if (myGroup && req.id) groupMap.set(req.id, myGroup);
        } catch { /* silent */ }
      }));
      this.courseGroups.set(groupMap);
    } catch {
      // silent — courses tab will show empty state
    } finally {
      this.coursesLoading.set(false);
    }
  }

  getGroupForEnrollment(reqId?: string): GroupWithSchedulesDto | null {
    if (!reqId) return null;
    return this.courseGroups().get(reqId) ?? null;
  }

  getNextSession(group: GroupWithSchedulesDto | null): string {
    if (!group?.schedules?.length) return '';
    const now = new Date();
    const today = now.getDay(); // 0=Sun..6=Sat
    const nowMins = now.getHours() * 60 + now.getMinutes();

    // Find next upcoming session
    const sorted = [...group.schedules].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
    for (const s of sorted) {
      const sMins = this.timeToMins(s.startTime);
      if (s.dayOfWeek > today || (s.dayOfWeek === today && sMins > nowMins)) {
        return this.formatDayTime(s.dayOfWeek, s.startTime);
      }
    }
    // Wrap to next week
    return sorted[0] ? this.formatDayTime(sorted[0].dayOfWeek, sorted[0].startTime) : '';
  }

  private timeToMins(t?: string): number {
    if (!t) return 0;
    const [h, m] = t.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  }

  private formatDayTime(day: number, time?: string): string {
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const dayName = days[day] ?? '';
    if (!time) return dayName;
    const [h, m] = time.split(':');
    const hr = parseInt(h);
    const disp = hr > 12 ? hr - 12 : hr === 0 ? 12 : hr;
    return `${dayName} ${disp}:${m} ${hr >= 12 ? 'م' : 'ص'}`;
  }

  formatSchedule(s: any): string {
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const day = days[s.dayOfWeek] ?? '';
    const start = this.formatTimeShort(s.startTime);
    const end = this.formatTimeShort(s.endTime);
    return `${day} ${start}-${end}`;
  }

  private formatTimeShort(t?: string): string {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hr = parseInt(h);
    const disp = hr > 12 ? hr - 12 : hr === 0 ? 12 : hr;
    return `${disp}:${m}${hr >= 12 ? 'م' : 'ص'}`;
  }

  getStudentName(): string {
    const s = this.student();
    if (!s) return '';
    return [s.firstName, s.middleName, s.lastName].filter(Boolean).join(' ');
  }

  getPercentage(grade: ExamGradeDto): number {
    if (!grade.maxGrade || grade.maxGrade === 0) return 0;
    return (grade.grade / grade.maxGrade) * 100;
  }

  getTotalAttendedDays(): number {
    return this.attendanceReports().reduce((total, report) => total + (report.attendedDays || 0), 0);
  }

  getTotalAbsentDays(): number {
    return this.attendanceReports().reduce((total, report) => total + (report.absentDays || 0), 0);
  }

  getTotalSessions(): number {
    return this.attendanceReports().reduce((total, report) => total + (report.totalDaysInMonth || 0), 0);
  }

  getAbsentReports(): StudentAttendanceReportDto[] {
    return this.attendanceReports().filter(report => (report.absentDays || 0) > 0);
  }

  enrollInCourse(): void {
    this.router.navigate(['/parent/enroll-child', this.studentId]);
  }

  goBack(): void {
    this.router.navigate(['/parent']);
  }

  getOverallAttendancePercent(): number {
    const total = this.getTotalSessions();
    if (!total) return 0;
    const attended = this.getTotalAttendedDays();
    return Math.round((attended / total) * 100);
  }

  getAverageGradePercent(): number {
    const g = this.grades();
    if (!g || g.length === 0) return 0;
    const sum = g.reduce((s, x) => s + this.getPercentage(x), 0);
    return Math.round(sum / g.length);
  }

  goToSchedule(): void {
    const id = this.route.snapshot.paramMap.get('studentId');
    if (id) this.router.navigate(['/parent/child-schedule', id]);
  }

  exportCsv(): void {
    const student = this.student();
    const name = student ? `${student.firstName} ${student.lastName}` : 'student';

    // Attendance rows
    const attHeaders = ['Course', 'Total Days', 'Attended', 'Absent', 'Attendance %'];
    const attRows = this.attendanceReports().map((r: any) => [
      r.courseNameAr || r.courseNameEn,
      r.totalDaysInMonth,
      r.attendedDays,
      r.absentDays,
      (r.attendancePercentage ?? 0).toFixed(1) + '%',
    ]);

    // Grade rows
    const gradeHeaders = ['Exam', 'Course', 'Score', 'Max', 'Percentage'];
    const gradeRows = this.grades().map((g: any) => [
      g.examTitle || g.examNameAr || 'Exam',
      g.courseNameAr || g.courseNameEn || '',
      g.score,
      g.maxScore,
      this.getPercentage(g).toFixed(1) + '%',
    ]);

    let csv = '\uFEFF'; // BOM for Arabic
    csv += `Student: ${name}\n\n`;
    csv += `--- Attendance ---\n`;
    csv += [attHeaders, ...attRows].map(r => r.map((c: any) => `"${c}"`).join(',')).join('\n');
    csv += `\n\n--- Grades ---\n`;
    csv += [gradeHeaders, ...gradeRows].map(r => r.map((c: any) => `"${c}"`).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
