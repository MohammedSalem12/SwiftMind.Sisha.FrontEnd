import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { CurrentUserInfoService } from '@proxy/common';
import { PageHeaderComponent } from '../shared/components/page-header.component';

@Component({
  selector: 'app-ad-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, PageHeaderComponent],
  template: `
    <div class="page" dir="rtl">
      <app-page-header
        [title]="'تفاصيل الإعلان'"
        [titleEn]="'Ad Details'"></app-page-header>

      @if (loading()) {
        <div class="loading"><i class="fas fa-spinner fa-spin"></i> جاري التحميل...</div>
      }

      @if (error()) {
        <div class="error-msg"><i class="fas fa-exclamation-circle"></i> {{ error() }}</div>
      }

      @if (ad()) {
        <div class="detail-area">
          <!-- Image -->
          @if (ad()!.imageUrl) {
            <img [src]="ad()!.imageUrl" alt="" class="ad-image" />
          }

          <!-- Main card -->
          <div class="ad-card">
            <!-- Type chip -->
            <div class="type-row">
              <span class="type-chip" [class.type-service]="ad()!.adType === 0"
                                       [class.type-product]="ad()!.adType === 1"
                                       [class.type-deal]="ad()!.adType === 2">
                <i class="fas" [class.fa-chalkboard-teacher]="ad()!.adType === 0"
                               [class.fa-book]="ad()!.adType === 1"
                               [class.fa-handshake]="ad()!.adType === 2"></i>
                {{ ad()!.adType === 0 ? 'خدمة تعليمية' : ad()!.adType === 1 ? 'منتج' : 'عرض' }}
              </span>
              @if (ad()!.isFeatured) {
                <span class="featured-chip"><i class="fas fa-star"></i> مميز</span>
              }
            </div>

            <h2 class="ad-title">{{ ad()!.title }}</h2>
            @if (ad()!.titleEn) {
              <p class="ad-title-en">{{ ad()!.titleEn }}</p>
            }

            <p class="ad-desc">{{ ad()!.description }}</p>
            @if (ad()!.descriptionEn) {
              <p class="ad-desc-en">{{ ad()!.descriptionEn }}</p>
            }

            <!-- Meta -->
            <div class="meta-grid">
              <div class="meta-item">
                <i class="fas fa-user"></i>
                <span>{{ ad()!.advertiserName }}</span>
              </div>
              @if (ad()!.dealPartnerName) {
                <div class="meta-item">
                  <i class="fas fa-handshake"></i>
                  <span>{{ ad()!.dealPartnerName }}</span>
                </div>
              }
              @if (ad()!.price) {
                <div class="meta-item meta-price">
                  <i class="fas fa-tag"></i>
                  <span>{{ ad()!.price }} {{ ad()!.currency || 'SAR' }}</span>
                </div>
              }
              @if (ad()!.contactInfo) {
                <div class="meta-item">
                  <i class="fas fa-phone"></i>
                  <span dir="ltr">{{ ad()!.contactInfo }}</span>
                </div>
              }
            </div>

            <!-- External link -->
            @if (ad()!.externalUrl) {
              <a class="ext-link" [href]="ad()!.externalUrl" target="_blank" rel="noopener">
                <i class="fas fa-external-link-alt"></i> زيارة الرابط · Visit Link
              </a>
            }
          </div>

          <!-- Student Coupon -->
          @if (coupon()) {
            <div class="coupon-card">
              <div class="coupon-header">
                <i class="fas fa-ticket-alt"></i>
                <span>كوبون الخصم · Your Coupon</span>
              </div>
              <div class="coupon-body">
                <div class="coupon-discount">{{ coupon()!.discountPercent }}%</div>
                <div class="coupon-code">{{ coupon()!.couponCode }}</div>
                <button class="coupon-copy" (click)="copyCoupon()">
                  <i class="fas fa-copy"></i> نسخ · Copy
                </button>
              </div>
              <div class="coupon-meta">
                @if (coupon()!.expiryDate) {
                  <span><i class="fas fa-calendar"></i> صالح حتى {{ coupon()!.expiryDate | date:'yyyy-MM-dd' }}</span>
                }
                <span class="coupon-status" [class.coupon-active]="coupon()!.status === 0" [class.coupon-redeemed]="coupon()!.status === 1">
                  {{ coupon()!.status === 0 ? 'نشط · Active' : coupon()!.status === 1 ? 'مستخدم · Redeemed' : 'منتهي · Expired' }}
                </span>
              </div>
            </div>
          }
        </div>
      }

      <div style="height:calc(80px + env(safe-area-inset-bottom,0px))"></div>
    </div>
  `,
  styles: [`
    .page { min-height:100vh; background:#f4f5fb; }

    .loading { text-align:center; padding:3rem 1rem; color:#9090aa; font-size:.9rem; }
    .error-msg {
      margin:1rem; padding:.75rem; border-radius:12px;
      background:rgba(239,68,68,.08); color:#dc2626; font-size:.82rem; font-weight:600;
    }

    .detail-area { padding:0 0 1rem; }

    .ad-image {
      width:100%; max-height:220px; object-fit:cover;
      border-radius:0 0 16px 16px;
    }

    .ad-card {
      margin:1rem; background:#fff; border-radius:16px;
      padding:1.25rem; box-shadow:0 2px 12px rgba(0,0,0,.06);
    }

    .type-row { display:flex; gap:.5rem; margin-bottom:.75rem; flex-wrap:wrap; }
    .type-chip {
      display:inline-flex; align-items:center; gap:.3rem;
      padding:.3rem .65rem; border-radius:8px;
      font-size:.7rem; font-weight:700;
    }
    .type-service { background:rgba(102,126,234,.1); color:#667eea; }
    .type-product { background:rgba(16,185,129,.1); color:#059669; }
    .type-deal { background:rgba(245,158,11,.1); color:#d97706; }
    .featured-chip {
      display:inline-flex; align-items:center; gap:.25rem;
      padding:.3rem .65rem; border-radius:8px;
      background:rgba(245,158,11,.1); color:#d97706;
      font-size:.7rem; font-weight:700;
    }

    .ad-title { font-size:1.15rem; font-weight:800; color:#1a1a2e; margin:0 0 .25rem; }
    .ad-title-en { font-size:.85rem; color:#9090aa; margin:0 0 .75rem; }
    .ad-desc { font-size:.88rem; color:#444; line-height:1.65; margin:0 0 .35rem; }
    .ad-desc-en { font-size:.82rem; color:#888; line-height:1.5; margin:0 0 1rem; }

    .meta-grid {
      display:flex; flex-direction:column; gap:.5rem;
      padding-top:.75rem; border-top:1px solid #f0f0f0;
    }
    .meta-item {
      display:flex; align-items:center; gap:.5rem;
      font-size:.82rem; color:#555;
    }
    .meta-item i { color:#667eea; width:16px; text-align:center; }
    .meta-price span { font-weight:700; color:#667eea; }

    .ext-link {
      display:flex; align-items:center; justify-content:center; gap:.4rem;
      margin-top:1rem; padding:.7rem; border-radius:12px;
      background:linear-gradient(135deg,#667eea,#764ba2);
      color:#fff; font-size:.82rem; font-weight:700;
      text-decoration:none; min-height:44px;
    }

    .coupon-card {
      margin:1rem; background:linear-gradient(135deg,#f0fdf4,#dcfce7);
      border:2px solid #86efac; border-radius:16px; padding:1rem;
    }
    .coupon-header {
      display:flex; align-items:center; gap:.4rem;
      font-size:.82rem; font-weight:700; color:#16a34a; margin-bottom:.6rem;
    }
    .coupon-body {
      display:flex; align-items:center; gap:.75rem;
    }
    .coupon-discount {
      width:50px; height:50px; border-radius:50%;
      background:linear-gradient(135deg,#22c55e,#16a34a);
      color:#fff; font-size:1.1rem; font-weight:800;
      display:flex; align-items:center; justify-content:center; flex-shrink:0;
    }
    .coupon-code {
      flex:1; font-family:monospace; font-size:1rem; font-weight:800;
      color:#1a1a2e; letter-spacing:1px; direction:ltr;
    }
    .coupon-copy {
      padding:.4rem .75rem; border-radius:8px; border:none;
      background:rgba(22,163,106,.15); color:#16a34a;
      font-size:.72rem; font-weight:700; cursor:pointer; min-height:36px;
      display:flex; align-items:center; gap:.25rem;
    }
    .coupon-meta {
      display:flex; justify-content:space-between; align-items:center;
      margin-top:.5rem; font-size:.7rem; color:#6b7280;
    }
    .coupon-status { font-weight:700; padding:.1rem .4rem; border-radius:6px; }
    .coupon-active { background:rgba(22,163,106,.1); color:#16a34a; }
    .coupon-redeemed { background:rgba(156,163,175,.1); color:#6b7280; }
  `],
})
export class AdDetailComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly apiBase = environment.apis?.default?.url || '';

  private readonly currentUserSvc = inject(CurrentUserInfoService);
  private readonly destroyRef = inject(DestroyRef);

  ad = signal<any>(null);
  coupon = signal<any>(null);
  loading = signal(true);
  error = signal('');

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.error.set('معرف الإعلان غير صالح'); this.loading.set(false); return; }

    try {
      // Track view
      this.http.post(`${this.apiBase}/api/app/advertisement/${id}/view`, {}).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();

      const data = await lastValueFrom(
        this.http.get(`${this.apiBase}/api/app/advertisement/${id}`)
      );
      this.ad.set(data);

      // Load student coupon for this ad (if deal type)
      if ((data as any)?.adType === 2) {
        try {
          const coupons = await lastValueFrom(
            this.http.get<any[]>(`${this.apiBase}/api/app/deal-coupon/my-active-coupons`)
          );
          const match = (coupons || []).find((c: any) => c.advertisementId === id);
          if (match) this.coupon.set(match);
        } catch { /* not a student or no coupons */ }
      }
    } catch (e: any) {
      this.error.set('تعذر تحميل الإعلان · Could not load ad');
      console.error('[AdDetail]', e);
    } finally {
      this.loading.set(false);
    }
  }

  copyCoupon(): void {
    const code = this.coupon()?.couponCode;
    if (code) {
      navigator.clipboard.writeText(code).catch(() => {});
    }
  }
}
