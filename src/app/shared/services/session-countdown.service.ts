import { Injectable, inject } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { lastValueFrom } from 'rxjs';

import { SessionService } from '@proxy/groups';
import type { NextSessionDto } from '@proxy/groups/dtos/models';

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
 * Two drivers keep it accurate:
 *  - `syncFromNextSession()` — called immediately whenever the header loads the
 *    next session, so the notification appears without delay.
 *  - `startAutoSync()` — a periodic poll + app-resume refresh so the timer
 *    appears/disappears as sessions roll over, even without navigation.
 *
 * Backed by an Android Chronometer notification and an iOS ActivityKit Live
 * Activity (same plugin API). No-ops on web. Safe to call from anywhere; it
 * dedupes on sessionId.
 */
@Injectable({ providedIn: 'root' })
export class SessionCountdownService {
  /** How far ahead a session must be to surface the countdown (15 minutes). */
  private static readonly LEAD_TIME_MS = 15 * 60 * 1000;
  /** Re-evaluate the next session this often (2 minutes) so the 15-min window is caught promptly. */
  private static readonly POLL_INTERVAL_MS = 2 * 60 * 1000;

  private readonly sessionService = inject(SessionService);

  private activeSessionId: string | null = null;
  private permissionEnsured = false;
  private pollHandle: any = null;
  private resumeListener: { remove: () => void } | null = null;
  private autoSyncStarted = false;

  private get isSupported(): boolean {
    const platform = Capacitor.getPlatform();
    return platform === 'android' || platform === 'ios';
  }

  /**
   * Begin periodic + on-resume reconciliation. Idempotent — safe to call from
   * the authenticated app shell on every init. No-ops on unsupported platforms.
   */
  startAutoSync(): void {
    if (!this.isSupported || this.autoSyncStarted) {
      return;
    }
    this.autoSyncStarted = true;

    void this.refresh();
    this.pollHandle = setInterval(() => void this.refresh(), SessionCountdownService.POLL_INTERVAL_MS);

    // Refresh the moment the app comes to the foreground.
    import('@capacitor/app')
      .then(({ App }) => App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) void this.refresh();
      }))
      .then(listener => { this.resumeListener = listener; })
      .catch(() => { /* @capacitor/app unavailable on web */ });
  }

  /** Stop polling and remove any active countdown (e.g. on logout). */
  async stopAutoSync(): Promise<void> {
    if (this.pollHandle) {
      clearInterval(this.pollHandle);
      this.pollHandle = null;
    }
    this.resumeListener?.remove();
    this.resumeListener = null;
    this.autoSyncStarted = false;
    await this.clear();
  }

  /** Fetch the next session and reconcile the notification. */
  private async refresh(): Promise<void> {
    if (!this.isSupported) {
      return;
    }
    try {
      const session = await lastValueFrom(this.sessionService.getNextSession({ skipHandleError: true }));
      await this.syncFromNextSession(session ?? null);
    } catch {
      await this.syncFromNextSession(null);
    }
  }

  /**
   * Map a backend NextSessionDto into the countdown and reconcile. Public so the
   * header can push the session it already fetched (immediate, no extra request).
   */
  async syncFromNextSession(session: NextSessionDto | null): Promise<void> {
    if (!session || session.isNow || (session.secondsUntilStart ?? 0) <= 0) {
      await this.sync(null);
      return;
    }
    const sessionId = session.groupScheduleId || session.groupId || session.courseId;
    if (!sessionId) {
      await this.sync(null);
      return;
    }
    await this.sync({
      id: sessionId,
      // Backend pre-computes secondsUntilStart; derive an absolute target time.
      startTimeMillis: Date.now() + session.secondsUntilStart * 1000,
      title: session.courseName || 'الحصة القادمة',
      subtitle: session.groupName || session.location || '',
      deepLink: '/student/today-sessions',
    });
  }

  /**
   * Reconcile the countdown notification against a concrete upcoming session.
   * Pass `null` (or a past/too-far session) to clear it. Idempotent.
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

    // Lazily ensure notification permission the first time we'd actually show a
    // countdown (Android 13+). Contextual: the prompt appears when a session is
    // imminent, not at app launch. If declined, there's nothing to show.
    if (!this.permissionEnsured) {
      this.permissionEnsured = true;
      try {
        const res = await SessionCountdown.ensurePermission();
        if (res && res.granted === false) {
          return;
        }
      } catch {
        // Older build without ensurePermission — fall through and try anyway.
      }
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
