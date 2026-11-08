import { TestBed } from '@angular/core/testing';

import { ChatSocketService } from './chat-socket.service';
import { TokenService } from './token.service';

class FakeWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;
  static instancias: FakeWebSocket[] = [];

  static reset(): void {
    FakeWebSocket.instancias = [];
  }

  static get ultima(): FakeWebSocket {
    return FakeWebSocket.instancias[FakeWebSocket.instancias.length - 1];
  }

  readyState = FakeWebSocket.CONNECTING;
  onopen: (() => void) | null = null;
  onmessage: ((evento: MessageEvent) => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: ((evento: CloseEvent) => void) | null = null;
  readonly enviados: string[] = [];

  constructor(readonly url: string) {
    FakeWebSocket.instancias.push(this);
  }

  send(datos: string): void {
    this.enviados.push(datos);
  }

  close(): void {
    this.readyState = FakeWebSocket.CLOSED;
  }

  abrir(): void {
    this.readyState = FakeWebSocket.OPEN;
    this.onopen?.();
  }

  emitir(payload: unknown): void {
    this.onmessage?.({ data: JSON.stringify(payload) } as MessageEvent);
  }

  caer(codigo = 1006): void {
    this.readyState = FakeWebSocket.CLOSED;
    this.onclose?.({ code: codigo } as CloseEvent);
  }
}

describe('ChatSocketService', () => {
  let servicio: ChatSocketService;
  const original = globalThis.WebSocket;

  beforeEach(() => {
    vi.useFakeTimers();
    FakeWebSocket.reset();
    (globalThis as unknown as { WebSocket: unknown }).WebSocket = FakeWebSocket;
    localStorage.clear();
    TestBed.configureTestingModule({});
    TestBed.inject(TokenService).guardar('token-1', 'refresh-1');
    servicio = TestBed.inject(ChatSocketService);
  });

  afterEach(() => {
    servicio.cerrar();
    vi.useRealTimers();
    (globalThis as unknown as { WebSocket: unknown }).WebSocket = original;
  });

  it('connects and reports the connected state', () => {
    servicio.conectar(7);
    expect(FakeWebSocket.instancias.length).toBe(1);
    expect(servicio.estadoConexion()).toBe('conectando');
    FakeWebSocket.ultima.abrir();
    expect(servicio.estadoConexion()).toBe('conectado');
  });

  it('does not open a duplicate socket for the same conversation', () => {
    servicio.conectar(7);
    FakeWebSocket.ultima.abrir();
    servicio.conectar(7);
    expect(FakeWebSocket.instancias.length).toBe(1);
  });

  it('retries with backoff after an unexpected close', () => {
    servicio.conectar(7);
    FakeWebSocket.ultima.abrir();
    FakeWebSocket.ultima.caer();
    expect(servicio.estadoConexion()).toBe('reintentando');

    vi.advanceTimersByTime(1000);
    expect(FakeWebSocket.instancias.length).toBe(2);
    FakeWebSocket.ultima.abrir();
    expect(servicio.estadoConexion()).toBe('conectado');
  });

  it('stops retrying and reports no connection after the limit', () => {
    servicio.conectar(7);
    FakeWebSocket.ultima.abrir();
    for (const espera of [1000, 2000, 4000, 8000, 15000]) {
      FakeWebSocket.ultima.caer();
      vi.advanceTimersByTime(espera);
    }
    FakeWebSocket.ultima.caer();
    expect(servicio.estadoConexion()).toBe('sin-conexion');
    // 1 initial + 5 retries.
    expect(FakeWebSocket.instancias.length).toBe(6);
  });

  it('never retries a rejected connection (not a participant)', () => {
    servicio.conectar(7);
    FakeWebSocket.ultima.caer(4403);
    expect(servicio.estadoConexion()).toBe('rechazado');
    vi.advanceTimersByTime(60000);
    expect(FakeWebSocket.instancias.length).toBe(1);
  });

  it('reconnects immediately when the browser comes back online', () => {
    servicio.conectar(7);
    FakeWebSocket.ultima.abrir();
    FakeWebSocket.ultima.caer();
    vi.advanceTimersByTime(500);
    window.dispatchEvent(new Event('online'));
    vi.advanceTimersByTime(0);
    expect(FakeWebSocket.instancias.length).toBe(2);
  });

  it('emits incoming messages and sends text when open', () => {
    const recibidos: unknown[] = [];
    servicio.mensajes$.subscribe((mensaje) => recibidos.push(mensaje));
    servicio.conectar(7);
    FakeWebSocket.ultima.abrir();

    expect(servicio.enviar('hola')).toBe(true);
    expect(FakeWebSocket.ultima.enviados[0]).toBe(JSON.stringify({ contenido: 'hola' }));

    FakeWebSocket.ultima.emitir({ tipo: 'mensaje', mensaje: { id: 1, contenido: 'hola' } });
    expect(recibidos.length).toBe(1);
  });

  it('stops everything on cerrar', () => {
    servicio.conectar(7);
    FakeWebSocket.ultima.abrir();
    servicio.cerrar();
    expect(servicio.estadoConexion()).toBe('desconectado');
    expect(servicio.enviar('x')).toBe(false);
    vi.advanceTimersByTime(60000);
    expect(FakeWebSocket.instancias.length).toBe(1);
  });
});
