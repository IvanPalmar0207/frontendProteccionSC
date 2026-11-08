import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { Rol } from '../models/api.models';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

/**
 * Restricts a route to a set of roles. This is a UX guard only: the API is the
 * real authorization boundary and re-checks every role and ownership rule.
 */
export function roleGuard(roles: Rol[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const notificaciones = inject(NotificationService);

    const rolActual = auth.role();
    if (rolActual && roles.includes(rolActual)) {
      return true;
    }
    notificaciones.error('No tienes permisos para acceder a esa sección.');
    return router.createUrlTree([auth.rutaInicio()]);
  };
}
