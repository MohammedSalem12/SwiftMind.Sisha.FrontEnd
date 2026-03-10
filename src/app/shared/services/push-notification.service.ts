import { Injectable, inject } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { Router } from '@angular/router';
import { DeviceTokenService } from '@proxy/notifications';
import { RealtimeNotificationService } from './realtime-notification.service';
import { lastValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PushNotificationService {
  private readonly deviceTokenSvc = inject(DeviceTokenService);
  private readonly realtimeService = inject(RealtimeNotificationService);
  private readonly router = inject(Router);

  private currentToken: string | null = null;

  /** Call once after login on native platforms. */
  async initialize(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      const permissionStatus = await PushNotifications.requestPermissions();
      if (permissionStatus.receive !== 'granted') return;

      await PushNotifications.register();

      // Token received — register with backend
      PushNotifications.addListener('registration', async (token: Token) => {
        this.currentToken = token.value;
        await this.registerToken(token.value);
      });

      // Push received while app is in foreground
      PushNotifications.addListener('pushNotificationReceived', (_: PushNotificationSchema) => {
        this.realtimeService.unreadCount.update(c => c + 1);
      });

      // User tapped a push notification — navigate to notifications page
      PushNotifications.addListener('pushNotificationActionPerformed', (_: ActionPerformed) => {
        this.router.navigate(['/notifications']);
      });
    } catch (err) {
      // Push notifications unavailable (e.g. missing google-services.json / APNs config)
      console.warn('[PushNotifications] initialize failed — push notifications disabled:', err);
    }
  }

  /** Unregister token on logout. */
  async unregisterCurrentToken(): Promise<void> {
    if (!Capacitor.isNativePlatform() || !this.currentToken) return;
    try {
      await lastValueFrom(this.deviceTokenSvc.unregister(this.currentToken));
    } catch {
      // silent — token may already be expired
    } finally {
      this.currentToken = null;
    }
  }

  private async registerToken(token: string): Promise<void> {
    try {
      const platform = Capacitor.getPlatform(); // 'android' | 'ios'
      await lastValueFrom(this.deviceTokenSvc.register({ token, platform }));
    } catch {
      // silent
    }
  }
}
