import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { lastValueFrom } from 'rxjs';
import { PullToRefreshDirective } from '../shared/directives/pull-to-refresh.directive';

import { SecretaryTeacherService } from '@proxy/teachers';
import type { SecretaryTeacherDto } from '@proxy/teachers';
import { CurrentUserInfoService } from '@proxy/common';
import { OfflineCacheService } from '../shared/services/offline-cache.service';
import { OfflineBannerComponent } from '../shared/components/offline-banner.component';
import { DidYouKnowComponent } from '../shared/components/did-you-know.component';
import { ActiveSemesterComponent } from '../shared/components/active-semester.component';
import { PageHeaderComponent } from '../shared/components/page-header.component';

@Component({
  selector: 'app-secretary-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, IonicModule, PullToRefreshDirective, OfflineBannerComponent, DidYouKnowComponent, ActiveSemesterComponent, PageHeaderComponent],
  template: `
    <div class="secretary-home" dir="rtl" appPullToRefresh (appPullToRefresh)="refreshData($event)">

      <app-active-semester />

      @if (offline()) {
        <app-offline-banner [lastUpdated]="offlineLastUpdated()" />
      }

      <!-- Header -->
      <app-page-header [title]="'الرئيسية'" [titleEn]="'Home'" [showBack]="false"></app-page-header>

      <!-- Identity card -->
      <div class="id-card">
        <div class="id-avatar">{{ getInitials(secretaryName()) }}</div>
        <div class="id-body">
          <span class="id-hello">مرحباً،</span>
          <span class="id-name">{{ secretaryName() || 'السكرتير' }}</span>
          <span class="id-sub">اختر معلماً لإدارة الحضور والدرجات · Select a teacher to manage</span>
        </div>
        <div class="id-role-ic"><i class="fas fa-user-tie"></i></div>
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
              <button class="teacher-card ion-activatable" (click)="goToTeacherCourses(t)">
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
                <ion-ripple-effect></ion-ripple-effect>
              </button>
            }
          </div>
        }
      }

      <!-- Quick Actions -->
      <div class="section-label">
        <i class="fas fa-bolt"></i>
        <span>إجراءات سريعة · Quick Actions</span>
      </div>
      <div class="quick-actions">
        <button class="qa-btn qa-link" (click)="goToLinkTeacher()">
          <span class="qa-ic"><i class="fas fa-user-plus"></i></span>
          <span class="qa-text">
            <span class="qa-ar">ربط معلم جديد</span>
            <span class="qa-en">Link Teacher</span>
          </span>
        </button>
        <button class="qa-btn qa-req" (click)="goToRequests()">
          <span class="qa-ic"><i class="fas fa-paper-plane"></i></span>
          <span class="qa-text">
            <span class="qa-ar">طلباتي</span>
            <span class="qa-en">My Requests</span>
          </span>
        </button>
        <button class="qa-btn qa-ann" (click)="goToAnnounce()">
          <span class="qa-ic"><i class="fas fa-bullhorn"></i></span>
          <span class="qa-text">
            <span class="qa-ar">إعلان للطلاب</span>
            <span class="qa-en">Announce</span>
          </span>
        </button>
        <button class="qa-btn qa-sched" (click)="goToScheduleOverview()">
          <span class="qa-ic"><i class="fas fa-calendar-alt"></i></span>
          <span class="qa-text">
            <span class="qa-ar">جدول المعلمين</span>
            <span class="qa-en">Schedule</span>
          </span>
        </button>
        <button class="qa-btn qa-bulk" (click)="goToBulkAttendance()">
          <span class="qa-ic"><i class="fas fa-clipboard-list"></i></span>
          <span class="qa-text">
            <span class="qa-ar">حضور جماعي</span>
            <span class="qa-en">Bulk Attendance</span>
          </span>
        </button>
        <button class="qa-btn qa-rep" (click)="goToReports()">
          <span class="qa-ic"><i class="fas fa-chart-bar"></i></span>
          <span class="qa-text">
            <span class="qa-ar">تقارير (تصدير)</span>
            <span class="qa-en">Reports (Export)</span>
          </span>
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

    /* ── Identity card (relocated greeting) ── */
    .id-card {
      display: flex;
      align-items: center;
      gap: .75rem;
      background: var(--white);
      margin: .75rem 1rem 0;
      padding: .85rem 1rem;
      border-radius: 16px;
      box-shadow: 0 2px 10px rgba(0,0,0,.05);
    }
    .id-avatar {
      flex-shrink: 0;
      width: 48px; height: 48px;
      border-radius: 14px;
      background: linear-gradient(135deg, var(--grad-start), var(--grad-end));
      color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.05rem; font-weight: 800;
    }
    .id-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: .12rem; }
    .id-hello { font-size: .72rem; color: var(--text-light); }
    .id-name  { font-size: 1.02rem; font-weight: 800; color: var(--text-dark); line-height: 1.2; }
    .id-sub   { font-size: .72rem; color: var(--text-mid); }
    .id-role-ic {
      flex-shrink: 0;
      width: 42px; height: 42px; border-radius: 12px;
      background: rgba(102,126,234,.1);
      display: flex; align-items: center; justify-content: center;
    }
    .id-role-ic i { font-size: 1.05rem; color: var(--grad-start); }

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
      position: relative;
      overflow: hidden;
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

    /* ── Quick actions — responsive card grid (2 cols mobile, 3 desktop) ── */
    .quick-actions {
      padding: 0 1rem 1rem;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: .7rem;
    }
    .qa-btn {
      display: flex; align-items: center; gap: .6rem;
      padding: .8rem .75rem;
      border: none; border-radius: 16px; cursor: pointer;
      background: var(--white);
      box-shadow: 0 2px 10px rgba(0,0,0,.06);
      text-align: right;
      min-height: 64px;
      width: 100%;
      transition: transform .15s, box-shadow .15s;
      -webkit-tap-highlight-color: transparent;
    }
    .qa-btn:active { transform: scale(.97); box-shadow: 0 1px 6px rgba(0,0,0,.1); }

    .qa-ic {
      flex-shrink: 0;
      width: 42px; height: 42px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-size: 1.05rem;
    }
    .qa-text { display: flex; flex-direction: column; min-width: 0; line-height: 1.25; }
    .qa-ar {
      font-size: .82rem; font-weight: 700; color: var(--text-dark);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .qa-en { font-size: .62rem; font-weight: 500; color: var(--text-light); }

    /* per-action accent on the icon tile */
    .qa-link  .qa-ic { background: linear-gradient(135deg, #667eea, #764ba2); }
    .qa-req   .qa-ic { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
    .qa-ann   .qa-ic { background: linear-gradient(135deg, #8b5cf6, #6d28d9); }
    .qa-sched .qa-ic { background: linear-gradient(135deg, #0ea5e9, #0284c7); }
    .qa-bulk  .qa-ic { background: linear-gradient(135deg, #10b981, #047857); }
    .qa-rep   .qa-ic { background: linear-gradient(135deg, #f093fb, #f5576c); }

    @media (min-width: 768px) {
      .quick-actions { grid-template-columns: repeat(3, 1fr); }
    }

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

  async refreshData(e: { complete: () => void }): Promise<void> {
    try {
      await Promise.all([this.loadTeachers(), this.loadSecretaryName()]);
    } finally {
      e.complete();
    }
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

  getInitials(name: string | undefined): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0]?.[0]?.toUpperCase() || '?';
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
