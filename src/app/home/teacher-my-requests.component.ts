import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { EnrollmentRequestService } from '@proxy/student-enrollments';
import { SecretaryTeacherService } from '@proxy/teachers';
import { EnrollmentRequestInitiator } from '@proxy/enums/enrollment-request-initiator.enum';

type MainTab = 'enrollment' | 'link';
type SubTab  = 'pending' | 'done';

@Component({
  selector: 'app-teacher-my-requests',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page" dir="rtl">

      <!-- ── Header ── -->
      <div class="page-header">
        <div class="header-text">
          <h1>طلباتي</h1>
          <p>My Requests</p>
        </div>
        @if (totalPending() > 0) {
          <span class="header-badge">{{ totalPending() }}</span>
        }
      </div>

      <!-- ── Main tabs ── -->
      <div class="main-tabs">
        <button class="main-tab" [class.active]="mainTab() === 'enrollment'"
                (click)="switchMain('enrollment')">
          <i class="fas fa-clipboard-list"></i>
          طلبات التسجيل
          @if (pendingEnrollments().length > 0) {
            <span class="tab-badge">{{ pendingEnrollments().length }}</span>
          }
        </button>
        <button class="main-tab" [class.active]="mainTab() === 'link'"
                (click)="switchMain('link')">
          <i class="fas fa-link"></i>
          طلبات الربط
          @if (pendingLinks().length > 0) {
            <span class="tab-badge">{{ pendingLinks().length }}</span>
          }
        </button>
      </div>

      <!-- ── Sub tabs ── -->
      <div class="sub-tabs">
        <button class="sub-tab" [class.active]="subTab() === 'pending'"
                (click)="subTab.set('pending')">
          قيد الانتظار
          <span class="sub-count">{{ currentPendingList().length }}</span>
        </button>
        <button class="sub-tab" [class.active]="subTab() === 'done'"
                (click)="subTab.set('done')">
          المنتهية
          <span class="sub-count">{{ currentDoneList().length }}</span>
        </button>
      </div>

      <!-- ── Loading ── -->
      @if (loading()) {
        <div class="shimmer-list">
          @for (i of [1,2,3]; track i) {
            <div class="shimmer-card">
              <div class="shimmer-avatar"></div>
              <div class="shimmer-lines">
                <div class="shimmer-line w65"></div>
                <div class="shimmer-line w40"></div>
                <div class="shimmer-line w50"></div>
              </div>
              <div class="shimmer-action"></div>
            </div>
          }
        </div>
      }

      <!-- ── Error ── -->
      @if (error() && !loading()) {
        <div class="state-box error-box">
          <i class="fas fa-exclamation-circle"></i>
          <p>{{ error() }}</p>
          <button class="retry-btn" (click)="loadAll()">إعادة المحاولة</button>
        </div>
      }

      <!-- ── Empty ── -->
      @if (!loading() && !error() && currentList().length === 0) {
        <div class="state-box empty-box">
          <i class="fas fa-inbox"></i>
          @if (subTab() === 'pending') {
            <h3>لا توجد طلبات معلقة</h3>
            <p>No pending requests — all caught up!</p>
          } @else {
            <h3>لا توجد طلبات منتهية</h3>
            <p>No completed requests yet</p>
          }
        </div>
      }

      <!-- ── Enrollment request cards ── -->
      @if (!loading() && !error() && mainTab() === 'enrollment' && currentList().length > 0) {
        <div class="cards-list">
          @for (req of currentList(); track req.id) {
            <div class="req-card" [class.done-card]="subTab() === 'done'">

              <!-- Initiator icon -->
              <div class="req-avatar" [class.avatar-parent]="req.initiator === 1">
                <i [class]="req.initiator === 1 ? 'fas fa-user-shield' : 'fas fa-user-graduate'"></i>
              </div>

              <div class="req-info">
                <h4>{{ req.studentName || 'طالب' }}</h4>
                <span class="req-sub">{{ req.courseName || req.courseCode }}</span>
                @if (req.groupName) { <span class="req-sub dim">{{ req.groupName }}</span> }
                <span class="req-meta">
                  <span class="initiator-pill" [class.pill-parent]="req.initiator === 1">
                    {{ req.initiator === 1 ? 'بواسطة ولي الأمر' : 'بواسطة الطالب' }}
                  </span>
                </span>
                @if (subTab() === 'done') {
                  <span class="status-label" [class]="statusClass(req.status)">
                    {{ statusLabel(req.status) }}
                  </span>
                }
              </div>

              @if (subTab() === 'pending') {
                <div class="action-col">
                  <button class="btn-approve"
                          [disabled]="acting() === req.id"
                          (click)="approveEnrollment(req)">
                    @if (acting() === req.id + 'a') { <span class="spinner"></span> }
                    @else { <i class="fas fa-check"></i> }
                    قبول
                  </button>
                  <button class="btn-reject"
                          [disabled]="acting() === req.id"
                          (click)="rejectEnrollment(req)">
                    @if (acting() === req.id + 'r') { <span class="spinner"></span> }
                    @else { <i class="fas fa-times"></i> }
                    رفض
                  </button>
                </div>
              }

            </div>
          }
        </div>
      }

      <!-- ── Secretary link request cards ── -->
      @if (!loading() && !error() && mainTab() === 'link' && currentList().length > 0) {
        <div class="cards-list">
          @for (req of currentList(); track req.id) {
            <div class="req-card" [class.done-card]="subTab() === 'done'"
                 [class.approved-card]="req.status === 1"
                 [class.rejected-card]="req.status === 2">

              <div class="req-avatar avatar-secretary">
                <i class="fas fa-user-tie"></i>
              </div>

              <div class="req-info">
                <h4>{{ req.secretaryName || 'سكرتيرة' }}</h4>
                <span class="req-sub">طلب ربط بحسابك</span>
                <span class="req-sub dim">{{ formatDate(req.creationTime) }}</span>
                @if (subTab() === 'done' && req.decidedAt) {
                  <span class="req-sub dim">قُرر: {{ formatDate(req.decidedAt) }}</span>
                }
                @if (subTab() === 'done') {
                  <span class="status-label" [class]="linkStatusClass(req.status)">
                    {{ linkStatusLabel(req.status) }}
                  </span>
                }
              </div>

              @if (subTab() === 'pending') {
                <div class="action-col">
                  <button class="btn-approve"
                          [disabled]="acting() === req.id"
                          (click)="approveLink(req)">
                    @if (acting() === req.id + 'a') { <span class="spinner"></span> }
                    @else { <i class="fas fa-check"></i> }
                    قبول
                  </button>
                  <button class="btn-reject"
                          [disabled]="acting() === req.id"
                          (click)="rejectLink(req)">
                    @if (acting() === req.id + 'r') { <span class="spinner"></span> }
                    @else { <i class="fas fa-times"></i> }
                    رفض
                  </button>
                </div>
              }

            </div>
          }
        </div>
      }

      <!-- Safe area bottom padding -->
      <div style="height: calc(80px + env(safe-area-inset-bottom))"></div>

    </div>
  `,
  styles: [`
    .page {
      min-height: 100vh;
      background: #f4f5fb;
      direction: rtl;
    }

    /* ── Header ── */
    .page-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: calc(env(safe-area-inset-top, 0px) + 1rem) 1.25rem 1.25rem;
      display: flex;
      align-items: center;
      gap: .875rem;
    }
    .header-text { flex: 1; }
    .header-text h1 { font-size: 1.3rem; font-weight: 700; margin: 0; }
    .header-text p  { font-size: .8rem; margin: .1rem 0 0; opacity: .75; }
    .header-badge {
      background: #ef4444; color: white; border-radius: 20px;
      padding: .2rem .6rem; font-size: .8rem; font-weight: 700;
    }

    /* ── Main tabs ── */
    .main-tabs {
      display: flex;
      background: white;
      border-bottom: 2px solid #e9ecef;
      padding: 0 .25rem;
    }
    .main-tab {
      flex: 1; padding: .875rem .5rem;
      background: none; border: none; border-bottom: 3px solid transparent;
      cursor: pointer; font-size: .88rem; font-weight: 600; color: #9090aa;
      display: flex; align-items: center; justify-content: center; gap: .4rem;
      transition: color .15s, border-color .15s;
      margin-bottom: -2px;
    }
    .main-tab.active { color: #667eea; border-bottom-color: #667eea; }
    .main-tab i { font-size: .85rem; }
    .tab-badge {
      background: #ef4444; color: white; border-radius: 50%;
      width: 18px; height: 18px; display: flex; align-items: center;
      justify-content: center; font-size: .65rem; font-weight: 700;
    }

    /* ── Sub tabs ── */
    .sub-tabs {
      display: flex;
      background: #f9fafb;
      border-bottom: 1px solid #e9ecef;
      padding: 0 1rem;
      gap: 1.5rem;
    }
    .sub-tab {
      padding: .6rem 0; background: none; border: none; border-bottom: 2px solid transparent;
      cursor: pointer; font-size: .82rem; font-weight: 600; color: #9090aa;
      display: flex; align-items: center; gap: .35rem;
      transition: color .15s, border-color .15s;
      margin-bottom: -1px;
    }
    .sub-tab.active { color: #764ba2; border-bottom-color: #764ba2; }
    .sub-count {
      background: #e9ecef; color: #6c757d; border-radius: 20px;
      padding: .1rem .45rem; font-size: .7rem; font-weight: 700;
    }
    .sub-tab.active .sub-count { background: #ede9fe; color: #764ba2; }

    /* ── Shimmer ── */
    .shimmer-list { padding: .75rem; display: flex; flex-direction: column; gap: .625rem; }
    .shimmer-card {
      background: white; border-radius: 16px; padding: 1rem;
      display: flex; align-items: center; gap: .875rem;
      box-shadow: 0 2px 8px rgba(0,0,0,.04);
    }
    .shimmer-avatar {
      width: 48px; height: 48px; border-radius: 50%; background: #e9ecef;
      flex-shrink: 0; animation: pulse 1.4s ease-in-out infinite;
    }
    .shimmer-lines { flex: 1; display: flex; flex-direction: column; gap: .5rem; }
    .shimmer-line {
      height: 11px; border-radius: 6px; background: #e9ecef;
      animation: pulse 1.4s ease-in-out infinite;
    }
    .shimmer-line.w65 { width: 65%; }
    .shimmer-line.w40 { width: 40%; }
    .shimmer-line.w50 { width: 50%; }
    .shimmer-action { width: 70px; height: 64px; border-radius: 10px; background: #e9ecef;
      animation: pulse 1.4s ease-in-out infinite; }
    @keyframes pulse { 0%,100% { opacity: .45; } 50% { opacity: 1; } }

    /* ── State boxes ── */
    .state-box { text-align: center; padding: 4rem 1.5rem; color: #6c757d; }
    .state-box i { font-size: 3.5rem; margin-bottom: 1rem; display: block; }
    .state-box h3 { font-size: 1.1rem; font-weight: 600; color: #333; margin-bottom: .4rem; }
    .state-box p  { font-size: .85rem; color: #9090aa; }
    .error-box i  { color: #dc3545; }
    .empty-box i  { color: #c4c4d4; }
    .retry-btn {
      margin-top: 1rem;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white; border: none; padding: .75rem 1.5rem;
      border-radius: 12px; font-size: .9rem; font-weight: 600; cursor: pointer;
    }

    /* ── Cards ── */
    .cards-list { padding: .75rem; display: flex; flex-direction: column; gap: .625rem; }
    .req-card {
      background: white; border-radius: 16px; border: 1.5px solid #e9ecef;
      padding: 1rem; display: flex; align-items: flex-start; gap: .875rem;
      box-shadow: 0 2px 8px rgba(0,0,0,.04);
      transition: box-shadow .15s;
    }
    .req-card.done-card { opacity: .9; }
    .req-card.approved-card { border-color: rgba(16,185,129,.3); background: #f0fdf4; }
    .req-card.rejected-card { border-color: rgba(239,68,68,.2);  background: #fff8f8; }

    /* Avatars */
    .req-avatar {
      width: 48px; height: 48px; border-radius: 50%; flex-shrink: 0;
      background: linear-gradient(135deg, #667eea, #764ba2);
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 1.2rem;
    }
    .req-avatar.avatar-parent    { background: linear-gradient(135deg, #f59e0b, #d97706); }
    .req-avatar.avatar-secretary { background: linear-gradient(135deg, #10b981, #059669); }

    /* Info */
    .req-info { flex: 1; min-width: 0; }
    .req-info h4 { margin: 0 0 .2rem; font-size: .98rem; font-weight: 700; color: #1a1a2e; }
    .req-sub  { font-size: .8rem; color: #555; display: block; }
    .req-sub.dim { color: #9090aa; font-size: .75rem; }
    .req-meta { display: flex; align-items: center; gap: .4rem; margin-top: .3rem; flex-wrap: wrap; }

    .initiator-pill {
      font-size: .7rem; font-weight: 600;
      padding: .15rem .5rem; border-radius: 20px;
      background: rgba(102,126,234,.12); color: #667eea;
    }
    .initiator-pill.pill-parent {
      background: rgba(245,158,11,.12); color: #d97706;
    }

    .status-label {
      display: block; font-size: .78rem; font-weight: 600; margin-top: .3rem;
    }
    .sl-approved { color: #059669; }
    .sl-rejected  { color: #dc2626; }
    .sl-pending   { color: #d97706; }

    /* Action buttons */
    .action-col { display: flex; flex-direction: column; gap: .4rem; flex-shrink: 0; }
    .btn-approve, .btn-reject {
      padding: .45rem .8rem; border: none; border-radius: 10px;
      font-size: .78rem; font-weight: 600; cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: .3rem;
      min-width: 68px; transition: opacity .15s;
    }
    .btn-approve:disabled, .btn-reject:disabled { opacity: .55; cursor: not-allowed; }
    .btn-approve { background: rgba(16,185,129,.15); color: #059669; }
    .btn-approve:not(:disabled):active { background: rgba(16,185,129,.3); }
    .btn-reject  { background: rgba(239,68,68,.1);  color: #dc2626; }
    .btn-reject:not(:disabled):active  { background: rgba(239,68,68,.2); }

    .spinner {
      width: 13px; height: 13px; border: 2px solid currentColor;
      border-top-color: transparent; border-radius: 50%;
      animation: spin .7s linear infinite; display: inline-block;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class TeacherMyRequestsComponent implements OnInit {
  private readonly enrollmentSvc    = inject(EnrollmentRequestService);
  private readonly secretaryTeacherSvc = inject(SecretaryTeacherService);

  loading  = signal(true);
  error    = signal<string | null>(null);
  mainTab  = signal<MainTab>('enrollment');
  subTab   = signal<SubTab>('pending');
  acting   = signal<string | null>(null);

  // Enrollment requests
  pendingEnrollments = signal<any[]>([]);

  // Secretary link requests
  pendingLinks = signal<any[]>([]);
  allLinks     = signal<any[]>([]);

  totalPending = computed(() => this.pendingEnrollments().length + this.pendingLinks().length);

  currentPendingList = computed(() =>
    this.mainTab() === 'enrollment' ? this.pendingEnrollments() : this.pendingLinks()
  );

  currentDoneList = computed(() => {
    if (this.mainTab() === 'enrollment') return [];   // no history API for enrollment
    return this.allLinks().filter(r => r.status !== 0);
  });

  currentList = computed(() =>
    this.subTab() === 'pending' ? this.currentPendingList() : this.currentDoneList()
  );

  ngOnInit() { this.loadAll(); }

  async loadAll(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const [enrollPending, linkPending, linkAll] = await Promise.all([
        lastValueFrom(this.enrollmentSvc.getPendingRequestsForCurrentTeacher()),
        lastValueFrom(this.secretaryTeacherSvc.getPendingRequestsForCurrentTeacher()),
        lastValueFrom(this.secretaryTeacherSvc.getAllRequestsForCurrentTeacher()),
      ]);
      this.pendingEnrollments.set(enrollPending ?? []);
      this.pendingLinks.set(linkPending ?? []);
      this.allLinks.set(linkAll ?? []);
    } catch {
      this.error.set('حدث خطأ أثناء تحميل الطلبات / Error loading requests');
    } finally {
      this.loading.set(false);
    }
  }

  switchMain(tab: MainTab): void {
    this.mainTab.set(tab);
    this.subTab.set('pending');
  }

  // ── Enrollment actions ──────────────────────────────────────────────────────
  async approveEnrollment(req: any): Promise<void> {
    this.acting.set(req.id + 'a');
    try {
      await lastValueFrom(this.enrollmentSvc.approve({
        requestId: req.id,
        isParent: req.initiator === EnrollmentRequestInitiator.Parent,
      }));
      this.pendingEnrollments.update(list => list.filter(r => r.id !== req.id));
    } catch { /* silent */ }
    finally { this.acting.set(null); }
  }

  async rejectEnrollment(req: any): Promise<void> {
    this.acting.set(req.id + 'r');
    try {
      await lastValueFrom(this.enrollmentSvc.reject(req.id));
      this.pendingEnrollments.update(list => list.filter(r => r.id !== req.id));
    } catch { /* silent */ }
    finally { this.acting.set(null); }
  }

  // ── Secretary link actions ──────────────────────────────────────────────────
  async approveLink(req: any): Promise<void> {
    this.acting.set(req.id + 'a');
    try {
      await lastValueFrom(this.secretaryTeacherSvc.approveRequest(req.id));
      this.pendingLinks.update(list => list.filter(r => r.id !== req.id));
      this.allLinks.update(list => list.map(r =>
        r.id === req.id ? { ...r, status: 1, decidedAt: new Date().toISOString() } : r
      ));
    } catch { /* silent */ }
    finally { this.acting.set(null); }
  }

  async rejectLink(req: any): Promise<void> {
    this.acting.set(req.id + 'r');
    try {
      await lastValueFrom(this.secretaryTeacherSvc.rejectRequest(req.id));
      this.pendingLinks.update(list => list.filter(r => r.id !== req.id));
      this.allLinks.update(list => list.map(r =>
        r.id === req.id ? { ...r, status: 2, decidedAt: new Date().toISOString() } : r
      ));
    } catch { /* silent */ }
    finally { this.acting.set(null); }
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────
  statusClass(status: any): string {
    if (status === 1) return 'status-label sl-approved';
    if (status === 2) return 'status-label sl-rejected';
    return 'status-label sl-pending';
  }

  statusLabel(status: any): string {
    if (status === 1) return 'مقبول / Approved';
    if (status === 2) return 'مرفوض / Rejected';
    return 'معلق / Pending';
  }

  linkStatusClass(status: any): string {
    if (status === 1) return 'status-label sl-approved';
    if (status === 2) return 'status-label sl-rejected';
    return 'status-label sl-pending';
  }

  linkStatusLabel(status: any): string {
    if (status === 1) return 'مقبول / Approved';
    if (status === 2) return 'مرفوض / Rejected';
    return 'معلق / Pending';
  }

  formatDate(d?: string): string {
    if (!d) return '';
    try {
      return new Date(d).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return d; }
  }
}
