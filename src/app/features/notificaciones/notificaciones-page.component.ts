import { ChangeDetectionStrategy, Component } from '@angular/core';

import { NotificacionesComponent } from './notificaciones.component';

/** Full page for the notifications route, shared by every role. */
@Component({
  selector: 'app-notificaciones-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NotificacionesComponent],
  template: `
    <section class="container stack seccion">
      <header class="stack stack--sm">
        <h1>Notificaciones</h1>
        <p class="muted">Novedades relacionadas con tu cuenta.</p>
      </header>
      <app-notificaciones />
    </section>
  `,
})
export class NotificacionesPageComponent {}
