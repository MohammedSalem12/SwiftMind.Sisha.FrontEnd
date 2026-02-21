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
    <div class="page">
      <div class="form-card">
        <div class="card-header-section">
          <button class="btn-back" (click)="goBack()">
            <i class="fas fa-arrow-right"></i>
          </button>
          <div>
            <h2>تعديل المجموعة</h2>
            <p class="subtitle">تعديل اسم المجموعة</p>
          </div>
        </div>

        <div *ngIf="loading()" class="loading-section">
          <div class="spinner-border text-primary" role="status"></div>
          <p>جاري التحميل...</p>
        </div>

        <form *ngIf="!loading()" class="card-body-section" (ngSubmit)="submit()">
          <div class="field">
            <label>اسم المجموعة <span class="required">*</span></label>
            <input name="name" [(ngModel)]="name" required placeholder="اسم المجموعة" />
          </div>

          <div *ngIf="errorMsg()" class="error-msg">
            <i class="fas fa-exclamation-circle me-1"></i>
            {{ errorMsg() }}
          </div>

          <div class="actions">
            <button class="btn-primary" type="submit" [disabled]="saving() || !name">
              <i class="fas fa-save me-1"></i>
              {{ saving() ? 'جاري الحفظ...' : 'حفظ التعديلات' }}
            </button>
            <button type="button" class="btn-outline" (click)="goBack()">إلغاء</button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .page { display: flex; justify-content: center; padding: 2rem; background: #f8f9fa; min-height: 100vh; }
    .form-card { width: 100%; max-width: 600px; background: white; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); overflow: hidden; }
    .card-header-section { padding: 1.5rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; display: flex; align-items: center; gap: 1rem; }
    .card-header-section h2 { margin: 0; font-size: 1.5rem; }
    .card-header-section .subtitle { margin: 0.25rem 0 0; opacity: 0.85; font-size: 0.9rem; }
    .btn-back { background: rgba(255,255,255,0.2); border: none; color: white; width: 40px; height: 40px; border-radius: 10px; cursor: pointer; font-size: 1.1rem; }
    .loading-section { padding: 3rem; text-align: center; }
    .card-body-section { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem; }
    .field { display: flex; flex-direction: column; }
    .field label { font-weight: 600; margin-bottom: 0.5rem; color: #333; }
    .field .required { color: #dc3545; }
    .field input { padding: 0.75rem; border: 1px solid #e0e0e0; border-radius: 10px; font-size: 1rem; }
    .field input:focus { outline: none; border-color: #667eea; box-shadow: 0 0 0 3px rgba(102,126,234,0.15); }
    .error-msg { color: #dc3545; background: #fff5f5; padding: 0.75rem; border-radius: 8px; border: 1px solid #ffe0e0; }
    .actions { display: flex; gap: 0.75rem; margin-top: 0.5rem; }
    .btn-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 10px; cursor: pointer; font-weight: 600; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-outline { background: transparent; border: 1px solid #ccc; padding: 0.75rem 1.5rem; border-radius: 10px; cursor: pointer; }
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
