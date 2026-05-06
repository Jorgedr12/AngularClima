import { HttpInterceptorFn } from '@angular/common/http';
import { tap } from 'rxjs/operators';

export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  const start = Date.now();
  const safeUrl = req.urlWithParams.replace(/appid=[^&]+/, 'appid=***');

  return next(req).pipe(
    tap({
      next: () => console.log(`HTTP Success: ${req.method} ${safeUrl} (${Date.now() - start}ms)`),
      error: (err) => console.error(`HTTP Error: ${req.method} ${safeUrl} — ${err.message}`),
    })
  );
};