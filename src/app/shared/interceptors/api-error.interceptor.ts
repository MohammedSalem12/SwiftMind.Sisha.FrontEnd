import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../toast.service';

/**
 * Intercepts HTTP error responses and shows a toast notification for server errors (5xx)
 * and selected client errors (403, 400 with ABP error format).
 * Does NOT intercept 401 (handled by server-offline interceptor) or 404 (often expected).
 * The error is still re-thrown so component-level handlers can act on it.
 */
export const apiErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status >= 500) {
        toast.show('حدث خطأ في الخادم · Server error occurred', 'error');
      } else if (error.status === 403) {
        toast.show('ليس لديك صلاحية · Access denied', 'error');
      } else if (error.status === 400) {
        const abpError = error.error?.error;
        if (abpError?.message) {
          toast.show(abpError.message, 'error');
        }
      }

      return throwError(() => error);
    })
  );
};
