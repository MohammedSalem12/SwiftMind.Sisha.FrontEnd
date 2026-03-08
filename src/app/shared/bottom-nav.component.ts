import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, OnDestroy, effect } from '@angular/core';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { ConfigStateService, AuthService } from '@abp/ng.core';
import { filter, Subscription, lastValueFrom } from 'rxjs';
import { getBottomTabsForRole, getMoreMenuItemsForRole, BottomTabConfig, MoreMenuItemConfig, ROLES } from '../route.provider';
import { RealtimeNotificationService } from './services/realtime-notification.service';
import { EnrollmentRequestService } from '@proxy/student-enrollments';
import { SecretaryTeacherService } from '@proxy/teachers';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <!-- ───────────── Bottom Navigation Bar ───────────── -->
    <nav class="bn" [class.rtl]="isRtl">
      <div class="bn-inner">

        <!-- Regular tabs -->
        <a *ngFor="let tab of tabs(); trackBy: trackByPath"
           class="bn-tab"
           [routerLink]="tab.path"
           [class.active]="isActive(tab.path)"
           (click)="onTabClick(tab)">
          <div class="bn-icon-wrap">
            <i [class]="tab.icon"></i>
            <span class="bn-badge" *ngIf="tabBadge(tab) > 0">
              {{ tabBadge(tab) > 9 ? '9+' : tabBadge(tab) }}
            </span>
          </div>
          <span class="bn-label">{{ tab.label }}</span>
          <span class="bn-active-bar" *ngIf="isActive(tab.path)"></span>
        </a>

        <!-- Menu / Profile button (always visible) -->
        <button class="bn-tab bn-profile-btn" (click)="openDrawer()">
          <div class="bn-avatar" [class.has-name]="userInitials() !== '?'">
            <span *ngIf="userInitials() !== '?'">{{ userInitials() }}</span>
            <i *ngIf="userInitials() === '?'" class="fas fa-user"></i>
          </div>
          <span class="bn-label">خيارات</span>
        </button>

      </div>
    </nav>

    <!-- ───────────── Backdrop (always in DOM, fades in/out) ───────────── -->
    <div class="sd-backdrop"
         [class.visible]="showMoreMenu()"
         (click)="closeDrawer()">
    </div>

    <!-- ───────────── Side Drawer (always in DOM, slides in/out) ───────────── -->
    <aside class="sd" [class.open]="showMoreMenu()" dir="rtl">

      <!-- User Profile Header -->
      <div class="sd-profile">
        <div class="sd-avatar-lg">
          <span *ngIf="userInitials() !== '?'">{{ userInitials() }}</span>
          <i *ngIf="userInitials() === '?'" class="fas fa-user"></i>
        </div>
        <div class="sd-user-info" *ngIf="isAuthenticated()">
          <p class="sd-user-name">{{ displayName() || 'مستخدم' }}</p>
          <p class="sd-user-email" *ngIf="userEmail()">{{ userEmail() }}</p>
        </div>
        <div class="sd-user-info" *ngIf="!isAuthenticated()">
          <p class="sd-user-name">مرحباً</p>
          <p class="sd-user-email">سجّل دخولك للمتابعة</p>
        </div>
        <button class="sd-close" (click)="closeDrawer()">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Navigation Items -->
      <div class="sd-items">
        <a *ngFor="let item of moreItems(); trackBy: trackByPath"
           class="sd-item"
           [routerLink]="item.path"
           [class.active]="isActive(item.path)"
           (click)="closeDrawer()">
          <div class="sd-item-icon">
            <i [class]="item.icon"></i>
          </div>
          <span class="sd-item-label">{{ item.label }}</span>
          <i class="fas fa-chevron-left sd-chevron"></i>
        </a>
      </div>

      <!-- Footer -->
      <div class="sd-footer" *ngIf="isAuthenticated()">
        <button class="sd-logout" (click)="logout()">
          <i class="fas fa-sign-out-alt"></i>
          <span>تسجيل الخروج</span>
        </button>
      </div>

    </aside>
  `,
  styles: [`
    /* ────────────────────────────────────────────────────
       BOTTOM NAV
    ──────────────────────────────────────────────────── */
    .bn {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 1000;
      /* Glass-morphism panel */
      background: rgba(255, 255, 255, 0.92);
      -webkit-backdrop-filter: blur(20px);
      backdrop-filter: blur(20px);
      border-top: 1px solid rgba(0, 0, 0, 0.07);
      box-shadow: 0 -4px 30px rgba(0, 0, 0, 0.08);
      padding-bottom: max(6px, env(safe-area-inset-bottom));
    }

    .bn.rtl { direction: rtl; }

    .bn-inner {
      display: flex;
      justify-content: space-around;
      align-items: stretch;
      max-width: 520px;
      margin: 0 auto;
      height: 60px;
    }

    /* ── Each tab ── */
    .bn-tab {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex: 1;
      text-decoration: none;
      color: #9ca3af;
      background: transparent;
      border: none;
      cursor: pointer;
      gap: 3px;
      transition: color 0.2s ease;
      -webkit-tap-highlight-color: transparent;
      padding: 0 4px;
    }

    .bn-tab.active { color: #5b21b6; }

    .bn-icon-wrap {
      position: relative;
      width: 36px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 12px;
      transition: background 0.2s ease;
    }

    .bn-tab.active .bn-icon-wrap {
      background: linear-gradient(135deg, rgba(91,33,182,0.12) 0%, rgba(124,58,237,0.12) 100%);
    }

    .bn-icon-wrap i { font-size: 1.15rem; }

    .bn-label {
      font-size: 0.575rem;
      font-weight: 600;
      white-space: nowrap;
      letter-spacing: 0.01em;
    }

    /* Active indicator bar at the top */
    .bn-active-bar {
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 20px;
      height: 3px;
      border-radius: 0 0 3px 3px;
      background: linear-gradient(90deg, #7c3aed, #5b21b6);
    }

    /* Notification badge */
    .bn-badge {
      position: absolute;
      top: -3px;
      right: -3px;
      background: #ef4444;
      color: #fff;
      font-size: 0.55rem;
      font-weight: 700;
      min-width: 15px;
      height: 15px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 3px;
      border: 1.5px solid white;
    }

    /* ── Profile / Menu button avatar ── */
    .bn-avatar {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      font-weight: 700;
      box-shadow: 0 2px 10px rgba(124, 58, 237, 0.4);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      border: 2px solid rgba(255,255,255,0.9);
    }

    .bn-profile-btn:active .bn-avatar {
      transform: scale(0.92);
      box-shadow: 0 1px 6px rgba(124, 58, 237, 0.3);
    }

    .bn-avatar i { font-size: 0.85rem; }

    /* ────────────────────────────────────────────────────
       BACKDROP
    ──────────────────────────────────────────────────── */
    .sd-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0);
      z-index: 1099;
      pointer-events: none;
      transition: background 0.35s ease;
      -webkit-tap-highlight-color: transparent;
    }

    .sd-backdrop.visible {
      background: rgba(0, 0, 0, 0.5);
      -webkit-backdrop-filter: blur(3px);
      backdrop-filter: blur(3px);
      pointer-events: auto;
    }

    /* ────────────────────────────────────────────────────
       SIDE DRAWER
    ──────────────────────────────────────────────────── */
    .sd {
      position: fixed;
      top: 0;
      right: 0;
      width: min(82vw, 310px);
      height: 100%;
      height: 100dvh;
      background: #ffffff;
      z-index: 1100;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: -8px 0 40px rgba(0, 0, 0, 0.2);
      /* Hidden off-screen by default */
      transform: translateX(100%);
      transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1);
      will-change: transform;
    }

    .sd.open { transform: translateX(0); }

    /* ── Profile Header ── */
    .sd-profile {
      position: relative;
      background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 60%, #4c1d95 100%);
      padding: 2.5rem 1.25rem 1.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.6rem;
      text-align: center;
      /* Decorative circles */
      overflow: hidden;
    }

    .sd-profile::before,
    .sd-profile::after {
      content: '';
      position: absolute;
      border-radius: 50%;
      background: rgba(255,255,255,0.07);
    }
    .sd-profile::before { width: 140px; height: 140px; top: -40px; left: -30px; }
    .sd-profile::after  { width: 100px; height: 100px; bottom: -20px; right: -20px; }

    .sd-avatar-lg {
      position: relative;
      z-index: 1;
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      border: 3px solid rgba(255, 255, 255, 0.5);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.7rem;
      font-weight: 800;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    }

    .sd-avatar-lg i { font-size: 1.5rem; }

    .sd-user-info { position: relative; z-index: 1; }

    .sd-user-name {
      margin: 0;
      color: #fff;
      font-size: 1rem;
      font-weight: 700;
      text-shadow: 0 1px 4px rgba(0,0,0,0.15);
    }

    .sd-user-email {
      margin: 2px 0 0;
      color: rgba(255,255,255,0.75);
      font-size: 0.75rem;
      direction: ltr;
    }

    .sd-close {
      position: absolute;
      top: 1rem;
      left: 1rem;
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: rgba(255,255,255,0.2);
      border: none;
      color: #fff;
      font-size: 0.9rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
      z-index: 2;
    }
    .sd-close:hover { background: rgba(255,255,255,0.35); }

    /* ── Items list ── */
    .sd-items {
      flex: 1;
      overflow-y: auto;
      padding: 0.75rem 0.75rem 0.5rem;
      overscroll-behavior: contain;
    }

    .sd-item {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      padding: 0.8rem 0.9rem;
      border-radius: 14px;
      text-decoration: none;
      color: #374151;
      font-size: 0.93rem;
      font-weight: 500;
      transition: background 0.15s, color 0.15s, transform 0.15s;
      min-height: 50px;
      margin-bottom: 2px;
    }

    .sd-item:active { transform: scale(0.98); }

    .sd-item:hover, .sd-item.active {
      background: linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(91,33,182,0.08) 100%);
      color: #7c3aed;
    }

    .sd-item-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: linear-gradient(135deg, rgba(124,58,237,0.1) 0%, rgba(91,33,182,0.1) 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: background 0.15s;
    }

    .sd-item.active .sd-item-icon {
      background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
    }

    .sd-item-icon i {
      font-size: 0.9rem;
      color: #7c3aed;
    }

    .sd-item.active .sd-item-icon i { color: #fff; }

    .sd-item-label { flex: 1; }

    .sd-chevron {
      font-size: 0.65rem;
      color: #d1d5db;
      transition: color 0.15s;
    }

    .sd-item.active .sd-chevron,
    .sd-item:hover .sd-chevron { color: #7c3aed; }

    /* ── Drawer footer / logout ── */
    .sd-footer {
      padding: 0.75rem;
      border-top: 1px solid #f3f4f6;
    }

    .sd-logout {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.6rem;
      padding: 0.8rem;
      border-radius: 14px;
      border: 1.5px solid #fee2e2;
      background: #fff5f5;
      color: #dc2626;
      font-size: 0.93rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s, transform 0.15s;
    }

    .sd-logout:hover { background: #fee2e2; border-color: #fca5a5; }
    .sd-logout:active { transform: scale(0.97); }

    /* ── iOS safe area ── */
    @supports (padding-bottom: env(safe-area-inset-bottom)) {
      .bn { padding-bottom: calc(6px + env(safe-area-inset-bottom)); }
    }

    /* ── Desktop: show bottom nav with enhanced styling ── */
    @media (min-width: 768px) {
      .bn-inner {
        max-width: 600px;
      }
      .bn-tab {
        gap: 4px;
      }
      .bn-label {
        font-size: 0.65rem;
      }
      .bn-icon-wrap {
        width: 40px;
        height: 32px;
      }
      .bn-icon-wrap i {
        font-size: 1.25rem;
      }
    }
  `]
})
export class BottomNavComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly configStateService = inject(ConfigStateService);
  private readonly authService = inject(AuthService);
  private readonly realtimeSvc = inject(RealtimeNotificationService);
  private readonly enrollmentRequestService = inject(EnrollmentRequestService);
  private readonly secretaryTeacherService = inject(SecretaryTeacherService);
  private routerSubscription?: Subscription;
  private notifEffect = effect(() => {
    const notif = this.realtimeSvc.latestNotification();
    if (notif && this.isTeacher) this.loadPendingRequestsCount();
  });

  tabs = signal<BottomTabConfig[]>([]);
  moreItems = signal<MoreMenuItemConfig[]>([]);
  showMoreMenu = signal(false);
  readonly unreadCount = this.realtimeSvc.unreadCount;
  pendingRequestsCount = signal(0);
  currentPath = signal('');

  userInitials = signal('?');
  displayName = signal('');
  userEmail = signal('');
  isAuthenticated = signal(false);
  private isTeacher = false;

  isRtl = true;

  ngOnInit(): void {
    this.loadUserAndTabs();
    this.currentPath.set(this.router.url);

    this.routerSubscription = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: NavigationEnd) => {
        this.currentPath.set(e.urlAfterRedirects);
        this.closeDrawer();
      });
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
    this.notifEffect.destroy();
  }

  private async loadPendingRequestsCount(): Promise<void> {
    try {
      const [enrollPending, linkPending] = await Promise.all([
        lastValueFrom(this.enrollmentRequestService.getPendingRequestsForCurrentTeacher()),
        lastValueFrom(this.secretaryTeacherService.getPendingRequestsForCurrentTeacher()),
      ]);
      this.pendingRequestsCount.set((enrollPending?.length || 0) + (linkPending?.length || 0));
    } catch { /* silent */ }
  }

  tabBadge(tab: BottomTabConfig): number {
    if (tab.path === '/notifications') return this.unreadCount();
    if (tab.path === '/teacher/my-requests') return this.pendingRequestsCount();
    return 0;
  }

  private loadUserAndTabs(): void {
    const currentUser = this.configStateService.getOne('currentUser') as any;
    const userRoles: string[] = currentUser?.roles || [];
    const isAuth: boolean = currentUser?.isAuthenticated ?? false;
    this.isTeacher = userRoles.includes(ROLES.TEACHER);
    if (this.isTeacher) this.loadPendingRequestsCount();

    // Build display name from available fields
    const firstName: string = currentUser?.name || '';
    const lastName: string  = currentUser?.surName || '';
    const userName: string  = currentUser?.userName || '';
    const fullName = [firstName, lastName].filter(Boolean).join(' ') || userName;

    // Compute two-letter initials
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    const initials = parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : (parts[0]?.[0]?.toUpperCase() || '?');

    this.userInitials.set(initials);
    this.displayName.set(fullName);
    this.userEmail.set(currentUser?.email || '');
    this.isAuthenticated.set(isAuth);

    this.tabs.set(getBottomTabsForRole(userRoles));
    this.moreItems.set(getMoreMenuItemsForRole(userRoles));
  }

  isActive(path: string): boolean {
    const current = this.currentPath();
    if (path === '/') return current === '/' || current === '';
    return current.startsWith(path);
  }

  onTabClick(_tab: BottomTabConfig): void {}

  openDrawer(): void { this.showMoreMenu.set(true); }

  closeDrawer(): void { this.showMoreMenu.set(false); }

  // Keep for template compatibility (router subscription calls this)
  closeMoreMenu(): void { this.showMoreMenu.set(false); }

  async logout(): Promise<void> {
    this.closeDrawer();
    await this.authService.logout();
  }

  trackByPath(_: number, item: { path: string }): string {
    return item.path;
  }
}
