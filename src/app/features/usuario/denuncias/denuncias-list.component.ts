import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Denuncia } from '../../../core/models/api.models';
import { DenunciaService } from '../../../core/services/denuncia.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { EstadoPipe, ModalidadPipe, TipoSituacionPipe } from '../../../shared/pipes/labels.pipe';

@Component({
  selector: 'app-denuncias-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, EmptyStateComponent, EstadoPipe, ModalidadPipe, TipoSituacionPipe],
  templateUrl: './denuncias-list.component.html',
  styleUrl: './denuncias-list.component.scss',
})
export class DenunciasListComponent implements OnInit {
  private readonly denunciaService = inject(DenunciaService);

  readonly cargando = signal(true);
  readonly denuncias = signal<Denuncia[]>([]);

  ngOnInit(): void {
    this.denunciaService.listarPropias().subscribe({
      next: (lista) => {
        this.denuncias.set(lista);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  claseEstado(estado: string): string {
    switch (estado) {
      case 'PENDIENTE':
        return 'badge badge--danger';
      case 'EN_PROCESO':
        return 'badge badge--warn';
      default:
        return 'badge badge--ok';
    }
  }
}
