import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { InternetConnectionStatusComponent, LoaderBarComponent } from '@abp/ng.theme.shared';
import { DynamicLayoutComponent } from '@abp/ng.core';
import { OAuthService } from 'angular-oauth2-oidc';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { ToastContainerComponent } from './shared/toast-container.component';
import { BottomNavComponent } from './shared/bottom-nav.component';
import { RealtimeNotificationService } from './shared/services/realtime-notification.service';
import { SidebarNotificationDirective } from './shared/sidebar-notification.directive';
import { TopBarComponent } from './shared/top-bar.component';
import { ServerOfflineOverlayComponent } from './shared/components/server-offline-overlay.component';
import { ServerOfflineService } from './shared/services/server-offline.service';
import { RegisterModalComponent } from './shared/components/register-modal.component';
import { TeacherInfoModalComponent } from './shared/components/teacher-info-modal.component';
import { BiometricLockComponent } from './shared/components/biometric-lock.component';
import { RegisterModalService } from './shared/services/register-modal.service';
import { BiometricService } from './shared/services/biometric.service';
import { Capacitor } from '@capacitor/core';

const AUTH_PATHS = ['/login', '/register', '/forgot-password', '/complete-profile'];

@Component({
  selector: 'app-root',
  template: `
    <abp-loader-bar />
    <app-top-bar />
    <div class="app-content" appSidebarNotification>
      <abp-dynamic-layout />
    </div>
    <app-bottom-nav />
    <abp-internet-status />
    <app-toasts />
    @if (serverOffline.isOffline()) {
      <app-server-offline-overlay />
    }
    @if (registerModal.isOpen()) {
      <app-register-modal />
    }
    <app-teacher-info-modal />
    @if (biometricService.isLocked()) {
      <app-biometric-lock />
    }
  `,
  styles: [`
    /* Reserve space for fixed top bar on mobile */
    @media (max-width: 767px) {
      .app-content {
        padding-top: calc(48px + env(safe-area-inset-top, 0px));
      }
    }

    /* Reserve space for fixed bottom nav — only when nav is visible */
    .app-content {
      padding-bottom: 70px;
    }

    @supports (padding-bottom: env(safe-area-inset-bottom)) {
      .app-content {
        padding-bottom: calc(70px + env(safe-area-inset-bottom));
      }
    }

    /* Remove padding when nav is hidden (visitor/auth pages) */
    :host-context(body.nav-hidden) .app-content {
      padding-top: 0 !important;
      padding-bottom: 0 !important;
    }
  `],
  imports: [
    LoaderBarComponent,
    DynamicLayoutComponent,
    InternetConnectionStatusComponent,
    ToastContainerComponent,
    BottomNavComponent,
    TopBarComponent,
    SidebarNotificationDirective,
    ServerOfflineOverlayComponent,
    RegisterModalComponent,
    TeacherInfoModalComponent,
    BiometricLockComponent,
  ],
})
export class AppComponent implements OnInit {
  private readonly oauthService = inject(OAuthService);
  private readonly router = inject(Router);
  private readonly realtimeNotificationService = inject(RealtimeNotificationService);
  readonly serverOffline = inject(ServerOfflineService);
  readonly registerModal = inject(RegisterModalService);
  readonly biometricService = inject(BiometricService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    // Add/remove auth-page class on body for CSS sidebar hiding
    this.updateAuthBodyClass(this.router.url);
    this.router.events.pipe(filter(e => e instanceof NavigationEnd), takeUntilDestroyed(this.destroyRef)).subscribe((e: NavigationEnd) => {
      this.updateAuthBodyClass(e.urlAfterRedirects);
      this.scrollToTop();
    });

    // Prevent OAuth from redirecting to backend /Account/Login
    // Override initCodeFlow to redirect to our /login instead
    (this.oauthService as any).initCodeFlow = () => {
      this.router.navigate(['/login']);
    };
    (this.oauthService as any).initImplicitFlow = () => {
      this.router.navigate(['/login']);
    };

    // Connect real-time services when user is already logged in (page refresh)
    if (this.oauthService.hasValidAccessToken()) {
      this.initRealtime();
    }

    // Biometric lock on app resume (native only)
    if (Capacitor.isNativePlatform()) {
      import('@capacitor/app').then(({ App }) => {
        App.addListener('appStateChange', async ({ isActive }) => {
          if (isActive && this.oauthService.hasValidAccessToken()) {
            const enabled = await this.biometricService.isEnabled();
            if (enabled) {
              this.biometricService.lock();
            }
          }
        });

        // Deep link handler: kai://register?ref=REF-XXXX or https://sesha-9999.web.app/register?ref=REF-XXXX
        App.addListener('appUrlOpen', ({ url }) => {
          const isRegister = /(?:kai:\/\/register|\/register)/.test(url);
          if (isRegister) {
            const refMatch = url.match(/[?&]ref=(REF-[0-9A-Fa-f]{8})/i);
            const queryParams = refMatch ? { ref: refMatch[1] } : {};
            this.router.navigate(['/register'], { queryParams });
          }
        });
      });
    }

    this.oauthService.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(event => {
      if (event.type === 'token_received' || event.type === 'silently_refreshed') {
        this.initRealtime();
      }
      if (event.type === 'logout') {
        this.realtimeNotificationService.disconnect();
        // unregisterCurrentToken() is called in the logout patch (app.config.ts)
        // BEFORE tokens are cleared, so we don't repeat it here.
      }
      // If the refresh token itself has expired or any auth error occurs,
      // redirect to Angular /login instead of letting the OAuth library
      // initiate a full code flow that lands on the backend's /Account/Login.
      if (event.type === 'token_refresh_error' || event.type === 'session_terminated'
          || event.type === 'session_error' || event.type === 'discovery_document_validation_error') {
        // Clear tokens to prevent OAuth from redirecting to backend authorize URL
        this.oauthService.logOut(true);
        this.router.navigate(['/login']);
      }
    });
  }

  private scrollToTop(): void {
    // Scroll window and document root
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    // Scroll ABP LeptonX layout content wrapper
    const contentEl = document.querySelector('.lx-page-content, .content-wrapper, .main-content, [class*="content"]') as HTMLElement | null;
    if (contentEl) contentEl.scrollTop = 0;
  }

  private updateAuthBodyClass(url: string): void {
    const isAuth = AUTH_PATHS.some(p => url.startsWith(p));
    document.body.classList.toggle('auth-page', isAuth);
  }

  private initRealtime(): void {
    // SignalR live notifications only. Push notification init is deliberately
    // NOT started here: requesting native push permission during the post-login
    // navigation raced the Capacitor Activity lifecycle and crashed the plugin
    // (NPE in getPermissionStates). It is now gated behind the first visit to
    // the notifications screen (NotificationsComponent.ngOnInit), where the app
    // is idle and the bridge is stable.
    this.realtimeNotificationService.connect();
  }
}
