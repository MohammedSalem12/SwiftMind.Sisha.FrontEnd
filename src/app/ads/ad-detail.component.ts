import { CommonModule, Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-ad-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page" dir="rtl">
      <div class="page-header">
        <div class="blob b1"></div>
        <div class="blob b2"></div>
        <div class="header-row">
          <button class="btn-back" (click)="goBack()">
            <i class="fas fa-arrow-right"></i>
          </button>
          <div class="header-text">
            <h1>تفاصيل الإعلان</h1>
            <p>Ad Details</p>
          </div>
          <div class="header-icon"><i class="fas fa-bullhorn"></i></div>
        </div>
      </div>

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
        </div>
      }

      <div style="height:calc(80px + env(safe-area-inset-bottom,0px))"></div>
    </div>
  `,
  styles: [`
    .page { min-height:100vh; background:#f4f5fb; }

    .page-header {
      background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);
      padding:calc(env(safe-area-inset-top,0px) + 1.25rem) 1.25rem 2rem;
      position:relative; overflow:hidden;
    }
    .blob { position:absolute; border-radius:50%; background:rgba(255,255,255,.07); pointer-events:none; }
    .b1 { width:200px; height:200px; top:-70px; right:-60px; }
    .b2 { width:140px; height:140px; bottom:-50px; left:-30px; }
    .header-row { position:relative; z-index:1; display:flex; align-items:center; gap:1rem; }
    .btn-back {
      width:40px; height:40px; border-radius:12px;
      background:rgba(255,255,255,.15); border:1px solid rgba(255,255,255,.25);
      color:#fff; font-size:1rem; cursor:pointer;
      display:flex; align-items:center; justify-content:center; flex-shrink:0;
    }
    .header-text { flex:1; }
    .header-text h1 { margin:0; font-size:1.3rem; font-weight:800; color:#fff; }
    .header-text p { margin:.1rem 0 0; font-size:.78rem; color:rgba(255,255,255,.7); }
    .header-icon {
      width:48px; height:48px; border-radius:14px;
      background:rgba(255,255,255,.15);
      display:flex; align-items:center; justify-content:center;
      color:rgba(255,255,255,.9); font-size:1.3rem; flex-shrink:0;
    }

    .loading { text-align:center; padding:3rem 1rem; color:#9090aa; font-size:.9rem; }
    .error-msg {
      margin:1rem; padding:.75rem; border-radius:12px;
      background:rgba(239,68,68,.08); color:#dc2626; font-size:.82rem; font-weight:600;
    }

    .detail-area { padding:0 0 1rem; }

    .ad-image {
      width:100%; max-height:220px; object-fit:cover;
      margin-top:-1rem; border-radius:0 0 16px 16px;
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
  `],
})
export class AdDetailComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly apiBase = environment.apis?.default?.url || '';

  ad = signal<any>(null);
  loading = signal(true);
  error = signal('');

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.error.set('معرف الإعلان غير صالح'); this.loading.set(false); return; }

    try {
      // Track view
      this.http.post(`${this.apiBase}/api/app/advertisement/${id}/view`, {}).subscribe();

      const data = await lastValueFrom(
        this.http.get(`${this.apiBase}/api/app/advertisement/${id}`)
      );
      this.ad.set(data);
    } catch (e: any) {
      this.error.set('تعذر تحميل الإعلان · Could not load ad');
      console.error('[AdDetail]', e);
    } finally {
      this.loading.set(false);
    }
  }

  goBack(): void { this.location.back(); }
}
