import { registerPlugin } from '@capacitor/core';

/**
 * Options to start an OS-rendered live countdown notification for a session.
 */
export interface StartCountdownOptions {
  /** Stable id for the session — used to replace/cancel the same notification. */
  sessionId: string;
  /** Notification title (Arabic-first). */
  title?: string;
  /** Secondary line (e.g. course + teacher name). */
  body?: string;
  /** Epoch milliseconds the timer counts down to (the session start time). */
  endTimeMillis: number;
  /** Optional in-app route to open when the notification is tapped. */
  deepLink?: string;
}

export interface StartCountdownResult {
  sessionId: string;
  notificationId: number;
}

export interface SessionCountdownPlugin {
  /** Show (or replace) the ongoing countdown notification for a session. */
  start(options: StartCountdownOptions): Promise<StartCountdownResult>;
  /** Cancel the countdown notification for a session. */
  stop(options: { sessionId: string }): Promise<void>;
}

/**
 * Native bridge to the Android SessionCountdownPlugin (Java).
 * On non-Android platforms (web) the native methods are absent; callers must
 * guard with Capacitor.getPlatform() === 'android'.
 */
export const SessionCountdown = registerPlugin<SessionCountdownPlugin>('SessionCountdown');
