import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RestService } from '@abp/ng.core';
import { lastValueFrom } from 'rxjs';
import { PageHeaderComponent } from '../shared/components/page-header.component';

interface ChildSubscriptionDto {
  id: string;
  parentId: string;
  parentName: string;
  parentCode: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  durationMonths: number;
  amountEGP: number;
  status: number;
  isPaid: boolean;
  startDate?: string;
  endDate?: string;
  rejectionReason?: string;
  creationTime: string;
  paymentMethod?: number;
  paymentReference?: string;
}

@Component({
  selector: 'app-parent-child-subscriptions',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  template: `
    <div class="page" dir="rtl">
      <app-page-header [title]="'اشتراكات الأبناء'" [titleEn]="'Child Subscriptions'" [backTo]="'/'"></app-page-header>

      <!-- Feature on/off -->
      <div class="feature-card">
        <div class="feature-text">
          <span class="feature-title"><i class="fas fa-toggle-on"></i> ميزة الاشتراك المدفوع · Paid feature</span>
          <span class="feature-sub">
            @if (featureEnabled()) {
              مُفعّلة — الطفل الأول مجاني، والإضافي بـ {{ pricePerMonth() }} ج.م/شهر · Enabled
            } @else {
              مُعطّلة — ربط جميع الأبناء مجاني · Disabled (all links free)
            }
          </span>
        </div>
        <button class="switch" [class.on]="featureEnabled()" [disabled]="savingFeature()" (click)="toggleFeature()">
          <span class="knob"></span>
        </button>
      </div>
      @if (featureMsg()) { <div class="feature-msg" [class.err]="featureErr()">{{ featureMsg() }}</div> }

      <p class="accounts-hint">
        <i class="fas fa-info-circle"></i>
        حسابات استلام الدفع تُدار من صفحة طلبات الترقية · Payment accounts are managed on the Promotion Requests page.
      </p>

      <div class="tabs">
        <button class="tab" [class.tab-active]="tab() === 'pending'" (click)="tab.set('pending')">
          معلقة · Pending
          @if (pendingList().length > 0) { <span class="tab-count">{{ pendingList().length }}</span> }
        </button>
        <button class="tab" [class.tab-active]="tab() === 'all'" (click)="tab.set('all'); loadAll()">الكل · All</button>
      </div>

      @if (loading()) {
        <div class="loading-area">@for (i of [1,2,3]; track i) { <div class="sk-card"></div> }</div>
      }

      @if (!loading()) {
        @if (currentList().length === 0) {
          <div class="empty-state">
            <i class="fas fa-inbox"></i>
            <p>لا توجد طلبات {{ tab() === 'pending' ? 'معلقة' : '' }}</p>
            <span>No {{ tab() === 'pending' ? 'pending ' : '' }}requests</span>
          </div>
        }

        @for (s of currentList(); track s.id) {
          <div class="req-card">
            <div class="req-top">
              <div class="req-avatar">{{ getInitials(s.parentName) }}</div>
              <div class="req-info">
                <span class="req-name">{{ s.parentName }}</span>
                <span class="req-code">{{ s.parentCode }}</span>
              </div>
              <span class="req-status" [class]="'st-' + s.status">{{ statusLabel(s.status) }}</span>
            </div>

            <div class="req-details">
              <div class="req-row"><i class="fas fa-child"></i> {{ s.studentName }} <span class="muted">({{ s.studentCode }})</span></div>
              <div class="req-row"><i class="fas fa-calendar"></i> {{ s.durationMonths }} شهر · month(s)</div>
              <div class="req-row"><i class="fas fa-coins"></i> {{ s.amountEGP }} ج.م · EGP</div>
              <div class="req-row"><i class="fas fa-clock"></i> {{ s.creationTime | date:'yyyy-MM-dd HH:mm' }}</div>
              @if (s.startDate) {
                <div class="req-row"><i class="fas fa-play"></i> {{ s.startDate | date:'yyyy-MM-dd' }} → {{ s.endDate | date:'yyyy-MM-dd' }}</div>
              }
              @if (s.rejectionReason) {
                <div class="req-row rej"><i class="fas fa-times-circle"></i> {{ s.rejectionReason }}</div>
              }
            </div>

            @if (s.paymentReference || s.paymentMethod !== undefined) {
              <div class="pay-block" [class.pay-block-pending]="s.status === 0">
                <div class="pay-method"><i class="fas fa-money-bill-wave"></i> {{ paymentMethodLabel(s.paymentMethod) }}</div>
                @if (s.paymentReference) {
                  <div class="pay-ref">
                    <span class="pay-ref-label">مرجع الدفع · Payment ref</span>
                    <span class="pay-ref-value">{{ s.paymentReference }}</span>
                  </div>
                }
              </div>
            }

            @if (s.status === 0) {
              <div class="req-actions">
                <button class="action-approve" [disabled]="actionLoading()" (click)="approve(s.id)">
                  <i class="fas fa-check"></i> موافقة (تم الدفع) · Approve (Paid)
                </button>
                <button class="action-reject" [disabled]="actionLoading()" (click)="reject(s.id)">
                  <i class="fas fa-times"></i> رفض · Reject
                </button>
              </div>
            }
          </div>
        }
      }

      <div style="height:calc(80px + env(safe-area-inset-bottom,0px))"></div>
    </div>
  `,
  styles: [`
    .page { min-height:100vh; background:#f4f5fb; }
    .accounts-hint { margin:.75rem 1rem 0; font-size:.74rem; color:#9090aa; display:flex; align-items:flex-start; gap:.35rem; line-height:1.4; }
    .accounts-hint i { color:#667eea; margin-top:2px; }

    .feature-card { margin:.75rem 1rem 0; background:#fff; border-radius:14px; border:1.5px solid #e0e0f0; padding:1rem; display:flex; align-items:center; gap:.75rem; box-shadow:0 2px 8px rgba(0,0,0,.04); }
    .feature-text { flex:1; display:flex; flex-direction:column; gap:.2rem; }
    .feature-title { font-size:.88rem; font-weight:700; color:#1a1a2e; display:flex; align-items:center; gap:.4rem; }
    .feature-title i { color:#667eea; }
    .feature-sub { font-size:.74rem; color:#9090aa; line-height:1.4; }
    .switch { width:52px; height:30px; border-radius:999px; border:none; background:#d1d5db; position:relative; cursor:pointer; flex-shrink:0; transition:background .2s; }
    .switch.on { background:linear-gradient(135deg,#10b981,#059669); }
    .switch:disabled { opacity:.6; cursor:not-allowed; }
    .switch .knob { position:absolute; top:3px; left:3px; width:24px; height:24px; border-radius:50%; background:#fff; transition:left .2s; box-shadow:0 1px 3px rgba(0,0,0,.25); }
    .switch.on .knob { left:25px; }
    .feature-msg { margin:.5rem 1rem 0; font-size:.76rem; font-weight:600; color:#059669; text-align:center; }
    .feature-msg.err { color:#dc2626; }

    .tabs { display:flex; gap:.5rem; padding:.75rem 1rem 0; }
    .tab { flex:1; padding:.6rem; border:1.5px solid #e0e0f0; border-radius:10px; background:#fff; font-size:.82rem; font-weight:600; color:#555; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:.35rem; }
    .tab-active { background:linear-gradient(135deg,#667eea,#764ba2); color:#fff; border-color:transparent; }
    .tab-count { background:rgba(255,255,255,.25); padding:.1rem .4rem; border-radius:10px; font-size:.68rem; font-weight:700; }

    .loading-area { padding:1rem; display:flex; flex-direction:column; gap:.5rem; }
    .sk-card { height:120px; border-radius:14px; background:linear-gradient(90deg,#e8e8f0 25%,#f0f0f8 50%,#e8e8f0 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    .empty-state { text-align:center; padding:3rem 1rem; color:#999; }
    .empty-state i { font-size:2.5rem; color:#ccc; display:block; margin-bottom:.75rem; }
    .empty-state p { font-size:.95rem; font-weight:600; color:#555; margin:0 0 .25rem; }
    .empty-state span { font-size:.78rem; color:#aaa; }

    .req-card { margin:.5rem 1rem; background:#fff; border-radius:14px; border:1.5px solid #e0e0f0; padding:1rem; box-shadow:0 2px 8px rgba(0,0,0,.04); }
    .req-top { display:flex; align-items:center; gap:.75rem; margin-bottom:.5rem; }
    .req-avatar { width:44px; height:44px; border-radius:50%; background:linear-gradient(135deg,#667eea,#764ba2); color:#fff; font-weight:700; font-size:.95rem; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .req-info { flex:1; min-width:0; }
    .req-name { display:block; font-size:.92rem; font-weight:700; color:#1a1a2e; }
    .req-code { display:block; font-size:.72rem; color:#9090aa; }
    .req-status { font-size:.68rem; font-weight:700; padding:.2rem .5rem; border-radius:8px; flex-shrink:0; }
    .st-0 { background:rgba(245,158,11,.1); color:#d97706; }
    .st-1 { background:rgba(16,185,129,.1); color:#059669; }
    .st-2 { background:rgba(239,68,68,.08); color:#dc2626; }
    .st-3 { background:rgba(156,163,175,.1); color:#6b7280; }

    .req-details { display:flex; flex-direction:column; gap:.2rem; margin-bottom:.5rem; }
    .req-row { font-size:.78rem; color:#555; display:flex; align-items:center; gap:.35rem; }
    .req-row i { color:#667eea; width:14px; text-align:center; font-size:.7rem; }
    .req-row .muted { color:#9090aa; font-size:.72rem; }
    .req-row.rej { color:#dc2626; }
    .req-row.rej i { color:#dc2626; }

    .pay-block { margin-bottom:.5rem; padding:.6rem .7rem; border-radius:10px; background:#f6f7fd; border:1.5px solid #e0e0f0; display:flex; flex-direction:column; gap:.4rem; }
    .pay-block-pending { background:rgba(102,126,234,.07); border-color:rgba(102,126,234,.35); }
    .pay-method { font-size:.8rem; font-weight:700; color:#4a4a6a; display:flex; align-items:center; gap:.4rem; }
    .pay-method i { color:#667eea; font-size:.78rem; }
    .pay-ref { display:flex; align-items:center; justify-content:space-between; gap:.5rem; flex-wrap:wrap; }
    .pay-ref-label { font-size:.72rem; color:#9090aa; font-weight:600; }
    .pay-ref-value { font-family:'Courier New',ui-monospace,monospace; font-size:.95rem; font-weight:700; color:#667eea; letter-spacing:.5px; user-select:all; background:#fff; padding:.25rem .55rem; border-radius:8px; border:1px solid rgba(102,126,234,.25); }

    .req-actions { display:flex; gap:.5rem; }
    .action-approve { flex:1; padding:.6rem; border:none; border-radius:10px; background:linear-gradient(135deg,#10b981,#059669); color:#fff; font-size:.82rem; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:.35rem; min-height:44px; }
    .action-reject { flex:1; padding:.6rem; border:1.5px solid #e0e0f0; border-radius:10px; background:#fff; color:#dc2626; font-size:.82rem; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:.35rem; min-height:44px; }
    .action-approve:disabled, .action-reject:disabled { opacity:.5; cursor:not-allowed; }
  `],
})
export class ParentChildSubscriptionsComponent implements OnInit {
  private readonly rest = inject(RestService);

