import { Injectable, inject, signal } from '@angular/core';
import { Observable, Subject } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Mensaje } from '../models/api.models';
import { TokenService } from './token.service';

export type EstadoConexion =
  | 'desconectado'
  | 'conectando'
  | 'conectado'
  | 'reintentando'
  | 'sin-conexion'
  | 'rechazado';

/**
 * Real-time chat transport.
 *
 * Wraps the authenticated WebSocket and adds progressive reconnection:
 * exponential backoff (1s, 2s, 4s, 8s, capped at 15s) with a bounded number of
 * attempts, an immediate retry when the browser reports connectivity again, and
 * no duplicated sockets. A rejected connection (4403, not a participant) is
 * never retried, so a user can never keep trying to subscribe to a conversation
 * that is not theirs.
 */
@Injectable({ providedIn: 'root' })
export class ChatSocketService {
  private readonly tokens = inject(TokenService);

  private static readonly MAX_INTENTOS = 5;
  private static readonly ESPERA_MAXIMA_MS = 15000;

  private socket: WebSocket | null = null;
  private conversacionId: number | null = null;
  private intentos = 0;
  private cerradoPorUsuario = false;
  private temporizador?: ReturnType<typeof setTimeout>;

  private readonly mensajesSubject = new Subject<Mensaje>();
  private readonly estado = signal<EstadoConexion>('desconectado');

  readonly mensajes$ = this.mensajesSubject.asObservable();
  readonly estadoConexion = this.estado.asReadonly();

  private readonly alVolverLaConexion = () => {
    // The network came back: retry immediately, resetting the backoff.
    if (this.conversacionId !== null && !this.cerradoPorUsuario) {
      this.intentos = 0;
      this.programarReintento(this.conversacionId, 0);
    }
  };

  conectar(conversacionId: number): void {
    this.cerradoPorUsuario = false;
    this.intentos = 0;
    this.conversacionId = conversacionId;
    window.removeEventListener('online', this.alVolverLaConexion);
    window.addEventListener('online', this.alVolverLaConexion);
    this.abrir(conversacionId);
  }

  enviar(contenido: string): boolean {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ contenido }));
      return true;
    }
    return false;
  }

  cerrar(): void {
    this.cerradoPorUsuario = true;
    window.removeEventListener('online', this.alVolverLaConexion);
    if (this.temporizador) {
      clearTimeout(this.temporizador);
      this.temporizador = undefined;
    }
    this.descartarSocket();
    this.conversacionId = null;
    this.intentos = 0;
    this.estado.set('desconectado');
  }

  private abrir(conversacionId: number): void {
    const token = this.tokens.accessToken;
    if (!token) {
      this.estado.set('sin-conexion');
      return;
    }
    // Never open a second socket for the same conversation.
    if (
      this.socket &&
      (this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    this.estado.set('conectando');
    const socket = new WebSocket(
      `${environment.wsUrl}/ws/chat/${conversacionId}/?token=${encodeURIComponent(token)}`,
    );
    this.socket = socket;

    socket.onopen = () => {
      this.intentos = 0;
      this.estado.set('conectado');
    };

    socket.onmessage = (evento: MessageEvent<string>) => {
      try {
        const data = JSON.parse(evento.data) as { tipo: string; mensaje: Mensaje };
        if (data.tipo === 'mensaje' && data.mensaje) {
          this.mensajesSubject.next(data.mensaje);
        }
      } catch {
        // Ignore malformed frames instead of breaking the conversation.
      }
    };

    socket.onerror = () => {
      // `onclose` always follows; reconnection is handled there.
    };

    socket.onclose = (evento: CloseEvent) => {
      this.descartarSocket();
      if (evento.code === 4403) {
        // Not a participant: retrying would be pointless and unsafe.
        this.estado.set('rechazado');
        return;
      }
      this.programarReintento(conversacionId);
    };
  }

  private programarReintento(conversacionId: number, esperaMs?: number): void {
    if (this.cerradoPorUsuario) {
      return;
    }
    if (this.intentos >= ChatSocketService.MAX_INTENTOS) {
      this.estado.set('sin-conexion');
      return;
    }
    const espera =
      esperaMs ?? Math.min(ChatSocketService.ESPERA_MAXIMA_MS, 1000 * 2 ** this.intentos);
    this.intentos += 1;
    this.estado.set('reintentando');
    this.temporizador = setTimeout(() => {
      this.temporizador = undefined;
      this.abrir(conversacionId);
    }, espera);
  }

  private descartarSocket(): void {
    if (this.socket) {
      this.socket.onopen = null;
      this.socket.onmessage = null;
      this.socket.onerror = null;
      this.socket.onclose = null;
      try {
        this.socket.close();
      } catch {
        // The socket may already be closed.
      }
      this.socket = null;
    }
    this.estado.set('desconectado');
  }
}
