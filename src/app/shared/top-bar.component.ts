import { CommonModule, Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal, OnInit, OnDestroy, HostListener, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from '@abp/ng.core';
import { filter, lastValueFrom } from 'rxjs';
import { SessionService } from '@proxy/groups';
import { CurrentUserInfoService } from '@proxy/common';
import type { NextSessionDto } from '@proxy/groups/dtos/models';

const HIDE_PATHS = ['/login', '/register', '/forgot-password', '/complete-profile'];

@Component({
  selector: 'app-top-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    @if (visible()) {
      <header class="top-bar" [class.scrolled]="scrolled()" role="banner" dir="rtl">
        <!-- START: profile (home) · back + title (feature pages without their own header) -->
        <div class="tb-start">
          @if (isHomePage()) {
            <button class="tb-user" (click)="goToProfile()" type="button" aria-label="فتح الملف الشخصي · Open profile">
              <span class="tb-avatar">{{ userInitials() }}</span>
              <span class="tb-user-info">
                <span class="tb-user-name">{{ userName() }}</span>
                <span class="tb-user-role">{{ userRoleName() }}</span>
              </span>
            </button>
          } @else if (!pageHasOwnHeader()) {
            <button class="tb-back" (click)="goBack()" type="button" aria-label="رجوع · Back">
              <i class="fas fa-chevron-right" aria-hidden="true"></i>
            </button>
            @if (pageTitle()) { <h1 class="tb-title">{{ pageTitle() }}</h1> }
          }
        </div>

        <!-- END: next-session chip (in flow — no overlap with the title) -->
        @if (nextSession()) {
          <button class="tb-session" (click)="goToSessions()" type="button" [attr.aria-label]="sessionAria()">
            <i class="fas fa-clock" aria-hidden="true"></i>
            <span class="tb-session-name">{{ nextSession()!.courseName }}</span>
            <span class="tb-session-time">{{ formatCountdown() }}</span>
          </button>
        }
      </header>
    }
  `,
  styles: [`
    .top-bar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1500;
      display: flex;
      align-items: center;
      gap: .5rem;
      height: 48px;
      padding: 0 .5rem;
      padding-top: env(safe-area-inset-top, 0px);
      /* Darker gradient than the brand pastel so white text/icons meet WCAG AA */
      background: linear-gradient(135deg, #5b6fd6 0%, #6a4b9c 100%);
      box-shadow: 0 1px 6px rgba(0,0,0,.12);
      transition: box-shadow .2s ease, background .2s ease;
    }
    /* Elevate + deepen on scroll */
    .top-bar.scrolled {
      background: linear-gradient(135deg, #556ad2 0%, #634593 100%);
      box-shadow: 0 4px 16px rgba(0,0,0,.28);
    }
    .tb-start { display: flex; align-items: center; gap: .35rem; flex: 1; min-width: 0; }

    .tb-user {
      display: flex;
      align-items: center;
      gap: .5rem;
      border: none;
      background: transparent;
      border-radius: 12px;
      padding: .2rem .35rem;
      min-height: 44px;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      min-width: 0;
      flex-shrink: 1;
    }
    .tb-user:active { background: rgba(255,255,255,.12); }
    .tb-avatar {
      width: 30px; height: 30px;
      border-radius: 50%;
      background: rgba(255,255,255,.25);
      color: #fff;
      font-size: .65rem;
      font-weight: 800;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      border: 1.5px solid rgba(255,255,255,.35);
    }
    .tb-user-info {
      display: flex;
      flex-direction: column;
      min-width: 0;
      text-align: start;
    }
    .tb-user-name {
      font-size: .8rem;
      font-weight: 700;
      color: #fff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 150px;
      line-height: 1.15;
      text-shadow: 0 1px 2px rgba(0,0,0,.18);
    }
    .tb-user-role {
      font-size: .6rem;
      color: rgba(255,255,255,.82);
      font-weight: 600;
    }

    .tb-center {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Keeps actions pinned right when the left side is empty (non-home pages) */
    .tb-spacer { width: 1px; flex: none; }

    /* Global back button — 44px tap target, shown only on feature pages that lack their own header */
    .tb-back {
      width: 44px;
      height: 44px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      border-radius: 12px;
      background: rgba(255, 255, 255, .16);
      color: #fff;
      font-size: 1.05rem;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition: background .15s;
    }
    .tb-back:active { background: rgba(255, 255, 255, .3); }
    .tb-title {
      flex: 1;
      min-width: 0;
      margin: 0;
      font-size: .95rem;
      font-weight: 700;
      color: #fff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      text-shadow: 0 1px 2px rgba(0,0,0,.18);
      animation: tb-title-in .22s ease;
    }
    @keyframes tb-title-in { from { opacity: 0; transform: translateX(6px); } to { opacity: 1; transform: none; } }

    .tb-logo {
      height: 28px;
      width: auto;
      object-fit: contain;
      border-radius: 4px;
    }

    .tb-session {
      display: flex;
      align-items: center;
      gap: .3rem;
      flex-shrink: 0;
      max-width: 46%;
      border: none;
      background: rgba(255,255,255,.16);
      border-radius: 10px;
      padding: .3rem .55rem;
      min-height: 36px;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      animation: fadeIn .3s ease;
    }
    .tb-session:active { background: rgba(255,255,255,.28); }
    .tb-session i { font-size: .65rem; color: rgba(255,255,255,.7); }
    .tb-session-name {
      font-size: .65rem;
      font-weight: 600;
      color: #fff;
      max-width: 80px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .tb-session-time {
      font-size: .7rem;
      font-weight: 800;
      color: #fbbf24;
      font-family: monospace;
    }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    .tb-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: .3rem;
      min-width: 44px;
      min-height: 44px;
      border: none;
      border-radius: 10px;
      background: rgba(255,255,255,.15);
      color: rgba(255,255,255,.92);
      font-size: .85rem;
      cursor: pointer;
      padding: 0 .5rem;
      -webkit-tap-highlight-color: transparent;
      transition: background .15s;
    }
    .tb-btn:active { background: rgba(255,255,255,.25); }
    .tb-btn--hidden { visibility: hidden; pointer-events: none; }

    .tb-page-title {
      font-size: .78rem;
      font-weight: 700;
      color: #fff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 140px;
    }

    .tb-btn-label {
      font-size: .7rem;
      font-weight: 700;
      text-transform: uppercase;
    }

    .tb-actions {
      display: flex;
      align-items: center;
      gap: .4rem;
    }

    .tb-logout {
      background: rgba(239,68,68,.3);
    }
    .tb-logout:active { background: rgba(239,68,68,.5); }

    @media (prefers-reduced-motion: reduce) {
      .tb-title, .tb-session { animation: none; }
      .top-bar { transition: none; }
    }

    /* Desktop: hide (desktop has its own nav) */
    @media (min-width: 768px) {
      .top-bar { display: none; }
    }
  `],
})
export class TopBarComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly authService = inject(AuthService);
  private readonly sessionService = inject(SessionService);
  private readonly destroyRef = inject(DestroyRef);
  private countdownInterval: any;

  private readonly currentUserSvc = inject(CurrentUserInfoService);

  visible = signal(true);
  canGoBack = signal(false);
  isHomePage = signal(false);
  pageTitle = signal('');
  pageHasOwnHeader = signal(true); // suppress the global back/title when the page has its own header
  lang = signal('AR');
  scrolled = signal(false);
  nextSession = signal<NextSessionDto | null>(null);
  userName = signal('');
  userInitials = signal('');
  userRoleName = signal('');
  private userRole = '';
  private countdownSeconds = 0;

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled.set(window.scrollY > 120);
  }

  ngOnInit(): void {
    this.updateVisibility(this.router.url);
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd), takeUntilDestroyed(this.destroyRef))
      .subscribe((e: NavigationEnd) => this.updateVisibility(e.urlAfterRedirects));
    this.loadNextSession();
    this.loadUserInfo();
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) clearInterval(this.countdownInterval);
  }

  private async loadNextSession(): Promise<void> {
    try {
      const session = await lastValueFrom(this.sessionService.getNextSession({ skipHandleError: true }));
      if (session) {
        this.nextSession.set(session);
        this.countdownSeconds = session.secondsUntilStart ?? 0;
        this.countdownInterval = setInterval(() => {
          if (this.countdownSeconds > 0) this.countdownSeconds--;
          else clearInterval(this.countdownInterval);
        }, 1000);
      }
    } catch { /* silent */ }
  }

  formatCountdown(): string {
    if (this.nextSession()?.isNow) return 'الآن';
    const s = this.countdownSeconds;
    if (s <= 0) return '--:--';
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  private static readonly PAGE_TITLES: Record<string, string> = {
    '/teacher/qr-codes': 'رموز QR',
    '/teacher/today-sessions': 'حصص اليوم',
    '/teacher/profile': 'ملفي الشخصي',
    '/teacher/my-requests': 'طلباتي',
    '/teacher/academies': 'الأكاديميات',
    '/student/courses': 'مقرراتي',
    '/student/requests': 'طلباتي',
    '/student/grades': 'درجاتي',
    '/student/attendance': 'حضوري',
    '/student/qr': 'رمز QR',
    '/student/profile': 'ملفي الشخصي',
    '/student/today-sessions': 'حصص اليوم',
    '/parent/profile': 'ملفي الشخصي',
    '/parent/requests': 'طلباتي',
    '/parent/link-child': 'ربط طالب',
    '/parent/dashboard': 'لوحة المتابعة',
    '/secretary/profile': 'ملفي الشخصي',
    '/secretary/requests': 'طلباتي',
    '/attendance': 'الحضور',
    '/marks-entry': 'تسجيل الدرجات',
    '/students': 'الطلاب',
    '/teachers': 'المعلمون',
    '/parents': 'أولياء الأمور',
    '/courses': 'المقررات',
    '/students-grades': 'درجات الطلاب',
    '/enrollment-requests': 'طلبات التسجيل',
    '/exam-grade': 'درجات الاختبار',
    '/notifications': 'الإشعارات',
    '/feeds': 'النشرات',
    '/settings': 'الإعدادات',
    '/about': 'عن التطبيق',
    '/support': 'الدعم الفني',
    '/profile': 'ملفي الشخصي',
    '/academies': 'الأكاديميات',
    '/ads': 'إعلانات',
    '/ads/my-coupons': 'كوبوناتي',
    '/academic-terms': 'الفصول الدراسية',
    '/registration-requests': 'طلبات التسجيل',
    '/admin/password-resets': 'إعادة تعيين كلمات المرور',
    '/secretary-assignments': 'تعيينات السكرتارية',
  };

  private updateVisibility(url: string): void {
    const hidden = HIDE_PATHS.some(p => url.startsWith(p));
    // Also hide for unauthenticated users (guest visitors)
    this.visible.set(!hidden && this.authService.isAuthenticated);
    const path = url.split('?')[0];
    const homePaths = ['/', '/student', '/teacher', '/parent', '/secretary'];
    this.isHomePage.set(homePaths.includes(path));
    const rootPaths = [...homePaths, '/home', '/student/home', '/teacher/home', '/parent/home', '/secretary/home'];
    this.canGoBack.set(!rootPaths.includes(path));

    // Resolve page title — try exact match first, then prefix match
    const title = TopBarComponent.PAGE_TITLES[path]
      || Object.entries(TopBarComponent.PAGE_TITLES).find(([k]) => path.startsWith(k + '/'))?.[1]
      || '';
    this.pageTitle.set(title);

    this.detectPageHeader();
  }

  /**
   * Detect whether the routed page renders its own header (back + title). If so, the
   * global top-bar suppresses its own back/title to avoid a stacked double header.
   * Defaults to "has header" so we never flash a duplicate back on headered pages.
   */
  private detectPageHeader(): void {
    this.pageHasOwnHeader.set(true);
    setTimeout(() => {
      const root = document.querySelector('.app-content') || document.body;
      const has = !!root.querySelector(
        '[data-page-header], .back-btn, .page-header, .hero-header, .ts-header, .enroll-header, .reg-header, .qr-page'
      );
      this.pageHasOwnHeader.set(has);
    }, 90);
  }

  /** Accessible, human-readable label for the next-session chip (ticking time is hard for SR). */
  sessionAria(): string {
    const s = this.nextSession();
    if (!s) return '';
    const name = s.courseName || 'الحصة القادمة';
    if (s.isNow) return `${name} الآن`;
    const mins = Math.max(0, Math.round(this.countdownSeconds / 60));
    return `الحصة القادمة: ${name} بعد ${mins} دقيقة`;
  }

  private async loadUserInfo(): Promise<void> {
    try {
      const info = await lastValueFrom(this.currentUserSvc.getCurrentUserActorInfo({ skipHandleError: true }));
      if (info) {
        this.userName.set(info.actorName || '');
        const name = info.actorName || '';
        this.userInitials.set(
          name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?'
        );
        this.userRole = (info.userRoles?.[0] || '').toUpperCase();
        const roleMap: Record<string, string> = {
          STUDENT: 'طالب · Student',
          TEACHER: 'معلم · Teacher',
          PARENT: 'ولي أمر · Parent',
          SECRETARY: 'سكرتير · Secretary',
          ADMIN: 'مدير · Admin',
        };
        this.userRoleName.set(roleMap[this.userRole] || '');
      }
    } catch { /* silent */ }
  }

  goToProfile(): void {
    const profileMap: Record<string, string> = {
      STUDENT: '/student/profile',
      TEACHER: '/teacher/profile',
      PARENT: '/parent/profile',
      SECRETARY: '/secretary/profile',
      ADMIN: '/profile',
    };
    this.router.navigate([profileMap[this.userRole] || '/profile']);
  }

  goToSessions(): void {
    const profileMap: Record<string, string> = {
      STUDENT: '/student/today-sessions',
      TEACHER: '/teacher/today-sessions',
    };
    this.router.navigate([profileMap[this.userRole] || '/']);
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigateByUrl('/');
    }
  }

  toggleLang(): void {
    // Simple toggle between AR/EN for now
    this.lang.update(l => l === 'AR' ? 'EN' : 'AR');
    // Language switching can be wired to ABP localization later
  }

  logout(): void {
    this.visible.set(false);
    this.authService.logout();
  }
}
