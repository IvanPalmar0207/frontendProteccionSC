import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmacion = control.get('password_confirm')?.value;
  if (password && confirmacion && password !== confirmacion) {
    return { noCoinciden: true };
  }
  return null;
}

type EstadoVista = 'validando' | 'invalido' | 'formulario' | 'listo';

@Component({
  selector: 'app-restablecer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './restablecer.component.html',
  styleUrl: './restablecer.component.scss',
})
export class RestablecerComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly ruta = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly notificaciones = inject(NotificationService);

  private token = '';

  readonly estado = signal<EstadoVista>('validando');
  readonly enviando = signal(false);

  readonly form = this.fb.nonNullable.group(
    {
      password: ['', [Validators.required, Validators.minLength(8)]],
      password_confirm: ['', Validators.required],
    },
    { validators: passwordsMatch },
  );

  get password() {
    return this.form.controls.password;
  }

  ngOnInit(): void {
    this.token = this.ruta.snapshot.queryParamMap.get('token') ?? '';
    if (!this.token) {
      this.estado.set('invalido');
      return;
    }
    // The backend is the only authority on whether the token is still valid.
    this.auth.validarTokenRecuperacion(this.token).subscribe({
      next: (respuesta) => this.estado.set(respuesta.valido ? 'formulario' : 'invalido'),
      error: () => this.estado.set('invalido'),
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    const { password, password_confirm } = this.form.getRawValue();
    this.auth.confirmarRecuperacion(this.token, password, password_confirm).subscribe({
      next: () => {
        this.enviando.set(false);
        this.estado.set('listo');
        this.notificaciones.exito('Contraseña actualizada.');
        setTimeout(() => this.router.navigate(['/login']), 1800);
      },
      error: (error) => {
        this.enviando.set(false);
        // A rejected password keeps the form; an invalid/expired token ends it.
        if (error?.error?.password) {
          this.form.controls.password.setErrors({ servidor: true });
        } else {
          this.estado.set('invalido');
        }
      },
    });
  }
}
