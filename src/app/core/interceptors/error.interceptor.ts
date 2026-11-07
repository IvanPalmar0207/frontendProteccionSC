import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

/** Extracts a readable message from a DRF error payload. */
function mensajeDeError(error: HttpErrorResponse): string {
  if (typeof error.error === 'string') {
    return 'Ocurrió un error inesperado. Intentá nuevamente.';
  }
  if (error.error && typeof error.error === 'object') {
    const cuerpo = error.error as Record<string, unknown>;
    if (typeof cuerpo['detail'] === 'string') {
      return cuerpo['detail'];
    }
    const primerCampo = Object.values(cuerpo)[0];
    if (Array.isArray(primerCampo) && typeof primerCampo[0] === 'string') {
      return primerCampo[0];
    }
  }
  switch (error.status) {
    case 403:
      return 'No tenés permisos para realizar esta acción.';
    case 404:
      return 'No se encontró el recurso solicitado.';
    case 0:
      return 'No se pudo conectar con el servidor.';
    default:
      return 'Ocurrió un error inesperado. Intentá nuevamente.';
  }
}

/**
 * Shows API errors to the user and clears the session on 401. Authentication
 * endpoints are exempt from the automatic redirect so the login form can show
 * the "credenciales inválidas" message instead.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const notificaciones = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const esAuth = req.url.includes('/auth/login') || req.url.includes('/auth/register');

      if (error.status === 401) {
        auth.limpiarSesion();
        if (!esAuth) {
          notificaciones.error('Tu sesión expiró. Iniciá sesión nuevamente.');
          router.navigate(['/login']);
        } else {
          notificaciones.error('Correo o contraseña incorrectos.');
        }
      } else if (!esAuth) {
        notificaciones.error(mensajeDeError(error));
      }

      return throwError(() => error);
    }),
  );
};
