import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PerfilService } from '../../../core/services/perfil.service';

@Component({
  selector: 'app-perfil',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
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

  readonly form = this.fb.nonNullable.group({
    nombre_completo: ['', [Validators.required, Validators.minLength(3)]],
    telefono: [''],
    documento: [''],
    direccion: [''],
    fecha_nacimiento: [''],
  });

  get nombre() {
    return this.form.controls.nombre_completo;
  }

  ngOnInit(): void {
    this.perfilService.obtener().subscribe({
      next: (perfil) => {
        this.email.set(perfil.email);
        this.form.patchValue({
          nombre_completo: perfil.nombre_completo,
          telefono: perfil.telefono,
          documento: perfil.documento,
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
        documento: datos.documento,
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
