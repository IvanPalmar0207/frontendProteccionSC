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

import { PlataformaPodcast, Podcast } from '../../../core/models/api.models';
import { NotificationService } from '../../../core/services/notification.service';
import { PodcastService } from '../../../core/services/podcast.service';
import { ImageUploaderComponent } from '../../../shared/components/image-uploader/image-uploader.component';
import { PaginadorComponent } from '../../../shared/components/paginador/paginador.component';

@Component({
  selector: 'app-admin-podcasts',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, FormsModule, DatePipe, ImageUploaderComponent, PaginadorComponent],
  templateUrl: './admin-podcasts.component.html',
  styleUrl: './admin-podcasts.component.scss',
})
export class AdminPodcastsComponent implements OnInit {
  private readonly podcastService = inject(PodcastService);
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
  readonly podcasts = signal<Podcast[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = 10;
  readonly editandoId = signal<number | null>(null);
  readonly portadaActual = signal<string | null>(null);
  /** undefined = untouched, null = cleared, File = replacement. */
  readonly portadaSeleccionada = signal<File | null | undefined>(undefined);
  /** Publication-state filter: null = all, true = published, false = drafts. */
  readonly estado = signal<boolean | null>(null);

  busqueda = '';

  readonly plataformas: { valor: PlataformaPodcast; etiqueta: string }[] = [
    { valor: 'SPOTIFY', etiqueta: 'Spotify' },
    { valor: 'YOUTUBE', etiqueta: 'YouTube' },
    { valor: 'APPLE_PODCASTS', etiqueta: 'Apple Podcasts' },
    { valor: 'OTRA', etiqueta: 'Otra' },
  ];

  readonly form = this.fb.nonNullable.group({
    titulo: ['', Validators.required],
    descripcion: [''],
    programa: [''],
    plataforma: ['OTRA' as PlataformaPodcast, Validators.required],
    enlace: ['', [Validators.required, Validators.pattern(/^https:\/\/.+/)]],
    publicado: [true],
  });

  get titulo() {
    return this.form.controls.titulo;
  }
  get enlace() {
    return this.form.controls.enlace;
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
          return this.podcastService.listarPagina(this.page(), this.busqueda, this.estado()).pipe(
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
          this.podcasts.set(pagina.results);
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

  editar(podcast: Podcast): void {
    this.editandoId.set(podcast.id);
    this.portadaActual.set(podcast.portada);
    this.portadaSeleccionada.set(undefined);
    this.form.patchValue({
      titulo: podcast.titulo,
      descripcion: podcast.descripcion,
      programa: podcast.programa,
      plataforma: podcast.plataforma,
      enlace: podcast.enlace,
      publicado: podcast.publicado,
    });
  }

  cancelar(): void {
    this.editandoId.set(null);
    this.portadaActual.set(null);
    this.portadaSeleccionada.set(undefined);
    this.form.reset({
      titulo: '',
      descripcion: '',
      programa: '',
      plataforma: 'OTRA',
      enlace: '',
      publicado: true,
    });
  }

  onPortadaCambiada(archivo: File | null): void {
    this.portadaSeleccionada.set(archivo);
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.guardando.set(true);
    const datos = this.form.getRawValue();
    const payload = { ...datos, portada: this.portadaSeleccionada() };
    const id = this.editandoId();

    const peticion$ = id
      ? this.podcastService.actualizar(id, payload)
      : this.podcastService.crear(payload);

    peticion$.subscribe({
      next: () => {
        this.guardando.set(false);
        this.cancelar();
        this.notificaciones.exito(id ? 'Episodio actualizado.' : 'Episodio creado.');
        this.cargar();
      },
      error: () => this.guardando.set(false),
    });
  }

  eliminar(podcast: Podcast): void {
    if (!confirm(`¿Eliminar el episodio "${podcast.titulo}"?`)) {
      return;
    }
    this.podcastService.eliminar(podcast.id).subscribe({
      next: () => {
        this.notificaciones.exito('Episodio eliminado.');
        this.cargar();
      },
    });
  }

  private cargar(): void {
    this.recargar$.next();
  }
}
