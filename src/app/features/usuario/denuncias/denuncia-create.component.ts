import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { Modalidad, TipoSituacion } from '../../../core/models/api.models';
import { DenunciaService } from '../../../core/services/denuncia.service';
import { NotificationService } from '../../../core/services/notification.service';
import { fechaSucesosValidator, hoyIso } from '../../../core/validators/fecha-sucesos';

@Component({
  selector: 'app-denuncia-create',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './denuncia-create.component.html',
  styleUrl: './denuncia-create.component.scss',
})
export class DenunciaCreateComponent {
  private readonly fb = inject(FormBuilder);
  private readonly denunciaService = inject(DenunciaService);
  private readonly router = inject(Router);
  private readonly notificaciones = inject(NotificationService);

  readonly enviando = signal(false);
  /** Today: the maximum selectable date for the events. */
  readonly hoy = hoyIso();

  readonly tipos: { valor: TipoSituacion; etiqueta: string }[] = [
    { valor: 'VIOLENCIA_INTRAFAMILIAR', etiqueta: 'Violencia intrafamiliar' },
    { valor: 'ABUSO', etiqueta: 'Abuso' },
    { valor: 'ACOSO', etiqueta: 'Acoso' },
    { valor: 'OTRO', etiqueta: 'Otro' },
  ];

  readonly form = this.fb.nonNullable.group({
    modalidad: ['PUBLICA' as Modalidad, Validators.required],
    tipo_situacion: ['OTRO' as TipoSituacion, Validators.required],
    descripcion: ['', [Validators.required, Validators.minLength(10)]],
    ubicacion: [''],
    fecha_hechos: ['', [fechaSucesosValidator()]],
  });

  get modalidad() {
    return this.form.controls.modalidad;
  }
  get descripcion() {
    return this.form.controls.descripcion;
  }
  get fechaHechos() {
    return this.form.controls.fecha_hechos;
  }

  seleccionarModalidad(modalidad: Modalidad): void {
    this.form.controls.modalidad.setValue(modalidad);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    const datos = this.form.getRawValue();
    this.denunciaService
      .crear({
        modalidad: datos.modalidad,
        tipo_situacion: datos.tipo_situacion,
        descripcion: datos.descripcion,
        ubicacion: datos.ubicacion,
        fecha_hechos: datos.fecha_hechos || null,
      })
      .subscribe({
        next: (respuesta) => {
          this.enviando.set(false);
          this.notificaciones.exito(respuesta.detail);
          this.router.navigate(['/usuario/denuncias', respuesta.denuncia.id]);
        },
        error: () => this.enviando.set(false),
      });
  }
}
