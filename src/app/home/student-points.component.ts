import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { RestService } from '@abp/ng.core';
import { lastValueFrom } from 'rxjs';
import { Clipboard } from '@angular/cdk/clipboard';

interface PointsBalance {
  studentId: string;
  totalEarned: number;
  totalSpent: number;
  balance: number;
  referralCode: string;
}

interface PointTransaction {
  id: string;
  amount: number;
  type: number;
  description: string;
  descriptionEn?: string;
  creationTime: string;
}

interface ReferralInfo {
  referralCode: string;
  successfulReferrals: number;
  totalReferralPoints: number;
}

interface RedeemableAdvertiser {
  id: string;
  name: string;
  nameEn?: string;
  logoUrl?: string;
  type: number;
  address?: string;
}

@Component({
  selector: 'app-student-points',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page" dir="rtl">

      <!-- Header -->
      <div class="page-header">
        <button class="back-btn" (click)="router.navigate(['/student'])">
          <i class="fas fa-arrow-right"></i>
        </button>
        <div class="header-text">
          <span class="header-title">نقاطي ومكافآتي · My Points & Rewards</span>
          <span class="header-sub">اكسب نقاط واستبدلها بخصومات</span>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-area">
          <div class="sk-card"></div><div class="sk-card sk-sm"></div><div class="sk-card"></div>
        </div>
      }

      @if (!loading()) {

        <!-- Balance Card -->
        <div class="balance-card">
          <div class="balance-icon"><i class="fas fa-trophy"></i></div>
          <div class="balance-number">{{ balance()?.balance ?? 0 }}</div>
          <div class="balance-label">نقطة متاحة · Available Points</div>
          <div class="balance-stats">
            <div class="stat"><span class="stat-val">{{ balance()?.totalEarned ?? 0 }}</span><span class="stat-lbl">مكتسبة</span></div>
            <div class="stat-divider"></div>
            <div class="stat"><span class="stat-val">{{ balance()?.totalSpent ?? 0 }}</span><span class="stat-lbl">مستخدمة</span></div>
          </div>
        </div>

        <!-- Referral Section -->
        <div class="section">
          <div class="section-title"><i class="fas fa-user-plus"></i> دعوة الأصدقاء · Invite Friends</div>
          <div class="referral-card">
            <p class="ref-hint">شارك كود الدعوة مع أصدقائك واحصل على 10 نقاط لكل صديق يسجل!</p>
            <p class="ref-hint-en">Share your code and earn 10 points per friend who registers!</p>
            <div class="ref-code-box">
              <span class="ref-code">{{ balance()?.referralCode }}</span>
              <button class="copy-btn" (click)="copyCode()">
                <i class="fas fa-copy"></i> {{ copied() ? 'تم النسخ!' : 'نسخ' }}
              </button>
            </div>
            <button class="share-btn" (click)="shareCode()">
              <i class="fas fa-share-alt"></i> مشاركة الكود · Share Code
            </button>
            @if (referral()) {
              <div class="ref-stats">
                <div class="ref-stat">
                  <span class="ref-num">{{ referral()!.successfulReferrals }}</span>
                  <span class="ref-lbl">أصدقاء انضموا · Friends joined</span>
                </div>
                <div class="ref-stat">
                  <span class="ref-num">{{ referral()!.totalReferralPoints }}</span>
                  <span class="ref-lbl">نقاط من الدعوات · Referral points</span>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- How to Earn -->
        <div class="section">
          <div class="section-title"><i class="fas fa-star"></i> كيف تكسب نقاط · How to Earn</div>
          <div class="earn-grid">
            <div class="earn-card">
              <div class="earn-icon" style="background:rgba(16,185,129,.12);color:#059669"><i class="fas fa-user-check"></i></div>
              <span class="earn-pts">+10</span>
              <span class="earn-lbl">التسجيل</span>
              <span class="earn-lbl-en">Register</span>
            </div>
            <div class="earn-card">
              <div class="earn-icon" style="background:rgba(102,126,234,.12);color:#667eea"><i class="fas fa-user-plus"></i></div>
              <span class="earn-pts">+10</span>
              <span class="earn-lbl">دعوة صديق</span>
              <span class="earn-lbl-en">Refer friend</span>
            </div>
            <div class="earn-card">
              <div class="earn-icon" style="background:rgba(245,158,11,.12);color:#d97706"><i class="fas fa-book-open"></i></div>
              <span class="earn-pts">+5</span>
              <span class="earn-lbl">تسجيل مقرر</span>
              <span class="earn-lbl-en">Enroll</span>
            </div>
            <div class="earn-card">
              <div class="earn-icon" style="background:rgba(118,75,162,.12);color:#764ba2"><i class="fas fa-gift"></i></div>
              <span class="earn-pts">+5</span>
              <span class="earn-lbl">صديق جديد</span>
              <span class="earn-lbl-en">Referred bonus</span>
            </div>
          </div>
        </div>

        <!-- Achievements -->
        <div class="section">
          <div class="section-title"><i class="fas fa-medal"></i> إنجازاتي · Achievements</div>
          <div class="achievements">
            <div class="badge-card" [class.badge-earned]="(balance()?.totalEarned ?? 0) > 0">
              <div class="badge-icon"><i class="fas fa-seedling"></i></div>
              <span class="badge-name">المبتدئ</span>
              <span class="badge-req">سجّل في التطبيق</span>
            </div>
            <div class="badge-card" [class.badge-earned]="(referral()?.successfulReferrals ?? 0) >= 3">
              <div class="badge-icon"><i class="fas fa-bullhorn"></i></div>
              <span class="badge-name">السفير</span>
              <span class="badge-req">3+ دعوات</span>
            </div>
            <div class="badge-card" [class.badge-earned]="(balance()?.totalEarned ?? 0) >= 100">
              <div class="badge-icon"><i class="fas fa-crown"></i></div>
              <span class="badge-name">النجم</span>
              <span class="badge-req">100+ نقطة</span>
            </div>
          </div>
        </div>

        <!-- Redeem Section -->
        @if ((balance()?.balance ?? 0) >= 10 && advertisers().length > 0) {
          <div class="section">
            <div class="section-title"><i class="fas fa-gift"></i> استبدل نقاطك · Redeem Points</div>
            <p class="redeem-hint">كل 10 نقاط = خصم 10% · Every 10 points = 10% discount</p>
            @for (adv of advertisers(); track adv.id) {
              <div class="adv-card" (click)="redeemAt(adv)">
                <div class="adv-avatar"><i class="fas fa-store"></i></div>
                <div class="adv-info">
                  <span class="adv-name">{{ adv.name }}</span>
                  @if (adv.address) { <span class="adv-addr"><i class="fas fa-map-marker-alt"></i> {{ adv.address }}</span> }
                </div>
                <button class="adv-btn"><i class="fas fa-exchange-alt"></i></button>
              </div>
            }
          </div>
        }

        <!-- Transaction History -->
        <div class="section">
          <div class="section-title"><i class="fas fa-history"></i> سجل النقاط · History</div>
          @if (transactions().length === 0) {
            <div class="empty-state">
              <i class="fas fa-receipt"></i>
              <p>لا توجد معاملات بعد</p>
            </div>
          }
          @for (tx of transactions(); track tx.id) {
            <div class="tx-row">
              <div class="tx-icon" [class.tx-earn]="tx.amount > 0" [class.tx-spend]="tx.amount < 0">
                <i [class]="tx.amount > 0 ? 'fas fa-plus' : 'fas fa-minus'"></i>
              </div>
              <div class="tx-info">
                <span class="tx-desc">{{ tx.description }}</span>
                <span class="tx-date">{{ tx.creationTime | date:'yyyy-MM-dd HH:mm' }}</span>
              </div>
              <span class="tx-amount" [class.tx-earn]="tx.amount > 0" [class.tx-spend]="tx.amount < 0">
                {{ tx.amount > 0 ? '+' : '' }}{{ tx.amount }}
              </span>
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
      padding:calc(env(safe-area-inset-top,0px) + 1rem) 1rem 1.25rem;
      display:flex; align-items:center; gap:.75rem;
    }
    .back-btn {
      background:rgba(255,255,255,.15); border:1px solid rgba(255,255,255,.25);
      color:#fff; width:40px; height:40px; border-radius:12px;
      display:flex; align-items:center; justify-content:center; cursor:pointer;
    }
    .header-text { display:flex; flex-direction:column; }
    .header-title { font-size:1.05rem; font-weight:800; color:#fff; }
    .header-sub { font-size:.72rem; color:rgba(255,255,255,.7); }

    .loading-area { padding:1rem; display:flex; flex-direction:column; gap:.5rem; }
    .sk-card { height:100px; border-radius:14px; background:linear-gradient(90deg,#e8e8f0 25%,#f0f0f8 50%,#e8e8f0 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; }
    .sk-sm { height:60px; }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    .balance-card {
      margin:1rem; padding:1.5rem 1rem; border-radius:18px;
      background:linear-gradient(135deg,#667eea,#764ba2);
      text-align:center; color:#fff; position:relative; overflow:hidden;
    }
    .balance-icon { font-size:2rem; margin-bottom:.5rem; opacity:.9; }
    .balance-number { font-size:3rem; font-weight:900; line-height:1; }
    .balance-label { font-size:.82rem; opacity:.8; margin-top:.25rem; }
    .balance-stats {
      display:flex; justify-content:center; gap:1.5rem; margin-top:1rem;
      padding-top:.75rem; border-top:1px solid rgba(255,255,255,.2);
    }
    .stat { display:flex; flex-direction:column; align-items:center; }
    .stat-val { font-size:1.1rem; font-weight:800; }
    .stat-lbl { font-size:.68rem; opacity:.7; }
    .stat-divider { width:1px; background:rgba(255,255,255,.2); }

    .section { padding:1rem 1rem 0; }
    .section-title {
      display:flex; align-items:center; gap:.5rem;
      font-size:.8rem; font-weight:700; color:#555; text-transform:uppercase;
      letter-spacing:.05em; margin-bottom:.75rem;
    }
    .section-title i { color:#667eea; }

    .referral-card {
      background:#fff; border-radius:14px; border:1.5px solid #e0e0f0;
      padding:1rem; text-align:center;
    }
    .ref-hint { font-size:.82rem; font-weight:600; color:#374151; margin:0 0 .15rem; }
    .ref-hint-en { font-size:.72rem; color:#9090aa; margin:0 0 .75rem; }
    .ref-code-box {
      display:flex; align-items:center; justify-content:center; gap:.5rem;
      background:rgba(102,126,234,.06); padding:.6rem; border-radius:12px; margin-bottom:.5rem;
    }
    .ref-code { font-size:1.3rem; font-weight:900; color:#667eea; letter-spacing:.1em; font-family:monospace; }
    .copy-btn {
      background:#667eea; color:#fff; border:none; padding:.4rem .7rem;
      border-radius:8px; font-size:.72rem; font-weight:700; cursor:pointer;
      display:flex; align-items:center; gap:.25rem;
    }
    .share-btn {
      width:100%; padding:.7rem; border:none; border-radius:10px;
      background:linear-gradient(135deg,#10b981,#059669); color:#fff;
      font-size:.88rem; font-weight:700; cursor:pointer;
      display:flex; align-items:center; justify-content:center; gap:.4rem;
      min-height:44px; margin-bottom:.5rem;
    }
    .ref-stats { display:flex; gap:1rem; justify-content:center; margin-top:.5rem; }
    .ref-stat { display:flex; flex-direction:column; align-items:center; }
    .ref-num { font-size:1.2rem; font-weight:800; color:#667eea; }
    .ref-lbl { font-size:.65rem; color:#9090aa; }

    .earn-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:.5rem; }
    @media(max-width:380px) { .earn-grid { grid-template-columns:repeat(2,1fr); } }
    .earn-card {
      background:#fff; border-radius:12px; border:1.5px solid #e0e0f0;
      padding:.75rem .5rem; display:flex; flex-direction:column; align-items:center; gap:.25rem;
    }
    .earn-icon { width:36px; height:36px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:.9rem; }
    .earn-pts { font-size:.95rem; font-weight:900; color:#059669; }
    .earn-lbl { font-size:.65rem; font-weight:700; color:#1a1a2e; text-align:center; }
    .earn-lbl-en { font-size:.55rem; color:#9090aa; text-align:center; }

    .achievements { display:flex; gap:.5rem; overflow-x:auto; padding-bottom:.5rem; }
    .badge-card {
      min-width:100px; background:#fff; border-radius:12px; border:1.5px solid #e0e0f0;
      padding:.75rem; text-align:center; opacity:.4; flex-shrink:0;
    }
    .badge-earned { opacity:1; border-color:#f59e0b; }
    .badge-icon { font-size:1.5rem; color:#d4d4d4; margin-bottom:.25rem; }
    .badge-earned .badge-icon { color:#f59e0b; }
    .badge-name { display:block; font-size:.78rem; font-weight:700; color:#1a1a2e; }
    .badge-req { display:block; font-size:.6rem; color:#9090aa; margin-top:.15rem; }

    .redeem-hint { font-size:.75rem; color:#9090aa; margin:0 0 .5rem; }
    .adv-card {
      display:flex; align-items:center; gap:.75rem;
      background:#fff; border-radius:12px; border:1.5px solid #e0e0f0;
      padding:.75rem; margin-bottom:.5rem; cursor:pointer;
    }
    .adv-card:active { transform:scale(.98); }
    .adv-avatar {
      width:42px; height:42px; border-radius:50%;
      background:linear-gradient(135deg,#667eea,#764ba2);
      color:#fff; display:flex; align-items:center; justify-content:center; flex-shrink:0;
    }
    .adv-info { flex:1; min-width:0; }
    .adv-name { display:block; font-size:.88rem; font-weight:700; color:#1a1a2e; }
    .adv-addr { display:flex; align-items:center; gap:.25rem; font-size:.7rem; color:#9090aa; }
    .adv-addr i { color:#667eea; font-size:.6rem; }
    .adv-btn {
      width:36px; height:36px; border-radius:50%; border:1.5px solid #667eea;
      background:rgba(102,126,234,.08); color:#667eea;
      display:flex; align-items:center; justify-content:center; cursor:pointer;
    }

    .empty-state { text-align:center; padding:2rem 1rem; }
    .empty-state i { font-size:2rem; color:#ccc; display:block; margin-bottom:.5rem; }
    .empty-state p { font-size:.85rem; color:#999; margin:0; }

    .tx-row {
      display:flex; align-items:center; gap:.65rem;
      padding:.65rem 0; border-bottom:1px solid #f0f0f5;
    }
    .tx-row:last-child { border-bottom:none; }
    .tx-icon {
      width:32px; height:32px; border-radius:50%;
      display:flex; align-items:center; justify-content:center; font-size:.7rem; flex-shrink:0;
    }
    .tx-earn { background:rgba(16,185,129,.1); color:#059669; }
    .tx-spend { background:rgba(239,68,68,.08); color:#dc2626; }
    .tx-info { flex:1; min-width:0; }
    .tx-desc { display:block; font-size:.78rem; font-weight:600; color:#374151; }
    .tx-date { display:block; font-size:.65rem; color:#aaa; }
    .tx-amount { font-size:.95rem; font-weight:800; flex-shrink:0; }
  `],
})
export class StudentPointsComponent implements OnInit {
  private readonly rest = inject(RestService);
  readonly router = inject(Router);

  loading = signal(true);
  balance = signal<PointsBalance | null>(null);
  referral = signal<ReferralInfo | null>(null);
  transactions = signal<PointTransaction[]>([]);
  advertisers = signal<RedeemableAdvertiser[]>([]);
  copied = signal(false);

  async ngOnInit(): Promise<void> {
    try {
      const [bal, ref, txs, advs] = await Promise.all([
        lastValueFrom(this.rest.request<void, PointsBalance>({ method: 'GET', url: '/api/app/student-points/my-balance' })),
        lastValueFrom(this.rest.request<void, ReferralInfo>({ method: 'GET', url: '/api/app/student-points/my-referral-info' })),
        lastValueFrom(this.rest.request<void, PointTransaction[]>({ method: 'GET', url: '/api/app/student-points/my-transactions' })),
        lastValueFrom(this.rest.request<void, RedeemableAdvertiser[]>({ method: 'GET', url: '/api/app/student-points/redeemable-advertisers' })),
      ]);
      this.balance.set(bal);
      this.referral.set(ref);
      this.transactions.set(txs ?? []);
      this.advertisers.set(advs ?? []);
    } catch (e) { console.error(e); }
    finally { this.loading.set(false); }
  }

  copyCode(): void {
    const code = this.balance()?.referralCode;
    if (code) {
      navigator.clipboard?.writeText(code).catch(() => {});
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    }
  }

  async shareCode(): Promise<void> {
    const code = this.balance()?.referralCode;
    if (!code) return;
    const text = `انضم لتطبيق KAI واستخدم كود الدعوة: ${code} للحصول على 5 نقاط مجانية!\nJoin KAI app and use referral code: ${code} to get 5 free points!`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'KAI - دعوة صديق', text });
      } else {
        navigator.clipboard?.writeText(text);
        this.copied.set(true);
        setTimeout(() => this.copied.set(false), 2000);
      }
    } catch { /* user cancelled share */ }
  }

  async redeemAt(adv: RedeemableAdvertiser): Promise<void> {
    const bal = this.balance()?.balance ?? 0;
    if (bal < 10) {
      alert('تحتاج 10 نقاط على الأقل للاستبدال · Need at least 10 points');
      return;
    }
    const pts = prompt(`كم نقطة تريد استبدالها؟ (المتاح: ${bal})\nHow many points to redeem? (Available: ${bal})`);
    if (!pts) return;
    const amount = parseInt(pts, 10);
    if (isNaN(amount) || amount < 10 || amount > bal) {
      alert('عدد نقاط غير صالح · Invalid points amount');
      return;
    }
    try {
      const couponCode = await lastValueFrom(
        this.rest.request<any, string>({
          method: 'POST',
          url: '/api/app/student-points/redeem-points',
          body: { advertiserId: adv.id, pointsToSpend: amount },
        })
      );
      alert(`تم إصدار كوبون الخصم: ${couponCode}\nDiscount coupon issued: ${couponCode}`);
      // Refresh data
      this.ngOnInit();
    } catch (e: any) {
      alert(e?.error?.error?.message || 'حدث خطأ');
    }
  }
}
