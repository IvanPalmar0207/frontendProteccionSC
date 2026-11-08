import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, catchError, debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs';

import { CategoriaNoticia, Noticia } from '../../../core/models/api.models';
import { NoticiaService } from '../../../core/services/noticia.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ImageUploaderComponent } from '../../../shared/components/image-uploader/image-uploader.component';
import { PaginadorComponent } from '../../../shared/components/paginador/paginador.component';

@Component({
  selector: 'app-admin-noticias',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, FormsModule, DatePipe, ImageUploaderComponent, PaginadorComponent],
  templateUrl: './admin-noticias.component.html',
  styleUrl: './admin-noticias.component.scss',
})
export class AdminNoticiasComponent implements OnInit {
  private readonly noticiaService = inject(NoticiaService);
  private readonly notificaciones = inject(NotificationService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  private readonly busqueda$ = new Subject<string>();
  /** Any filter/page change re-queries; switchMap cancels the previous request. */
  private readonly recargar$ = new Subject<void>();

  readonly cargando = signal(true);
  /** True while any list request is in flight; never hides existing rows. */
  readonly actualizando = signal(false);
  readonly guardando = signal(false);
  readonly noticias = signal<Noticia[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = 10;
  readonly editandoId = signal<number | null>(null);
  readonly imagenActual = signal<string | null>(null);
  /** undefined = untouched, null = cleared, File = replacement. */
  readonly imagenSeleccionada = signal<File | null | undefined>(undefined);
  /** Publication-state filter: null = all, true = published, false = drafts. */
  readonly estado = signal<boolean | null>(null);

  busqueda = '';

  readonly categorias: { valor: CategoriaNoticia; etiqueta: string }[] = [
    { valor: 'PREVENCION', etiqueta: 'Prevención' },
    { valor: 'ACOMPANAMIENTO', etiqueta: 'Acompañamiento' },
    { valor: 'DERECHOS', etiqueta: 'Derechos y rutas' },
    { valor: 'COMUNIDAD', etiqueta: 'Comunidad' },
    { valor: 'INSTITUCIONAL', etiqueta: 'Institucional' },
  ];

  readonly form = this.fb.nonNullable.group({
    titulo: ['', Validators.required],
    resumen: [''],
    contenido: ['', Validators.required],
    categoria: ['INSTITUCIONAL' as CategoriaNoticia, Validators.required],
    destacada: [false],
    publicado: [true],
  });

  get titulo() {
    return this.form.controls.titulo;
  }
  get contenido() {
    return this.form.controls.contenido;
  }

  ngOnInit(): void {
    // A text search needs at least two characters and ~400 ms of inactivity;
    // switchMap guarantees a slow earlier response can never overwrite a newer
    // one, and a single character never issues a search request.
    this.busqueda$
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((valor) => {
        if (valor.trim().length === 1) {
          return;
        }
        this.page.set(1);
        this.cargar();
      });

    this.recargar$
      .pipe(
        switchMap(() => {
          this.actualizando.set(true);
          return this.noticiaService.listarPagina(this.page(), this.busqueda, this.estado()).pipe(
            // Keep the reactive stream alive after an HTTP error.
            catchError(() => {
              this.actualizando.set(false);
              this.cargando.set(false);
              return of(null);
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((pagina) => {
        this.actualizando.set(false);
        this.cargando.set(false);
        if (pagina) {
          this.noticias.set(pagina.results);
          this.total.set(pagina.count);
        }
      });

    this.cargar();
  }

  onBuscar(valor: string): void {
    this.busqueda = valor;
    this.busqueda$.next(valor);
  }

  cambiarEstado(valor: string): void {
    this.estado.set(valor === '' ? null : valor === 'true');
    this.page.set(1);
    this.cargar();
  }

  cambiarPagina(pagina: number): void {
    this.page.set(pagina);
    this.cargar();
  }

  editar(noticia: Noticia): void {
    this.editandoId.set(noticia.id);
    this.imagenActual.set(noticia.imagen);
    this.imagenSeleccionada.set(undefined);
    this.form.patchValue({
      titulo: noticia.titulo,
      resumen: noticia.resumen,
      contenido: noticia.contenido,
      categoria: noticia.categoria,
      destacada: noticia.destacada,
      publicado: noticia.publicado,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelar(): void {
    this.editandoId.set(null);
    this.imagenActual.set(null);
    this.imagenSeleccionada.set(undefined);
    this.form.reset({
      titulo: '',
      resumen: '',
      contenido: '',
      categoria: 'INSTITUCIONAL',
      destacada: false,
      publicado: true,
    });
  }

  onImagenCambiada(archivo: File | null): void {
    this.imagenSeleccionada.set(archivo);
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.guardando.set(true);
    const datos = this.form.getRawValue();
    const payload = { ...datos, imagen: this.imagenSeleccionada() };
    const id = this.editandoId();

    const peticion$ = id
      ? this.noticiaService.actualizar(id, payload)
      : this.noticiaService.crear(payload);

    peticion$.subscribe({
      next: () => {
        this.guardando.set(false);
        this.cancelar();
        this.notificaciones.exito(id ? 'Noticia actualizada.' : 'Noticia creada.');
        this.cargar();
      },
      error: () => this.guardando.set(false),
    });
  }

  eliminar(noticia: Noticia): void {
    if (!confirm(`¿Eliminar la noticia "${noticia.titulo}"?`)) {
      return;
    }
    this.noticiaService.eliminar(noticia.id).subscribe({
      next: () => {
        this.notificaciones.exito('Noticia eliminada.');
        this.cargar();
      },
    });
  }

  private cargar(): void {
    this.recargar$.next();
  }
}
