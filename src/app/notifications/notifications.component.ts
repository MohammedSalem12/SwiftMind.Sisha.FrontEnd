import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, effect, computed } from '@angular/core';
import { NotificationService } from '@proxy/notifications';
import type { NotificationDto } from '@proxy/notifications/models';
import { NotificationType } from '@proxy/notifications/notification-type.enum';
import { RealtimeNotificationService } from '../shared/services/realtime-notification.service';
import { GradeThemeService } from '../shared/services/grade-theme.service';
import { CurrentUserInfoService } from '@proxy/common';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notifications-page" dir="rtl">
      <!-- Modern Header with Grade Theme -->
      <div class="page-header" [style.background]="currentTheme().gradient">
        <div class="header-content">
          <div class="header-icon">
            <i class="fas fa-bell"></i>
          </div>
          <div class="header-text">
            <h1>الإشعارات</h1>
            <p>{{ unreadCount() }} إشعار غير مقروء</p>
          </div>
          <div class="header-actions">
            <button 
              class="btn-mark-all" 
              (click)="markAllRead()" 
              *ngIf="unreadCount() > 0"
              [style.background]="currentTheme().light"
              [style.color]="currentTheme().primary"
              [style.borderColor]="currentTheme().borderColor">
              <i class="fas fa-check-double"></i>
              <span>تحديد الكل كمقروء</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Content Container -->
      <div class="content-container">
        <!-- Loading State -->
        <div class="loading-state" *ngIf="loading()">
          <div class="loading-spinner" [style.border-top-color]="currentTheme().primary"></div>
          <span>جاري التحميل...</span>
        </div>

        <!-- Empty State -->
        <div class="empty-state" *ngIf="!loading() && notifications().length === 0">
          <div class="empty-icon" [style.color]="currentTheme().iconColor">
            <i class="fas fa-bell-slash"></i>
          </div>
          <h3>لا توجد إشعارات</h3>
          <p>ستظهر هنا جميع إشعاراتك عند توفرها</p>
        </div>

        <!-- Notifications List -->
        <div class="notifications-list" *ngIf="!loading() && notifications().length > 0">
          <div 
            *ngFor="let n of notifications(); trackBy: trackById"
            class="notification-item"
            [class.unread]="!n.isRead"
            [style.border-right-color]="!n.isRead ? currentTheme().primary : 'transparent'"
            (click)="markRead(n)">
            
            <div 
              class="notification-icon"
              [ngClass]="getIconClass(n.type!)"
              [style.background]="getNotificationColor(n.type!, 'bg')"
              [style.color]="getNotificationColor(n.type!, 'color')">
              <i class="fas" [ngClass]="getIcon(n.type!)"></i>
            </div>
            
            <div class="notification-content">
              <div class="notification-header">
                <h4 class="notification-title" [class.unread]="!n.isRead" [style.color]="!n.isRead ? currentTheme().textColor : 'inherit'">
                  {{ n.title }}
                </h4>
                <span class="notification-time">{{ formatDate(n.creationTime!) }}</span>
              </div>
              <p class="notification-message">{{ n.message }}</p>
            </div>
            
            <div class="notification-indicator" *ngIf="!n.isRead">
              <div 
                class="unread-dot" 
                [style.background]="currentTheme().primary"
                [style.box-shadow]="'0 0 0 4px ' + currentTheme().light">
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    // ─── Notifications Page Design ───────────────────────────────────

    .notifications-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      direction: rtl;
    }

    // ─── Page Header with Grade Theme ───────────────────────────────
    .page-header {
      padding: 2rem 1.5rem;
      color: white;
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        pointer-events: none;
      }

      .header-content {
        max-width: 1200px;
        margin: 0 auto;
        display: flex;
        align-items: center;
        gap: 1.5rem;
        position: relative;
        z-index: 1;
      }

      .header-icon {
        width: 60px;
        height: 60px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        flex-shrink: 0;
      }

      .header-text {
        flex: 1;

        h1 {
          font-size: 2rem;
          font-weight: 700;
          margin: 0 0 0.25rem;
        }

        p {
          margin: 0;
          opacity: 0.9;
          font-size: 1rem;
        }
      }

      .header-actions {
        .btn-mark-all {
          background: rgba(255, 255, 255, 0.2);
          border: 2px solid rgba(255, 255, 255, 0.3);
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 12px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          backdrop-filter: blur(10px);

          &:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
          }

          i {
            font-size: 1rem;
          }
        }
      }
    }

    // ─── Content Container ─────────────────────────────────────────────
    .content-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem 1.5rem;
    }

    // ─── Loading State ─────────────────────────────────────────────
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      color: #64748b;

      .loading-spinner {
        width: 48px;
        height: 48px;
        border: 3px solid #e2e8f0;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 1rem;
      }

      span {
        font-size: 1rem;
        font-weight: 500;
      }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    // ─── Empty State ─────────────────────────────────────────────
    .empty-state {
      text-align: center;
      padding: 4rem 2rem;

      .empty-icon {
        font-size: 4rem;
        margin-bottom: 1.5rem;
        display: block;
      }

      h3 {
        font-size: 1.5rem;
        font-weight: 700;
        color: #374151;
        margin: 0 0 0.75rem;
      }

      p {
        font-size: 1rem;
        color: #6b7280;
        margin: 0;
      }
    }

    // ─── Notifications List ─────────────────────────────────────────────
    .notifications-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .notification-item {
      background: white;
      border-radius: 16px;
      padding: 1.5rem;
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
      border-right: 4px solid transparent;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 20px -5px rgba(0, 0, 0, 0.1), 0 6px 10px -5px rgba(0, 0, 0, 0.04);
      }

      &.unread {
        background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);
      }

      .notification-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        font-size: 1.1rem;

        &.success {
          background: #dcfce7;
          color: #166534;
        }

        &.danger {
          background: #fee2e2;
          color: #dc2626;
        }

        &.warning {
          background: #fef3c7;
          color: #d97706;
        }

        &.info {
          background: #dbeafe;
          color: #1d4ed8;
        }
      }

      .notification-content {
        flex: 1;
        min-width: 0;

        .notification-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          margin-bottom: 0.5rem;

          .notification-title {
            font-size: 1.1rem;
            font-weight: 600;
            color: #1e293b;
            margin: 0;
            line-height: 1.4;

            &.unread {
              font-weight: 700;
            }
          }

          .notification-time {
            font-size: 0.8rem;
            color: #64748b;
            white-space: nowrap;
            font-weight: 500;
          }
        }

        .notification-message {
          font-size: 0.95rem;
          color: #6b7280;
          margin: 0;
          line-height: 1.5;
        }
      }

      .notification-indicator {
        .unread-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          flex-shrink: 0;
          margin-top: 0.5rem;
        }
      }
    }

    // ─── Responsive Design ─────────────────────────────────────────────
    @media (max-width: 768px) {
      .page-header {
        padding: 1.5rem 1rem;

        .header-content {
          flex-direction: column;
          text-align: center;
          gap: 1rem;
        }

        h1 {
          font-size: 1.5rem;
        }

        .header-icon {
          width: 48px;
          height: 48px;
          font-size: 1.25rem;
        }
      }

      .content-container {
        padding: 1.5rem 1rem;
      }

      .notification-item {
        padding: 1rem;
        gap: 0.75rem;

        .notification-icon {
          width: 40px;
          height: 40px;
          font-size: 1rem;
        }

        .notification-content {
          .notification-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;

            .notification-title {
              font-size: 1rem;
            }

            .notification-time {
              font-size: 0.75rem;
            }
          }

          .notification-message {
            font-size: 0.875rem;
          }
        }
      }
    }

    @media (max-width: 480px) {
      .page-header {
        padding: 1.25rem 0.75rem;

        h1 {
          font-size: 1.25rem;
        }

        .header-actions .btn-mark-all {
          padding: 0.625rem 1rem;
          font-size: 0.875rem;
          gap: 0.5rem;
        }
      }

      .content-container {
        padding: 1rem 0.75rem;
      }

      .notification-item {
        padding: 0.875rem;
        border-radius: 12px;
      }

      .empty-state {
        padding: 3rem 1.5rem;

        .empty-icon {
          font-size: 3rem;
        }

        h3 {
          font-size: 1.25rem;
        }
      }
    }
  `]
})
export class NotificationsComponent implements OnInit {
  private readonly notificationSvc = inject(NotificationService);
  private readonly realtimeSvc = inject(RealtimeNotificationService);
  private readonly gradeThemeService = inject(GradeThemeService);
  private readonly currentUserInfoSvc = inject(CurrentUserInfoService);

  notifications = signal<NotificationDto[]>([]);
  loading = signal(false);
  readonly unreadCount = this.realtimeSvc.unreadCount;

  // Grade-based theming
  currentGrade = signal<number | null>(null);
  currentTheme = computed(() => {
    const grade = this.currentGrade();
    return grade ? this.gradeThemeService.getThemeForGrade(grade) : this.getDefaultTheme();
  });

  constructor() {
    // Append real-time notifications at the top as they arrive
    effect(() => {
      const latest = this.realtimeSvc.latestNotification();
      if (!latest) return;
      this.notifications.update(list => [latest as unknown as NotificationDto, ...list]);
    });
  }

  async ngOnInit(): Promise<void> {
    await this.loadUserInfo();
    await this.loadNotifications();
  }

  private async loadUserInfo(): Promise<void> {
    try {
      const userInfo = await lastValueFrom(this.currentUserInfoSvc.getCurrentUserActorInfo());
      this.currentGrade.set(userInfo?.currentGrade || null);
      
      // Apply theme based on grade
      if (userInfo?.currentGrade) {
        this.gradeThemeService.setThemeByGrade(userInfo.currentGrade);
      }
    } catch (error) {
      console.error('Failed to load user info:', error);
    }
  }

  private async loadNotifications(): Promise<void> {
    this.loading.set(true);
    try {
      const data = await lastValueFrom(this.notificationSvc.getMyNotifications());
      this.notifications.set(data ?? []);
    } catch {
      // silent
    } finally {
      this.loading.set(false);
    }
  }

  trackById(index: number, item: NotificationDto): string {
    return item.id || index.toString();
  }

  markRead(n: NotificationDto): void {
    if (n.isRead) return;
    this.notificationSvc.markAsRead(n.id!).subscribe(() => {
      n.isRead = true;
      this.realtimeSvc.decrementUnread();
    });
  }

  markAllRead(): void {
    this.notificationSvc.markAllAsRead().subscribe(() => {
      this.notifications().forEach(n => (n.isRead = true));
      this.realtimeSvc.resetUnread();
    });
  }

  getIcon(type: NotificationType): string {
    const map: Partial<Record<NotificationType, string>> = {
      [NotificationType.EnrollmentApproved]: 'fa-check-circle',
      [NotificationType.EnrollmentRejected]: 'fa-times-circle',
      [NotificationType.EnrollmentRequestPending]: 'fa-clock',
      [NotificationType.ParentStudentLinked]: 'fa-link',
      [NotificationType.ExamGradePosted]: 'fa-chart-bar',
      [NotificationType.AttendanceMarkedAbsent]: 'fa-calendar-times',
    };
    return map[type] ?? 'fa-bell';
  }

  getIconClass(type: NotificationType): string {
    const map: Partial<Record<NotificationType, string>> = {
      [NotificationType.EnrollmentApproved]: 'success',
      [NotificationType.EnrollmentRejected]: 'danger',
      [NotificationType.EnrollmentRequestPending]: 'warning',
      [NotificationType.ParentStudentLinked]: 'info',
      [NotificationType.ExamGradePosted]: 'success',
      [NotificationType.AttendanceMarkedAbsent]: 'danger',
    };
    return map[type] ?? 'info';
  }

  getNotificationColor(type: NotificationType, property: 'bg' | 'color'): string {
    const colors = {
      success: { bg: '#dcfce7', color: '#166534' },
      danger: { bg: '#fee2e2', color: '#dc2626' },
      warning: { bg: '#fef3c7', color: '#d97706' },
      info: { bg: '#dbeafe', color: '#1d4ed8' }
    };
    
    const iconClass = this.getIconClass(type);
    return colors[iconClass as keyof typeof colors]?.[property] || colors.info[property];
  }

  formatDate(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'الآن';
    if (m < 60) return `منذ ${m} د`;
    const h = Math.floor(m / 60);
    if (h < 24) return `منذ ${h} س`;
    return `منذ ${Math.floor(h / 24)} ي`;
  }

  private getDefaultTheme() {
    return {
      name: 'Default',
      primary: '#667eea',
      secondary: '#764ba2',
      accent: '#f093fb',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      light: '#f0f4ff',
      dark: '#5a67d8',
      textColor: '#1a202c',
      cardBg: '#ffffff',
      borderColor: '#e2e8f0',
      shadowColor: 'rgba(102, 126, 234, 0.1)',
      iconColor: '#667eea',
      badgeColor: '#667eea',
      progressColor: '#667eea'
    };
  }
}
