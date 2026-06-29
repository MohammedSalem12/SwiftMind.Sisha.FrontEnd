import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PageHeaderComponent } from '../shared/components/page-header.component';

@Component({
  selector: 'app-data-deletion',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, PageHeaderComponent],
  template: `
    <div class="page" dir="rtl">
      <app-page-header [title]="'حذف البيانات'" [titleEn]="'Delete My Data'"></app-page-header>

      <div class="content">
        <div class="card">
          <h2>طلب حذف البيانات · Data Deletion Request</h2>
          <p>يمكنك طلب حذف بياناتك الشخصية من نظامنا في أي وقت.</p>
          <p>You can request deletion of your personal data from our system at any time.</p>

          <h3>كيفية طلب الحذف · How to Request Deletion</h3>
          <p>للتقدم بطلب حذف بياناتك، يرجى التواصل معنا عبر البريد الإلكتروني مع ذكر اسم المستخدم الخاص بك.</p>
          <p>To request data deletion, please contact us via email with your username.</p>

          <h3>ما الذي سيتم حذفه · What Will Be Deleted</h3>
          <p>عند تأكيد طلب الحذف، سيتم إزالة جميع بياناتك الشخصية بما في ذلك:</p>
          <p>Upon confirming the deletion request, all your personal data will be removed including:</p>
          <ul>
            <li>معلومات الحساب · Account information</li>
            <li>بيانات الملف الشخصي · Profile data</li>
            <li>سجل النشاطات · Activity history</li>
          </ul>

          <h3>المدة الزمنية · Timeline</h3>
          <p>سيتم معالجة طلبك خلال 30 يوم عمل من تاريخ الاستلام.</p>
          <p>Your request will be processed within 30 business days of receipt.</p>

          <h3>ملاحظة · Note</h3>
          <p>بعض البيانات قد يتم الاحتفاظ بها لأغراض قانونية أو تنظيمية.</p>
          <p>Some data may be retained for legal or regulatory purposes.</p>
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
    .card ul { padding-right:1.25rem; margin:.5rem 0; }
    .card li { font-size:.85rem; color:#555; line-height:1.8; }
  `],
})
export class DataDeletionComponent {}
