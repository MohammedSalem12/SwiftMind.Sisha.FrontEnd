import { CommonModule, Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SessionService } from '@proxy/groups';
import { CurrentUserInfoService } from '@proxy/common';
import type { NextSessionDto } from '@proxy/groups/dtos/models';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-today-sessions',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="ts-page" dir="rtl">

      <!-- Header with back button -->
      <div class="ts-header">
        <button class="ts-back-btn" (click)="goBack()" aria-label="رجوع · Back" type="button">
          <i class="fas fa-arrow-right"></i>
        </button>
        <div class="ts-header-icon">
          <i class="fas fa-calendar-day"></i>
        </div>
        <div class="ts-header-text">
          <h1>حصص اليوم</h1>
          <p>Today's Sessions</p>
        </div>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="loading-area">
          <div class="spinner"></div>
          <span>جاري التحميل...</span>
        </div>
      }

      <!-- Empty -->
      @if (!loading() && sessions().length === 0) {
        <div class="empty-state">
          <i class="fas fa-calendar-check"></i>
          <p>لا توجد حصص قادمة</p>
          <small>No upcoming sessions today</small>
        </div>
      }

      <!-- Sessions List -->
      @if (!loading() && sessions().length > 0) {
        <div class="sessions-list">
          @for (s of sessions(); track s.groupScheduleId) {
            <div class="session-card" [class.session-card--now]="s.isNow" [class.session-card--past]="isPast(s)">

              <!-- Live indicator -->
              @if (s.isNow) {
                <div class="live-badge">
                  <span class="live-dot"></span>
                  <span>الآن · Live</span>
                </div>
              }

              <div class="session-row">
                <div class="session-time-block">
                  <span class="session-time">{{ formatTime(s.startTime) }}</span>
                  <span class="session-time-sep">—</span>
                  <span class="session-time">{{ formatTime(s.endTime) }}</span>
                </div>
                <div class="session-info">
                  <span class="session-course">{{ s.courseName }}</span>
                  <span class="session-group">{{ s.groupName }}</span>
                  @if (s.location) {
                    <span class="session-location">
                      <i class="fas fa-map-marker-alt"></i>
                      {{ s.location }}
                    </span>
                  }
                </div>
                <div class="session-day-icon">
                  <i class="fas fa-chalkboard"></i>
                  <span class="day-label">{{ getDayName(s.dayOfWeek) }}</span>
                </div>
              </div>

              <!-- Countdown -->
              @if (!s.isNow && !isPast(s)) {
                <div class="session-countdown">
                  <i class="fas fa-clock"></i>
                  <span>{{ formatCountdown(s.secondsUntilStart) }}</span>
                </div>
              }

              @if (isPast(s)) {
                <div class="session-done">
                  <i class="fas fa-check-circle"></i>
                  <span>انتهت</span>
                </div>
              }

              <!-- Cancel button for teachers/secretaries -->
              @if (canCancel() && !isPast(s)) {
                <button class="cancel-btn" (click)="openCancelDialog(s)" [disabled]="cancelling()">
                  @if (cancelling()) { <span class="spinner-xs"></span> }
                  @else { <i class="fas fa-times-circle"></i> }
                  إلغاء الحصة · Cancel Session
                </button>
              }

            </div>
          }
        </div>
      }

      <!-- Cancel confirmation dialog -->
      @if (showCancelDialog()) {
        <div class="dialog-overlay" (click)="closeCancelDialog()">
          <div class="dialog-card" (click)="$event.stopPropagation()">
            <div class="dialog-icon">
              <i class="fas fa-exclamation-triangle"></i>
            </div>
            <h3 class="dialog-title">إلغاء الحصة · Cancel Session</h3>
            <p class="dialog-desc">
              هل أنت متأكد من إلغاء حصة
              <strong>{{ cancelTarget()?.courseName }}</strong>
              ({{ cancelTarget()?.groupName }}) اليوم؟
            </p>
            <div class="dialog-field">
              <label>سبب الإلغاء (اختياري) · Reason (optional)</label>
              <textarea
                class="dialog-textarea"
                [value]="cancelReason()"
                (input)="cancelReason.set($any($event.target).value)"
                placeholder="اكتب السبب هنا..."
                rows="3"
              ></textarea>
            </div>
            <div class="dialog-actions">
              <button class="dialog-btn dialog-btn--cancel" (click)="closeCancelDialog()">
                تراجع · Back
              </button>
              <button class="dialog-btn dialog-btn--confirm" (click)="confirmCancel()" [disabled]="cancelling()">
                @if (cancelling()) { <span class="spinner-xs"></span> }
                @else { <i class="fas fa-times-circle"></i> }
                تأكيد الإلغاء · Confirm
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Success toast -->
      @if (showSuccess()) {
        <div class="toast-success">
          <i class="fas fa-check-circle"></i>
          تم إلغاء الحصة وإرسال الإشعارات · Session cancelled
        </div>
      }

    </div>
  `,
  styles: [`
    .ts-page { direction: rtl; min-height: 100vh; background: #f4f5fb; padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px)); }

    /* Header */
    .ts-header {
      display: flex; align-items: center; gap: 0.75rem;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: #fff; padding: 1rem;
      border-radius: 0 0 20px 20px;
      box-shadow: 0 4px 16px rgba(102,126,234,0.25);
      position: sticky; top: 0; z-index: 50;
    }
    .ts-back-btn {
      width: 40px; height: 40px; min-width: 40px; flex-shrink: 0;
      border: none; border-radius: 12px;
      background: rgba(255,255,255,0.18); color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-size: 1rem; cursor: pointer;
      -webkit-tap-highlight-color: transparent; transition: background 0.15s;
    }
    .ts-back-btn:active { background: rgba(255,255,255,0.32); transform: scale(0.95); }
    .ts-header-icon {
      width: 40px; height: 40px; flex-shrink: 0; border-radius: 12px;
      background: rgba(255,255,255,0.18);
      display: flex; align-items: center; justify-content: center; font-size: 1.1rem;
    }
    .ts-header-text { display: flex; flex-direction: column; gap: 0.1rem; }
    .ts-header-text h1 { margin: 0; font-size: 1.15rem; font-weight: 800; }
    .ts-header-text p { margin: 0; font-size: 0.72rem; opacity: 0.85; }

    /* Loading / Empty */
    .loading-area { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.6rem; padding: 3rem 1rem; font-size: 0.88rem; color: #6b7280; }
    .spinner { width: 32px; height: 32px; border: 3px solid #e5e7eb; border-top-color: #667eea; border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .empty-state { text-align: center; padding: 3rem 1.5rem; margin: 1rem; background: #fff; border-radius: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
    .empty-state i { font-size: 2.5rem; color: #667eea; opacity: 0.5; display: block; margin-bottom: 0.75rem; }
    .empty-state p { margin: 0; font-size: 1rem; font-weight: 700; color: #374151; }
    .empty-state small { color: #9ca3af; font-size: 0.8rem; }

    /* Sessions list */
    .sessions-list { display: flex; flex-direction: column; gap: 0.625rem; padding: 1rem; }

    .session-card {
      background: #fff; border-radius: 14px; padding: 1rem;
      box-shadow: 0 2px 10px rgba(0,0,0,0.06); border: 1.5px solid transparent;
      position: relative; overflow: hidden; transition: border-color 0.2s;
    }

    .session-card--now {
      border-color: #22c55e;
      background: linear-gradient(135deg, #f0fdf4, #fff);
      box-shadow: 0 2px 12px rgba(34,197,94,0.15);
    }

    .session-card--past { opacity: 0.6; }

    /* Live badge */
    .live-badge {
      display: inline-flex; align-items: center; gap: 0.35rem;
      background: #22c55e; color: #fff; padding: 0.2rem 0.6rem;
      border-radius: 20px; font-size: 0.7rem; font-weight: 700;
      margin-bottom: 0.5rem;
    }
    .live-dot { width: 7px; height: 7px; border-radius: 50%; background: #fff; animation: pulse-dot 1.5s ease-in-out infinite; }
    @keyframes pulse-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

    .session-row { display: flex; align-items: flex-start; gap: 0.75rem; }

    .session-time-block {
      display: flex; flex-direction: column; align-items: center; gap: 0.1rem;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: #fff; padding: 0.5rem 0.6rem; border-radius: 10px;
      flex-shrink: 0; min-width: 52px;
    }
    .session-time { font-size: 0.78rem; font-weight: 700; }
    .session-time-sep { font-size: 0.6rem; opacity: 0.7; }

    .session-info { flex: 1; display: flex; flex-direction: column; gap: 0.2rem; min-width: 0; }
    .session-course { font-size: 0.95rem; font-weight: 700; color: #1a202c; }
    .session-group { font-size: 0.78rem; color: #6b7280; }
    .session-location { font-size: 0.72rem; color: #9ca3af; display: flex; align-items: center; gap: 0.25rem; }
    .session-location i { font-size: 0.65rem; }

    .session-day-icon { display: flex; flex-direction: column; align-items: center; gap: 0.15rem; flex-shrink: 0; }
    .session-day-icon i { font-size: 1.1rem; color: #667eea; }
    .day-label { font-size: 0.65rem; color: #9ca3af; font-weight: 600; }

    .session-countdown {
      display: flex; align-items: center; gap: 0.4rem;
      margin-top: 0.5rem; padding: 0.35rem 0.65rem;
      background: #eef2ff; border-radius: 8px;
      font-size: 0.75rem; font-weight: 600; color: #667eea;
    }
    .session-countdown i { font-size: 0.7rem; }

    .session-done {
      display: flex; align-items: center; gap: 0.4rem;
      margin-top: 0.5rem; padding: 0.35rem 0.65rem;
      background: #f3f4f6; border-radius: 8px;
      font-size: 0.75rem; font-weight: 600; color: #9ca3af;
    }
    .session-done i { font-size: 0.7rem; }
    .cancel-btn {
      width: 100%; margin-top: 0.5rem; padding: 0.5rem; border: none; border-radius: 8px;
      background: rgba(239,68,68,0.08); color: #dc2626;
      font-size: 0.78rem; font-weight: 700; cursor: pointer; min-height: 40px;
      display: flex; align-items: center; justify-content: center; gap: 0.3rem;
    }
    .cancel-btn:disabled { opacity: 0.5; }
    .spinner-xs {
      width: 14px; height: 14px; border: 2px solid rgba(220,38,38,0.2);
      border-top-color: #dc2626; border-radius: 50%; animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Dialog overlay */
    .dialog-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.5);
      display: flex; align-items: center; justify-content: center;
      z-index: 10000; padding: 1rem;
      animation: fadeIn 0.2s ease;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    .dialog-card {
      background: #fff; border-radius: 20px; padding: 1.5rem;
      width: 100%; max-width: 360px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      animation: slideUp 0.25s ease;
    }
    @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

    .dialog-icon {
      text-align: center; margin-bottom: 0.75rem;
    }
    .dialog-icon i {
      font-size: 2.5rem; color: #f59e0b;
    }

    .dialog-title {
      text-align: center; font-size: 1.05rem; font-weight: 800; color: #1a202c; margin: 0 0 0.5rem;
    }
    .dialog-desc {
      text-align: center; font-size: 0.85rem; color: #6b7280; margin: 0 0 1rem; line-height: 1.5;
    }
    .dialog-desc strong { color: #374151; }

    .dialog-field { margin-bottom: 1rem; }
    .dialog-field label {
      display: block; font-size: 0.78rem; font-weight: 600; color: #374151; margin-bottom: 0.4rem;
    }
    .dialog-textarea {
      width: 100%; border: 1.5px solid #e5e7eb; border-radius: 10px;
      padding: 0.65rem 0.75rem; font-size: 0.85rem; font-family: inherit;
      resize: none; outline: none; direction: rtl; box-sizing: border-box;
      transition: border-color 0.2s;
    }
    .dialog-textarea:focus { border-color: #667eea; }

    .dialog-actions {
      display: flex; gap: 0.6rem;
    }
    .dialog-btn {
      flex: 1; padding: 0.7rem; border: none; border-radius: 12px;
      font-size: 0.82rem; font-weight: 700; cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 0.3rem;
      min-height: 46px; transition: opacity 0.2s;
    }
    .dialog-btn:active { opacity: 0.8; }
    .dialog-btn--cancel {
      background: #f3f4f6; color: #374151;
    }
    .dialog-btn--confirm {
      background: linear-gradient(135deg, #ef4444, #dc2626); color: #fff;
    }
    .dialog-btn--confirm:disabled { opacity: 0.5; }

    /* Success toast */
    .toast-success {
      position: fixed; bottom: calc(80px + env(safe-area-inset-bottom, 0px) + 12px);
      left: 50%; transform: translateX(-50%);
      background: #22c55e; color: #fff; padding: 0.7rem 1.2rem;
      border-radius: 12px; font-size: 0.8rem; font-weight: 700;
      display: flex; align-items: center; gap: 0.4rem;
      box-shadow: 0 4px 20px rgba(34,197,94,0.4);
      z-index: 10001; animation: slideUp 0.3s ease;
      white-space: nowrap;
    }
  `],
})
export class TodaySessionsComponent implements OnInit {
  private readonly sessionService = inject(SessionService);
  private readonly currentUserService = inject(CurrentUserInfoService);
  private readonly location = inject(Location);
  private readonly router = inject(Router);

  loading = signal(true);
  sessions = signal<NextSessionDto[]>([]);
  actorType = signal('');
  cancelling = signal(false);
  canCancel = signal(false);
  showCancelDialog = signal(false);
  cancelTarget = signal<NextSessionDto | null>(null);
  cancelReason = signal('');
  showSuccess = signal(false);

  private readonly ARABIC_DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  async ngOnInit(): Promise<void> {
    try {
      const userInfo = await lastValueFrom(this.currentUserService.getCurrentUserActorInfo());
      this.actorType.set(userInfo?.actorType || '');
      this.canCancel.set(userInfo?.actorType === 'Teacher' || userInfo?.actorType === 'Secretary');
      const all = await lastValueFrom(this.sessionService.getNextSessionsPerCourse());
      // Sort: live first, then by secondsUntilStart ascending
      const sorted = (all || []).sort((a, b) => {
        if (a.isNow && !b.isNow) return -1;
        if (!a.isNow && b.isNow) return 1;
        return a.secondsUntilStart - b.secondsUntilStart;
      });
      this.sessions.set(sorted);
    } catch (err) {
      console.error('Error loading sessions:', err);
    } finally {
      this.loading.set(false);
    }
  }

  goBack(): void {
    // Use browser history when available, otherwise fall back to home.
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigateByUrl('/');
    }
  }

  getDayName(dow: number): string {
    return this.ARABIC_DAYS[dow] || '';
  }

  formatTime(time?: string): string {
    if (!time) return '';
    const parts = time.split(':');
    const h = parseInt(parts[0], 10);
    const m = parts[1] || '00';
    const period = h >= 12 ? 'م' : 'ص';
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${h12}:${m} ${period}`;
  }

  formatCountdown(seconds: number): string {
    if (seconds <= 0) return 'الآن';
    const h = Math.floor(seconds / 3600);
    const min = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `بعد ${h} ساعة و ${min} دقيقة`;
    return `بعد ${min} دقيقة`;
  }

  isPast(s: NextSessionDto): boolean {
    return !s.isNow && s.secondsUntilStart < 0;
  }

  openCancelDialog(s: NextSessionDto): void {
    this.cancelTarget.set(s);
    this.cancelReason.set('');
    this.showCancelDialog.set(true);
  }

  closeCancelDialog(): void {
    this.showCancelDialog.set(false);
    this.cancelTarget.set(null);
  }

  async confirmCancel(): Promise<void> {
    const s = this.cancelTarget();
    if (!s) return;

    this.cancelling.set(true);
    try {
      await lastValueFrom(this.sessionService.cancelTodaySession({
        groupScheduleId: s.groupScheduleId!,
        reason: this.cancelReason() || undefined,
      }));
      this.closeCancelDialog();
      this.sessions.update(list => list.filter(x => x.groupScheduleId !== s.groupScheduleId));
      // Show success toast
      this.showSuccess.set(true);
      setTimeout(() => this.showSuccess.set(false), 3000);
    } catch (e: any) {
      this.closeCancelDialog();
      alert(e?.error?.error?.message || 'حدث خطأ · Error occurred');
    } finally {
      this.cancelling.set(false);
    }
  }
}
