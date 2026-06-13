import { CommonModule, Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { environment } from '../../environments/environment';

interface ResetRequestDto {
  id: string;
  userNameOrContact: string;
  displayName?: string;
  status: number;
  adminNotes?: string;
  resolvedTime?: string;
  creationTime: string;
}

@Component({
  selector: 'app-password-reset-requests',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page" dir="rtl">
      <div class="page-header">
        <div class="blob b1"></div>
        <div class="blob b2"></div>
        <div class="header-row">
          <button class="btn-back" (click)="goBack()"><i class="fas fa-arrow-right"></i></button>
          <div class="header-text">
            <h1>طلبات استعادة كلمة المرور</h1>
            <p>Password Reset Requests</p>
          </div>
          <div class="header-icon"><i class="fas fa-key"></i></div>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-area">
          @for (i of [1,2,3]; track i) { <div class="shimmer-card"></div> }
        </div>
      }

      @if (!loading() && requests().length === 0) {
        <div class="empty-state">
          <i class="fas fa-check-circle"></i>
          <p>لا توجد طلبات معلقة</p>
          <span>No pending requests</span>
        </div>
      }

      @if (!loading()) {
        <div class="cards-list">
          @for (req of requests(); track req.id) {
            <div class="req-card">
              <div class="req-header">
                <div class="req-user">
                  <div class="user-avatar">{{ (req.displayName || req.userNameOrContact).charAt(0) }}</div>
                  <div>
                    <div class="req-username">{{ req.userNameOrContact }}</div>
                    @if (req.displayName) {
                      <div class="req-name">{{ req.displayName }}</div>
                    }
                  </div>
                </div>
                <div class="req-time">{{ formatTime(req.creationTime) }}</div>
              </div>

              @if (activeId() === req.id) {
                <div class="resolve-form">
                  <div class="form-group">
                    <label>كلمة المرور الجديدة <span class="req-mark">*</span></label>
                    <input type="text" [(ngModel)]="newPassword" placeholder="e.g. Pass@123" dir="ltr" />
                    <span class="hint">يجب أن تحتوي على حرف كبير وصغير ورقم ورمز خاص</span>
                  </div>
                  <div class="form-group">
                    <label>ملاحظات (اختياري)</label>
                    <input type="text" [(ngModel)]="adminNotes" placeholder="ملاحظات للسجل" />
                  </div>
                  @if (actionError()) {
                    <div class="msg msg--error"><i class="fas fa-exclamation-circle"></i> {{ actionError() }}</div>
                  }
                  <div class="form-actions">
                    <button class="btn-cancel" (click)="activeId.set(null)">إلغاء</button>
                    <button class="btn-resolve" (click)="resolve(req.id)" [disabled]="actionLoading()">
                      @if (actionLoading()) {
                        <i class="fas fa-spinner fa-spin"></i>
                      } @else {
                        <i class="fas fa-check"></i>
                      }
                      تعيين كلمة المرور
                    </button>
                  </div>
                </div>
              } @else {
                <div class="req-actions">
                  <button class="btn-reset" (click)="openResolve(req.id)">
                    <i class="fas fa-key"></i> إعادة تعيين
                  </button>
                  <button class="btn-reject" (click)="reject(req.id)" [disabled]="actionLoading()">
                    <i class="fas fa-times"></i> رفض
                  </button>
                </div>
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

    .loading-area { padding:1rem; display:flex; flex-direction:column; gap:.75rem; }
    .shimmer-card {
      height:100px; border-radius:16px;
      background:linear-gradient(90deg,#e8e8f0 25%,#f0f0f8 50%,#e8e8f0 75%);
      background-size:200% 100%; animation:shimmer 1.4s infinite;
    }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    .empty-state { text-align:center; padding:3rem 1rem; }
    .empty-state i { font-size:2.5rem; color:#059669; display:block; margin-bottom:.75rem; }
    .empty-state p { font-size:.9rem; font-weight:600; color:#555; margin:0 0 .2rem; }
    .empty-state span { font-size:.78rem; color:#9090aa; }

    .cards-list { padding:.75rem 1rem; display:flex; flex-direction:column; gap:.75rem; }

    .req-card {
      background:#fff; border-radius:14px; border:1.5px solid #f0f0f0;
      padding:.875rem; box-shadow:0 2px 8px rgba(0,0,0,.04);
    }
    .req-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:.6rem; }
    .req-user { display:flex; align-items:center; gap:.6rem; }
    .user-avatar {
      width:40px; height:40px; border-radius:12px;
      background:linear-gradient(135deg,#667eea,#764ba2);
      color:#fff; font-size:1rem; font-weight:700;
      display:flex; align-items:center; justify-content:center; flex-shrink:0;
    }
    .req-username { font-size:.88rem; font-weight:700; color:#1a1a2e; direction:ltr; text-align:right; }
    .req-name { font-size:.75rem; color:#9090aa; }
    .req-time { font-size:.68rem; color:#9090aa; white-space:nowrap; }

    .req-actions { display:flex; gap:.5rem; }
    .btn-reset {
      flex:1; padding:.5rem; border-radius:10px; border:none;
      background:linear-gradient(135deg,#667eea,#764ba2); color:#fff;
      font-size:.78rem; font-weight:700; cursor:pointer;
      min-height:44px; display:flex; align-items:center; justify-content:center; gap:.3rem;
    }
    .btn-reject {
      padding:.5rem .75rem; border-radius:10px; border:none;
      background:rgba(239,68,68,.08); color:#dc2626;
      font-size:.78rem; font-weight:700; cursor:pointer;
      min-height:44px; display:flex; align-items:center; justify-content:center; gap:.3rem;
    }
    .btn-reject:disabled, .btn-reset:disabled { opacity:.5; cursor:not-allowed; }

    .resolve-form {
      background:#f8f7ff; border-radius:12px; padding:.75rem;
      border:1px dashed #c4b5fd; margin-top:.5rem;
    }
    .form-group { margin-bottom:.6rem; }
    .form-group label { display:block; font-size:.75rem; font-weight:600; color:#555; margin-bottom:.2rem; }
    .req-mark { color:#dc2626; }
    .form-group input {
      width:100%; padding:.55rem .7rem; border-radius:10px;
      border:1.5px solid #e5e7eb; font-size:.85rem; color:#1a1a2e;
      background:#fff; box-sizing:border-box; min-height:40px; outline:none;
    }
    .form-group input:focus { border-color:#667eea; }
    .hint { font-size:.68rem; color:#9090aa; display:block; margin-top:.2rem; }

    .msg { padding:.4rem .6rem; border-radius:8px; font-size:.75rem; font-weight:600; display:flex; align-items:center; gap:.3rem; margin-bottom:.5rem; }
    .msg--error { background:rgba(239,68,68,.08); color:#dc2626; }

    .form-actions { display:flex; gap:.5rem; }
    .btn-cancel {
      flex:1; padding:.5rem; border-radius:10px; border:1.5px solid #e5e7eb;
      background:#fff; color:#555; font-size:.78rem; font-weight:600;
      cursor:pointer; min-height:40px;
    }
    .btn-resolve {
      flex:1.5; padding:.5rem; border-radius:10px; border:none;
      background:linear-gradient(135deg,#667eea,#764ba2); color:#fff;
      font-size:.78rem; font-weight:700; cursor:pointer;
      min-height:40px; display:flex; align-items:center; justify-content:center; gap:.3rem;
    }
    .btn-resolve:disabled { opacity:.5; cursor:not-allowed; }
  `],
})
export class PasswordResetRequestsComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly location = inject(Location);
  private readonly apiBase = environment.apis?.default?.url || '';

  loading = signal(true);
  requests = signal<ResetRequestDto[]>([]);
  activeId = signal<string | null>(null);
  actionLoading = signal(false);
  actionError = signal('');
  newPassword = '';
  adminNotes = '';

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  goBack(): void { this.location.back(); }

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      const list = await this.http.get<ResetRequestDto[]>(
        `${this.apiBase}/api/app/password-reset-request/pending-list`
      ).toPromise();
      this.requests.set(list ?? []);
    } catch (e) {
      console.error('Error loading reset requests:', e);
    } finally {
      this.loading.set(false);
    }
  }

  openResolve(id: string): void {
    this.activeId.set(id);
    this.newPassword = '';
    this.adminNotes = '';
    this.actionError.set('');
  }

  async resolve(id: string): Promise<void> {
    this.actionError.set('');
    if (!this.newPassword.trim()) {
      this.actionError.set('كلمة المرور مطلوبة');
      return;
    }
    this.actionLoading.set(true);
    try {
      await this.http.post(`${this.apiBase}/api/app/password-reset-request/${id}/resolve`, {
        newPassword: this.newPassword,
        adminNotes: this.adminNotes.trim() || undefined,
      }).toPromise();
      this.activeId.set(null);
      this.requests.update(list => list.filter(r => r.id !== id));
    } catch (e: any) {
      const msg = e?.error?.error?.message || 'فشل في إعادة تعيين كلمة المرور';
      this.actionError.set(msg);
    } finally {
      this.actionLoading.set(false);
    }
  }

  async reject(id: string): Promise<void> {
    this.actionLoading.set(true);
    try {
      await this.http.post(`${this.apiBase}/api/app/password-reset-request/${id}/reject`, {}).toPromise();
      this.requests.update(list => list.filter(r => r.id !== id));
    } catch (e) {
      console.error('Error rejecting request:', e);
    } finally {
      this.actionLoading.set(false);
    }
  }

  formatTime(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'الآن';
    if (diffMin < 60) return `منذ ${diffMin} دقيقة`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `منذ ${diffHr} ساعة`;
    const diffDay = Math.floor(diffHr / 24);
    return `منذ ${diffDay} يوم`;
  }
}
