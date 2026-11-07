import { DatePipe, SlicePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { PublicacionForo } from '../../../core/models/api.models';
import { ForoService } from '../../../core/services/foro.service';
import { NotificationService } from '../../../core/services/notification.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-foro-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ReactiveFormsModule, DatePipe, SlicePipe, EmptyStateComponent],
  templateUrl: './foro-list.component.html',
  styleUrl: './foro-list.component.scss',
})
export class ForoListComponent implements OnInit {
  private readonly foroService = inject(ForoService);
  private readonly notificaciones = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  readonly cargando = signal(true);
  readonly guardando = signal(false);
  readonly publicaciones = signal<PublicacionForo[]>([]);

  readonly form = this.fb.nonNullable.group({
    titulo: ['', Validators.required],
    contenido: ['', Validators.required],
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
        this.notificaciones.exito('Publicación creada.');
        this.cargar();
      },
      error: () => this.guardando.set(false),
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
