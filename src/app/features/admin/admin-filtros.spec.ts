import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminNoticiasComponent } from './noticias/admin-noticias.component';
import { AdminPodcastsComponent } from './podcasts/admin-podcasts.component';

const PAGINA_VACIA = { count: 0, next: null, previous: null, results: [] };
const ESPERA = 400;

function coincide(sufijo: string) {
  return (req: { url: string }) => req.url.endsWith(sufijo);
}

describe('Filtros administrativos de noticias', () => {
  let fixture: ComponentFixture<AdminNoticiasComponent>;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      imports: [AdminNoticiasComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    fixture = TestBed.createComponent(AdminNoticiasComponent);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    httpMock.expectOne(coincide('/noticias/')).flush(PAGINA_VACIA);
  });

  afterEach(() => {
    httpMock.verify();
    vi.useRealTimers();
  });

  it('un solo carácter no dispara ninguna búsqueda de texto', () => {
    fixture.componentInstance.onBuscar('v');
    vi.advanceTimersByTime(ESPERA + 100);

    expect(httpMock.match(coincide('/noticias/')).length).toBe(0);
  });

  it('dos caracteres se buscan una sola vez tras la espera', () => {
    fixture.componentInstance.onBuscar('vi');
    vi.advanceTimersByTime(ESPERA);

    const peticiones = httpMock.match(
      (req) => req.url.endsWith('/noticias/') && req.params.get('search') === 'vi',
    );
    expect(peticiones.length).toBe(1);
    peticiones[0].flush(PAGINA_VACIA);
  });

  it('seguir escribiendo reinicia el debounce', () => {
    fixture.componentInstance.onBuscar('vi');
    vi.advanceTimersByTime(ESPERA - 100);
    expect(httpMock.match(coincide('/noticias/')).length).toBe(0);

    fixture.componentInstance.onBuscar('vio');
    vi.advanceTimersByTime(ESPERA - 100);
    // Still inside the restarted window: no request yet.
    expect(httpMock.match(coincide('/noticias/')).length).toBe(0);

    vi.advanceTimersByTime(100);
    const peticiones = httpMock.match(
      (req) => req.url.endsWith('/noticias/') && req.params.get('search') === 'vio',
    );
    expect(peticiones.length).toBe(1);
    peticiones[0].flush(PAGINA_VACIA);
  });

  it('limpiar la búsqueda restaura los resultados sin parámetro search', () => {
    fixture.componentInstance.onBuscar('acoso');
    vi.advanceTimersByTime(ESPERA);
    httpMock
      .expectOne((req) => req.url.endsWith('/noticias/') && req.params.get('search') === 'acoso')
      .flush(PAGINA_VACIA);

    fixture.componentInstance.onBuscar('');
    vi.advanceTimersByTime(ESPERA);
    const peticion = httpMock.expectOne((req) => req.url.endsWith('/noticias/'));
    expect(peticion.request.params.has('search')).toBe(false);
    expect(peticion.request.params.get('page')).toBe('1');
    peticion.flush(PAGINA_VACIA);
  });

  it('el filtro de estado envía publicado y reinicia a la página 1', () => {
    fixture.componentInstance.cambiarPagina(3);
    httpMock
      .expectOne((req) => req.url.endsWith('/noticias/') && req.params.get('page') === '3')
      .flush(PAGINA_VACIA);

    fixture.componentInstance.cambiarEstado('false');
    const peticion = httpMock.expectOne(
      (req) => req.url.endsWith('/noticias/') && req.params.get('publicado') === 'false',
    );
    expect(peticion.request.params.get('page')).toBe('1');
    peticion.flush(PAGINA_VACIA);
  });

  it('combina búsqueda y estado en una sola petición', () => {
    fixture.componentInstance.cambiarEstado('true');
    httpMock
      .expectOne((req) => req.url.endsWith('/noticias/') && req.params.get('publicado') === 'true')
      .flush(PAGINA_VACIA);

    fixture.componentInstance.onBuscar('salud');
    vi.advanceTimersByTime(ESPERA);
    const peticion = httpMock.expectOne(
      (req) =>
        req.url.endsWith('/noticias/') &&
        req.params.get('search') === 'salud' &&
        req.params.get('publicado') === 'true',
    );
    peticion.flush(PAGINA_VACIA);
  });

  it('una búsqueda nueva cancela la anterior (sin respuestas obsoletas)', () => {
    fixture.componentInstance.onBuscar('ab');
    vi.advanceTimersByTime(ESPERA);
    fixture.componentInstance.onBuscar('abc');
    vi.advanceTimersByTime(ESPERA);

    const peticiones = httpMock.match((req) => req.url.endsWith('/noticias/'));
    const abiertas = peticiones.filter((peticion) => !peticion.cancelled);
    expect(abiertas.length).toBe(1);
    expect(abiertas[0].request.params.get('search')).toBe('abc');
    expect(peticiones.some((peticion) => peticion.cancelled)).toBe(true);
    abiertas[0].flush(PAGINA_VACIA);
  });

  it('no genera solicitudes duplicadas para la misma búsqueda', () => {
    fixture.componentInstance.onBuscar('misma');
    vi.advanceTimersByTime(ESPERA);
    fixture.componentInstance.onBuscar('misma');
    vi.advanceTimersByTime(ESPERA);

    const peticiones = httpMock.match((req) => req.url.endsWith('/noticias/'));
    expect(peticiones.length).toBe(1);
    peticiones[0].flush(PAGINA_VACIA);
  });

  it('el input de búsqueda no se reemplaza durante una consulta', () => {
    const inputAntes = fixture.nativeElement.querySelector('#buscar') as HTMLInputElement;

    fixture.componentInstance.onBuscar('ab');
    vi.advanceTimersByTime(ESPERA);
    httpMock
      .expectOne((req) => req.url.endsWith('/noticias/') && req.params.get('search') === 'ab')
      .flush({ ...PAGINA_VACIA, results: [] });
    fixture.detectChanges();

    const inputDespues = fixture.nativeElement.querySelector('#buscar') as HTMLInputElement;
    // Same DOM node: no destroy/recreate, so focus and caret survive.
    expect(inputDespues).toBe(inputAntes);
  });

  it('un error HTTP no rompe el flujo de filtros', () => {
    fixture.componentInstance.onBuscar('ab');
    vi.advanceTimersByTime(ESPERA);
    httpMock
      .expectOne((req) => req.url.endsWith('/noticias/'))
      .flush({}, { status: 500, statusText: 'Server Error' });

    fixture.componentInstance.onBuscar('abc');
    vi.advanceTimersByTime(ESPERA);
    const peticion = httpMock.expectOne(
      (req) => req.url.endsWith('/noticias/') && req.params.get('search') === 'abc',
    );
    peticion.flush(PAGINA_VACIA);
  });

  it('conserva la búsqueda al cambiar el estado', () => {
    fixture.componentInstance.onBuscar('salud');
    vi.advanceTimersByTime(ESPERA);
    httpMock
      .expectOne((req) => req.url.endsWith('/noticias/') && req.params.get('search') === 'salud')
      .flush(PAGINA_VACIA);

    fixture.componentInstance.cambiarEstado('true');
    const peticion = httpMock.expectOne((req) => req.url.endsWith('/noticias/'));
    expect(peticion.request.params.get('search')).toBe('salud');
    expect(peticion.request.params.get('publicado')).toBe('true');
    peticion.flush(PAGINA_VACIA);
  });

  it('borrar el texto conserva el estado seleccionado', () => {
    fixture.componentInstance.cambiarEstado('false');
    httpMock
      .expectOne((req) => req.url.endsWith('/noticias/') && req.params.get('publicado') === 'false')
      .flush(PAGINA_VACIA);

    fixture.componentInstance.onBuscar('ab');
    vi.advanceTimersByTime(ESPERA);
    httpMock
      .expectOne((req) => req.url.endsWith('/noticias/') && req.params.get('search') === 'ab')
      .flush(PAGINA_VACIA);

    fixture.componentInstance.onBuscar('');
    vi.advanceTimersByTime(ESPERA);
    const peticion = httpMock.expectOne((req) => req.url.endsWith('/noticias/'));
    expect(peticion.request.params.has('search')).toBe(false);
    expect(peticion.request.params.get('publicado')).toBe('false');
    peticion.flush(PAGINA_VACIA);
  });
});

