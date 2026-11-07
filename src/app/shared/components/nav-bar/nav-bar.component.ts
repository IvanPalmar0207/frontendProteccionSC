import { ChangeDetectionStrategy, Component, OnDestroy, effect, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { RolPipe } from '../../pipes/labels.pipe';

@Component({
  selector: 'app-nav-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, RolPipe],
  templateUrl: './nav-bar.component.html',
  styleUrl: './nav-bar.component.scss',
})
export class NavBarComponent implements OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly notificaciones = inject(NotificacionService);
  private readonly router = inject(Router);

  readonly usuario = this.auth.usuarioActual;
  readonly autenticado = this.auth.autenticado;
  readonly noLeidas = signal(0);

  private readonly timer = setInterval(() => {
    if (this.auth.autenticado()) {
      this.cargarNoLeidas();
    }
  }, 30000);

  constructor() {
    effect(() => {
      if (this.auth.usuarioActual()) {
        this.cargarNoLeidas();
      } else {
        this.noLeidas.set(0);
      }
    });
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }

  cerrarSesion(): void {
    this.auth.logout();
  }

  irANotificaciones(): void {
    this.router.navigate(['/usuario']).then(() => {
      // The dashboard hosts the notification panel.
    });
  }

  private cargarNoLeidas(): void {
    this.notificaciones.contarNoLeidas().subscribe({
      next: (total) => this.noLeidas.set(total),
      error: () => this.noLeidas.set(0),
    });
  }
}
