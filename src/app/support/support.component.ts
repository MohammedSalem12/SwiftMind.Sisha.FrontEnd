import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { PageHeaderComponent } from '../shared/components/page-header.component';

@Component({
  selector: 'app-support',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  template: `
    <div class="page" dir="rtl">

      <!-- Header -->
      <app-page-header [title]="'الدعم الفني'" [titleEn]="'Support'"></app-page-header>

      <!-- Contact Info -->
      <div class="section">
        <div class="section-title"><i class="fas fa-phone-alt"></i> تواصل معنا · Contact Us</div>
        <div class="contact-list">
          <div class="contact-item">
            <div class="contact-icon" style="background:rgba(102,126,234,.12);color:#667eea">
              <i class="fas fa-envelope"></i>
            </div>
            <div class="contact-text">
              <span class="contact-label">البريد الإلكتروني · Email</span>
              <span class="contact-value ltr">support&#64;swiftmind.dev</span>
            </div>
          </div>
          <a class="contact-item" href="tel:+201019322902">
            <div class="contact-icon" style="background:rgba(102,126,234,.12);color:#667eea">
              <i class="fas fa-phone-alt"></i>
            </div>
            <div class="contact-text">
              <span class="contact-label">الهاتف · Phone</span>
              <span class="contact-value ltr">+20 101 932 2902</span>
            </div>
          </a>
          <a class="contact-item" href="https://wa.me/201019322902" target="_blank" rel="noopener">
            <div class="contact-icon" style="background:rgba(16,185,129,.12);color:#059669">
              <i class="fab fa-whatsapp"></i>
            </div>
            <div class="contact-text">
              <span class="contact-label">واتساب · WhatsApp</span>
              <span class="contact-value ltr">+20 101 932 2902</span>
            </div>
          </a>
          <div class="contact-item">
            <div class="contact-icon" style="background:rgba(245,158,11,.12);color:#d97706">
              <i class="fas fa-clock"></i>
            </div>
            <div class="contact-text">
              <span class="contact-label">أوقات العمل · Working Hours</span>
              <span class="contact-value">الأحد - الخميس · Sun - Thu, 9AM - 5PM</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Support Form -->
      <div class="section">
        <div class="section-title"><i class="fas fa-paper-plane"></i> أرسل رسالة · Send a Message</div>
        <div class="form-card">
          <div class="form-group">
            <label class="form-label">الموضوع · Subject</label>
            <input class="form-input" type="text" [(ngModel)]="subject"
                   placeholder="اكتب الموضوع هنا..." />
          </div>
          <div class="form-group">
            <label class="form-label">الرسالة · Message</label>
            <textarea class="form-textarea" [(ngModel)]="message" rows="5"
                      placeholder="اكتب رسالتك هنا..."></textarea>
          </div>
          <button class="send-btn" [disabled]="!subject.trim() || !message.trim() || sending()"
                  (click)="sendMessage()">
            @if (sending()) {
              <i class="fas fa-spinner fa-spin"></i>
            } @else {
              <i class="fas fa-paper-plane"></i>
            }
            إرسال · Send
          </button>
          @if (successMsg()) {
            <p class="msg msg--success">{{ successMsg() }}</p>
          }
        </div>
      </div>

      <!-- FAQ -->
      <div class="section">
        <div class="section-title"><i class="fas fa-question-circle"></i> أسئلة شائعة · FAQ</div>
        <div class="faq-list">
          @for (item of faqItems; track item.q) {
            <div class="faq-item" (click)="item.open = !item.open">
              <div class="faq-header">
                <span class="faq-q">{{ item.q }}</span>
                <i class="fas" [class]="item.open ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
              </div>
              <span class="faq-q-en">{{ item.qEn }}</span>
              @if (item.open) {
                <p class="faq-a">{{ item.a }}</p>
                <p class="faq-a-en">{{ item.aEn }}</p>
              }
            </div>
          }
        </div>
      </div>

      <div style="height:calc(80px + env(safe-area-inset-bottom,0px))"></div>
    </div>
  `,
  styles: [`
    .page { min-height:100vh; background:#f4f5fb; }

    .section { padding:1rem 1rem 0; }
    .section-title {
      display:flex; align-items:center; gap:.5rem; font-size:.8rem; font-weight:700;
      color:#555; text-transform:uppercase; letter-spacing:.05em; margin-bottom:.75rem;
      i { color:#667eea; font-size:.85rem; }
    }

    /* Contact */
    .contact-list { display:flex; flex-direction:column; gap:.4rem; }
    .contact-item {
      display:flex; align-items:center; gap:.65rem;
      padding:.75rem .85rem; background:#fff; border-radius:14px;
      border:1.5px solid #f0f0f5; box-shadow:0 2px 6px rgba(0,0,0,.03);
      text-decoration:none; color:inherit;
      -webkit-tap-highlight-color:transparent; transition:transform .12s, border-color .15s;
    }
    a.contact-item:active { transform:scale(.99); border-color:rgba(102,126,234,.3); }
    .contact-icon {
      width:42px; height:42px; border-radius:12px; flex-shrink:0;
      display:flex; align-items:center; justify-content:center; font-size:1.1rem;
    }
    .contact-text { flex:1; display:flex; flex-direction:column; }
    .contact-label { font-size:.72rem; color:#9090aa; }
    .contact-value { font-size:.85rem; font-weight:700; color:#1a1a2e; }
    .contact-value.ltr { direction:ltr; text-align:right; }

    /* Form */
    .form-card {
      background:#fff; border-radius:16px; border:1.5px solid #f0f0f0;
      padding:1rem; box-shadow:0 2px 8px rgba(0,0,0,.04);
      display:flex; flex-direction:column; gap:.75rem;
    }
    .form-group { display:flex; flex-direction:column; gap:.3rem; }
    .form-label { font-size:.78rem; font-weight:700; color:#4a4a6a; }
    .form-input, .form-textarea {
      width:100%; padding:.65rem .75rem; border-radius:10px;
      border:1.5px solid #e5e7eb; font-size:.85rem; outline:none;
      box-sizing:border-box; font-family:inherit;
      transition:border-color .2s;
      &:focus { border-color:#667eea; }
    }
    .form-textarea { resize:vertical; min-height:100px; }
    .send-btn {
      display:flex; align-items:center; justify-content:center; gap:.4rem;
      padding:.75rem; border-radius:12px; border:none;
      background:linear-gradient(135deg,#667eea,#764ba2);
      color:#fff; font-size:.88rem; font-weight:700; cursor:pointer;
      min-height:48px;
      &:disabled { opacity:.5; cursor:not-allowed; }
      &:active:not(:disabled) { transform:scale(.98); }
    }
    .msg {
      font-size:.78rem; font-weight:600; margin:0;
      padding:.5rem .75rem; border-radius:8px; text-align:center;
    }
    .msg--success { color:#059669; background:rgba(16,185,129,.08); }

    /* FAQ */
    .faq-list { display:flex; flex-direction:column; gap:.4rem; }
    .faq-item {
      background:#fff; border-radius:14px; border:1.5px solid #f0f0f5;
      padding:.75rem .85rem; cursor:pointer;
      box-shadow:0 2px 6px rgba(0,0,0,.03);
      -webkit-tap-highlight-color:transparent;
    }
    .faq-header {
      display:flex; justify-content:space-between; align-items:center;
      i { color:#667eea; font-size:.65rem; }
    }
    .faq-q { font-size:.85rem; font-weight:700; color:#1a1a2e; }
    .faq-q-en { font-size:.65rem; color:#9090aa; }
    .faq-a { font-size:.78rem; color:#4a4a6a; line-height:1.6; margin:.5rem 0 .15rem; }
    .faq-a-en { font-size:.68rem; color:#9090aa; line-height:1.5; margin:0; }
  `],
})
export class SupportComponent {
  subject = '';
  message = '';
  sending = signal(false);
  successMsg = signal('');

