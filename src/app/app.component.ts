import { Component, OnInit, inject } from '@angular/core';
import { InternetConnectionStatusComponent, LoaderBarComponent } from '@abp/ng.theme.shared';
import { DynamicLayoutComponent } from '@abp/ng.core';
import { OAuthService } from 'angular-oauth2-oidc';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { ToastContainerComponent } from './shared/toast-container.component';
import { BottomNavComponent } from './shared/bottom-nav.component';
import { RealtimeNotificationService } from './shared/services/realtime-notification.service';
import { PushNotificationService } from './shared/services/push-notification.service';
import { SidebarNotificationDirective } from './shared/sidebar-notification.directive';

const AUTH_PATHS = ['/login', '/register', '/forgot-password'];

@Component({
  selector: 'app-root',
  template: `
    <abp-loader-bar />
    <div class="app-content" appSidebarNotification>
      <abp-dynamic-layout />
    </div>
    <app-bottom-nav />
    <abp-internet-status />
    <app-toasts />
  `,
  styles: [`
    /* Reserve space for fixed bottom nav — mobile only */
    @media (max-width: 767px) {
      .app-content {
        padding-bottom: 70px;
      }
    }

    @media (max-width: 767px) {
      @supports (padding-bottom: env(safe-area-inset-bottom)) {
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
    SidebarNotificationDirective,
  ],
})
export class AppComponent implements OnInit {
  private readonly oauthService = inject(OAuthService);
  private readonly router = inject(Router);
  private readonly realtimeNotificationService = inject(RealtimeNotificationService);
  private readonly pushNotificationService = inject(PushNotificationService);

  ngOnInit(): void {
    // Add/remove auth-page class on body for CSS sidebar hiding
    this.updateAuthBodyClass(this.router.url);
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e: NavigationEnd) => {
      this.updateAuthBodyClass(e.urlAfterRedirects);
    });

    // Connect real-time services when user is already logged in (page refresh)
    if (this.oauthService.hasValidAccessToken()) {
      this.initRealtime();
    }

    this.oauthService.events.subscribe(event => {
      if (event.type === 'token_received' || event.type === 'silently_refreshed') {
        this.initRealtime();
      }
      if (event.type === 'logout') {
        this.realtimeNotificationService.disconnect();
        this.pushNotificationService.unregisterCurrentToken();
      }
      // If the refresh token itself has expired or any auth error occurs,
      // redirect to Angular /login instead of letting the OAuth library
      // initiate a full code flow that lands on the backend's /Account/Login.
      if (event.type === 'token_refresh_error' || event.type === 'session_terminated' || event.type === 'session_error') {
        this.router.navigate(['/login']);
      }
    });
  }

  private updateAuthBodyClass(url: string): void {
    const isAuth = AUTH_PATHS.some(p => url.startsWith(p));
    document.body.classList.toggle('auth-page', isAuth);
  }

  private initRealtime(): void {
    this.realtimeNotificationService.connect();
    this.pushNotificationService.initialize();
  }
}
