import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { lastValueFrom } from 'rxjs';
import { AdvertiserService } from '@proxy/advertisements';
import { PageHeaderComponent } from '../shared/components/page-header.component';

interface Partner {
  id: string;
  name: string;
  nameEn?: string;
  type: number;
  address?: string;
  contactPhone: string;
  logoUrl?: string;
  description?: string;
}

const TYPE_LABELS: Record<number, { ar: string; en: string; icon: string; color: string }> = {
  1: { ar: 'مكتبة', en: 'Library', icon: 'fa-book', color: '#8b5cf6' },
  2: { ar: 'مكتبة كتب', en: 'Bookstore', icon: 'fa-book-open', color: '#6366f1' },
  3: { ar: 'مركز تعليمي', en: 'Education Center', icon: 'fa-school', color: '#3b82f6' },
  5: { ar: 'ملابس', en: 'Clothes', icon: 'fa-tshirt', color: '#ec4899' },
  6: { ar: 'كافيه', en: 'Coffee Shop', icon: 'fa-coffee', color: '#92400e' },
  7: { ar: 'مطعم', en: 'Restaurant', icon: 'fa-utensils', color: '#f59e0b' },
  8: { ar: 'عصائر', en: 'Juices', icon: 'fa-glass-whiskey', color: '#10b981' },
  9: { ar: 'صالة رياضية', en: 'Gym', icon: 'fa-dumbbell', color: '#ef4444' },
  10: { ar: 'مستلزمات مدرسية', en: 'School Supplies', icon: 'fa-pencil-ruler', color: '#667eea' },
  11: { ar: 'تكنولوجيا', en: 'Technology', icon: 'fa-laptop', color: '#0ea5e9' },
  14: { ar: 'ترفيه', en: 'Entertainment', icon: 'fa-gamepad', color: '#a855f7' },
};

@Component({
  selector: 'app-partners-directory',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  template: `
    <div class="page" dir="rtl">
      <app-page-header [title]="'شركاؤنا'" [titleEn]="'Partners'"></app-page-header>

      <div class="page-body">
        <div class="search-box">
          <i class="fas fa-search"></i>
          <input type="text" [ngModel]="searchTerm()" (ngModelChange)="searchTerm.set($event)"
                 placeholder="بحث عن شريك · Search partner" />
        </div>

        @if (loading()) {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>جاري التحميل...</p>
          </div>
        } @else if (filtered().length === 0) {
          <div class="empty-state">
            <i class="fas fa-store-slash"></i>
            <p>لا يوجد شركاء حالياً</p>
            <p class="en">No partners available yet</p>
          </div>
        } @else {
          @for (partner of filtered(); track partner.id) {
            <div class="partner-card">
              <div class="partner-avatar" [style.background]="getTypeInfo(partner.type).color + '18'">
                <i class="fas" [class]="getTypeInfo(partner.type).icon"
                   [style.color]="getTypeInfo(partner.type).color"></i>
              </div>
              <div class="partner-info">
                <span class="partner-name">{{ partner.name }}</span>
                @if (partner.nameEn) {
                  <span class="partner-name-en">{{ partner.nameEn }}</span>
                }
                <span class="partner-type-badge" [style.background]="getTypeInfo(partner.type).color + '18'"
                      [style.color]="getTypeInfo(partner.type).color">
                  {{ getTypeInfo(partner.type).ar }}
                </span>
                @if (partner.address) {
                  <span class="partner-addr"><i class="fas fa-map-marker-alt"></i> {{ partner.address }}</span>
                }
                @if (partner.contactPhone) {
                  <span class="partner-phone"><i class="fas fa-phone"></i> {{ partner.contactPhone }}</span>
                }
              </div>
              <div class="partner-actions">
                @if (partner.address) {
                  <button class="nav-btn" (click)="openMaps(partner.address!)">
                    <i class="fas fa-directions"></i>
                  </button>
                }
                @if (partner.contactPhone) {
                  <a class="call-btn" [href]="'tel:' + partner.contactPhone">
                    <i class="fas fa-phone"></i>
                  </a>
                }
              </div>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .page { min-height: 100vh; background: #f5f5f7; }
    .page-body { padding: 16px; }
    .search-box {
      display: flex; align-items: center; gap: 10px;
      background: white; border-radius: 12px; padding: 0 14px;
      box-shadow: 0 1px 4px rgba(0,0,0,.06); margin-bottom: 16px;
    }
    .search-box i { color: #999; }
    .search-box input {
      flex: 1; border: none; outline: none; padding: 12px 0;
      font-size: 15px; background: transparent;
    }
    .partner-card {
      display: flex; align-items: flex-start; gap: 12px;
      background: white; border-radius: 14px; padding: 14px;
      margin-bottom: 10px; box-shadow: 0 1px 4px rgba(0,0,0,.04);
    }
    .partner-avatar {
      width: 48px; height: 48px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-size: 20px; flex-shrink: 0;
    }
    .partner-info { flex: 1; display: flex; flex-direction: column; gap: 3px; }
    .partner-name { font-size: 15px; font-weight: 600; color: #1a1a2e; }
    .partner-name-en { font-size: 12px; color: #888; }
    .partner-type-badge {
      display: inline-block; width: fit-content;
      font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 6px;
    }
    .partner-addr, .partner-phone {
      font-size: 12px; color: #666; display: flex; align-items: center; gap: 4px;
      i { font-size: 10px; color: #999; }
    }
    .partner-actions { display: flex; flex-direction: column; gap: 6px; }
    .nav-btn, .call-btn {
      width: 40px; height: 40px; border-radius: 10px; border: none;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; font-size: 14px; text-decoration: none;
    }
    .nav-btn { background: rgba(59,130,246,.1); color: #3b82f6; }
    .call-btn { background: rgba(16,185,129,.1); color: #10b981; }
    .loading-state, .empty-state { text-align: center; padding: 60px 20px; color: #666; }
    .empty-state i { font-size: 48px; color: #ccc; display: block; margin-bottom: 12px; }
    .en { font-size: 13px; color: #999; }
    .spinner {
      width: 36px; height: 36px; border: 3px solid #e0e0e0;
      border-top-color: #667eea; border-radius: 50%;
      animation: spin .8s linear infinite; margin: 0 auto 16px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class PartnersDirectoryComponent implements OnInit {
  private readonly advertiserService = inject(AdvertiserService);

  loading = signal(false);
  partners = signal<Partner[]>([]);
  searchTerm = signal('');

  filtered = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.partners();
    return this.partners().filter(p =>
      p.name.toLowerCase().includes(term) ||
      (p.nameEn?.toLowerCase().includes(term)) ||
      (p.address?.toLowerCase().includes(term))
    );
  });

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    try {
      const result = await lastValueFrom(this.advertiserService.getList({
        maxResultCount: 100,
        skipCount: 0,
      } as any));
      const approved = (result?.items ?? []).filter((a: any) => a.isApproved);
      this.partners.set(approved.map((a: any) => ({
        id: a.id,
        name: a.name,
        nameEn: a.nameEn,
        type: a.type,
        address: a.address,
        contactPhone: a.contactPhone,
        logoUrl: a.logoUrl,
        description: a.description,
      })));
    } catch (e) {
      console.error('Error loading partners:', e);
    } finally {
      this.loading.set(false);
    }
  }

  getTypeInfo(type: number) {
    return TYPE_LABELS[type] ?? { ar: 'أخرى', en: 'Other', icon: 'fa-store', color: '#667eea' };
  }

  openMaps(address: string): void {
    const encoded = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encoded}`, '_blank');
  }
}
