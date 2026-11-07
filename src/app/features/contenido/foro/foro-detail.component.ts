import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { InViewDirective } from '../../../core/animations/in-view.directive';
import { PublicacionForo } from '../../../core/models/api.models';
import { AuthService } from '../../../core/services/auth.service';
import { ForoService } from '../../../core/services/foro.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-foro-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ReactiveFormsModule, DatePipe, InViewDirective],
  templateUrl: './foro-detail.component.html',
  styleUrl: './foro-detail.component.scss',
})
export class ForoDetailComponent implements OnInit {
  private readonly ruta = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly foroService = inject(ForoService);
  private readonly notificaciones = inject(NotificationService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  private id = 0;

  readonly cargando = signal(true);
  readonly publicando = signal(false);
  readonly publicacion = signal<PublicacionForo | null>(null);
  readonly usuario = this.auth.usuarioActual;

  readonly form = this.fb.nonNullable.group({
    contenido: ['', [Validators.required, Validators.minLength(2)]],
  });

  get contenido() {
    return this.form.controls.contenido;
  }

  ngOnInit(): void {
    this.id = Number(this.ruta.snapshot.paramMap.get('id'));
    this.cargar();
  }

  responder(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.publicando.set(true);
    this.foroService.responder(this.id, this.form.getRawValue().contenido).subscribe({
      next: () => {
        this.publicando.set(false);
        this.form.reset({ contenido: '' });
        this.notificaciones.exito('Respuesta publicada.');
        this.cargar();
      },
      error: () => this.publicando.set(false),
    });
  }

  eliminarRespuesta(respuestaId: number): void {
    if (!confirm('¿Eliminar esta respuesta?')) {
      return;
    }
    this.foroService.eliminarRespuesta(respuestaId).subscribe({
      next: () => {
        this.notificaciones.exito('Respuesta eliminada.');
        this.cargar();
      },
    });
  }

  eliminarPublicacion(): void {
    if (!confirm('¿Eliminar esta publicación?')) {
      return;
    }
    this.foroService.eliminar(this.id).subscribe({
      next: () => {
        this.notificaciones.exito('Publicación eliminada.');
        this.router.navigate(['/foro']);
      },
    });
  }

  esAutor(nombreAutor: string): boolean {
    return this.usuario()?.nombre_completo === nombreAutor;
  }

  private cargar(): void {
    this.cargando.set(true);
    this.foroService.obtener(this.id).subscribe({
      next: (publicacion) => {
        this.publicacion.set(publicacion);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }
}
