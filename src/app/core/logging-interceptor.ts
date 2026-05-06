import { HttpInterceptorFn } from '@angular/common/http';
import { tap } from 'rxjs/operators';

export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  const start = Date.now();
  console.log(`[HTTP] ${req.method} ${req.url}`);
  return next(req).pipe(
    tap({
      next: () => console.log(`[HTTP] ✓ ${req.method} ${req.url} — ${Date.now() - start}ms`),
      error: (err) => console.error(`[HTTP] ✗ ${req.method} ${req.url} — ${err.message}`),
    })
  );
};