import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';

import { Notificacion } from '../../core/models/api.models';
import { NotificacionService } from '../../core/services/notificacion.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

/**
 * Notifications list shared by every role. The backend already scopes the
 * queryset to the authenticated user, so the component never filters by owner.
 */
@Component({
  selector: 'app-notificaciones',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, EmptyStateComponent],
  templateUrl: './notificaciones.component.html',
  styleUrl: './notificaciones.component.scss',
})
export class NotificacionesComponent implements OnInit {
  private readonly notificacionesService = inject(NotificacionService);

  readonly notificaciones = signal<Notificacion[]>([]);
  readonly cargando = signal(true);

  ngOnInit(): void {
    this.notificacionesService.listar().subscribe({
      next: (lista) => {
        this.notificaciones.set(lista);
        this.cargando.set(false);
      },
      error: () => {
        this.notificaciones.set([]);
        this.cargando.set(false);
      },
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
