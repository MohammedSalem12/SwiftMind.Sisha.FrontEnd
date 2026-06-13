import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { OAuthService } from 'angular-oauth2-oidc';
import { BiometricService } from '../services/biometric.service';

@Component({
  selector: 'app-biometric-lock',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="lock-overlay" dir="rtl">
      <div class="lock-card">
        <div class="lock-icon">
          <i class="fas fa-fingerprint"></i>
        </div>
        <h2>تحقق من هويتك</h2>
        <p class="en">Verify your identity</p>

        @if (error()) {
          <div class="error-msg">
            <i class="fas fa-exclamation-circle"></i>
            فشل التحقق، حاول مرة أخرى · Verification failed, try again
          </div>
        }

        <button class="verify-btn" (click)="verify()" [disabled]="verifying()">
          @if (verifying()) {
            <div class="spinner-sm"></div>
          } @else {
            <i class="fas fa-fingerprint"></i>
          }
          {{ verifying() ? 'جاري التحقق...' : 'تحقق الآن · Verify Now' }}
        </button>

        <button class="logout-btn" (click)="logout()">
          <i class="fas fa-sign-out-alt"></i> تسجيل الخروج · Logout
        </button>
      </div>
    </div>
  `,
  styles: [`
    .lock-overlay {
      position: fixed; inset: 0; z-index: 99998;
      background: rgba(15, 15, 35, .92);
      backdrop-filter: blur(20px);
      display: flex; align-items: center; justify-content: center;
      padding: 20px;
    }
    .lock-card {
      background: white; border-radius: 24px;
      padding: 40px 32px; text-align: center;
      width: 100%; max-width: 340px;
      box-shadow: 0 20px 60px rgba(0,0,0,.3);
    }
    .lock-icon {
      width: 80px; height: 80px; border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 20px; font-size: 36px; color: white;
    }
    h2 { margin: 0 0 4px; font-size: 20px; color: #1a1a2e; font-weight: 700; }
    .en { font-size: 14px; color: #888; margin: 0 0 20px; }
    .error-msg {
      background: rgba(239,68,68,.08); color: #dc2626;
      padding: 10px 14px; border-radius: 10px;
      font-size: 13px; margin-bottom: 16px;
      display: flex; align-items: center; gap: 8px; justify-content: center;
    }
    .verify-btn {
      width: 100%; padding: 14px; border: none; border-radius: 14px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white; font-size: 16px; font-weight: 700;
      cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px;
      min-height: 52px; margin-bottom: 12px;
    }
    .verify-btn:disabled { opacity: .7; cursor: not-allowed; }
    .verify-btn:active:not(:disabled) { opacity: .85; }
    .logout-btn {
      width: 100%; padding: 12px; border: 1px solid #e0e0e0;
      border-radius: 12px; background: transparent;
      color: #888; font-size: 14px; cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      min-height: 44px;
    }
    .logout-btn:active { background: #f5f5f5; }
    .spinner-sm {
      width: 20px; height: 20px; border: 2px solid rgba(255,255,255,.3);
      border-top-color: white; border-radius: 50%;
      animation: spin .7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class BiometricLockComponent {
  private readonly biometricService = inject(BiometricService);
  private readonly oauthService = inject(OAuthService);
  private readonly router = inject(Router);

  readonly verifying = signal(false);
  readonly error = signal(false);

  async verify(): Promise<void> {
    this.verifying.set(true);
    this.error.set(false);
    try {
      const success = await this.biometricService.authenticate();
      if (success) {
        this.biometricService.unlock();
      } else {
        this.error.set(true);
      }
    } catch {
      this.error.set(true);
    } finally {
      this.verifying.set(false);
    }
  }

  logout(): void {
    this.biometricService.unlock();
    this.oauthService.logOut(true);
    this.router.navigate(['/login']);
  }
}
