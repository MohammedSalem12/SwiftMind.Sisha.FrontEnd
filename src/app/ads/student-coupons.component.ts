import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { PageHeaderComponent } from '../shared/components/page-header.component';

interface CouponDto {
  id: string;
  couponCode: string;
  studentName: string;
  courseName: string;
  teacherName: string;
  discountPercent: number;
  dealDescription?: string;
  advertiserName?: string;
  status: number;
  expiryDate?: string;
  redeemedAt?: string;
}

@Component({
  selector: 'app-student-coupons',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, PageHeaderComponent],
  template: `
    <div class="page" dir="rtl">
      <app-page-header
        [title]="'كوبوناتي'"
        [titleEn]="'My Coupons'"
        [backTo]="'/'"></app-page-header>

      @if (loading()) {
        <div class="shimmer-area">
          @for (i of [1,2]; track i) { <div class="shimmer-card"></div> }
        </div>
      }

      @if (!loading()) {
        @if (coupons().length === 0) {
          <div class="empty-state">
            <i class="fas fa-ticket-alt"></i>
            <p>لا توجد كوبونات متاحة</p>
            <span>No active coupons. Enroll in courses with deals to get coupons!</span>
          </div>
        }

        <div class="coupons-list">
          @for (c of coupons(); track c.id) {
            <div class="coupon-card" [class.coupon--redeemed]="c.status === 1" [class.coupon--expired]="c.status === 2">
              <!-- Coupon top -->
              <div class="coupon-top">
                <div class="coupon-discount">
                  <span class="discount-value">{{ c.discountPercent }}%</span>
                  <span class="discount-label">خصم · OFF</span>
                </div>
                <div class="coupon-info">
                  <h3>{{ c.courseName }}</h3>
                  <p class="coupon-teacher"><i class="fas fa-chalkboard-teacher"></i> {{ c.teacherName }}</p>
                  @if (c.advertiserName) {
                    <p class="coupon-library"><i class="fas fa-store"></i> {{ c.advertiserName }}</p>
                  }
                </div>
              </div>

              <!-- Dashed separator -->
              <div class="coupon-separator">
                <div class="circle circle-right"></div>
                <div class="dashed-line"></div>
                <div class="circle circle-left"></div>
              </div>

              <!-- Coupon bottom — code -->
              <div class="coupon-bottom">
                @if (c.dealDescription) {
                  <p class="coupon-desc">{{ c.dealDescription }}</p>
                }
                <div class="coupon-code-box">
                  <span class="coupon-code">{{ c.couponCode }}</span>
                  <button class="btn-copy" (click)="copyCode(c.couponCode)">
                    <i class="fas fa-copy"></i>
                  </button>
                </div>
                <div class="coupon-status-row">
                  <span class="coupon-status" [class]="getStatusClass(c.status)">
                    {{ getStatusLabel(c.status) }}
                  </span>
                  @if (c.expiryDate) {
                    <span class="coupon-expiry">
                      <i class="fas fa-clock"></i> {{ formatDate(c.expiryDate) }}
                    </span>
                  }
                </div>
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

    .shimmer-area { padding:1rem; display:flex; flex-direction:column; gap:.75rem; }
    .shimmer-card {
      height:200px; border-radius:16px;
      background:linear-gradient(90deg,#e8e8f0 25%,#f0f0f8 50%,#e8e8f0 75%);
      background-size:200% 100%; animation:shimmer 1.4s infinite;
    }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    .empty-state { text-align:center; padding:3rem 1rem; }
    .empty-state i { font-size:3rem; color:#c4c4d4; display:block; margin-bottom:1rem; }
    .empty-state p { font-size:1rem; font-weight:600; color:#555; margin:0 0 .25rem; }
    .empty-state span { font-size:.78rem; color:#9090aa; }

    .coupons-list { padding:.75rem 1rem; display:flex; flex-direction:column; gap:1rem; }

    .coupon-card {
      background:#fff; border-radius:16px; overflow:hidden;
      box-shadow:0 4px 20px rgba(102,126,234,.1);
      border:2px solid rgba(102,126,234,.15);
    }
    .coupon--redeemed { opacity:.6; border-color:#d1d5db; }
    .coupon--expired { opacity:.5; border-color:#fca5a5; }

    .coupon-top {
      padding:1rem; display:flex; gap:1rem; align-items:center;
      background:linear-gradient(135deg,rgba(102,126,234,.04),rgba(118,75,162,.04));
    }
    .coupon-discount {
      width:72px; height:72px; border-radius:50%; flex-shrink:0;
      background:linear-gradient(135deg,#667eea,#764ba2);
      display:flex; flex-direction:column; align-items:center; justify-content:center;
      color:#fff;
    }
    .discount-value { font-size:1.3rem; font-weight:900; line-height:1; }
    .discount-label { font-size:.55rem; font-weight:600; opacity:.8; }

    .coupon-info { flex:1; min-width:0; }
    .coupon-info h3 { margin:0 0 .25rem; font-size:.95rem; font-weight:700; color:#1a1a2e; }
    .coupon-teacher, .coupon-library {
      margin:0; font-size:.75rem; color:#667eea;
      display:flex; align-items:center; gap:.25rem;
    }
    .coupon-library { color:#d97706; }

    .coupon-separator {
      position:relative; display:flex; align-items:center;
      height:24px; margin:0 -2px;
    }
    .circle {
      width:24px; height:24px; border-radius:50%; background:#f4f5fb;
      flex-shrink:0;
    }
    .circle-right { margin-right:-12px; }
    .circle-left { margin-left:-12px; }
    .dashed-line {
      flex:1; height:0; border-top:2px dashed #e0e0ee;
    }

    .coupon-bottom { padding:1rem; }
    .coupon-desc { margin:0 0 .75rem; font-size:.8rem; color:#555; line-height:1.4; }

    .coupon-code-box {
      display:flex; align-items:center; gap:.5rem;
      background:#f4f5fb; border:2px dashed rgba(102,126,234,.25);
      border-radius:12px; padding:.65rem 1rem;
      margin-bottom:.75rem;
    }
    .coupon-code {
      flex:1; font-size:1.2rem; font-weight:900; color:#667eea;
      letter-spacing:3px; font-family:monospace;
    }
    .btn-copy {
      width:40px; height:40px; border-radius:10px; border:none;
      background:rgba(102,126,234,.1); color:#667eea;
      cursor:pointer; display:flex; align-items:center; justify-content:center;
      font-size:.9rem;
    }

    .coupon-status-row {
      display:flex; justify-content:space-between; align-items:center;
    }
    .coupon-status {
      font-size:.72rem; font-weight:700; padding:.2rem .5rem; border-radius:8px;
    }
    .status-active { background:rgba(16,185,129,.1); color:#059669; }
    .status-redeemed { background:rgba(102,126,234,.1); color:#667eea; }
    .status-expired { background:rgba(239,68,68,.1); color:#dc2626; }
    .coupon-expiry { font-size:.7rem; color:#9090aa; display:flex; align-items:center; gap:.25rem; }
  `],
})
export class StudentCouponsComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly apiBase = environment.apis?.default?.url || '';

  loading = signal(true);
  coupons = signal<CouponDto[]>([]);

  async ngOnInit(): Promise<void> {
    try {
      const res = await this.http.get<CouponDto[]>(`${this.apiBase}/api/app/deal-coupon/my-active-coupons`).toPromise();
      this.coupons.set(res ?? []);
    } catch (e) { console.error(e); }
    finally { this.loading.set(false); }
  }

  copyCode(code: string): void {
    navigator.clipboard.writeText(code).catch(() => {});
  }

  getStatusClass(status: number): string {
    return 'coupon-status ' + (status === 0 ? 'status-active' : status === 1 ? 'status-redeemed' : 'status-expired');
  }
  getStatusLabel(status: number): string {
    return status === 0 ? 'فعّال · Active' : status === 1 ? 'مستخدم · Redeemed' : 'منتهي · Expired';
  }
  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('ar-SA');
  }
}
