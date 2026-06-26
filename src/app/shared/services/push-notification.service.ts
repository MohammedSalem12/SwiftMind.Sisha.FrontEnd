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
  private initialized = false;

  // ⚠️ Native FCM push is temporarily DISABLED. The @capacitor/push-notifications
  // requestPermissions()/register() path throws a native NullPointerException inside
  // getPermissionStates() that surfaces on a posted main-thread Runnable — it CANNOT be
  // caught from JS, so it hard-crashes the app (it crashed on login, then on the
  // notifications screen once gated). Real-time in-app notifications still work via
  // SignalR (realtime-notification.service). Flip this back to true once the native
  // plugin/Firebase config is fixed and verified on a device.
  private static readonly PUSH_ENABLED = false;

  /**
   * Initialize push notifications. Safe to call multiple times — it runs at
   * most once per app session (the notifications screen calls this on every
   * visit). Gated behind a user-initiated screen visit rather than login so the
   * native permission request can never race the post-login navigation, which
   * crashed the plugin (NPE in getPermissionStates).
   */
  async initialize(): Promise<void> {
    if (!Capacitor.isNativePlatform() || this.initialized) return;
    this.initialized = true;

    if (!PushNotificationService.PUSH_ENABLED) {
      // Native push disabled — avoid the crashing requestPermissions()/register() path.
      // In-app notifications continue to arrive over SignalR.
      console.info('[PushNotifications] native push disabled — using SignalR only');
      return;
    }

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
