import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { NotificationService, NotificationDto, NotificationType } from '@proxy/notifications';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notifications-container">
      <div class="container py-4">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2><i class="bi bi-bell"></i> الإشعارات</h2>
            <p class="text-muted mb-0">{{ unreadCount() }} إشعار غير مقروء</p>
          </div>
          <button class="btn btn-outline-primary btn-sm" (click)="markAllRead()" *ngIf="unreadCount() > 0">
            <i class="bi bi-check-all"></i> تحديد الكل كمقروء
          </button>
        </div>

        <div *ngIf="loading()" class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">جاري التحميل...</span>
          </div>
        </div>

        <div *ngIf="!loading()">
          <div *ngIf="notifications().length === 0" class="text-center py-5">
            <i class="bi bi-bell-slash fs-1 text-muted"></i>
            <p class="text-muted mt-3">لا توجد إشعارات</p>
          </div>

          <div class="list-group">
            <div *ngFor="let n of notifications()"
                 class="list-group-item list-group-item-action"
                 [class.bg-light]="!n.isRead"
                 (click)="markRead(n)">
              <div class="d-flex align-items-start gap-3">
                <div class="notification-icon" [ngClass]="getIconClass(n.type!)">
                  <i class="bi" [ngClass]="getIcon(n.type!)"></i>
                </div>
                <div class="flex-grow-1">
                  <div class="d-flex justify-content-between">
                    <h6 class="mb-1" [class.fw-bold]="!n.isRead">{{ n.title }}</h6>
                    <small class="text-muted">{{ formatDate(n.creationTime!) }}</small>
                  </div>
                  <p class="mb-0 text-muted">{{ n.message }}</p>
                </div>
                <span *ngIf="!n.isRead" class="badge bg-primary rounded-pill">جديد</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .notification-icon {
      width: 40px; height: 40px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .notification-icon.success { background: #d4edda; color: #155724; }
    .notification-icon.danger { background: #f8d7da; color: #721c24; }
    .notification-icon.warning { background: #fff3cd; color: #856404; }
    .notification-icon.info { background: #d1ecf1; color: #0c5460; }
    .list-group-item { cursor: pointer; border-radius: 8px !important; margin-bottom: 8px; }
    .list-group-item:hover { background-color: #f8f9fa; }
  `]
})
export class NotificationsComponent implements OnInit {
  notifications = signal<NotificationDto[]>([]);
  unreadCount = signal(0);
  loading = signal(false);

  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
    this.loadNotifications();
  }

  loadNotifications() {
    this.loading.set(true);
    this.notificationService.getMyNotifications().subscribe({
      next: (data) => {
        this.notifications.set(data);
        this.unreadCount.set(data.filter(n => !n.isRead).length);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  markRead(n: NotificationDto) {
    if (n.isRead) return;
    this.notificationService.markAsRead(n.id!).subscribe(() => {
      n.isRead = true;
      this.unreadCount.update(c => Math.max(0, c - 1));
    });
  }

  markAllRead() {
    this.notificationService.markAllAsRead().subscribe(() => {
      this.notifications().forEach(n => n.isRead = true);
      this.unreadCount.set(0);
    });
  }

  getIcon(type: NotificationType): string {
    switch (type) {
      case NotificationType.EnrollmentApproved: return 'bi-check-circle';
      case NotificationType.EnrollmentRejected: return 'bi-x-circle';
      case NotificationType.EnrollmentRequestPending: return 'bi-clock';
      case NotificationType.ParentStudentLinked: return 'bi-link-45deg';
      default: return 'bi-bell';
    }
  }

  getIconClass(type: NotificationType): string {
    switch (type) {
      case NotificationType.EnrollmentApproved: return 'success';
      case NotificationType.EnrollmentRejected: return 'danger';
      case NotificationType.EnrollmentRequestPending: return 'warning';
      case NotificationType.ParentStudentLinked: return 'info';
      default: return 'info';
    }
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    const diffDays = Math.floor(diffHours / 24);
    return `منذ ${diffDays} يوم`;
  }
}
