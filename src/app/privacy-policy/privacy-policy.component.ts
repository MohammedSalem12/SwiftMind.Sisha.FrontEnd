import { Component, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page" dir="rtl">
      <div class="page-header">
        <div class="blob b1"></div>
        <div class="blob b2"></div>
        <div class="header-row">
          <button class="btn-back" (click)="goBack()">
            <i class="fas fa-arrow-right"></i>
          </button>
          <div class="header-text">
            <h1>سياسة الخصوصية</h1>
            <p>Privacy Policy</p>
          </div>
          <div class="header-icon"><i class="fas fa-shield-alt"></i></div>
        </div>
      </div>

      <div class="content">
        <div class="card">
          <h2>سياسة الخصوصية · Privacy Policy</h2>
          <p>نحن في سويفت مايند نلتزم بحماية خصوصيتك وبياناتك الشخصية.</p>
          <p>At SwiftMind, we are committed to protecting your privacy and personal data.</p>

          <h3>جمع البيانات · Data Collection</h3>
          <p>نقوم بجمع البيانات الضرورية لتقديم خدماتنا التعليمية فقط، بما في ذلك الاسم والبريد الإلكتروني ومعلومات الحساب.</p>
          <p>We only collect data necessary to provide our educational services, including name, email, and account information.</p>

          <h3>استخدام البيانات · Data Usage</h3>
          <p>نستخدم بياناتك لتحسين تجربة التعلم وتقديم الخدمات التعليمية المطلوبة.</p>
          <p>We use your data to improve the learning experience and deliver requested educational services.</p>

          <h3>حماية البيانات · Data Protection</h3>
          <p>نتخذ إجراءات أمنية مناسبة لحماية بياناتك من الوصول غير المصرح به.</p>
          <p>We take appropriate security measures to protect your data from unauthorized access.</p>

          <h3>حقوقك · Your Rights</h3>
          <p>يحق لك طلب الوصول إلى بياناتك أو تعديلها أو حذفها في أي وقت.</p>
          <p>You have the right to request access to, modification of, or deletion of your data at any time.</p>

          <h3>التواصل · Contact</h3>
          <p>للاستفسارات المتعلقة بالخصوصية، يرجى التواصل معنا عبر البريد الإلكتروني.</p>
          <p>For privacy-related inquiries, please contact us via email.</p>
        </div>
      </div>

      <div style="height:calc(80px + env(safe-area-inset-bottom,0px))"></div>
    </div>
  `,
  styles: [`
    .page { min-height:100vh; background:#f4f5fb; }
    .page-header {
      background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);
      padding:calc(env(safe-area-inset-top,0px) + 1.25rem) 1.25rem 2rem;
      position:relative; overflow:hidden;
    }
    .blob { position:absolute; border-radius:50%; background:rgba(255,255,255,.07); pointer-events:none; }
    .b1 { width:200px; height:200px; top:-70px; right:-60px; }
    .b2 { width:140px; height:140px; bottom:-50px; left:-30px; }
    .header-row { position:relative; z-index:1; display:flex; align-items:center; gap:1rem; }
    .btn-back {
      width:40px; height:40px; border-radius:12px;
      background:rgba(255,255,255,.15); border:1px solid rgba(255,255,255,.25);
      color:#fff; font-size:1rem; cursor:pointer;
      display:flex; align-items:center; justify-content:center; flex-shrink:0;
    }
    .header-text { flex:1; }
    .header-text h1 { margin:0; font-size:1.3rem; font-weight:800; color:#fff; }
    .header-text p { margin:.1rem 0 0; font-size:.78rem; color:rgba(255,255,255,.7); }
    .header-icon {
      width:48px; height:48px; border-radius:14px;
      background:rgba(255,255,255,.15);
      display:flex; align-items:center; justify-content:center;
      color:rgba(255,255,255,.9); font-size:1.3rem; flex-shrink:0;
    }
    .content { padding:1rem; }
    .card {
      background:#fff; border-radius:16px; padding:1.25rem;
      box-shadow:0 2px 12px rgba(0,0,0,.06);
    }
    .card h2 { font-size:1.1rem; font-weight:800; color:#1a1a2e; margin:0 0 1rem; }
    .card h3 { font-size:.95rem; font-weight:700; color:#667eea; margin:1.25rem 0 .5rem; }
    .card p { font-size:.85rem; color:#555; line-height:1.6; margin:0 0 .5rem; }
  `],
})
export class PrivacyPolicyComponent {
  private readonly location = inject(Location);
  goBack(): void { this.location.back(); }
}
