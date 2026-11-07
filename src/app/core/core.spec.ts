import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { authInterceptor } from './interceptors/auth.interceptor';
import { AuthService } from './services/auth.service';
import { TokenService } from './services/token.service';

const USUARIO = {
  id: 1,
  email: 'usuario@proteccioninmediata.test',
  nombre_completo: 'Valentina Gómez',
  telefono: '',
  documento: '',
  direccion: '',
  fecha_nacimiento: null,
  role: 'USUARIO' as const,
  is_active: true,
  date_joined: '2026-01-01T00:00:00Z',
};

describe('TokenService', () => {
  let tokens: TokenService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    localStorage.clear();
    tokens = TestBed.inject(TokenService);
  });

  it('stores and reads the token pair', () => {
    tokens.guardar('access-token', 'refresh-token');
    expect(tokens.accessToken).toBe('access-token');
    expect(tokens.refreshToken).toBe('refresh-token');
  });

  it('clears the token pair', () => {
    tokens.guardar('a', 'r');
    tokens.limpiar();
    expect(tokens.accessToken).toBeNull();
    expect(tokens.refreshToken).toBeNull();
  });
});

describe('AuthService', () => {
  let auth: AuthService;
  let tokens: TokenService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    localStorage.clear();
    auth = TestBed.inject(AuthService);
    tokens = TestBed.inject(TokenService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('stores the session after login', () => {
    auth.login(USUARIO.email, 'Usuario123*').subscribe();
    const request = http.expectOne((req) => req.url.endsWith('/auth/login/'));
    request.flush({ access: 'a', refresh: 'r', user: USUARIO });

    expect(tokens.accessToken).toBe('a');
    expect(auth.autenticado()).toBe(true);
    expect(auth.role()).toBe('USUARIO');
  });

  it('clears the session on logout', () => {
    tokens.guardar('a', 'r');
    auth.logout(false);
    expect(auth.autenticado()).toBe(false);
    expect(tokens.accessToken).toBeNull();
  });

  it('maps each role to its landing route', () => {
    tokens.guardar('a', 'r');
    auth.login(USUARIO.email, 'x').subscribe();
    http.expectOne((req) => req.url.endsWith('/auth/login/')).flush({
      access: 'a',
      refresh: 'r',
      user: { ...USUARIO, role: 'ADMINISTRADOR' },
    });
    expect(auth.rutaInicio()).toBe('/admin');
  });

  it('attaches the bearer token through the interceptor', () => {
    tokens.guardar('token-123', 'r');
    const client = TestBed.inject(HttpClient);
    client.get('/api/ping').subscribe();
    const request = http.expectOne('/api/ping');
    expect(request.request.headers.get('Authorization')).toBe('Bearer token-123');
    request.flush({});
  });

  it('restores the session from a stored token on inicializar', async () => {
    tokens.guardar('stored', 'r');
    const pendiente = auth.inicializar();
    http.expectOne((req) => req.url.endsWith('/auth/me/')).flush(USUARIO);
    await pendiente;
    expect(auth.autenticado()).toBe(true);
    expect(auth.role()).toBe('USUARIO');
  });

  it('clears an invalid stored token on inicializar', async () => {
    tokens.guardar('caducado', 'r');
    const pendiente = auth.inicializar();
    http
      .expectOne((req) => req.url.endsWith('/auth/me/'))
      .flush({ detail: 'no' }, { status: 401, statusText: 'Unauthorized' });
    await pendiente;
    expect(auth.autenticado()).toBe(false);
    expect(tokens.accessToken).toBeNull();
  });
});
