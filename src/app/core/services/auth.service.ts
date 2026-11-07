import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { LoginResponse, Rol, Usuario } from '../models/api.models';
import { NotificationService } from './notification.service';
import { TokenService } from './token.service';

export interface RegistroPayload {
  email: string;
  nombre_completo: string;
  telefono?: string;
  password: string;
  password_confirm: string;
}

/**
 * Central session and role state. Components read the signals instead of
 * decoding the JWT themselves.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly tokens = inject(TokenService);
  private readonly notificaciones = inject(NotificationService);

  private readonly usuario = signal<Usuario | null>(null);
  private readonly cargando = signal(false);

  readonly usuarioActual = this.usuario.asReadonly();
  readonly cargandoSesion = this.cargando.asReadonly();
  readonly autenticado = computed(() => this.usuario() !== null);
  readonly role = computed<Rol | null>(() => this.usuario()?.role ?? null);
  readonly isUsuario = computed(() => this.role() === 'USUARIO');
  readonly isProfesional = computed(() => this.role() === 'PROFESIONAL');
  readonly isAdministrador = computed(() => this.role() === 'ADMINISTRADOR');

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login/`, { email, password })
      .pipe(
        tap((respuesta) => {
          this.tokens.guardar(respuesta.access, respuesta.refresh);
          this.usuario.set(respuesta.user);
        }),
      );
  }

  register(payload: RegistroPayload): Observable<{ detail: string; user: Usuario }> {
    return this.http.post<{ detail: string; user: Usuario }>(
      `${environment.apiUrl}/auth/register/`,
      payload,
    );
  }

  solicitarRecuperacion(email: string): Observable<{ detail: string }> {
    return this.http.post<{ detail: string }>(
      `${environment.apiUrl}/auth/password-reset/`,
      { email },
    );
  }

  validarTokenRecuperacion(token: string): Observable<{ valido: boolean }> {
    return this.http.get<{ valido: boolean }>(
      `${environment.apiUrl}/auth/password-reset/validate/`,
      { params: { token } },
    );
  }

  confirmarRecuperacion(
    token: string,
    password: string,
    password_confirm: string,
  ): Observable<{ detail: string }> {
    return this.http.post<{ detail: string }>(
      `${environment.apiUrl}/auth/password-reset/confirm/`,
      { token, password, password_confirm },
    );
  }

  /**
   * Restores the session from the stored token and resolves once the answer is
   * known. Used as an app initializer so route guards always see the real role
   * on a hard reload instead of bouncing to /login.
   */
  inicializar(): Promise<void> {
    if (!this.tokens.accessToken) {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      this.http.get<Usuario>(`${environment.apiUrl}/auth/me/`).subscribe({
        next: (usuario) => {
          this.usuario.set(usuario);
          resolve();
        },
        error: () => {
          this.tokens.limpiar();
          this.usuario.set(null);
          resolve();
        },
      });
    });
  }

  cargarSesion(): void {
    if (!this.tokens.accessToken || this.usuario() !== null) {
      return;
    }
    this.cargando.set(true);
    this.http.get<Usuario>(`${environment.apiUrl}/auth/me/`).subscribe({
      next: (usuario) => {
        this.usuario.set(usuario);
        this.cargando.set(false);
      },
      error: () => {
        this.tokens.limpiar();
        this.usuario.set(null);
        this.cargando.set(false);
      },
    });
  }

  logout(redirigir = true): void {
    this.tokens.limpiar();
    this.usuario.set(null);
    if (redirigir) {
      this.router.navigate(['/login']);
    }
  }

  limpiarSesion(): void {
    this.tokens.limpiar();
    this.usuario.set(null);
  }

  /**
   * Ruta inicial según el rol, usada después del login y por los guards.
   */
  rutaInicio(): string {
    switch (this.role()) {
      case 'PROFESIONAL':
        return '/profesional';
      case 'ADMINISTRADOR':
        return '/admin';
      default:
        return '/usuario';
    }
  }

  validarSesion(): boolean {
    if (!this.tokens.accessToken) {
      this.notificaciones.error('Iniciá sesión para continuar.');
      return false;
    }
    return true;
  }
}
