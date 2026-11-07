import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

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
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notificaciones = inject(NotificationService);

  readonly enviando = signal(false);
  readonly creado = signal(false);

  readonly form = this.fb.nonNullable.group(
    {
      nombre_completo: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.pattern(/^[0-9+\-\s]{7,20}$/)]],
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
      this.form.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    const { nombre_completo, email, telefono, password, password_confirm } =
      this.form.getRawValue();

    this.auth
      .register({
        nombre_completo,
        email,
        telefono: telefono || undefined,
        password,
        password_confirm,
      })
      .subscribe({
        next: () => {
          this.enviando.set(false);
          this.creado.set(true);
          this.notificaciones.exito('Cuenta creada. Ya podés iniciar sesión.');
          setTimeout(() => this.router.navigate(['/login']), 1000);
        },
        error: () => this.enviando.set(false),
      });
  }
}
