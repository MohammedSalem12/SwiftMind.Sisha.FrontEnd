import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { lastValueFrom } from 'rxjs';

import { MarketingLeadService } from '@proxy/marketing-leads';
import type { CreateUpdateMarketingLeadDto } from '@proxy/marketing-leads';
import { PageHeaderComponent } from '../shared/components/page-header.component';

@Component({
  selector: 'app-marketer-lead-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IonicModule, PageHeaderComponent],
  template: `
    <div class="mk-form-page" dir="rtl">
      <app-page-header
        [title]="isEdit() ? 'تعديل جهة' : 'إضافة جهة'"
        [titleEn]="isEdit() ? 'Edit contact' : 'Add contact'"
        [backTo]="backTo()">
      </app-page-header>

      <div class="mk-body">
        <div *ngIf="error()" class="mk-error">
          <i class="fas fa-triangle-exclamation"></i> {{ error() }}
        </div>

        <form class="mk-form" (ngSubmit)="save()" #f="ngForm">
          <label class="mk-field">
            <span class="mk-lbl">الاسم · Name <i class="req">*</i></span>
            <input name="name" [(ngModel)]="model.name" required maxlength="200"
                   placeholder="اسم العميل · Contact name" />
          </label>

          <label class="mk-field">
            <span class="mk-lbl">الموبايل · Mobile <i class="req">*</i></span>
            <input name="mobile" [(ngModel)]="model.mobile" required maxlength="32"
                   inputmode="tel" type="tel" placeholder="01xxxxxxxxx" />
          </label>

          <label class="mk-field">
            <span class="mk-lbl">المدينة · City</span>
            <input name="city" [(ngModel)]="model.city" maxlength="128"
                   placeholder="المدينة / المنطقة · City / area" />
          </label>

          <label class="mk-field">
            <span class="mk-lbl">الكورس · Course</span>
            <input name="course" [(ngModel)]="model.course" maxlength="256"
                   placeholder="الكورس المهتم به · Course of interest" />
          </label>

          <label class="mk-field">
            <span class="mk-lbl">العنوان · Address</span>
            <textarea name="address" [(ngModel)]="model.address" maxlength="512" rows="2"
                      placeholder="العنوان بالتفصيل · Full address"></textarea>
          </label>

          <label class="mk-toggle">
            <span>تم الاتصال · Called</span>
            <ion-toggle [(ngModel)]="model.isCalled" name="isCalled"></ion-toggle>
          </label>

          <button type="submit" class="mk-submit" [disabled]="saving() || f.invalid">
            <i class="fas" [class.fa-spinner]="saving()" [class.fa-spin]="saving()" [class.fa-check]="!saving()"></i>
            {{ isEdit() ? 'حفظ التعديلات · Save' : 'إضافة · Add' }}
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .mk-form-page { min-height: 100vh; background: #f4f5fb; }
    .mk-body { padding: 14px; padding-bottom: 90px; }
    .mk-form { display: flex; flex-direction: column; gap: 14px; }
    .mk-field { display: flex; flex-direction: column; gap: 6px; }
    .mk-lbl { font-size: .8rem; font-weight: 700; color: #4b5563; }
    .req { color: #dc2626; font-style: normal; }
    .mk-field input, .mk-field textarea {
      width: 100%; box-sizing: border-box; border: 1.5px solid #e5e7eb; border-radius: 12px;
      padding: 12px 14px; font-size: 16px; color: #1a1a2e; background: #fff; outline: none;
    }
    .mk-field input:focus, .mk-field textarea:focus { border-color: var(--ngx-primary, #667eea); }
    .mk-toggle {
      display: flex; align-items: center; justify-content: space-between;
      background: #fff; border: 1.5px solid #e5e7eb; border-radius: 12px; padding: 12px 14px;
      font-weight: 700; color: #4b5563;
    }
    .mk-submit {
      margin-top: 4px; background: var(--ngx-primary, #667eea); color: #fff; border: none;
      border-radius: 14px; padding: 14px; min-height: 52px; font-size: 1rem; font-weight: 800; cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 8px;
    }
    .mk-submit:disabled { opacity: .6; }
    .mk-error { margin-bottom: 12px; background:#fff0f4; color:#dc2626; border:1px solid #fecaca; border-radius:12px; padding:12px; display:flex; gap:8px; align-items:center; }
  `],
})
export class MarketerLeadFormComponent implements OnInit {
  private readonly leadService = inject(MarketingLeadService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  saving = signal(false);
  error = signal<string | null>(null);
  isEdit = signal(false);
  private id: string | null = null;

  model: CreateUpdateMarketingLeadDto = {
    name: '',
    mobile: '',
    city: undefined,
    course: undefined,
    address: undefined,
    isCalled: false,
  };

  backTo(): string {
    return this.isEdit() && this.id ? `/marketer/leads/${this.id}` : '/marketer/leads';
  }

  async ngOnInit(): Promise<void> {
    this.id = this.route.snapshot.paramMap.get('id');
    if (this.id) {
      this.isEdit.set(true);
      await this.loadExisting(this.id);
    }
  }

  private async loadExisting(id: string): Promise<void> {
    try {
      const dto = await lastValueFrom(this.leadService.get(id));
      this.model = {
        name: dto.name,
        mobile: dto.mobile,
        city: dto.city ?? undefined,
        course: dto.course ?? undefined,
        address: dto.address ?? undefined,
        isCalled: dto.isCalled,
      };
    } catch {
      this.error.set('تعذّر تحميل الجهة · Failed to load contact');
    }
  }

  async save(): Promise<void> {
    if (!this.model.name?.trim() || !this.model.mobile?.trim()) {
      this.error.set('الاسم والموبايل مطلوبان · Name and mobile are required');
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    try {
      const payload: CreateUpdateMarketingLeadDto = {
        ...this.model,
        name: this.model.name.trim(),
        mobile: this.model.mobile.trim(),
      };
      if (this.isEdit() && this.id) {
        await lastValueFrom(this.leadService.update(this.id, payload));
        await this.router.navigate(['/marketer/leads', this.id]);
      } else {
        const created = await lastValueFrom(this.leadService.create(payload));
        await this.router.navigate(['/marketer/leads', created.id]);
      }
    } catch {
      this.error.set('تعذّر الحفظ · Failed to save');
    } finally {
      this.saving.set(false);
    }
  }
}
