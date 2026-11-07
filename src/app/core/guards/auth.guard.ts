import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

/** Requires an authenticated session; otherwise redirects to login. */
export const authGuard: CanActivateFn = (_ruta, estado) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.autenticado()) {
    // The session may still be hydrating from a stored token.
    auth.cargarSesion();
    return router.createUrlTree(['/login'], {
      queryParams: { redirectTo: estado.url },
    });
  }
  return true;
};

/** Keeps authenticated users away from login/register. */
export const publicOnlyGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.autenticado()) {
    return router.createUrlTree([auth.rutaInicio()]);
  }
  return true;
};
