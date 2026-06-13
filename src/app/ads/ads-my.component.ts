import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { environment } from '../../environments/environment';

interface AdDto {
  id: string;
  title: string;
  titleEn?: string;
  description: string;
  adType: number;
  status: number;
  isFeatured: boolean;
  viewCount: number;
  clickCount: number;
  creationTime: string;
  reviewNotes?: string;
}

@Component({
  selector: 'app-ads-my',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page" dir="rtl">
      <div class="page-header">
        <div class="blob b1"></div>
        <div class="blob b2"></div>
        <div class="header-content">
          <div class="header-top">
            <div>
              <h1><i class="fas fa-bullhorn"></i> إعلاناتي</h1>
              <p>My Ads</p>
            </div>
            <a routerLink="/ads/create" class="btn-create">
              <i class="fas fa-plus"></i> إنشاء
            </a>
          </div>
        </div>
      </div>

      @if (loading()) {
        <div class="shimmer-area">
          @for (i of [1,2,3]; track i) { <div class="shimmer-card"></div> }
        </div>
      }

      @if (!loading()) {
        <!-- Stats -->
        <div class="stats-row">
          <div class="stat-card">
            <div class="stat-icon" style="background:rgba(102,126,234,.12);color:#667eea">
              <i class="fas fa-ad"></i>
            </div>
            <div class="stat-value">{{ ads().length }}</div>
            <div class="stat-label">إجمالي</div>
            <div class="stat-sub">Total</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background:rgba(16,185,129,.12);color:#059669">
              <i class="fas fa-check-circle"></i>
            </div>
            <div class="stat-value">{{ activeCount() }}</div>
            <div class="stat-label">مفعّل</div>
            <div class="stat-sub">Active</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background:rgba(245,158,11,.12);color:#d97706">
              <i class="fas fa-clock"></i>
            </div>
            <div class="stat-value">{{ pendingCount() }}</div>
            <div class="stat-label">قيد المراجعة</div>
            <div class="stat-sub">Pending</div>
          </div>
        </div>

        @if (ads().length === 0) {
          <div class="empty-state">
            <i class="fas fa-bullhorn"></i>
            <p>لم تنشر أي إعلانات بعد</p>
            <span>No ads yet</span>
            <a routerLink="/ads/create" class="btn-create-big">
              <i class="fas fa-plus"></i> إنشاء إعلان جديد · Create New Ad
            </a>
          </div>
        }

        <div class="ads-list">
          @for (ad of ads(); track ad.id) {
            <div class="ad-card">
              <!-- Clickable area -->
              <a class="ad-card-link" [routerLink]="['/ads/detail', ad.id]">
                <div class="ad-card-header">
                  <div class="ad-type" [class]="getTypeClass(ad.adType)">
                    {{ getTypeLabel(ad.adType) }}
                  </div>
                  <div class="ad-status" [class]="getStatusClass(ad.status)">
                    {{ getStatusLabel(ad.status) }}
                  </div>
                </div>
                <h3 class="ad-title">
                  @if (ad.isFeatured) { <i class="fas fa-star" style="color:#f59e0b;font-size:.8rem"></i> }
                  {{ ad.title }}
                </h3>
                <p class="ad-desc">{{ ad.description | slice:0:100 }}</p>
                @if (ad.reviewNotes) {
                  <div class="review-note">
                    <i class="fas fa-comment-alt"></i> {{ ad.reviewNotes }}
                  </div>
                }
                <div class="ad-footer">
                  <div class="ad-stats">
                    <span><i class="fas fa-eye"></i> {{ ad.viewCount }}</span>
                    <span><i class="fas fa-mouse-pointer"></i> {{ ad.clickCount }}</span>
                  </div>
                  <span class="ad-date">{{ formatDate(ad.creationTime) }}</span>
                </div>
              </a>
              <!-- Action buttons -->
              <div class="ad-actions">
                @if (ad.status === 2) {
                  <button class="action-btn action-stop" (click)="toggleAd(ad, false)" [disabled]="actionLoading()">
                    <i class="fas fa-pause-circle"></i> إيقاف · Stop
                  </button>
                }
                @if (ad.status === 5) {
                  <button class="action-btn action-enable" (click)="toggleAd(ad, true)" [disabled]="actionLoading()">
                    <i class="fas fa-play-circle"></i> تفعيل · Enable
                  </button>
                }
                <a class="action-btn action-detail" [routerLink]="['/ads/detail', ad.id]">
                  <i class="fas fa-info-circle"></i> تفاصيل · Details
                </a>
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

    .page-header {
      background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);
      padding:calc(env(safe-area-inset-top,0px) + 1.25rem) 1.25rem 1.5rem;
      position:relative; overflow:hidden;
    }
    .blob { position:absolute; border-radius:50%; background:rgba(255,255,255,.07); pointer-events:none; }
    .b1 { width:200px; height:200px; top:-70px; right:-60px; }
    .b2 { width:140px; height:140px; bottom:-50px; left:-30px; }
    .header-content { position:relative; z-index:1; }
    .header-top { display:flex; justify-content:space-between; align-items:center; }
    .header-top h1 {
      margin:0; font-size:1.3rem; font-weight:800; color:#fff;
      display:flex; align-items:center; gap:.5rem;
    }
    .header-top p { margin:.1rem 0 0; font-size:.78rem; color:rgba(255,255,255,.7); }
    .btn-create {
      padding:.5rem 1rem; border-radius:12px;
      background:rgba(255,255,255,.2); border:1px solid rgba(255,255,255,.3);
      color:#fff; font-size:.8rem; font-weight:600; text-decoration:none;
      display:flex; align-items:center; gap:.35rem; min-height:40px;
    }

    .stats-row { display:flex; gap:.5rem; padding:1rem 1rem 0; }
    .stat-card {
      flex:1; background:#fff; border-radius:14px; padding:.75rem .5rem;
      text-align:center; box-shadow:0 2px 8px rgba(0,0,0,.04);
      display:flex; flex-direction:column; align-items:center; gap:.2rem;
    }
    .stat-icon { width:36px; height:36px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:.9rem; }
    .stat-value { font-size:1.3rem; font-weight:800; color:#1a1a2e; }
    .stat-label { font-size:.68rem; font-weight:600; color:#555; }
    .stat-sub { font-size:.58rem; color:#9090aa; }

    .empty-state { text-align:center; padding:2rem 1rem; }
    .empty-state i { font-size:2.5rem; color:#c4c4d4; display:block; margin-bottom:.75rem; }
    .empty-state p { font-size:.9rem; font-weight:600; color:#555; margin:0 0 .25rem; }
    .empty-state span { font-size:.78rem; color:#9090aa; display:block; margin-bottom:1rem; }
    .btn-create-big {
      display:inline-flex; align-items:center; gap:.35rem;
      padding:.65rem 1.25rem; border-radius:12px;
      background:linear-gradient(135deg,#667eea,#764ba2);
      color:#fff; font-size:.85rem; font-weight:600; text-decoration:none;
    }

    .ads-list { padding:.75rem 1rem; display:flex; flex-direction:column; gap:.75rem; }

    .ad-card {
      background:#fff; border-radius:14px; border:1.5px solid #f0f0f0;
      padding:.875rem; box-shadow:0 2px 8px rgba(0,0,0,.04);
    }
    .ad-card-header {
      display:flex; justify-content:space-between; align-items:center; margin-bottom:.5rem;
    }
    .ad-type { font-size:.65rem; font-weight:700; padding:.15rem .5rem; border-radius:8px; }
    .type-service { background:rgba(102,126,234,.1); color:#667eea; }
    .type-product { background:rgba(16,185,129,.1); color:#059669; }
    .type-deal { background:rgba(245,158,11,.1); color:#d97706; }

    .ad-status { font-size:.65rem; font-weight:700; padding:.15rem .5rem; border-radius:8px; }
    .status-draft { background:rgba(156,163,175,.1); color:#9ca3af; }
    .status-pending { background:rgba(245,158,11,.1); color:#d97706; }
    .status-approved { background:rgba(16,185,129,.1); color:#059669; }
    .status-rejected { background:rgba(239,68,68,.1); color:#dc2626; }
    .status-expired { background:rgba(156,163,175,.1); color:#6b7280; }
    .status-disabled { background:rgba(239,68,68,.06); color:#9ca3af; }

    .ad-title { margin:0 0 .25rem; font-size:.92rem; font-weight:700; color:#1a1a2e; }
    .ad-desc { margin:0 0 .5rem; font-size:.8rem; color:#555; line-height:1.4; }

    .review-note {
      padding:.5rem .65rem; border-radius:8px; margin-bottom:.5rem;
      background:rgba(245,158,11,.06); font-size:.75rem; color:#d97706;
      display:flex; align-items:flex-start; gap:.35rem;
    }

    .ad-footer {
      display:flex; justify-content:space-between; align-items:center;
      border-top:1px solid #f8f8fc; padding-top:.5rem;
    }
    .ad-stats { display:flex; gap:.75rem; font-size:.7rem; color:#9090aa; }
    .ad-stats span { display:flex; align-items:center; gap:.2rem; }
    .ad-date { font-size:.7rem; color:#9090aa; }

    .ad-card-link { text-decoration:none; display:block; color:inherit; }
    .ad-actions {
      display:flex; gap:.35rem; padding-top:.5rem; border-top:1px solid #f4f5fb;
    }
    .action-btn {
      flex:1; display:flex; align-items:center; justify-content:center; gap:.25rem;
      padding:.5rem; border-radius:10px; border:none;
      font-size:.72rem; font-weight:700; cursor:pointer; min-height:38px;
      text-decoration:none; -webkit-tap-highlight-color:transparent;
      &:disabled { opacity:.5; cursor:not-allowed; }
    }
    .action-stop { background:rgba(239,68,68,.08); color:#dc2626; }
    .action-stop:active { background:rgba(239,68,68,.15); }
    .action-enable { background:rgba(16,185,129,.08); color:#059669; }
    .action-enable:active { background:rgba(16,185,129,.15); }
    .action-detail { background:rgba(102,126,234,.08); color:#667eea; }
    .action-detail:active { background:rgba(102,126,234,.15); }
  `],
})
export class AdsMyComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly apiBase = environment.apis?.default?.url || '';

  loading = signal(true);
  actionLoading = signal(false);
  ads = signal<AdDto[]>([]);

  activeCount = () => this.ads().filter(a => a.status === 2).length;
  pendingCount = () => this.ads().filter(a => a.status === 1).length;

  async ngOnInit(): Promise<void> {
    try {
      const res = await this.http.get<AdDto[]>(`${this.apiBase}/api/app/advertisement/my-ads`).toPromise();
      this.ads.set(res ?? []);
    } catch (e) { console.error(e); }
    finally { this.loading.set(false); }
  }

  async toggleAd(ad: AdDto, enable: boolean): Promise<void> {
    this.actionLoading.set(true);
    try {
      const endpoint = enable ? 'enable' : 'disable';
      await this.http.post(`${this.apiBase}/api/app/advertisement/${ad.id}/${endpoint}`, {}).toPromise();
      this.ads.update(list => list.map(a =>
        a.id === ad.id ? { ...a, status: enable ? 2 : 5 } : a
      ));
    } catch (e) { console.error('Toggle error:', e); }
    finally { this.actionLoading.set(false); }
  }

  getTypeClass(type: number): string {
    return 'ad-type ' + (type === 0 ? 'type-service' : type === 1 ? 'type-product' : 'type-deal');
  }
  getTypeLabel(type: number): string {
    return type === 0 ? 'خدمة' : type === 1 ? 'منتج' : 'عرض';
  }
  getStatusClass(status: number): string {
    const m: Record<number,string> = {0:'status-draft',1:'status-pending',2:'status-approved',3:'status-rejected',4:'status-expired',5:'status-disabled'};
    return 'ad-status ' + (m[status] ?? 'status-draft');
  }
  getStatusLabel(status: number): string {
    const m: Record<number,string> = {0:'مسودة',1:'قيد المراجعة',2:'مفعّل',3:'مرفوض',4:'منتهي',5:'معطّل'};
    return m[status] ?? 'غير معروف';
  }
  formatDate(date: string): string {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diff === 0) return 'اليوم';
    if (diff === 1) return 'أمس';
    if (diff < 7) return 'منذ ' + diff + ' أيام';
    return d.toLocaleDateString('ar-SA');
  }
}
