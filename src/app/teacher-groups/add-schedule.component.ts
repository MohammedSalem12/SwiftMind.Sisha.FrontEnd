import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { GroupService } from '@proxy/groups';

@Component({
  selector: 'app-add-schedule',
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
            <h2>إضافة موعد جديد</h2>
            <p class="subtitle">أضف موعد حصة للمجموعة</p>
          </div>
        </div>

        <form class="card-body-section" (ngSubmit)="submit()">
          <div class="field">
            <label>اليوم <span class="required">*</span></label>
            <select name="dayOfWeek" [(ngModel)]="dayOfWeek" required>
              <option [value]="-1">-- اختر اليوم --</option>
              <option *ngFor="let day of days; let i = index" [value]="i">{{ day }}</option>
            </select>
          </div>

          <div class="field-row">
            <div class="field">
              <label>وقت البداية <span class="required">*</span></label>
              <input type="time" name="startTime" [(ngModel)]="startTime" step="3600" required />
            </div>
            <div class="field">
              <label>وقت النهاية <span class="required">*</span></label>
              <input type="time" name="endTime" [(ngModel)]="endTime" step="3600" required />
            </div>
          </div>

          <div *ngIf="errorMsg()" class="error-msg">
            <i class="fas fa-exclamation-circle me-1"></i>
            {{ errorMsg() }}
          </div>

          <div class="actions">
            <button class="btn-primary" type="submit" [disabled]="saving() || dayOfWeek < 0 || !startTime || !endTime">
              <i class="fas fa-plus me-1"></i>
              {{ saving() ? 'جاري الحفظ...' : 'إضافة الموعد' }}
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
    .card-header-section { padding: 1.5rem; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; display: flex; align-items: center; gap: 1rem; }
    .card-header-section h2 { margin: 0; font-size: 1.5rem; }
    .card-header-section .subtitle { margin: 0.25rem 0 0; opacity: 0.85; font-size: 0.9rem; }
    .btn-back { background: rgba(255,255,255,0.2); border: none; color: white; width: 40px; height: 40px; border-radius: 10px; cursor: pointer; font-size: 1.1rem; }
    .card-body-section { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem; }
    .field { display: flex; flex-direction: column; flex: 1; }
    .field-row { display: flex; gap: 1rem; }
    .field label { font-weight: 600; margin-bottom: 0.5rem; color: #333; }
    .field .required { color: #dc3545; }
    .field input, .field select { padding: 0.75rem; border: 1px solid #e0e0e0; border-radius: 10px; font-size: 1rem; }
    .field input:focus, .field select:focus { outline: none; border-color: #28a745; box-shadow: 0 0 0 3px rgba(40,167,69,0.15); }
    .error-msg { color: #dc3545; background: #fff5f5; padding: 0.75rem; border-radius: 8px; border: 1px solid #ffe0e0; }
    .actions { display: flex; gap: 0.75rem; margin-top: 0.5rem; }
    .btn-primary { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 10px; cursor: pointer; font-weight: 600; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-outline { background: transparent; border: 1px solid #ccc; padding: 0.75rem 1.5rem; border-radius: 10px; cursor: pointer; }
  `],
})
export class AddScheduleComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly groupService = inject(GroupService);

  saving = signal(false);
  errorMsg = signal<string | null>(null);

  groupId = '';
  dayOfWeek = -1;
  startTime = '';
  endTime = '';

  days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  ngOnInit() {
    this.groupId = this.route.snapshot.paramMap.get('groupId') || '';
    if (!this.groupId) {
      this.router.navigate(['/teacher-groups']);
    }
  }

  async submit() {
    if (this.dayOfWeek < 0 || !this.startTime || !this.endTime || !this.groupId) return;
    this.saving.set(true);
    this.errorMsg.set(null);
    try {
      const toExactHour = (t: string) => t.slice(0, 2) + ':00';
      await lastValueFrom(this.groupService.addScheduleToGroup(this.groupId, {
        dayOfWeek: Number(this.dayOfWeek),
        startTime: toExactHour(this.startTime),
        endTime: toExactHour(this.endTime),
      }));
      this.router.navigate(['/teacher-groups']);
    } catch (err: any) {
      console.error('Error adding schedule:', err);
      this.errorMsg.set('حدث خطأ أثناء إضافة الموعد. يرجى المحاولة مرة أخرى.');
    } finally {
      this.saving.set(false);
    }
  }

  goBack() {
    this.router.navigate(['/teacher-groups']);
  }
}
