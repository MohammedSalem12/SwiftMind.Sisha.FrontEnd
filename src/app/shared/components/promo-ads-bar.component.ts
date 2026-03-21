import { Component, input, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-promo-ads-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (ads().length > 0) {
      <div class="ads-bar" dir="rtl">
        <div class="ads-header">
          <i class="fas fa-bullhorn"></i>
          <span>عروض وإعلانات · Offers</span>
          <button class="ads-more" (click)="goToAllAds()">عرض الكل <i class="fas fa-chevron-left"></i></button>
        </div>
        <div class="ads-scroll">
          @for (ad of ads(); track ad.id) {
            <button class="ad-card" (click)="onAdClick(ad)">
              @if (ad.imageUrl) {
                <img [src]="ad.imageUrl" class="ad-img" alt="" />
              } @else {
                <div class="ad-img-placeholder">
                  <i class="fas" [class]="ad.adType === 2 ? 'fas fa-handshake' : ad.adType === 1 ? 'fas fa-box-open' : 'fas fa-store'"></i>
                </div>
              }
              <div class="ad-content">
                <span class="ad-title">{{ ad.title }}</span>
                @if (ad.discountPercent) {
                  <span class="ad-discount">{{ ad.discountPercent }}% خصم</span>
                }
                @if (ad.advertiserName) {
                  <span class="ad-advertiser">{{ ad.advertiserName }}</span>
                }
              </div>
              @if (ad.isFeatured) {
                <span class="ad-featured"><i class="fas fa-star"></i></span>
              }
            </button>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .ads-bar { margin: .5rem 0; }
    .ads-header {
      display: flex; align-items: center; gap: .4rem;
      padding: 0 1rem .4rem; font-size: .78rem; font-weight: 700; color: #4a4a6a;
      i { color: #d97706; font-size: .75rem; }
    }
    .ads-more {
      margin-right: auto; background: none; border: none;
      color: #667eea; font-size: .7rem; font-weight: 700; cursor: pointer;
      display: flex; align-items: center; gap: .2rem;
      i { font-size: .55rem; }
    }
    .ads-scroll {
      display: flex; gap: .5rem; overflow-x: auto;
      padding: 0 1rem .5rem; scroll-snap-type: x mandatory;
      -webkit-overflow-scrolling: touch;
      &::-webkit-scrollbar { display: none; }
    }
    .ad-card {
      flex-shrink: 0; width: 200px; scroll-snap-align: start;
      background: #fff; border-radius: 14px; overflow: hidden;
      border: 1.5px solid #f0f0f5; box-shadow: 0 2px 8px rgba(0,0,0,.04);
      cursor: pointer; text-align: right; position: relative;
      transition: transform .15s; -webkit-tap-highlight-color: transparent;
      &:active { transform: scale(.97); }
    }
    .ad-img {
      width: 100%; height: 90px; object-fit: cover;
    }
    .ad-img-placeholder {
      width: 100%; height: 90px;
      background: linear-gradient(135deg, rgba(102,126,234,.08), rgba(118,75,162,.08));
      display: flex; align-items: center; justify-content: center;
      i { font-size: 1.5rem; color: #667eea; opacity: .4; }
    }
    .ad-content { padding: .5rem .65rem; }
    .ad-title {
      display: block; font-size: .75rem; font-weight: 700; color: #1a1a2e;
      line-height: 1.3; margin-bottom: .2rem;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .ad-discount {
      display: inline-block; font-size: .6rem; font-weight: 700;
      background: rgba(16,185,129,.1); color: #059669;
      padding: .1rem .35rem; border-radius: 4px; margin-left: .25rem;
    }
    .ad-advertiser {
      display: block; font-size: .6rem; color: #9090aa; margin-top: .15rem;
    }
    .ad-featured {
      position: absolute; top: .4rem; left: .4rem;
      background: #fbbf24; color: #fff; width: 22px; height: 22px;
      border-radius: 50%; display: flex; align-items: center; justify-content: center;
      font-size: .55rem; box-shadow: 0 2px 4px rgba(0,0,0,.15);
    }
  `],
})
export class PromoAdsBarComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiBase = (environment as any).apis?.default?.url || '';

  audience = input<number>(0); // 0=All, 1=Students, 2=Parents, 3=Teachers
  ads = signal<any[]>([]);

  async ngOnInit(): Promise<void> {
    try {
      const res: any = await lastValueFrom(
        this.http.get(`${this.apiBase}/api/app/advertisement/active-ads`, {
          params: { audience: this.audience().toString(), maxResultCount: '10' },
        })
      );
      this.ads.set(res?.items ?? []);
    } catch { /* silent */ }
  }

  onAdClick(ad: any): void {
    if (ad?.id) {
      this.http.post(`${this.apiBase}/api/app/advertisement/${ad.id}/click`, {}).subscribe();
      this.router.navigate(['/ads', 'detail', ad.id]);
    }
  }

  goToAllAds(): void {
    this.router.navigate(['/ads']);
  }
}
