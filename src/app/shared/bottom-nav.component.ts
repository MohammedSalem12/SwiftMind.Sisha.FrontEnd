import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, OnDestroy } from '@angular/core';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { ConfigStateService } from '@abp/ng.core';
import { filter, Subscription } from 'rxjs';
import { getBottomTabsForRole, getMoreMenuItemsForRole, BottomTabConfig, MoreMenuItemConfig } from '../route.provider';
import { RealtimeNotificationService } from './services/realtime-notification.service';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="bottom-nav" *ngIf="tabs().length > 0" [class.rtl]="isRtl">
      <div class="nav-container">
        <a *ngFor="let tab of tabs(); trackBy: trackByPath"
           class="nav-item"
           [routerLink]="tab.path"
           [class.active]="isActive(tab.path)"
           (click)="onTabClick(tab)">
          <div class="nav-icon">
            <i [class]="tab.icon"></i>
            <span class="badge" *ngIf="tab.path === '/notifications' && unreadCount() > 0">
              {{ unreadCount() > 9 ? '9+' : unreadCount() }}
            </span>
          </div>
          <span class="nav-label">{{ tab.label }}</span>
        </a>
        
        <!-- More menu trigger -->
        <button class="nav-item nav-more" (click)="toggleMoreMenu()">
          <div class="nav-icon">
            <i class="fas fa-bars"></i>
          </div>
          <span class="nav-label">المزيد</span>
        </button>
      </div>
    </nav>

    <!-- More Menu Overlay -->
    <div class="more-menu-overlay" 
         *ngIf="showMoreMenu()" 
         (click)="closeMoreMenu()">
      <div class="more-menu" (click)="$event.stopPropagation()">
        <div class="more-menu-header">
          <h3>القائمة</h3>
          <button class="close-btn" (click)="closeMoreMenu()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="more-menu-items">
          <a *ngFor="let item of moreItems(); trackBy: trackByPath"
             class="more-item"
             [routerLink]="item.path"
             (click)="closeMoreMenu()">
            <i [class]="item.icon"></i>
            <span>{{ item.label }}</span>
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .bottom-nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: white;
      border-top: 1px solid #e2e8f0;
      padding: 0.5rem 0;
      padding-bottom: max(0.5rem, env(safe-area-inset-bottom));
      z-index: 1000;
      box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
      display: block; /* Always visible (desktop + mobile) */
    }

    .bottom-nav.rtl {
      direction: rtl;
    }

    .nav-container {
      display: flex;
      justify-content: space-around;
      align-items: center;
      max-width: 500px;
      margin: 0 auto;
    }

    .nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-decoration: none;
      color: #6b7280;
      padding: 0.5rem 1rem;
      border-radius: 12px;
      transition: all 0.2s ease;
      min-width: 60px;
      background: transparent;
      border: none;
      cursor: pointer;
    }

    .nav-item:hover, .nav-item:focus {
      background: #f3f4f6;
    }

    .nav-item.active {
      color: #667eea;
    }

    .nav-item.active .nav-icon {
      background: linear-gradient(135deg, #667eea20 0%, #764ba220 100%);
    }

    .nav-icon {
      position: relative;
      width: 40px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 16px;
      transition: all 0.2s ease;
    }

    .nav-icon i {
      font-size: 1.25rem;
    }

    .nav-item.active .nav-icon i {
      color: #667eea;
    }

    .badge {
      position: absolute;
      top: -4px;
      right: -4px;
      background: #ef4444;
      color: white;
      font-size: 0.625rem;
      font-weight: 700;
      min-width: 16px;
      height: 16px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 4px;
    }

    .nav-label {
      font-size: 0.625rem;
      font-weight: 500;
      margin-top: 2px;
      white-space: nowrap;
    }

    /* More Menu Overlay */
    .more-menu-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 1100;
      display: flex;
      align-items: flex-end;
      justify-content: center;
    }

    .more-menu {
      background: white;
      border-radius: 20px 20px 0 0;
      width: 100%;
      max-height: 70vh;
      overflow-y: auto;
      animation: slideUp 0.3s ease;
    }

    @keyframes slideUp {
      from {
        transform: translateY(100%);
      }
      to {
        transform: translateY(0);
      }
    }

    .more-menu-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .more-menu-header h3 {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: #1a202c;
    }

    .close-btn {
      background: #f3f4f6;
      border: none;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #6b7280;
    }

    .close-btn:hover {
      background: #e5e7eb;
    }

    .more-menu-items {
      padding: 1rem;
    }

    .more-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      text-decoration: none;
      color: #1a202c;
      border-radius: 12px;
      transition: all 0.2s ease;
    }

    .more-item:hover {
      background: #f3f4f6;
    }

    .more-item i {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #667eea;
      font-size: 1rem;
    }

    .more-item span {
      font-size: 1rem;
      font-weight: 500;
    }

    /* Previously restricted to mobile; now always shown */

    /* Safe area for iOS devices */
    @supports (padding-bottom: env(safe-area-inset-bottom)) {
      .bottom-nav {
        padding-bottom: calc(0.5rem + env(safe-area-inset-bottom));
      }
    }
  `]
})
export class BottomNavComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly configStateService = inject(ConfigStateService);
  private readonly realtimeSvc = inject(RealtimeNotificationService);
  private routerSubscription?: Subscription;

  tabs = signal<BottomTabConfig[]>([]);
  moreItems = signal<MoreMenuItemConfig[]>([]);
  isVisible = signal(true);
  showMoreMenu = signal(false);
  readonly unreadCount = this.realtimeSvc.unreadCount; // live signal from SignalR
  currentPath = signal('');
  isRtl = true; // Arabic is RTL

  ngOnInit(): void {
    this.loadTabs();
    this.currentPath.set(this.router.url);
    
    // Listen to route changes
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentPath.set(event.urlAfterRedirects);
        this.closeMoreMenu();
      });
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }

  private loadTabs(): void {
    const currentUser = this.configStateService.getOne('currentUser');
    const userRoles: string[] = currentUser?.roles || [];
    this.tabs.set(getBottomTabsForRole(userRoles));
    this.moreItems.set(getMoreMenuItemsForRole(userRoles));

    // Always show bottom nav (visible for all users)
    this.isVisible.set(true);
  }

  isActive(path: string): boolean {
    const current = this.currentPath();
    if (path === '/') {
      return current === '/' || current === '';
    }
    return current.startsWith(path);
  }

  onTabClick(tab: BottomTabConfig): void {
    // Haptic feedback for native apps could be added here
  }

  toggleMoreMenu(): void {
    this.showMoreMenu.update(v => !v);
  }

  closeMoreMenu(): void {
    this.showMoreMenu.set(false);
  }

  trackByPath(_: number, tab: BottomTabConfig): string {
    return tab.path;
  }
}
