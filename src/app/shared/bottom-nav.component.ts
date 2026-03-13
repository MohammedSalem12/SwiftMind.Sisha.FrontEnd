import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, OnDestroy, effect, computed } from '@angular/core';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { ConfigStateService, AuthService } from '@abp/ng.core';
import { filter, take, Subscription, lastValueFrom } from 'rxjs';
import { ROLES } from '../route.provider';
import { RealtimeNotificationService } from './services/realtime-notification.service';
import { EnrollmentRequestService } from '@proxy/student-enrollments';
import { SecretaryTeacherService } from '@proxy/teachers';

interface NavItem {
  path: string;
  label: string;
  labelEn: string;
  icon: string;
  badge?: 'requests' | 'notifications';
}

interface SecondaryItem {
  path: string;
  label: string;
  labelEn: string;
  icon: string;
}

function getRoleHomePath(roles: string[]): string {
  if (roles.includes(ROLES.STUDENT))    return '/student';
  if (roles.includes(ROLES.TEACHER))    return '/teacher';
  if (roles.includes(ROLES.PARENT))     return '/parent';
  if (roles.includes(ROLES.SECRETARY))  return '/secretary';
  if (roles.includes(ROLES.ADMIN))      return '/secretary-assignments';
  return '/';
}

function getRoleProfilePath(roles: string[]): string {
  if (roles.includes(ROLES.STUDENT))   return '/student/profile';
  if (roles.includes(ROLES.TEACHER))   return '/teacher/profile';
  if (roles.includes(ROLES.PARENT))    return '/parent/profile';
  if (roles.includes(ROLES.SECRETARY)) return '/secretary/profile';
  return '/profile';
}

function getRoleRequestsPath(roles: string[]): string {
  if (roles.includes(ROLES.STUDENT))    return '/student/requests';
  if (roles.includes(ROLES.TEACHER))    return '/teacher/my-requests';
  if (roles.includes(ROLES.PARENT))     return '/parent/requests';
  if (roles.includes(ROLES.SECRETARY))  return '/secretary/requests';
  if (roles.includes(ROLES.ADMIN))      return '/enrollment-requests';
  return '/notifications';
}

