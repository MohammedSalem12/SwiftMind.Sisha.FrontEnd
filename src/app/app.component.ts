import { Component, OnInit, inject } from '@angular/core';
import { InternetConnectionStatusComponent, LoaderBarComponent } from '@abp/ng.theme.shared';
import { DynamicLayoutComponent } from '@abp/ng.core';
import { OAuthService } from 'angular-oauth2-oidc';
import { ToastContainerComponent } from './shared/toast-container.component';
import { BottomNavComponent } from './shared/bottom-nav.component';
import { RealtimeNotificationService } from './shared/services/realtime-notification.service';
import { PushNotificationService } from './shared/services/push-notification.service';

@Component({
  selector: 'app-root',
  template: `
    <abp-loader-bar />
    <div class="app-content">
      <abp-dynamic-layout />
    </div>
    <app-bottom-nav />
    <abp-internet-status />
    <app-toasts />
  `,
  styles: [`
    .app-content {
      padding-bottom: 0;
    }

    @media (max-width: 991px) {
      .app-content {
        padding-bottom: 70px; /* Space for bottom nav */
      }
    }

    /* Handle iOS safe area */
    @supports (padding-bottom: env(safe-area-inset-bottom)) {
      @media (max-width: 991px) {
        .app-content {
          padding-bottom: calc(70px + env(safe-area-inset-bottom));
        }
      }
    }
  `],
  imports: [
    LoaderBarComponent,
    DynamicLayoutComponent,
    InternetConnectionStatusComponent,
    ToastContainerComponent,
    BottomNavComponent,
  ],
})
export class AppComponent implements OnInit {
  private readonly oauthService = inject(OAuthService);
  private readonly realtimeNotificationService = inject(RealtimeNotificationService);
  private readonly pushNotificationService = inject(PushNotificationService);

  ngOnInit(): void {
    // Connect real-time services when user is already logged in (page refresh)
    if (this.oauthService.hasValidAccessToken()) {
      this.initRealtime();
    }

    // Connect after login events
    this.oauthService.events.subscribe(event => {
      if (event.type === 'token_received' || event.type === 'silently_refreshed') {
        this.initRealtime();
      }
      if (event.type === 'logout') {
        this.realtimeNotificationService.disconnect();
        this.pushNotificationService.unregisterCurrentToken();
      }
    });
  }

  private initRealtime(): void {
    this.realtimeNotificationService.connect();
    this.pushNotificationService.initialize();
  }
}
