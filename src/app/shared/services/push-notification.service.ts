import { Injectable, inject } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { DeviceTokenService } from '@proxy/notifications';
import { RealtimeNotificationService } from './realtime-notification.service';
import { lastValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PushNotificationService {
  private readonly deviceTokenSvc = inject(DeviceTokenService);
  private readonly realtimeService = inject(RealtimeNotificationService);

  /** Call once after login on native platforms. */
  async initialize(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    const permissionStatus = await PushNotifications.requestPermissions();
    if (permissionStatus.receive !== 'granted') return;

    await PushNotifications.register();

    // Token received — register with backend
    PushNotifications.addListener('registration', async (token: Token) => {
      await this.registerToken(token.value);
    });

    // Push received while app is in foreground
    PushNotifications.addListener('pushNotificationReceived', (_: PushNotificationSchema) => {
      this.realtimeService.unreadCount.update(c => c + 1);
    });

    // User tapped a push notification
    PushNotifications.addListener('pushNotificationActionPerformed', (_: ActionPerformed) => {
      // Navigate to /notifications — handled in app component
    });
  }

  /** Unregister token on logout. */
  async unregisterCurrentToken(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    // Could store the last token and DELETE it via API on logout
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
