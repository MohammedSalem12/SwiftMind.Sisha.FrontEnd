import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { DealCouponService } from '@proxy/advertisements';

@Component({
  selector: 'app-partner-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page" dir="rtl">
      <div class="page-header">
        <h1><i class="fas fa-store"></i> لوحة الشريك · Partner Dashboard</h1>
      </div>

      <div class="page-body">
        <!-- Scan / Verify Section -->
        <div class="section-card">
          <div class="section-title"><i class="fas fa-qrcode"></i> تحقق من قسيمة · Verify Voucher</div>
          <div class="scan-row">
            <input type="text" [(ngModel)]="codeInput" placeholder="أدخل كود القسيمة · Enter voucher code"
                   class="code-input" maxlength="12" />
            <button class="verify-btn" (click)="verifyCode()" [disabled]="verifying()">
              @if (verifying()) { <div class="spinner-sm"></div> }
              @else { <i class="fas fa-search"></i> }
              تحقق
            </button>
          </div>

          @if (verifiedVoucher()) {
            <div class="voucher-result">
              <div class="voucher-row"><span class="lbl">الطالب</span><span class="val">{{ verifiedVoucher()!.studentName }}</span></div>
              <div class="voucher-row"><span class="lbl">المبلغ</span><span class="val amount">{{ verifiedVoucher()!.amountEgp }} جنيه</span></div>
              <div class="voucher-row"><span class="lbl">الكود</span><span class="val mono">{{ verifiedVoucher()!.couponCode }}</span></div>
              <div class="voucher-row"><span class="lbl">الصلاحية</span><span class="val">{{ verifiedVoucher()!.expiryDate | date:'yyyy-MM-dd' }}</span></div>
              <button class="accept-btn" (click)="acceptVoucher()" [disabled]="accepting()">
                @if (accepting()) { <div class="spinner-sm"></div> }
                @else { <i class="fas fa-check"></i> }
                قبول القسيمة · Accept Voucher
              </button>
            </div>
          }

          @if (verifyError()) {
            <div class="error-msg"><i class="fas fa-exclamation-circle"></i> {{ verifyError() }}</div>
          }

          @if (acceptSuccess()) {
            <div class="success-msg"><i class="fas fa-check-circle"></i> تم قبول القسيمة بنجاح! · Voucher accepted!</div>
          }
        </div>

        <!-- Pending Vouchers -->
        <div class="section-card">
          <div class="section-title"><i class="fas fa-clock"></i> قسائم معلقة · Pending Vouchers <span class="badge">{{ pending().length }}</span></div>
          @if (loading()) {
            <div class="loading-state"><div class="spinner"></div></div>
          } @else if (pending().length === 0) {
            <p class="empty-hint">لا توجد قسائم معلقة · No pending vouchers</p>
          } @else {
            @for (v of pending(); track v.id) {
              <div class="voucher-card">
                <div class="vc-info">
                  <span class="vc-name">{{ v.studentName }}</span>
                  <span class="vc-code">{{ v.couponCode }}</span>
                </div>
                <span class="vc-amount">{{ v.amountEgp }} EGP</span>
              </div>
            }
          }
        </div>

        <!-- Monthly Summary -->
        <div class="section-card">
          <div class="section-title"><i class="fas fa-chart-bar"></i> ملخص الشهر · Monthly Summary</div>
          <div class="summary-grid">
            <div class="summary-item">
              <span class="s-num">{{ monthlyTotal() }}</span>
              <span class="s-lbl">إجمالي جنيه · Total EGP</span>
            </div>
            <div class="summary-item">
              <span class="s-num">{{ monthlyRedeemed() }}</span>
              <span class="s-lbl">مستخدمة · Redeemed</span>
            </div>
            <div class="summary-item">
              <span class="s-num">{{ pending().length }}</span>
              <span class="s-lbl">معلقة · Pending</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { min-height: 100vh; background: #f5f5f7; }
    .page-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white; padding: 20px 16px 16px;
    }
    .page-header h1 { font-size: 18px; margin: 0; font-weight: 600; display: flex; align-items: center; gap: 8px; }
    .page-body { padding: 16px; }
    .section-card {
      background: white; border-radius: 16px; padding: 16px;
      box-shadow: 0 1px 4px rgba(0,0,0,.06); margin-bottom: 12px;
    }
    .section-title {
      font-size: 15px; font-weight: 700; color: #333; margin-bottom: 12px;
      display: flex; align-items: center; gap: 8px;
      i { color: #667eea; }
    }
    .badge {
      background: rgba(102,126,234,.12); color: #667eea;
      font-size: 12px; padding: 2px 8px; border-radius: 10px;
    }
    .scan-row { display: flex; gap: 8px; margin-bottom: 12px; }
    .code-input {
      flex: 1; padding: 12px; border: 1px solid #e0e0e0; border-radius: 10px;
      font-size: 16px; font-family: monospace; letter-spacing: 2px; text-transform: uppercase;
    }
    .verify-btn {
      padding: 12px 20px; border: none; border-radius: 10px;
      background: linear-gradient(135deg, #667eea, #764ba2); color: white;
      font-weight: 700; cursor: pointer; min-width: 80px; min-height: 44px;
      display: flex; align-items: center; gap: 6px; justify-content: center;
    }
    .voucher-result {
      background: #f0fdf4; border-radius: 12px; padding: 14px; margin-bottom: 10px;
    }
    .voucher-row { display: flex; justify-content: space-between; padding: 4px 0; }
    .lbl { font-size: 13px; color: #666; }
    .val { font-size: 14px; font-weight: 600; color: #1a1a2e; }
    .val.amount { color: #059669; font-size: 18px; }
    .val.mono { font-family: monospace; letter-spacing: 2px; color: #667eea; }
    .accept-btn {
      width: 100%; margin-top: 10px; padding: 12px; border: none; border-radius: 12px;
      background: linear-gradient(135deg, #10b981, #059669); color: white;
      font-size: 15px; font-weight: 700; cursor: pointer; min-height: 48px;
      display: flex; align-items: center; justify-content: center; gap: 8px;
    }
    .error-msg {
      background: rgba(239,68,68,.08); color: #dc2626; padding: 10px; border-radius: 10px;
      font-size: 13px; display: flex; align-items: center; gap: 6px;
    }
    .success-msg {
      background: rgba(16,185,129,.08); color: #059669; padding: 10px; border-radius: 10px;
      font-size: 13px; display: flex; align-items: center; gap: 6px;
    }
    .empty-hint { font-size: 13px; color: #999; text-align: center; padding: 16px 0; }
    .voucher-card {
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 0; border-bottom: 1px solid #f0f0f5;
    }
    .vc-info { display: flex; flex-direction: column; gap: 2px; }
    .vc-name { font-size: 14px; font-weight: 600; color: #1a1a2e; }
    .vc-code { font-size: 12px; font-family: monospace; color: #667eea; }
    .vc-amount { font-size: 16px; font-weight: 800; color: #059669; }
    .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    .summary-item { text-align: center; padding: 12px 0; }
    .s-num { display: block; font-size: 22px; font-weight: 800; color: #667eea; }
    .s-lbl { font-size: 11px; color: #888; }
    .loading-state { text-align: center; padding: 20px; }
    .spinner {
      width: 30px; height: 30px; border: 3px solid #e0e0e0;
      border-top-color: #667eea; border-radius: 50%;
      animation: spin .8s linear infinite; margin: 0 auto;
    }
    .spinner-sm {
      width: 16px; height: 16px; border: 2px solid rgba(255,255,255,.3);
      border-top-color: white; border-radius: 50%; animation: spin .7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class PartnerDashboardComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly couponService = inject(DealCouponService);

  loading = signal(false);
  pending = signal<any[]>([]);
  codeInput = '';
  verifying = signal(false);
  verifiedVoucher = signal<any>(null);
  verifyError = signal<string | null>(null);
  accepting = signal(false);
  acceptSuccess = signal(false);
  monthlyTotal = signal(0);
  monthlyRedeemed = signal(0);

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    try {
      const vouchers = await lastValueFrom(this.couponService.getPartnerPendingVouchers());
      this.pending.set(vouchers ?? []);
      this.monthlyTotal.set((vouchers ?? []).reduce((sum: number, v: any) => sum + (v.amountEgp ?? 0), 0));
    } catch (e) {
      console.error('Error loading partner data:', e);
    } finally {
      this.loading.set(false);
    }
  }

  async verifyCode(): Promise<void> {
    if (!this.codeInput.trim()) return;
    this.verifying.set(true);
    this.verifyError.set(null);
    this.verifiedVoucher.set(null);
    this.acceptSuccess.set(false);
    try {
      const voucher = await lastValueFrom(this.couponService.getCouponByCode(this.codeInput.trim().toUpperCase()));
      if (!voucher) {
        this.verifyError.set('كود غير صالح · Invalid code');
      } else if ((voucher as any).status !== 0) {
        this.verifyError.set('القسيمة مستخدمة أو منتهية · Voucher already used or expired');
      } else {
        this.verifiedVoucher.set(voucher);
      }
    } catch {
      this.verifyError.set('كود غير صالح · Invalid code');
    } finally {
      this.verifying.set(false);
    }
  }

  async acceptVoucher(): Promise<void> {
    const v = this.verifiedVoucher();
    if (!v) return;
    this.accepting.set(true);
    try {
      await lastValueFrom(this.couponService.redeemCoupon({
        couponCode: v.couponCode,
        originalAmount: v.amountEgp,
        discountAmount: v.amountEgp,
        finalAmount: 0,
      }));
      this.acceptSuccess.set(true);
      this.verifiedVoucher.set(null);
      this.codeInput = '';
      await this.ngOnInit(); // refresh
    } catch (e: any) {
      this.verifyError.set(e?.error?.error?.message || 'حدث خطأ');
    } finally {
      this.accepting.set(false);
    }
  }
}
