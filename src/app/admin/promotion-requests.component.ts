import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RestService } from '@abp/ng.core';
import { lastValueFrom } from 'rxjs';
import { PageHeaderComponent } from '../shared/components/page-header.component';

interface PromotionDto {
  id: string;
  teacherId: string;
  teacherName: string;
  teacherCode: string;
  durationMonths: number;
  amountEGP: number;
  government: string;
  town: string;
  status: number;
  isPaid: boolean;
  startDate?: string;
  endDate?: string;
  rejectionReason?: string;
  creationTime: string;
  paymentMethod?: number;
  paymentReference?: string;
}

interface PaymentInfoDto {
  instaPayAddress: string;
  vodafoneCashNumber: string;
}

@Component({
  selector: 'app-promotion-requests',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  template: `
    <div class="page" dir="rtl">

      <app-page-header
        [title]="'طلبات الترقية'"
        [titleEn]="'Promotion Requests'"
        [backTo]="'/'"></app-page-header>

      <!-- Payment receiving accounts -->
      <div class="accounts-card">
        <button class="accounts-head" (click)="accountsOpen.set(!accountsOpen())">
          <span class="accounts-title">
            <i class="fas fa-wallet"></i>
            حسابات استلام الدفع · Payment Accounts
          </span>
          <i class="fas" [class.fa-chevron-down]="!accountsOpen()" [class.fa-chevron-up]="accountsOpen()"></i>
        </button>

        @if (accountsOpen()) {
          <div class="accounts-body">
            <div class="acc-field">
              <label>عنوان إنستاباي · InstaPay address</label>
              <input
                type="text"
                inputmode="email"
                placeholder="name@instapay"
                [ngModel]="instaPay()"
                (ngModelChange)="instaPay.set($event)" />
            </div>

            <div class="acc-field">
              <label>رقم فودافون كاش · Vodafone Cash number</label>
              <input
                type="tel"
                inputmode="tel"
                placeholder="01XXXXXXXXX"
                [ngModel]="vodafone()"
                (ngModelChange)="vodafone.set($event)" />
            </div>

            <button class="acc-save" [disabled]="savingAccounts()" (click)="saveAccounts()">
              @if (savingAccounts()) {
                <i class="fas fa-spinner fa-spin"></i> جارٍ الحفظ · Saving…
              } @else {
                <i class="fas fa-save"></i> حفظ · Save
              }
            </button>

            @if (accountsMsg()) {
              <div class="acc-msg" [class.acc-msg-err]="accountsErr()">{{ accountsMsg() }}</div>
            }
          </div>
        }
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button class="tab" [class.tab-active]="tab() === 'pending'" (click)="tab.set('pending')">
          معلقة · Pending
          @if (pendingList().length > 0) { <span class="tab-count">{{ pendingList().length }}</span> }
        </button>
        <button class="tab" [class.tab-active]="tab() === 'all'" (click)="tab.set('all'); loadAll()">
          الكل · All
        </button>
      </div>

      @if (loading()) {
        <div class="loading-area">
          @for (i of [1,2,3]; track i) { <div class="sk-card"></div> }
        </div>
      }

      @if (!loading()) {
        @if (currentList().length === 0) {
          <div class="empty-state">
            <i class="fas fa-inbox"></i>
            <p>لا توجد طلبات {{ tab() === 'pending' ? 'معلقة' : '' }}</p>
            <span>No {{ tab() === 'pending' ? 'pending ' : '' }}requests</span>
          </div>
        }

        @for (p of currentList(); track p.id) {
          <div class="req-card">
            <div class="req-top">
              <div class="req-avatar">{{ getInitials(p.teacherName) }}</div>
              <div class="req-info">
                <span class="req-name">{{ p.teacherName }}</span>
                <span class="req-code">{{ p.teacherCode }}</span>
              </div>
              <span class="req-status" [class]="'st-' + p.status">{{ statusLabel(p.status) }}</span>
            </div>

            <div class="req-details">
              <div class="req-row"><i class="fas fa-calendar"></i> {{ p.durationMonths }} شهر · {{ p.durationMonths }} month(s)</div>
              <div class="req-row"><i class="fas fa-coins"></i> {{ p.amountEGP }} ج.م · EGP</div>
              <div class="req-row"><i class="fas fa-map-marker-alt"></i> {{ p.government }} — {{ p.town }}</div>
              <div class="req-row"><i class="fas fa-clock"></i> {{ p.creationTime | date:'yyyy-MM-dd HH:mm' }}</div>
              @if (p.startDate) {
                <div class="req-row"><i class="fas fa-play"></i> {{ p.startDate | date:'yyyy-MM-dd' }} → {{ p.endDate | date:'yyyy-MM-dd' }}</div>
              }
              @if (p.rejectionReason) {
                <div class="req-row rej"><i class="fas fa-times-circle"></i> {{ p.rejectionReason }}</div>
              }
            </div>

            @if (p.paymentReference || p.paymentMethod !== undefined) {
              <div class="pay-block" [class.pay-block-pending]="p.status === 0">
                <div class="pay-method">
                  <i class="fas fa-money-bill-wave"></i>
                  {{ paymentMethodLabel(p.paymentMethod) }}
                </div>
                @if (p.paymentReference) {
                  <div class="pay-ref">
                    <span class="pay-ref-label">مرجع الدفع · Payment ref</span>
                    <span class="pay-ref-value">{{ p.paymentReference }}</span>
                  </div>
                }
              </div>
            }

            @if (p.status === 0) {
              <div class="req-actions">
                <button class="action-approve" [disabled]="actionLoading()" (click)="approve(p.id)">
                  <i class="fas fa-check"></i> موافقة (تم الدفع) · Approve (Paid)
                </button>
                <button class="action-reject" [disabled]="actionLoading()" (click)="reject(p.id)">
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

    .accounts-card {
      margin:.75rem 1rem 0; background:#fff; border-radius:14px;
      border:1.5px solid #e0e0f0; overflow:hidden;
      box-shadow:0 2px 8px rgba(0,0,0,.04);
    }
    .accounts-head {
      width:100%; min-height:48px; padding:.75rem 1rem; border:none; cursor:pointer;
      background:linear-gradient(135deg,#667eea,#764ba2); color:#fff;
      display:flex; align-items:center; justify-content:space-between; gap:.5rem;
    }
    .accounts-title { display:flex; align-items:center; gap:.5rem; font-size:.85rem; font-weight:700; }
    .accounts-body { padding:1rem; display:flex; flex-direction:column; gap:.75rem; }
    .acc-field { display:flex; flex-direction:column; gap:.3rem; }
    .acc-field label { font-size:.76rem; font-weight:700; color:#555; }
    .acc-field input {
      font-size:16px; padding:.65rem .75rem; border:1.5px solid #e0e0f0; border-radius:10px;
      background:#fafaff; color:#1a1a2e; min-height:44px; width:100%; box-sizing:border-box;
    }
    .acc-field input:focus { outline:none; border-color:#667eea; background:#fff; }
    .acc-save {
      min-height:44px; padding:.65rem; border:none; border-radius:10px;
      background:linear-gradient(135deg,#667eea,#764ba2); color:#fff;
      font-size:.85rem; font-weight:700; cursor:pointer;
      display:flex; align-items:center; justify-content:center; gap:.4rem;
    }
    .acc-save:disabled { opacity:.6; cursor:not-allowed; }
    .acc-msg { font-size:.78rem; font-weight:600; color:#059669; text-align:center; }
    .acc-msg-err { color:#dc2626; }

    .tabs {
      display:flex; gap:.5rem; padding:.75rem 1rem 0;
    }
    .tab {
      flex:1; padding:.6rem; border:1.5px solid #e0e0f0; border-radius:10px;
      background:#fff; font-size:.82rem; font-weight:600; color:#555;
      cursor:pointer; display:flex; align-items:center; justify-content:center; gap:.35rem;
    }
    .tab-active { background:linear-gradient(135deg,#667eea,#764ba2); color:#fff; border-color:transparent; }
    .tab-count {
      background:rgba(255,255,255,.25); padding:.1rem .4rem; border-radius:10px;
      font-size:.68rem; font-weight:700;
    }

    .loading-area { padding:1rem; display:flex; flex-direction:column; gap:.5rem; }
    .sk-card {
      height:120px; border-radius:14px;
      background:linear-gradient(90deg,#e8e8f0 25%,#f0f0f8 50%,#e8e8f0 75%);
      background-size:200% 100%; animation:shimmer 1.4s infinite;
    }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    .empty-state {
      text-align:center; padding:3rem 1rem; color:#999;
    }
    .empty-state i { font-size:2.5rem; color:#ccc; display:block; margin-bottom:.75rem; }
    .empty-state p { font-size:.95rem; font-weight:600; color:#555; margin:0 0 .25rem; }
    .empty-state span { font-size:.78rem; color:#aaa; }

    .req-card {
      margin:.5rem 1rem; background:#fff; border-radius:14px;
      border:1.5px solid #e0e0f0; padding:1rem;
      box-shadow:0 2px 8px rgba(0,0,0,.04);
    }
    .req-top { display:flex; align-items:center; gap:.75rem; margin-bottom:.5rem; }
    .req-avatar {
      width:44px; height:44px; border-radius:50%;
      background:linear-gradient(135deg,#667eea,#764ba2);
      color:#fff; font-weight:700; font-size:.95rem;
      display:flex; align-items:center; justify-content:center; flex-shrink:0;
    }
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
    .req-row.rej { color:#dc2626; }
    .req-row.rej i { color:#dc2626; }

    .pay-block {
      margin-bottom:.5rem; padding:.6rem .7rem; border-radius:10px;
      background:#f6f7fd; border:1.5px solid #e0e0f0;
      display:flex; flex-direction:column; gap:.4rem;
    }
    .pay-block-pending { background:rgba(102,126,234,.07); border-color:rgba(102,126,234,.35); }
    .pay-method {
      font-size:.8rem; font-weight:700; color:#4a4a6a;
      display:flex; align-items:center; gap:.4rem;
    }
    .pay-method i { color:#667eea; font-size:.78rem; }
    .pay-ref { display:flex; align-items:center; justify-content:space-between; gap:.5rem; flex-wrap:wrap; }
    .pay-ref-label { font-size:.72rem; color:#9090aa; font-weight:600; }
    .pay-ref-value {
      font-family:'Courier New',ui-monospace,monospace; font-size:.95rem; font-weight:700;
      color:#667eea; letter-spacing:.5px; user-select:all;
      background:#fff; padding:.25rem .55rem; border-radius:8px; border:1px solid rgba(102,126,234,.25);
    }

    .req-actions { display:flex; gap:.5rem; }
    .action-approve {
      flex:1; padding:.6rem; border:none; border-radius:10px;
      background:linear-gradient(135deg,#10b981,#059669); color:#fff;
      font-size:.82rem; font-weight:700; cursor:pointer;
      display:flex; align-items:center; justify-content:center; gap:.35rem;
      min-height:44px;
    }
    .action-reject {
      flex:1; padding:.6rem; border:1.5px solid #e0e0f0; border-radius:10px;
      background:#fff; color:#dc2626;
      font-size:.82rem; font-weight:700; cursor:pointer;
      display:flex; align-items:center; justify-content:center; gap:.35rem;
      min-height:44px;
    }
    .action-approve:disabled, .action-reject:disabled { opacity:.5; cursor:not-allowed; }
  `],
})
export class PromotionRequestsComponent implements OnInit {
  private readonly rest = inject(RestService);

