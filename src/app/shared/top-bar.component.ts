import { CommonModule, Location } from '@angular/common';
import { Component, inject, signal, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from '@abp/ng.core';
import { Subscription, filter, lastValueFrom } from 'rxjs';
import { SessionService } from '@proxy/groups';
import { CurrentUserInfoService } from '@proxy/common';
import type { NextSessionDto } from '@proxy/groups/dtos/models';

const HIDE_PATHS = ['/login', '/register', '/forgot-password', '/complete-profile'];

@Component({
  selector: 'app-top-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (visible()) {
      <div class="top-bar" dir="rtl">
        <!-- Left: back button or user info on home -->
        @if (isHomePage()) {
          <div class="tb-user" (click)="goToProfile()">
            <div class="tb-avatar">{{ userInitials() }}</div>
            <div class="tb-user-info">
              <span class="tb-user-name">{{ userName() }}</span>
              <span class="tb-user-role">{{ userRoleName() }}</span>
            </div>
          </div>
        } @else {
          <button class="tb-btn tb-back" (click)="goBack()" [class.tb-btn--hidden]="!canGoBack()">
            <i class="fas fa-arrow-right"></i>
          </button>
        }

        <!-- Center: session timer always shown if available, otherwise logo -->
        <div class="tb-center">
          @if (nextSession()) {
            <div class="tb-session" (click)="goToSessions()">
              <i class="fas fa-clock"></i>
              <span class="tb-session-name">{{ nextSession()!.courseName }}</span>
              <span class="tb-session-time">{{ formatCountdown() }}</span>
            </div>
          } @else if (!isHomePage()) {
            <img src="/assets/images/logo/logo-light-thumbnail2.png" alt="KAI" class="tb-logo" />
          }
        </div>

        <div class="tb-actions">
          @if (!isHomePage()) {
            <button class="tb-btn" (click)="toggleLang()">
              <i class="fas fa-globe"></i>
              <span class="tb-btn-label">{{ lang() }}</span>
            </button>
          }
          <button class="tb-btn tb-logout" (click)="logout()">
            <i class="fas fa-sign-out-alt"></i>
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    .top-bar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 9998;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 48px;
      padding: 0 .75rem;
      padding-top: env(safe-area-inset-top, 0px);
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      box-shadow: 0 2px 8px rgba(0,0,0,.15);
    }

    .tb-user {
      display: flex;
      align-items: center;
      gap: .45rem;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      min-width: 0;
      flex-shrink: 1;
    }
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
    }
    .tb-user-name {
      font-size: .72rem;
      font-weight: 700;
      color: #fff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 120px;
      line-height: 1.1;
    }
    .tb-user-role {
      font-size: .55rem;
      color: rgba(255,255,255,.6);
      font-weight: 500;
    }

    .tb-center {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      justify-content: center;
    }

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
      background: rgba(255,255,255,.15);
      border-radius: 8px;
      padding: .2rem .6rem;
      animation: fadeIn .3s ease;
    }
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
      min-width: 36px;
      min-height: 36px;
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
  private sub!: Subscription;
  private countdownInterval: any;

  private readonly currentUserSvc = inject(CurrentUserInfoService);

  visible = signal(true);
  canGoBack = signal(false);
  isHomePage = signal(false);
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
    this.sub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: NavigationEnd) => this.updateVisibility(e.urlAfterRedirects));
    this.loadNextSession();
    this.loadUserInfo();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
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

  private updateVisibility(url: string): void {
    const hidden = HIDE_PATHS.some(p => url.startsWith(p));
    this.visible.set(!hidden);
    const path = url.split('?')[0];
    const homePaths = ['/', '/student', '/teacher', '/parent', '/secretary'];
    this.isHomePage.set(homePaths.includes(path));
    const rootPaths = [...homePaths, '/home', '/student/home', '/teacher/home', '/parent/home', '/secretary/home'];
    this.canGoBack.set(!rootPaths.includes(path));
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
    this.location.back();
  }

  toggleLang(): void {
    // Simple toggle between AR/EN for now
    this.lang.update(l => l === 'AR' ? 'EN' : 'AR');
    // Language switching can be wired to ABP localization later
  }

  logout(): void {
    this.authService.logout();
  }
}
