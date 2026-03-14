import { CommonModule, Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-ads-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
            <h1>إنشاء إعلان جديد</h1>
            <p>Create New Ad</p>
          </div>
          <div class="header-icon"><i class="fas fa-plus-circle"></i></div>
        </div>
      </div>

      <div class="form-area">
        <!-- Ad Type -->
        <div class="field-group">
          <label class="field-label">نوع الإعلان · Ad Type</label>
          <div class="type-selector">
            <button class="type-btn" [class.type-btn--active]="model.adType === 0" (click)="model.adType = 0">
              <i class="fas fa-chalkboard-teacher"></i>
              <span>خدمة تعليمية</span>
              <small>Service</small>
            </button>
            <button class="type-btn" [class.type-btn--active]="model.adType === 1" (click)="model.adType = 1">
              <i class="fas fa-book"></i>
              <span>كتب / منتجات</span>
              <small>Products</small>
            </button>
            <button class="type-btn" [class.type-btn--active]="model.adType === 2" (click)="model.adType = 2">
              <i class="fas fa-handshake"></i>
              <span>عرض مشترك</span>
              <small>Deal</small>
            </button>
          </div>
        </div>

        <!-- Title -->
        <div class="field-group">
          <label class="field-label">العنوان · Title</label>
          <input class="field-input" [(ngModel)]="model.title" placeholder="عنوان الإعلان بالعربية" maxlength="200" />
          <input class="field-input field-input--en" [(ngModel)]="model.titleEn" placeholder="Ad title in English (optional)" maxlength="200" dir="ltr" />
        </div>

        <!-- Description -->
        <div class="field-group">
          <label class="field-label">الوصف · Description</label>
          <textarea class="field-textarea" [(ngModel)]="model.description" placeholder="وصف تفصيلي للإعلان" rows="4"></textarea>
          <textarea class="field-textarea field-input--en" [(ngModel)]="model.descriptionEn" placeholder="Description in English (optional)" rows="3" dir="ltr"></textarea>
        </div>

        <!-- Target Audience -->
        <div class="field-group">
          <label class="field-label">الجمهور المستهدف · Target Audience</label>
          <select class="field-select" [(ngModel)]="model.targetAudience">
            <option [ngValue]="0">الكل · All</option>
            <option [ngValue]="1">الطلاب · Students</option>
            <option [ngValue]="2">أولياء الأمور · Parents</option>
            <option [ngValue]="3">المعلمون · Teachers</option>
          </select>
        </div>

        <!-- Price -->
        <div class="field-group">
          <label class="field-label">السعر (اختياري) · Price</label>
          <div class="price-row">
            <input class="field-input price-input" type="number" [(ngModel)]="model.price" placeholder="0.00" dir="ltr" />
            <select class="field-select currency-select" [(ngModel)]="model.currency">
              <option value="SAR">ر.س</option>
              <option value="EGP">ج.م</option>
              <option value="USD">$</option>
            </select>
          </div>
        </div>

        <!-- Deal Partner (only for Deal type) -->
        @if (model.adType === 2) {
          <div class="field-group">
            <label class="field-label">شريك العرض · Deal Partner</label>
            <input class="field-input" [(ngModel)]="model.dealPartnerName" placeholder="اسم المكتبة أو المعلم الشريك" />
          </div>
        }

        <!-- Contact Info -->
        <div class="field-group">
          <label class="field-label">معلومات التواصل · Contact Info</label>
          <input class="field-input" [(ngModel)]="model.contactInfo" placeholder="رقم هاتف أو بريد إلكتروني" dir="ltr" />
        </div>

        <!-- External URL -->
        <div class="field-group">
          <label class="field-label">رابط خارجي (اختياري) · External URL</label>
          <input class="field-input" [(ngModel)]="model.externalUrl" placeholder="https://..." dir="ltr" />
        </div>

        <!-- Image URL -->
        <div class="field-group">
          <label class="field-label">رابط الصورة (اختياري) · Image URL</label>
          <input class="field-input" [(ngModel)]="model.imageUrl" placeholder="https://..." dir="ltr" />
        </div>

        <!-- Schedule -->
        <div class="field-group">
          <label class="field-label">فترة العرض · Schedule</label>
          <div class="date-row">
            <div class="date-field">
              <label class="date-label">من · From</label>
              <input class="field-input" type="date" [(ngModel)]="model.startDate" dir="ltr" />
            </div>
            <div class="date-field">
              <label class="date-label">إلى · To</label>
              <input class="field-input" type="date" [(ngModel)]="model.endDate" dir="ltr" />
            </div>
          </div>
        </div>

        <!-- Error/Success -->
        @if (error()) {
          <div class="msg msg--error"><i class="fas fa-exclamation-circle"></i> {{ error() }}</div>
        }
        @if (success()) {
          <div class="msg msg--success"><i class="fas fa-check-circle"></i> {{ success() }}</div>
        }

        <!-- Actions -->
        <div class="actions">
          <button class="btn-draft" (click)="save(false)" [disabled]="saving()">
            <i class="fas fa-save"></i> حفظ كمسودة · Save Draft
          </button>
          <button class="btn-submit" (click)="save(true)" [disabled]="saving() || !model.title || !model.description">
            @if (saving()) { <i class="fas fa-spinner fa-spin"></i> }
            @else { <i class="fas fa-paper-plane"></i> }
            إرسال للمراجعة · Submit
          </button>
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
    .header-row {
      position:relative; z-index:1; display:flex; align-items:center; gap:1rem;
    }
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

    .form-area { padding:1rem; display:flex; flex-direction:column; gap:1rem; }

    .field-group { display:flex; flex-direction:column; gap:.4rem; }
    .field-label { font-size:.8rem; font-weight:700; color:#555; }

    .type-selector { display:grid; grid-template-columns:repeat(3,1fr); gap:.5rem; }
    .type-btn {
      display:flex; flex-direction:column; align-items:center; gap:.25rem;
      padding:.75rem .5rem; border-radius:14px; border:1.5px solid #e0e0ee;
      background:#fff; cursor:pointer; transition:all .2s;
      -webkit-tap-highlight-color:transparent;
    }
    .type-btn i { font-size:1.2rem; color:#9090aa; }
    .type-btn span { font-size:.72rem; font-weight:700; color:#1a1a2e; }
    .type-btn small { font-size:.6rem; color:#9090aa; }
    .type-btn--active {
      border-color:#667eea; background:rgba(102,126,234,.06);
    }
    .type-btn--active i { color:#667eea; }

    .field-input, .field-textarea, .field-select {
      width:100%; padding:.7rem .875rem; border-radius:12px;
      border:1.5px solid #e5e7eb; font-size:.88rem; color:#1a1a2e;
      background:#fff; box-sizing:border-box; outline:none;
      transition:border-color .2s;
    }
    .field-input:focus, .field-textarea:focus, .field-select:focus { border-color:#667eea; }
    .field-input--en { margin-top:.35rem; font-size:.82rem; color:#555; }
    .field-textarea { resize:vertical; min-height:80px; line-height:1.5; }
    .field-select { appearance:auto; }

    .price-row { display:flex; gap:.5rem; }
    .price-input { flex:1; }
    .currency-select { width:80px; flex-shrink:0; }

    .date-row { display:flex; gap:.5rem; }
    .date-field { flex:1; display:flex; flex-direction:column; gap:.25rem; }
    .date-label { font-size:.7rem; color:#9090aa; }

    .msg {
      padding:.65rem .875rem; border-radius:10px; font-size:.82rem; font-weight:600;
      display:flex; align-items:center; gap:.35rem;
    }
    .msg--error { background:rgba(239,68,68,.08); color:#dc2626; }
    .msg--success { background:rgba(16,185,129,.08); color:#059669; }

    .actions { display:flex; gap:.5rem; padding-top:.5rem; }
    .btn-draft {
      flex:1; padding:.7rem; border-radius:12px; border:1.5px solid #e5e7eb;
      background:#fff; color:#555; font-size:.8rem; font-weight:600;
      cursor:pointer; min-height:48px; display:flex; align-items:center;
      justify-content:center; gap:.35rem;
    }
    .btn-submit {
      flex:1.5; padding:.7rem; border-radius:12px; border:none;
      background:linear-gradient(135deg,#667eea,#764ba2);
      color:#fff; font-size:.82rem; font-weight:700; cursor:pointer;
      min-height:48px; display:flex; align-items:center;
      justify-content:center; gap:.35rem;
    }
    .btn-submit:disabled { opacity:.5; cursor:not-allowed; }
  `],
})
export class AdsCreateComponent {
  private readonly http = inject(HttpClient);
  private readonly location = inject(Location);
  private readonly apiBase = environment.apis?.default?.url || '';

  saving = signal(false);
  error = signal('');
  success = signal('');

  model: any = {
    title: '',
    titleEn: '',
    description: '',
    descriptionEn: '',
    imageUrl: '',
    adType: 0,
    targetAudience: 0,
    targetGrades: [],
    price: null,
    currency: 'SAR',
    contactInfo: '',
    externalUrl: '',
    dealPartnerName: '',
    startDate: '',
    endDate: '',
    submitForReview: false,
  };

  async save(submit: boolean): Promise<void> {
    this.saving.set(true);
    this.error.set('');
    this.success.set('');
    try {
      const payload = { ...this.model, submitForReview: submit };
      await this.http.post(`${this.apiBase}/api/app/advertisement`, payload).toPromise();
      this.success.set(submit ? 'تم إرسال الإعلان للمراجعة · Ad submitted for review' : 'تم حفظ المسودة · Draft saved');
      if (submit) {
        setTimeout(() => this.location.back(), 1500);
      }
    } catch (e: any) {
      this.error.set(e?.error?.error?.message || 'حدث خطأ · Something went wrong');
    } finally {
      this.saving.set(false);
    }
  }

  goBack(): void { this.location.back(); }
}
