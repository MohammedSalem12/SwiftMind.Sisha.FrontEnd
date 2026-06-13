import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { effect } from '@angular/core';

import { EnrollmentRequestService } from '@proxy/student-enrollments';
import type { EnrollmentRequestDto } from '@proxy/student-enrollments/models';
import { EnrollmentRequestInitiator } from '@proxy/enums/enrollment-request-initiator.enum';
import { RealtimeNotificationService } from '../shared/services/realtime-notification.service';

@Component({
  selector: 'app-teacher-enrollment-requests',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="requests-page" dir="rtl">

      <!-- Header -->
      <div class="page-header">
        <button class="back-btn" (click)="goBack()">
          <i class="fas fa-arrow-right"></i>
        </button>
        <div class="header-info">
          <h1>طلبات التسجيل</h1>
          <p>Enrollment Requests</p>
        </div>
        @if (pendingRequests().length > 0) {
          <span class="header-badge">{{ pendingRequests().length }}</span>
        }
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="loading-area">
          <div class="skeleton-card"></div>
          <div class="skeleton-card"></div>
          <div class="skeleton-card"></div>
        </div>
      }

      <!-- Empty -->
      @if (!loading() && pendingRequests().length === 0) {
        <div class="empty-state">
          <div class="empty-icon"><i class="fas fa-clipboard-list"></i></div>
          <h3>لا توجد طلبات معلقة</h3>
          <p>ستظهر هنا طلبات تسجيل الطلاب وأولياء الأمور</p>
        </div>
      }

      <!-- Requests List -->
      @if (!loading() && pendingRequests().length > 0) {
        <div class="section-label">
          <i class="fas fa-clock"></i>
          <span>بانتظار موافقتك · Awaiting Approval</span>
          <span class="count-pill">{{ pendingRequests().length }}</span>
        </div>
        <div class="requests-list">
          @for (req of pendingRequests(); track req.id) {
            <div class="request-card">
              <div class="request-icon" [class.request-icon--parent]="req.initiator === initiatorParent" [class.request-icon--student]="req.initiator !== initiatorParent">
                <i class="fas" [class.fa-user-shield]="req.initiator === initiatorParent" [class.fa-user-graduate]="req.initiator !== initiatorParent"></i>
              </div>
              <div class="request-body">
                <div class="request-title">{{ req.studentName }}</div>
                <div class="request-subtitle">{{ req.courseName }}</div>
                <div class="request-chips">
                  @if (req.studentCode) {
                    <span class="mini-chip chip-code"><i class="fas fa-id-card"></i>{{ req.studentCode }}</span>
                  }
                  @if (req.courseCode) {
                    <span class="mini-chip chip-course"><i class="fas fa-book"></i>{{ req.courseCode }}</span>
                  }
                  @if (req.groupName) {
                    <span class="mini-chip chip-group"><i class="fas fa-users"></i>{{ req.groupName }}</span>
                  }
                  <span class="mini-chip" [class.chip-parent]="req.initiator === initiatorParent" [class.chip-student]="req.initiator !== initiatorParent">
                    <i class="fas" [class.fa-user-shield]="req.initiator === initiatorParent" [class.fa-user-graduate]="req.initiator !== initiatorParent"></i>
                    {{ req.initiator === initiatorParent ? 'ولي الأمر' : 'الطالب' }}
                  </span>
                </div>
              </div>
              <div class="request-actions">
                <button class="action-btn action-btn--approve" (click)="approve(req)" [disabled]="processingId() === req.id">
                  <i class="fas fa-check"></i>
                </button>
                <button class="action-btn action-btn--reject" (click)="reject(req)" [disabled]="processingId() === req.id">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
          }
        </div>
      }

      <!-- Toast -->
      @if (toastMessage()) {
        <div class="toast" [class.toast--success]="toastType() === 'success'" [class.toast--error]="toastType() === 'error'">
          <i class="fas" [class.fa-check-circle]="toastType() === 'success'" [class.fa-exclamation-circle]="toastType() === 'error'"></i>
          {{ toastMessage() }}
        </div>
      }

    </div>
  `,
  styles: [`
    $purple: #667eea;
    $purple-end: #764ba2;
    $purple-grad: linear-gradient(135deg, $purple, $purple-end);

    .requests-page {
      min-height: 100vh;
      background: #f4f3ff;
      direction: rtl;
      padding-bottom: calc(24px + env(safe-area-inset-bottom));
    }

    /* Header */
    .page-header {
      background: $purple-grad;
      padding: 1.25rem 1.25rem 1.5rem;
      display: flex; align-items: center; gap: 0.875rem;
      position: sticky; top: 0; z-index: 10;
    }
    .back-btn {
      width: 40px; height: 40px; flex-shrink: 0;
      background: rgba(255,255,255,0.18); border: 1.5px solid rgba(255,255,255,0.35);
      border-radius: 50%; color: #fff; font-size: 0.95rem;
      display: flex; align-items: center; justify-content: center; cursor: pointer;
      &:active { background: rgba(255,255,255,0.28); }
    }
    .header-info { flex: 1; h1 { font-size: 1.15rem; font-weight: 800; color: #fff; margin: 0; } p { font-size: 0.72rem; color: rgba(255,255,255,0.7); margin: 0; } }
    .header-badge {
      background: #ef4444; color: #fff;
      font-size: 0.75rem; font-weight: 700;
      min-width: 24px; height: 24px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center; padding: 0 6px;
    }

    /* Loading */
    .loading-area { padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem; }
    @keyframes shimmer { 0% { background-position: -600px 0; } 100% { background-position: 600px 0; } }
    .skeleton-card {
      height: 90px; border-radius: 14px;
      background: linear-gradient(90deg, #e9e6ff 25%, #f4f3ff 50%, #e9e6ff 75%);
      background-size: 600px 100%; animation: shimmer 1.5s infinite;
    }

    /* Empty */
    .empty-state { text-align: center; padding: 4rem 1.5rem; }
    .empty-icon {
      width: 80px; height: 80px; background: linear-gradient(135deg, #f0f4ff, #e8e0ff);
      border-radius: 50%; display: flex; align-items: center; justify-content: center;
      margin: 0 auto 1rem;
      i { font-size: 2rem; color: $purple-end; }
    }
    .empty-state h3 { font-size: 1rem; font-weight: 700; color: #1a202c; margin: 0 0 0.35rem; }
    .empty-state p { font-size: 0.82rem; color: #6b7280; margin: 0; }

    /* Section Label */
    .section-label {
      display: flex; align-items: center; gap: 0.5rem;
      padding: 0 1rem; margin: 1rem 0 0.5rem;
      font-size: 0.85rem; font-weight: 600; color: #374151;
      i { color: $purple; }
    }
    .count-pill {
      background: $purple-grad; color: #fff;
      border-radius: 20px; padding: 0.1rem 0.5rem;
      font-size: 0.7rem; font-weight: 700;
    }

    /* Requests list */
    .requests-list { display: flex; flex-direction: column; gap: 0.65rem; padding: 0 1rem; }

    .request-card {
      display: flex; align-items: center; gap: 0.75rem;
      background: #fff; border-radius: 14px; padding: 0.85rem;
      border: 1.5px solid #e9e6ff;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }

    .request-icon {
      width: 48px; height: 48px; border-radius: 14px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      i { font-size: 1.2rem; color: #fff; }
      &--parent { background: linear-gradient(135deg, #f59e0b, #d97706); }
      &--student { background: $purple-grad; }
    }

    .request-body { flex: 1; min-width: 0; }
    .request-title { font-size: 0.92rem; font-weight: 700; color: #1a202c; margin-bottom: 0.1rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .request-subtitle { font-size: 0.78rem; color: #6b7280; margin-bottom: 0.4rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .request-chips { display: flex; flex-wrap: wrap; gap: 0.25rem; }

    .mini-chip {
      display: inline-flex; align-items: center; gap: 0.18rem;
      font-size: 0.62rem; font-weight: 600; padding: 0.12rem 0.38rem; border-radius: 20px;
      i { font-size: 0.55rem; }
    }
    .chip-code    { background: #ede9fe; color: $purple-end; }
    .chip-course  { background: #e0f2fe; color: #0369a1; }
    .chip-group   { background: #dcfce7; color: #15803d; }
    .chip-parent  { background: #fef3c7; color: #d97706; }
    .chip-student { background: #ede9fe; color: $purple-end; }

    /* Actions */
    .request-actions { display: flex; flex-direction: column; gap: 0.4rem; flex-shrink: 0; }
    .action-btn {
      width: 38px; height: 38px; border: none; border-radius: 10px;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      font-size: 0.9rem; transition: all 0.15s;
      &:disabled { opacity: 0.5; cursor: not-allowed; }
      &--approve { background: #d1fae5; color: #059669; &:active:not(:disabled) { background: #10b981; color: #fff; } }
      &--reject  { background: #fee2e2; color: #dc2626; &:active:not(:disabled) { background: #ef4444; color: #fff; } }
    }

    /* Toast */
    .toast {
      position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
      display: flex; align-items: center; gap: 0.5rem;
      padding: 0.75rem 1.25rem; border-radius: 12px;
      font-size: 0.88rem; font-weight: 600;
      box-shadow: 0 4px 16px rgba(0,0,0,0.15); z-index: 1000;
      animation: slideUp 0.3s ease;
      &--success { background: #10b981; color: #fff; }
      &--error   { background: #ef4444; color: #fff; }
    }
    @keyframes slideUp { from { opacity: 0; transform: translateX(-50%) translateY(16px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }

    @media (min-width: 768px) { .requests-page { max-width: 600px; margin: 0 auto; } }
  `]
})
export class TeacherEnrollmentRequestsComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly enrollmentRequestService = inject(EnrollmentRequestService);
  private readonly realtimeService = inject(RealtimeNotificationService);

  readonly initiatorParent = EnrollmentRequestInitiator.Parent;

  loading = signal(false);
  pendingRequests = signal<EnrollmentRequestDto[]>([]);
  processingId = signal<string | null>(null);
  toastMessage = signal('');
  toastType = signal<'success' | 'error'>('success');

  private notifEffect = effect(() => {
    const notif = this.realtimeService.latestNotification();
    if (notif) this.loadRequests();
  });

  async ngOnInit(): Promise<void> {
    await this.loadRequests();
  }

  ngOnDestroy(): void {
    this.notifEffect.destroy();
  }

  private async loadRequests(): Promise<void> {
    this.loading.set(true);
    try {
      const requests = await lastValueFrom(
        this.enrollmentRequestService.getPendingRequestsForCurrentTeacher()
      );
      this.pendingRequests.set(requests || []);
    } catch (error) {
      console.error('Error loading enrollment requests:', error);
    } finally {
      this.loading.set(false);
    }
  }

  async approve(req: EnrollmentRequestDto): Promise<void> {
    if (!req.id) return;
    this.processingId.set(req.id);
    try {
      await lastValueFrom(
        this.enrollmentRequestService.approve({ requestId: req.id, isParent: false })
      );
      this.showToast('تمت الموافقة على الطلب', 'success');
      await this.loadRequests();
    } catch {
      this.showToast('حدث خطأ أثناء الموافقة', 'error');
    } finally {
      this.processingId.set(null);
    }
  }

  async reject(req: EnrollmentRequestDto): Promise<void> {
    if (!req.id) return;
    this.processingId.set(req.id);
    try {
      await lastValueFrom(this.enrollmentRequestService.reject(req.id));
      this.showToast('تم رفض الطلب', 'success');
      await this.loadRequests();
    } catch {
      this.showToast('حدث خطأ أثناء الرفض', 'error');
    } finally {
      this.processingId.set(null);
    }
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    this.toastMessage.set(message);
    this.toastType.set(type);
    setTimeout(() => this.toastMessage.set(''), 3000);
  }

  goBack(): void {
    this.router.navigate(['/teacher']);
  }
}
