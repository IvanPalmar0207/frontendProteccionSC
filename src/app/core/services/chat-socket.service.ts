import { Injectable, inject, signal } from '@angular/core';
import { Observable, Subject } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Mensaje } from '../models/api.models';
import { TokenService } from './token.service';

export type EstadoConexion = 'desconectado' | 'conectando' | 'conectado';

/**
 * Real-time chat transport. Wraps the authenticated WebSocket
 * (`/ws/chat/{id}/?token=<access>`), exposes the connection state so the UI can
 * show it, and retries once on an unexpected close. Sending is also persisted
 * through the REST endpoint so this service is never the only source of truth.
 */
@Injectable({ providedIn: 'root' })
export class ChatSocketService {
  private readonly tokens = inject(TokenService);

  private socket: WebSocket | null = null;
  private conversacionId: number | null = null;
  private reintentos = 0;
  private readonly mensajesSubject = new Subject<Mensaje>();
  private readonly estado = signal<EstadoConexion>('desconectado');

  readonly mensajes$ = this.mensajesSubject.asObservable();
  readonly estadoConexion = this.estado.asReadonly();

  conectar(conversacionId: number): void {
    const token = this.tokens.accessToken;
    if (!token) {
      return;
    }
    this.cerrar();
    this.conversacionId = conversacionId;
    this.estado.set('conectando');

    const socket = new WebSocket(
      `${environment.wsUrl}/ws/chat/${conversacionId}/?token=${encodeURIComponent(token)}`,
    );
    this.socket = socket;

    socket.onopen = () => {
      this.reintentos = 0;
      this.estado.set('conectado');
    };

    socket.onmessage = (evento: MessageEvent<string>) => {
      try {
        const data = JSON.parse(evento.data) as { tipo: string; mensaje: Mensaje };
        if (data.tipo === 'mensaje') {
          this.mensajesSubject.next(data.mensaje);
        }
      } catch {
        // Ignore malformed frames instead of breaking the conversation.
      }
    };

    socket.onclose = (evento: CloseEvent) => {
      this.estado.set('desconectado');
      const sesionValida = evento.code !== 4403;
      if (sesionValida && this.reintentos === 0 && this.conversacionId === conversacionId) {
        this.reintentos += 1;
        setTimeout(() => this.conectar(conversacionId), 1500);
      }
    };

    socket.onerror = () => this.estado.set('desconectado');
  }

  enviar(contenido: string): boolean {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ contenido }));
      return true;
    }
    return false;
  }

  cerrar(): void {
    if (this.socket) {
      this.socket.onclose = null;
      this.socket.onmessage = null;
      this.socket.close();
      this.socket = null;
    }
    this.conversacionId = null;
    this.reintentos = 0;
    this.estado.set('desconectado');
  }
}
