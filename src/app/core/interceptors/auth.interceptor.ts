import { HttpInterceptorFn } from '@angular/common/http';

import { TokenService } from './../services/token.service';
import { inject } from '@angular/core';

/** Attaches the JWT access token to every outgoing API request. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokens = inject(TokenService);
  const token = tokens.accessToken;

  if (!token) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    }),
  );
};
