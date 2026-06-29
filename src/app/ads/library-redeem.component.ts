import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { environment } from '../../environments/environment';
import { PageHeaderComponent } from '../shared/components/page-header.component';

interface CouponDto {
  id: string;
  couponCode: string;
  studentName: string;
  courseName: string;
  teacherName: string;
  discountPercent: number;
  dealDescription?: string;
  advertiserName?: string;
  status: number;
  expiryDate?: string;
}

interface RedemptionDto {
  id: string;
  couponCode: string;
  studentName: string;
  advertiserName?: string;
  discountPercent: number;
  originalAmount?: number;
  discountAmount?: number;
  finalAmount?: number;
  notes?: string;
  creationTime: string;
}

@Component({
  selector: 'app-library-redeem',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  template: `
    <div class="page" dir="rtl">
      <app-page-header
        [title]="'استبدال'"
        [titleEn]="'Redeem'"></app-page-header>

      <!-- Redeem Section -->
      <div class="section">
        <div class="section-title"><i class="fas fa-qrcode"></i> استبدال كوبون · Redeem</div>
        <div class="card">
          <div class="code-input-row">
            <input class="code-input" [(ngModel)]="couponCode" placeholder="KAI-XXXXXXXX"
                   dir="ltr" maxlength="12" (keyup.enter)="lookupCoupon()" />
            <button class="btn-lookup" (click)="lookupCoupon()" [disabled]="!couponCode || lookingUp()">
              @if (lookingUp()) { <i class="fas fa-spinner fa-spin"></i> }
              @else { <i class="fas fa-search"></i> }
            </button>
          </div>

          @if (lookupError()) {
            <div class="msg msg--error"><i class="fas fa-exclamation-circle"></i> {{ lookupError() }}</div>
          }

          @if (foundCoupon()) {
            <div class="coupon-preview">
              <div class="preview-header">
                <div class="preview-discount">{{ foundCoupon()!.discountPercent }}% خصم</div>
                <div class="preview-status" [class]="foundCoupon()!.status === 0 ? 'preview-status--active' : 'preview-status--used'">
                  {{ foundCoupon()!.status === 0 ? 'فعّال' : 'مستخدم' }}
                </div>
              </div>
              <div class="preview-details">
                <div class="preview-row"><span class="preview-key">الطالب</span><span class="preview-val">{{ foundCoupon()!.studentName }}</span></div>
                <div class="preview-row"><span class="preview-key">المقرر</span><span class="preview-val">{{ foundCoupon()!.courseName }}</span></div>
                <div class="preview-row"><span class="preview-key">المعلم</span><span class="preview-val">{{ foundCoupon()!.teacherName }}</span></div>
              </div>

              @if (foundCoupon()!.status === 0) {
                <div class="redeem-form">
                  <div class="amount-row">
                    <div class="amount-field">
                      <label>المبلغ الأصلي</label>
                      <input class="field-input" type="number" [(ngModel)]="originalAmount" placeholder="0.00" dir="ltr" />
                    </div>
                    <div class="amount-field">
                      <label>الخصم</label>
                      <input class="field-input" type="number" [(ngModel)]="discountAmount" placeholder="0.00" dir="ltr" />
                    </div>
                    <div class="amount-field">
                      <label>المبلغ النهائي</label>
                      <input class="field-input" type="number" [(ngModel)]="finalAmount" placeholder="0.00" dir="ltr" />
                    </div>
                  </div>
                  <input class="field-input" [(ngModel)]="notes" placeholder="ملاحظات · Notes" />
                  <button class="btn-redeem" (click)="redeem()" [disabled]="redeeming()">
                    @if (redeeming()) { <i class="fas fa-spinner fa-spin"></i> }
                    @else { <i class="fas fa-check-circle"></i> }
                    تأكيد الاستبدال · Confirm Redemption
                  </button>
                </div>
              }
            </div>
          }

          @if (redeemSuccess()) {
            <div class="msg msg--success"><i class="fas fa-check-circle"></i> {{ redeemSuccess() }}</div>
          }
        </div>
      </div>

      <!-- Redemption History -->
      <div class="section">
        <div class="section-title"><i class="fas fa-history"></i> سجل الاستبدال · History</div>
        @if (redemptions().length === 0) {
          <div class="empty-msg">
            <i class="fas fa-receipt"></i>
            <span>لا توجد عمليات استبدال · No redemptions yet</span>
          </div>
        }
        <div class="history-list">
          @for (r of redemptions(); track r.id) {
            <div class="history-card">
              <div class="history-header">
                <span class="history-code">{{ r.couponCode }}</span>
                <span class="history-date">{{ formatDate(r.creationTime) }}</span>
              </div>
              <div class="history-body">
                <span class="history-student"><i class="fas fa-user-graduate"></i> {{ r.studentName }}</span>
                <span class="history-discount">{{ r.discountPercent }}% خصم</span>
              </div>
              @if (r.originalAmount || r.discountAmount || r.finalAmount) {
                <div class="history-amounts">
                  @if (r.originalAmount) { <span>الأصلي: {{ r.originalAmount }}</span> }
                  @if (r.discountAmount) { <span class="amt-discount">الخصم: {{ r.discountAmount }}</span> }
                  @if (r.finalAmount) { <span class="amt-final">النهائي: {{ r.finalAmount }}</span> }
                </div>
              }
            </div>
          }
        </div>
      </div>

      <div style="height:calc(80px + env(safe-area-inset-bottom,0px))"></div>
    </div>
  `,
  styles: [`
    .page { min-height:100vh; background:#f4f5fb; }

    .section { padding:1rem 1rem 0; }
    .section-title {
      display:flex; align-items:center; gap:.5rem; font-size:.8rem; font-weight:700;
      color:#555; text-transform:uppercase; letter-spacing:.05em; margin-bottom:.75rem;
    }
    .section-title i { color:#667eea; }

    .card {
      background:#fff; border-radius:16px; border:1.5px solid #f0f0f0;
      padding:1rem; box-shadow:0 2px 8px rgba(0,0,0,.04);
      display:flex; flex-direction:column; gap:.75rem;
    }

    .code-input-row { display:flex; gap:.5rem; }
    .code-input {
      flex:1; padding:.75rem 1rem; border-radius:12px; border:2px dashed rgba(102,126,234,.3);
      font-size:1.1rem; font-weight:700; color:#667eea; text-align:center;
      letter-spacing:2px; font-family:monospace; background:#fafaff;
      outline:none;
    }
    .code-input:focus { border-color:#667eea; }
    .btn-lookup {
      width:52px; height:52px; border-radius:12px; border:none; flex-shrink:0;
      background:linear-gradient(135deg,#667eea,#764ba2);
      color:#fff; font-size:1.1rem; cursor:pointer;
      display:flex; align-items:center; justify-content:center;
    }
    .btn-lookup:disabled { opacity:.5; }

    .msg { padding:.65rem .875rem; border-radius:10px; font-size:.82rem; font-weight:600; display:flex; align-items:center; gap:.35rem; }
    .msg--error { background:rgba(239,68,68,.08); color:#dc2626; }
    .msg--success { background:rgba(16,185,129,.08); color:#059669; }

    .coupon-preview {
      background:#fafaff; border:1.5px solid rgba(102,126,234,.15);
      border-radius:14px; overflow:hidden;
    }
    .preview-header {
      display:flex; justify-content:space-between; align-items:center;
      padding:.75rem 1rem; background:linear-gradient(135deg,rgba(102,126,234,.06),rgba(118,75,162,.06));
    }
    .preview-discount { font-size:1rem; font-weight:800; color:#667eea; }
    .preview-status { font-size:.72rem; font-weight:700; padding:.2rem .5rem; border-radius:8px; }
    .preview-status--active { background:rgba(16,185,129,.1); color:#059669; }
    .preview-status--used { background:rgba(156,163,175,.1); color:#9ca3af; }

    .preview-details { padding:.75rem 1rem; }
    .preview-row { display:flex; justify-content:space-between; padding:.25rem 0; font-size:.82rem; }
    .preview-key { color:#9090aa; }
    .preview-val { font-weight:600; color:#1a1a2e; }

    .redeem-form { padding:.75rem 1rem 1rem; display:flex; flex-direction:column; gap:.5rem; border-top:1px solid #f0f0f0; }
    .amount-row { display:flex; gap:.5rem; }
    .amount-field { flex:1; display:flex; flex-direction:column; gap:.2rem; }
    .amount-field label { font-size:.68rem; color:#9090aa; }
    .field-input {
      width:100%; padding:.6rem .75rem; border-radius:10px; border:1.5px solid #e5e7eb;
      font-size:.85rem; box-sizing:border-box; outline:none;
    }
    .field-input:focus { border-color:#667eea; }

    .btn-redeem {
      width:100%; padding:.75rem; border-radius:12px; border:none;
      background:linear-gradient(135deg,#059669,#047857);
      color:#fff; font-size:.88rem; font-weight:700; cursor:pointer;
      display:flex; align-items:center; justify-content:center; gap:.35rem;
      min-height:48px;
    }
    .btn-redeem:disabled { opacity:.5; }

    .empty-msg {
      text-align:center; padding:1.5rem; color:#9090aa; font-size:.82rem;
      display:flex; flex-direction:column; align-items:center; gap:.5rem;
    }
    .empty-msg i { font-size:1.5rem; color:#c4c4d4; }

    .history-list { display:flex; flex-direction:column; gap:.5rem; }
    .history-card {
      background:#fff; border-radius:12px; border:1.5px solid #f0f0f0;
      padding:.75rem; box-shadow:0 1px 4px rgba(0,0,0,.03);
    }
    .history-header { display:flex; justify-content:space-between; margin-bottom:.35rem; }
    .history-code { font-size:.82rem; font-weight:700; color:#667eea; font-family:monospace; letter-spacing:1px; }
    .history-date { font-size:.7rem; color:#9090aa; }
    .history-body { display:flex; justify-content:space-between; font-size:.78rem; }
    .history-student { color:#555; display:flex; align-items:center; gap:.25rem; }
    .history-discount { font-weight:700; color:#059669; }
    .history-amounts {
      display:flex; gap:.75rem; margin-top:.35rem; padding-top:.35rem;
      border-top:1px solid #f8f8fc; font-size:.72rem; color:#9090aa;
    }
    .amt-discount { color:#dc2626; }
    .amt-final { color:#059669; font-weight:700; }
  `],
})
export class LibraryRedeemComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly apiBase = environment.apis?.default?.url || '';

  couponCode = '';
  lookingUp = signal(false);
  lookupError = signal('');
  foundCoupon = signal<CouponDto | null>(null);
  redeeming = signal(false);
  redeemSuccess = signal('');
  redemptions = signal<RedemptionDto[]>([]);

  originalAmount: number | null = null;
  discountAmount: number | null = null;
  finalAmount: number | null = null;
  notes = '';

  async ngOnInit(): Promise<void> {
    await this.loadRedemptions();
  }

  async lookupCoupon(): Promise<void> {
    if (!this.couponCode) return;
    this.lookingUp.set(true);
    this.lookupError.set('');
    this.foundCoupon.set(null);
    this.redeemSuccess.set('');
    try {
      const res = await this.http.get<CouponDto>(
        `${this.apiBase}/api/app/deal-coupon/coupon-by-code?code=${this.couponCode.trim()}`
      ).toPromise();
      if (res) {
        this.foundCoupon.set(res);
      } else {
        this.lookupError.set('الكوبون غير موجود · Coupon not found');
      }
    } catch (e: any) {
      this.lookupError.set(e?.error?.error?.message || 'الكوبون غير موجود · Coupon not found');
    } finally {
      this.lookingUp.set(false);
    }
  }

  async redeem(): Promise<void> {
    this.redeeming.set(true);
    try {
      await this.http.post(`${this.apiBase}/api/app/deal-coupon/redeem-coupon`, {
        couponCode: this.couponCode.trim(),
        originalAmount: this.originalAmount,
        discountAmount: this.discountAmount,
        finalAmount: this.finalAmount,
        notes: this.notes
      }).toPromise();
      this.redeemSuccess.set('تم استبدال الكوبون بنجاح · Coupon redeemed successfully');
      this.foundCoupon.set(null);
      this.couponCode = '';
      this.originalAmount = null;
      this.discountAmount = null;
      this.finalAmount = null;
      this.notes = '';
      await this.loadRedemptions();
    } catch (e: any) {
      this.lookupError.set(e?.error?.error?.message || 'فشل الاستبدال · Redemption failed');
    } finally {
      this.redeeming.set(false);
    }
  }

  async loadRedemptions(): Promise<void> {
    try {
      const res = await this.http.get<RedemptionDto[]>(
        `${this.apiBase}/api/app/deal-coupon/my-redemptions`
      ).toPromise();
      this.redemptions.set(res ?? []);
    } catch (e) { console.error(e); }
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('ar-SA');
  }
}
