import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { GroupService } from '@proxy/groups';

@Component({
  selector: 'app-edit-schedule',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="edit-sched-page" dir="rtl">

      <!-- Hero header -->
      <div class="hero">
        <div class="hero-blob b1"></div>
        <div class="hero-blob b2"></div>
        <button class="back-btn" (click)="goBack()">
          <i class="fas fa-arrow-right"></i>
        </button>
        <div class="hero-text">
          <h1>تعديل الموعد</h1>
          <p>Edit Schedule · تعديل تفاصيل موعد الحصة</p>
        </div>
        <div class="hero-icon">
          <i class="fas fa-calendar-check"></i>
        </div>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="loading-area">
          <div class="spinner"></div>
          <span>جاري التحميل...</span>
        </div>
      }

      <!-- Form card -->
      @if (!loading()) {
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
    .edit-sched-page { direction: rtl; min-height: 100vh; background: #f4f5fb; padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px)); }

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
    .loading-area { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.6rem; padding: 3rem 1rem; font-size: 0.88rem; color: #6b7280; }

    /* Form */
    .form-wrap { padding: 1.25rem 1rem; }
    .field-group { display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 1rem; }
    .field-label { font-size: 0.8rem; font-weight: 700; color: #4a4a6a; display: flex; align-items: center; gap: 0.35rem; }
    .field-label i { color: #667eea; font-size: 0.72rem; }
    .req { color: #ef4444; }
    .field-input { padding: 0.75rem 1rem; border: 1.5px solid #e5e7eb; border-radius: 12px; font-size: 0.95rem; background: #fff; width: 100%; box-sizing: border-box; transition: border-color 0.15s, box-shadow 0.15s; direction: rtl; font-family: inherit; }
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

    .spinner { width: 32px; height: 32px; border: 3px solid #e5e7eb; border-top-color: #667eea; border-radius: 50%; animation: spin 0.7s linear infinite; }
    .spinner-btn { width: 16px; height: 16px; border: 2.5px solid rgba(255,255,255,0.4); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; flex-shrink: 0; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class EditScheduleComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly groupService = inject(GroupService);

  loading = signal(true);
  saving = signal(false);
  errorMsg = signal<string | null>(null);

  scheduleId = '';
  groupId = '';
  dayOfWeek = -1;
  startHour = -1;
  ampm = 'AM';
  duration = 0;

  days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  hours = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  async ngOnInit() {
    this.scheduleId = this.route.snapshot.paramMap.get('scheduleId') || '';
    this.groupId = this.route.snapshot.queryParamMap.get('groupId') || '';

    if (!this.scheduleId) {
      this.router.navigate(['/teacher-groups']);
      return;
    }
    await this.loadSchedule();
  }

  private async loadSchedule() {
    this.loading.set(true);
    try {
      const groups = await lastValueFrom(this.groupService.getList());
      if (groups.items) {
        for (const group of groups.items) {
          const teacherId = group.teacherId || '';
          const courseId = group.courseId || '';
          if (teacherId && courseId) {
            const groupsWithSchedules = await lastValueFrom(
              this.groupService.getGroupsByCourseAndTeacher(courseId, teacherId)
            );
            for (const gwsDto of groupsWithSchedules) {
              const schedule = gwsDto.schedules?.find((s: any) => s.id === this.scheduleId);
              if (schedule) {
                this.dayOfWeek = schedule.dayOfWeek;
                this.groupId = gwsDto.groupId || '';
                // Parse 24h time to 12h format
                this.parseTime(schedule.startTime || '', schedule.endTime || '');
                this.loading.set(false);
                return;
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('Error loading schedule:', err);
    } finally {
      this.loading.set(false);
    }
  }

  private parseTime(startTime: string, endTime: string): void {
    if (!startTime) return;
    const startParts = startTime.split(':');
    let h = parseInt(startParts[0], 10);
    this.ampm = h >= 12 ? 'PM' : 'AM';
    this.startHour = h === 0 ? 12 : h > 12 ? h - 12 : h;

    if (endTime) {
      const endParts = endTime.split(':');
      const endH = parseInt(endParts[0], 10);
      const endM = parseInt(endParts[1] || '0', 10);
      const startM = parseInt(startParts[1] || '0', 10);
      const diffMinutes = ((endH * 60 + endM) - (h * 60 + startM) + 1440) % 1440;
      const diffHours = diffMinutes / 60;
      this.duration = [1, 1.5, 2].includes(diffHours) ? diffHours : 1;
    } else {
      this.duration = 1;
    }
  }

  private to24h(hour: number, ampm: string): string {
    let h = Number(hour);
    if (ampm === 'AM') {
      h = h === 12 ? 0 : h;
    } else {
      h = h === 12 ? 12 : h + 12;
    }
    return `${String(h).padStart(2, '0')}:00`;
  }

  formatDisplay(hour: number, ampm: string): string {
    return `${hour} ${ampm === 'AM' ? 'ص' : 'م'}`;
  }

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
    if (this.dayOfWeek < 0 || this.startHour < 0 || this.duration < 1 || !this.scheduleId) return;
    const startTime = this.to24h(this.startHour, this.ampm);
    const startH = parseInt(startTime);
    const totalMinutes = startH * 60 + this.duration * 60;
    const endH = Math.floor(totalMinutes / 60) % 24;
    const endM = totalMinutes % 60;
    const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

    this.saving.set(true);
    this.errorMsg.set(null);
    try {
      await lastValueFrom(this.groupService.updateSchedule(this.scheduleId, {
        dayOfWeek: Number(this.dayOfWeek),
        startTime,
        endTime,
      }));
      this.goBack();
    } catch (err: any) {
      console.error('Error updating schedule:', err);
      this.errorMsg.set('حدث خطأ أثناء تعديل الموعد. يرجى المحاولة مرة أخرى.');
    } finally {
      this.saving.set(false);
    }
  }

  goBack() {
    this.router.navigate(['/teacher-groups']);
  }
}
