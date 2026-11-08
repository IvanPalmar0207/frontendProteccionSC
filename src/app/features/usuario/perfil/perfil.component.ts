import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { SoloDigitosDirective } from '../../../core/directives/solo-digitos.directive';
import { AuthService } from '../../../core/services/auth.service';
import {
  edadMinimaValidator,
  fechaMaximaNacimiento,
} from '../../../core/validators/fecha-nacimiento';
import { TELEFONO_PATTERN } from '../../../core/validators/telefono';
import { NotificationService } from '../../../core/services/notification.service';
import { PerfilService } from '../../../core/services/perfil.service';

@Component({
  selector: 'app-perfil',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, SoloDigitosDirective],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.scss',
})
export class PerfilComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly perfilService = inject(PerfilService);
  private readonly auth = inject(AuthService);
  private readonly notificaciones = inject(NotificationService);

  readonly cargando = signal(true);
  readonly guardando = signal(false);
  readonly email = signal('');
  /** Identity fields: shown but never editable (immutable per business rule). */
  readonly documento = signal('');
  /** Upper bound for the date picker: today minus the minimum age. */
  readonly fechaMaxima = fechaMaximaNacimiento();

  readonly form = this.fb.nonNullable.group({
    nombre_completo: ['', [Validators.required, Validators.minLength(3)]],
    telefono: ['', [Validators.pattern(TELEFONO_PATTERN)]],
    direccion: [''],
    fecha_nacimiento: ['', [edadMinimaValidator()]],
  });

  get nombre() {
    return this.form.controls.nombre_completo;
  }
  get telefono() {
    return this.form.controls.telefono;
  }
  get fechaNacimiento() {
    return this.form.controls.fecha_nacimiento;
  }

  ngOnInit(): void {
    this.perfilService.obtener().subscribe({
      next: (perfil) => {
        this.email.set(perfil.email);
        this.documento.set(perfil.documento);
        this.form.patchValue({
          nombre_completo: perfil.nombre_completo,
          telefono: perfil.telefono,
          direccion: perfil.direccion,
          fecha_nacimiento: perfil.fecha_nacimiento ?? '',
        });
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.guardando.set(true);
    const datos = this.form.getRawValue();
    this.perfilService
      .actualizar({
        nombre_completo: datos.nombre_completo,
        telefono: datos.telefono,
        direccion: datos.direccion,
        fecha_nacimiento: datos.fecha_nacimiento || null,
      })
      .subscribe({
        next: () => {
          this.guardando.set(false);
          this.notificaciones.exito('Perfil actualizado correctamente.');
          // Keep the session name in sync across the shell.
          this.auth.cargarSesion();
        },
        error: () => this.guardando.set(false),
      });
  }
}
