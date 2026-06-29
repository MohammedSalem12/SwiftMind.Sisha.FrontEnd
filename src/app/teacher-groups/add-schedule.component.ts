import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { GroupService } from '@proxy/groups';
import { PageHeaderComponent } from '../shared/components/page-header.component';

@Component({
  selector: 'app-add-schedule',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  template: `
    <div class="add-sched-page" dir="rtl">

      <app-page-header
        [title]="'إضافة موعد جديد'"
        [titleEn]="'أضف موعد حصة للمجموعة'"
        (back)="goBack()"></app-page-header>

      <!-- Form card -->
      <div class="form-wrap">
        <form (ngSubmit)="submit()">

          <!-- Day -->
          <div class="field-group">
            <label class="field-label">
              <i class="fas fa-calendar-day"></i> اليوم <span class="req">*</span>
            </label>
            <select class="field-input" name="dayOfWeek" [(ngModel)]="dayOfWeek" required>
              <option [value]="-1">-- اختر اليوم --</option>
              <option *ngFor="let day of days; let i = index" [value]="i">{{ day }}</option>
            </select>
          </div>

          <!-- Start hour -->
          <div class="time-row">
            <div class="field-group">
              <label class="field-label">
                <i class="fas fa-clock"></i> ساعة البداية <span class="req">*</span>
              </label>
              <select class="field-input" name="startHour" [(ngModel)]="startHour" required>
                <option [value]="-1">-- الساعة --</option>
                <option *ngFor="let h of hours" [value]="h">{{ h }}</option>
              </select>
            </div>
            <div class="field-group">
              <label class="field-label">
                <i class="fas fa-sun"></i> الفترة <span class="req">*</span>
              </label>
              <select class="field-input" name="ampm" [(ngModel)]="ampm" required>
                <option value="AM">صباحاً (ص)</option>
                <option value="PM">مساءً (م)</option>
              </select>
            </div>
          </div>

          <!-- Duration -->
          <div class="field-group">
            <label class="field-label">
              <i class="fas fa-hourglass-half"></i> مدة الحصة <span class="req">*</span>
            </label>
            <div class="duration-row">
              <button type="button" class="dur-btn" [class.active]="duration === 1" (click)="duration = 1">
                <i class="fas fa-clock"></i> ساعة
              </button>
              <button type="button" class="dur-btn" [class.active]="duration === 1.5" (click)="duration = 1.5">
                <i class="fas fa-clock"></i> ساعة ونصف
              </button>
              <button type="button" class="dur-btn" [class.active]="duration === 2" (click)="duration = 2">
                <i class="fas fa-clock"></i> ساعتان
              </button>
            </div>
          </div>

          <!-- Computed end time preview -->
          @if (startHour >= 0 && duration > 0) {
            <div class="time-preview">
              <i class="fas fa-arrow-left"></i>
              <span>من {{ formatDisplay(startHour, ampm) }}</span>
              <span class="arrow">←</span>
              <span>إلى {{ endTimeDisplay() }}</span>
            </div>
          }

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
              [disabled]="saving() || dayOfWeek < 0 || startHour < 0 || duration < 1">
              @if (saving()) {
                <div class="spinner"></div>
                <span>جاري الحفظ...</span>
              } @else {
                <i class="fas fa-plus"></i>
                <span>إضافة الموعد</span>
              }
            </button>
            <button class="btn-cancel" type="button" (click)="goBack()">إلغاء</button>
          </div>

        </form>
      </div>
    </div>
  `,
  styles: [`
    .add-sched-page { direction: rtl; min-height: 100vh; background: #f4f5fb; padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px)); }

    /* Form */
    .form-wrap { padding: 1.25rem 1rem; }
    .field-group { display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 1rem; }
    .field-label { font-size: 0.8rem; font-weight: 700; color: #4a4a6a; display: flex; align-items: center; gap: 0.35rem; }
    .field-label i { color: #667eea; font-size: 0.72rem; }
    .req { color: #ef4444; }
    .field-input { padding: 0.75rem 1rem; border: 1.5px solid #e5e7eb; border-radius: 12px; font-size: 0.95rem; background: #fff; width: 100%; box-sizing: border-box; transition: border-color 0.15s, box-shadow 0.15s; direction: rtl; }
    .field-input:focus { outline: none; border-color: #667eea; box-shadow: 0 0 0 3px rgba(102,126,234,0.12); }
    select.field-input { appearance: none; -webkit-appearance: none; cursor: pointer; }

    .time-row { display: flex; gap: 0.75rem; }
    .time-row .field-group { flex: 1; }

    .error-banner { display: flex; align-items: center; gap: 0.6rem; padding: 0.875rem 1rem; background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; color: #dc2626; font-size: 0.85rem; margin-bottom: 1rem; }
    .error-banner i { font-size: 1rem; flex-shrink: 0; }

    .form-actions { display: flex; gap: 0.75rem; margin-top: 0.5rem; }
    .btn-submit { flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.5rem; background: linear-gradient(145deg, #667eea, #764ba2); color: #fff; border: none; padding: 0.875rem; border-radius: 12px; font-size: 0.95rem; font-weight: 700; cursor: pointer; min-height: 50px; box-shadow: 0 4px 14px rgba(102,126,234,0.35); transition: opacity 0.15s; }
    .btn-submit:disabled { opacity: 0.55; cursor: not-allowed; box-shadow: none; }
    .btn-cancel { padding: 0.875rem 1.25rem; border-radius: 12px; border: 1.5px solid #e5e7eb; background: #fff; color: #6b7280; font-size: 0.9rem; font-weight: 600; cursor: pointer; min-height: 50px; }

    .duration-row { display: flex; gap: 0.75rem; }
    .dur-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.4rem; padding: 0.75rem; border-radius: 12px; border: 1.5px solid #e5e7eb; background: #fff; color: #6b7280; font-size: 0.875rem; font-weight: 600; cursor: pointer; min-height: 50px; transition: border-color 0.15s, background 0.15s, color 0.15s; }
    .dur-btn.active { border-color: #667eea; background: rgba(102,126,234,0.08); color: #667eea; }
    .dur-btn i { font-size: 0.8rem; }

    .time-preview { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem; background: #f0f4ff; border: 1px solid #c7d7fd; border-radius: 12px; font-size: 0.875rem; font-weight: 600; color: #3730a3; margin-bottom: 1rem; direction: rtl; }
    .time-preview .arrow { color: #667eea; }
    .time-preview i { font-size: 0.8rem; }

    .spinner { width: 16px; height: 16px; border: 2.5px solid rgba(255,255,255,0.4); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; flex-shrink: 0; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class AddScheduleComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly groupService = inject(GroupService);

  saving    = signal(false);
  errorMsg  = signal<string | null>(null);

  groupId  = '';
  courseId = '';
  dayOfWeek = -1;
  startHour = -1;     // 1–12
  ampm      = 'AM';   // 'AM' | 'PM'
  duration  = 0;      // 1 or 2

  days  = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  hours = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  ngOnInit() {
    this.groupId  = this.route.snapshot.paramMap.get('groupId') || '';
    this.courseId = this.route.snapshot.queryParamMap.get('courseId') || '';
    if (!this.groupId) this.goBack();
  }

  /** Convert 12h display to 24h "HH:mm" string */
  private to24h(hour: number, ampm: string): string {
    let h = Number(hour);
    if (ampm === 'AM') {
      h = h === 12 ? 0 : h;
    } else {
      h = h === 12 ? 12 : h + 12;
    }
    return `${String(h).padStart(2, '0')}:00`;
  }

  /** Display string e.g. "9 ص" */
  formatDisplay(hour: number, ampm: string): string {
    return `${hour} ${ampm === 'AM' ? 'ص' : 'م'}`;
  }

  /** Computed end time display */
  endTimeDisplay(): string {
    if (this.startHour < 0 || this.duration < 1) return '';
    const startTime = this.to24h(this.startHour, this.ampm);
    const startH = parseInt(startTime);
    const totalMinutes = startH * 60 + this.duration * 60;
    const endH = Math.floor(totalMinutes / 60) % 24;
    const endM = totalMinutes % 60;
    const ap = endH >= 12 ? 'PM' : 'AM';
    const display12 = endH === 0 ? 12 : endH > 12 ? endH - 12 : endH;
    const suffix = ap === 'AM' ? 'ص' : 'م';
    return endM > 0 ? `${display12}:${String(endM).padStart(2, '0')} ${suffix}` : `${display12} ${suffix}`;
  }

  async submit() {
    if (this.dayOfWeek < 0 || this.startHour < 0 || this.duration < 1 || !this.groupId) return;
    const startTime = this.to24h(this.startHour, this.ampm);
    const startH = parseInt(startTime);
    const totalMinutes = startH * 60 + this.duration * 60;
    const endH = Math.floor(totalMinutes / 60) % 24;
    const endM = totalMinutes % 60;
    const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

    this.saving.set(true);
    this.errorMsg.set(null);
    try {
      await lastValueFrom(this.groupService.addScheduleToGroup(this.groupId, {
        dayOfWeek: Number(this.dayOfWeek),
        startTime,
        endTime,
      }));
      this.goBack();
    } catch (err: any) {
      console.error('Error adding schedule:', err);
      this.errorMsg.set('حدث خطأ أثناء إضافة الموعد. يرجى المحاولة مرة أخرى.');
    } finally {
      this.saving.set(false);
    }
  }

  goBack() {
    const qp: any = {};
    if (this.courseId) qp['courseId'] = this.courseId;
    this.router.navigate(['/teacher-groups'], { queryParams: qp });
  }
}
