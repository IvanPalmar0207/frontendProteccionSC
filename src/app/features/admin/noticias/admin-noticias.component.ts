import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { CategoriaNoticia, Noticia } from '../../../core/models/api.models';
import { NoticiaService } from '../../../core/services/noticia.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ImageUploaderComponent } from '../../../shared/components/image-uploader/image-uploader.component';

@Component({
  selector: 'app-admin-noticias',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, DatePipe, ImageUploaderComponent],
  templateUrl: './admin-noticias.component.html',
  styleUrl: './admin-noticias.component.scss',
})
export class AdminNoticiasComponent implements OnInit {
  private readonly noticiaService = inject(NoticiaService);
  private readonly notificaciones = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  readonly cargando = signal(true);
  readonly guardando = signal(false);
  readonly noticias = signal<Noticia[]>([]);
  readonly editandoId = signal<number | null>(null);
  readonly imagenActual = signal<string | null>(null);
  /** undefined = untouched, null = cleared, File = replacement. */
  readonly imagenSeleccionada = signal<File | null | undefined>(undefined);

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
    this.cargando.set(true);
    this.noticiaService.listar().subscribe({
      next: (lista) => {
        this.noticias.set(lista);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }
}
