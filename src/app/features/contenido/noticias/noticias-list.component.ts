import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CategoriaNoticia, Noticia } from '../../../core/models/api.models';
import { NoticiaService } from '../../../core/services/noticia.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

const CATEGORIAS: { valor: CategoriaNoticia | ''; etiqueta: string }[] = [
  { valor: '', etiqueta: 'Todas' },
  { valor: 'PREVENCION', etiqueta: 'Prevención' },
  { valor: 'ACOMPANAMIENTO', etiqueta: 'Acompañamiento' },
  { valor: 'DERECHOS', etiqueta: 'Derechos y rutas' },
  { valor: 'COMUNIDAD', etiqueta: 'Comunidad' },
  { valor: 'INSTITUCIONAL', etiqueta: 'Institucional' },
];

@Component({
  selector: 'app-noticias-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, EmptyStateComponent],
  templateUrl: './noticias-list.component.html',
  styleUrl: './noticias-list.component.scss',
})
export class NoticiasListComponent implements OnInit {
  private readonly noticiaService = inject(NoticiaService);

  readonly cargando = signal(true);
  readonly noticias = signal<Noticia[]>([]);
  readonly categoriaActiva = signal<CategoriaNoticia | ''>('');
  readonly categorias = CATEGORIAS;

  ngOnInit(): void {
    this.cargar();
  }

  filtrar(categoria: CategoriaNoticia | ''): void {
    this.categoriaActiva.set(categoria);
    this.cargar();
  }

  private cargar(): void {
    this.cargando.set(true);
    this.noticiaService.listar(this.categoriaActiva() || undefined).subscribe({
      next: (lista) => {
        this.noticias.set(lista);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }
}
