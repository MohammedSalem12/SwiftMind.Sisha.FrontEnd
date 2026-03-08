import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { SecretaryTeacherService } from '@proxy/teachers';

@Component({
  selector: 'app-teacher-secretary-requests',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page" dir="rtl">

      <!-- Header -->
      <div class="page-header">
        <button class="back-btn" (click)="goBack()">
          <i class="fas fa-arrow-right"></i>
        </button>
        <div class="header-text">
          <h1>طلبات الربط</h1>
          <p>طلبات السكرتاريا للربط بحسابك</p>
        </div>
        @if (pendingCount() > 0) {
          <span class="pending-badge">{{ pendingCount() }}</span>
        }
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button class="tab" [class.active]="tab() === 'pending'" (click)="tab.set('pending')">
          بانتظار الموافقة
          @if (pendingCount() > 0) { <span class="tab-badge">{{ pendingCount() }}</span> }
        </button>
        <button class="tab" [class.active]="tab() === 'all'" (click)="switchTab('all')">
          جميع الطلبات
        </button>
      </div>

      <!-- Loading shimmer -->
      @if (loading()) {
        <div class="shimmer-list">
          @for (i of [1,2,3]; track i) {
            <div class="shimmer-card">
              <div class="shimmer-avatar"></div>
              <div class="shimmer-lines">
                <div class="shimmer-line w60"></div>
                <div class="shimmer-line w35"></div>
              </div>
              <div class="shimmer-btns"></div>
            </div>
          }
        </div>
      }

      <!-- Error -->
      @if (error() && !loading()) {
        <div class="state-box error-box">
          <i class="fas fa-exclamation-circle"></i>
          <p>{{ error() }}</p>
          <button class="retry-btn" (click)="loadRequests()">إعادة المحاولة</button>
        </div>
      }

      <!-- Empty -->
      @if (!loading() && !error() && displayedRequests().length === 0) {
        <div class="state-box empty-box">
          <i class="fas fa-check-double fa-3x"></i>
          @if (tab() === 'pending') {
            <h3>لا توجد طلبات معلقة</h3>
            <p>ستظهر هنا الطلبات الجديدة من السكرتاريا</p>
          } @else {
            <h3>لا توجد طلبات</h3>
          }
        </div>
      }

      <!-- Requests list -->
      @if (!loading() && !error() && displayedRequests().length > 0) {
        <div class="requests-list">
          @for (req of displayedRequests(); track req.id) {
            <div class="request-card" [class]="tab() === 'all' ? 'status-' + req.status : ''">

              <div class="req-avatar">
                <i class="fas fa-user-tie"></i>
              </div>

              <div class="req-info">
                <h4>{{ req.secretaryName || 'سكرتيرة' }}</h4>
                <span class="req-date">{{ formatDate(req.creationTime) }}</span>
                @if (tab() === 'all' && req.status !== 0) {
                  <span class="status-label" [class]="'sl-' + req.status">
                    @if (req.status === 1) { مقبول }
                    @if (req.status === 2) { مرفوض }
                  </span>
                }
              </div>

              @if (tab() === 'pending') {
                <div class="action-btns">
                  <button class="btn-approve"
                          [disabled]="acting() === req.id"
                          (click)="approve(req)">
                    @if (acting() === req.id + 'a') {
                      <span class="spinner"></span>
                    } @else {
                      <i class="fas fa-check"></i>
                    }
                    قبول
                  </button>
                  <button class="btn-reject"
                          [disabled]="acting() === req.id"
                          (click)="reject(req)">
                    @if (acting() === req.id + 'r') {
                      <span class="spinner"></span>
                    } @else {
                      <i class="fas fa-times"></i>
                    }
                    رفض
                  </button>
                </div>
              }

            </div>
          }
        </div>
      }

    </div>
  `,
  styles: [`
    .page { min-height: 100vh; background: #f4f5fb; direction: rtl; }

    .page-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: calc(env(safe-area-inset-top, 0px) + 1rem) 1rem 1.25rem;
      display: flex;
      align-items: center;
      gap: .875rem;
    }
    .back-btn {
      width: 40px; height: 40px; min-width: 40px; border-radius: 50%;
      background: rgba(255,255,255,.2); border: none;
      color: white; font-size: 1rem; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
    }
    .header-text { flex: 1; }
    .header-text h1 { font-size: 1.2rem; font-weight: 700; margin: 0; }
    .header-text p  { font-size: .8rem; margin: .1rem 0 0; opacity: .8; }
    .pending-badge {
      background: #ef4444; color: white; border-radius: 50%;
      width: 24px; height: 24px; display: flex; align-items: center;
      justify-content: center; font-size: .75rem; font-weight: 700; flex-shrink: 0;
    }

    /* Tabs */
    .tabs {
      display: flex; background: white;
      border-bottom: 2px solid #e9ecef;
    }
    .tab {
      flex: 1; padding: .875rem .5rem;
      background: none; border: none; cursor: pointer;
      font-size: .9rem; font-weight: 600; color: #9090aa;
      display: flex; align-items: center; justify-content: center; gap: .4rem;
      transition: color .15s;
    }
    .tab.active { color: #667eea; border-bottom: 2px solid #667eea; margin-bottom: -2px; }
    .tab-badge {
      background: #ef4444; color: white; border-radius: 50%;
      width: 20px; height: 20px; display: flex; align-items: center;
      justify-content: center; font-size: .7rem; font-weight: 700;
    }

    /* Shimmer */
    .shimmer-list { padding: .75rem; display: flex; flex-direction: column; gap: .625rem; }
    .shimmer-card {
      background: white; border-radius: 14px; padding: 1rem;
      display: flex; align-items: center; gap: .875rem;
    }
    .shimmer-avatar { width: 48px; height: 48px; border-radius: 50%; background: #e9ecef; flex-shrink: 0;
      animation: pulse 1.4s ease-in-out infinite; }
    .shimmer-lines { flex: 1; display: flex; flex-direction: column; gap: .5rem; }
    .shimmer-line { height: 12px; border-radius: 6px; background: #e9ecef;
      animation: pulse 1.4s ease-in-out infinite; }
    .shimmer-line.w60 { width: 60%; }
    .shimmer-line.w35 { width: 35%; }
    .shimmer-btns { width: 80px; height: 36px; border-radius: 8px; background: #e9ecef;
      animation: pulse 1.4s ease-in-out infinite; }
    @keyframes pulse { 0%,100% { opacity: .5; } 50% { opacity: 1; } }

    /* States */
    .state-box { text-align: center; padding: 4rem 1.5rem; color: #6c757d; }
    .state-box i { font-size: 3rem; margin-bottom: 1rem; display: block; }
    .state-box h3 { font-size: 1.1rem; font-weight: 600; color: #333; margin-bottom: .5rem; }
    .error-box i { color: #dc3545; }
    .empty-box i { color: #adb5bd; }
    .retry-btn {
      margin-top: 1rem;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white; border: none; padding: .75rem 1.5rem;
      border-radius: 12px; font-size: .9rem; font-weight: 600; cursor: pointer;
    }

    /* Request cards */
    .requests-list { padding: .75rem; display: flex; flex-direction: column; gap: .625rem; }
    .request-card {
      background: white; border-radius: 14px; border: 1.5px solid #e9ecef;
      padding: 1rem; display: flex; align-items: center; gap: .875rem;
      box-shadow: 0 2px 8px rgba(0,0,0,.04);
    }
    .request-card.status-1 { border-color: rgba(16,185,129,.3); background: #f0fdf4; }
    .request-card.status-2 { border-color: rgba(239,68,68,.2);  background: #fff8f8; }

    .req-avatar {
      width: 48px; height: 48px; border-radius: 50%; flex-shrink: 0;
      background: linear-gradient(135deg, #667eea, #764ba2);
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 1.25rem;
    }

    .req-info { flex: 1; min-width: 0; }
    .req-info h4 { margin: 0 0 .2rem; font-size: 1rem; font-weight: 600; color: #1a1a2e; }
    .req-date  { font-size: .78rem; color: #9090aa; display: block; }
    .status-label { font-size: .75rem; font-weight: 600; margin-top: .15rem; display: block; }
    .sl-1 { color: #059669; }
    .sl-2 { color: #dc2626; }

    /* Action buttons */
    .action-btns { display: flex; flex-direction: column; gap: .4rem; flex-shrink: 0; }
    .btn-approve, .btn-reject {
      padding: .5rem .875rem; border: none; border-radius: 10px;
      font-size: .8rem; font-weight: 600; cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: .35rem;
      min-width: 72px;
      &:disabled { opacity: .6; cursor: not-allowed; }
    }
    .btn-approve { background: rgba(16,185,129,.15); color: #059669; }
    .btn-approve:not(:disabled):active { background: rgba(16,185,129,.3); }
    .btn-reject  { background: rgba(239,68,68,.1);  color: #dc2626; }
    .btn-reject:not(:disabled):active  { background: rgba(239,68,68,.2); }

    .spinner {
      width: 14px; height: 14px; border: 2px solid currentColor;
      border-top-color: transparent; border-radius: 50%;
      animation: spin .7s linear infinite; display: inline-block;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class TeacherSecretaryRequestsComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly secretaryTeacherSvc = inject(SecretaryTeacherService);

  loading  = signal(true);
  error    = signal<string | null>(null);
  tab      = signal<'pending' | 'all'>('pending');
  acting   = signal<string | null>(null);

  private pending = signal<any[]>([]);
  private all     = signal<any[]>([]);

  pendingCount = () => this.pending().length;

  displayedRequests = () => this.tab() === 'pending' ? this.pending() : this.all();

  ngOnInit() { this.loadRequests(); }

  async loadRequests() {
    this.loading.set(true);
    this.error.set(null);
    try {
      const [pendingData, allData] = await Promise.all([
        lastValueFrom((this.secretaryTeacherSvc as any).getPendingRequestsForCurrentTeacher()) as Promise<any[]>,
        lastValueFrom((this.secretaryTeacherSvc as any).getAllRequestsForCurrentTeacher()) as Promise<any[]>,
      ]);
      this.pending.set(pendingData ?? []);
      this.all.set(allData ?? []);
    } catch {
      this.error.set('حدث خطأ أثناء تحميل الطلبات');
    } finally {
      this.loading.set(false);
    }
  }

  switchTab(t: 'pending' | 'all') { this.tab.set(t); }

  async approve(req: any) {
    this.acting.set(req.id + 'a');
    try {
      await lastValueFrom((this.secretaryTeacherSvc as any).approveRequest(req.id));
      // move from pending to all with status=1
      this.pending.update(list => list.filter(r => r.id !== req.id));
      this.all.update(list => list.map(r => r.id === req.id ? { ...r, status: 1, decidedAt: new Date().toISOString() } : r));
    } catch {
      // silent — real-time notification will inform secretary
    } finally {
      this.acting.set(null);
    }
  }

  async reject(req: any) {
    this.acting.set(req.id + 'r');
    try {
      await lastValueFrom((this.secretaryTeacherSvc as any).rejectRequest(req.id));
      this.pending.update(list => list.filter(r => r.id !== req.id));
      this.all.update(list => list.map(r => r.id === req.id ? { ...r, status: 2, decidedAt: new Date().toISOString() } : r));
    } catch {
      // silent
    } finally {
      this.acting.set(null);
    }
  }

  formatDate(d?: string): string {
    if (!d) return '';
    try {
      return new Date(d).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return d; }
  }

  goBack() { this.router.navigate(['/teacher']); }
}
