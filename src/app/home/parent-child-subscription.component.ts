import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RestService } from '@abp/ng.core';
import { lastValueFrom } from 'rxjs';
import { PageHeaderComponent } from '../shared/components/page-header.component';

interface ChildSubscriptionDto {
  id: string;
  parentId: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  durationMonths: number;
  amountEGP: number;
  status: number; // 0 Pending, 1 Approved, 2 Rejected, 3 Expired
  isPaid: boolean;
  startDate?: string;
  endDate?: string;
  rejectionReason?: string;
  paymentMethod?: number;
  paymentReference?: string;
  creationTime: string;
}

interface PaymentInfo {
  instaPayAddress: string;
  vodafoneCashNumber: string;
}

const PRICE_PER_MONTH = 10;

@Component({
  selector: 'app-parent-child-subscription',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  template: `
    <div class="page" dir="rtl">
      <app-page-header [title]="'ربط طفل إضافي'" [titleEn]="'Add Another Child'" [backTo]="'/parent'"></app-page-header>

      @if (loading()) {
        <div class="loading-area"><div class="sk-card"></div><div class="sk-card"></div></div>
      }

      @if (!loading()) {
        <!-- Child banner -->
        <div class="section">
          <div class="child-banner">
            <div class="child-avatar">{{ initials() }}</div>
            <div class="child-meta">
              <span class="child-name">{{ studentName() || 'الطفل' }}</span>
              @if (studentCode()) { <span class="child-code">{{ studentCode() }}</span> }
            </div>
          </div>
          <p class="intro">
            <i class="fas fa-info-circle"></i>
            الطفل الأول مجاني. لربط هذا الطفل الإضافي يلزم اشتراك شهري بقيمة {{ pricePerMonth }} ج.م.
            <br><span class="intro-en">The first child is free. Linking this additional child requires a {{ pricePerMonth }} EGP/month subscription.</span>
          </p>
        </div>

        <!-- Active / pending subscription for this child -->
        @if (activeSubscription(); as sub) {
          <div class="section">
            <div class="promo-status-card" [class.promo-active]="sub.status === 1" [class.promo-pending]="sub.status === 0">
              <div class="promo-badge">
                @if (sub.status === 1) { <i class="fas fa-check-circle"></i> اشتراك نشط · Active }
                @else { <i class="fas fa-clock"></i> في انتظار التأكيد · Pending }
              </div>
              <div class="promo-details">
                <div class="promo-row"><i class="fas fa-calendar"></i> {{ sub.durationMonths }} شهر</div>
                <div class="promo-row"><i class="fas fa-coins"></i> {{ sub.amountEGP }} ج.م</div>
                @if (sub.endDate) { <div class="promo-row"><i class="fas fa-stop"></i> حتى {{ sub.endDate | date:'yyyy-MM-dd' }}</div> }
              </div>

              @if (sub.status === 0) {
                <div class="pay-instructions">
                  <div class="pi-title"><i class="fas fa-hand-holding-usd"></i> أكمل الدفع · Complete payment</div>
                  <div class="pi-row"><span>المبلغ · Amount</span><b>{{ sub.amountEGP }} ج.م</b></div>
                  <div class="pi-row"><span>الطريقة · Method</span><b>{{ methodLabel(sub.paymentMethod) }}</b></div>
                  @if (accountForMethod(sub.paymentMethod)) {
                    <div class="pi-row"><span>حوّل إلى · Send to</span><b class="pi-acct">{{ accountForMethod(sub.paymentMethod) }}</b></div>
                  }
                  <div class="pi-ref">
                    <span class="pi-ref-label"><i class="fas fa-receipt"></i> اكتب هذا المرجع في ملاحظة التحويل · Use as transfer note</span>
                    <span class="pi-ref-code">{{ sub.paymentReference }}</span>
                  </div>
                  <p class="pi-hint">سيطابق الأدمن المرجع مع التحويلات الواردة ثم يفعّل اشتراكك.</p>
                </div>
              }

              @if (sub.status === 1) {
                <button class="submit-btn" (click)="goLinkNow()">
                  <i class="fas fa-link"></i> اربط الطفل الآن · Link child now
                </button>
              }
            </div>
          </div>
        }

        <!-- New subscription request -->
        @if (!activeSubscription()) {
          <div class="section">
            <div class="section-title"><i class="fas fa-star"></i> اشتراك جديد · New Subscription</div>

            <div class="duration-card">
              <label>اختر عدد الأشهر · Select Duration (months)</label>
              <div class="duration-selector">
                <button class="dur-btn" (click)="decreaseDuration()" [disabled]="selectedDuration() <= 1"><i class="fas fa-minus"></i></button>
                <span class="dur-value">{{ selectedDuration() }}</span>
                <button class="dur-btn" (click)="increaseDuration()" [disabled]="selectedDuration() >= 12"><i class="fas fa-plus"></i></button>
              </div>
              <div class="total-line">
                <span>الإجمالي · Total:</span>
                <span class="total-amount">{{ calculatedAmount() }} ج.م</span>
                <span class="ppm-note">{{ pricePerMonth }} ج.م / شهر</span>
              </div>
            </div>

            <div class="pay-card">
              <label><i class="fas fa-wallet"></i> طريقة الدفع · Payment Method</label>
              <div class="pay-methods">
                <button type="button" class="pay-opt" [class.pay-sel]="selectedMethod() === 0" (click)="selectedMethod.set(0)">
                  <i class="fas fa-bolt"></i><span class="pay-opt-name">إنستاباي</span><span class="pay-opt-en">InstaPay</span>
                </button>
                <button type="button" class="pay-opt" [class.pay-sel]="selectedMethod() === 1" (click)="selectedMethod.set(1)">
                  <i class="fas fa-mobile-alt"></i><span class="pay-opt-name">فودافون كاش</span><span class="pay-opt-en">Vodafone Cash</span>
                </button>
              </div>
              @if (accountForMethod(selectedMethod())) {
                <div class="pay-acct">
                  <span class="pay-acct-label">حوّل إلى · Send to:</span>
                  <span class="pay-acct-val">{{ accountForMethod(selectedMethod()) }}</span>
                </div>
              }
              <p class="pay-note"><i class="fas fa-receipt"></i> بعد الإرسال ستحصل على رقم مرجعي — اكتبه في ملاحظة التحويل ليتمكن الأدمن من تأكيد دفعتك.</p>
            </div>

            @if (submitError()) { <div class="error-banner"><i class="fas fa-exclamation-triangle"></i> {{ submitError() }}</div> }
            @if (submitSuccess()) { <div class="success-banner"><i class="fas fa-check-circle"></i> تم إرسال طلب الاشتراك! سيتم تأكيده بعد مراجعة الدفع.</div> }

            <button class="submit-btn" [disabled]="submitting() || !studentId()" (click)="submit()">
              @if (submitting()) { <span class="spinner-xs"></span> } @else { <i class="fas fa-paper-plane"></i> }
              إرسال طلب الاشتراك · Submit
            </button>
          </div>
        }
      }

      <div style="height:calc(80px + env(safe-area-inset-bottom,0px))"></div>
    </div>
  `,
  styles: [`
    .page { min-height:100vh; background:#f4f5fb; direction:rtl; }
    .loading-area { padding:1rem; display:flex; flex-direction:column; gap:.5rem; }
    .sk-card { height:80px; border-radius:14px; background:linear-gradient(90deg,#e8e8f0 25%,#f0f0f8 50%,#e8e8f0 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    .section { padding:1rem 1rem 0; }
    .section-title { display:flex; align-items:center; gap:.5rem; font-size:.8rem; font-weight:700; color:#555; text-transform:uppercase; letter-spacing:.05em; margin-bottom:.75rem; }
    .section-title i { color:#667eea; }

    .child-banner { background:#fff; border-radius:14px; border:1.5px solid #e0e0f0; padding:1rem; display:flex; align-items:center; gap:.75rem; }
    .child-avatar { width:52px; height:52px; border-radius:14px; background:linear-gradient(135deg,#667eea,#764ba2); color:#fff; font-weight:800; font-size:1.1rem; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .child-meta { display:flex; flex-direction:column; }
    .child-name { font-size:1rem; font-weight:700; color:#1a1a2e; }
    .child-code { font-size:.78rem; color:#777; font-family:monospace; }
    .intro { font-size:.8rem; color:#555; line-height:1.5; margin:.75rem 0 0; display:flex; flex-direction:column; gap:.2rem; }
    .intro i { color:#667eea; }
    .intro-en { color:#9090aa; font-size:.72rem; }

    .promo-status-card { background:#fff; border-radius:14px; padding:1rem; border:2px solid #e0e0f0; }
    .promo-active { border-color:#10b981; }
    .promo-pending { border-color:#f59e0b; }
    .promo-badge { font-size:.85rem; font-weight:700; margin-bottom:.5rem; display:flex; align-items:center; gap:.4rem; }
    .promo-active .promo-badge { color:#059669; }
    .promo-pending .promo-badge { color:#d97706; }
    .promo-details { display:flex; flex-direction:column; gap:.3rem; }
    .promo-row { font-size:.82rem; color:#555; display:flex; align-items:center; gap:.4rem; }
    .promo-row i { color:#667eea; width:16px; text-align:center; }

    .duration-card { background:#fff; border-radius:14px; border:1.5px solid #e0e0f0; padding:1rem; margin-bottom:.75rem; }
    .duration-card label { font-size:.75rem; font-weight:600; color:#667eea; display:block; margin-bottom:.5rem; }
    .duration-selector { display:flex; align-items:center; justify-content:center; gap:1.5rem; }
    .dur-btn { width:44px; height:44px; border-radius:50%; background:linear-gradient(135deg,#667eea,#764ba2); color:#fff; border:none; font-size:1.1rem; cursor:pointer; display:flex; align-items:center; justify-content:center; }
    .dur-btn:disabled { opacity:.3; cursor:not-allowed; }
    .dur-value { font-size:2rem; font-weight:800; color:#1a1a2e; min-width:48px; text-align:center; }
    .total-line { display:flex; align-items:center; gap:.5rem; margin-top:.75rem; padding-top:.5rem; border-top:1px solid #f0f0f5; font-size:.88rem; font-weight:600; color:#555; }
    .total-amount { font-size:1.1rem; font-weight:800; color:#667eea; }
    .ppm-note { font-size:.68rem; font-weight:700; color:#6b7280; background:rgba(107,114,128,.1); padding:.15rem .4rem; border-radius:8px; }

    .pay-card { background:#fff; border-radius:14px; border:1.5px solid #e0e0f0; padding:1rem; margin-bottom:.75rem; }
    .pay-card > label { font-size:.75rem; font-weight:600; color:#667eea; display:flex; align-items:center; gap:.35rem; margin-bottom:.6rem; }
    .pay-methods { display:grid; grid-template-columns:1fr 1fr; gap:.6rem; }
    .pay-opt { display:flex; flex-direction:column; align-items:center; gap:.2rem; padding:.75rem .5rem; border-radius:12px; cursor:pointer; background:#f7f7fc; border:2px solid #ececf6; color:#555; min-height:72px; transition:all .15s; }
    .pay-opt i { font-size:1.4rem; color:#9aa; }
    .pay-opt-name { font-size:.82rem; font-weight:700; color:#1a1a2e; }
    .pay-opt-en { font-size:.66rem; color:#9090aa; }
    .pay-sel { background:rgba(102,126,234,.08); border-color:#667eea; }
    .pay-sel i { color:#667eea; }
    .pay-acct { margin-top:.7rem; padding:.6rem .75rem; border-radius:10px; background:rgba(16,185,129,.08); border:1px dashed rgba(16,185,129,.35); display:flex; flex-direction:column; gap:.15rem; }
    .pay-acct-label { font-size:.68rem; color:#059669; font-weight:600; }
    .pay-acct-val { font-size:.95rem; font-weight:800; color:#047857; direction:ltr; text-align:right; word-break:break-all; }
    .pay-note { font-size:.72rem; color:#9090aa; margin:.6rem 0 0; display:flex; align-items:flex-start; gap:.35rem; line-height:1.4; }
    .pay-note i { color:#f59e0b; margin-top:2px; }

    .pay-instructions { margin-top:.85rem; padding-top:.75rem; border-top:1px dashed #e6e6f2; display:flex; flex-direction:column; gap:.4rem; }
    .pi-title { font-size:.82rem; font-weight:800; color:#d97706; display:flex; align-items:center; gap:.4rem; }
    .pi-row { display:flex; justify-content:space-between; align-items:center; font-size:.8rem; color:#555; }
    .pi-row b { color:#1a1a2e; font-weight:700; }
    .pi-acct { direction:ltr; word-break:break-all; }
    .pi-ref { margin-top:.35rem; padding:.65rem .75rem; border-radius:12px; background:linear-gradient(135deg,#fff7ed,#fef3c7); border:1.5px solid #fcd34d; display:flex; flex-direction:column; gap:.3rem; align-items:center; text-align:center; }
    .pi-ref-label { font-size:.68rem; color:#b45309; font-weight:700; display:flex; align-items:center; gap:.3rem; }
    .pi-ref-code { font-family:'Courier New', monospace; font-size:1.15rem; font-weight:800; letter-spacing:.06em; color:#92400e; background:#fff; padding:.3rem .9rem; border-radius:8px; border:1px solid #fcd34d; user-select:all; }
    .pi-hint { font-size:.7rem; color:#9090aa; margin:.2rem 0 0; text-align:center; }

    .error-banner { background:rgba(239,68,68,.08); color:#dc2626; border:1px solid rgba(239,68,68,.15); padding:.6rem .85rem; border-radius:10px; font-size:.82rem; font-weight:600; display:flex; align-items:center; gap:.4rem; margin-bottom:.5rem; }
    .success-banner { background:rgba(16,185,129,.08); color:#059669; border:1px solid rgba(16,185,129,.15); padding:.6rem .85rem; border-radius:10px; font-size:.82rem; font-weight:600; display:flex; align-items:center; gap:.4rem; margin-bottom:.5rem; }
    .submit-btn { width:100%; padding:.85rem; border:none; border-radius:12px; background:linear-gradient(135deg,#667eea,#764ba2); color:#fff; font-size:.95rem; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:.5rem; min-height:48px; margin-top:.5rem; }
    .submit-btn:disabled { opacity:.5; cursor:not-allowed; }
    .spinner-xs { width:16px; height:16px; border:2px solid currentColor; border-top-color:transparent; border-radius:50%; animation:spin .7s linear infinite; display:inline-block; }
    @keyframes spin { to { transform:rotate(360deg); } }
  `],
})
export class ParentChildSubscriptionComponent implements OnInit {
  private readonly rest = inject(RestService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly pricePerMonth = PRICE_PER_MONTH;

  loading = signal(true);
  submitting = signal(false);
  submitError = signal<string | null>(null);
  submitSuccess = signal(false);
  selectedDuration = signal(1);
  selectedMethod = signal(0);

  studentId = signal('');
  studentName = signal('');
  studentCode = signal('');
  mySubscriptions = signal<ChildSubscriptionDto[]>([]);
  paymentInfo = signal<PaymentInfo | null>(null);

  readonly calculatedAmount = computed(() => this.selectedDuration() * PRICE_PER_MONTH);

  readonly activeSubscription = computed(() =>
    this.mySubscriptions().find(s =>
      s.studentId === this.studentId() &&
      (s.status === 0 || (s.status === 1 && s.endDate && new Date(s.endDate) > new Date()))
    ) ?? null);

  initials = computed(() => {
    const name = this.studentName().trim();
    if (!name) return '?';
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0]?.[0]?.toUpperCase() || '?';
  });

