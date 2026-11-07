import { DatePipe, SlicePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Noticia } from '../../../core/models/api.models';
import { NoticiaService } from '../../../core/services/noticia.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-noticias-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, SlicePipe, EmptyStateComponent],
  templateUrl: './noticias-list.component.html',
  styleUrl: './noticias-list.component.scss',
})
export class NoticiasListComponent implements OnInit {
  private readonly noticiaService = inject(NoticiaService);

  readonly cargando = signal(true);
  readonly noticias = signal<Noticia[]>([]);

  ngOnInit(): void {
    this.noticiaService.listar().subscribe({
      next: (lista) => {
        this.noticias.set(lista);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }
}
