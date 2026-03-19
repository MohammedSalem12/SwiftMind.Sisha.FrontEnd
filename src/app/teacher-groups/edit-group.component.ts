import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { GroupService } from '@proxy/groups';

@Component({
  selector: 'app-edit-group',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="edit-page" dir="rtl">

      <!-- Hero header -->
      <div class="hero">
        <div class="hero-blob b1"></div>
        <div class="hero-blob b2"></div>
        <button class="back-btn" (click)="goBack()">
          <i class="fas fa-arrow-right"></i>
        </button>
        <div class="hero-text">
          <h1>تعديل المجموعة</h1>
          <p>Edit Group · تعديل اسم المجموعة</p>
        </div>
        <div class="hero-icon">
          <i class="fas fa-edit"></i>
        </div>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="loading-area">
          <div class="spinner"></div>
          <span>جاري التحميل...</span>
        </div>
      }

      <!-- Form -->
      @if (!loading()) {
        <div class="form-wrap">
          <form (ngSubmit)="submit()">

            <!-- Group name -->
            <div class="field-group">
              <label class="field-label">
                <i class="fas fa-pen-fancy"></i> اسم المجموعة <span class="req">*</span>
              </label>
              <input class="field-input"
                name="name"
                [(ngModel)]="name"
                required
                placeholder="اسم المجموعة" />
            </div>

            <!-- Error -->
            @if (errorMsg()) {
              <div class="error-banner">
                <i class="fas fa-exclamation-circle"></i>
                {{ errorMsg() }}
              </div>
            }

            <!-- Actions -->
            <div class="form-actions">
              <button class="btn-submit" type="submit"
                [disabled]="saving() || !name">
                @if (saving()) {
                  <div class="spinner-btn"></div>
                  <span>جاري الحفظ...</span>
                } @else {
                  <i class="fas fa-save"></i>
                  <span>حفظ التعديلات</span>
                }
              </button>
              <button class="btn-cancel" type="button" (click)="goBack()">إلغاء</button>
            </div>

          </form>
        </div>
      }
    </div>
  `,
  styles: [`
    .edit-page { direction: rtl; min-height: 100vh; background: #f4f5fb; padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px)); }

    /* Hero */
    .hero { background: linear-gradient(145deg, #667eea 0%, #764ba2 100%); padding: calc(env(safe-area-inset-top, 0px) + 1.25rem) 1.25rem 1.5rem; position: relative; overflow: hidden; display: flex; align-items: center; gap: 0.875rem; }
    .hero-blob { position: absolute; border-radius: 50%; background: rgba(255,255,255,0.07); pointer-events: none; }
    .b1 { width: 200px; height: 200px; top: -70px; right: -50px; }
    .b2 { width: 130px; height: 130px; bottom: -50px; left: -25px; }
    .back-btn { flex-shrink: 0; width: 44px; height: 44px; border-radius: 50%; background: rgba(255,255,255,0.15); border: 1.5px solid rgba(255,255,255,0.25); color: #fff; font-size: 1rem; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 1; transition: background 0.15s; }
    .back-btn:active { background: rgba(255,255,255,0.28); }
    .hero-text { flex: 1; z-index: 1; min-width: 0; }
    .hero-text h1 { font-size: 1.35rem; font-weight: 800; color: #fff; margin: 0 0 0.15rem; }
    .hero-text p { font-size: 0.72rem; color: rgba(255,255,255,0.65); margin: 0; }
    .hero-icon { z-index: 1; width: 52px; height: 52px; border-radius: 50%; background: rgba(255,255,255,0.15); border: 2px solid rgba(255,255,255,0.25); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .hero-icon i { font-size: 1.3rem; color: #fff; }

    /* Loading */
    .loading-area { display: flex; align-items: center; justify-content: center; gap: 0.6rem; padding: 3rem 1rem; font-size: 0.88rem; color: #6b7280; }

    /* Form */
    .form-wrap { padding: 1.25rem 1rem; }
    .field-group { display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 1rem; }
    .field-label { font-size: 0.8rem; font-weight: 700; color: #4a4a6a; display: flex; align-items: center; gap: 0.35rem; }
    .field-label i { color: #667eea; font-size: 0.72rem; }
    .req { color: #ef4444; }
    .field-input { padding: 0.75rem 1rem; border: 1.5px solid #e5e7eb; border-radius: 12px; font-size: 0.95rem; background: #fff; width: 100%; box-sizing: border-box; transition: border-color 0.15s, box-shadow 0.15s; direction: rtl; font-family: inherit; }
    .field-input:focus { outline: none; border-color: #667eea; box-shadow: 0 0 0 3px rgba(102,126,234,0.12); }

    .error-banner { display: flex; align-items: center; gap: 0.6rem; padding: 0.875rem 1rem; background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; color: #dc2626; font-size: 0.85rem; margin-bottom: 1rem; }
    .error-banner i { font-size: 1rem; flex-shrink: 0; }

    .form-actions { display: flex; gap: 0.75rem; margin-top: 0.5rem; }
    .btn-submit { flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.5rem; background: linear-gradient(145deg, #667eea, #764ba2); color: #fff; border: none; padding: 0.875rem; border-radius: 12px; font-size: 0.95rem; font-weight: 700; cursor: pointer; min-height: 50px; box-shadow: 0 4px 14px rgba(102,126,234,0.35); transition: opacity 0.15s; }
    .btn-submit:disabled { opacity: 0.55; cursor: not-allowed; box-shadow: none; }
    .btn-cancel { padding: 0.875rem 1.25rem; border-radius: 12px; border: 1.5px solid #e5e7eb; background: #fff; color: #6b7280; font-size: 0.9rem; font-weight: 600; cursor: pointer; min-height: 50px; }

    .spinner { width: 20px; height: 20px; border: 2.5px solid #667eea; border-top-color: transparent; border-radius: 50%; animation: spin 0.7s linear infinite; }
    .spinner-btn { width: 16px; height: 16px; border: 2.5px solid rgba(255,255,255,0.4); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; flex-shrink: 0; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class EditGroupComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly groupService = inject(GroupService);

  loading = signal(true);
  saving = signal(false);
  errorMsg = signal<string | null>(null);
  groupId = '';
  name = '';

  async ngOnInit() {
    this.groupId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.groupId) {
      this.router.navigate(['/teacher-groups']);
      return;
    }
    await this.loadGroup();
  }

  private async loadGroup() {
    this.loading.set(true);
    try {
      const groups = await lastValueFrom(this.groupService.getList());
      const group = groups.items?.find(g => g.id === this.groupId);
      if (group) {
        this.name = group.name || '';
      }
    } catch (err) {
      console.error('Error loading group:', err);
    } finally {
      this.loading.set(false);
    }
  }

  async submit() {
    if (!this.name || !this.groupId) return;
    this.saving.set(true);
    this.errorMsg.set(null);
    try {
      await lastValueFrom(this.groupService.update(this.groupId, { name: this.name }));
      this.router.navigate(['/teacher-groups']);
    } catch (err: any) {
      console.error('Error updating group:', err);
      this.errorMsg.set('حدث خطأ أثناء تعديل المجموعة. يرجى المحاولة مرة أخرى.');
    } finally {
      this.saving.set(false);
    }
  }

  goBack() {
    this.router.navigate(['/teacher-groups']);
  }
}
