import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { MarketerService } from '@proxy/marketers';
import type { OnboardTeacherDto } from '@proxy/marketers';
import { PageHeaderComponent } from '../shared/components/page-header.component';

@Component({
  selector: 'app-marketer-onboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PageHeaderComponent],
  template: `
    <div class="mk-form-page" dir="rtl">
      <app-page-header [title]="'تسجيل معلم'" [titleEn]="'Onboard Teacher'" [backTo]="'/marketer'"></app-page-header>

      <div class="mk-card">
        <label class="mk-label">الاسم الأول · First name <span>*</span></label>
        <input class="mk-input" [(ngModel)]="model.firstName" placeholder="مثال: أحمد" />

        <label class="mk-label">الاسم الأخير · Last name <span>*</span></label>
        <input class="mk-input" [(ngModel)]="model.lastName" placeholder="مثال: محمد" />

        <label class="mk-label">رقم الهاتف · Phone <span>*</span></label>
        <input class="mk-input" type="tel" [(ngModel)]="model.phoneNumber" placeholder="01xxxxxxxxx" />

        <label class="mk-label">البريد الإلكتروني · Email <span>*</span></label>
        <input class="mk-input" type="email" [(ngModel)]="model.email" placeholder="teacher@example.com" />

        <label class="mk-label">اسم المستخدم · Username <span>*</span></label>
        <input class="mk-input" [(ngModel)]="model.userName" placeholder="username" />

        <label class="mk-label">كلمة المرور · Password <span>*</span></label>
        <input class="mk-input" type="text" [(ngModel)]="model.password" placeholder="1q2w3E*" />

        <label class="mk-label">العنوان · Address</label>
        <input class="mk-input" [(ngModel)]="model.address" placeholder="اختياري · optional" />

        <div *ngIf="error()" class="mk-msg mk-msg--err"><i class="fas fa-times-circle"></i> {{ error() }}</div>
        <div *ngIf="success()" class="mk-msg mk-msg--ok"><i class="fas fa-check-circle"></i> {{ success() }}</div>

        <button class="mk-submit" (click)="submit()" [disabled]="saving() || !valid()">
          <i class="fas fa-user-plus" *ngIf="!saving()"></i>
          <span>{{ saving() ? 'جاري الحفظ...' : 'تسجيل المعلم · Create teacher' }}</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .mk-form-page { padding: 12px; padding-bottom: 90px; }
    .mk-card { background: #fff; border-radius: 16px; padding: 16px; border: 1.5px solid #f0f0f0; box-shadow: 0 2px 8px rgba(0,0,0,.05); }
    .mk-label { display: block; font-size: .8rem; font-weight: 700; color: #555; margin: 12px 0 6px; }
    .mk-label span { color: #dc2626; }
    .mk-input {
      width: 100%; box-sizing: border-box; min-height: 48px; padding: 0 14px;
      border: 1.5px solid #e5e7eb; border-radius: 12px; font-size: 16px; font-family: inherit; direction: rtl;
    }
    .mk-input:focus { outline: none; border-color: var(--ngx-primary, #667eea); box-shadow: 0 0 0 3px rgba(102,126,234,.15); }
    .mk-msg { margin-top: 14px; border-radius: 10px; padding: 10px 12px; font-size: .85rem; display: flex; gap: 8px; align-items: center; }
    .mk-msg--err { background: #fff0f4; color: #dc2626; }
    .mk-msg--ok { background: #dcfce7; color: #15803d; }
    .mk-submit {
      width: 100%; min-height: 52px; margin-top: 18px; border: none; border-radius: 14px;
      background: var(--ngx-primary, #667eea); color: #fff; font-size: 1rem; font-weight: 800; cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 8px;
    }
    .mk-submit:disabled { opacity: .5; cursor: not-allowed; }
  `],
})
export class MarketerOnboardComponent {
  private readonly marketerService = inject(MarketerService);
  private readonly router = inject(Router);

  saving = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  model: OnboardTeacherDto = {
    userName: '', email: '', password: '', firstName: '', lastName: '', phoneNumber: '', address: '',
  };

  valid(): boolean {
    const m = this.model;
    return !!(m.firstName && m.lastName && m.phoneNumber && m.email && m.userName && m.password);
  }

  async submit(): Promise<void> {
    if (!this.valid()) return;
    this.saving.set(true);
    this.error.set(null);
    this.success.set(null);
    try {
      const teacher = await lastValueFrom(this.marketerService.registerTeacher(this.model));
      this.success.set('تم تسجيل المعلم بنجاح · Teacher created');
      // Go to the per-teacher setup hub so the marketer can add courses/groups/secretary
      setTimeout(() => this.router.navigate(['/marketer/teacher', teacher.id]), 700);
    } catch (e: any) {
      this.error.set(e?.error?.error?.message || 'تعذّر تسجيل المعلم · Failed to create teacher');
    } finally {
      this.saving.set(false);
    }
  }
}
