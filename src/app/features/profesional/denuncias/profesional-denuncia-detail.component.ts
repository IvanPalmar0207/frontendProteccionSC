import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { Denuncia, EstadoDenuncia } from '../../../core/models/api.models';
import { ChatService } from '../../../core/services/chat.service';
import { DenunciaService } from '../../../core/services/denuncia.service';
import { NotificationService } from '../../../core/services/notification.service';
import { EstadoPipe, TipoSituacionPipe } from '../../../shared/pipes/labels.pipe';

@Component({
  selector: 'app-profesional-denuncia-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    DatePipe,
    EstadoPipe,
    TipoSituacionPipe,
  ],
  templateUrl: './profesional-denuncia-detail.component.html',
  styleUrl: './profesional-denuncia-detail.component.scss',
})
export class ProfesionalDenunciaDetailComponent implements OnInit {
  private readonly ruta = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly denunciaService = inject(DenunciaService);
  private readonly chatService = inject(ChatService);
  private readonly notificaciones = inject(NotificationService);

  private id = 0;

  readonly cargando = signal(true);
  readonly denuncia = signal<Denuncia | null>(null);
  readonly procesando = signal(false);

  readonly form = this.fb.nonNullable.group({
    estado: ['PENDIENTE' as EstadoDenuncia, Validators.required],
    observacion: [''],
  });

  ngOnInit(): void {
    this.id = Number(this.ruta.snapshot.paramMap.get('id'));
    this.cargar();
  }

  private cargar(): void {
    this.cargando.set(true);
    this.denunciaService.obtenerProfesional(this.id).subscribe({
      next: (denuncia) => {
        this.denuncia.set(denuncia);
        this.form.patchValue({ estado: denuncia.estado, observacion: '' });
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  asignarme(): void {
    this.procesando.set(true);
    this.denunciaService.asignarme(this.id).subscribe({
      next: (denuncia) => {
        this.denuncia.set(denuncia);
        this.form.patchValue({ estado: denuncia.estado, observacion: '' });
        this.procesando.set(false);
        this.notificaciones.exito('Caso asignado correctamente.');
      },
      error: () => this.procesando.set(false),
    });
  }

  cambiarEstado(): void {
    if (this.form.invalid) {
      return;
    }
    this.procesando.set(true);
    const { estado, observacion } = this.form.getRawValue();
    this.denunciaService.cambiarEstado(this.id, estado, observacion).subscribe({
      next: (denuncia) => {
        this.denuncia.set(denuncia);
        this.form.patchValue({ estado: denuncia.estado, observacion: '' });
        this.procesando.set(false);
        this.notificaciones.exito('Estado actualizado. El usuario verá el seguimiento.');
      },
      error: () => this.procesando.set(false),
    });
  }

  abrirChat(): void {
    this.procesando.set(true);
    this.chatService.abrir(this.id).subscribe({
      next: (conversacion) => {
        this.procesando.set(false);
        this.router.navigate(['/chat', conversacion.id]);
      },
      error: () => this.procesando.set(false),
    });
  }
}
