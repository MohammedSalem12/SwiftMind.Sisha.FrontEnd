import { Injectable, inject, signal } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { OAuthService } from 'angular-oauth2-oidc';
import { environment } from '../../../environments/environment';
import { NotificationService } from '@proxy/notifications';
import { lastValueFrom } from 'rxjs';

export interface RealtimeNotificationPayload {
  id: string;
  title: string;
  message: string;
  type: number;
  isRead: boolean;
  creationTime: string;
}

@Injectable({ providedIn: 'root' })
export class RealtimeNotificationService {
  private readonly oauthService = inject(OAuthService);
  private readonly notificationService = inject(NotificationService);

  private connection?: signalR.HubConnection;

  /** Live unread count — shared across all components */
  readonly unreadCount = signal(0);
  /** Emits whenever a new notification arrives via SignalR */
  readonly latestNotification = signal<RealtimeNotificationPayload | null>(null);

  /** Call this after the user logs in. */
  async connect(): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) return;

    const hubUrl = `${environment.apis.default.url}/signalr-hubs/notifications`;

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => this.oauthService.getAccessToken() ?? '',
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    this.connection.on('ReceiveNotification', (payload: RealtimeNotificationPayload) => {
      this.unreadCount.update(c => c + 1);
      this.latestNotification.set(payload);
    });

    try {
      await this.connection.start();
      // Load current unread count on connect
      await this.refreshUnreadCount();
    } catch {
      // Retry handled by withAutomaticReconnect
    }
  }

  /** Call this on logout. */
  async disconnect(): Promise<void> {
    await this.connection?.stop();
    this.connection = undefined;
    this.unreadCount.set(0);
    this.latestNotification.set(null);
  }

  async refreshUnreadCount(): Promise<void> {
    try {
      const count = await lastValueFrom(this.notificationService.getUnreadCount());
      this.unreadCount.set(count ?? 0);
    } catch {
      // silent
    }
  }

  decrementUnread(by = 1): void {
    this.unreadCount.update(c => Math.max(0, c - by));
  }

  resetUnread(): void {
    this.unreadCount.set(0);
  }
}
