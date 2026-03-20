import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ServerOfflineService } from '../services/server-offline.service';

export const serverOfflineInterceptor: HttpInterceptorFn = (req, next) => {
  const offlineService = inject(ServerOfflineService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // 0 = network error (no response from server), or CORS blocked
      if (error.status === 0 && !req.url.includes('googleapis.com') && !req.url.includes('facebook.net')) {
        offlineService.notifyOffline();
      }
      return throwError(() => error);
    })
  );
};
