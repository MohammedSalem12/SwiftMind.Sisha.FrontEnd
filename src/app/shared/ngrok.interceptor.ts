import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../environments/environment';

/**
 * Adds the ngrok-skip-browser-warning header to all requests going to the
 * ngrok tunnel URL. This bypasses the ngrok interstitial warning page for API calls.
 */
export const ngrokInterceptor: HttpInterceptorFn = (req, next) => {
  if (!environment.production) return next(req);

  const backendUrl: string = (environment as any).apis?.default?.url ?? '';
  if (backendUrl && req.url.startsWith(backendUrl)) {
    const modified = req.clone({
      setHeaders: { 'ngrok-skip-browser-warning': 'true' },
    });
    return next(modified);
  }
  return next(req);
};
