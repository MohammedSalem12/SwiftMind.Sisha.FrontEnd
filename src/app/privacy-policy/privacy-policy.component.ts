import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageHeaderComponent } from '../shared/components/page-header.component';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, PageHeaderComponent],
  template: `
    <div class="page" dir="rtl">
      <app-page-header [title]="'سياسة الخصوصية'" [titleEn]="'Privacy Policy'"></app-page-header>

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
export class PrivacyPolicyComponent {}
