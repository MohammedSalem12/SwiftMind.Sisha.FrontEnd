import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RegisterModalService } from '../services/register-modal.service';

@Component({
  selector: 'app-register-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (visible()) {
      <div class="modal-overlay" dir="rtl" (click)="dismiss()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <!-- Close -->
          <button class="modal-close" (click)="dismiss()">
            <i class="fas fa-times"></i>
          </button>

          <!-- Hero -->
          <div class="modal-hero">
            <div class="hero-circle">
              <i class="fas fa-gift"></i>
            </div>
            <h2>انضم إلى KAI مجاناً!</h2>
            <p>Join KAI for Free!</p>
          </div>

          <!-- Benefits -->
          <div class="benefits">
            <div class="benefit">
              <div class="benefit-icon"><i class="fas fa-ticket-alt"></i></div>
              <div class="benefit-text">
                <span class="benefit-ar">احصل على كوبونات خصم حصرية</span>
                <span class="benefit-en">Get exclusive discount coupons</span>
              </div>
            </div>
            <div class="benefit">
              <div class="benefit-icon"><i class="fas fa-chart-line"></i></div>
              <div class="benefit-text">
                <span class="benefit-ar">تابع درجاتك وحضورك لحظة بلحظة</span>
                <span class="benefit-en">Track grades & attendance in real-time</span>
              </div>
            </div>
            <div class="benefit">
              <div class="benefit-icon"><i class="fas fa-university"></i></div>
              <div class="benefit-text">
                <span class="benefit-ar">انضم للأكاديميات وسجّل في المقررات</span>
                <span class="benefit-en">Join academies & enroll in courses</span>
              </div>
            </div>
            <div class="benefit">
              <div class="benefit-icon"><i class="fas fa-bell"></i></div>
              <div class="benefit-text">
                <span class="benefit-ar">إشعارات فورية بالدرجات والغياب</span>
                <span class="benefit-en">Instant grade & absence notifications</span>
              </div>
            </div>
          </div>

          <!-- CTA -->
          <button class="cta-register" (click)="goRegister()">
            <i class="fas fa-user-plus"></i>
            سجّل الآن مجاناً · Register Free Now
          </button>
          <button class="cta-login" (click)="goLogin()">
            لديك حساب؟ سجّل الدخول · Already have an account? Login
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-overlay {
      position: fixed; inset: 0; z-index: 99999;
      background: rgba(0,0,0,.5); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center;
      padding: 1.25rem; animation: fadeIn .25s ease;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    .modal-card {
      background: white; border-radius: 24px; width: 100%; max-width: 360px;
      overflow: hidden; position: relative;
      box-shadow: 0 20px 60px rgba(0,0,0,.25);
      animation: slideUp .3s ease-out;
    }
    @keyframes slideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

    .modal-close {
      position: absolute; top: .75rem; left: .75rem; z-index: 2;
      width: 32px; height: 32px; border-radius: 50%;
      background: rgba(0,0,0,.08); border: none; color: #666;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; font-size: .8rem;
    }

    .modal-hero {
      background: linear-gradient(135deg, #667eea, #764ba2);
      padding: 1.5rem 1.25rem 1.25rem; text-align: center; color: white;
    }
    .hero-circle {
      width: 64px; height: 64px; border-radius: 50%;
      background: rgba(255,255,255,.2); border: 2px solid rgba(255,255,255,.3);
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto .75rem; font-size: 1.5rem;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.08); }
    }
    .modal-hero h2 { margin: 0 0 .15rem; font-size: 1.2rem; font-weight: 800; }
    .modal-hero p { margin: 0; font-size: .78rem; opacity: .8; }

    .benefits { padding: 1rem 1.25rem; display: flex; flex-direction: column; gap: .6rem; }
    .benefit {
      display: flex; align-items: center; gap: .6rem;
    }
    .benefit-icon {
      width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
      background: linear-gradient(135deg, rgba(102,126,234,.1), rgba(118,75,162,.1));
      display: flex; align-items: center; justify-content: center;
      color: #667eea; font-size: .85rem;
    }
    .benefit-text { display: flex; flex-direction: column; }
    .benefit-ar { font-size: .8rem; font-weight: 700; color: #1a1a2e; }
    .benefit-en { font-size: .65rem; color: #9090aa; }

    .cta-register {
      display: flex; align-items: center; justify-content: center; gap: .4rem;
      margin: .25rem 1.25rem .5rem; padding: .75rem; width: calc(100% - 2.5rem);
      border-radius: 14px; border: none;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white; font-size: .9rem; font-weight: 800;
      cursor: pointer; min-height: 50px;
      box-shadow: 0 4px 14px rgba(102,126,234,.35);
      &:active { transform: scale(.98); }
    }
    .cta-login {
      display: block; width: 100%; padding: .6rem; margin-bottom: .75rem;
      background: none; border: none; color: #667eea;
      font-size: .75rem; font-weight: 600; cursor: pointer; text-align: center;
    }
  `],
})
export class RegisterModalComponent {
  private readonly router = inject(Router);
  private readonly modalSvc = inject(RegisterModalService);

  visible = this.modalSvc.isOpen;

  dismiss(): void { this.modalSvc.dismiss(); }

  goRegister(): void {
    this.modalSvc.dismiss();
    this.router.navigate(['/register']);
  }

  goLogin(): void {
    this.modalSvc.dismiss();
    this.router.navigate(['/login']);
  }
}
