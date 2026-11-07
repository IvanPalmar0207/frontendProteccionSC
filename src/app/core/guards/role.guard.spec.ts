import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';

import { roleGuard } from './role.guard';
import { AuthService } from '../services/auth.service';

const ruta = {} as ActivatedRouteSnapshot;
const estado = {} as RouterStateSnapshot;

describe('roleGuard', () => {
  function configurar(rol: string | null) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { role: () => rol, rutaInicio: () => '/usuario' } },
      ],
    });
    return TestBed.inject(Router);
  }

  it('allows a matching role', () => {
    configurar('ADMINISTRADOR');
    const resultado = TestBed.runInInjectionContext(() =>
      roleGuard(['ADMINISTRADOR'])(ruta, estado),
    );
    expect(resultado).toBe(true);
  });

  it('redirects a non-matching role to its own landing route', () => {
    configurar('USUARIO');
    const resultado = TestBed.runInInjectionContext(() =>
      roleGuard(['ADMINISTRADOR'])(ruta, estado),
    );
    expect(resultado).toBeInstanceOf(UrlTree);
    expect(String(resultado)).toBe('/usuario');
  });

  it('redirects when there is no role', () => {
    configurar(null);
    const resultado = TestBed.runInInjectionContext(() =>
      roleGuard(['PROFESIONAL'])(ruta, estado),
    );
    expect(resultado).toBeInstanceOf(UrlTree);
  });
});
