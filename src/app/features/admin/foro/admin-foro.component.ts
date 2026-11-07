import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';

import { PublicacionForo } from '../../../core/models/api.models';
import { ForoService } from '../../../core/services/foro.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-admin-foro',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe],
  templateUrl: './admin-foro.component.html',
  styleUrl: './admin-foro.component.scss',
})
export class AdminForoComponent implements OnInit {
  private readonly foroService = inject(ForoService);
  private readonly notificaciones = inject(NotificationService);

  readonly cargando = signal(true);
  readonly publicaciones = signal<PublicacionForo[]>([]);

  ngOnInit(): void {
    this.cargar();
  }

  eliminar(publicacion: PublicacionForo): void {
    if (!confirm(`¿Eliminar la publicación "${publicacion.titulo}"?`)) {
      return;
    }
    this.foroService.eliminar(publicacion.id).subscribe({
      next: () => {
        this.notificaciones.exito('Publicación eliminada.');
        this.cargar();
      },
    });
  }

  private cargar(): void {
    this.cargando.set(true);
    this.foroService.listar().subscribe({
      next: (lista) => {
        this.publicaciones.set(lista);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }
}
