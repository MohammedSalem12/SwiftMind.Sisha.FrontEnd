import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { OAuthService } from 'angular-oauth2-oidc';
import { ServerOfflineService } from '../services/server-offline.service';

export const serverOfflineInterceptor: HttpInterceptorFn = (req, next) => {
  const offlineService = inject(ServerOfflineService);
  const oauthService = inject(OAuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // 0 = network error (no response from server)
      if (error.status === 0 && !req.url.includes('googleapis.com') && !req.url.includes('facebook.net')) {
        offlineService.notifyOffline();
      }

      // 401 with expired/missing token — redirect to /login before OAuth
      // can redirect to the backend authorize URL
      if (error.status === 401 && !req.url.includes('/connect/token')) {
        if (!oauthService.hasValidAccessToken()) {
          // Clear tokens to prevent OAuth from trying to redirect
          oauthService.logOut(true);
          router.navigate(['/login']);
        }
      }

      return throwError(() => error);
    })
  );
};
