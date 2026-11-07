import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Denuncia, Noticia, Notificacion } from '../../../core/models/api.models';
import { AuthService } from '../../../core/services/auth.service';
import { DenunciaService } from '../../../core/services/denuncia.service';
import { NoticiaService } from '../../../core/services/noticia.service';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { EstadoPipe } from '../../../shared/pipes/labels.pipe';

@Component({
  selector: 'app-usuario-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, EmptyStateComponent, EstadoPipe],
  templateUrl: './usuario-dashboard.component.html',
  styleUrl: './usuario-dashboard.component.scss',
})
export class UsuarioDashboardComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly denunciasService = inject(DenunciaService);
  private readonly notificacionesService = inject(NotificacionService);
  private readonly noticiasService = inject(NoticiaService);

  readonly usuario = this.auth.usuarioActual;
  readonly cargando = signal(true);
  readonly denuncias = signal<Denuncia[]>([]);
  readonly notificaciones = signal<Notificacion[]>([]);
  readonly recomendadas = signal<Noticia[]>([]);

  readonly resumen = computed(() => {
    const lista = this.denuncias();
    return {
      total: lista.length,
      pendientes: lista.filter((d) => d.estado === 'PENDIENTE').length,
      enProceso: lista.filter((d) => d.estado === 'EN_PROCESO').length,
      finalizadas: lista.filter((d) => d.estado === 'FINALIZADA').length,
    };
  });

  ngOnInit(): void {
    this.cargar();
  }

  private cargar(): void {
    this.cargando.set(true);
    this.denunciasService.listarPropias().subscribe({
      next: (lista) => {
        this.denuncias.set(lista);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
    this.notificacionesService.listar().subscribe({
      next: (lista) => this.notificaciones.set(lista),
      error: () => this.notificaciones.set([]),
    });
    this.noticiasService.listar().subscribe({
      next: (lista) => this.recomendadas.set(lista.slice(0, 3)),
      error: () => this.recomendadas.set([]),
    });
  }

  marcarLeida(notificacion: Notificacion): void {
    if (notificacion.leida) {
      return;
    }
    this.notificacionesService.marcarLeida(notificacion.id).subscribe({
      next: (actualizada) =>
        this.notificaciones.update((lista) =>
          lista.map((n) => (n.id === actualizada.id ? actualizada : n)),
        ),
    });
  }

  marcarTodas(): void {
    this.notificacionesService.marcarTodasLeidas().subscribe({
      next: () =>
        this.notificaciones.update((lista) => lista.map((n) => ({ ...n, leida: true }))),
    });
  }
}
