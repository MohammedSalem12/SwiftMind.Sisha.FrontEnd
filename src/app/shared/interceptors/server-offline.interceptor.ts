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

      // 401 = the server rejected the token (expired / revoked — possibly due to clock
      // skew the client-side hasValidAccessToken() check misses, which previously left
      // the app sitting on a stale page). Always end the session and go to /login, but
      // only once and never from an auth page (avoids redirect loops). Token requests are
      // excluded so a failed login doesn't bounce the login page.
      if (error.status === 401 && !req.url.includes('/connect/token')) {
        const url = router.url;
        const onAuthPage = url.startsWith('/login') || url.startsWith('/register') || url.startsWith('/forgot-password');
        if (!onAuthPage) {
          oauthService.logOut(true); // clear tokens (prevents OAuth authorize redirect)
          router.navigate(['/login']);
        }
      }

      return throwError(() => error);
    })
  );
};
