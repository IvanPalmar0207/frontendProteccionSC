import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { SoloDigitosDirective } from '../../../core/directives/solo-digitos.directive';
import { AlertaService } from '../../../core/services/alerta.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { TELEFONO_PATTERN } from '../../../core/validators/telefono';
import {
  mensajeErrorRegistro,
  mensajeFormularioInvalido,
} from './registro-errores';

/** Cross-field validation: both password fields must match. */
function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmacion = control.get('password_confirm')?.value;
  if (password && confirmacion && password !== confirmacion) {
    return { noCoinciden: true };
  }
  return null;
}

@Component({
  selector: 'app-register',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, SoloDigitosDirective],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notificaciones = inject(NotificationService);
  private readonly alerta = inject(AlertaService);

  readonly enviando = signal(false);
  readonly creado = signal(false);

  readonly form = this.fb.nonNullable.group(
    {
      nombre_completo: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      documento: ['', [Validators.required, Validators.minLength(4), Validators.pattern(/^[A-Za-z0-9-]+$/)]],
      telefono: ['', [Validators.pattern(TELEFONO_PATTERN)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      password_confirm: ['', Validators.required],
    },
    { validators: passwordsMatch },
  );

  get nombre() {
    return this.form.controls.nombre_completo;
  }
  get email() {
    return this.form.controls.email;
  }
  get documento() {
    return this.form.controls.documento;
  }
  get telefono() {
    return this.form.controls.telefono;
  }
  get password() {
    return this.form.controls.password;
  }
  get confirmacion() {
    return this.form.controls.password_confirm;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      // Keep the inline field errors and add one clear notification.
      this.form.markAllAsTouched();
      const { titulo, mensaje } = mensajeFormularioInvalido({
        faltanObligatorios: this.faltanObligatorios(),
        correoInvalido: this.email.hasError('email'),
        telefonoInvalido: this.telefono.hasError('pattern'),
      });
      this.alerta.error(titulo, mensaje);
      return;
    }
    this.enviando.set(true);
    const { nombre_completo, email, documento, telefono, password, password_confirm } =
      this.form.getRawValue();

    this.auth
      .register({
        nombre_completo,
        email,
        documento: documento.trim(),
        telefono: telefono || undefined,
        password,
        password_confirm,
      })
      .subscribe({
        next: () => {
          this.enviando.set(false);
          this.creado.set(true);
          this.notificaciones.exito('Cuenta creada. Ya puedes iniciar sesión.');
          setTimeout(() => this.router.navigate(['/login']), 1000);
        },
        error: (error: HttpErrorResponse) => {
          // The form is left untouched so the user does not lose their data.
          this.enviando.set(false);
          // Technical trace for diagnostics only; never shown in the UI.
          console.error('[registro] error de registro', error.status, error.error);
          const { titulo, mensaje } = mensajeErrorRegistro(error.status, error.error);
          this.alerta.error(titulo, mensaje);
        },
      });
  }

  private faltanObligatorios(): boolean {
    return [
      this.form.controls.nombre_completo,
      this.form.controls.email,
      this.form.controls.documento,
      this.form.controls.password,
      this.form.controls.password_confirm,
    ].some((control) => control.hasError('required'));
  }
}
