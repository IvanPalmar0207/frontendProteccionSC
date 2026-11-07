import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';

import { InViewDirective } from '../../../core/animations/in-view.directive';
import { PublicacionForo } from '../../../core/models/api.models';
import { ForoService } from '../../../core/services/foro.service';
import { NotificationService } from '../../../core/services/notification.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { PaginadorComponent } from '../../../shared/components/paginador/paginador.component';

type Orden = 'recientes' | 'respondidas';

@Component({
  selector: 'app-foro-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    FormsModule,
    DatePipe,
    EmptyStateComponent,
    PaginadorComponent,
    InViewDirective,
  ],
  templateUrl: './foro-list.component.html',
  styleUrl: './foro-list.component.scss',
})
export class ForoListComponent implements OnInit, OnDestroy {
  private readonly foroService = inject(ForoService);
  private readonly notificaciones = inject(NotificationService);
  private readonly fb = inject(FormBuilder);
  private readonly busqueda$ = new Subject<string>();
  private readonly suscripciones = new Subscription();

  readonly cargando = signal(true);
  readonly guardando = signal(false);
  readonly formularioAbierto = signal(false);
  readonly publicaciones = signal<PublicacionForo[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = 8;
  readonly orden = signal<Orden>('recientes');

  busqueda = '';

  /** Client-side ordering on top of the paginated page. */
  readonly lista = computed(() => {
    const items = [...this.publicaciones()];
    if (this.orden() === 'respondidas') {
      items.sort((a, b) => b.respuestas_count - a.respuestas_count);
    }
    return items;
  });

  readonly form = this.fb.nonNullable.group({
    titulo: ['', [Validators.required, Validators.minLength(5)]],
    contenido: ['', [Validators.required, Validators.minLength(10)]],
  });

  get titulo() {
    return this.form.controls.titulo;
  }
  get contenido() {
    return this.form.controls.contenido;
  }

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

  cambiarOrden(valor: string): void {
    this.orden.set(valor as Orden);
  }

  cambiarPagina(pagina: number): void {
    this.page.set(pagina);
    this.cargar();
  }

  alternarFormulario(): void {
    this.formularioAbierto.update((v) => !v);
  }

  publicar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.guardando.set(true);
    this.foroService.crear(this.form.getRawValue()).subscribe({
      next: () => {
        this.guardando.set(false);
        this.form.reset({ titulo: '', contenido: '' });
        this.formularioAbierto.set(false);
        this.notificaciones.exito('Publicación creada.');
        this.page.set(1);
        this.cargar();
      },
      error: () => this.guardando.set(false),
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
