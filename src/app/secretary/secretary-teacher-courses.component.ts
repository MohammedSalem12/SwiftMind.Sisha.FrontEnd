import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { TeacherService } from '@proxy/teachers';
import type { CourseDto } from '@proxy/courses/dtos/models';

@Component({
  selector: 'app-secretary-teacher-courses',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page" dir="rtl">

      <!-- Hero header with back button -->
      <div class="hero">
        <div class="hero-blob hero-blob-1"></div>
        <div class="hero-blob hero-blob-2"></div>
        <button class="btn-back" (click)="goBack()">
          <i class="fas fa-arrow-right"></i>
        </button>
        <div class="hero-content">
          <div class="hero-greeting">
            <span class="hero-label">مقررات المعلم</span>
            <span class="hero-name">{{ teacherName() || 'المعلم' }}</span>
          </div>
          <p class="hero-sub">اختر مقرراً لتسجيل الحضور أو الدرجات</p>
          <p class="hero-sub-en">Select a course to record attendance or marks</p>
        </div>
        <div class="hero-icon">
          <i class="fas fa-book"></i>
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
                  <span>الحضور والغياب</span>
                  <span class="action-en">Attendance</span>
                </button>
                <button class="action-btn action-marks" (click)="goToMarks(course)">
                  <i class="fas fa-star-half-alt"></i>
                  <span>إدخال الدرجات</span>
                  <span class="action-en">Marks Entry</span>
                </button>
              </div>
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

    /* ── Hero ── */
    .hero {
      background: linear-gradient(145deg, var(--grad-start) 0%, var(--grad-end) 100%);
      padding: calc(env(safe-area-inset-top, 0px) + 1.25rem) 1.25rem 2rem;
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: flex-start;
      gap: .875rem;
    }
    .hero-blob {
      position: absolute; border-radius: 50%;
      background: rgba(255,255,255,.07); pointer-events: none;
    }
    .hero-blob-1 { width: 200px; height: 200px; top: -70px; right: -50px; }
    .hero-blob-2 { width: 120px; height: 120px; bottom: -40px; left: -20px; }

    .btn-back {
      flex-shrink: 0; z-index: 1;
      width: 40px; height: 40px; border-radius: 50%;
      background: rgba(255,255,255,.2); border: none;
      color: #fff; font-size: 1rem; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      margin-top: .1rem;
    }

    .hero-content { z-index: 1; flex: 1; }
    .hero-greeting { display: flex; flex-direction: column; margin-bottom: .35rem; }
    .hero-label { font-size: .78rem; color: rgba(255,255,255,.7); }
    .hero-name  { font-size: 1.4rem; font-weight: 800; color: #fff; line-height: 1.2; }
    .hero-sub   { font-size: .82rem; color: rgba(255,255,255,.8); margin: 0; }
    .hero-sub-en { font-size: .7rem; color: rgba(255,255,255,.55); margin: .1rem 0 0; }

    .hero-icon {
      z-index: 1; flex-shrink: 0;
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
      display: grid; grid-template-columns: 1fr 1fr;
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

  goBack(): void {
    this.router.navigate(['/secretary']);
  }

  trackById = (_: number, item: CourseDto) => item.id;
}
