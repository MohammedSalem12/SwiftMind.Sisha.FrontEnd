import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="fp-page" dir="rtl">
      <div class="fp-hero">
        <div class="blob b1"></div>
        <div class="blob b2"></div>
        <div class="hero-content">
          <div class="logo-ring">
            <img src="/assets/images/logo/logo-light-thumbnail2.png" alt="KAI" class="logo-img" />
          </div>
          <h1>استعادة كلمة المرور</h1>
          <p>Password Recovery</p>
        </div>
      </div>

      <div class="fp-card">
        @if (step() === 'form') {
          <div class="card-icon"><i class="fas fa-unlock-alt"></i></div>
          <h2>طلب إعادة تعيين كلمة المرور</h2>
          <p class="card-desc">أدخل رقم الموبايل أو اسم المستخدم وسيتم إرسال طلب لمسؤول النظام لإعادة تعيين كلمة المرور</p>
          <p class="card-desc-en">Enter your mobile number or username. An admin will reset your password.</p>

          <div class="field-group">
            <label><i class="fas fa-user"></i> رقم الموبايل أو اسم المستخدم</label>
            <input type="text" [(ngModel)]="username" placeholder="01XXXXXXXXX / username" dir="ltr" />
          </div>

          <div class="field-group">
            <label><i class="fas fa-user-tag"></i> الاسم (اختياري)</label>
            <input type="text" [(ngModel)]="displayName" placeholder="اسمك لمساعدة المسؤول في التعرف عليك" />
          </div>

          @if (error()) {
            <div class="msg msg--error"><i class="fas fa-exclamation-circle"></i> {{ error() }}</div>
          }

          <button class="btn-submit" (click)="submit()" [disabled]="submitting()">
            @if (submitting()) {
              <i class="fas fa-spinner fa-spin"></i> جاري الإرسال...
            } @else {
              <i class="fas fa-paper-plane"></i> إرسال الطلب · Submit Request
            }
          </button>

          <a routerLink="/login" class="back-link">
            <i class="fas fa-arrow-right"></i> العودة لتسجيل الدخول
          </a>
        }

        @if (step() === 'success') {
          <div class="success-icon"><i class="fas fa-check-circle"></i></div>
          <h2>تم إرسال الطلب بنجاح</h2>
          <p class="card-desc">سيقوم مسؤول النظام بمراجعة طلبك وإعادة تعيين كلمة المرور. ستتلقى إشعاراً عند الانتهاء.</p>
          <p class="card-desc-en">An admin will review your request and reset your password. You'll be notified when done.</p>

          <a routerLink="/login" class="btn-submit" style="text-decoration:none; text-align:center;">
            <i class="fas fa-sign-in-alt"></i> العودة لتسجيل الدخول · Back to Login
          </a>
        }
      </div>
    </div>
  `,
  styles: [`
    .fp-page { min-height:100vh; background:#f4f5fb; }

    .fp-hero {
      background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);
      padding:calc(env(safe-area-inset-top,0px) + 2rem) 1.5rem 2.5rem;
      text-align:center; position:relative; overflow:hidden;
    }
    .blob { position:absolute; border-radius:50%; background:rgba(255,255,255,.07); pointer-events:none; }
    .b1 { width:200px; height:200px; top:-70px; right:-60px; }
    .b2 { width:140px; height:140px; bottom:-50px; left:-30px; }
    .hero-content { position:relative; z-index:1; }
    .logo-ring {
      width:64px; height:64px; border-radius:50%;
      background:rgba(255,255,255,.15); border:2px solid rgba(255,255,255,.3);
      display:flex; align-items:center; justify-content:center;
      margin:0 auto .75rem;
    }
    .logo-img { width:40px; height:40px; object-fit:contain; }
    .fp-hero h1 { margin:0; font-size:1.3rem; font-weight:800; color:#fff; }
    .fp-hero p { margin:.2rem 0 0; font-size:.78rem; color:rgba(255,255,255,.7); }

    .fp-card {
      margin:-1rem 1rem 0; background:#fff; border-radius:20px;
      padding:1.5rem 1.25rem; position:relative; z-index:2;
      box-shadow:0 4px 20px rgba(0,0,0,.06);
    }
    .card-icon { text-align:center; font-size:2rem; color:#667eea; margin-bottom:.5rem; }
    .fp-card h2 { text-align:center; font-size:1.05rem; font-weight:700; color:#1a1a2e; margin:0 0 .5rem; }
    .card-desc { text-align:center; font-size:.82rem; color:#666; margin:0 0 .15rem; line-height:1.5; }
    .card-desc-en { text-align:center; font-size:.75rem; color:#9090aa; margin:0 0 1rem; }

    .field-group { margin-bottom:.75rem; }
    .field-group label {
      display:block; font-size:.78rem; font-weight:600; color:#555; margin-bottom:.3rem;
    }
    .field-group label i { margin-left:.3rem; color:#667eea; }
    .field-group input {
      width:100%; padding:.7rem .875rem; border-radius:12px;
      border:1.5px solid #e5e7eb; font-size:.88rem; color:#1a1a2e;
      background:#fafafe; box-sizing:border-box; min-height:44px; outline:none;
      transition:border-color .2s;
    }
    .field-group input:focus { border-color:#667eea; }

    .msg {
      padding:.5rem .75rem; border-radius:10px; font-size:.78rem; font-weight:600;
      display:flex; align-items:center; gap:.35rem; margin-bottom:.75rem;
    }
    .msg--error { background:rgba(239,68,68,.08); color:#dc2626; }

    .btn-submit {
      width:100%; padding:.7rem; border-radius:12px; border:none;
      background:linear-gradient(135deg,#667eea,#764ba2);
      color:#fff; font-size:.85rem; font-weight:700; cursor:pointer;
      min-height:48px; display:flex; align-items:center; justify-content:center; gap:.4rem;
      -webkit-tap-highlight-color:transparent;
    }
    .btn-submit:disabled { opacity:.5; cursor:not-allowed; }

    .back-link {
      display:block; text-align:center; margin-top:1rem;
      font-size:.82rem; color:#667eea; font-weight:600; text-decoration:none;
    }

    .success-icon { text-align:center; font-size:3rem; color:#059669; margin-bottom:.75rem; }
  `],
})
export class ForgotPasswordComponent {
  private readonly http = inject(HttpClient);
  private readonly apiBase = environment.apis?.default?.url || '';

  username = '';
  displayName = '';
  step = signal<'form' | 'success'>('form');
  submitting = signal(false);
  error = signal('');

  async submit(): Promise<void> {
    this.error.set('');
    if (!this.username.trim()) {
      this.error.set('يرجى إدخال رقم الموبايل أو اسم المستخدم');
      return;
    }

    this.submitting.set(true);
    try {
      await this.http.post(`${this.apiBase}/api/app/password-reset-request`, {
        userNameOrContact: this.username.trim(),
        displayName: this.displayName.trim() || undefined,
      }).toPromise();
      this.step.set('success');
    } catch (e: any) {
      const msg = e?.error?.error?.message || 'حدث خطأ أثناء إرسال الطلب · Error submitting request';
      this.error.set(msg);
    } finally {
      this.submitting.set(false);
    }
  }
}
