import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { lastValueFrom } from 'rxjs';

import { StudentEnrollmentSubscriptionService } from '@proxy/students';
import type {
  EnrollmentQuotaStatusDto,
  StudentEnrollmentSubscriptionDto,
} from '@proxy/students/models';
import {
  EnrollmentSubscriptionPaymentMethod,
  EnrollmentSubscriptionPlan,
  StudentEnrollmentSubscriptionStatus,
} from '@proxy/students';
import { PageHeaderComponent } from '../shared/components/page-header.component';

@Component({
  selector: 'app-student-subscription',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, IonicModule, PageHeaderComponent],
  template: `
    <div class="page" dir="rtl">
      <app-page-header
        [title]="'اشتراك المقررات'"
        [titleEn]="'Course Subscription'"></app-page-header>

      @if (loading()) {
        <div class="center"><ion-spinner name="crescent"></ion-spinner></div>
      } @else {

        <!-- ── Quota summary ── -->
        @if (quota(); as q) {
          <div class="quota-card" [class.quota-card--ok]="canEnroll()">
            <div class="quota-ring">
              <span class="quota-used">{{ q.enrolledCourseCount }}</span>
              <span class="quota-of">/ {{ q.freeCourseQuota }}</span>
            </div>
            <div class="quota-text">
              <span class="quota-title">
                {{ q.enrolledCourseCount }} من {{ q.freeCourseQuota }} مقررات مجانية
              </span>
              @if (q.hasActiveSubscription) {
                <span class="quota-sub ok">
                  <i class="fas fa-circle-check"></i>
                  اشتراك نشط حتى {{ q.subscriptionEndDate | date: 'dd/MM/yyyy' }}
                </span>
              } @else if (q.canEnrollFree) {
                <span class="quota-sub">
                  يمكنك التسجيل في {{ q.freeCourseQuota - q.enrolledCourseCount }} مقرر آخر مجاناً
                </span>
              } @else {
                <span class="quota-sub warn">
                  <i class="fas fa-lock"></i>
                  استنفدت المقررات المجانية — اشترك للتسجيل في المزيد
                </span>
              }
            </div>
          </div>
        }

        <!-- ── Pending: show the reference to write on the transfer ── -->
        @if (quota()?.hasPendingSubscription) {
          <div class="pending-card">
            <i class="fas fa-hourglass-half pending-icon"></i>
            <p class="pending-title">طلبك قيد المراجعة</p>
            <p class="pending-desc">
              حوِّل المبلغ ثم اكتب هذا الرقم في ملاحظة التحويل ليتمكن المشرف من مطابقته:
            </p>
            <div class="ref-box">
              <code>{{ quota()!.pendingPaymentReference }}</code>
              <ion-button fill="clear" size="small" (click)="copyRef(quota()!.pendingPaymentReference!)">
                <i class="fas" [class.fa-copy]="!copied()" [class.fa-check]="copied()"></i>
              </ion-button>
            </div>
            <p class="pending-hint">سيتم تفعيل اشتراكك فور تأكيد المشرف للتحويل.</p>
          </div>
        }

        <!-- ── Plan picker (only when there is nothing active or pending) ── -->
        @if (canSubscribe()) {
          <p class="section-label">اختر الخطة · Choose a plan</p>

          <div class="plans">
            <button class="plan"
                    [class.plan--active]="plan() === Plan.Monthly"
                    (click)="plan.set(Plan.Monthly)">
              <span class="plan-name">شهري</span>
              <span class="plan-price">{{ quota()?.monthlyPriceEGP }} <small>ج.م</small></span>
              <span class="plan-note">لكل شهر</span>
            </button>

            <button class="plan"
                    [class.plan--active]="plan() === Plan.Yearly"
                    (click)="plan.set(Plan.Yearly)">
              <span class="plan-badge">وفّر شهرين</span>
              <span class="plan-name">سنوي</span>
              <span class="plan-price">{{ quota()?.yearlyPriceEGP }} <small>ج.م</small></span>
              <span class="plan-note">لمدة 12 شهر</span>
            </button>
          </div>

          <p class="section-label">طريقة الدفع · Payment method</p>
          <div class="methods">
            <button class="method"
                    [class.method--active]="method() === Method.InstaPay"
                    (click)="method.set(Method.InstaPay)">
              <i class="fas fa-building-columns"></i> InstaPay
            </button>
            <button class="method"
                    [class.method--active]="method() === Method.VodafoneCash"
                    (click)="method.set(Method.VodafoneCash)">
              <i class="fas fa-mobile-screen"></i> فودافون كاش
            </button>
          </div>

          <p class="disclaimer">
            <i class="fas fa-circle-info"></i>
            الدفع يتم يدوياً. بعد الطلب ستحصل على رقم مرجعي تكتبه في ملاحظة التحويل،
            ويقوم المشرف بتفعيل الاشتراك بعد التأكد من وصول المبلغ.
          </p>

          <ion-button expand="block" class="submit-btn"
                      (click)="submit()" [disabled]="submitting()">
            @if (submitting()) {
              <ion-spinner name="crescent"></ion-spinner>
            } @else {
              اشترك الآن — {{ selectedPrice() }} ج.م
            }
          </ion-button>
        }

        @if (error()) { <p class="msg msg--err">{{ error() }}</p> }

        <!-- ── History ── -->
        @if (history().length > 0) {
          <p class="section-label">سجل الاشتراكات · History</p>
          @for (s of history(); track s.id) {
            <div class="hist-row">
              <div class="hist-main">
                <span class="hist-plan">{{ s.plan === Plan.Yearly ? 'سنوي' : 'شهري' }}</span>
                <span class="hist-amount">{{ s.amountEGP }} ج.م</span>
              </div>
              <span class="hist-chip" [class]="'hist-chip--' + statusClass(s.status)">
                {{ statusLabel(s.status) }}
              </span>
            </div>
            @if (s.rejectionReason) {
              <p class="hist-reason">{{ s.rejectionReason }}</p>
            }
          }
        }
      }
    </div>
  `,
  styles: [`
    .page { padding: 1rem; padding-bottom: 6rem; background:#f6f7fb; min-height:100%; }
    .center { display:flex; justify-content:center; padding:3rem; }

    .quota-card {
      display:flex; align-items:center; gap:1rem;
      background:#fff; border-radius:16px; padding:1rem;
      box-shadow:0 2px 12px rgba(0,0,0,.05); border:1px solid #eef0f6;
      margin-bottom:1rem;
    }
    .quota-ring {
      flex:0 0 68px; height:68px; border-radius:50%;
      display:flex; align-items:baseline; justify-content:center; gap:.1rem;
      background:linear-gradient(135deg,#667eea,#764ba2); color:#fff;
    }
    .quota-used { font-size:1.5rem; font-weight:800; }
    .quota-of { font-size:.75rem; opacity:.85; }
    .quota-text { display:flex; flex-direction:column; gap:.25rem; min-width:0; }
    .quota-title { font-weight:700; color:#1a1a2e; font-size:.95rem; }
    .quota-sub { font-size:.78rem; color:#6b7280; display:flex; align-items:center; gap:.35rem; }
    .quota-sub.ok   { color:#047857; }
    .quota-sub.warn { color:#b45309; }

    .pending-card {
      background:#fffbeb; border:1px solid #fde68a; border-radius:16px;
      padding:1rem; text-align:center; margin-bottom:1rem;
    }
    .pending-icon { font-size:1.6rem; color:#b45309; }
    .pending-title { font-weight:800; color:#92400e; margin:.5rem 0 .25rem; }
    .pending-desc { font-size:.8rem; color:#92400e; margin:0 0 .6rem; }
    .ref-box {
      display:inline-flex; align-items:center; gap:.25rem;
      background:#fff; border:1px dashed #f59e0b; border-radius:10px;
      padding:.35rem .5rem .35rem .75rem;
    }
    .ref-box code { font-size:1rem; font-weight:800; letter-spacing:.06em; color:#7c2d12; }
    .pending-hint { font-size:.72rem; color:#a16207; margin:.6rem 0 0; }

    .section-label { font-size:.8rem; font-weight:700; color:#4c1d95; margin:1rem 0 .5rem; }

    .plans { display:grid; grid-template-columns:1fr 1fr; gap:.6rem; }
    .plan {
      position:relative; background:#fff; border:2px solid #eef0f6; border-radius:14px;
      padding:.9rem .5rem; display:flex; flex-direction:column; align-items:center; gap:.15rem;
      min-height:96px; cursor:pointer; -webkit-tap-highlight-color:transparent;
    }
    .plan--active { border-color:#7c3aed; box-shadow:0 4px 14px rgba(124,58,237,.18); }
    .plan-name  { font-size:.85rem; font-weight:700; color:#1a1a2e; }
    .plan-price { font-size:1.35rem; font-weight:800; color:#4c1d95; }
    .plan-price small { font-size:.7rem; font-weight:600; }
    .plan-note  { font-size:.68rem; color:#9ca3af; }
    .plan-badge {
      position:absolute; top:-9px; inset-inline-start:50%; transform:translateX(50%);
      background:#059669; color:#fff; font-size:.6rem; font-weight:700;
      padding:.15rem .45rem; border-radius:999px; white-space:nowrap;
    }

    .methods { display:grid; grid-template-columns:1fr 1fr; gap:.6rem; }
    .method {
      background:#fff; border:2px solid #eef0f6; border-radius:12px;
      min-height:48px; font-size:.82rem; font-weight:600; color:#374151;
      display:flex; align-items:center; justify-content:center; gap:.4rem;
      cursor:pointer; -webkit-tap-highlight-color:transparent;
    }
    .method--active { border-color:#7c3aed; color:#4c1d95; }

    .disclaimer {
      font-size:.72rem; color:#6b7280; background:#fff; border-radius:12px;
      padding:.7rem; margin:1rem 0; line-height:1.6;
      display:flex; gap:.4rem; align-items:flex-start;
    }

    ion-button.submit-btn {
      --background:linear-gradient(135deg,#667eea,#764ba2);
      --color:#fff; --border-radius:14px; min-height:50px; font-weight:800;
    }

    .msg { text-align:center; font-size:.8rem; margin-top:.75rem; }
    .msg--err { color:#b91c1c; }

    .hist-row {
      display:flex; align-items:center; justify-content:space-between;
      background:#fff; border:1px solid #eef0f6; border-radius:12px;
      padding:.6rem .75rem; margin-bottom:.4rem;
    }
    .hist-main { display:flex; gap:.6rem; align-items:baseline; }
    .hist-plan { font-weight:700; font-size:.85rem; color:#1a1a2e; }
    .hist-amount { font-size:.78rem; color:#6b7280; }
    .hist-chip { font-size:.68rem; font-weight:700; padding:.25rem .55rem; border-radius:999px; }
    .hist-chip--pending  { background:#fffbeb; color:#92400e; }
    .hist-chip--approved { background:#ecfdf5; color:#047857; }
    .hist-chip--rejected { background:#fef2f2; color:#b91c1c; }
    .hist-chip--expired  { background:#f3f4f6; color:#6b7280; }
    .hist-reason { font-size:.72rem; color:#b91c1c; margin:-.2rem 0 .5rem .5rem; }
  `],
})
export class StudentSubscriptionComponent implements OnInit {
  private readonly svc = inject(StudentEnrollmentSubscriptionService);

