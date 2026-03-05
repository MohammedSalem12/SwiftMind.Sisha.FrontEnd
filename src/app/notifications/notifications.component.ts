import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { NotificationService } from '@proxy/notifications';
import type { NotificationDto } from '@proxy/notifications/models';
import { NotificationType } from '@proxy/notifications/notification-type.enum';
import { RealtimeNotificationService } from '../shared/services/realtime-notification.service';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notifications-container" dir="rtl">
      <div class="container py-4">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2><i class="fas fa-bell"></i> الإشعارات</h2>
            <p class="text-muted mb-0">{{ unreadCount() }} إشعار غير مقروء</p>
          </div>
          <button class="btn btn-outline-primary btn-sm" (click)="markAllRead()" *ngIf="unreadCount() > 0">
            <i class="fas fa-check-double"></i> تحديد الكل كمقروء
          </button>
        </div>

        <div *ngIf="loading()" class="text-center py-5">
          <div class="spinner-border text-primary" role="status"></div>
        </div>

        <div *ngIf="!loading()">
          <div *ngIf="notifications().length === 0" class="text-center py-5">
            <i class="fas fa-bell-slash fs-1 text-muted"></i>
            <p class="text-muted mt-3">لا توجد إشعارات</p>
          </div>

          <div class="notif-list">
            <div *ngFor="let n of notifications()"
                 class="notif-item"
                 [class.unread]="!n.isRead"
                 (click)="markRead(n)">
              <div class="notif-icon" [ngClass]="getIconClass(n.type!)">
                <i class="fas" [ngClass]="getIcon(n.type!)"></i>
              </div>
              <div class="notif-body">
                <div class="notif-top">
                  <span class="notif-title" [class.fw-bold]="!n.isRead">{{ n.title }}</span>
                  <span class="notif-time">{{ formatDate(n.creationTime!) }}</span>
                </div>
                <p class="notif-msg">{{ n.message }}</p>
              </div>
              <span class="new-dot" *ngIf="!n.isRead"></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .notifications-container { min-height: 100vh; background: #f0f2f5; }
    h2 { font-size: 1.3rem; font-weight: 700; margin: 0; color: #1a202c; }

    .notif-list { display: flex; flex-direction: column; gap: 0.5rem; }

    .notif-item {
      background: white; border-radius: 14px; padding: 1rem 1.1rem;
      display: flex; align-items: flex-start; gap: 0.85rem;
      box-shadow: 0 2px 6px rgba(0,0,0,0.05); cursor: pointer;
      transition: all 0.15s; position: relative;
    }
    .notif-item:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .notif-item.unread { border-right: 3px solid var(--ngx-primary); }

    .notif-icon {
      width: 40px; height: 40px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      font-size: 1rem;
    }
    .notif-icon.success { background: #d4edda; color: #15803d; }
    .notif-icon.danger  { background: #fee2e2; color: #dc2626; }
    .notif-icon.warning { background: #fef3c7; color: #d97706; }
    .notif-icon.info    { background: #dbeafe; color: #1d4ed8; }

    .notif-body { flex: 1; min-width: 0; }
    .notif-top { display: flex; justify-content: space-between; align-items: baseline; gap: 0.5rem; margin-bottom: 0.2rem; }
    .notif-title { font-size: 0.9rem; color: #1a202c; }
    .notif-time { font-size: 0.72rem; color: #9ca3af; white-space: nowrap; }
    .notif-msg { font-size: 0.82rem; color: #6b7280; margin: 0; line-height: 1.4; }

    .new-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: var(--ngx-primary); flex-shrink: 0; margin-top: 4px;
    }
  `]
})
export class NotificationsComponent implements OnInit {
  private readonly notificationSvc = inject(NotificationService);
  private readonly realtimeSvc = inject(RealtimeNotificationService);

  notifications = signal<NotificationDto[]>([]);
  loading = signal(false);
  readonly unreadCount = this.realtimeSvc.unreadCount;

  constructor() {
    // Append real-time notifications at the top as they arrive
    effect(() => {
      const latest = this.realtimeSvc.latestNotification();
      if (!latest) return;
      this.notifications.update(list => [latest as unknown as NotificationDto, ...list]);
    });
  }

  async ngOnInit(): Promise<void> {
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

  formatDate(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'الآن';
    if (m < 60) return `منذ ${m} د`;
    const h = Math.floor(m / 60);
    if (h < 24) return `منذ ${h} س`;
    return `منذ ${Math.floor(h / 24)} ي`;
  }
}
