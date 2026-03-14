import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { environment } from '../../environments/environment';

interface SettlementDto {
  advertisementId: string;
  advertisementTitle: string;
  advertiserName?: string;
  teacherName: string;
  totalCouponsIssued: number;
  totalRedemptions: number;
  totalDiscountGiven: number;
}

@Component({
  selector: 'app-deal-settlement',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page" dir="rtl">
      <div class="page-header">
        <div class="blob b1"></div>
        <div class="blob b2"></div>
        <div class="header-content">
          <h1><i class="fas fa-file-invoice-dollar"></i> تقرير التسويات</h1>
          <p>Deal Settlement Report</p>
        </div>
      </div>

      @if (loading()) {
        <div class="shimmer-area">
          @for (i of [1,2]; track i) { <div class="shimmer-card"></div> }
        </div>
      }

      @if (!loading()) {
        <!-- Summary -->
        <div class="stats-row">
          <div class="stat-card">
            <div class="stat-icon" style="background:rgba(102,126,234,.12);color:#667eea">
              <i class="fas fa-ticket-alt"></i>
            </div>
            <div class="stat-value">{{ totalCoupons() }}</div>
            <div class="stat-label">كوبونات صادرة</div>
            <div class="stat-sub">Issued</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background:rgba(16,185,129,.12);color:#059669">
              <i class="fas fa-check-double"></i>
            </div>
            <div class="stat-value">{{ totalRedeemed() }}</div>
            <div class="stat-label">مستبدلة</div>
            <div class="stat-sub">Redeemed</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background:rgba(245,158,11,.12);color:#d97706">
              <i class="fas fa-coins"></i>
            </div>
            <div class="stat-value">{{ totalDiscount() }}</div>
            <div class="stat-label">إجمالي الخصومات</div>
            <div class="stat-sub">Total Discount</div>
          </div>
        </div>

        @if (settlements().length === 0) {
          <div class="empty-state">
            <i class="fas fa-file-invoice"></i>
            <p>لا توجد عروض مشتركة بعد</p>
            <span>No deals to settle</span>
          </div>
        }

        <div class="list">
          @for (s of settlements(); track s.advertisementId) {
            <div class="settlement-card">
              <div class="card-header">
                <h3>{{ s.advertisementTitle }}</h3>
              </div>
              <div class="card-body">
                <div class="info-row">
                  <span class="info-key"><i class="fas fa-chalkboard-teacher"></i> المعلم</span>
                  <span class="info-val">{{ s.teacherName }}</span>
                </div>
                @if (s.advertiserName) {
                  <div class="info-row">
                    <span class="info-key"><i class="fas fa-store"></i> الشريك</span>
                    <span class="info-val">{{ s.advertiserName }}</span>
                  </div>
                }
                <div class="info-row">
                  <span class="info-key"><i class="fas fa-ticket-alt"></i> كوبونات صادرة</span>
                  <span class="info-val">{{ s.totalCouponsIssued }}</span>
                </div>
                <div class="info-row">
                  <span class="info-key"><i class="fas fa-check-circle"></i> مستبدلة</span>
                  <span class="info-val highlight">{{ s.totalRedemptions }}</span>
                </div>
                <div class="info-row">
                  <span class="info-key"><i class="fas fa-coins"></i> إجمالي الخصومات</span>
                  <span class="info-val amount">{{ s.totalDiscountGiven }} ر.س</span>
                </div>
              </div>
              <div class="card-footer">
                <div class="progress-bar">
                  <div class="progress-fill" [style.width.%]="s.totalCouponsIssued > 0 ? (s.totalRedemptions / s.totalCouponsIssued * 100) : 0"></div>
                </div>
                <span class="progress-label">نسبة الاستبدال: {{ s.totalCouponsIssued > 0 ? (s.totalRedemptions / s.totalCouponsIssued * 100).toFixed(0) : 0 }}%</span>
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
    .header-content h1 { margin:0; font-size:1.3rem; font-weight:800; color:#fff; display:flex; align-items:center; gap:.5rem; }
    .header-content p { margin:.1rem 0 0; font-size:.78rem; color:rgba(255,255,255,.7); }

    .shimmer-area { padding:1rem; display:flex; flex-direction:column; gap:.75rem; }
    .shimmer-card { height:140px; border-radius:16px; background:linear-gradient(90deg,#e8e8f0 25%,#f0f0f8 50%,#e8e8f0 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    .stats-row { display:flex; gap:.5rem; padding:1rem 1rem 0; }
    .stat-card {
      flex:1; background:#fff; border-radius:14px; padding:.75rem .5rem;
      text-align:center; box-shadow:0 2px 8px rgba(0,0,0,.04);
      display:flex; flex-direction:column; align-items:center; gap:.2rem;
    }
    .stat-icon { width:36px; height:36px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:.9rem; }
    .stat-value { font-size:1.3rem; font-weight:800; color:#1a1a2e; }
    .stat-label { font-size:.65rem; font-weight:600; color:#555; }
    .stat-sub { font-size:.55rem; color:#9090aa; }

    .empty-state { text-align:center; padding:2rem 1rem; }
    .empty-state i { font-size:2.5rem; color:#c4c4d4; display:block; margin-bottom:.75rem; }
    .empty-state p { font-size:.9rem; font-weight:600; color:#555; margin:0 0 .25rem; }
    .empty-state span { font-size:.78rem; color:#9090aa; }

    .list { padding:.75rem 1rem; display:flex; flex-direction:column; gap:.75rem; }
    .settlement-card {
      background:#fff; border-radius:16px; border:1.5px solid #f0f0f0;
      overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,.05);
    }
    .card-header {
      padding:.875rem 1rem; background:linear-gradient(135deg,rgba(102,126,234,.04),rgba(118,75,162,.04));
      border-bottom:1px solid #f0f0f0;
    }
    .card-header h3 { margin:0; font-size:.95rem; font-weight:700; color:#1a1a2e; }
    .card-body { padding:.75rem 1rem; }
    .info-row {
      display:flex; justify-content:space-between; align-items:center;
      padding:.35rem 0; font-size:.82rem;
    }
    .info-key { color:#9090aa; display:flex; align-items:center; gap:.35rem; }
    .info-key i { font-size:.75rem; color:#667eea; }
    .info-val { font-weight:600; color:#1a1a2e; }
    .info-val.highlight { color:#059669; }
    .info-val.amount { color:#d97706; font-size:.95rem; font-weight:800; }

    .card-footer { padding:.75rem 1rem; border-top:1px solid #f0f0f0; }
    .progress-bar {
      height:6px; border-radius:3px; background:#f0f0f8; overflow:hidden; margin-bottom:.35rem;
    }
    .progress-fill {
      height:100%; border-radius:3px;
      background:linear-gradient(135deg,#667eea,#764ba2);
      transition:width .3s;
    }
    .progress-label { font-size:.7rem; color:#9090aa; }
  `],
})
export class DealSettlementComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly apiBase = environment.apis?.default?.url || '';

  loading = signal(true);
  settlements = signal<SettlementDto[]>([]);

  totalCoupons = () => this.settlements().reduce((s, d) => s + d.totalCouponsIssued, 0);
  totalRedeemed = () => this.settlements().reduce((s, d) => s + d.totalRedemptions, 0);
  totalDiscount = () => this.settlements().reduce((s, d) => s + d.totalDiscountGiven, 0);

  async ngOnInit(): Promise<void> {
    try {
      const res = await this.http.get<SettlementDto[]>(
        `${this.apiBase}/api/app/deal-coupon/settlement-report`
      ).toPromise();
      this.settlements.set(res ?? []);
    } catch (e) { console.error(e); }
    finally { this.loading.set(false); }
  }
}
