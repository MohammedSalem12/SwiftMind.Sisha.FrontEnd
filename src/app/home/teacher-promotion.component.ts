import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RestService } from '@abp/ng.core';
import { lastValueFrom } from 'rxjs';
import { CurrentUserInfoService } from '@proxy/common';
import { EGYPT_GOVERNORATES_LIST, getDistricts } from '../shared/constants/egypt-districts';
import { PageHeaderComponent } from '../shared/components/page-header.component';

interface PricingTier {
  durationMonths: number;
  amountEGP: number;
  discountPercent: number;
  pricePerMonth: number;
}

interface PromotionDto {
  id: string;
  teacherId: string;
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
}

@Component({
  selector: 'app-teacher-promotion',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  template: `
    <div class="page" dir="rtl">

      <!-- Header -->
      <app-page-header [title]="'طلبات الترقية'" [titleEn]="'Promotion'" [backTo]="'/teacher'"></app-page-header>

      @if (loading()) {
        <div class="loading-area">
          <div class="sk-card"></div><div class="sk-card"></div>
        </div>
      }

      @if (!loading()) {

        <!-- Active / Pending Promotion -->
        @if (activePromotion()) {
          <div class="section">
            <div class="promo-status-card" [class.promo-active]="activePromotion()!.status === 1" [class.promo-pending]="activePromotion()!.status === 0">
              <div class="promo-badge">
                @if (activePromotion()!.status === 1) {
                  <i class="fas fa-crown"></i> ترويج نشط · Active
                } @else {
                  <i class="fas fa-clock"></i> في انتظار الموافقة · Pending
                }
              </div>
              <div class="promo-details">
                <div class="promo-row"><i class="fas fa-calendar"></i> {{ activePromotion()!.durationMonths }} شهر</div>
                <div class="promo-row"><i class="fas fa-coins"></i> {{ activePromotion()!.amountEGP }} ج.م</div>
                <div class="promo-row"><i class="fas fa-map-marker-alt"></i> {{ activePromotion()!.government }} — {{ activePromotion()!.town }}</div>
                @if (activePromotion()!.startDate) {
                  <div class="promo-row"><i class="fas fa-play"></i> من {{ activePromotion()!.startDate | date:'yyyy-MM-dd' }}</div>
                }
                @if (activePromotion()!.endDate) {
                  <div class="promo-row"><i class="fas fa-stop"></i> حتى {{ activePromotion()!.endDate | date:'yyyy-MM-dd' }}</div>
                }
              </div>
            </div>
          </div>
        }

        <!-- New Promotion Request (only if no active/pending) -->
        @if (!activePromotion()) {
          <div class="section">
            <div class="section-title"><i class="fas fa-star"></i> طلب ترويج جديد · New Promotion</div>

            <!-- Pricing table -->
            <div class="pricing-table">
              <div class="pricing-header">
                <span>المدة</span><span>السعر</span><span>السعر/شهر</span><span>خصم</span>
              </div>
              @for (tier of highlightedTiers; track tier.durationMonths) {
                <div class="pricing-row" [class.pricing-selected]="selectedDuration() === tier.durationMonths"
                     (click)="selectedDuration.set(tier.durationMonths)">
                  <span class="dur">{{ tier.durationMonths }} شهر</span>
                  <span class="price">{{ tier.amountEGP }} ج.م</span>
                  <span class="ppm">{{ tier.pricePerMonth }} ج.م</span>
                  <span class="disc">
                    @if (tier.discountPercent > 0) {
                      <span class="disc-badge">{{ tier.discountPercent }}%</span>
                    } @else { — }
                  </span>
                </div>
              }
            </div>

            <!-- Custom duration -->
            <div class="duration-card">
              <label>اختر المدة بالأشهر · Select Duration (months)</label>
              <div class="duration-selector">
                <button class="dur-btn" (click)="decreaseDuration()" [disabled]="selectedDuration() <= 1">
                  <i class="fas fa-minus"></i>
                </button>
                <span class="dur-value">{{ selectedDuration() }}</span>
                <button class="dur-btn" (click)="increaseDuration()" [disabled]="selectedDuration() >= 24">
                  <i class="fas fa-plus"></i>
                </button>
              </div>
              <div class="total-line">
                <span>الإجمالي · Total:</span>
                <span class="total-amount">{{ calculatedAmount() }} ج.م</span>
                @if (selectedDuration() >= 3) {
                  <span class="discount-note">خصم 10% · 10% discount</span>
                }
              </div>
            </div>

            <!-- Location scope -->
            <div class="loc-card">
              <label><i class="fas fa-map-marker-alt"></i> نطاق الترويج · Promotion Scope</label>
              <p class="loc-hint">سيظهر اسمك أعلى نتائج البحث في نفس المحافظة والمركز</p>
              <div class="loc-vals">
                @if (teacherGov()) {
                  <span class="loc-chip"><i class="fas fa-map"></i> {{ teacherGov() }}</span>
                }
                @if (teacherTown()) {
                  <span class="loc-chip"><i class="fas fa-city"></i> {{ teacherTown() }}</span>
                }
                @if (!teacherGov()) {
                  <span class="loc-warn"><i class="fas fa-exclamation-triangle"></i> يجب تحديد موقعك أولاً من صفحة الملف الشخصي</span>
                }
              </div>
            </div>

            <!-- Submit -->
            @if (submitError()) {
              <div class="error-banner"><i class="fas fa-exclamation-triangle"></i> {{ submitError() }}</div>
            }
            @if (submitSuccess()) {
              <div class="success-banner"><i class="fas fa-check-circle"></i> تم إرسال طلب الترويج بنجاح! سيتم مراجعته من الإدارة.</div>
            }
            <button class="submit-btn" [disabled]="submitting() || !teacherGov()" (click)="submitPromotion()">
              @if (submitting()) { <span class="spinner-xs"></span> }
              @else { <i class="fas fa-paper-plane"></i> }
              إرسال طلب الترويج · Submit Promotion Request
            </button>
          </div>
        }

        <!-- Past Promotions -->
        @if (pastPromotions().length > 0) {
          <div class="section">
            <div class="section-title"><i class="fas fa-history"></i> السجل · History</div>
            @for (p of pastPromotions(); track p.id) {
              <div class="history-card">
                <div class="hist-top">
                  <span class="hist-dur">{{ p.durationMonths }} شهر — {{ p.amountEGP }} ج.م</span>
                  <span class="hist-status" [class]="'st-' + p.status">{{ statusLabel(p.status) }}</span>
                </div>
                <div class="hist-loc"><i class="fas fa-map-marker-alt"></i> {{ p.government }} — {{ p.town }}</div>
                @if (p.rejectionReason) {
                  <div class="hist-reason"><i class="fas fa-times-circle"></i> {{ p.rejectionReason }}</div>
                }
                <div class="hist-date">{{ p.creationTime | date:'yyyy-MM-dd' }}</div>
              </div>
            }
          </div>
        }

      }

      <div style="height:calc(80px + env(safe-area-inset-bottom,0px))"></div>
    </div>
  `,
  styles: [`
    .page { min-height:100vh; background:#f4f5fb; direction:rtl; }

    .loading-area { padding:1rem; display:flex; flex-direction:column; gap:.5rem; }
    .sk-card {
      height:80px; border-radius:14px;
      background:linear-gradient(90deg,#e8e8f0 25%,#f0f0f8 50%,#e8e8f0 75%);
      background-size:200% 100%; animation:shimmer 1.4s infinite;
    }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    .section { padding:1rem 1rem 0; }
    .section-title {
      display:flex; align-items:center; gap:.5rem;
      font-size:.8rem; font-weight:700; color:#555; text-transform:uppercase;
      letter-spacing:.05em; margin-bottom:.75rem;
    }
    .section-title i { color:#667eea; }

    .promo-status-card {
      background:#fff; border-radius:14px; padding:1rem;
      border:2px solid #e0e0f0;
    }
    .promo-active { border-color:#10b981; }
    .promo-pending { border-color:#f59e0b; }
    .promo-badge {
      font-size:.85rem; font-weight:700; margin-bottom:.5rem;
      display:flex; align-items:center; gap:.4rem;
    }
    .promo-active .promo-badge { color:#059669; }
    .promo-pending .promo-badge { color:#d97706; }
    .promo-details { display:flex; flex-direction:column; gap:.3rem; }
    .promo-row { font-size:.82rem; color:#555; display:flex; align-items:center; gap:.4rem; }
    .promo-row i { color:#667eea; width:16px; text-align:center; }

    .pricing-table {
      background:#fff; border-radius:14px; border:1.5px solid #e0e0f0;
      overflow:hidden; margin-bottom:.75rem;
    }
    .pricing-header {
      display:grid; grid-template-columns:1fr 1fr 1fr .8fr;
      padding:.6rem .75rem; background:linear-gradient(135deg,#667eea,#764ba2);
      font-size:.7rem; font-weight:700; color:#fff;
    }
    .pricing-row {
      display:grid; grid-template-columns:1fr 1fr 1fr .8fr;
      padding:.65rem .75rem; border-bottom:1px solid #f0f0f5;
      font-size:.82rem; cursor:pointer; transition:background .15s;
    }
    .pricing-row:last-child { border-bottom:none; }
    .pricing-row:active { background:rgba(102,126,234,.06); }
    .pricing-selected { background:rgba(102,126,234,.08); border-right:3px solid #667eea; }
    .dur { font-weight:600; color:#1a1a2e; }
    .price { font-weight:700; color:#667eea; }
    .ppm { color:#777; }
    .disc-badge {
      background:rgba(16,185,129,.12); color:#059669;
      padding:.1rem .4rem; border-radius:8px; font-size:.7rem; font-weight:700;
    }

    .duration-card {
      background:#fff; border-radius:14px; border:1.5px solid #e0e0f0;
      padding:1rem; margin-bottom:.75rem;
    }
    .duration-card label { font-size:.75rem; font-weight:600; color:#667eea; display:block; margin-bottom:.5rem; }
    .duration-selector {
      display:flex; align-items:center; justify-content:center; gap:1.5rem;
    }
    .dur-btn {
      width:44px; height:44px; border-radius:50%;
      background:linear-gradient(135deg,#667eea,#764ba2);
      color:#fff; border:none; font-size:1.1rem; cursor:pointer;
      display:flex; align-items:center; justify-content:center;
    }
    .dur-btn:disabled { opacity:.3; cursor:not-allowed; }
    .dur-value { font-size:2rem; font-weight:800; color:#1a1a2e; min-width:48px; text-align:center; }
    .total-line {
      display:flex; align-items:center; gap:.5rem;
      margin-top:.75rem; padding-top:.5rem; border-top:1px solid #f0f0f5;
      font-size:.88rem; font-weight:600; color:#555;
    }
    .total-amount { font-size:1.1rem; font-weight:800; color:#667eea; }
    .discount-note {
      font-size:.68rem; font-weight:700; color:#059669;
      background:rgba(16,185,129,.1); padding:.15rem .4rem; border-radius:8px;
    }

    .loc-card {
      background:#fff; border-radius:14px; border:1.5px solid #e0e0f0;
      padding:1rem; margin-bottom:.75rem;
    }
    .loc-card label { font-size:.75rem; font-weight:600; color:#667eea; display:flex; align-items:center; gap:.35rem; }
    .loc-hint { font-size:.72rem; color:#9090aa; margin:.25rem 0 .5rem; }
    .loc-vals { display:flex; flex-wrap:wrap; gap:.4rem; }
    .loc-chip {
      background:rgba(102,126,234,.08); color:#667eea;
      padding:.3rem .65rem; border-radius:10px; font-size:.8rem; font-weight:600;
      display:flex; align-items:center; gap:.3rem;
    }
    .loc-warn {
      color:#d97706; font-size:.78rem; font-weight:600;
      display:flex; align-items:center; gap:.3rem;
    }

    .error-banner {
      background:rgba(239,68,68,.08); color:#dc2626; border:1px solid rgba(239,68,68,.15);
      padding:.6rem .85rem; border-radius:10px; font-size:.82rem; font-weight:600;
      display:flex; align-items:center; gap:.4rem; margin-bottom:.5rem;
    }
    .success-banner {
      background:rgba(16,185,129,.08); color:#059669; border:1px solid rgba(16,185,129,.15);
      padding:.6rem .85rem; border-radius:10px; font-size:.82rem; font-weight:600;
      display:flex; align-items:center; gap:.4rem; margin-bottom:.5rem;
    }
    .submit-btn {
      width:100%; padding:.85rem; border:none; border-radius:12px;
      background:linear-gradient(135deg,#667eea,#764ba2); color:#fff;
      font-size:.95rem; font-weight:700; cursor:pointer;
      display:flex; align-items:center; justify-content:center; gap:.5rem;
      min-height:48px;
    }
    .submit-btn:disabled { opacity:.5; cursor:not-allowed; }

    .history-card {
      background:#fff; border-radius:12px; border:1.5px solid #e0e0f0;
      padding:.75rem; margin-bottom:.5rem;
    }
    .hist-top { display:flex; justify-content:space-between; align-items:center; }
    .hist-dur { font-size:.85rem; font-weight:700; color:#1a1a2e; }
    .hist-status { font-size:.7rem; font-weight:700; padding:.15rem .5rem; border-radius:8px; }
    .st-0 { background:rgba(245,158,11,.1); color:#d97706; }
    .st-1 { background:rgba(16,185,129,.1); color:#059669; }
    .st-2 { background:rgba(239,68,68,.08); color:#dc2626; }
    .st-3 { background:rgba(156,163,175,.1); color:#6b7280; }
    .hist-loc { font-size:.75rem; color:#777; margin-top:.25rem; display:flex; align-items:center; gap:.3rem; }
    .hist-loc i { color:#667eea; }
    .hist-reason { font-size:.75rem; color:#dc2626; margin-top:.25rem; display:flex; align-items:center; gap:.3rem; }
    .hist-date { font-size:.68rem; color:#aaa; margin-top:.25rem; }

    .spinner-xs {
      width:16px; height:16px; border:2px solid currentColor;
      border-top-color:transparent; border-radius:50%;
      animation:spin .7s linear infinite; display:inline-block;
    }
    @keyframes spin { to { transform:rotate(360deg); } }
  `],
})
export class TeacherPromotionComponent implements OnInit {
  private readonly rest = inject(RestService);
  private readonly currentUserSvc = inject(CurrentUserInfoService);

