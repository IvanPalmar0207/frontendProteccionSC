import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { Denuncia } from '../../../core/models/api.models';
import { ChatService } from '../../../core/services/chat.service';
import { DenunciaService } from '../../../core/services/denuncia.service';
import { EstadoPipe, ModalidadPipe, TipoSituacionPipe } from '../../../shared/pipes/labels.pipe';

@Component({
  selector: 'app-denuncia-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, EstadoPipe, ModalidadPipe, TipoSituacionPipe],
  templateUrl: './denuncia-detail.component.html',
  styleUrl: './denuncia-detail.component.scss',
})
export class DenunciaDetailComponent implements OnInit {
  private readonly ruta = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly denunciaService = inject(DenunciaService);
  private readonly chatService = inject(ChatService);

  readonly cargando = signal(true);
  readonly denuncia = signal<Denuncia | null>(null);
  readonly abriendoChat = signal(false);

  ngOnInit(): void {
    const id = Number(this.ruta.snapshot.paramMap.get('id'));
    this.denunciaService.obtenerPropia(id).subscribe({
      next: (denuncia) => {
        this.denuncia.set(denuncia);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  abrirChat(): void {
    const denuncia = this.denuncia();
    if (!denuncia) {
      return;
    }
    this.abriendoChat.set(true);
    this.chatService.abrir(denuncia.id).subscribe({
      next: (conversacion) => {
        this.abriendoChat.set(false);
        this.router.navigate(['/chat', conversacion.id]);
      },
      error: () => this.abriendoChat.set(false),
    });
  }
}
