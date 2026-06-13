import { ChangeDetectionStrategy, Component, inject, signal, effect, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { RealtimeNotificationService } from './services/realtime-notification.service';

@Component({
  selector: 'app-sidebar-notification-badge',
  template: `
    <ng-container *ngIf="showBadge()">
      <span class="sidebar-badge" [class.badge-pulse]="unreadCount() > 0">
        {{ unreadCount() > 9 ? '9+' : unreadCount() }}
      </span>
    </ng-container>
  `,
  styles: [`
    .sidebar-badge {
      position: absolute;
      top: -8px;
      left: -8px;
      background: #ef4444;
      color: white;
      font-size: 0.625rem;
      font-weight: 700;
      min-width: 18px;
      height: 18px;
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 4px;
      z-index: 10;
      box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
      animation: badgeIn 0.3s ease;
    }

    .badge-pulse {
      animation: pulse 2s infinite;
    }

    @keyframes badgeIn {
      0% {
        transform: scale(0);
        opacity: 0;
      }
      50% {
        transform: scale(1.2);
      }
      100% {
        transform: scale(1);
        opacity: 1;
      }
    }

    @keyframes pulse {
      0% {
        box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
      }
      70% {
        box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
      }
      100% {
        box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
      }
    }
  `],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarNotificationBadgeComponent implements OnInit {
  private readonly realtimeService = inject(RealtimeNotificationService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly unreadCount = this.realtimeService.unreadCount;
  showBadge = signal(false);

  ngOnInit() {
    // Show badge only when on desktop and not on notifications page
    this.updateBadgeVisibility();
    
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.updateBadgeVisibility();
      });

    // React to unread count changes
    effect(() => {
      this.updateBadgeVisibility();
    });
  }

  private updateBadgeVisibility() {
    const isDesktop = window.innerWidth >= 992;
    const isNotificationsPage = this.router.url === '/notifications' || this.router.url.includes('/notifications');
    const hasUnread = this.unreadCount() > 0;
    
    this.showBadge.set(isDesktop && !isNotificationsPage && hasUnread);
  }
}
