import { CommonModule, Location } from '@angular/common';
import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from '@abp/ng.core';
import { Subscription, filter } from 'rxjs';

const HIDE_PATHS = ['/login', '/register', '/forgot-password', '/complete-profile'];

@Component({
  selector: 'app-top-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (visible()) {
      <div class="top-bar" dir="rtl">
        <button class="tb-btn tb-back" (click)="goBack()" [class.tb-btn--hidden]="!canGoBack()">
          <i class="fas fa-arrow-right"></i>
        </button>

        <span class="tb-title">KAI</span>

        <div class="tb-actions">
          <button class="tb-btn" (click)="toggleLang()">
            <i class="fas fa-globe"></i>
            <span class="tb-btn-label">{{ lang() }}</span>
          </button>
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

    .tb-title {
      font-size: .85rem;
      font-weight: 700;
      color: #fff;
      letter-spacing: .02em;
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      white-space: nowrap;
    }

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
  private sub!: Subscription;

  visible = signal(true);
  canGoBack = signal(false);
  lang = signal('AR');

  ngOnInit(): void {
    this.updateVisibility(this.router.url);
    this.sub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: NavigationEnd) => this.updateVisibility(e.urlAfterRedirects));
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private updateVisibility(url: string): void {
    const hidden = HIDE_PATHS.some(p => url.startsWith(p));
    this.visible.set(!hidden);
    // Can go back if not on a home/root page
    const rootPaths = ['/', '/home', '/student/home', '/teacher/home', '/parent/home', '/secretary/home'];
    this.canGoBack.set(!rootPaths.includes(url.split('?')[0]));
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
