import { CommonModule, Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { environment } from '../../environments/environment';

interface RegistrationRequestDto {
  id: string;
  userId: string;
  userName: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  phoneNumber?: string;
  requestedType: number; // 3=Teacher, 4=Secretary
  status: number; // 0=Pending, 1=Approved, 2=Rejected
  rejectionReason?: string;
  reviewedByUserId?: string;
  reviewedAt?: string;
  fullName: string;
  requestedTypeName: string;
  creationTime: string;
}

type TabFilter = 'pending' | 'approved' | 'rejected' | 'all';

@Component({
  selector: 'app-registration-requests',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page" dir="rtl">
      <!-- Header -->
      <div class="page-header">
        <div class="blob b1"></div>
        <div class="blob b2"></div>
        <div class="header-row">
          <button class="btn-back" (click)="goBack()"><i class="fas fa-arrow-right"></i></button>
          <div class="header-text">
            <h1>طلبات التسجيل</h1>
            <p>Registration Requests</p>
          </div>
          <div class="header-icon"><i class="fas fa-user-plus"></i></div>
        </div>
      </div>

      <!-- Tab bar -->
      <div class="tab-bar">
        <button class="tab-btn" [class.active]="activeTab() === 'pending'" (click)="switchTab('pending')">
          <span class="tab-label">معلقة</span>
          <span class="tab-label-en">Pending</span>
          @if (pendingCount() > 0) {
            <span class="tab-badge">{{ pendingCount() }}</span>
          }
        </button>
        <button class="tab-btn" [class.active]="activeTab() === 'approved'" (click)="switchTab('approved')">
          <span class="tab-label">مقبولة</span>
          <span class="tab-label-en">Approved</span>
        </button>
        <button class="tab-btn" [class.active]="activeTab() === 'rejected'" (click)="switchTab('rejected')">
          <span class="tab-label">مرفوضة</span>
          <span class="tab-label-en">Rejected</span>
        </button>
        <button class="tab-btn" [class.active]="activeTab() === 'all'" (click)="switchTab('all')">
          <span class="tab-label">الكل</span>
          <span class="tab-label-en">All</span>
        </button>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="loading-area">
          @for (i of [1,2,3]; track i) { <div class="shimmer-card"></div> }
        </div>
      }

      <!-- Empty state -->
      @if (!loading() && requests().length === 0) {
        <div class="empty-state">
          <i class="fas fa-inbox"></i>
          <p>لا توجد طلبات</p>
          <span>No requests found</span>
        </div>
      }

      <!-- Toast -->
      @if (toast()) {
        <div class="toast-msg" [class.toast-success]="toastType() === 'success'" [class.toast-error]="toastType() === 'error'">
          <i [class]="toastType() === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'"></i>
          {{ toast() }}
        </div>
      }

      <!-- Cards -->
      @if (!loading()) {
        <div class="cards-list">
          @for (req of requests(); track req.id) {
            <div class="req-card">
              <!-- Card header -->
              <div class="req-header">
                <div class="req-user">
                  <div class="user-avatar">{{ (req.fullName || req.userName).charAt(0) }}</div>
                  <div>
                    <div class="req-fullname">{{ req.fullName }}</div>
                    <div class="req-username" dir="ltr">{{ req.userName }}</div>
                  </div>
                </div>
                <div class="req-meta">
                  <span class="type-badge" [class.type-teacher]="req.requestedType === 3" [class.type-secretary]="req.requestedType === 4">
                    {{ req.requestedType === 3 ? 'معلم' : 'سكرتير' }}
                  </span>
                </div>
              </div>

              <!-- Details -->
              <div class="req-details">
                @if (req.phoneNumber) {
                  <div class="detail-row">
                    <i class="fas fa-phone"></i>
                    <span dir="ltr">{{ req.phoneNumber }}</span>
                  </div>
                }
                <div class="detail-row">
                  <i class="fas fa-calendar-alt"></i>
                  <span>{{ formatDate(req.creationTime) }}</span>
                </div>
              </div>

              <!-- Status badge -->
              <div class="req-status-row">
                <span class="status-badge"
                  [class.status-pending]="req.status === 0"
                  [class.status-approved]="req.status === 1"
                  [class.status-rejected]="req.status === 2">
                  @if (req.status === 0) { <i class="fas fa-clock"></i> معلقة · Pending }
                  @if (req.status === 1) { <i class="fas fa-check-circle"></i> مقبولة · Approved }
                  @if (req.status === 2) { <i class="fas fa-times-circle"></i> مرفوضة · Rejected }
                </span>
              </div>

              <!-- Rejection reason (for rejected) -->
              @if (req.status === 2 && req.rejectionReason) {
                <div class="rejection-reason">
                  <i class="fas fa-comment-slash"></i>
                  <span>{{ req.rejectionReason }}</span>
                </div>
              }

              <!-- Action buttons (pending only) -->
              @if (req.status === 0) {
                @if (rejectingId() === req.id) {
                  <!-- Reject form -->
                  <div class="reject-form">
                    <label>سبب الرفض <span class="en-hint">Rejection Reason</span></label>
                    <textarea [(ngModel)]="rejectionReason" placeholder="أدخل سبب الرفض..." rows="2"></textarea>
                    @if (actionError()) {
                      <div class="msg msg--error"><i class="fas fa-exclamation-circle"></i> {{ actionError() }}</div>
                    }
                    <div class="form-actions">
                      <button class="btn-cancel" (click)="cancelReject()">إلغاء · Cancel</button>
                      <button class="btn-confirm-reject" (click)="confirmReject(req.id)" [disabled]="actionLoading()">
                        @if (actionLoading()) {
                          <i class="fas fa-spinner fa-spin"></i>
                        } @else {
                          <i class="fas fa-times"></i>
                        }
                        تأكيد الرفض
                      </button>
                    </div>
                  </div>
                } @else {
                  <div class="req-actions">
                    <button class="btn-approve" (click)="approve(req.id)" [disabled]="actionLoading()">
                      @if (actionLoading() && approvingId() === req.id) {
                        <i class="fas fa-spinner fa-spin"></i>
                      } @else {
                        <i class="fas fa-check"></i>
                      }
                      قبول · Approve
                    </button>
                    <button class="btn-reject" (click)="startReject(req.id)">
                      <i class="fas fa-times"></i> رفض · Reject
                    </button>
                  </div>
                }
              }
            </div>
          }
        </div>
      }

      <div style="height:calc(80px + env(safe-area-inset-bottom,0px))"></div>
    </div>
  `,
  styles: [`
    .page { min-height:100vh; background:#f4f5fb; }

    /* ── Header ── */
    .page-header {
      background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);
      padding:calc(env(safe-area-inset-top,0px) + 1.25rem) 1.25rem 1.5rem;
      position:relative; overflow:hidden;
    }
    .blob { position:absolute; border-radius:50%; background:rgba(255,255,255,.07); pointer-events:none; }
    .b1 { width:200px; height:200px; top:-70px; right:-60px; }
    .b2 { width:140px; height:140px; bottom:-50px; left:-30px; }
    .header-row { position:relative; z-index:1; display:flex; align-items:center; gap:.75rem; }
    .btn-back {
      width:44px; height:44px; border-radius:12px; border:none;
      background:rgba(255,255,255,.15); color:#fff; font-size:1.1rem;
      cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0;
    }
    .header-text { flex:1; }
    .header-text h1 { margin:0; font-size:1.2rem; font-weight:800; color:#fff; }
    .header-text p { margin:.1rem 0 0; font-size:.75rem; color:rgba(255,255,255,.7); }
    .header-icon {
      width:44px; height:44px; border-radius:12px;
      background:rgba(255,255,255,.15); color:#fff; font-size:1.2rem;
      display:flex; align-items:center; justify-content:center; flex-shrink:0;
    }

    /* ── Tab bar ── */
    .tab-bar {
      display:flex; gap:.5rem; padding:.75rem 1rem;
      overflow-x:auto; -webkit-overflow-scrolling:touch;
      background:#fff; border-bottom:1px solid #f0f0f0;
    }
    .tab-bar::-webkit-scrollbar { display:none; }
    .tab-btn {
      flex-shrink:0; position:relative;
      padding:.5rem .875rem; border-radius:10px; border:1.5px solid #e8e8f0;
      background:#fff; color:#666; font-size:.78rem; font-weight:600;
      cursor:pointer; display:flex; flex-direction:column; align-items:center; gap:.1rem;
      min-height:44px; min-width:70px; justify-content:center;
      transition:all .2s;
    }
    .tab-btn.active {
      background:linear-gradient(135deg,#667eea,#764ba2);
      color:#fff; border-color:transparent;
    }
    .tab-label { font-size:.8rem; }
    .tab-label-en { font-size:.6rem; opacity:.7; }
    .tab-badge {
      position:absolute; top:-5px; right:-5px;
      background:#ef4444; color:#fff; font-size:.55rem; font-weight:700;
      min-width:18px; height:18px; border-radius:9px;
      display:flex; align-items:center; justify-content:center;
      padding:0 4px; border:2px solid #fff;
    }

    /* ── Loading ── */
    .loading-area { padding:1rem; display:flex; flex-direction:column; gap:.75rem; }
    .shimmer-card {
      height:120px; border-radius:16px;
      background:linear-gradient(90deg,#e8e8f0 25%,#f0f0f8 50%,#e8e8f0 75%);
      background-size:200% 100%; animation:shimmer 1.4s infinite;
    }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    /* ── Empty state ── */
    .empty-state { text-align:center; padding:3rem 1rem; }
    .empty-state i { font-size:2.5rem; color:#9ca3af; display:block; margin-bottom:.75rem; }
    .empty-state p { font-size:.9rem; font-weight:600; color:#555; margin:0 0 .2rem; }
    .empty-state span { font-size:.78rem; color:#9090aa; }

    /* ── Toast ── */
    .toast-msg {
      position:fixed; top:calc(env(safe-area-inset-top,0px) + 12px);
      left:50%; transform:translateX(-50%);
      padding:.6rem 1.25rem; border-radius:12px;
      font-size:.82rem; font-weight:600; z-index:9999;
      box-shadow:0 4px 16px rgba(0,0,0,.12);
      display:flex; align-items:center; gap:.4rem;
      animation:toastIn .3s ease;
    }
    .toast-success { background:#059669; color:#fff; }
    .toast-error { background:#dc2626; color:#fff; }
    @keyframes toastIn { from { opacity:0; transform:translateX(-50%) translateY(-10px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }

    /* ── Cards ── */
    .cards-list { padding:.75rem 1rem; display:flex; flex-direction:column; gap:.75rem; }

    .req-card {
      background:#fff; border-radius:14px; border:1.5px solid #f0f0f0;
      padding:.875rem; box-shadow:0 2px 8px rgba(0,0,0,.04);
    }
    .req-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:.5rem; }
    .req-user { display:flex; align-items:center; gap:.6rem; }
    .user-avatar {
      width:42px; height:42px; border-radius:12px;
      background:linear-gradient(135deg,#667eea,#764ba2);
      color:#fff; font-size:1.1rem; font-weight:700;
      display:flex; align-items:center; justify-content:center; flex-shrink:0;
    }
    .req-fullname { font-size:.88rem; font-weight:700; color:#1a1a2e; }
    .req-username { font-size:.72rem; color:#9090aa; text-align:right; }
    .req-meta { display:flex; flex-direction:column; align-items:flex-end; gap:.25rem; }

    /* Type badge */
    .type-badge {
      padding:.2rem .6rem; border-radius:6px; font-size:.68rem; font-weight:700;
    }
    .type-teacher { background:rgba(59,130,246,.1); color:#2563eb; }
    .type-secretary { background:rgba(139,92,246,.1); color:#7c3aed; }

    /* Details */
    .req-details { display:flex; flex-wrap:wrap; gap:.5rem; margin-bottom:.5rem; }
    .detail-row {
      display:flex; align-items:center; gap:.35rem;
      font-size:.75rem; color:#6b7280;
    }
    .detail-row i { font-size:.7rem; color:#9ca3af; }

    /* Status */
    .req-status-row { margin-bottom:.5rem; }
    .status-badge {
      display:inline-flex; align-items:center; gap:.3rem;
      padding:.25rem .65rem; border-radius:8px; font-size:.72rem; font-weight:600;
    }
    .status-badge i { font-size:.7rem; }
    .status-pending { background:rgba(245,158,11,.1); color:#d97706; }
    .status-approved { background:rgba(16,185,129,.1); color:#059669; }
    .status-rejected { background:rgba(239,68,68,.1); color:#dc2626; }

    /* Rejection reason */
    .rejection-reason {
      display:flex; align-items:flex-start; gap:.4rem;
      padding:.5rem .65rem; border-radius:8px;
      background:rgba(239,68,68,.04); border:1px solid rgba(239,68,68,.1);
      font-size:.75rem; color:#b91c1c; margin-bottom:.5rem;
    }
    .rejection-reason i { margin-top:.1rem; flex-shrink:0; }

    /* Actions */
    .req-actions { display:flex; gap:.5rem; }
    .btn-approve {
      flex:1; padding:.5rem; border-radius:10px; border:none;
      background:linear-gradient(135deg,#059669,#047857); color:#fff;
      font-size:.78rem; font-weight:700; cursor:pointer;
      min-height:44px; display:flex; align-items:center; justify-content:center; gap:.3rem;
    }
    .btn-approve:disabled { opacity:.6; cursor:not-allowed; }
    .btn-reject {
      padding:.5rem .75rem; border-radius:10px; border:none;
      background:rgba(239,68,68,.08); color:#dc2626;
      font-size:.78rem; font-weight:700; cursor:pointer;
      min-height:44px; display:flex; align-items:center; justify-content:center; gap:.3rem;
    }
    .btn-reject:disabled { opacity:.6; cursor:not-allowed; }

    /* Reject form */
    .reject-form {
      padding:.75rem; background:rgba(239,68,68,.03); border-radius:10px;
      border:1px solid rgba(239,68,68,.1);
    }
    .reject-form label {
      display:block; font-size:.78rem; font-weight:600; color:#374151; margin-bottom:.3rem;
    }
    .en-hint { font-size:.65rem; color:#9ca3af; margin-right:.3rem; }
    .reject-form textarea {
      width:100%; padding:.5rem .6rem; border:1.5px solid #e5e7eb; border-radius:8px;
      font-size:.82rem; resize:none; font-family:inherit; min-height:60px;
      transition:border-color .2s;
    }
    .reject-form textarea:focus { outline:none; border-color:#dc2626; }
    .form-actions { display:flex; gap:.5rem; margin-top:.5rem; }
    .btn-cancel {
      flex:1; padding:.45rem; border-radius:8px; border:1.5px solid #e5e7eb;
      background:#fff; color:#6b7280; font-size:.75rem; font-weight:600; cursor:pointer;
      min-height:40px;
    }
    .btn-confirm-reject {
      flex:1; padding:.45rem; border-radius:8px; border:none;
      background:#dc2626; color:#fff; font-size:.75rem; font-weight:600; cursor:pointer;
      min-height:40px; display:flex; align-items:center; justify-content:center; gap:.3rem;
    }
    .btn-confirm-reject:disabled { opacity:.6; cursor:not-allowed; }

    .msg { padding:.4rem .6rem; border-radius:6px; font-size:.72rem; margin-top:.4rem; display:flex; align-items:center; gap:.3rem; }
    .msg--error { background:rgba(239,68,68,.08); color:#dc2626; }
  `],
})
export class RegistrationRequestsComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly location = inject(Location);
  private readonly apiBase = environment.apis?.default?.url || '';

  // State
  loading = signal(false);
  requests = signal<RegistrationRequestDto[]>([]);
  activeTab = signal<TabFilter>('pending');
  pendingCount = signal(0);

  // Action state
  actionLoading = signal(false);
  actionError = signal<string | null>(null);
  rejectingId = signal<string | null>(null);
  approvingId = signal<string | null>(null);
  rejectionReason = '';

  // Toast
  toast = signal<string | null>(null);
  toastType = signal<'success' | 'error'>('success');
  private toastTimer: any;

  async ngOnInit(): Promise<void> {
    await this.loadRequests();
  }

  goBack(): void {
    this.location.back();
  }

  async switchTab(tab: TabFilter): Promise<void> {
    this.activeTab.set(tab);
    this.cancelReject();
    await this.loadRequests();
  }

  private async loadRequests(): Promise<void> {
    this.loading.set(true);
    try {
      const tab = this.activeTab();
      let url: string;

      if (tab === 'pending') {
        url = `${this.apiBase}/api/app/registration-request/pending-requests`;
      } else {
        const statusMap: Record<string, string> = { approved: '1', rejected: '2', all: '' };
        const statusParam = statusMap[tab];
        url = `${this.apiBase}/api/app/registration-request/all-requests`;
        if (statusParam) {
          url += `?status=${statusParam}`;
        }
      }

      const list = await this.http.get<RegistrationRequestDto[]>(url).toPromise();
      this.requests.set(list ?? []);

      // Always fetch pending count for badge
      if (tab !== 'pending') {
        try {
          const pending = await this.http
            .get<RegistrationRequestDto[]>(`${this.apiBase}/api/app/registration-request/pending-requests`)
            .toPromise();
          this.pendingCount.set(pending?.length ?? 0);
        } catch { /* silent */ }
      } else {
        this.pendingCount.set(list?.length ?? 0);
      }
    } catch (error: any) {
      console.error('Error loading registration requests:', error);
      this.requests.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  async approve(id: string): Promise<void> {
    this.actionLoading.set(true);
    this.approvingId.set(id);
    this.actionError.set(null);
    try {
      await this.http.post(`${this.apiBase}/api/app/registration-request/approve/${id}`, {}).toPromise();
      this.showToast('تم قبول الطلب بنجاح', 'success');
      await this.loadRequests();
    } catch (error: any) {
      console.error('Error approving request:', error);
      this.showToast('حدث خطأ أثناء قبول الطلب', 'error');
    } finally {
      this.actionLoading.set(false);
      this.approvingId.set(null);
    }
  }

  startReject(id: string): void {
    this.rejectingId.set(id);
    this.rejectionReason = '';
    this.actionError.set(null);
  }

  cancelReject(): void {
    this.rejectingId.set(null);
    this.rejectionReason = '';
    this.actionError.set(null);
  }

  async confirmReject(id: string): Promise<void> {
    if (!this.rejectionReason.trim()) {
      this.actionError.set('يرجى إدخال سبب الرفض');
      return;
    }

    this.actionLoading.set(true);
    this.actionError.set(null);
    try {
      await this.http.post(`${this.apiBase}/api/app/registration-request/reject/${id}`, {
        reason: this.rejectionReason.trim(),
      }).toPromise();
      this.showToast('تم رفض الطلب', 'success');
      this.cancelReject();
      await this.loadRequests();
    } catch (error: any) {
      console.error('Error rejecting request:', error);
      this.actionError.set('حدث خطأ أثناء رفض الطلب');
    } finally {
      this.actionLoading.set(false);
    }
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    const hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'م' : 'ص';
    const h12 = hours % 12 || 12;
    return `${day}/${month}/${year} ${h12}:${minutes} ${ampm}`;
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toast.set(message);
    this.toastType.set(type);
    this.toastTimer = setTimeout(() => this.toast.set(null), 3000);
  }
}
