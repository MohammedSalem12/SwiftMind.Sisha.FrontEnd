import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { SecretaryTeacherService } from '@proxy/teachers';
import type { SecretaryTeacherDto } from '@proxy/teachers';
import { CurrentUserInfoService } from '@proxy/common';
import { OfflineCacheService } from '../shared/services/offline-cache.service';
import { OfflineBannerComponent } from '../shared/components/offline-banner.component';
import { DidYouKnowComponent } from '../shared/components/did-you-know.component';
import { ActiveSemesterComponent } from '../shared/components/active-semester.component';

@Component({
  selector: 'app-secretary-home',
  standalone: true,
  imports: [CommonModule, OfflineBannerComponent, DidYouKnowComponent, ActiveSemesterComponent],
  template: `
    <div class="secretary-home" dir="rtl">

      <app-active-semester />

      @if (offline()) {
        <app-offline-banner [lastUpdated]="offlineLastUpdated()" />
      }

      <!-- Hero (hidden on mobile - info in top bar) -->
      <div class="hero hide-on-mobile">
        <div class="hero-blob hero-blob-1"></div>
        <div class="hero-blob hero-blob-2"></div>
        <div class="hero-content">
          <div class="hero-greeting">
            <span class="hero-hello">مرحباً،</span>
            <span class="hero-name">{{ secretaryName() || 'السكرتير' }}</span>
          </div>
          <p class="hero-sub">اختر معلماً لعرض مقرراته وإدارة الحضور والدرجات</p>
          <p class="hero-sub-en">Select a teacher to manage their courses</p>
        </div>
        <div class="hero-icon">
          <i class="fas fa-user-tie"></i>
        </div>
      </div>

      <app-did-you-know [role]="'SECRETARY'" />

      <!-- Shimmer skeleton while loading -->
      @if (loading()) {
        <div class="loading-area">
          <div class="skeleton-card" *ngFor="let i of [1,2,3]"></div>
        </div>
      }

      <!-- Empty state -->
      @if (!loading() && teachers().length === 0) {
        <div class="empty-state">
          <i class="fas fa-chalkboard-teacher"></i>
          <p>لا يوجد معلمون مرتبطون</p>
          <small>No linked teachers yet</small>
        </div>
      }

      <!-- Section label + teacher list -->
      @if (!loading() && teachers().length > 0) {
        <button class="section-label section-label--toggle" (click)="teachersExpanded.set(!teachersExpanded())">
          <i class="fas fa-chalkboard-teacher"></i>
          <span>المعلمون المرتبطون · Linked Teachers</span>
          <span class="count-pill">{{ teachers().length }}</span>
          <i class="fas toggle-chevron" [class.fa-chevron-down]="!teachersExpanded()" [class.fa-chevron-up]="teachersExpanded()"></i>
        </button>

        @if (teachersExpanded()) {
          <div class="teachers-grid collapsible-content">
            @for (t of teachers(); track t.id) {
              <button class="teacher-card" (click)="goToTeacherCourses(t)">
                <div class="teacher-card-icon">
                  <i class="fas fa-chalkboard-teacher"></i>
                </div>
                <div class="teacher-card-body">
                  <div class="teacher-name">{{ t.teacherName }}</div>
                  <div class="teacher-meta">
                    @if (t.teacherCode) {
                      <span class="meta-chip chip-code">{{ t.teacherCode }}</span>
                    }
                  </div>
                </div>
                <div class="teacher-card-arrow">
                  <i class="fas fa-chevron-left"></i>
                </div>
              </button>
            }
          </div>
        }
      }

      <!-- Quick Actions -->
      <div class="quick-actions">
        <button class="qa-btn" (click)="goToLinkTeacher()">
          <i class="fas fa-user-plus"></i>
          <div class="qa-text">
            <span>ربط معلم جديد</span>
            <span class="qa-en">Link Teacher</span>
          </div>
        </button>
        <button class="qa-btn qa-btn-enrollment" (click)="goToEnrollmentRequests()">
          <i class="fas fa-clipboard-check"></i>
          <div class="qa-text">
            <span>طلبات التسجيل</span>
            <span class="qa-en">Enrollment Requests</span>
          </div>
        </button>
        <button class="qa-btn qa-btn-group" (click)="goToCreateGroup()">
          <i class="fas fa-layer-group"></i>
          <div class="qa-text">
            <span>إنشاء مجموعة</span>
            <span class="qa-en">Create Group</span>
          </div>
        </button>
        <button class="qa-btn qa-btn-requests" (click)="goToRequests()">
          <i class="fas fa-paper-plane"></i>
          <div class="qa-text">
            <span>طلباتي</span>
            <span class="qa-en">My Requests</span>
          </div>
        </button>
        <button class="qa-btn qa-btn-announce" (click)="goToAnnounce()">
          <i class="fas fa-bullhorn"></i>
          <div class="qa-text">
            <span>إعلان للطلاب</span>
            <span class="qa-en">Announce</span>
          </div>
        </button>
        <button class="qa-btn qa-btn-schedule" (click)="goToScheduleOverview()">
          <i class="fas fa-calendar-alt"></i>
          <div class="qa-text">
            <span>جدول المعلمين</span>
            <span class="qa-en">Schedule</span>
          </div>
        </button>
        <button class="qa-btn qa-btn-bulk" (click)="goToBulkAttendance()">
          <i class="fas fa-clipboard-list"></i>
          <div class="qa-text">
            <span>حضور جماعي</span>
            <span class="qa-en">Bulk Attendance</span>
          </div>
        </button>
        <button class="qa-btn qa-btn-reports" (click)="goToReports()">
          <i class="fas fa-chart-bar"></i>
          <div class="qa-text">
            <span>تقارير (تصدير)</span>
            <span class="qa-en">Reports (Export)</span>
          </div>
        </button>
      </div>

    </div>
  `,
  styles: [`
    /* ── Design tokens ── */
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

    .secretary-home {
      min-height: 100vh;
      background: var(--bg);
      padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
    }

    /* ── Hero ── */
    .hero {
      background: linear-gradient(145deg, var(--grad-start) 0%, var(--grad-end) 100%);
      padding: calc(env(safe-area-inset-top, 0px) + 0.6rem) 1.25rem 0.7rem;
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: .75rem;
    }
    .hero-blob {
      position: absolute;
      border-radius: 50%;
      background: rgba(255,255,255,.07);
      pointer-events: none;
    }
    .hero-blob-1 { width: 220px; height: 220px; top: -80px; right: -60px; }
    .hero-blob-2 { width: 140px; height: 140px; bottom: -50px; left: -30px; }

    .hero-content { z-index: 1; }
    .hero-greeting { display: flex; flex-direction: column; margin-bottom: .35rem; }
    .hero-hello { font-size: .75rem; color: rgba(255,255,255,.75); }
    .hero-name  { font-size: 1.1rem; font-weight: 800; color: var(--white); line-height: 1.2; }
    .hero-sub   { font-size: .85rem; color: rgba(255,255,255,.8); margin: 0; }
    .hero-sub-en { font-size: .72rem; color: rgba(255,255,255,.55); margin: .1rem 0 0; }

    .hero-icon {
      z-index: 1;
      width: 42px; height: 42px; border-radius: 50%;
      background: rgba(255,255,255,.15);
      border: 1.5px solid rgba(255,255,255,.25);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .hero-icon i { font-size: 1.1rem; color: var(--white); }

    /* ── Skeleton shimmer ── */
    .loading-area {
      padding: 1rem 1rem 0;
      display: flex;
      flex-direction: column;
      gap: .75rem;
    }
    .skeleton-card {
      height: 80px;
      border-radius: var(--radius);
      background: linear-gradient(90deg, #e8e8f0 25%, #f0f0f8 50%, #e8e8f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s infinite;
    }
    @keyframes shimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* ── Empty state ── */
    .empty-state {
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      padding: 4rem 2rem; text-align: center;
    }
    .empty-state i { font-size: 3rem; color: var(--text-light); margin-bottom: 1rem; }
    .empty-state p  { font-size: 1rem; font-weight: 600; color: var(--text-mid); margin: 0 0 .25rem; }
    .empty-state small { font-size: .8rem; color: var(--text-light); }

    /* ── Section label ── */
    .section-label {
      display: flex;
      align-items: center;
      gap: .5rem;
      padding: 1rem 1.25rem .5rem;
      font-size: .8rem;
      font-weight: 700;
      color: var(--text-mid);
      text-transform: uppercase;
      letter-spacing: .04em;
    }
    .section-label i { color: var(--grad-start); font-size: .85rem; }

    .count-pill {
      background: rgba(102,126,234,.12);
      color: var(--grad-start);
      font-size: .75rem; font-weight: 700;
      padding: .15rem .5rem; border-radius: 20px;
      min-width: 22px; text-align: center;
    }

    .see-all-btn {
      margin-right: auto;
      background: none; border: none;
      color: var(--grad-start);
      font-size: .78rem; font-weight: 700;
      cursor: pointer; display: flex; align-items: center; gap: .3rem;
    }

    /* ── Teacher cards ── */
    .teachers-grid {
      padding: 0 1rem 1rem;
      display: flex;
      flex-direction: column;
      gap: .75rem;
    }

    .teacher-card {
      display: flex;
      align-items: center;
      gap: .75rem;
      background: var(--white);
      border-radius: var(--radius);
      padding: .875rem .875rem .875rem 1rem;
      border: none;
      cursor: pointer;
      text-align: right;
      width: 100%;
      box-shadow: 0 2px 12px rgba(0,0,0,.06);
      transition: transform .15s, box-shadow .15s;
      min-height: 72px;
    }
    .teacher-card:active {
      transform: scale(.98);
      box-shadow: 0 1px 6px rgba(0,0,0,.08);
    }

    .teacher-card-icon {
      flex-shrink: 0;
      width: 48px; height: 48px; border-radius: 14px;
      background: linear-gradient(135deg, rgba(102,126,234,.12), rgba(118,75,162,.12));
      display: flex; align-items: center; justify-content: center;
    }
    .teacher-card-icon i { font-size: 1.2rem; color: var(--grad-start); }

    .teacher-card-body { flex: 1; min-width: 0; }

    .teacher-name {
      font-size: .95rem; font-weight: 700; color: var(--text-dark);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      margin-bottom: .35rem;
    }

    .teacher-meta { display: flex; flex-wrap: wrap; gap: .35rem; }

    .meta-chip {
      font-size: .68rem; font-weight: 600;
      padding: .15rem .5rem; border-radius: 20px;
    }
    .chip-code { background: rgba(102,126,234,.1); color: var(--grad-start); }

    .teacher-card-arrow { flex-shrink: 0; color: var(--text-light); font-size: .9rem; }

    /* ── Inline quick actions ── */
    .quick-actions {
      padding: 0 1rem .5rem;
      display: flex;
      gap: .75rem;
    }
    .qa-btn {
      flex: 1;
      display: flex; align-items: center; gap: .6rem;
      padding: .75rem 1rem;
      border: none; border-radius: 14px; cursor: pointer;
      font-weight: 700; font-size: .85rem; color: var(--white);
      background: linear-gradient(135deg, var(--grad-start), var(--grad-end));
      box-shadow: 0 3px 12px rgba(0,0,0,.15);
      transition: transform .15s, box-shadow .15s;
    }
    .qa-btn:active { transform: scale(.97); box-shadow: 0 1px 6px rgba(0,0,0,.1); }
    .qa-btn i { font-size: 1rem; flex-shrink: 0; }
    .qa-btn-reports { background: linear-gradient(135deg, #f093fb, #f5576c); }
    .qa-btn-enrollment { background: linear-gradient(135deg, #10b981, #059669); }
    .qa-btn-course { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
    .qa-btn-group { background: linear-gradient(135deg, #f59e0b, #d97706); }
    .qa-btn-announce { background: linear-gradient(135deg, #8b5cf6, #6d28d9); }
    .qa-btn-schedule { background: linear-gradient(135deg, #0ea5e9, #0284c7); }
    .qa-btn-bulk { background: linear-gradient(135deg, #10b981, #047857); }
    .qa-text { display: flex; flex-direction: column; align-items: flex-start; line-height: 1.2; }
    .qa-en { font-size: .65rem; font-weight: 500; opacity: .85; }

    /* ── Collapsible toggle ── */
    .section-label--toggle {
      width: 100%;
      background: none; border: none;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      min-height: 44px;
    }
    .section-label--toggle:active { opacity: .7; }
    .toggle-chevron {
      margin-right: auto;
      font-size: .7rem;
      color: var(--text-light);
      transition: transform .2s ease;
    }
    .collapsible-content {
      animation: collapseIn .2s ease-out;
    }
    @keyframes collapseIn {
      from { opacity: 0; transform: translateY(-8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `],
})
export class SecretaryHomeComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly secretaryTeacherService = inject(SecretaryTeacherService);
  private readonly currentUserService = inject(CurrentUserInfoService);
  private readonly cache = inject(OfflineCacheService);

  teachers = signal<SecretaryTeacherDto[]>([]);
  loading = signal(false);
  secretaryName = signal<string>('');
  teachersExpanded = signal(true);
  offline = signal(false);
  offlineLastUpdated = signal('');

  private readonly CACHE_KEY = 'secretary_home';

  async ngOnInit() {
    await Promise.all([this.loadTeachers(), this.loadSecretaryName()]);
    if (!this.offline()) {
      this.cache.set(this.CACHE_KEY, {
        secretaryName: this.secretaryName(),
        teachers: this.teachers(),
      });
    }
  }

  private async loadSecretaryName() {
    try {
      const info = await lastValueFrom(this.currentUserService.getCurrentUserActorInfo());
      this.secretaryName.set(info?.actorName ?? '');
    } catch { /* silent */ }
  }

  private async loadTeachers() {
    this.loading.set(true);
    try {
      const res = await lastValueFrom(
        this.secretaryTeacherService.getTeachersForCurrentSecretary({ skipHandleError: true })
      );
      this.teachers.set(res ?? []);
    } catch (err) {
      console.error('Error loading teachers:', err);
      this.restoreFromCache();
    } finally {
      this.loading.set(false);
    }
  }

  private restoreFromCache(): void {
    const cached = this.cache.get<any>(this.CACHE_KEY);
    if (cached) {
      this.secretaryName.set(cached.secretaryName || '');
      this.teachers.set(cached.teachers || []);
      this.offline.set(true);
      this.offlineLastUpdated.set(this.cache.getLastUpdatedLabel(this.CACHE_KEY));
    }
  }

  goToRequests() {
    this.router.navigate(['/secretary/requests']);
  }

  goToLinkTeacher() {
    this.router.navigate(['/secretary/link-teacher']);
  }

  goToReports() {
    this.router.navigate(['/reports/absence']);
  }

  goToEnrollmentRequests() {
    this.router.navigate(['/enrollment-requests']);
  }

  goToAddCourse() {
    this.router.navigate(['/add-course']);
  }

  goToCreateGroup() {
    this.router.navigate(['/teacher-groups/create']);
  }

  goToAnnounce() {
    this.router.navigate(['/secretary/announce']);
  }

  goToScheduleOverview() {
    this.router.navigate(['/secretary/schedule-overview']);
  }

  goToBulkAttendance() {
    this.router.navigate(['/secretary/bulk-attendance']);
  }

  goToTeacherCourses(teacher: SecretaryTeacherDto) {
    this.router.navigate(['/secretary/teacher', teacher.teacherId], {
      state: { teacherName: teacher.teacherName }
    });
  }

  trackById = (_: number, item: SecretaryTeacherDto) => item.id;
}