  loading = signal(true);
  actionLoading = signal(false);
  tab = signal<'pending' | 'all'>('pending');
  pendingList = signal<ChildSubscriptionDto[]>([]);
  allList = signal<ChildSubscriptionDto[]>([]);

  // Feature on/off
  featureEnabled = signal(true);
  pricePerMonth = signal(10);
  savingFeature = signal(false);
  featureMsg = signal<string | null>(null);
  featureErr = signal(false);

  readonly currentList = () => this.tab() === 'pending' ? this.pendingList() : this.allList();

  readonly statusLabels: Record<number, string> = { 0: 'معلق', 1: 'نشط', 2: 'مرفوض', 3: 'منتهي' };
  statusLabel(s: number): string { return this.statusLabels[s] ?? '?'; }

  paymentMethodLabel(m: number | undefined): string {
    return m === 1 ? 'فودافون كاش · Vodafone Cash' : 'إنستاباي · InstaPay';
  }

  getInitials(name: string): string {
    return (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }

  async ngOnInit(): Promise<void> {
    await this.loadFeatureSettings();
    try {
      const list = await lastValueFrom(
        this.rest.request<void, ChildSubscriptionDto[]>({ method: 'GET', url: '/api/app/parent-child-subscription/pending-list' })
      );
      this.pendingList.set(list ?? []);
    } catch (e) { console.error(e); }
    finally { this.loading.set(false); }
  }

  async loadFeatureSettings(): Promise<void> {
    try {
      const s = await lastValueFrom(
        this.rest.request<void, { enabled: boolean; pricePerChildPerMonthEGP: number }>(
          { method: 'GET', url: '/api/app/parent-child-subscription/feature-settings' })
      );
      this.featureEnabled.set(!!s?.enabled);
      if (s?.pricePerChildPerMonthEGP) this.pricePerMonth.set(s.pricePerChildPerMonthEGP);
    } catch (e) { console.error(e); }
  }

  async toggleFeature(): Promise<void> {
    const next = !this.featureEnabled();
    this.savingFeature.set(true);
    this.featureMsg.set(null);
    this.featureErr.set(false);
    try {
      await lastValueFrom(
        this.rest.request<{ enabled: boolean }, void>({
          method: 'PUT',
          url: '/api/app/parent-child-subscription/feature-settings',
          body: { enabled: next },
        })
      );
      this.featureEnabled.set(next);
      this.featureErr.set(false);
      this.featureMsg.set(next ? 'تم تفعيل الميزة · Feature enabled' : 'تم تعطيل الميزة · Feature disabled');
    } catch (e: any) {
      this.featureErr.set(true);
      this.featureMsg.set(e?.error?.error?.message || 'حدث خطأ · Error');
    } finally {
      this.savingFeature.set(false);
    }
  }

  async loadAll(): Promise<void> {
    if (this.allList().length > 0) return;
    this.loading.set(true);
    try {
      const list = await lastValueFrom(
        this.rest.request<void, ChildSubscriptionDto[]>({ method: 'GET', url: '/api/app/parent-child-subscription/all-list' })
      );
      this.allList.set(list ?? []);
    } catch (e) { console.error(e); }
    finally { this.loading.set(false); }
  }

  async approve(id: string): Promise<void> {
    this.actionLoading.set(true);
    try {
      await lastValueFrom(
        this.rest.request<void, void>({ method: 'POST', url: `/api/app/parent-child-subscription/${id}/approve` })
      );
      this.pendingList.update(list => list.filter(s => s.id !== id));
      this.allList.set([]);
    } catch (e: any) {
      alert(e?.error?.error?.message || 'Error');
    } finally {
      this.actionLoading.set(false);
    }
  }

  async reject(id: string): Promise<void> {
    const reason = prompt('سبب الرفض (اختياري) · Rejection reason (optional):');
    this.actionLoading.set(true);
    try {
      await lastValueFrom(
        this.rest.request<void, void>({
          method: 'POST',
          url: `/api/app/parent-child-subscription/${id}/reject`,
          params: reason ? { reason } : undefined,
        })
      );
      this.pendingList.update(list => list.filter(s => s.id !== id));
      this.allList.set([]);
    } catch (e: any) {
      alert(e?.error?.error?.message || 'Error');
    } finally {
      this.actionLoading.set(false);
    }
  }
}
