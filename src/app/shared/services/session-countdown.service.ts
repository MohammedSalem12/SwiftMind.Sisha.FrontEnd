import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';

import { SessionCountdown } from '../plugins/session-countdown.plugin';

/** Minimal shape of an upcoming session needed to drive the countdown. */
export interface UpcomingSession {
  /** Stable session identifier. */
  id: string;
  /** Epoch milliseconds of the session start. */
  startTimeMillis: number;
  /** Title line, e.g. course name. */
  title: string;
  /** Secondary line, e.g. teacher name + time. */
  subtitle?: string;
  /** Optional in-app route opened on tap. */
  deepLink?: string;
}

/**
 * Drives the Android live countdown notification ("الحصة القادمة") for the
 * single next upcoming session. The OS renders the ticking timer with no app
 * wakeups; this service only tells Android when to show, replace, or clear it.
 *
 * No-ops on web/iOS (guarded by platform) — iOS Live Activities are a separate
 * phase. Safe to call from anywhere; it dedupes on sessionId.
 */
@Injectable({ providedIn: 'root' })
export class SessionCountdownService {
  /** How far ahead a session must be to surface the countdown (90 minutes). */
  private static readonly LEAD_TIME_MS = 90 * 60 * 1000;

  private activeSessionId: string | null = null;

  private get isSupported(): boolean {
    return Capacitor.getPlatform() === 'android';
  }

  /**
   * Reconcile the countdown notification against the current next session.
   * Pass `null` (or a past/too-far session) to clear it. Idempotent — call it
   * whenever the schedule or the "next session" computation changes.
   */
  async sync(next: UpcomingSession | null): Promise<void> {
    if (!this.isSupported) {
      return;
    }

    const now = Date.now();
    const isShowable =
      !!next &&
      next.startTimeMillis > now &&
      next.startTimeMillis - now <= SessionCountdownService.LEAD_TIME_MS;

    if (!isShowable) {
      await this.clear();
      return;
    }

    // If a different session was showing, cancel it first.
    if (this.activeSessionId && this.activeSessionId !== next!.id) {
      await this.safeStop(this.activeSessionId);
    }

    try {
      await SessionCountdown.start({
        sessionId: next!.id,
        title: next!.title || 'الحصة القادمة',
        body: next!.subtitle ?? '',
        endTimeMillis: next!.startTimeMillis,
        deepLink: next!.deepLink,
      });
      this.activeSessionId = next!.id;
    } catch (e) {
      // Permission denied or plugin missing — fail soft.
      console.warn('SessionCountdown.start failed', e);
    }
  }

  /** Remove any active countdown notification. */
  async clear(): Promise<void> {
    if (!this.isSupported || !this.activeSessionId) {
      return;
    }
    await this.safeStop(this.activeSessionId);
    this.activeSessionId = null;
  }

  private async safeStop(sessionId: string): Promise<void> {
    try {
      await SessionCountdown.stop({ sessionId });
    } catch (e) {
      console.warn('SessionCountdown.stop failed', e);
    }
  }
}
