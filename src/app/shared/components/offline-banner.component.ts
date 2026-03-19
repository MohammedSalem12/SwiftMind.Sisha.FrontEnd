import { Component, input } from '@angular/core';

@Component({
  selector: 'app-offline-banner',
  standalone: true,
  template: `
    <div class="offline-banner" dir="rtl">
      <div class="offline-icon">
        <i class="fas fa-wifi-slash"></i>
      </div>
      <div class="offline-text">
        <span class="offline-ar">أنت غير متصل — تعرض بيانات محفوظة</span>
        <span class="offline-en">You're offline — showing cached data</span>
        @if (lastUpdated()) {
          <span class="offline-ts">{{ lastUpdated() }}</span>
        }
      </div>
    </div>
  `,
  styles: [`
    .offline-banner {
      display: flex;
      align-items: center;
      gap: .6rem;
      margin: .5rem 1rem;
      padding: .6rem .85rem;
      border-radius: 12px;
      background: linear-gradient(135deg, #fff3cd, #ffeeba);
      border: 1px solid #f0d98c;
      box-shadow: 0 2px 8px rgba(0,0,0,.06);
    }
    .offline-icon {
      flex-shrink: 0;
      width: 32px; height: 32px; border-radius: 50%;
      background: rgba(255,165,0,.15);
      display: flex; align-items: center; justify-content: center;
    }
    .offline-icon i { font-size: .9rem; color: #e67e00; }
    .offline-text {
      display: flex; flex-direction: column;
      font-size: .78rem; line-height: 1.3;
    }
    .offline-ar { font-weight: 700; color: #856404; }
    .offline-en { font-weight: 500; color: #997a1e; font-size: .72rem; }
    .offline-ts { font-size: .68rem; color: #a08630; margin-top: 2px; }
  `],
})
export class OfflineBannerComponent {
  lastUpdated = input<string>('');
}
