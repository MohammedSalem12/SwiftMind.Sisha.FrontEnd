import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { AcademyService } from '@proxy/academies';
import type { CreateAcademyDto } from '@proxy/academies/models';
import { CurrentUserInfoService } from '@proxy/common';

@Component({
  selector: 'app-academy-create',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="create-page" dir="rtl">
      <div class="page-header">
        <button class="btn-back" (click)="goBack()">
          <i class="fas fa-arrow-right"></i>
        </button>
        <div>
          <h1>إنشاء أكاديمية جديدة</h1>
          <p>Create a New Academy</p>
        </div>
      </div>

      <div class="form-card">
        <div class="form-group">
          <label>اسم الأكاديمية بالعربية *</label>
          <input type="text" [(ngModel)]="form.nameAr" placeholder="اسم الأكاديمية" class="form-input" />
        </div>

        <div class="form-group">
          <label>Academy Name in English *</label>
          <input type="text" [(ngModel)]="form.nameEn" placeholder="Academy name" class="form-input" dir="ltr" />
        </div>

        <div class="form-group">
          <label>الوصف (اختياري)</label>
          <textarea
            [(ngModel)]="form.description"
            placeholder="وصف مختصر للأكاديمية..."
            class="form-textarea"
            rows="3">
          </textarea>
        </div>

        <div class="form-group" *ngIf="isAdmin()">
          <label>كود المشرف (مطلوب للمشرف)</label>
          <input
            type="text"
            [(ngModel)]="form.supervisorTeacherCode"
            placeholder="T-XXXXXXX"
            class="form-input"
            dir="ltr" />
          <small class="hint">أدخل كود المعلم الذي سيكون مشرفاً على الأكاديمية</small>
        </div>

        <div *ngIf="error()" class="error-msg">
          <i class="fas fa-exclamation-circle me-1"></i>{{ error() }}
        </div>

        <button
          class="btn-submit"
          (click)="submit()"
          [disabled]="submitting()">
          <span *ngIf="!submitting()">
            <i class="fas fa-check me-1"></i> إنشاء الأكاديمية
          </span>
          <span *ngIf="submitting()">
            <div class="spinner-sm"></div> جاري الإنشاء...
          </span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .create-page { padding: 16px; max-width: 560px; margin: 0 auto; font-family: 'Segoe UI', sans-serif; }
    .page-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
    .btn-back {
      background: #f5f5f5;
      border: none;
      border-radius: 50%;
      width: 40px; height: 40px;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; color: #555;
    }
    .page-header h1 { font-size: 20px; font-weight: 700; margin: 0; color: #333; }
    .page-header p { font-size: 13px; color: #888; margin: 0; }
    .form-card {
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
      padding: 24px;
    }
    .form-group { margin-bottom: 18px; }
    label { display: block; font-size: 13px; font-weight: 600; color: #444; margin-bottom: 6px; }
    .form-input, .form-textarea {
      width: 100%;
      padding: 11px 14px;
      border: 1px solid #e0e0e0;
      border-radius: 10px;
      font-size: 14px;
      direction: rtl;
      box-sizing: border-box;
      transition: border-color 0.2s;
    }
    .form-input:focus, .form-textarea:focus { outline: none; border-color: #764ba2; }
    .form-textarea { resize: vertical; }
    .hint { font-size: 11px; color: #999; margin-top: 4px; display: block; }
    .error-msg {
      background: #fff3f3;
      color: #c0392b;
      border: 1px solid #f5c6cb;
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 13px;
      margin-bottom: 16px;
    }
    .btn-submit {
      width: 100%;
      padding: 13px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: #fff;
      border: none;
      border-radius: 10px;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
    .spinner-sm {
      width: 16px; height: 16px;
      border: 2px solid rgba(255,255,255,0.4);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class AcademyCreateComponent implements OnInit {
  readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly academyService = inject(AcademyService);
  private readonly currentUserService = inject(CurrentUserInfoService);

  form: CreateAcademyDto = { nameAr: '', nameEn: '', description: undefined, supervisorTeacherCode: undefined };
  submitting = signal(false);
  error = signal<string | null>(null);
  isAdmin = signal(false);

  async ngOnInit(): Promise<void> {
    try {
      const userInfo = await lastValueFrom(this.currentUserService.getCurrentUserActorInfo());
      this.isAdmin.set((userInfo?.userRoles || []).includes('ADMIN'));
    } catch { /* ignore */ }
  }

  goBack(): void { this.location.back(); }

  async submit(): Promise<void> {
    if (!this.form.nameAr?.trim() || !this.form.nameEn?.trim()) {
      this.error.set('يرجى إدخال اسم الأكاديمية بالعربية والإنجليزية.');
      return;
    }
    if (this.isAdmin() && !this.form.supervisorTeacherCode?.trim()) {
      this.error.set('يرجى إدخال كود المشرف.');
      return;
    }

    this.submitting.set(true);
    this.error.set(null);
    try {
      const academy = await lastValueFrom(this.academyService.create(this.form));
      this.router.navigate(['/academies', academy.id, 'profile']);
    } catch (err: any) {
      const msg = err?.error?.error?.message || err?.message || 'حدث خطأ أثناء إنشاء الأكاديمية.';
      this.error.set(msg);
    } finally {
      this.submitting.set(false);
    }
  }
}
