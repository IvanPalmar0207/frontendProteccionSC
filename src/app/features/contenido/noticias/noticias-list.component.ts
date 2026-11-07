import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';

import { InViewDirective } from '../../../core/animations/in-view.directive';
import { CategoriaNoticia, Noticia } from '../../../core/models/api.models';
import { NoticiaService } from '../../../core/services/noticia.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { PaginadorComponent } from '../../../shared/components/paginador/paginador.component';

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
  imports: [RouterLink, DatePipe, FormsModule, EmptyStateComponent, PaginadorComponent, InViewDirective],
  templateUrl: './noticias-list.component.html',
  styleUrl: './noticias-list.component.scss',
})
export class NoticiasListComponent implements OnInit, OnDestroy {
  private readonly noticiaService = inject(NoticiaService);
  private readonly busqueda$ = new Subject<string>();
  private readonly suscripciones = new Subscription();

  readonly cargando = signal(true);
  readonly noticias = signal<Noticia[]>([]);
  readonly destacada = signal<Noticia | null>(null);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = 9;
  readonly categoriaActiva = signal<CategoriaNoticia | ''>('');
  readonly categorias = CATEGORIAS;

  busqueda = '';

  /** Everything except the featured article. */
  readonly secundarias = computed(() =>
    this.destacada() ? this.noticias().slice(1) : this.noticias(),
  );

  ngOnInit(): void {
    this.cargar();
    this.suscripciones.add(
      this.busqueda$
        .pipe(debounceTime(350), distinctUntilChanged())
        .subscribe(() => {
          this.page.set(1);
          this.cargar();
        }),
    );
  }

  ngOnDestroy(): void {
    this.suscripciones.unsubscribe();
  }

  onBuscar(valor: string): void {
    this.busqueda = valor;
    this.busqueda$.next(valor);
  }

  filtrar(categoria: CategoriaNoticia | ''): void {
    this.categoriaActiva.set(categoria);
    this.page.set(1);
    this.cargar();
  }

  cambiarPagina(pagina: number): void {
    this.page.set(pagina);
    this.cargar();
  }

  limpiar(): void {
    this.busqueda = '';
    this.categoriaActiva.set('');
    this.page.set(1);
    this.cargar();
  }

  private cargar(): void {
    this.cargando.set(true);
    this.noticiaService
      .listarPublico({
        page: this.page(),
        search: this.busqueda,
        categoria: this.categoriaActiva() || undefined,
      })
      .subscribe({
        next: (pagina) => {
          const primera = this.page() === 1 && !this.busqueda && !this.categoriaActiva();
          this.destacada.set(primera ? (pagina.results[0] ?? null) : null);
          this.noticias.set(pagina.results);
          this.total.set(pagina.count);
          this.cargando.set(false);
        },
        error: () => this.cargando.set(false),
      });
  }
}
