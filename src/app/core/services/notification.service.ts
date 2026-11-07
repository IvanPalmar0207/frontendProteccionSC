import { Injectable, signal } from '@angular/core';

export type TipoMensaje = 'exito' | 'error' | 'info';

export interface MensajeApp {
  tipo: TipoMensaje;
  texto: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly mensajes = signal<MensajeApp[]>([]);
  readonly lista = this.mensajes.asReadonly();

  mostrar(texto: string, tipo: TipoMensaje = 'info'): void {
    const mensaje: MensajeApp = { tipo, texto };
    this.mensajes.update((actuales) => [...actuales, mensaje]);
    setTimeout(() => this.cerrar(mensaje), 4500);
  }

  exito(texto: string): void {
    this.mostrar(texto, 'exito');
  }

  error(texto: string): void {
    this.mostrar(texto, 'error');
  }

  cerrar(mensaje: MensajeApp): void {
    this.mensajes.update((actuales) => actuales.filter((m) => m !== mensaje));
  }
}
