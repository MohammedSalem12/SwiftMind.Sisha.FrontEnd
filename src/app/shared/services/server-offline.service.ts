import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ServerOfflineService {
  readonly isOffline = signal(false);

  private lastShown = 0;

  /** Called by the interceptor when a network error occurs */
  notifyOffline(): void {
    // Throttle: don't show more than once every 10 seconds
    const now = Date.now();
    if (now - this.lastShown < 10_000) return;
    this.lastShown = now;
    this.isOffline.set(true);
  }

  dismiss(): void {
    this.isOffline.set(false);
  }
}
