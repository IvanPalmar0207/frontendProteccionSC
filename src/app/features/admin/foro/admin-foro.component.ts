import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

import { PublicacionForo } from '../../../core/models/api.models';
import { ForoService } from '../../../core/services/foro.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PaginadorComponent } from '../../../shared/components/paginador/paginador.component';

@Component({
  selector: 'app-admin-foro',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, FormsModule, ReactiveFormsModule, PaginadorComponent],
  templateUrl: './admin-foro.component.html',
  styleUrl: './admin-foro.component.scss',
})
export class AdminForoComponent implements OnInit {
  private readonly foroService = inject(ForoService);
  private readonly notificaciones = inject(NotificationService);
  private readonly fb = inject(FormBuilder);
  private readonly busqueda$ = new Subject<string>();

  readonly cargando = signal(true);
  readonly guardando = signal(false);
  readonly publicaciones = signal<PublicacionForo[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = 10;
  readonly editandoId = signal<number | null>(null);

  busqueda = '';

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

  editar(publicacion: PublicacionForo): void {
    this.editandoId.set(publicacion.id);
    this.form.patchValue({ titulo: publicacion.titulo, contenido: publicacion.contenido });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelar(): void {
    this.editandoId.set(null);
    this.form.reset({ titulo: '', contenido: '' });
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.guardando.set(true);
    const datos = this.form.getRawValue();
    const id = this.editandoId();
    const peticion$ = id
      ? this.foroService.actualizar(id, datos)
      : this.foroService.crear(datos);

    peticion$.subscribe({
      next: () => {
        this.guardando.set(false);
        this.cancelar();
        this.notificaciones.exito(id ? 'Publicación actualizada.' : 'Publicación creada.');
        this.cargar();
      },
      error: () => this.guardando.set(false),
    });
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