  protected readonly Plan = EnrollmentSubscriptionPlan;
  protected readonly Method = EnrollmentSubscriptionPaymentMethod;

  loading = signal(true);
  submitting = signal(false);
  copied = signal(false);
  error = signal<string | null>(null);

  quota = signal<EnrollmentQuotaStatusDto | null>(null);
  history = signal<StudentEnrollmentSubscriptionDto[]>([]);

  plan = signal<EnrollmentSubscriptionPlan>(EnrollmentSubscriptionPlan.Monthly);
  method = signal<EnrollmentSubscriptionPaymentMethod>(EnrollmentSubscriptionPaymentMethod.InstaPay);

  canEnroll = computed(() => {
    const q = this.quota();
    return !!q && (q.canEnrollFree || q.hasActiveSubscription);
  });

  /** Nothing to buy while a subscription is active or a request is awaiting review. */
  canSubscribe = computed(() => {
    const q = this.quota();
    return !!q && !q.hasActiveSubscription && !q.hasPendingSubscription;
  });

  selectedPrice = computed(() => {
    const q = this.quota();
    if (!q) return 0;
    return this.plan() === EnrollmentSubscriptionPlan.Yearly ? q.yearlyPriceEGP : q.monthlyPriceEGP;
  });

  async ngOnInit(): Promise<void> {
    await this.reload();
  }

