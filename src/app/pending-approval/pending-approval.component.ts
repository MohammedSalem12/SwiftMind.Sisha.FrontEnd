import { ChangeDetectionStrategy, Component, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '@abp/ng.core';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-pending-approval',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="pending-container" dir="rtl">
      <div class="pending-card">
        <div class="icon-circle">
          <i class="fas fa-hourglass-half"></i>
        </div>
        <h2>في انتظار الموافقة</h2>
        <p class="subtitle">Waiting for Approval</p>

        @if (requestInfo()) {
          <div class="info-box">
            <div class="info-row">
              <span class="label">الاسم:</span>
              <span>{{ requestInfo()!.fullName }}</span>
            </div>
            <div class="info-row">
              <span class="label">نوع الحساب:</span>
              <span>{{ requestInfo()!.requestedTypeName }}</span>
            </div>
            <div class="info-row">
              <span class="label">تاريخ التقديم:</span>
              <span>{{ requestInfo()!.creationTime | date:'yyyy-MM-dd' }}</span>
            </div>
          </div>
        }

        <p class="message">
          تم تقديم طلب تسجيلك بنجاح وهو قيد المراجعة من قبل الإدارة.
          <br>سيتم إشعارك فور الموافقة على طلبك.
        </p>
        <p class="message-en">
          Your registration request has been submitted and is under review.
          You will be notified once approved.
        </p>

        <button class="refresh-btn" (click)="checkStatus()">
          <i class="fas fa-sync-alt" [class.spinning]="loading()"></i>
          تحقق من الحالة
        </button>

        <button class="logout-btn" (click)="logout()">
          <i class="fas fa-sign-out-alt"></i>
          تسجيل الخروج
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      z-index: 9999;
    }
    .pending-container {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 1rem;
      z-index: 9999;
    }
    .pending-card {
      background: white;
      border-radius: 20px;
      padding: 2rem 1.5rem;
      max-width: 400px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.15);
    }
    .icon-circle {
      width: 80px; height: 80px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea, #764ba2);
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 1.5rem;
      i { font-size: 2rem; color: white; }
    }
    h2 { font-size: 1.4rem; color: #1a1a2e; margin: 0 0 .25rem; font-weight: 800; }
    .subtitle { font-size: .85rem; color: #999; margin: 0 0 1.5rem; }
    .info-box {
      background: #f8f9ff;
      border-radius: 12px;
      padding: 1rem;
      margin-bottom: 1.5rem;
      text-align: right;
    }
    .info-row {
      display: flex; justify-content: space-between;
      padding: .4rem 0;
      font-size: .85rem;
      color: #4a4a6a;
      &:not(:last-child) { border-bottom: 1px solid #eee; }
    }
    .label { font-weight: 700; color: #667eea; }
    .message {
      font-size: .85rem; color: #4a4a6a;
      line-height: 1.6; margin: 0 0 .5rem;
    }
    .message-en {
      font-size: .75rem; color: #999;
      line-height: 1.5; margin: 0 0 1.5rem;
    }
    .refresh-btn {
      width: 100%; padding: .85rem;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white; border: none; border-radius: 12px;
      font-size: .9rem; font-weight: 700;
      cursor: pointer; margin-bottom: .75rem;
      min-height: 48px;
      i { margin-left: .5rem; }
      .spinning { animation: spin 1s linear infinite; }
    }
    .logout-btn {
      width: 100%; padding: .75rem;
      background: transparent;
      color: #999; border: 1px solid #eee; border-radius: 12px;
      font-size: .85rem;
      cursor: pointer;
      min-height: 44px;
      i { margin-left: .5rem; }
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class PendingApprovalComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly apiBase = (environment as any).apis?.default?.url || '';

  requestInfo = signal<any>(null);
  loading = signal(false);

  ngOnInit() {
    this.checkStatus();
  }

  checkStatus() {
    this.loading.set(true);
    this.http.get<any>(`${this.apiBase}/api/app/registration-request/my-request-status`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (req) => {
          this.loading.set(false);
          if (!req) {
            // No request found — go to complete profile
            this.router.navigate(['/complete-profile']);
            return;
          }
          if (req.status === 1) {
            // Approved — redirect to home to pick up new role
            window.location.href = '/';
            return;
          }
          if (req.status === 2) {
            // Rejected
            this.requestInfo.set({ ...req, requestedTypeName: req.rejectionReason ? 'مرفوض: ' + req.rejectionReason : 'مرفوض' });
            return;
          }
          // Still pending
          this.requestInfo.set(req);
        },
        error: () => {
          this.loading.set(false);
          this.router.navigate(['/complete-profile']);
        }
      });
  }

  logout() {
    this.auth.logout();
  }
}
