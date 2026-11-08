import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { TokenService } from '../services/token.service';

/** Requests that must never trigger a silent refresh. */
const EXCLUIDAS = ['/auth/refresh/', '/auth/login/', '/auth/register/', '/auth/password-reset/'];

/**
 * Renews the access token once on a 401 and retries the original request.
 *
 * Runs before the error interceptor, so a successful renewal never reaches the
 * logout path. It never retries the refresh endpoint or the authentication
 * requests, and the retried request is issued with `next()` (not the whole
 * chain), so a second 401 cannot start another renewal loop.
 */
export const refreshInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const tokens = inject(TokenService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const excluida = EXCLUIDAS.some((ruta) => req.url.includes(ruta));

      if (error.status !== 401 || excluida || !tokens.refreshToken) {
        return throwError(() => error);
      }

      return auth.refrescarToken().pipe(
        switchMap((access) =>
          next(
            req.clone({
              setHeaders: { Authorization: `Bearer ${access}` },
            }),
          ),
        ),
        catchError(() => throwError(() => error)),
      );
    }),
  );
};
