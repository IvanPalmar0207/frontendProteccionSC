import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Podcast } from '../../../core/models/api.models';
import { NotificationService } from '../../../core/services/notification.service';
import { PodcastService } from '../../../core/services/podcast.service';

@Component({
  selector: 'app-admin-podcasts',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './admin-podcasts.component.html',
  styleUrl: './admin-podcasts.component.scss',
})
export class AdminPodcastsComponent implements OnInit {
  private readonly podcastService = inject(PodcastService);
  private readonly notificaciones = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  readonly cargando = signal(true);
  readonly guardando = signal(false);
  readonly podcasts = signal<Podcast[]>([]);
  readonly editandoId = signal<number | null>(null);

  readonly form = this.fb.nonNullable.group({
    titulo: ['', Validators.required],
    descripcion: [''],
    audio_url: [''],
    duracion_segundos: [null as number | null],
    publicado: [true],
  });

  get titulo() {
    return this.form.controls.titulo;
  }

  ngOnInit(): void {
    this.cargar();
  }

  editar(podcast: Podcast): void {
    this.editandoId.set(podcast.id);
    this.form.patchValue({
      titulo: podcast.titulo,
      descripcion: podcast.descripcion,
      audio_url: podcast.audio_url,
      duracion_segundos: podcast.duracion_segundos,
      publicado: podcast.publicado,
    });
  }

  cancelar(): void {
    this.editandoId.set(null);
    this.form.reset({
      titulo: '',
      descripcion: '',
      audio_url: '',
      duracion_segundos: null,
      publicado: true,
    });
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.guardando.set(true);
    const payload = this.form.getRawValue();
    const id = this.editandoId();

    const peticion$ = id
      ? this.podcastService.actualizar(id, payload)
      : this.podcastService.crear(payload);

    peticion$.subscribe({
      next: () => {
        this.guardando.set(false);
        this.cancelar();
        this.notificaciones.exito(id ? 'Pódcast actualizado.' : 'Pódcast creado.');
        this.cargar();
      },
      error: () => this.guardando.set(false),
    });
  }

  eliminar(podcast: Podcast): void {
    if (!confirm(`¿Eliminar el pódcast "${podcast.titulo}"?`)) {
      return;
    }
    this.podcastService.eliminar(podcast.id).subscribe({
      next: () => {
        this.notificaciones.exito('Pódcast eliminado.');
        this.cargar();
      },
    });
  }

  private cargar(): void {
    this.cargando.set(true);
    this.podcastService.listar().subscribe({
      next: (lista) => {
        this.podcasts.set(lista);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }
}