function getSecondaryItems(roles: string[]): SecondaryItem[] {
  if (roles.includes(ROLES.ADMIN)) return [
    { path: '/students',             label: 'الطلاب',              labelEn: 'Students',           icon: 'fas fa-user-graduate' },
    { path: '/teachers',             label: 'المعلمون',             labelEn: 'Teachers',           icon: 'fas fa-chalkboard-teacher' },
    { path: '/parents',              label: 'أولياء الأمور',       labelEn: 'Parents',            icon: 'fas fa-users-cog' },
    { path: '/courses',              label: 'المقررات',             labelEn: 'Courses',            icon: 'fas fa-book' },
    { path: '/attendance',           label: 'الحضور',               labelEn: 'Attendance',         icon: 'fas fa-user-check' },
    { path: '/add-teacher',          label: 'إضافة معلم',          labelEn: 'Add Teacher',        icon: 'fas fa-user-plus' },
    { path: '/add-student',          label: 'إضافة طالب',          labelEn: 'Add Student',        icon: 'fas fa-user-plus' },
  ];
  return [];
}

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
@if (!navHidden()) {
    <!-- ══════════════════════════════════════════════════
         MOBILE — Fixed bottom bar (< 768px)
    ══════════════════════════════════════════════════ -->
    <nav class="mobile-nav" dir="rtl">
      <div class="mn-inner">

        <!-- 5 core tabs -->
        @for (item of coreNav(); track item.path) {
          <a class="mn-tab" [routerLink]="item.path" [class.active]="isActive(item.path)">
            <div class="mn-icon-wrap">
              <i [class]="item.icon"></i>
              @if (badge(item) > 0) {
                <span class="mn-badge">{{ badge(item) > 9 ? '9+' : badge(item) }}</span>
              }
            </div>
            <span class="mn-label">{{ item.label }}</span>
            @if (isActive(item.path)) { <span class="mn-bar"></span> }
          </a>
        }

        <!-- Profile tab → navigates to profile page (logout is on profile page) -->
        <a class="mn-tab" [routerLink]="profilePath()" [class.active]="isActive(profilePath()!)">
          <div class="mn-avatar-sm">
            @if (userInitials() !== '?') { <span>{{ userInitials() }}</span> }
            @else { <i class="fas fa-user"></i> }
          </div>
          <span class="mn-label">ملفي</span>
          @if (isActive(profilePath()!)) { <span class="mn-bar"></span> }
        </a>

      </div>
    </nav>

    <!-- ══════════════════════════════════════════════════
         DESKTOP — Right sidebar (≥ 768px)
    ══════════════════════════════════════════════════ -->
    <aside class="desktop-nav" dir="rtl">

      <!-- App brand -->
      <div class="dn-brand">
        <div class="dn-logo">
          <i class="fas fa-graduation-cap"></i>
        </div>
        <div class="dn-brand-text">
          <span class="dn-brand-name">SwiftMind</span>
          <span class="dn-brand-sub">Sesha</span>
        </div>
      </div>

      <!-- Core nav items -->
      <nav class="dn-nav">
        <p class="dn-section-label">القائمة الرئيسية</p>
        @for (item of coreNav(); track item.path) {
          <a class="dn-item" [routerLink]="item.path" [class.active]="isActive(item.path)">
            <div class="dn-item-icon">
              <i [class]="item.icon"></i>
              @if (badge(item) > 0) {
                <span class="dn-badge">{{ badge(item) > 9 ? '9+' : badge(item) }}</span>
              }
            </div>
            <div class="dn-item-text">
              <span class="dn-item-label">{{ item.label }}</span>
              <span class="dn-item-label-en">{{ item.labelEn }}</span>
            </div>
          </a>
        }

        <!-- Profile link -->
        <a class="dn-item" [routerLink]="profilePath()" [class.active]="isActive(profilePath()!)">
          <div class="dn-item-icon">
            <i class="fas fa-user-circle"></i>
          </div>
          <div class="dn-item-text">
            <span class="dn-item-label">ملفي الشخصي</span>
            <span class="dn-item-label-en">My Profile</span>
          </div>
        </a>
      </nav>

      <!-- Secondary items -->
      @if (secondaryNav().length > 0) {
        <div class="dn-divider"></div>
        <nav class="dn-nav">
          <p class="dn-section-label">أدوات أخرى</p>
          @for (item of secondaryNav(); track item.path) {
            <a class="dn-item dn-item-sm" [routerLink]="item.path" [class.active]="isActive(item.path)">
              <div class="dn-item-icon sm">
                <i [class]="item.icon"></i>
              </div>
              <div class="dn-item-text">
                <span class="dn-item-label">{{ item.label }}</span>
              </div>
            </a>
          }
        </nav>
      }

      <!-- Spacer -->
      <div style="flex:1"></div>

      <!-- User profile footer -->
      <div class="dn-user">
        <div class="dn-user-avatar">
          @if (userInitials() !== '?') { <span>{{ userInitials() }}</span> }
          @else { <i class="fas fa-user"></i> }
        </div>
        <div class="dn-user-info">
          <p class="dn-user-name">{{ displayName() || 'مستخدم' }}</p>
          @if (userEmail()) { <p class="dn-user-email">{{ userEmail() }}</p> }
        </div>
        <button class="dn-logout-btn" (click)="logout()" title="تسجيل الخروج">
          <i class="fas fa-sign-out-alt"></i>
        </button>
      </div>

    </aside>
}
  `,
  styles: [`
    /* ═══════════════════════════════════════════════════════
       MOBILE BOTTOM NAV  (< 768px)
    ═══════════════════════════════════════════════════════ */
    .mobile-nav {
      display: none;
      position: fixed;
      bottom: 0; left: 0; right: 0;
      z-index: 1000;
      background: #ffffff;
      border-top: 1px solid #e5e7eb;
      box-shadow: 0 -2px 16px rgba(0,0,0,0.06);
      padding-bottom: max(4px, env(safe-area-inset-bottom));
    }

    .mn-inner {
      display: flex;
      align-items: stretch;
      height: 58px;
      width: 100%;
      padding: 0;
    }

    .mn-tab {
      position: relative;
      flex: 1;
      width: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3px;
      text-decoration: none;
      color: #9ca3af;
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 6px 0 4px;
      min-width: 0;
      transition: color 0.2s;
      -webkit-tap-highlight-color: transparent;
    }
    .mn-tab.active { color: #5b21b6; }

    .mn-icon-wrap {
      position: relative;
      width: 44px; height: 28px;
      display: flex; align-items: center; justify-content: center;
      border-radius: 14px;
      transition: background 0.2s;
    }
    .mn-tab.active .mn-icon-wrap {
      background: rgba(91,33,182,0.12);
    }
    .mn-icon-wrap i { font-size: 1.25rem; }

    .mn-label {
      font-size: 0.65rem;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
      text-align: center;
      line-height: 1;
    }

    .mn-bar {
      position: absolute;
      top: 0; left: 50%;
      transform: translateX(-50%);
      width: 24px; height: 3px;
      border-radius: 0 0 3px 3px;
      background: linear-gradient(90deg, #7c3aed, #5b21b6);
    }

    .mn-badge {
      position: absolute;
      top: -4px; right: -2px;
      background: #ef4444;
      color: #fff;
      font-size: 0.5rem;
      font-weight: 700;
      min-width: 16px; height: 16px;
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      padding: 0 3px;
      border: 2px solid white;
      box-shadow: 0 1px 4px rgba(239,68,68,0.3);
    }

    .mn-avatar-sm {
      width: 28px; height: 28px;
      border-radius: 50%;
      background: linear-gradient(135deg, #7c3aed, #5b21b6);
      color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.65rem; font-weight: 700;
      border: 2px solid rgba(255,255,255,0.9);
      box-shadow: 0 1px 4px rgba(124,58,237,0.25);
    }
    .mn-tab.active .mn-avatar-sm {
      box-shadow: 0 2px 8px rgba(124,58,237,0.45);
    }

    /* Profile tab avatar */

    /* ═══════════════════════════════════════════════════════
       DESKTOP SIDEBAR  (≥ 768px)
    ═══════════════════════════════════════════════════════ */
    .desktop-nav {
      display: none;
      position: fixed;
      top: 0; right: 0;
      width: 248px;
      height: 100vh;
      height: 100dvh;
      background: #1a2142;
      flex-direction: column;
      z-index: 900;
      overflow-y: auto;
      overflow-x: hidden;
      overscroll-behavior: contain;
      box-shadow: -4px 0 24px rgba(0,0,0,0.18);
      padding-bottom: env(safe-area-inset-bottom, 0px);
    }
    .desktop-nav::-webkit-scrollbar { width: 3px; }
    .desktop-nav::-webkit-scrollbar-thumb {
      background: rgba(255,255,255,0.12); border-radius: 2px;
    }

    /* Brand */
    .dn-brand {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 1.5rem 1.25rem 1.25rem;
      border-bottom: 1px solid rgba(255,255,255,0.07);
    }
    .dn-logo {
      width: 42px; height: 42px; border-radius: 12px;
      background: linear-gradient(135deg, #7c3aed, #5b21b6);
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-size: 1.15rem; flex-shrink: 0;
    }
    .dn-brand-text { line-height: 1.2; }
    .dn-brand-name {
      display: block; font-size: 1rem; font-weight: 800; color: #fff;
    }
    .dn-brand-sub {
      display: block; font-size: 0.72rem; font-weight: 500;
      color: rgba(255,255,255,0.45); letter-spacing: 0.05em;
    }

    /* Section labels */
    .dn-section-label {
      margin: 0 0 0.25rem; padding: 0 1rem;
      font-size: 0.65rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.08em; color: rgba(255,255,255,0.3);
    }

    /* Nav */
    .dn-nav {
      padding: 1rem 0.625rem 0.5rem;
      display: flex; flex-direction: column; gap: 2px;
    }

    .dn-item {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 0.65rem 0.875rem;
      border-radius: 12px;
      text-decoration: none;
      color: rgba(255,255,255,0.65);
      transition: background 0.15s, color 0.15s;
      min-height: 48px;
      cursor: pointer;
    }
    .dn-item:hover {
      background: rgba(255,255,255,0.07);
      color: rgba(255,255,255,0.9);
    }
    .dn-item.active {
      background: linear-gradient(135deg, rgba(124,58,237,0.35), rgba(91,33,182,0.35));
      color: #fff;
    }

    .dn-item-icon {
      position: relative;
      width: 36px; height: 36px; border-radius: 10px;
      background: rgba(255,255,255,0.07);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; transition: background 0.15s;
    }
    .dn-item-icon.sm { width: 30px; height: 30px; border-radius: 8px; }
    .dn-item-icon i { font-size: 0.95rem; }
    .dn-item.active .dn-item-icon {
      background: linear-gradient(135deg, #7c3aed, #5b21b6);
    }

    .dn-badge {
      position: absolute; top: -4px; right: -4px;
      background: #ef4444; color: #fff;
      font-size: 0.5rem; font-weight: 700;
      min-width: 15px; height: 15px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      padding: 0 3px; border: 1.5px solid #1a2142;
    }

    .dn-item-text { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
    .dn-item-label {
      font-size: 0.88rem; font-weight: 600; line-height: 1.2;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .dn-item-label-en {
      font-size: 0.68rem; font-weight: 400; opacity: 0.5; line-height: 1;
    }

    .dn-item-sm .dn-item-label { font-size: 0.82rem; }

    /* Divider */
    .dn-divider {
      height: 1px; background: rgba(255,255,255,0.07);
      margin: 0.5rem 1rem;
    }

    /* User footer */
    .dn-user {
      display: flex; align-items: center; gap: 0.625rem;
      padding: 1rem;
      border-top: 1px solid rgba(255,255,255,0.07);
      background: rgba(0,0,0,0.15);
    }
    .dn-user-avatar {
      width: 38px; height: 38px; border-radius: 50%; flex-shrink: 0;
      background: linear-gradient(135deg, #7c3aed, #5b21b6);
      color: #fff; display: flex; align-items: center; justify-content: center;
      font-size: 0.85rem; font-weight: 700;
    }
    .dn-user-info { flex: 1; min-width: 0; }
    .dn-user-name {
      margin: 0; font-size: 0.82rem; font-weight: 600; color: #fff;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .dn-user-email {
      margin: 1px 0 0; font-size: 0.68rem; color: rgba(255,255,255,0.4);
      direction: ltr; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .dn-logout-btn {
      width: 34px; height: 34px; border-radius: 9px; flex-shrink: 0;
      background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.2);
      color: #f87171; font-size: 0.85rem; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.15s;
    }
    .dn-logout-btn:hover { background: rgba(239,68,68,0.3); }

    /* ═══════════════════════════════════════════════════════
       RESPONSIVE SHOW/HIDE
    ═══════════════════════════════════════════════════════ */
    @media (max-width: 767px) {
      .mobile-nav { display: flex; }
    }

    @media (min-width: 768px) {
      .desktop-nav { display: flex; }
    }

    /* iOS safe area for mobile nav */
    @supports (padding-bottom: env(safe-area-inset-bottom)) {
      .mobile-nav { padding-bottom: calc(4px + env(safe-area-inset-bottom)); }
    }
  `],
})
export class BottomNavComponent implements OnInit, OnDestroy {
  private readonly router              = inject(Router);
  private readonly configStateService  = inject(ConfigStateService);
  private readonly authService         = inject(AuthService);
  private readonly realtimeSvc         = inject(RealtimeNotificationService);
  private readonly enrollmentSvc       = inject(EnrollmentRequestService);
  private readonly secretaryTeacherSvc = inject(SecretaryTeacherService);

  private routerSub?: Subscription;
  private notifEffect = effect(() => {
    const notif = this.realtimeSvc.latestNotification();
    if (notif && this.isTeacher) this.loadPendingCount();
  });

  // ── State ──────────────────────────────────────────────────────────────────
  readonly unreadCount     = this.realtimeSvc.unreadCount;
  pendingRequestsCount     = signal(0);
  currentPath              = signal('');
  userInitials  = signal('?');
  displayName   = signal('');
  userEmail     = signal('');

  profilePath  = signal('/profile');
  coreNav      = signal<NavItem[]>([]);
  secondaryNav = signal<SecondaryItem[]>([]);

  private readonly NAV_HIDDEN_PATHS = ['/complete-profile', '/login', '/register'];
  navHidden = computed(() => this.NAV_HIDDEN_PATHS.some(p => this.currentPath().startsWith(p)));

  private isTeacher = false;

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadUserAndNav();
    this.currentPath.set(this.router.url);

    this.routerSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: NavigationEnd) => {
        this.currentPath.set(e.urlAfterRedirects);
      });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
    this.notifEffect.destroy();
  }

  // ── Setup ──────────────────────────────────────────────────────────────────
  private loadUserAndNav(): void {
    // getOne() is unreliable at init time — wait for the observable to emit
    // an authenticated user (same pattern as route.provider.ts)
    this.configStateService
      .getOne$('currentUser')
      .pipe(
        filter((u: any) => !!u && u.isAuthenticated === true),
        take(1)
      )
      .subscribe((cu: any) => {
        const roles: string[] = (cu?.roles || cu?.roleNames || cu?.userRoles || [])
          .map((r: any) => (typeof r === 'string' ? r.toUpperCase() : ''))
          .filter(Boolean);
        this.isTeacher = roles.includes(ROLES.TEACHER);

        // User info
        const first = cu?.name    || '';
        const last  = cu?.surName || '';
        const uname = cu?.userName || '';
        const full  = [first, last].filter(Boolean).join(' ') || uname;
        const parts = full.trim().split(/\s+/).filter(Boolean);
        const initials = parts.length >= 2
          ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
          : (parts[0]?.[0]?.toUpperCase() || '?');

        this.userInitials.set(initials);
        this.displayName.set(full);
        this.userEmail.set(cu?.email || '');

        // Core nav items — role-aware paths resolved AFTER user is loaded
        const homePath     = getRoleHomePath(roles);
        const requestsPath = getRoleRequestsPath(roles);

        const isStudent = roles.includes(ROLES.STUDENT);
        const isTeacher = roles.includes(ROLES.TEACHER);
        this.coreNav.set([
          { path: homePath,         label: 'الرئيسية',    labelEn: 'Home',          icon: 'fas fa-home' },
          { path: requestsPath,     label: 'طلباتي',      labelEn: 'Requests',      icon: 'fas fa-clipboard-list', badge: 'requests' },
          // Students & Teachers get Academies in core nav; other roles get Feeds
          ...(isStudent
            ? [{ path: '/academies',         label: 'الأكاديميات', labelEn: 'Academies', icon: 'fas fa-university' }]
            : isTeacher
            ? [{ path: '/teacher/academies', label: 'الأكاديميات', labelEn: 'Academies', icon: 'fas fa-university' }]
            : [{ path: '/feeds',             label: 'النشرات',     labelEn: 'Feeds',     icon: 'fas fa-rss' }]
          ),
          { path: '/notifications', label: 'إشعارات',  labelEn: 'Notifications', icon: 'fas fa-bell', badge: 'notifications' },
        ]);

        this.profilePath.set(getRoleProfilePath(roles));
        this.secondaryNav.set(getSecondaryItems(roles));

        if (this.isTeacher) this.loadPendingCount();
      });
  }

  private async loadPendingCount(): Promise<void> {
    try {
      const [enroll, link] = await Promise.all([
        lastValueFrom(this.enrollmentSvc.getPendingRequestsForCurrentTeacher()),
        lastValueFrom(this.secretaryTeacherSvc.getPendingRequestsForCurrentTeacher()),
      ]);
      this.pendingRequestsCount.set((enroll?.length || 0) + (link?.length || 0));
    } catch { /* silent */ }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  badge(item: NavItem): number {
    if (item.badge === 'notifications') return this.unreadCount();
    if (item.badge === 'requests')      return this.pendingRequestsCount();
    return 0;
  }

  isActive(path: string): boolean {
    const cur = this.currentPath();
    const exact = ['/', '/student', '/teacher', '/parent', '/secretary', '/secretary-assignments',
                   '/profile', '/secretary/profile', '/student/profile', '/teacher/profile', '/parent/profile',
                   '/academies', '/teacher/academies', '/feeds', '/notifications'];
    if (exact.includes(path)) return cur === path;
    return cur.startsWith(path);
  }

  async logout(): Promise<void> {
    await this.authService.logout();
  }
}
