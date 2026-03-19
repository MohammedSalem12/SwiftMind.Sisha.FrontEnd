import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { SessionService } from '@proxy/groups';
import type { NextSessionDto } from '@proxy/groups/dtos/models';

@Component({
  selector: 'app-session-timer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (session) {
      <div class="timer-panel" [class.timer-panel--live]="isNow()">

        <!-- Live Now State -->
        @if (isNow()) {
          <div class="live-badge">
            <span class="live-dot"></span>
            <span>الحصة الآن · Live Now</span>
          </div>
        } @else {
          <div class="timer-label">الحصة القادمة · Next Session</div>
        }

        <!-- Course & Group info -->
        <div class="timer-course-name">{{ session.courseName }}</div>
        <div class="timer-group-name">{{ session.groupName }}</div>

        <!-- Big Countdown Digits -->
        @if (!isNow()) {
          <div class="countdown-grid">
            @if (days() > 0) {
              <div class="countdown-unit">
                <div class="countdown-digits">{{ pad(days()) }}</div>
                <div class="countdown-label">يوم</div>
              </div>
              <div class="countdown-sep">:</div>
            }
            <div class="countdown-unit">
              <div class="countdown-digits">{{ pad(hours()) }}</div>
              <div class="countdown-label">ساعة</div>
            </div>
            <div class="countdown-sep">:</div>
            <div class="countdown-unit">
              <div class="countdown-digits">{{ pad(minutes()) }}</div>
              <div class="countdown-label">دقيقة</div>
            </div>
            <div class="countdown-sep">:</div>
            <div class="countdown-unit">
              <div class="countdown-digits countdown-digits--sec">{{ pad(seconds()) }}</div>
              <div class="countdown-label">ثانية</div>
            </div>
          </div>
        } @else {
          <div class="live-pulse-ring">
            <i class="fas fa-broadcast-tower"></i>
          </div>
        }

        <!-- Schedule info row -->
        <div class="timer-schedule-row">
          <span class="schedule-chip">
            <i class="fas fa-calendar-day"></i>
            {{ getDayName(session.dayOfWeek) }}
          </span>
          <span class="schedule-chip">
            <i class="fas fa-clock"></i>
            {{ formatTime(session.startTime) }}
          </span>
          @if (session.location) {
            <span class="schedule-chip">
              <i class="fas fa-map-marker-alt"></i>
              {{ session.location }}
            </span>
          }
        </div>

        <!-- Send message (teacher/secretary, within 15 min or live) -->
        @if (canSendMessage && (isNow() || isWithin15Min())) {
          <div class="msg-section">
            @if (!showMsgInput()) {
              <button class="msg-toggle-btn" (click)="showMsgInput.set(true)">
                <i class="fas fa-paper-plane"></i>
                <span>أرسل رسالة للطلاب · Message Students</span>
              </button>
            } @else {
              <div class="msg-input-row">
                <input class="msg-input"
                  [(ngModel)]="msgText"
                  placeholder="اكتب رسالة للطلاب..."
                  [disabled]="sendingMsg()"
                  (keydown.enter)="sendMessage()" />
                <button class="msg-send-btn" (click)="sendMessage()" [disabled]="sendingMsg() || !msgText.trim()">
                  @if (sendingMsg()) {
                    <div class="msg-spinner"></div>
                  } @else {
                    <i class="fas fa-paper-plane"></i>
                  }
                </button>
              </div>
              @if (msgSent()) {
                <div class="msg-sent-badge">
                  <i class="fas fa-check-circle"></i> تم الإرسال · Sent
                </div>
              }
            }
          </div>
        }

        <!-- Today's sessions link -->
        <button class="today-link" (click)="todaySessionsClicked.emit()">
          <i class="fas fa-list"></i>
          <span>حصص اليوم · Today's Sessions</span>
          <i class="fas fa-chevron-left"></i>
        </button>
      </div>
    }
  `,
  styles: [`
    .timer-panel {
      margin: 0.75rem 1rem;
      padding: 1.25rem 1rem 1rem;
      background: linear-gradient(145deg, #667eea 0%, #764ba2 100%);
      border-radius: 20px;
      direction: rtl;
      text-align: center;
      box-shadow: 0 8px 32px rgba(102, 126, 234, 0.35);
      position: relative;
      overflow: hidden;
    }
    .timer-panel::before {
      content: '';
      position: absolute;
      width: 180px; height: 180px;
      border-radius: 50%;
      background: rgba(255,255,255,0.06);
      top: -60px; left: -40px;
      pointer-events: none;
    }
    .timer-panel::after {
      content: '';
      position: absolute;
      width: 120px; height: 120px;
      border-radius: 50%;
      background: rgba(255,255,255,0.05);
      bottom: -40px; right: -20px;
      pointer-events: none;
    }

    .timer-panel--live {
      background: linear-gradient(145deg, #ef4444 0%, #dc2626 100%);
      box-shadow: 0 8px 32px rgba(239, 68, 68, 0.35);
      animation: live-glow 2s ease-in-out infinite;
    }
    @keyframes live-glow {
      0%, 100% { box-shadow: 0 8px 32px rgba(239, 68, 68, 0.3); }
      50% { box-shadow: 0 8px 40px rgba(239, 68, 68, 0.55); }
    }

    .timer-label {
      font-size: 0.72rem;
      font-weight: 600;
      color: rgba(255,255,255,0.7);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.3rem;
      position: relative;
    }

    .live-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: rgba(255,255,255,0.2);
      border-radius: 20px;
      padding: 0.3rem 0.85rem;
      font-size: 0.78rem;
      font-weight: 700;
      color: #fff;
      margin-bottom: 0.5rem;
      position: relative;
    }
    .live-dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: #fff;
      animation: blink 1s infinite;
    }
    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }

    .timer-course-name {
      font-size: 1.05rem;
      font-weight: 800;
      color: #fff;
      margin-bottom: 0.1rem;
      position: relative;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .timer-group-name {
      font-size: 0.75rem;
      color: rgba(255,255,255,0.65);
      margin-bottom: 0.85rem;
      position: relative;
    }

    /* ── Countdown Grid ── */
    .countdown-grid {
      display: flex;
      align-items: flex-start;
      justify-content: center;
      gap: 0.35rem;
      margin-bottom: 0.85rem;
      position: relative;
    }

    .countdown-unit {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
    }

    .countdown-digits {
      background: rgba(255,255,255,0.18);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255,255,255,0.25);
      border-radius: 14px;
      padding: 0.5rem 0.65rem;
      font-size: 1.8rem;
      font-weight: 900;
      color: #fff;
      min-width: 58px;
      font-variant-numeric: tabular-nums;
      line-height: 1;
      letter-spacing: 0.02em;
      text-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }
    .countdown-digits--sec {
      animation: tick-pulse 1s ease-in-out infinite;
    }
    @keyframes tick-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.75; }
    }

    .countdown-label {
      font-size: 0.62rem;
      font-weight: 600;
      color: rgba(255,255,255,0.6);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .countdown-sep {
      font-size: 1.6rem;
      font-weight: 900;
      color: rgba(255,255,255,0.45);
      padding-top: 0.5rem;
      line-height: 1;
    }

    /* ── Live Pulse Ring ── */
    .live-pulse-ring {
      width: 80px; height: 80px;
      border-radius: 50%;
      background: rgba(255,255,255,0.15);
      display: flex; align-items: center; justify-content: center;
      margin: 0.5rem auto 1rem;
      font-size: 1.8rem;
      color: #fff;
      position: relative;
      animation: pulse-ring 1.5s ease-out infinite;
    }
    @keyframes pulse-ring {
      0% { box-shadow: 0 0 0 0 rgba(255,255,255,0.4); }
      100% { box-shadow: 0 0 0 20px rgba(255,255,255,0); }
    }

    /* ── Schedule Row ── */
    .timer-schedule-row {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 0.4rem;
      position: relative;
    }

    .schedule-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      background: rgba(255,255,255,0.15);
      border-radius: 20px;
      padding: 0.2rem 0.6rem;
      font-size: 0.68rem;
      font-weight: 600;
      color: rgba(255,255,255,0.85);
    }
    .schedule-chip i {
      font-size: 0.6rem;
      opacity: 0.8;
    }

    .today-link {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      margin-top: 0.65rem;
      padding: 0.45rem 0.85rem;
      background: rgba(255,255,255,0.15);
      border: 1px solid rgba(255,255,255,0.25);
      border-radius: 12px;
      color: rgba(255,255,255,0.9);
      font-size: 0.72rem;
      font-weight: 600;
      cursor: pointer;
      position: relative;
      transition: background 0.15s;
      min-height: 36px;
      -webkit-tap-highlight-color: transparent;
    }
    .today-link:active { background: rgba(255,255,255,0.25); }
    .today-link .fa-chevron-left { font-size: 0.55rem; opacity: 0.6; }

    /* ── Session Messaging ── */
    .msg-section {
      margin-top: 0.65rem;
      position: relative;
    }
    .msg-toggle-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      width: 100%;
      padding: 0.5rem 0.85rem;
      background: rgba(255,255,255,0.2);
      border: 1px solid rgba(255,255,255,0.3);
      border-radius: 12px;
      color: #fff;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      min-height: 40px;
      -webkit-tap-highlight-color: transparent;
      transition: background 0.15s;
    }
    .msg-toggle-btn:active { background: rgba(255,255,255,0.3); }

    .msg-input-row {
      display: flex;
      gap: 0.4rem;
    }
    .msg-input {
      flex: 1;
      padding: 0.55rem 0.75rem;
      border: 1px solid rgba(255,255,255,0.3);
      border-radius: 12px;
      background: rgba(255,255,255,0.15);
      color: #fff;
      font-size: 0.82rem;
      font-family: inherit;
      direction: rtl;
      min-height: 40px;
    }
    .msg-input::placeholder { color: rgba(255,255,255,0.5); }
    .msg-input:focus { outline: none; border-color: rgba(255,255,255,0.5); background: rgba(255,255,255,0.2); }

    .msg-send-btn {
      width: 40px; height: 40px;
      border-radius: 12px;
      background: rgba(255,255,255,0.25);
      border: 1px solid rgba(255,255,255,0.3);
      color: #fff;
      font-size: 0.9rem;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      transition: background 0.15s;
    }
    .msg-send-btn:active { background: rgba(255,255,255,0.4); }
    .msg-send-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    .msg-spinner {
      width: 14px; height: 14px;
      border: 2px solid rgba(255,255,255,0.4);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .msg-sent-badge {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.3rem;
      margin-top: 0.4rem;
      padding: 0.3rem 0.6rem;
      background: rgba(34,197,94,0.2);
      border-radius: 8px;
      color: #fff;
      font-size: 0.7rem;
      font-weight: 600;
      animation: fadeIn 0.3s ease;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `],
})
export class SessionTimerComponent implements OnInit, OnDestroy {
  private readonly sessionService = inject(SessionService);

  @Input() session: NextSessionDto | null = null;
  @Input() canSendMessage = false;
  @Output() todaySessionsClicked = new EventEmitter<void>();

  isNow = signal(false);
  isWithin15Min = signal(false);
  days = signal(0);
  hours = signal(0);
  minutes = signal(0);
  seconds = signal(0);

  // Messaging
  showMsgInput = signal(false);
  sendingMsg = signal(false);
  msgSent = signal(false);
  msgText = '';

  private intervalId: any;
  private dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  ngOnInit(): void {
    this.updateCountdown();
    this.intervalId = setInterval(() => this.updateCountdown(), 1000);
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  private updateCountdown(): void {
    if (!this.session?.nextOccurrence) return;

    const target = new Date(this.session.nextOccurrence).getTime();
    const now = Date.now();
    const diff = target - now;

    if (diff <= 0) {
      if (this.session.isNow) {
        this.isNow.set(true);
      } else {
        this.isNow.set(false);
        this.days.set(0);
        this.hours.set(0);
        this.minutes.set(0);
        this.seconds.set(0);
      }
      return;
    }

    this.isNow.set(false);
    const totalSeconds = Math.floor(diff / 1000);
    this.days.set(Math.floor(totalSeconds / 86400));
    this.hours.set(Math.floor((totalSeconds % 86400) / 3600));
    this.minutes.set(Math.floor((totalSeconds % 3600) / 60));
    this.seconds.set(totalSeconds % 60);
    this.isWithin15Min.set(totalSeconds <= 900); // 15 minutes
  }

  async sendMessage(): Promise<void> {
    const text = this.msgText.trim();
    if (!text || !this.session?.groupScheduleId) return;
    this.sendingMsg.set(true);
    this.msgSent.set(false);
    try {
      await lastValueFrom(this.sessionService.sendSessionMessage(
        this.session.groupScheduleId,
        { message: text }
      ));
      this.msgText = '';
      this.msgSent.set(true);
      setTimeout(() => this.msgSent.set(false), 3000);
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      this.sendingMsg.set(false);
    }
  }

  pad(n: number): string {
    return String(n).padStart(2, '0');
  }

  formatTime(time?: string): string {
    if (!time) return '';
    const [h, m] = time.split(':').map(Number);
    if (h === 0) return `12:${String(m).padStart(2, '0')} ص`;
    if (h < 12) return `${h}:${String(m).padStart(2, '0')} ص`;
    if (h === 12) return `12:${String(m).padStart(2, '0')} م`;
    return `${h - 12}:${String(m).padStart(2, '0')} م`;
  }

  getDayName(dow: number): string {
    return this.dayNames[dow] || '';
  }
}