  loading = signal(true);
  submitting = signal(false);
  submitError = signal<string | null>(null);
  submitSuccess = signal(false);
  selectedDuration = signal(1);
  teacherGov = signal('');
  teacherTown = signal('');
  myPromotions = signal<PromotionDto[]>([]);

  readonly highlightedTiers: PricingTier[] = [
    { durationMonths: 1, amountEGP: 100, discountPercent: 0, pricePerMonth: 100 },
    { durationMonths: 2, amountEGP: 200, discountPercent: 0, pricePerMonth: 100 },
    { durationMonths: 3, amountEGP: 270, discountPercent: 10, pricePerMonth: 90 },
    { durationMonths: 6, amountEGP: 540, discountPercent: 10, pricePerMonth: 90 },
    { durationMonths: 12, amountEGP: 1080, discountPercent: 10, pricePerMonth: 90 },
  ];

  readonly calculatedAmount = computed(() => {
    const m = this.selectedDuration();
    const base = m * 100;
    return m >= 3 ? Math.round(base * 0.9) : base;
  });

  readonly activePromotion = computed(() => {
    return this.myPromotions().find(p =>
      p.status === 0 || // Pending
      (p.status === 1 && p.endDate && new Date(p.endDate) > new Date()) // Active
    ) ?? null;
  });