  methodLabel(m: number | undefined): string {
    return m === 1 ? 'فودافون كاش · Vodafone Cash' : 'إنستاباي · InstaPay';
  }

  accountForMethod(m: number | undefined): string {
    const info = this.paymentInfo();
    if (!info) return '';
    return m === 1 ? info.vodafoneCashNumber : info.instaPayAddress;
  }

  async ngOnInit(): Promise<void> {
    const qp = this.route.snapshot.queryParamMap;
    this.studentId.set(qp.get('studentId') ?? '');
    this.studentName.set(qp.get('studentName') ?? '');
    this.studentCode.set(qp.get('studentCode') ?? '');

    try {
      const [subs, payInfo] = await Promise.all([
        lastValueFrom(this.rest.request<void, ChildSubscriptionDto[]>({ method: 'GET', url: '/api/app/parent-child-subscription/my-subscriptions' })),
        lastValueFrom(this.rest.request<void, PaymentInfo>({ method: 'GET', url: '/api/app/parent-child-subscription/payment-info' })).catch(() => null),
      ]);
      this.mySubscriptions.set(subs ?? []);
      this.paymentInfo.set(payInfo ?? null);
    } catch (e) { console.error(e); }
    finally { this.loading.set(false); }
  }

  increaseDuration(): void { if (this.selectedDuration() < 12) this.selectedDuration.update(v => v + 1); }
  decreaseDuration(): void { if (this.selectedDuration() > 1) this.selectedDuration.update(v => v - 1); }

  async submit(): Promise<void> {
    if (!this.studentId()) return;
    this.submitting.set(true);
    this.submitError.set(null);
    this.submitSuccess.set(false);
    try {
      await lastValueFrom(this.rest.request<any, ChildSubscriptionDto>({
        method: 'POST',
        url: '/api/app/parent-child-subscription',
        body: {
          studentId: this.studentId(),
          durationMonths: this.selectedDuration(),
          paymentMethod: this.selectedMethod(),
        },
      }));
      this.submitSuccess.set(true);
      const subs = await lastValueFrom(
        this.rest.request<void, ChildSubscriptionDto[]>({ method: 'GET', url: '/api/app/parent-child-subscription/my-subscriptions' })
      );
      this.mySubscriptions.set(subs ?? []);
    } catch (e: any) {
      this.submitError.set(e?.error?.error?.message || 'حدث خطأ · An error occurred');
    } finally {
      this.submitting.set(false);
    }
  }

  goLinkNow(): void {
    this.router.navigate(['/parent/link-child'], {
      queryParams: this.studentCode() ? { code: this.studentCode() } : {},
    });
  }
}
