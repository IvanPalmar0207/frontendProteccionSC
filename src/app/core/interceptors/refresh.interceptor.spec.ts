import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { authInterceptor } from './auth.interceptor';
import { refreshInterceptor } from './refresh.interceptor';
import { TokenService } from '../services/token.service';

const API = 'http://localhost:8000/api';

describe('refreshInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let tokens: TokenService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor, refreshInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    localStorage.clear();
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    tokens = TestBed.inject(TokenService);
    tokens.guardar('viejo', 'refresh-1');
  });

  afterEach(() => httpMock.verify());

  it('renew the token once on a 401 and retries the original request', () => {
    let resultado: unknown;
    http.get(`${API}/datos`).subscribe((r) => (resultado = r));

    httpMock
      .expectOne(`${API}/datos`)
      .flush({ detail: 'expirado' }, { status: 401, statusText: 'Unauthorized' });

    const refresco = httpMock.expectOne(`${API}/auth/refresh/`);
    expect(refresco.request.body).toEqual({ refresh: 'refresh-1' });
    refresco.flush({ access: 'nuevo' });

    const reintento = httpMock.expectOne(`${API}/datos`);
    expect(reintento.request.headers.get('Authorization')).toBe('Bearer nuevo');
    reintento.flush({ ok: true });

    expect(resultado).toEqual({ ok: true });
    expect(tokens.accessToken).toBe('nuevo');
  });

  it('shares a single renewal between concurrent 401s', () => {
    http.get(`${API}/a`).subscribe();
    http.get(`${API}/b`).subscribe();

    httpMock.expectOne(`${API}/a`).flush({}, { status: 401, statusText: 'Unauthorized' });
    httpMock.expectOne(`${API}/b`).flush({}, { status: 401, statusText: 'Unauthorized' });

    const refrescos = httpMock.match(`${API}/auth/refresh/`);
    expect(refrescos.length).toBe(1);
    refrescos[0].flush({ access: 'nuevo' });

    httpMock.expectOne(`${API}/a`).flush({});
    httpMock.expectOne(`${API}/b`).flush({});
  });

  it('propagates the error and does not retry when the refresh fails', () => {
    let fallo = false;
    http.get(`${API}/datos`).subscribe({ error: () => (fallo = true) });

    httpMock
      .expectOne(`${API}/datos`)
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    httpMock
      .expectOne(`${API}/auth/refresh/`)
      .flush({ detail: 'refresh inválido' }, { status: 401, statusText: 'Unauthorized' });

    expect(fallo).toBe(true);
    // No retry was issued (verify() in afterEach fails on any pending request).
  });

  it('does not renew the authentication endpoints themselves', () => {
    let fallo = false;
    http.post(`${API}/auth/refresh/`, { refresh: 'refresh-1' }).subscribe({
      error: () => (fallo = true),
    });
    httpMock
      .expectOne(`${API}/auth/refresh/`)
      .flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(fallo).toBe(true);
    // Only the original request exists; no extra refresh call was triggered.
  });

  it('does not start a second renewal when the retried request also fails', () => {
    let fallo = false;
    http.get(`${API}/datos`).subscribe({ error: () => (fallo = true) });

    httpMock.expectOne(`${API}/datos`).flush({}, { status: 401, statusText: 'Unauthorized' });
    httpMock.expectOne(`${API}/auth/refresh/`).flush({ access: 'nuevo' });
    httpMock.expectOne(`${API}/datos`).flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(fallo).toBe(true);
    // Exactly one refresh happened, so there is no loop.
  });

  it('does not attempt a renewal without a refresh token', () => {
    tokens.limpiar();
    let fallo = false;
    http.get(`${API}/datos`).subscribe({ error: () => (fallo = true) });

    httpMock.expectOne(`${API}/datos`).flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(fallo).toBe(true);
  });
});