  readonly pastPromotions = computed(() => {
    const active = this.activePromotion();
    return this.myPromotions().filter(p => p.id !== active?.id);
  });

  readonly statusLabels: Record<number, string> = {
    0: 'معلق · Pending', 1: 'نشط · Active', 2: 'مرفوض · Rejected', 3: 'منتهي · Expired',
  };

  statusLabel(status: number): string {
    return this.statusLabels[status] ?? 'غير معروف';
  }

  async ngOnInit(): Promise<void> {
    try {
      const [info, promotions] = await Promise.all([
        lastValueFrom(this.currentUserSvc.getCurrentUserActorInfo()),
        lastValueFrom(this.rest.request<void, PromotionDto[]>({ method: 'GET', url: '/api/app/teacher-promotion/my-promotions' })),
      ]);

      // Get teacher's location from actor info or fetch teacher
      if (info) {
        // Try to get teacher details for location
        try {
          const teacher = await lastValueFrom(
            this.rest.request<void, any>({ method: 'GET', url: `/api/sesha/teachers/${info.actorId}` })
          );
          this.teacherGov.set(teacher?.government || '');
          this.teacherTown.set(teacher?.town || '');
        } catch { /* ignore */ }
      }
      this.myPromotions.set(promotions ?? []);
    } catch (e) { console.error(e); }
    finally { this.loading.set(false); }
  }

  increaseDuration(): void {
    if (this.selectedDuration() < 24) this.selectedDuration.update(v => v + 1);
  }

  decreaseDuration(): void {
    if (this.selectedDuration() > 1) this.selectedDuration.update(v => v - 1);
  }

  async submitPromotion(): Promise<void> {
    this.submitting.set(true);
    this.submitError.set(null);
    this.submitSuccess.set(false);
    try {
      const result = await lastValueFrom(
        this.rest.request<any, PromotionDto>({
          method: 'POST',
          url: '/api/app/teacher-promotion',
          body: {
            durationMonths: this.selectedDuration(),
            government: this.teacherGov(),
            town: this.teacherTown(),
          },
        })
      );
      this.submitSuccess.set(true);
      // Refresh promotions list
      const promotions = await lastValueFrom(
        this.rest.request<void, PromotionDto[]>({ method: 'GET', url: '/api/app/teacher-promotion/my-promotions' })
      );
      this.myPromotions.set(promotions ?? []);
    } catch (e: any) {
      this.submitError.set(e?.error?.error?.message || 'حدث خطأ · An error occurred');
    } finally {
      this.submitting.set(false);
    }
  }
}
