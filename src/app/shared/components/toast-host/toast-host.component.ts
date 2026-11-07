import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-toast-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './toast-host.component.html',
  styleUrl: './toast-host.component.scss',
})
export class ToastHostComponent {
  private readonly notificaciones = inject(NotificationService);
  readonly mensajes = this.notificaciones.lista;

  cerrar(index: number): void {
    const mensaje = this.mensajes()[index];
    if (mensaje) {
      this.notificaciones.cerrar(mensaje);
    }
  }
}
