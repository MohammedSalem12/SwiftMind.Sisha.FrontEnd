import { Component, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthRedirectService } from '../services/auth-redirect.service';

@Component({
  selector: 'app-register-prompt',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="prompt-card" dir="rtl">
      <div class="prompt-icon"><i class="fas fa-user-plus"></i></div>
      <div class="prompt-content">
        <span class="prompt-title">{{ titleAr() }}</span>
        <span class="prompt-sub">{{ titleEn() }}</span>
      </div>
      <div class="prompt-actions">
        <button class="prompt-btn prompt-btn--register" (click)="register()">
          <i class="fas fa-user-plus"></i> تسجيل · Register
        </button>
        <button class="prompt-btn prompt-btn--login" (click)="login()">
          <i class="fas fa-sign-in-alt"></i> دخول · Login
        </button>
      </div>
    </div>
  `,
  styles: [`
    .prompt-card {
      margin: .75rem 1rem;
      padding: .85rem;
      background: linear-gradient(135deg, rgba(102,126,234,.08), rgba(118,75,162,.08));
      border: 2px solid rgba(102,126,234,.2);
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      gap: .5rem;
    }
    .prompt-icon {
      width: 40px; height: 40px; border-radius: 50%;
      background: linear-gradient(135deg, #667eea, #764ba2);
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 1rem;
    }
    .prompt-content { display: flex; flex-direction: column; gap: .1rem; }
    .prompt-title { font-size: .88rem; font-weight: 700; color: #1a1a2e; }
    .prompt-sub { font-size: .72rem; color: #9090aa; }
    .prompt-actions { display: flex; gap: .4rem; }
    .prompt-btn {
      flex: 1; display: flex; align-items: center; justify-content: center; gap: .3rem;
      padding: .55rem; border-radius: 12px; border: none;
      font-size: .78rem; font-weight: 700; cursor: pointer; min-height: 44px;
      -webkit-tap-highlight-color: transparent;
    }
    .prompt-btn--register {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white; box-shadow: 0 3px 10px rgba(102,126,234,.3);
    }
    .prompt-btn--login {
      background: white; color: #667eea;
      border: 1.5px solid rgba(102,126,234,.3);
    }
  `],
})
export class RegisterPromptComponent {
  private readonly authRedirect = inject(AuthRedirectService);

  titleAr = input('سجّل الآن للاستفادة من جميع الميزات');
  titleEn = input('Register now to access all features');

  register(): void { this.authRedirect.redirectToRegister(); }
  login(): void { this.authRedirect.redirectToLogin(); }
}
