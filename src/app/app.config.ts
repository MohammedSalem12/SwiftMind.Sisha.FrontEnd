import { ApplicationConfig, importProvidersFrom, APP_INITIALIZER } from '@angular/core';
import { provideRouter, Router, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ngrokInterceptor } from './shared/ngrok.interceptor';
import { provideAnimations } from '@angular/platform-browser/animations';
import { RouteReuseStrategy } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { appRoutes } from './app.routes';
import { APP_ROUTE_PROVIDER } from './route.provider';
import { provideAbpCore, withOptions, AuthService } from '@abp/ng.core';
import { environment } from '../environments/environment';
import { registerLocale } from '@abp/ng.core/locale';
import { provideAbpOAuth } from '@abp/ng.oauth';
import { provideSettingManagementConfig } from '@abp/ng.setting-management/config';
import { provideAccountConfig } from '@abp/ng.account/config';
import { provideIdentityConfig } from '@abp/ng.identity/config';
import { provideTenantManagementConfig } from '@abp/ng.tenant-management/config';
import { provideFeatureManagementConfig } from '@abp/ng.feature-management';
import { provideLogo, withEnvironmentOptions } from '@volo/ngx-lepton-x.core';
import { ThemeLeptonXModule } from '@abp/ng.theme.lepton-x';
import { provideSideMenuLayout, SideMenuLayoutModule } from '@abp/ng.theme.lepton-x/layouts';
import { AccountLayoutModule } from '@abp/ng.theme.lepton-x/account';
import { ThemeSharedModule, withHttpErrorConfig, withValidationBluePrint, provideAbpThemeShared } from '@abp/ng.theme.shared';
import { OAuthService } from 'angular-oauth2-oidc';
import { PushNotificationService } from './shared/services/push-notification.service';

// Patch AuthService.navigateToLogin() so every ABP component (including the
// LeptonX navbar login button) uses our Angular /login page instead of
// initiating an OAuth authorization-code flow that lands on the backend's
// /Account/Login Razor page.
function patchAuthServiceLogin(authService: AuthService, router: Router) {
  return () => {
    (authService as any).navigateToLogin = (_redirectUrl?: string) => {
      router.navigate(['/login']);
    };
  };
}

// Patch AuthService.logout() to skip the end_session redirect entirely.
// OpenIddict rejects the post_logout_redirect_uri unless it is registered in
// the DB, which requires running the DbMigrator against the live SQL Server.
// Instead we clear tokens locally and navigate to /login — identical UX.
//
// IMPORTANT: unregisterCurrentToken() is called BEFORE oauthService.logOut()
// so the API call goes out while the token is still valid. Otherwise the
// 'logout' event fires after tokens are cleared, causing a 401 that ABP's
// error interceptor shows as an error toast on Android.
function patchAuthServiceLogout(
  authService: AuthService,
  oauthService: OAuthService,
  router: Router,
  pushNotificationSvc: PushNotificationService,
) {
  return () => {
    (authService as any).logout = async () => {
      await pushNotificationSvc.unregisterCurrentToken(); // while token still valid
      oauthService.logOut(true); // noRedirectToWellKnownEndSession = true
      await router.navigate(['/login']);
    };
  };
}

export const appConfig: ApplicationConfig = {
    providers: [
    provideRouter(appRoutes, withInMemoryScrolling({ scrollPositionRestoration: 'top' })),
    provideHttpClient(withInterceptors([ngrokInterceptor])),
    APP_ROUTE_PROVIDER,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideAbpCore(withOptions({
        environment,
        registerLocaleFn: registerLocale(),
    })),
    provideSideMenuLayout(),
    provideAbpOAuth(),
    {
      provide: APP_INITIALIZER,
      useFactory: patchAuthServiceLogin,
      deps: [AuthService, Router],
      multi: true,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: patchAuthServiceLogout,
      deps: [AuthService, OAuthService, Router, PushNotificationService],
      multi: true,
    },
    provideSettingManagementConfig(),
    provideAccountConfig(),
    provideIdentityConfig(),
    provideTenantManagementConfig(),
    provideFeatureManagementConfig(),
    provideAnimations(),
    provideLogo(withEnvironmentOptions(environment)), 
    importProvidersFrom(
        IonicModule.forRoot({
            mode: 'md',
            rippleEffect: true,
        }),
        ThemeLeptonXModule.forRoot(), 
        SideMenuLayoutModule.forRoot(), 
        AccountLayoutModule.forRoot(), 
        ThemeSharedModule
    ), 
    provideAbpThemeShared(withValidationBluePrint({
        wrongPassword: 'Please choose 1q2w3E*'
    }))
],
};
