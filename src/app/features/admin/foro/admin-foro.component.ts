import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

import { PublicacionForo } from '../../../core/models/api.models';
import { ForoService } from '../../../core/services/foro.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PaginadorComponent } from '../../../shared/components/paginador/paginador.component';

@Component({
  selector: 'app-admin-foro',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, FormsModule, PaginadorComponent],
  templateUrl: './admin-foro.component.html',
  styleUrl: './admin-foro.component.scss',
})
export class AdminForoComponent implements OnInit {
  private readonly foroService = inject(ForoService);
  private readonly notificaciones = inject(NotificationService);
  private readonly busqueda$ = new Subject<string>();

  readonly cargando = signal(true);
  readonly publicaciones = signal<PublicacionForo[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = 10;

  busqueda = '';

  ngOnInit(): void {
    this.cargar();
    this.busqueda$
      .pipe(debounceTime(350), distinctUntilChanged())
      .subscribe(() => {
        this.page.set(1);
        this.cargar();
      });
  }

  onBuscar(valor: string): void {
    this.busqueda = valor;
    this.busqueda$.next(valor);
  }

  cambiarPagina(pagina: number): void {
    this.page.set(pagina);
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
    this.foroService.listarPagina(this.page(), this.busqueda).subscribe({
      next: (pagina) => {
        this.publicaciones.set(pagina.results);
        this.total.set(pagina.count);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }
}
