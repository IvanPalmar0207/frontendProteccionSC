import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { Conversacion, Mensaje } from '../../core/models/api.models';
import { AuthService } from '../../core/services/auth.service';
import { ChatSocketService } from '../../core/services/chat-socket.service';
import { ChatService } from '../../core/services/chat.service';
import { EstadoPipe, ModalidadPipe } from '../../shared/pipes/labels.pipe';

@Component({
  selector: 'app-chat-room',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ReactiveFormsModule, DatePipe, EstadoPipe, ModalidadPipe],
  templateUrl: './chat-room.component.html',
  styleUrl: './chat-room.component.scss',
})
export class ChatRoomComponent implements OnInit, OnDestroy {
  private readonly ruta = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly chatService = inject(ChatService);
  private readonly socket = inject(ChatSocketService);
  private readonly auth = inject(AuthService);

  private suscripcion?: Subscription;
  private id = 0;
  private primeraConexion = true;

  readonly cargando = signal(true);
  readonly conversacion = signal<Conversacion | null>(null);
  readonly mensajes = signal<Mensaje[]>([]);
  readonly enviando = signal(false);
  readonly usuarioId = this.auth.usuarioActual;
  readonly estadoConexion = this.socket.estadoConexion;
  /** A finished report keeps its history readable but accepts no new messages. */
  readonly bloqueada = computed(() => this.conversacion()?.denuncia.estado === 'FINALIZADA');

  constructor() {
    // On reconnect, recover any messages sent while the socket was down.
    effect(() => {
      if (this.socket.estadoConexion() !== 'conectado') {
        return;
      }
      if (this.primeraConexion) {
        this.primeraConexion = false;
      } else if (this.conversacion()) {
        this.cargarHistorial();
      }
    });
  }

  readonly form = this.fb.nonNullable.group({
    contenido: ['', Validators.required],
  });

  get contenido() {
    return this.form.controls.contenido;
  }

  ngOnInit(): void {
    this.id = Number(this.ruta.snapshot.paramMap.get('id'));

    this.chatService.obtener(this.id).subscribe({
      next: (conversacion) => {
        this.conversacion.set(conversacion);
        this.cargarHistorial();
      },
      error: () => this.cargando.set(false),
    });

    this.socket.conectar(this.id);
    this.suscripcion = this.socket.mensajes$.subscribe((mensaje) => this.agregar(mensaje));
  }

  ngOnDestroy(): void {
    this.suscripcion?.unsubscribe();
    this.socket.cerrar();
  }

  enviar(): void {
    if (this.bloqueada()) {
      return;
    }
    const texto = (this.form.getRawValue().contenido || '').trim();
    if (!texto) {
      return;
    }
    this.enviando.set(true);
    this.form.reset({ contenido: '' });

    // Prefer the authenticated WebSocket so the message is delivered in real
    // time; the consumer persists it. Fall back to REST when offline.
    if (this.socket.enviar(texto)) {
      this.enviando.set(false);
      return;
    }
    this.chatService.enviar(this.id, texto).subscribe({
      next: (mensaje) => {
        this.agregar(mensaje);
        this.enviando.set(false);
      },
      error: () => this.enviando.set(false),
    });
  }

  esPropio(mensaje: Mensaje): boolean {
    return mensaje.remitente.id === this.usuarioId()?.id;
  }

  private cargarHistorial(): void {
    this.chatService.historial(this.id).subscribe({
      next: (mensajes) => {
        this.mensajes.set(mensajes);
        this.cargando.set(false);
        this.chatService.marcarLeidos(this.id).subscribe();
      },
      error: () => this.cargando.set(false),
    });
  }

  private agregar(mensaje: Mensaje): void {
    // Deduplicate: REST persistence also broadcasts through the socket.
    if (this.mensajes().some((existente) => existente.id === mensaje.id)) {
      return;
    }
    this.mensajes.update((lista) => [...lista, mensaje]);
  }
}