describe('Filtros administrativos de pódcast', () => {
  let fixture: ComponentFixture<AdminPodcastsComponent>;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      imports: [AdminPodcastsComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    fixture = TestBed.createComponent(AdminPodcastsComponent);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    httpMock.expectOne(coincide('/podcasts/')).flush(PAGINA_VACIA);
  });

  afterEach(() => {
    httpMock.verify();
    vi.useRealTimers();
  });

  it('un solo carácter no dispara la búsqueda', () => {
    fixture.componentInstance.onBuscar('v');
    vi.advanceTimersByTime(ESPERA + 100);
    expect(httpMock.match(coincide('/podcasts/')).length).toBe(0);
  });

  it('la búsqueda y el estado se combinan en una sola petición', () => {
    fixture.componentInstance.cambiarEstado('true');
    httpMock
      .expectOne((req) => req.url.endsWith('/podcasts/') && req.params.get('publicado') === 'true')
      .flush(PAGINA_VACIA);

    fixture.componentInstance.onBuscar('voces');
    vi.advanceTimersByTime(ESPERA);
    const peticion = httpMock.expectOne(
      (req) =>
        req.url.endsWith('/podcasts/') &&
        req.params.get('search') === 'voces' &&
        req.params.get('publicado') === 'true',
    );
    peticion.flush(PAGINA_VACIA);
  });

  it('el filtro de estado de pódcast reinicia a la página 1', () => {
    fixture.componentInstance.cambiarPagina(2);
    httpMock
      .expectOne((req) => req.url.endsWith('/podcasts/') && req.params.get('page') === '2')
      .flush(PAGINA_VACIA);

    fixture.componentInstance.cambiarEstado('false');
    const peticion = httpMock.expectOne(
      (req) => req.url.endsWith('/podcasts/') && req.params.get('publicado') === 'false',
    );
    expect(peticion.request.params.get('page')).toBe('1');
    peticion.flush(PAGINA_VACIA);
  });
});
