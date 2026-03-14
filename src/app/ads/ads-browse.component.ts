import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { environment } from '../../environments/environment';
import { CurrentUserInfoService } from '@proxy/common';

interface AdDto {
  id: string;
  title: string;
  titleEn?: string;
  description: string;
  descriptionEn?: string;
  imageUrl?: string;
  adType: number; // 0=Service, 1=Product, 2=Deal
  status: number;
  targetAudience: number;
  advertiserType: number; // 0=Teacher, 1=Library, 2=Bookstore, 3=EducationalCenter
  advertiserName: string;
  dealPartnerName?: string;
  price?: number;
  currency?: string;
  contactInfo?: string;
  externalUrl?: string;
  isFeatured: boolean;
  startDate?: string;
  endDate?: string;
  viewCount: number;
  clickCount: number;
  creationTime: string;
}

@Component({
  selector: 'app-ads-browse',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="page" dir="rtl">
      <!-- Header -->
      <div class="page-header">
        <div class="blob b1"></div>
        <div class="blob b2"></div>
        <div class="header-content">
          <div class="header-top-row">
            <div>
              <h1><i class="fas fa-bullhorn"></i> إعلانات</h1>
              <p>Ads</p>
            </div>
            <div class="header-actions">
              @if (isStudent()) {
                <a routerLink="/ads/my-coupons" class="header-link-btn">
                  <i class="fas fa-ticket-alt"></i> كوبوناتي
                </a>
              }
              @if (isAdvertiser()) {
                <a routerLink="/ads/redeem" class="header-link-btn">
                  <i class="fas fa-qrcode"></i> استرداد
                </a>
              }
              @if (canCreate()) {
                <a routerLink="/ads/my" class="header-link-btn">
                  <i class="fas fa-list"></i> إعلاناتي
                </a>
              }
              @if (isAdmin()) {
                <a routerLink="/ads/advertisers" class="header-link-btn">
                  <i class="fas fa-store"></i> المعلنين
                </a>
              }
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters">
        <div class="filter-chips">
          <button class="chip" [class.chip--active]="activeFilter() === 'all'" (click)="setFilter('all')">
            <i class="fas fa-th-large"></i> الكل
          </button>
          <button class="chip" [class.chip--active]="activeFilter() === 'service'" (click)="setFilter('service')">
            <i class="fas fa-chalkboard-teacher"></i> خدمات
          </button>
          <button class="chip" [class.chip--active]="activeFilter() === 'product'" (click)="setFilter('product')">
            <i class="fas fa-book"></i> كتب ومنتجات
          </button>
          <button class="chip" [class.chip--active]="activeFilter() === 'deal'" (click)="setFilter('deal')">
            <i class="fas fa-handshake"></i> عروض
          </button>
        </div>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="shimmer-area">
          @for (i of [1,2,3]; track i) {
            <div class="shimmer-card"></div>
          }
        </div>
      }

      <!-- Ads Grid -->
      @if (!loading()) {
        @if (ads().length === 0) {
          <div class="empty-state">
            <i class="fas fa-store"></i>
            <p>لا توجد إعلانات حالياً</p>
            <span>No ads available at the moment</span>
          </div>
        }

        <div class="ads-list">
          @for (ad of ads(); track ad.id) {
            <div class="ad-card" [class.ad-card--featured]="ad.isFeatured" (click)="viewAd(ad)">
              @if (ad.isFeatured) {
                <div class="featured-badge"><i class="fas fa-star"></i> مميز</div>
              }
              @if (ad.imageUrl) {
                <div class="ad-image" [style.backgroundImage]="'url(' + ad.imageUrl + ')'"></div>
              } @else {
                <div class="ad-image ad-image--placeholder">
                  <i [class]="getAdTypeIcon(ad.adType)"></i>
                </div>
              }
              <div class="ad-body">
                <div class="ad-type-chip" [class]="getAdTypeClass(ad.adType)">
                  {{ getAdTypeLabel(ad.adType) }}
                </div>
                <h3 class="ad-title">{{ ad.title }}</h3>
                @if (ad.titleEn) {
                  <p class="ad-title-en">{{ ad.titleEn }}</p>
                }
                <p class="ad-desc">{{ ad.description | slice:0:100 }}{{ ad.description.length > 100 ? '...' : '' }}</p>

                <div class="ad-meta">
                  <span class="ad-advertiser">
                    <i [class]="getAdvertiserIcon(ad.advertiserType)"></i>
                    {{ ad.advertiserName }}
                  </span>
                  @if (ad.dealPartnerName) {
                    <span class="ad-deal-partner">
                      <i class="fas fa-handshake"></i> {{ ad.dealPartnerName }}
                    </span>
                  }
                </div>

                @if (ad.price) {
                  <div class="ad-price">
                    {{ ad.price }} {{ ad.currency || 'ر.س' }}
                  </div>
                }

                <div class="ad-footer">
                  <span class="ad-views"><i class="fas fa-eye"></i> {{ ad.viewCount }}</span>
                  <span class="ad-date">{{ formatDate(ad.creationTime) }}</span>
                </div>
              </div>
            </div>
          }
        </div>

        <!-- Load more -->
        @if (hasMore()) {
          <div class="load-more">
            <button class="btn-load-more" (click)="loadMore()" [disabled]="loadingMore()">
              @if (loadingMore()) {
                <i class="fas fa-spinner fa-spin"></i>
              } @else {
                <i class="fas fa-arrow-down"></i> تحميل المزيد · Load More
              }
            </button>
          </div>
        }
      }

      <!-- Create Ad FAB -->
      @if (canCreate()) {
        <a routerLink="/ads/create" class="fab-create">
          <i class="fas fa-plus"></i>
        </a>
      }

      <div style="height:calc(80px + env(safe-area-inset-bottom,0px))"></div>
    </div>
  `,
  styles: [`
    .page { min-height:100vh; background:#f4f5fb; }

    .page-header {
      background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);
      padding:calc(env(safe-area-inset-top,0px) + 1.25rem) 1.25rem 1.5rem;
      position:relative; overflow:hidden;
    }
    .blob { position:absolute; border-radius:50%; background:rgba(255,255,255,.07); pointer-events:none; }
    .b1 { width:200px; height:200px; top:-70px; right:-60px; }
    .b2 { width:140px; height:140px; bottom:-50px; left:-30px; }
    .header-content { position:relative; z-index:1; }
    .header-top-row {
      display:flex; align-items:flex-start; justify-content:space-between; gap:.75rem;
    }
    .header-content h1 {
      margin:0; font-size:1.4rem; font-weight:800; color:#fff;
      display:flex; align-items:center; gap:.5rem;
    }
    .header-content p { margin:.15rem 0 0; font-size:.8rem; color:rgba(255,255,255,.7); }
    .header-actions {
      display:flex; gap:.4rem; flex-wrap:wrap; justify-content:flex-end;
    }
    .header-link-btn {
      display:flex; align-items:center; gap:.25rem;
      padding:.3rem .6rem; border-radius:10px; flex-shrink:0;
      background:rgba(255,255,255,.18); border:1px solid rgba(255,255,255,.25);
      color:rgba(255,255,255,.9); font-size:.68rem; font-weight:600;
      text-decoration:none; white-space:nowrap;
      min-height:32px;
    }

    .filters { padding:.75rem 1rem 0; overflow-x:auto; -webkit-overflow-scrolling:touch; }
    .filter-chips { display:flex; gap:.5rem; padding-bottom:.25rem; }
    .chip {
      flex-shrink:0; padding:.5rem .875rem; border-radius:20px;
      border:1.5px solid #e0e0ee; background:#fff; color:#555;
      font-size:.78rem; font-weight:600; cursor:pointer;
      display:flex; align-items:center; gap:.35rem;
      transition:all .2s; min-height:38px;
      -webkit-tap-highlight-color:transparent;
    }
    .chip--active {
      background:linear-gradient(135deg,#667eea,#764ba2);
      color:#fff; border-color:transparent;
    }
    .chip i { font-size:.75rem; }

    .shimmer-area { padding:1rem; display:flex; flex-direction:column; gap:.75rem; }
    .shimmer-card {
      height:180px; border-radius:16px;
      background:linear-gradient(90deg,#e8e8f0 25%,#f0f0f8 50%,#e8e8f0 75%);
      background-size:200% 100%; animation:shimmer 1.4s infinite;
    }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    .empty-state {
      text-align:center; padding:3rem 1rem;
    }
    .empty-state i { font-size:3rem; color:#c4c4d4; display:block; margin-bottom:1rem; }
    .empty-state p { font-size:1rem; font-weight:600; color:#555; margin:0 0 .25rem; }
    .empty-state span { font-size:.8rem; color:#9090aa; }

    .ads-list { padding:.75rem 1rem; display:flex; flex-direction:column; gap:.75rem; }

    .ad-card {
      background:#fff; border-radius:16px; overflow:hidden;
      border:1.5px solid #f0f0f0; box-shadow:0 2px 12px rgba(0,0,0,.05);
      position:relative; cursor:pointer; transition:transform .15s;
      -webkit-tap-highlight-color:transparent;
    }
    .ad-card:active { transform:scale(.98); }
    .ad-card--featured { border-color:rgba(102,126,234,.3); box-shadow:0 4px 20px rgba(102,126,234,.12); }

    .featured-badge {
      position:absolute; top:.75rem; left:.75rem; z-index:2;
      background:linear-gradient(135deg,#f59e0b,#d97706);
      color:#fff; font-size:.65rem; font-weight:700;
      padding:.2rem .5rem; border-radius:8px;
      display:flex; align-items:center; gap:.25rem;
    }

    .ad-image {
      width:100%; height:140px;
      background-size:cover; background-position:center;
      background-color:#f0f0f8;
    }
    .ad-image--placeholder {
      display:flex; align-items:center; justify-content:center;
      background:linear-gradient(135deg,rgba(102,126,234,.08),rgba(118,75,162,.08));
    }
    .ad-image--placeholder i { font-size:2.5rem; color:rgba(102,126,234,.3); }

    .ad-body { padding:.875rem; }

    .ad-type-chip {
      display:inline-flex; align-items:center; gap:.25rem;
      font-size:.65rem; font-weight:700; padding:.15rem .5rem;
      border-radius:8px; margin-bottom:.5rem;
    }
    .type-service { background:rgba(102,126,234,.1); color:#667eea; }
    .type-product { background:rgba(16,185,129,.1); color:#059669; }
    .type-deal { background:rgba(245,158,11,.1); color:#d97706; }

    .ad-title { margin:0 0 .15rem; font-size:1rem; font-weight:700; color:#1a1a2e; }
    .ad-title-en { margin:0 0 .35rem; font-size:.75rem; color:#9090aa; }
    .ad-desc { margin:0 0 .5rem; font-size:.82rem; color:#555; line-height:1.4; }

    .ad-meta { display:flex; flex-wrap:wrap; gap:.5rem; margin-bottom:.5rem; }
    .ad-advertiser, .ad-deal-partner {
      display:flex; align-items:center; gap:.25rem;
      font-size:.72rem; color:#667eea; font-weight:600;
    }
    .ad-deal-partner { color:#d97706; }

    .ad-price {
      font-size:1.1rem; font-weight:800; color:#059669;
      margin-bottom:.5rem;
    }

    .ad-footer {
      display:flex; justify-content:space-between; align-items:center;
      border-top:1px solid #f8f8fc; padding-top:.5rem;
    }
    .ad-views { font-size:.7rem; color:#9090aa; display:flex; align-items:center; gap:.25rem; }
    .ad-date { font-size:.7rem; color:#9090aa; }

    .load-more { padding:1rem; text-align:center; }
    .btn-load-more {
      padding:.65rem 1.5rem; border-radius:12px;
      background:linear-gradient(135deg,#667eea,#764ba2);
      color:#fff; border:none; font-size:.85rem; font-weight:600;
      cursor:pointer; display:inline-flex; align-items:center; gap:.35rem;
      min-height:44px;
    }
    .btn-load-more:disabled { opacity:.5; cursor:not-allowed; }

    .fab-create {
      position:fixed; bottom:calc(80px + env(safe-area-inset-bottom,0px) + 1rem); left:1.25rem;
      width:56px; height:56px; border-radius:50%;
      background:linear-gradient(135deg,#667eea,#764ba2);
      color:#fff; font-size:1.5rem;
      display:flex; align-items:center; justify-content:center;
      box-shadow:0 4px 20px rgba(102,126,234,.4);
      z-index:100; text-decoration:none;
      transition:transform .15s;
      -webkit-tap-highlight-color:transparent;
    }
    .fab-create:active { transform:scale(.9); }
  `],
})
export class AdsBrowseComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly currentUserSvc = inject(CurrentUserInfoService);
  private readonly apiBase = environment.apis?.default?.url || '';

  loading = signal(true);
  loadingMore = signal(false);
  ads = signal<AdDto[]>([]);
  activeFilter = signal<string>('all');
  hasMore = signal(false);
  canCreate = signal(false);
  isStudent = signal(false);
  isAdvertiser = signal(false);
  isAdmin = signal(false);
  private skipCount = 0;
  private readonly pageSize = 20;

  async ngOnInit(): Promise<void> {
    try {
      const info = await this.currentUserSvc.getCurrentUserActorInfo().toPromise();
      const roles = (info?.userRoles || []).map((r: string) => r.toUpperCase());
      this.canCreate.set(roles.some((r: string) => ['TEACHER', 'ADMIN', 'SECRETARY', 'ADVERTISER'].includes(r)));
      this.isStudent.set(roles.includes('STUDENT'));
      this.isAdvertiser.set(roles.includes('ADVERTISER'));
      this.isAdmin.set(roles.some((r: string) => ['ADMIN', 'SECRETARY'].includes(r)));
    } catch { /* ignore */ }
    await this.loadAds();
  }

  setFilter(filter: string): void {
    this.activeFilter.set(filter);
    this.skipCount = 0;
    this.ads.set([]);
    this.loadAds();
  }

  async loadAds(): Promise<void> {
    this.loading.set(true);
    try {
      const adType = this.activeFilter() === 'service' ? 0
        : this.activeFilter() === 'product' ? 1
        : this.activeFilter() === 'deal' ? 2 : undefined;

      let url = `${this.apiBase}/api/app/advertisement/active-ads?skipCount=${this.skipCount}&maxResultCount=${this.pageSize}`;
      if (adType !== undefined) url += `&adType=${adType}`;

      const res = await this.http.get<{ totalCount: number; items: AdDto[] }>(url).toPromise();
      this.ads.set(res?.items ?? []);
      this.hasMore.set((res?.totalCount ?? 0) > this.skipCount + this.pageSize);
    } catch (e) {
      console.error('Error loading ads:', e);
    } finally {
      this.loading.set(false);
    }
  }

  async loadMore(): Promise<void> {
    this.loadingMore.set(true);
    this.skipCount += this.pageSize;
    try {
      const adType = this.activeFilter() === 'service' ? 0
        : this.activeFilter() === 'product' ? 1
        : this.activeFilter() === 'deal' ? 2 : undefined;

      let url = `${this.apiBase}/api/app/advertisement/active-ads?skipCount=${this.skipCount}&maxResultCount=${this.pageSize}`;
      if (adType !== undefined) url += `&adType=${adType}`;

      const res = await this.http.get<{ totalCount: number; items: AdDto[] }>(url).toPromise();
      this.ads.update(prev => [...prev, ...(res?.items ?? [])]);
      this.hasMore.set((res?.totalCount ?? 0) > this.skipCount + this.pageSize);
    } catch (e) {
      console.error(e);
    } finally {
      this.loadingMore.set(false);
    }
  }

  viewAd(ad: AdDto): void {
    this.http.post(`${this.apiBase}/api/app/advertisement/${ad.id}/view`, {}).subscribe();
    this.router.navigate(['/ads', 'detail', ad.id]);
  }

  getAdTypeIcon(type: number): string {
    return type === 0 ? 'fas fa-chalkboard-teacher' : type === 1 ? 'fas fa-book' : 'fas fa-handshake';
  }

  getAdTypeClass(type: number): string {
    return 'ad-type-chip ' + (type === 0 ? 'type-service' : type === 1 ? 'type-product' : 'type-deal');
  }

  getAdTypeLabel(type: number): string {
    return type === 0 ? 'خدمة تعليمية' : type === 1 ? 'كتب ومنتجات' : 'عرض مشترك';
  }

  getAdvertiserIcon(type: number): string {
    return type === 0 ? 'fas fa-chalkboard-teacher'
      : type === 1 ? 'fas fa-book-reader'
      : type === 2 ? 'fas fa-store'
      : type === 3 ? 'fas fa-university' : 'fas fa-building';
  }

  formatDate(date: string): string {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'اليوم';
    if (diffDays === 1) return 'أمس';
    if (diffDays < 7) return `منذ ${diffDays} أيام`;
    return d.toLocaleDateString('ar-SA');
  }
}
