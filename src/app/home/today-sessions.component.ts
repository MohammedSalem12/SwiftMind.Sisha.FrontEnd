import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { SessionService } from '@proxy/groups';
import { CurrentUserInfoService } from '@proxy/common';
import type { NextSessionDto } from '@proxy/groups/dtos/models';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-today-sessions',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="ts-page" dir="rtl">

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

            </div>
          }
        </div>
      }

    </div>
  `,
  styles: [`
    .ts-page { direction: rtl; min-height: 100vh; background: #f4f5fb; padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px)); }

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
  `],
})
export class TodaySessionsComponent implements OnInit {
  private readonly sessionService = inject(SessionService);
  private readonly currentUserService = inject(CurrentUserInfoService);

  loading = signal(true);
  sessions = signal<NextSessionDto[]>([]);
  actorType = signal('');

  private readonly ARABIC_DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  async ngOnInit(): Promise<void> {
    try {
      const userInfo = await lastValueFrom(this.currentUserService.getCurrentUserActorInfo());
      this.actorType.set(userInfo?.actorType || '');
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

}