  loading = signal(true);
  actionLoading = signal(false);
  tab = signal<'pending' | 'all'>('pending');
  pendingList = signal<PromotionDto[]>([]);
  allList = signal<PromotionDto[]>([]);

  // Payment receiving accounts
  accountsOpen = signal(false);
  instaPay = signal('');
  vodafone = signal('');
  savingAccounts = signal(false);
  accountsMsg = signal<string | null>(null);
  accountsErr = signal(false);

  readonly currentList = () => this.tab() === 'pending' ? this.pendingList() : this.allList();

  readonly statusLabels: Record<number, string> = {
    0: 'معلق', 1: 'نشط', 2: 'مرفوض', 3: 'منتهي',
  };

  statusLabel(s: number): string { return this.statusLabels[s] ?? '?'; }

  paymentMethodLabel(m: number | undefined): string {
    return m === 1 ? 'فودافون كاش · Vodafone Cash' : 'إنستاباي · InstaPay';
  }

  getInitials(name: string): string {
    return (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }

  async ngOnInit(): Promise<void> {
    try {
      const list = await lastValueFrom(
        this.rest.request<void, PromotionDto[]>({ method: 'GET', url: '/api/app/teacher-promotion/pending-list' })
      );
      this.pendingList.set(list ?? []);
    } catch (e) { console.error(e); }
    finally { this.loading.set(false); }

    await this.loadPaymentInfo();
  }

  async loadPaymentInfo(): Promise<void> {
    try {
      const info = await lastValueFrom(
        this.rest.request<void, PaymentInfoDto>({ method: 'GET', url: '/api/app/teacher-promotion/payment-info' })
      );
      this.instaPay.set(info?.instaPayAddress ?? '');
      this.vodafone.set(info?.vodafoneCashNumber ?? '');
    } catch (e) { console.error(e); }
  }

  async saveAccounts(): Promise<void> {
    this.savingAccounts.set(true);
    this.accountsMsg.set(null);
    this.accountsErr.set(false);
    try {
      await lastValueFrom(
        this.rest.request<PaymentInfoDto, void>({
          method: 'PUT',
          url: '/api/app/teacher-promotion/payment-info',
          body: {
            instaPayAddress: this.instaPay(),
            vodafoneCashNumber: this.vodafone(),
          },
        })
      );
      this.accountsErr.set(false);
      this.accountsMsg.set('تم الحفظ بنجاح · Saved successfully');
    } catch (e: any) {
      console.error(e);
      this.accountsErr.set(true);
      this.accountsMsg.set(e?.error?.error?.message || 'حدث خطأ · Error saving');
    } finally {
      this.savingAccounts.set(false);
    }
  }

  async loadAll(): Promise<void> {
    if (this.allList().length > 0) return;
    this.loading.set(true);
    try {
      const list = await lastValueFrom(
        this.rest.request<void, PromotionDto[]>({ method: 'GET', url: '/api/app/teacher-promotion/all-list' })
      );
      this.allList.set(list ?? []);
    } catch (e) { console.error(e); }
    finally { this.loading.set(false); }
  }

  async approve(id: string): Promise<void> {
    this.actionLoading.set(true);
    try {
      await lastValueFrom(
        this.rest.request<void, void>({ method: 'POST', url: `/api/app/teacher-promotion/${id}/approve` })
      );
      this.pendingList.update(list => list.filter(p => p.id !== id));
      this.allList.set([]); // Force reload on next tab switch
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
          url: `/api/app/teacher-promotion/${id}/reject`,
          params: reason ? { reason } : undefined,
        })
      );
      this.pendingList.update(list => list.filter(p => p.id !== id));
      this.allList.set([]);
    } catch (e: any) {
      alert(e?.error?.error?.message || 'Error');
    } finally {
      this.actionLoading.set(false);
    }
  }
}
