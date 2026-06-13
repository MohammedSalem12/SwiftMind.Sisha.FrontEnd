import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';

@Component({
  selector: 'app-data-deletion',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
            <h1>حذف البيانات</h1>
            <p>Data Deletion</p>
          </div>
          <div class="header-icon"><i class="fas fa-trash-alt"></i></div>
        </div>
      </div>

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
    .card ul { padding-right:1.25rem; margin:.5rem 0; }
    .card li { font-size:.85rem; color:#555; line-height:1.8; }
  `],
})
export class DataDeletionComponent {
  private readonly location = inject(Location);
  goBack(): void { this.location.back(); }
}
