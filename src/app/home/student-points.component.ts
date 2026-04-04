import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  imports: [CommonModule, FormsModule],
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
            <button class="share-btn contacts-btn" (click)="router.navigate(['/student/invite-friends'])">
              <i class="fas fa-address-book"></i> دعوة من جهات الاتصال · Invite from Contacts
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

        <!-- Redeem Modal -->
        @if (showRedeemModal() && redeemAdv()) {
          <div class="rdm-overlay" (click)="showRedeemModal.set(false)">
            <div class="rdm-card" (click)="$event.stopPropagation()">
              @if (redeemStep() === 'input') {
                <div class="rdm-icon"><i class="fas fa-coins"></i></div>
                <h3 class="rdm-title">استبدال النقاط · Redeem Points</h3>
                <p class="rdm-partner">عند <strong>{{ redeemAdv()!.name }}</strong></p>
                <div class="rdm-balance">
                  <span class="rdm-bal-num">{{ balance()?.balance ?? 0 }}</span>
                  <span class="rdm-bal-label">نقطة متاحة · Available</span>
                </div>
                <div class="rdm-input-wrap">
                  <label class="rdm-label">كم نقطة؟ · How many points?</label>
                  <div class="rdm-input-row">
                    <button class="rdm-adj" (click)="redeemAmount.set(Math.max(1, redeemAmount() - 1))">−</button>
                    <input type="number" class="rdm-input" [ngModel]="redeemAmount()" (ngModelChange)="redeemAmount.set($event)" min="1" [max]="balance()?.balance ?? 1" />
                    <button class="rdm-adj" (click)="redeemAmount.set(Math.min(balance()?.balance ?? 1, redeemAmount() + 1))">+</button>
                  </div>
                  <span class="rdm-equiv">= {{ redeemAmount() }} جنيه · {{ redeemAmount() }} EGP</span>
                </div>
                @if (redeemError()) { <div class="rdm-error"><i class="fas fa-exclamation-circle"></i> {{ redeemError() }}</div> }
                <div class="rdm-actions">
                  <button class="rdm-btn rdm-btn--cancel" (click)="showRedeemModal.set(false)">إلغاء · Cancel</button>
                  <button class="rdm-btn rdm-btn--next" (click)="confirmRedeemStep()"><i class="fas fa-arrow-left"></i> التالي · Next</button>
                </div>
              } @else {
                <div class="rdm-icon rdm-icon--confirm"><i class="fas fa-receipt"></i></div>
                <h3 class="rdm-title">تأكيد الاستبدال · Confirm</h3>
                <div class="rdm-summary">
                  <div class="rdm-sum-row"><span>النقاط</span><strong>{{ redeemAmount() }}</strong></div>
                  <div class="rdm-sum-row"><span>القيمة</span><strong>{{ redeemAmount() }} جنيه</strong></div>
                  <div class="rdm-sum-row"><span>الشريك</span><strong>{{ redeemAdv()!.name }}</strong></div>
                </div>
                @if (redeemError()) { <div class="rdm-error"><i class="fas fa-exclamation-circle"></i> {{ redeemError() }}</div> }
                <div class="rdm-actions">
                  <button class="rdm-btn rdm-btn--cancel" (click)="redeemStep.set('input')"><i class="fas fa-arrow-right"></i> رجوع</button>
                  <button class="rdm-btn rdm-btn--confirm" [disabled]="redeeming()" (click)="submitRedeem()">
                    @if (redeeming()) { <span class="rdm-spinner"></span> }
                    @else { <i class="fas fa-check"></i> }
                    تأكيد · Confirm
                  </button>
                </div>
              }
            </div>
          </div>
        }

        <!-- QR Voucher Overlay -->
        @if (showQr() && lastCouponCode()) {
          <div class="qr-overlay" (click)="closeQr()">
            <div class="qr-card" (click)="$event.stopPropagation()">
              <div class="qr-header">
                <i class="fas fa-check-circle"></i>
                <h3>تم إصدار القسيمة!</h3>
                <p class="en">Voucher issued!</p>
              </div>
              @if (qrDataUrl()) {
                <img [src]="qrDataUrl()" alt="QR Code" class="qr-img" />
              }
              <div class="qr-code-text">{{ lastCouponCode() }}</div>
              <p class="qr-hint">اعرض هذا الكود أو QR للشريك · Show this code or QR to the partner</p>
              <button class="qr-close-btn" (click)="closeQr()">إغلاق · Close</button>
            </div>
          </div>
        }

        <!-- Redeem Section -->
        @if ((balance()?.balance ?? 0) >= 1 && advertisers().length > 0) {
          <div class="section">
            <div class="section-title"><i class="fas fa-gift"></i> استبدل نقاطك · Redeem Points</div>
            <p class="redeem-hint">1 نقطة = 1 جنيه مصري · 1 point = 1 EGP</p>
            <button class="partners-link" (click)="router.navigate(['/partners'])">
              <i class="fas fa-map-marker-alt"></i> تعرّف على شركائنا · View Our Partners
            </button>
            @for (adv of advertisers(); track adv.id) {
              <div class="adv-card" (click)="openRedeem(adv)">
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
    .contacts-btn { background:linear-gradient(135deg,#667eea,#764ba2); }
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
    .partners-link {
      width:100%; padding:.6rem; border:none; border-radius:10px;
      background:rgba(102,126,234,.08); color:#667eea;
      font-size:.8rem; font-weight:600; cursor:pointer; margin-bottom:.5rem;
      display:flex; align-items:center; justify-content:center; gap:.4rem; min-height:44px;
    }
    /* ── Redeem Modal ── */
    .rdm-overlay {
      position:fixed; inset:0; z-index:99996; background:rgba(0,0,0,.45);
      backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center;
      padding:1.5rem; animation:fadeIn .2s ease;
    }
    .rdm-card {
      background:#fff; border-radius:20px; width:100%; max-width:340px;
      padding:1.5rem; text-align:center;
      box-shadow:0 20px 60px rgba(0,0,0,.2); animation:slideUp .25s ease;
    }
    @keyframes fadeIn { from{opacity:0} to{opacity:1} }
    @keyframes slideUp { from{transform:translateY(30px);opacity:0} to{transform:translateY(0);opacity:1} }
    .rdm-icon {
      width:60px; height:60px; border-radius:50%; margin:0 auto .75rem;
      background:linear-gradient(135deg,#f59e0b,#d97706);
      display:flex; align-items:center; justify-content:center;
      font-size:1.5rem; color:#fff; box-shadow:0 4px 16px rgba(245,158,11,.3);
    }
    .rdm-icon--confirm { background:linear-gradient(135deg,#667eea,#764ba2); box-shadow:0 4px 16px rgba(102,126,234,.3); }
    .rdm-title { margin:0 0 .25rem; font-size:1.05rem; font-weight:800; color:#1a202c; }
    .rdm-partner { margin:0 0 .75rem; font-size:.85rem; color:#6b7280; strong { color:#1a202c; } }
    .rdm-balance {
      background:linear-gradient(135deg,rgba(102,126,234,.08),rgba(118,75,162,.08));
      border-radius:12px; padding:.6rem; margin-bottom:.75rem;
      display:flex; flex-direction:column; align-items:center;
    }
    .rdm-bal-num { font-size:1.8rem; font-weight:800; color:#667eea; }
    .rdm-bal-label { font-size:.72rem; color:#9ca3af; }
    .rdm-input-wrap { margin-bottom:.75rem; }
    .rdm-label { font-size:.75rem; font-weight:600; color:#555; display:block; margin-bottom:.4rem; }
    .rdm-input-row { display:flex; align-items:center; gap:.5rem; justify-content:center; }
    .rdm-adj {
      width:40px; height:40px; border-radius:12px; border:1.5px solid #e5e7eb;
      background:#fff; font-size:1.2rem; font-weight:700; color:#667eea;
      cursor:pointer; display:flex; align-items:center; justify-content:center;
    }
    .rdm-adj:active { background:#f3f4f6; }
    .rdm-input {
      width:80px; text-align:center; padding:.6rem; border:1.5px solid #e5e7eb;
      border-radius:12px; font-size:1.2rem; font-weight:800; color:#1a202c;
      font-family:inherit;
    }
    .rdm-input:focus { outline:none; border-color:#667eea; }
    .rdm-equiv { font-size:.78rem; color:#667eea; font-weight:600; display:block; margin-top:.3rem; }
    .rdm-error {
      background:rgba(239,68,68,.08); color:#dc2626; padding:.5rem; border-radius:8px;
      font-size:.78rem; margin-bottom:.5rem; display:flex; align-items:center; gap:.3rem;
      justify-content:center;
    }
    .rdm-summary {
      background:#f9fafb; border-radius:12px; padding:.75rem; margin-bottom:.75rem;
      display:flex; flex-direction:column; gap:.4rem;
    }
    .rdm-sum-row {
      display:flex; justify-content:space-between; font-size:.85rem;
      span { color:#6b7280; } strong { color:#1a202c; }
    }
    .rdm-actions { display:flex; gap:.5rem; }
    .rdm-btn {
      flex:1; padding:.7rem; border:none; border-radius:12px;
      font-size:.85rem; font-weight:700; cursor:pointer;
      display:flex; align-items:center; justify-content:center; gap:.35rem;
      min-height:48px; transition:transform .1s;
      -webkit-tap-highlight-color:transparent;
    }
    .rdm-btn:active { transform:scale(.97); }
    .rdm-btn:disabled { opacity:.5; }
    .rdm-btn--cancel { background:#f3f4f6; color:#4b5563; }
    .rdm-btn--next { background:linear-gradient(135deg,#f59e0b,#d97706); color:#fff; box-shadow:0 4px 12px rgba(245,158,11,.3); }
    .rdm-btn--confirm { background:linear-gradient(135deg,#667eea,#764ba2); color:#fff; box-shadow:0 4px 12px rgba(102,126,234,.3); }
    .rdm-spinner {
      width:14px; height:14px; border:2px solid rgba(255,255,255,.3);
      border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite;
    }

    .qr-overlay {
      position:fixed; inset:0; z-index:99997; background:rgba(15,15,35,.85);
      display:flex; align-items:center; justify-content:center; padding:20px;
    }
    .qr-card {
      background:white; border-radius:24px; padding:2rem 1.5rem; text-align:center;
      max-width:340px; width:100%; box-shadow:0 20px 60px rgba(0,0,0,.3);
    }
    .qr-header i { font-size:48px; color:#10b981; margin-bottom:.5rem; }
    .qr-header h3 { margin:0; font-size:1.1rem; color:#1a1a2e; }
    .qr-header .en { font-size:.8rem; color:#888; margin:.2rem 0 1rem; }
    .qr-img { width:200px; height:200px; margin:0 auto .75rem; display:block; }
    .qr-code-text {
      font-family:monospace; font-size:1.3rem; font-weight:800; color:#667eea;
      letter-spacing:3px; margin-bottom:.5rem;
    }
    .qr-hint { font-size:.75rem; color:#888; margin:0 0 1rem; }
    .qr-close-btn {
      width:100%; padding:.7rem; border:none; border-radius:12px;
      background:linear-gradient(135deg,#667eea,#764ba2); color:white;
      font-size:.9rem; font-weight:700; cursor:pointer; min-height:44px;
    }
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
  readonly Math = Math;

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
    const link = `https://sesha-9999.web.app/register?ref=${code}`;
    const text = `انضم لتطبيق KAI واستخدم كود الدعوة: ${code} للحصول على 5 نقاط مجانية!\nJoin KAI app and use referral code: ${code} to get 5 free points!\n${link}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'KAI - دعوة صديق', text, url: link });
      } else {
        navigator.clipboard?.writeText(text);
        this.copied.set(true);
        setTimeout(() => this.copied.set(false), 2000);
      }
    } catch { /* user cancelled share */ }
  }

  lastCouponCode = signal<string | null>(null);
  showQr = signal(false);

  // Redeem modal state
  showRedeemModal = signal(false);
  redeemAdv = signal<RedeemableAdvertiser | null>(null);
  redeemAmount = signal(1);
  redeemStep = signal<'input' | 'confirm'>('input');
  redeemError = signal<string | null>(null);
  redeeming = signal(false);

  openRedeem(adv: RedeemableAdvertiser): void {
    const bal = this.balance()?.balance ?? 0;
    if (bal < 1) {
      this.redeemError.set('تحتاج نقطة واحدة على الأقل · Need at least 1 point');
      return;
    }
    this.redeemAdv.set(adv);
    this.redeemAmount.set(1);
    this.redeemStep.set('input');
    this.redeemError.set(null);
    this.showRedeemModal.set(true);
  }

  confirmRedeemStep(): void {
    const bal = this.balance()?.balance ?? 0;
    const amt = this.redeemAmount();
    if (isNaN(amt) || amt < 1 || amt > bal) {
      this.redeemError.set('عدد نقاط غير صالح · Invalid points amount');
      return;
    }
    this.redeemError.set(null);
    this.redeemStep.set('confirm');
  }

  async submitRedeem(): Promise<void> {
    const adv = this.redeemAdv();
    if (!adv) return;
    this.redeeming.set(true);
    this.redeemError.set(null);
    try {
      const couponCode = await lastValueFrom(
        this.rest.request<any, string>({
          method: 'POST',
          url: '/api/app/student-points/redeem-points',
          body: { advertiserId: adv.id, pointsToSpend: this.redeemAmount() },
        })
      );
      this.showRedeemModal.set(false);
      this.lastCouponCode.set(couponCode);
      this.showQr.set(true);
      this.generateQrCode(couponCode);
      this.ngOnInit();
    } catch (e: any) {
      this.redeemError.set(e?.error?.error?.message || 'حدث خطأ · Error');
    } finally {
      this.redeeming.set(false);
    }
  }

  qrDataUrl = signal<string>('');

  private async generateQrCode(code: string): Promise<void> {
    try {
      const QRCode = await import('qrcode');
      const dataUrl = await QRCode.toDataURL(code, { width: 250, margin: 2 });
      this.qrDataUrl.set(dataUrl);
    } catch { /* qrcode lib not available */ }
  }

  closeQr(): void {
    this.showQr.set(false);
    this.lastCouponCode.set(null);
    this.qrDataUrl.set('');
  }
}
