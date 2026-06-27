import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { TeacherService } from '@proxy/teachers';
import { GroupService } from '@proxy/groups';
import { StudentEnrollmentService } from '@proxy/student-enrollments';
import type { CourseDto } from '@proxy/courses/dtos/models';
import type { GroupWithSchedulesDto } from '@proxy/groups/dtos/models';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../shared/components/page-header.component';

@Component({
  selector: 'app-secretary-teacher-courses',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  template: `
    <div class="page" dir="rtl">

      <!-- Header -->
      <app-page-header [title]="'مقررات المعلم'" [titleEn]="'Teacher Courses'" [backTo]="'/secretary'"></app-page-header>

      <!-- Teacher name + intro -->
      <div class="teacher-intro">
        <div class="hero-icon">
          <i class="fas fa-book"></i>
        </div>
        <div class="teacher-intro-text">
          <span class="teacher-intro-name">{{ teacherName() || 'المعلم' }}</span>
          <span class="teacher-intro-sub">اختر مقرراً لتسجيل الحضور أو الدرجات</span>
          <span class="teacher-intro-sub-en">Select a course to record attendance or marks</span>
        </div>
      </div>

      <!-- Skeleton loading -->
      @if (loading()) {
        <div class="loading-area">
          <div class="skeleton-card" *ngFor="let i of [1,2,3]"></div>
        </div>
      }

      <!-- Error -->
      @if (error()) {
        <div class="error-msg">
          <i class="fas fa-exclamation-circle"></i>
          {{ error() }}
        </div>
      }

      <!-- Empty state -->
      @if (!loading() && !error() && courses().length === 0) {
        <div class="empty-state">
          <i class="fas fa-book-open"></i>
          <p>لا توجد مقررات لهذا المعلم</p>
          <small>No courses assigned yet</small>
        </div>
      }

      <!-- Section label + course list -->
      @if (!loading() && courses().length > 0) {
        <div class="section-label">
          <i class="fas fa-layer-group"></i>
          <span>المقررات · Courses</span>
          <span class="count-pill">{{ courses().length }}</span>
        </div>

        <div class="courses-grid">
          @for (course of courses(); track course.id) {
            <div class="course-card">
              <!-- Course info row -->
              <div class="course-info">
                <div class="course-card-icon">
                  <i class="fas fa-book"></i>
                </div>
                <div class="course-card-body">
                  <div class="course-name">{{ course.nameAr || course.nameEn }}</div>
                  @if (course.nameEn) {
                    <div class="course-name-en">{{ course.nameEn }}</div>
                  }
                  <div class="course-meta">
                    @if (course.code) {
                      <span class="meta-chip chip-code">{{ course.code }}</span>
                    }
                    @if (course.gradeName) {
                      <span class="meta-chip chip-grade">{{ course.gradeName }}</span>
                    }
                  </div>
                </div>
              </div>
              <!-- Action buttons -->
              <div class="course-actions">
                <button class="action-btn action-attendance" (click)="goToAttendance(course)">
                  <i class="fas fa-user-check"></i>
                  <span>الحضور</span>
                  <span class="action-en">Attendance</span>
                </button>
                <button class="action-btn action-marks" (click)="goToMarks(course)">
                  <i class="fas fa-star-half-alt"></i>
                  <span>الدرجات</span>
                  <span class="action-en">Marks</span>
                </button>
                <button class="action-btn action-students" (click)="goToStudents(course)">
                  <i class="fas fa-user-graduate"></i>
                  <span>الطلاب</span>
                  <span class="action-en">Students</span>
                </button>
                <button class="action-btn action-groups" (click)="toggleGroups(course)">
                  <i class="fas fa-layer-group"></i>
                  <span>المجموعات</span>
                  <span class="action-en">Groups</span>
                </button>
              </div>

              <!-- Inline groups panel -->
              @if (expandedCourseId() === course.id) {
                <div class="groups-panel">
                  @if (groupsLoading()) {
                    <div class="groups-load"><div class="mini-spinner"></div></div>
                  } @else {
                    @if (courseGroups().length === 0) {
                      <div class="groups-empty">لا توجد مجموعات · No groups</div>
                    }
                    @for (g of courseGroups(); track g.groupId) {
                      <div class="group-item">
                        <div class="gi-top">
                          <span class="gi-name"><i class="fas fa-layer-group"></i> {{ g.name }}</span>
                          @if (g.groupCode) { <span class="gi-code">{{ g.groupCode }}</span> }
                        </div>
                        @if (g.schedules?.length) {
                          <div class="gi-scheds">
                            @for (s of g.schedules; track s.dayOfWeek) {
                              <span class="gi-sched">{{ dayName(s.dayOfWeek) }} {{ fmtTime(s.startTime) }}-{{ fmtTime(s.endTime) }}</span>
                            }
                          </div>
                        }
                      </div>
                    }
                    <!-- Add group button -->
                    <button class="add-group-btn" (click)="createGroup(course)">
                      <i class="fas fa-plus"></i> إضافة مجموعة · Add Group
                    </button>
                  }
                </div>
              }
            </div>
          }
        </div>
      }

    </div>
  `,
  styles: [`
    :host {
      --grad-start: #667eea;
      --grad-end:   #764ba2;
      --bg:         #f4f5fb;
      --white:      #ffffff;
      --text-dark:  #1a1a2e;
      --text-mid:   #4a4a6a;
      --text-light: #9090aa;
      --radius:     18px;
    }

    .page {
      min-height: 100vh;
      background: var(--bg);
      padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
    }

    /* ── Teacher intro ── */
    .teacher-intro {
      background: linear-gradient(145deg, var(--grad-start) 0%, var(--grad-end) 100%);
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: .875rem;
    }
    .teacher-intro-text { flex: 1; min-width: 0; display: flex; flex-direction: column; }
    .teacher-intro-name { font-size: 1.4rem; font-weight: 800; color: #fff; line-height: 1.2; }
    .teacher-intro-sub { font-size: .82rem; color: rgba(255,255,255,.8); margin-top: .25rem; }
    .teacher-intro-sub-en { font-size: .7rem; color: rgba(255,255,255,.55); margin-top: .1rem; }

    .hero-icon {
      flex-shrink: 0;
      width: 52px; height: 52px; border-radius: 50%;
      background: rgba(255,255,255,.15);
      border: 2px solid rgba(255,255,255,.25);
      display: flex; align-items: center; justify-content: center;
    }
    .hero-icon i { font-size: 1.3rem; color: #fff; }

    /* ── Skeleton ── */
    .loading-area { padding: 1rem 1rem 0; display: flex; flex-direction: column; gap: .75rem; }
    .skeleton-card {
      height: 130px; border-radius: var(--radius);
      background: linear-gradient(90deg, #e8e8f0 25%, #f0f0f8 50%, #e8e8f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s infinite;
    }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

    /* ── Error ── */
    .error-msg {
      margin: 1rem; padding: .875rem 1rem; border-radius: 12px;
      background: #fff5f5; border: 1px solid #ffe0e0; color: #dc2626;
      font-size: .9rem; display: flex; align-items: center; gap: .5rem;
    }

    /* ── Empty ── */
    .empty-state {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; padding: 4rem 2rem; text-align: center;
    }
    .empty-state i { font-size: 3rem; color: var(--text-light); margin-bottom: 1rem; }
    .empty-state p { font-size: 1rem; font-weight: 600; color: var(--text-mid); margin: 0 0 .25rem; }
    .empty-state small { font-size: .8rem; color: var(--text-light); }

    /* ── Section label ── */
    .section-label {
      display: flex; align-items: center; gap: .5rem;
      padding: 1rem 1.25rem .5rem;
      font-size: .8rem; font-weight: 700;
      color: var(--text-mid); text-transform: uppercase; letter-spacing: .04em;
    }
    .section-label i { color: var(--grad-start); font-size: .85rem; }
    .count-pill {
      background: rgba(102,126,234,.12); color: var(--grad-start);
      font-size: .75rem; font-weight: 700;
      padding: .15rem .5rem; border-radius: 20px; min-width: 22px; text-align: center;
    }

    /* ── Course cards ── */
    .courses-grid {
      padding: 0 1rem 1rem;
      display: flex; flex-direction: column; gap: .75rem;
    }

    .course-card {
      background: var(--white);
      border-radius: var(--radius);
      overflow: hidden;
      box-shadow: 0 2px 12px rgba(0,0,0,.06);
    }

    .course-info {
      display: flex; align-items: center; gap: .75rem;
      padding: .875rem .875rem .75rem 1rem;
    }

    .course-card-icon {
      flex-shrink: 0; width: 48px; height: 48px; border-radius: 14px;
      background: linear-gradient(135deg, rgba(102,126,234,.12), rgba(118,75,162,.12));
      display: flex; align-items: center; justify-content: center;
    }
    .course-card-icon i { font-size: 1.2rem; color: var(--grad-start); }

    .course-card-body { flex: 1; min-width: 0; }

    .course-name {
      font-size: .95rem; font-weight: 700; color: var(--text-dark);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      margin-bottom: .1rem;
    }
    .course-name-en {
      font-size: .78rem; color: var(--text-light);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      margin-bottom: .3rem;
    }
    .course-meta { display: flex; flex-wrap: wrap; gap: .35rem; }
    .meta-chip {
      font-size: .68rem; font-weight: 600;
      padding: .15rem .5rem; border-radius: 20px;
    }
    .chip-code  { background: rgba(102,126,234,.1); color: var(--grad-start); }
    .chip-grade { background: rgba(118,75,162,.1);  color: var(--grad-end); }

    /* ── Action buttons inside card ── */
    .course-actions {
      display: grid; grid-template-columns: repeat(4, 1fr);
      border-top: 1px solid #f0f0f5;
    }

    .action-btn {
      border: none; padding: .8rem .5rem;
      cursor: pointer; display: flex; flex-direction: column;
      align-items: center; gap: .2rem; min-height: 68px;
      transition: background .15s; font-weight: 600;
    }
    .action-btn i { font-size: 1.1rem; }
    .action-btn span { font-size: .8rem; }
    .action-en { font-size: .65rem !important; opacity: .7; }

    .action-attendance {
      background: #f0f9ff; color: #0284c7;
      border-left: 1px solid #e0f2fe;
    }
    .action-attendance:active { background: #e0f2fe; }

    .action-marks { background: #fefce8; color: #ca8a04; }
    .action-marks:active { background: #fef9c3; }

    .action-students { background: #f0fdf4; color: #16a34a; border-right: 1px solid #dcfce7; }
    .action-students:active { background: #dcfce7; }

    .action-groups { background: #faf5ff; color: #7c3aed; }
    .action-groups:active { background: #f3e8ff; }

    /* Groups panel */
    .groups-panel {
      padding: .75rem; border-top: 1px solid #f0f0f5;
      background: #faf9ff; display: flex; flex-direction: column; gap: .5rem;
    }
    .groups-load { text-align: center; padding: .5rem; }
    .mini-spinner {
      width: 20px; height: 20px; border: 2px solid #e5e7eb;
      border-top-color: #667eea; border-radius: 50%;
      animation: shimmer-spin .7s linear infinite; display: inline-block;
    }
    @keyframes shimmer-spin { to { transform: rotate(360deg); } }
    .groups-empty { font-size: .82rem; color: #9ca3af; text-align: center; padding: .5rem; }
    .group-item {
      background: #fff; border-radius: 10px; padding: .6rem .75rem;
      border: 1px solid #e9e6ff;
    }
    .gi-top { display: flex; align-items: center; gap: .5rem; }
    .gi-name {
      font-size: .82rem; font-weight: 700; color: #1a1a2e; flex: 1;
      display: flex; align-items: center; gap: .3rem;
      i { font-size: .7rem; color: #667eea; }
    }
    .gi-code { font-size: .65rem; color: #9ca3af; }
    .gi-scheds { display: flex; flex-wrap: wrap; gap: .25rem; margin-top: .35rem; }
    .gi-sched {
      font-size: .62rem; font-weight: 600; color: #4a4a6a;
      background: #f0eeff; padding: .15rem .4rem; border-radius: 5px;
    }
    .add-group-btn {
      width: 100%; padding: .6rem; border: 1.5px dashed #667eea; border-radius: 10px;
      background: transparent; color: #667eea; font-size: .8rem; font-weight: 700;
      cursor: pointer; display: flex; align-items: center; justify-content: center; gap: .3rem;
      min-height: 44px;
    }
    .add-group-btn:active { background: rgba(102,126,234,.05); }
  `],
})
export class SecretaryTeacherCoursesComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly teacherService = inject(TeacherService);
  private readonly groupService = inject(GroupService);
  private readonly enrollmentSvc = inject(StudentEnrollmentService);

  teacherName = signal<string>('');
  courses = signal<CourseDto[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  private currentTeacherId: string | null = null;

  // Groups panel
  expandedCourseId = signal<string | null>(null);
  courseGroups = signal<GroupWithSchedulesDto[]>([]);
  groupsLoading = signal(false);

  async ngOnInit(): Promise<void> {
    const teacherId = this.route.snapshot.paramMap.get('teacherId');
    if (!teacherId) {
      this.error.set('معرّف المعلم غير موجود');
      return;
    }
    this.currentTeacherId = teacherId;
    const navState = window.history.state as any;
    if (navState?.teacherName) this.teacherName.set(navState.teacherName);
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

  goToStudents(course: CourseDto): void {
    this.router.navigate(['/students'], { queryParams: { courseId: course.id } });
  }

  async toggleGroups(course: CourseDto): Promise<void> {
    if (this.expandedCourseId() === course.id) {
      this.expandedCourseId.set(null);
      return;
    }
    this.expandedCourseId.set(course.id!);
    this.groupsLoading.set(true);
    try {
      const groups = await lastValueFrom(
        this.groupService.getGroupsByCourseAndTeacher(course.id!, this.currentTeacherId!)
      );
      this.courseGroups.set(groups ?? []);
    } catch { this.courseGroups.set([]); }
    finally { this.groupsLoading.set(false); }
  }

  async createGroup(course: CourseDto): Promise<void> {
    this.router.navigate(['/teacher-groups'], {
      queryParams: { courseId: course.id, teacherId: this.currentTeacherId }
    });
  }

  dayName(d: number): string {
    return ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][d] ?? '';
  }

  fmtTime(t?: string): string {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hr = parseInt(h);
    const d = hr > 12 ? hr - 12 : hr === 0 ? 12 : hr;
    return `${d}:${m}${hr >= 12 ? 'م' : 'ص'}`;
  }

  trackById = (_: number, item: CourseDto) => item.id;
}
