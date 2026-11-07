import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Conversacion } from '../../core/models/api.models';
import { ChatService } from '../../core/services/chat.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { EstadoPipe, ModalidadPipe } from '../../shared/pipes/labels.pipe';

@Component({
  selector: 'app-chat-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, EmptyStateComponent, EstadoPipe, ModalidadPipe],
  templateUrl: './chat-list.component.html',
  styleUrl: './chat-list.component.scss',
})
export class ChatListComponent implements OnInit {
  private readonly chatService = inject(ChatService);

  readonly cargando = signal(true);
  readonly conversaciones = signal<Conversacion[]>([]);

  ngOnInit(): void {
    this.chatService.listar().subscribe({
      next: (lista) => {
        this.conversaciones.set(lista);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }
}
