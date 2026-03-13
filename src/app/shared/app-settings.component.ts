import { CommonModule, Location } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { lastValueFrom } from 'rxjs';
import { CurrentUserInfoService } from '@proxy/common';
import { BiometricService } from './services/biometric.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page" dir="rtl">

      <!-- Header -->
      <div class="page-header">
        <div class="blob b1"></div>
        <div class="blob b2"></div>
        <div class="header-row">
          <button class="btn-back" (click)="goBack()">
            <i class="fas fa-arrow-right"></i>
          </button>
          <div class="header-text">
            <h1>إعدادات التطبيق</h1>
            <p>App Settings</p>
          </div>
          <div class="header-icon">
            <i class="fas fa-cog"></i>
          </div>
        </div>
      </div>

      <!-- Biometric Security -->
      <div class="section">
        <div class="section-title"><i class="fas fa-fingerprint"></i> الأمان · Security</div>
        <div class="bio-card">
          <div class="bio-row">
            <div class="bio-icon" [class.bio-icon--on]="biometricEnabled()">
              <i class="fas fa-fingerprint"></i>
            </div>
            <div class="bio-info">
              <span class="bio-label">تسجيل الدخول بالبصمة</span>
              <span class="bio-label-en">Biometric Login</span>
              <span class="bio-sub">{{ biometricEnabled() ? 'مفعّل · Enabled' : 'معطّل · Disabled' }}</span>
            </div>
            @if (biometricAvailable()) {
              <button class="bio-toggle" [class.bio-toggle--on]="biometricEnabled()"
                      (click)="biometricEnabled() ? disableBiometric() : showEnableForm.set(true)"
                      [disabled]="biometricBusy()">
                <span class="bio-knob"></span>
              </button>
            }
          </div>

          @if (!biometricAvailable()) {
            <div class="bio-unavailable">
              <i class="fas fa-info-circle"></i>
              <span>البصمة غير متاحة على هذا الجهاز · Biometric not available on this device</span>
            </div>
          }

          @if (showEnableForm() && !biometricEnabled()) {
            <div class="bio-form">
              <p class="bio-form-hint">
                <i class="fas fa-info-circle"></i>
                أدخل كلمة المرور الحالية لحفظها بشكل آمن وتفعيل تسجيل الدخول بالبصمة
              </p>
              <p class="bio-form-hint-en">Enter your password to enable biometric login</p>
              <input class="bio-input" type="password" [(ngModel)]="enablePassword"
                     placeholder="كلمة المرور · Password" autocomplete="current-password" />
              <div class="bio-form-actions">
                <button class="bio-cancel-btn" (click)="showEnableForm.set(false); enablePassword = ''">
                  إلغاء · Cancel
                </button>
                <button class="bio-save-btn" (click)="enableBiometric()" [disabled]="biometricBusy() || !enablePassword">
                  @if (biometricBusy()) { <i class="fas fa-spinner fa-spin"></i> }
                  @else { <i class="fas fa-check"></i> }
                  تفعيل · Enable
                </button>
              </div>
              @if (biometricMsg()) {
                <p class="bio-msg" [class.bio-msg--error]="biometricError()">{{ biometricMsg() }}</p>
              }
            </div>
          }

          @if (biometricEnabled() && biometricMsg()) {
            <p class="bio-msg" [class.bio-msg--error]="biometricError()">{{ biometricMsg() }}</p>
          }
        </div>
      </div>

      <!-- App Info -->
      <div class="section">
        <div class="section-title"><i class="fas fa-info-circle"></i> عن التطبيق · About</div>
        <div class="info-card">
          <div class="info-row">
            <span class="info-key">اسم التطبيق · App Name</span>
            <span class="info-val">KAI</span>
          </div>
          <div class="info-row">
            <span class="info-key">الإصدار · Version</span>
            <span class="info-val">1.0.0</span>
          </div>
          <div class="info-row">
            <span class="info-key">المطور · Developer</span>
            <span class="info-val">SwiftMind</span>
          </div>
        </div>
      </div>

      <div style="height:calc(80px + env(safe-area-inset-bottom,0px))"></div>
    </div>
  `,
  styles: [`
    .page { min-height:100vh; background:#f4f5fb; direction:rtl; }

    .page-header {
      background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);
      padding:calc(env(safe-area-inset-top,0px) + 1.25rem) 1.25rem 2rem;
      position:relative; overflow:hidden;
    }
    .blob { position:absolute; border-radius:50%; background:rgba(255,255,255,.07); pointer-events:none; }
    .b1 { width:200px; height:200px; top:-70px; right:-60px; }
    .b2 { width:140px; height:140px; bottom:-50px; left:-30px; }

    .header-row {
      position:relative; z-index:1;
      display:flex; align-items:center; gap:1rem;
    }
    .btn-back {
      width:40px; height:40px; border-radius:12px;
      background:rgba(255,255,255,.15); border:1px solid rgba(255,255,255,.25);
      color:#fff; font-size:1rem; cursor:pointer;
      display:flex; align-items:center; justify-content:center;
      flex-shrink:0;
    }
    .header-text { flex:1; }
    .header-text h1 { margin:0; font-size:1.4rem; font-weight:800; color:#fff; }
    .header-text p { margin:.15rem 0 0; font-size:.82rem; color:rgba(255,255,255,.7); }
    .header-icon {
      width:48px; height:48px; border-radius:14px;
      background:rgba(255,255,255,.15);
      display:flex; align-items:center; justify-content:center;
      color:rgba(255,255,255,.9); font-size:1.3rem; flex-shrink:0;
    }

    .section { padding:1rem 1rem 0; }
    .section-title {
      display:flex; align-items:center; gap:.5rem; font-size:.8rem; font-weight:700;
      color:#555; text-transform:uppercase; letter-spacing:.05em; margin-bottom:.75rem;
    }
    .section-title i { color:#667eea; font-size:.85rem; }

    /* ── Biometric ── */
    .bio-card {
      background:#fff; border-radius:16px; border:1.5px solid #f0f0f0;
      overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,.04);
    }
    .bio-row { display:flex; align-items:center; gap:.875rem; padding:.875rem; }
    .bio-icon {
      width:44px; height:44px; border-radius:12px; flex-shrink:0;
      background:rgba(156,163,175,.12); color:#9ca3af;
      display:flex; align-items:center; justify-content:center; font-size:1.2rem;
      transition:background .25s, color .25s;
    }
    .bio-icon--on { background:rgba(102,126,234,.12); color:#667eea; }
    .bio-info { flex:1; min-width:0; }
    .bio-label { display:block; font-size:.92rem; font-weight:700; color:#1a1a2e; }
    .bio-label-en { display:block; font-size:.72rem; color:#9090aa; }
    .bio-sub { display:block; font-size:.72rem; color:#9090aa; margin-top:.15rem; }
    .bio-toggle {
      position:relative; width:48px; height:28px; border-radius:14px;
      background:#d1d5db; border:none; cursor:pointer; padding:0; flex-shrink:0;
      transition:background .25s; outline:none;
      -webkit-tap-highlight-color:transparent;
    }
    .bio-toggle--on { background:linear-gradient(135deg,#667eea,#764ba2); }
    .bio-toggle:disabled { opacity:.5; cursor:not-allowed; }
    .bio-knob {
      position:absolute; top:3px; right:3px; width:22px; height:22px;
      border-radius:50%; background:#fff; box-shadow:0 1px 4px rgba(0,0,0,.25);
      transition:transform .25s;
    }
    .bio-toggle--on .bio-knob { transform:translateX(-20px); }
    .bio-unavailable {
      padding:.75rem .875rem; border-top:1px solid #f0f0f0;
      display:flex; align-items:center; gap:.5rem;
      font-size:.78rem; color:#9ca3af;
    }
    .bio-unavailable i { color:#d1d5db; flex-shrink:0; }
    .bio-form {
      border-top:1px solid #f0f0f0; padding:.875rem;
      display:flex; flex-direction:column; gap:.6rem;
    }
    .bio-form-hint {
      font-size:.78rem; color:#555; margin:0;
      display:flex; align-items:flex-start; gap:.35rem; line-height:1.4;
    }
    .bio-form-hint i { color:#667eea; margin-top:.1rem; flex-shrink:0; }
    .bio-form-hint-en { font-size:.7rem; color:#9090aa; margin:0; }
    .bio-input {
      width:100%; padding:.65rem .75rem; border-radius:10px;
      border:1.5px solid #e5e7eb; font-size:.9rem; outline:none;
      box-sizing:border-box; direction:ltr; text-align:left;
      transition:border-color .2s;
    }
    .bio-input:focus { border-color:#667eea; }
    .bio-form-actions { display:flex; gap:.5rem; }
    .bio-cancel-btn {
      flex:1; padding:.65rem; border-radius:10px; border:1.5px solid #e5e7eb;
      background:#fff; color:#555; font-size:.82rem; font-weight:600; cursor:pointer;
      min-height:44px;
    }
    .bio-save-btn {
      flex:1; padding:.65rem; border-radius:10px; border:none;
      background:linear-gradient(135deg,#667eea,#764ba2);
      color:#fff; font-size:.82rem; font-weight:700; cursor:pointer;
      display:flex; align-items:center; justify-content:center; gap:.35rem;
      min-height:44px;
    }
    .bio-save-btn:disabled { opacity:.5; cursor:not-allowed; }
    .bio-msg {
      font-size:.78rem; color:#059669; font-weight:600; margin:0;
      padding:.5rem .75rem; background:rgba(16,185,129,.08); border-radius:8px;
    }
    .bio-msg--error { color:#dc2626; background:rgba(239,68,68,.08); }

    /* ── Info card ── */
    .info-card {
      background:#fff; border-radius:16px; border:1.5px solid #f0f0f0;
      overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,.04);
    }
    .info-row {
      display:flex; justify-content:space-between; align-items:center;
      padding:.75rem .875rem; border-bottom:1px solid #f8f8fc;
    }
    .info-row:last-child { border-bottom:none; }
    .info-key { font-size:.82rem; color:#555; }
    .info-val { font-size:.85rem; font-weight:700; color:#1a1a2e; }
  `],
})
export class AppSettingsComponent implements OnInit {
  private readonly location = inject(Location);
  private readonly currentUserSvc = inject(CurrentUserInfoService);
  private readonly biometricSvc = inject(BiometricService);

  biometricAvailable = signal(false);
  biometricEnabled   = signal(false);
  biometricBusy      = signal(false);
  biometricMsg       = signal('');
  biometricError     = signal(false);
  showEnableForm     = signal(false);
  enablePassword     = '';

  private userName = '';
  private userEmail = '';

  async ngOnInit(): Promise<void> {
    try {
      const info = await lastValueFrom(this.currentUserSvc.getCurrentUserActorInfo());
      this.userName = info?.userName || '';
      this.userEmail = info?.email || '';
    } catch { /* silent */ }

    const available = await this.biometricSvc.isAvailable();
    this.biometricAvailable.set(available);
    if (available) {
      this.biometricEnabled.set(await this.biometricSvc.hasStoredCredentials());
    }
  }

  async enableBiometric(): Promise<void> {
    if (!this.enablePassword) return;
    this.biometricBusy.set(true);
    this.biometricMsg.set('');
    try {
      const verified = await this.biometricSvc.authenticate();
      if (!verified) {
        this.biometricError.set(true);
        this.biometricMsg.set('فشل التحقق بالبصمة · Biometric verification failed');
        return;
      }
      const username = this.userName || this.userEmail || '';
      await this.biometricSvc.saveCredentials(username, this.enablePassword);
      this.biometricEnabled.set(true);
      this.showEnableForm.set(false);
      this.enablePassword = '';
      this.biometricError.set(false);
      this.biometricMsg.set('تم تفعيل تسجيل الدخول بالبصمة · Biometric login enabled');
      setTimeout(() => this.biometricMsg.set(''), 3000);
    } catch {
      this.biometricError.set(true);
      this.biometricMsg.set('حدث خطأ · Something went wrong');
    } finally {
      this.biometricBusy.set(false);
    }
  }

  async disableBiometric(): Promise<void> {
    this.biometricBusy.set(true);
    this.biometricMsg.set('');
    try {
      await this.biometricSvc.clearCredentials();
      this.biometricEnabled.set(false);
      this.biometricError.set(false);
      this.biometricMsg.set('تم إلغاء تفعيل البصمة · Biometric login disabled');
      setTimeout(() => this.biometricMsg.set(''), 3000);
    } catch {
      this.biometricError.set(true);
      this.biometricMsg.set('حدث خطأ · Something went wrong');
    } finally {
      this.biometricBusy.set(false);
    }
  }

  goBack(): void {
    this.location.back();
  }
}
