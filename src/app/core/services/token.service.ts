import { Injectable } from '@angular/core';

/**
 * Persists the JWT pair in `localStorage`. Kept tiny and dependency-free so it
 * can be used by the auth service and the interceptors without cycles.
 */
@Injectable({ providedIn: 'root' })
export class TokenService {
  private readonly ACCESS_KEY = 'pi_access';
  private readonly REFRESH_KEY = 'pi_refresh';

  get accessToken(): string | null {
    return localStorage.getItem(this.ACCESS_KEY);
  }

  get refreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_KEY);
  }

  guardar(access: string, refresh: string): void {
    localStorage.setItem(this.ACCESS_KEY, access);
    localStorage.setItem(this.REFRESH_KEY, refresh);
  }

  limpiar(): void {
    localStorage.removeItem(this.ACCESS_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
  }
}