  private async reload(): Promise<void> {
    this.loading.set(true);
    try {
      const [q, h] = await Promise.all([
        lastValueFrom(this.svc.getMyQuotaStatus()),
        lastValueFrom(this.svc.getMySubscriptions()),
      ]);
      this.quota.set(q);
      this.history.set(h ?? []);
    } catch (e) {
      console.error('Failed to load subscription status', e);
      this.error.set('تعذر تحميل بيانات الاشتراك');
    } finally {
      this.loading.set(false);
    }
  }

  async submit(): Promise<void> {
    this.submitting.set(true);
    this.error.set(null);
    try {
      await lastValueFrom(
        this.svc.request({ plan: this.plan(), paymentMethod: this.method() } as any),
      );
      await this.reload();
    } catch (e: any) {
      this.error.set(e?.error?.error?.message || 'تعذر إرسال الطلب');
    } finally {
      this.submitting.set(false);
    }
  }

  async copyRef(ref: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(ref);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch {
      /* clipboard unavailable in some WebViews — the reference is still visible */
    }
  }

  statusClass(s: StudentEnrollmentSubscriptionStatus): string {
    switch (s) {
      case StudentEnrollmentSubscriptionStatus.Approved: return 'approved';
      case StudentEnrollmentSubscriptionStatus.Rejected: return 'rejected';
      case StudentEnrollmentSubscriptionStatus.Expired: return 'expired';
      default: return 'pending';
    }
  }

  statusLabel(s: StudentEnrollmentSubscriptionStatus): string {
    switch (s) {
      case StudentEnrollmentSubscriptionStatus.Approved: return 'مفعّل';
      case StudentEnrollmentSubscriptionStatus.Rejected: return 'مرفوض';
      case StudentEnrollmentSubscriptionStatus.Expired: return 'منتهي';
      default: return 'قيد المراجعة';
    }
  }
}
