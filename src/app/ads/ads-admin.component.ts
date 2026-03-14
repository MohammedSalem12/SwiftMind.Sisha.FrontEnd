import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { environment } from '../../environments/environment';

interface AdDto {
  id: string;
  title: string;
  titleEn?: string;
  description: string;
  adType: number;
  status: number;
  advertiserType: number;
  advertiserName: string;
  isFeatured: boolean;
  viewCount: number;
  clickCount: number;
  creationTime: string;
  reviewNotes?: string;
}

interface ModuleSettings {
  isEnabled: boolean;
  requireApproval: boolean;
  maxAdsPerAdvertiser: number;
}

@Component({
  selector: 'app-ads-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page" dir="rtl">
      <div class="page-header">
        <div class="blob b1"></div>
        <div class="blob b2"></div>
        <div class="header-content">
          <h1><i class="fas fa-cogs"></i> إدارة الإعلانات</h1>
          <p>Ads Management</p>
        </div>
      </div>

      <!-- Module Settings -->
      <div class="section">
        <div class="section-title"><i class="fas fa-sliders-h"></i> إعدادات الوحدة · Module Settings</div>
        <div class="settings-card">
          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-label">تفعيل وحدة الإعلانات</span>
              <span class="setting-sub">Enable Ads Module</span>
            </div>
            <button class="toggle-btn" [class.toggle-btn--on]="settings().isEnabled"
                    (click)="toggleSetting('isEnabled')">
              <span class="toggle-knob"></span>
            </button>
          </div>
          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-label">تتطلب موافقة المسؤول</span>
              <span class="setting-sub">Require Admin Approval</span>
            </div>
            <button class="toggle-btn" [class.toggle-btn--on]="settings().requireApproval"
                    (click)="toggleSetting('requireApproval')">
              <span class="toggle-knob"></span>
            </button>
          </div>
          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-label">الحد الأقصى للإعلانات لكل معلن</span>
              <span class="setting-sub">Max Ads Per Advertiser</span>
            </div>
            <input class="setting-input" type="number" [(ngModel)]="maxAds" (blur)="saveMaxAds()" min="1" max="100" dir="ltr" />
          </div>
          @if (settingsSaved()) {
            <div class="save-msg"><i class="fas fa-check"></i> تم الحفظ · Saved</div>
          }
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button class="tab" [class.tab--active]="activeTab() === 'pending'" (click)="activeTab.set('pending'); loadPending()">
          بانتظار المراجعة
          @if (pendingAds().length > 0) { <span class="tab-badge">{{ pendingAds().length }}</span> }
        </button>
        <button class="tab" [class.tab--active]="activeTab() === 'all'" (click)="activeTab.set('all'); loadAll()">
          كل الإعلانات
        </button>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="shimmer-area">
          @for (i of [1,2,3]; track i) { <div class="shimmer-card"></div> }
        </div>
      }

      @if (!loading()) {
        <!-- Pending Ads -->
        @if (activeTab() === 'pending') {
          @if (pendingAds().length === 0) {
            <div class="empty-state">
              <i class="fas fa-inbox"></i>
              <p>لا توجد إعلانات بانتظار المراجعة</p>
              <span>No pending ads</span>
            </div>
          }
          <div class="ads-list">
            @for (ad of pendingAds(); track ad.id) {
              <div class="admin-card">
                <div class="admin-card-header">
                  <div class="admin-card-type" [class]="getTypeClass(ad.adType)">
                    {{ getTypeLabel(ad.adType) }}
                  </div>
                  <span class="admin-card-time">{{ formatDate(ad.creationTime) }}</span>
                </div>
                <h3 class="admin-card-title">{{ ad.title }}</h3>
                <p class="admin-card-desc">{{ ad.description | slice:0:150 }}</p>
                <div class="admin-card-meta">
                  <span><i class="fas fa-user"></i> {{ ad.advertiserName }}</span>
                </div>
                <div class="admin-card-actions">
                  <button class="btn-approve" (click)="reviewAd(ad.id, true)" [disabled]="reviewing()">
                    <i class="fas fa-check"></i> موافقة
                  </button>
                  <button class="btn-reject" (click)="reviewAd(ad.id, false)" [disabled]="reviewing()">
                    <i class="fas fa-times"></i> رفض
                  </button>
                </div>
              </div>
            }
          </div>
        }

        <!-- All Ads -->
        @if (activeTab() === 'all') {
          @if (allAds().length === 0) {
            <div class="empty-state">
              <i class="fas fa-ad"></i>
              <p>لا توجد إعلانات</p>
              <span>No ads yet</span>
            </div>
          }
          <div class="ads-list">
            @for (ad of allAds(); track ad.id) {
              <div class="admin-card">
                <div class="admin-card-header">
                  <div class="admin-card-type" [class]="getTypeClass(ad.adType)">
                    {{ getTypeLabel(ad.adType) }}
                  </div>
                  <div class="status-chip" [class]="getStatusClass(ad.status)">
                    {{ getStatusLabel(ad.status) }}
                  </div>
                </div>
                <h3 class="admin-card-title">
                  @if (ad.isFeatured) { <i class="fas fa-star" style="color:#f59e0b"></i> }
                  {{ ad.title }}
                </h3>
                <div class="admin-card-meta">
                  <span><i class="fas fa-user"></i> {{ ad.advertiserName }}</span>
                  <span><i class="fas fa-eye"></i> {{ ad.viewCount }}</span>
                  <span><i class="fas fa-mouse-pointer"></i> {{ ad.clickCount }}</span>
                </div>
                <div class="admin-card-actions">
                  <button class="btn-sm" (click)="toggleFeatured(ad.id)">
                    <i class="fas fa-star"></i> {{ ad.isFeatured ? 'إلغاء التمييز' : 'تمييز' }}
                  </button>
                  @if (ad.status === 2) {
                    <button class="btn-sm btn-sm--danger" (click)="disableAd(ad.id)">
                      <i class="fas fa-ban"></i> تعطيل
                    </button>
                  }
                  @if (ad.status === 5) {
                    <button class="btn-sm btn-sm--success" (click)="enableAd(ad.id)">
                      <i class="fas fa-check"></i> تفعيل
                    </button>
                  }
                </div>
              </div>
            }
          </div>
        }
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
    .header-content h1 {
      margin:0; font-size:1.3rem; font-weight:800; color:#fff;
      display:flex; align-items:center; gap:.5rem;
    }
    .header-content p { margin:.1rem 0 0; font-size:.78rem; color:rgba(255,255,255,.7); }

    .section { padding:1rem 1rem 0; }
    .section-title {
      display:flex; align-items:center; gap:.5rem; font-size:.8rem; font-weight:700;
      color:#555; text-transform:uppercase; letter-spacing:.05em; margin-bottom:.75rem;
    }
    .section-title i { color:#667eea; font-size:.85rem; }

    .settings-card {
      background:#fff; border-radius:16px; border:1.5px solid #f0f0f0;
      overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,.04);
    }
    .setting-row {
      display:flex; align-items:center; justify-content:space-between;
      padding:.875rem; border-bottom:1px solid #f8f8fc;
    }
    .setting-row:last-child { border-bottom:none; }
    .setting-info { display:flex; flex-direction:column; gap:.1rem; }
    .setting-label { font-size:.85rem; font-weight:600; color:#1a1a2e; }
    .setting-sub { font-size:.7rem; color:#9090aa; }
    .setting-input {
      width:60px; padding:.4rem; border-radius:8px; border:1.5px solid #e5e7eb;
      text-align:center; font-size:.88rem; font-weight:700; color:#1a1a2e;
    }

    .toggle-btn {
      position:relative; width:48px; height:28px; border-radius:14px;
      background:#d1d5db; border:none; cursor:pointer; padding:0; flex-shrink:0;
      transition:background .25s; outline:none;
      -webkit-tap-highlight-color:transparent;
    }
    .toggle-btn--on { background:linear-gradient(135deg,#667eea,#764ba2); }
    .toggle-knob {
      position:absolute; top:3px; right:3px; width:22px; height:22px;
      border-radius:50%; background:#fff; box-shadow:0 1px 4px rgba(0,0,0,.25);
      transition:transform .25s;
    }
    .toggle-btn--on .toggle-knob { transform:translateX(-20px); }

    .save-msg {
      padding:.5rem .875rem; font-size:.78rem; color:#059669; font-weight:600;
      display:flex; align-items:center; gap:.25rem;
    }

    .tabs {
      display:flex; gap:.5rem; padding:1rem 1rem .5rem;
    }
    .tab {
      flex:1; padding:.6rem; border-radius:12px; border:1.5px solid #e0e0ee;
      background:#fff; color:#555; font-size:.8rem; font-weight:600;
      cursor:pointer; text-align:center; min-height:44px;
      display:flex; align-items:center; justify-content:center; gap:.35rem;
      -webkit-tap-highlight-color:transparent;
    }
    .tab--active {
      background:linear-gradient(135deg,#667eea,#764ba2);
      color:#fff; border-color:transparent;
    }
    .tab-badge {
      background:rgba(255,255,255,.3); padding:.1rem .4rem; border-radius:10px;
      font-size:.7rem; font-weight:700;
    }

    .shimmer-area { padding:1rem; display:flex; flex-direction:column; gap:.75rem; }
    .shimmer-card {
      height:120px; border-radius:16px;
      background:linear-gradient(90deg,#e8e8f0 25%,#f0f0f8 50%,#e8e8f0 75%);
      background-size:200% 100%; animation:shimmer 1.4s infinite;
    }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    .empty-state { text-align:center; padding:2rem 1rem; }
    .empty-state i { font-size:2.5rem; color:#c4c4d4; display:block; margin-bottom:.75rem; }
    .empty-state p { font-size:.9rem; font-weight:600; color:#555; margin:0 0 .25rem; }
    .empty-state span { font-size:.78rem; color:#9090aa; }

    .ads-list { padding:.5rem 1rem; display:flex; flex-direction:column; gap:.75rem; }

    .admin-card {
      background:#fff; border-radius:14px; border:1.5px solid #f0f0f0;
      padding:.875rem; box-shadow:0 2px 8px rgba(0,0,0,.04);
    }
    .admin-card-header {
      display:flex; justify-content:space-between; align-items:center; margin-bottom:.5rem;
    }
    .admin-card-type {
      font-size:.65rem; font-weight:700; padding:.15rem .5rem; border-radius:8px;
    }
    .type-service { background:rgba(102,126,234,.1); color:#667eea; }
    .type-product { background:rgba(16,185,129,.1); color:#059669; }
    .type-deal { background:rgba(245,158,11,.1); color:#d97706; }
    .admin-card-time { font-size:.7rem; color:#9090aa; }

    .admin-card-title { margin:0 0 .35rem; font-size:.95rem; font-weight:700; color:#1a1a2e; }
    .admin-card-desc { margin:0 0 .5rem; font-size:.8rem; color:#555; line-height:1.4; }
    .admin-card-meta {
      display:flex; flex-wrap:wrap; gap:.75rem; margin-bottom:.5rem;
      font-size:.72rem; color:#9090aa;
    }
    .admin-card-meta span { display:flex; align-items:center; gap:.25rem; }

    .admin-card-actions { display:flex; gap:.5rem; }
    .btn-approve {
      flex:1; padding:.5rem; border-radius:10px; border:none;
      background:rgba(16,185,129,.1); color:#059669;
      font-size:.78rem; font-weight:700; cursor:pointer;
      min-height:40px; display:flex; align-items:center; justify-content:center; gap:.25rem;
    }
    .btn-reject {
      flex:1; padding:.5rem; border-radius:10px; border:none;
      background:rgba(239,68,68,.08); color:#dc2626;
      font-size:.78rem; font-weight:700; cursor:pointer;
      min-height:40px; display:flex; align-items:center; justify-content:center; gap:.25rem;
    }
    .btn-sm {
      padding:.4rem .65rem; border-radius:8px; border:1.5px solid #e5e7eb;
      background:#fff; color:#555; font-size:.7rem; font-weight:600;
      cursor:pointer; display:flex; align-items:center; gap:.25rem; min-height:36px;
    }
    .btn-sm--danger { border-color:rgba(239,68,68,.2); color:#dc2626; }
    .btn-sm--success { border-color:rgba(16,185,129,.2); color:#059669; }

    .status-chip { font-size:.65rem; font-weight:700; padding:.15rem .5rem; border-radius:8px; }
    .status-draft { background:rgba(156,163,175,.1); color:#9ca3af; }
    .status-pending { background:rgba(245,158,11,.1); color:#d97706; }
    .status-approved { background:rgba(16,185,129,.1); color:#059669; }
    .status-rejected { background:rgba(239,68,68,.1); color:#dc2626; }
    .status-expired { background:rgba(156,163,175,.1); color:#6b7280; }
    .status-disabled { background:rgba(239,68,68,.06); color:#9ca3af; }
  `],
})
export class AdsAdminComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly apiBase = environment.apis?.default?.url || '';

  loading = signal(true);
  reviewing = signal(false);
  settings = signal<ModuleSettings>({ isEnabled: true, requireApproval: true, maxAdsPerAdvertiser: 10 });
  settingsSaved = signal(false);
  maxAds = 10;
  activeTab = signal<'pending' | 'all'>('pending');
  pendingAds = signal<AdDto[]>([]);
  allAds = signal<AdDto[]>([]);

  async ngOnInit(): Promise<void> {
    await this.loadSettings();
    await this.loadPending();
  }

  async loadSettings(): Promise<void> {
    try {
      const res = await this.http.get<ModuleSettings>(`${this.apiBase}/api/app/advertisement/module-settings`).toPromise();
      if (res) {
        this.settings.set(res);
        this.maxAds = res.maxAdsPerAdvertiser;
      }
    } catch (e) { console.error(e); }
  }

  async toggleSetting(key: 'isEnabled' | 'requireApproval'): Promise<void> {
    const current = this.settings();
    const updated = { ...current, [key]: !current[key] };
    this.settings.set(updated);
    await this.saveSettings(updated);
  }

  async saveMaxAds(): Promise<void> {
    const updated = { ...this.settings(), maxAdsPerAdvertiser: this.maxAds };
    this.settings.set(updated);
    await this.saveSettings(updated);
  }

  private async saveSettings(s: ModuleSettings): Promise<void> {
    try {
      await this.http.post(`${this.apiBase}/api/app/advertisement/module-settings`, s).toPromise();
      this.settingsSaved.set(true);
      setTimeout(() => this.settingsSaved.set(false), 2000);
    } catch (e) { console.error(e); }
  }

  async loadPending(): Promise<void> {
    this.loading.set(true);
    try {
      const res = await this.http.get<{ items: AdDto[] }>(`${this.apiBase}/api/app/advertisement/pending-ads`).toPromise();
      this.pendingAds.set(res?.items ?? []);
    } catch (e) { console.error(e); }
    finally { this.loading.set(false); }
  }

  async loadAll(): Promise<void> {
    this.loading.set(true);
    try {
      const res = await this.http.get<{ totalCount: number; items: AdDto[] }>(
        `${this.apiBase}/api/app/advertisement?skipCount=0&maxResultCount=50`
      ).toPromise();
      this.allAds.set(res?.items ?? []);
    } catch (e) { console.error(e); }
    finally { this.loading.set(false); }
  }

  async reviewAd(id: string, approve: boolean): Promise<void> {
    this.reviewing.set(true);
    try {
      await this.http.post(`${this.apiBase}/api/app/advertisement/review-ad`, { adId: id, approve, notes: '' }).toPromise();
      this.pendingAds.update(list => list.filter(a => a.id !== id));
    } catch (e) { console.error(e); }
    finally { this.reviewing.set(false); }
  }

  async toggleFeatured(id: string): Promise<void> {
    try {
      await this.http.post(`${this.apiBase}/api/app/advertisement/${id}/toggle-featured`, {}).toPromise();
      this.allAds.update(list => list.map(a => a.id === id ? { ...a, isFeatured: !a.isFeatured } : a));
    } catch (e) { console.error(e); }
  }

  async disableAd(id: string): Promise<void> {
    try {
      await this.http.post(`${this.apiBase}/api/app/advertisement/${id}/disable`, {}).toPromise();
      this.allAds.update(list => list.map(a => a.id === id ? { ...a, status: 5 } : a));
    } catch (e) { console.error(e); }
  }

  async enableAd(id: string): Promise<void> {
    try {
      await this.http.post(`${this.apiBase}/api/app/advertisement/${id}/enable`, {}).toPromise();
      this.allAds.update(list => list.map(a => a.id === id ? { ...a, status: 2 } : a));
    } catch (e) { console.error(e); }
  }

  getTypeClass(type: number): string {
    return 'admin-card-type ' + (type === 0 ? 'type-service' : type === 1 ? 'type-product' : 'type-deal');
  }
  getTypeLabel(type: number): string {
    return type === 0 ? 'خدمة' : type === 1 ? 'منتج' : 'عرض';
  }
  getStatusClass(status: number): string {
    const map: Record<number, string> = { 0:'status-draft', 1:'status-pending', 2:'status-approved', 3:'status-rejected', 4:'status-expired', 5:'status-disabled' };
    return 'status-chip ' + (map[status] ?? 'status-draft');
  }
  getStatusLabel(status: number): string {
    const map: Record<number, string> = { 0:'مسودة', 1:'قيد المراجعة', 2:'مفعّل', 3:'مرفوض', 4:'منتهي', 5:'معطّل' };
    return map[status] ?? 'غير معروف';
  }
  formatDate(date: string): string {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diffDays === 0) return 'اليوم';
    if (diffDays === 1) return 'أمس';
    if (diffDays < 7) return 'منذ ' + diffDays + ' أيام';
    return d.toLocaleDateString('ar-SA');
  }
}
