import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { AcademyService } from '@proxy/academies';
import type { CreateAcademyDto, AcademyDto } from '@proxy/academies/models';
import { CurrentUserInfoService } from '@proxy/common';
import { PageHeaderComponent } from '../shared/components/page-header.component';
import { ImageCropService } from '../shared/services/image-crop.service';

@Component({
  selector: 'app-academy-create',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, FormsModule, PageHeaderComponent],
  template: `
    <div class="ac-page" dir="rtl">

      <!-- Header -->
      <app-page-header
        [title]="isEdit() ? 'تعديل الأكاديمية' : 'إنشاء أكاديمية'"
        [titleEn]="isEdit() ? 'Edit Academy' : 'Create a New Academy'"
        (back)="goBack()">
      </app-page-header>

      <!-- Loading existing data -->
      @if (loadingData()) {
        <div class="loading-area">
          <div class="shimmer-field"></div>
          <div class="shimmer-field"></div>
          <div class="shimmer-field sh-short"></div>
        </div>
      }

      <!-- Form -->
      @if (!loadingData()) {
        <div class="form-wrap">

          <!-- Logo picker -->
          <div class="logo-field">
            <button type="button" class="logo-btn" (click)="logoInput.click()"
                    [attr.aria-label]="'شعار الأكاديمية · Academy logo'">
              @if (logoUrl()) {
                <img class="logo-img" [src]="logoUrl()" alt="" />
                <span class="logo-edit"><i class="fas fa-camera"></i></span>
              } @else {
                <i class="fas fa-university logo-placeholder"></i>
                <span class="logo-add"><i class="fas fa-plus"></i></span>
              }
            </button>
            <div class="logo-meta">
              <span class="logo-title">شعار الأكاديمية · Academy Logo</span>
              <span class="logo-hint">اختياري · اضغط لاختيار صورة</span>
              @if (logoUrl()) {
                <button type="button" class="logo-remove" (click)="removeLogo()">
                  <i class="fas fa-trash-alt"></i> إزالة · Remove
                </button>
              }
            </div>
            <input #logoInput type="file" accept="image/*" hidden
                   (change)="onLogoPicked($event)" />
          </div>

          <div class="field-group">
            <label class="field-label">
              <i class="fas fa-font"></i> الاسم بالعربية · Arabic Name <span class="req">*</span>
            </label>
            <input class="field-input" type="text" [(ngModel)]="form.nameAr"
              placeholder="اسم الأكاديمية" />
          </div>

          <div class="field-group">
            <label class="field-label">
              <i class="fas fa-font"></i> الاسم بالإنجليزية · English Name <span class="req">*</span>
            </label>
            <input class="field-input" type="text" [(ngModel)]="form.nameEn"
              placeholder="Academy name" dir="ltr" />
          </div>

          <div class="field-group">
            <label class="field-label">
              <i class="fas fa-align-right"></i> الوصف · Description <span class="opt">(اختياري · optional)</span>
            </label>
            <textarea class="field-input field-textarea" [(ngModel)]="form.description"
              placeholder="وصف مختصر للأكاديمية..." rows="3"></textarea>
          </div>

          @if (isAdmin() && !isEdit()) {
            <div class="field-group">
              <label class="field-label">
                <i class="fas fa-user-tie"></i> كود المشرف · Supervisor Code <span class="req">*</span>
              </label>
              <input class="field-input" type="text" [(ngModel)]="form.supervisorTeacherCode"
                placeholder="T-XXXXXXX" dir="ltr" />
              <span class="field-hint">كود المعلم الذي سيكون مشرفاً على الأكاديمية</span>
            </div>
          }

          @if (error()) {
            <div class="error-banner">
              <i class="fas fa-exclamation-circle"></i>
              {{ error() }}
            </div>
          }

          @if (success()) {
            <div class="success-banner">
              <i class="fas fa-check-circle"></i>
              {{ success() }}
            </div>
          }

          <button class="btn-submit" (click)="submit()" [disabled]="submitting()">
            @if (submitting()) {
              <div class="spinner"></div>
              <span>{{ isEdit() ? 'جاري الحفظ...' : 'جاري الإنشاء...' }}</span>
            } @else {
              <i class="fas" [class]="isEdit() ? 'fas fa-save' : 'fas fa-check'"></i>
              <span>{{ isEdit() ? 'حفظ التعديلات · Save Changes' : 'إنشاء الأكاديمية · Create Academy' }}</span>
            }
          </button>

        </div>
      }
    </div>
  `,
  styles: [`
    .ac-page { direction: rtl; min-height: 100vh; background: #f4f5fb; padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px)); }

    /* Loading */
    .loading-area { padding: 1.25rem 1rem; display: flex; flex-direction: column; gap: 1.1rem; }
    .shimmer-field {
      height: 70px; border-radius: 12px;
      background: linear-gradient(90deg, #e8e8f0 25%, #f0f0f8 50%, #e8e8f0 75%);
      background-size: 200% 100%; animation: shimmer 1.4s infinite;
    }
    .sh-short { height: 110px; }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

    /* Form */
    .form-wrap { padding: 1.25rem 1rem; display: flex; flex-direction: column; gap: 0; }

    /* Logo picker */
    .logo-field { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.4rem; }
    .logo-btn {
      position: relative; width: 84px; height: 84px; border-radius: 20px; flex-shrink: 0;
      border: 2px dashed #cdd2f0; background: #fff; padding: 0; cursor: pointer; overflow: hidden;
      display: flex; align-items: center; justify-content: center; -webkit-tap-highlight-color: transparent;
    }
    .logo-btn:active { transform: scale(0.97); }
    .logo-img { width: 100%; height: 100%; object-fit: cover; }
    .logo-placeholder { font-size: 1.9rem; color: #b9bfe6; }
    .logo-add, .logo-edit {
      position: absolute; bottom: 4px; left: 4px; width: 24px; height: 24px; border-radius: 50%;
      background: linear-gradient(135deg,#667eea,#764ba2); color: #fff; font-size: 0.65rem;
      display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(102,126,234,0.4);
    }
    .logo-meta { display: flex; flex-direction: column; gap: 0.2rem; }
    .logo-title { font-size: 0.82rem; font-weight: 700; color: #4a4a6a; }
    .logo-hint { font-size: 0.72rem; color: #9ca3af; }
    .logo-remove {
      align-self: flex-start; margin-top: 0.3rem; background: none; border: none; padding: 0;
      color: #ef4444; font-size: 0.74rem; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 0.3rem;
    }
    .field-group { display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 1.1rem; }
    .field-label { font-size: 0.8rem; font-weight: 700; color: #4a4a6a; display: flex; align-items: center; gap: 0.35rem; }
    .field-label i { color: #667eea; font-size: 0.7rem; }
    .req { color: #ef4444; }
    .opt { color: #9ca3af; font-weight: 400; }
    .field-input { padding: 0.75rem 1rem; border: 1.5px solid #e5e7eb; border-radius: 12px; font-size: 16px; background: #fff; width: 100%; box-sizing: border-box; transition: border-color 0.15s, box-shadow 0.15s; direction: rtl; font-family: inherit; -webkit-appearance: none; }
    .field-input:focus { outline: none; border-color: #667eea; box-shadow: 0 0 0 3px rgba(102,126,234,0.12); }
    .field-textarea { resize: vertical; min-height: 80px; }
    .field-hint { font-size: 0.72rem; color: #9ca3af; }

    .error-banner { display: flex; align-items: center; gap: 0.6rem; padding: 0.875rem 1rem; background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; color: #dc2626; font-size: 0.85rem; margin-bottom: 1rem; }
    .error-banner i { font-size: 1rem; flex-shrink: 0; }

    .success-banner { display: flex; align-items: center; gap: 0.6rem; padding: 0.875rem 1rem; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; color: #16a34a; font-size: 0.85rem; margin-bottom: 1rem; }
    .success-banner i { font-size: 1rem; flex-shrink: 0; }

    .btn-submit { width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem; background: linear-gradient(145deg, #667eea, #764ba2); color: #fff; border: none; padding: 0.9rem; border-radius: 14px; font-size: 0.95rem; font-weight: 700; cursor: pointer; min-height: 52px; box-shadow: 0 4px 14px rgba(102,126,234,0.35); transition: opacity 0.15s; margin-top: 0.25rem; }
    .btn-submit:disabled { opacity: 0.55; cursor: not-allowed; box-shadow: none; }
    .btn-submit:active:not(:disabled) { transform: scale(0.98); }

    .spinner { width: 16px; height: 16px; border: 2.5px solid rgba(255,255,255,0.4); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; flex-shrink: 0; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class AcademyCreateComponent implements OnInit {
  readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly academyService = inject(AcademyService);
  private readonly currentUserService = inject(CurrentUserInfoService);
  private readonly imageCrop = inject(ImageCropService);

  form: CreateAcademyDto = { nameAr: '', nameEn: '', description: undefined, supervisorTeacherCode: undefined };
  logoUrl = signal<string | null>(null);
  submitting = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  isAdmin = signal(false);
  isEdit = signal(false);
  loadingData = signal(false);

  private editId: string | null = null;

  async ngOnInit(): Promise<void> {
    try {
      const userInfo = await lastValueFrom(this.currentUserService.getCurrentUserActorInfo());
      this.isAdmin.set((userInfo?.userRoles || []).includes('ADMIN'));
    } catch { /* ignore */ }

    // Check if we're in edit mode (route has :id)
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.editId = id;
      await this.loadAcademy(id);
    }
  }

  private async loadAcademy(id: string): Promise<void> {
    this.loadingData.set(true);
    try {
      const academy = await lastValueFrom(this.academyService.get(id));
      this.form = {
        nameAr: academy.nameAr || '',
        nameEn: academy.nameEn || '',
        description: academy.description || undefined,
        supervisorTeacherCode: undefined,
      };
      this.logoUrl.set((academy as any).logoUrl || null);
    } catch (err: any) {
      this.error.set('فشل تحميل بيانات الأكاديمية · Failed to load academy data');
    } finally {
      this.loadingData.set(false);
    }
  }

  goBack(): void { this.location.back(); }

  async onLogoPicked(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // allow re-picking the same file
    if (!file) return;
    const dataUrl = await this.imageCrop.crop(file, { size: 256, quality: 0.85 });
    if (dataUrl) this.logoUrl.set(dataUrl);
  }

  removeLogo(): void { this.logoUrl.set(null); }

  async submit(): Promise<void> {
    if (!this.form.nameAr?.trim() || !this.form.nameEn?.trim()) {
      this.error.set('يرجى إدخال اسم الأكاديمية بالعربية والإنجليزية · Please enter both Arabic and English names');
      return;
    }
    if (!this.isEdit() && this.isAdmin() && !this.form.supervisorTeacherCode?.trim()) {
      this.error.set('يرجى إدخال كود المشرف · Please enter supervisor code');
      return;
    }

    this.submitting.set(true);
    this.error.set(null);
    this.success.set(null);

    try {
      if (this.isEdit() && this.editId) {
        await lastValueFrom(
          this.academyService.update(this.editId, {
            nameAr: this.form.nameAr,
            nameEn: this.form.nameEn,
            description: this.form.description || undefined,
            logoUrl: this.logoUrl() || undefined,
          } as any)
        );
        this.success.set('تم حفظ التعديلات بنجاح · Changes saved successfully');
        setTimeout(() => this.location.back(), 1000);
      } else {
        const academy = await lastValueFrom(
          this.academyService.create({ ...this.form, logoUrl: this.logoUrl() || undefined } as any)
        );
        this.router.navigate(['/academies', academy.id, 'profile']);
      }
    } catch (err: any) {
      const msg = err?.error?.error?.message || err?.message || 'حدث خطأ. حاول مجدداً · An error occurred. Try again.';
      this.error.set(msg);
    } finally {
      this.submitting.set(false);
    }
  }
}