  faqItems = [
    {
      q: 'كيف أسجّل حساب جديد؟',
      qEn: 'How do I register a new account?',
      a: 'اضغط على "إنشاء حساب" من الصفحة الرئيسية، اختر نوع الحساب (طالب، معلم، ولي أمر)، ثم أكمل البيانات المطلوبة.',
      aEn: 'Click "Register" from the home page, select your account type (Student, Teacher, Parent), then fill in the required information.',
      open: false,
    },
    {
      q: 'كيف أربط حساب ولي الأمر بالطالب؟',
      qEn: 'How do I link a parent account to a student?',
      a: 'من لوحة ولي الأمر، اضغط "ربط طالب" وأدخل كود الطالب أو امسح رمز QR الخاص بالطالب.',
      aEn: 'From the parent dashboard, tap "Link Student" and enter the student code or scan the student QR code.',
      open: false,
    },
    {
      q: 'نسيت كلمة المرور، ماذا أفعل؟',
      qEn: 'I forgot my password, what should I do?',
      a: 'اضغط "نسيت كلمة المرور" في صفحة تسجيل الدخول، أو تواصل مع إدارة الأكاديمية لإعادة تعيين كلمة المرور.',
      aEn: 'Click "Forgot Password" on the login page, or contact your academy admin to reset your password.',
      open: false,
    },
    {
      q: 'كيف أتابع حضور وغياب أبنائي؟',
      qEn: 'How do I track my children\'s attendance?',
      a: 'من لوحة ولي الأمر، اضغط على اسم الطالب ثم "الحضور" لعرض سجل الحضور والغياب التفصيلي.',
      aEn: 'From the parent dashboard, tap on the student name then "Attendance" to view the detailed attendance record.',
      open: false,
    },
  ];

  async sendMessage(): Promise<void> {
    this.sending.set(true);
    this.successMsg.set('');
    // Placeholder — will be connected to a real API later
    await new Promise(resolve => setTimeout(resolve, 1500));
    this.successMsg.set('تم إرسال رسالتك بنجاح، سنتواصل معك قريباً · Message sent successfully!');
    this.subject = '';
    this.message = '';
    this.sending.set(false);
    setTimeout(() => this.successMsg.set(''), 5000);
  }
}
