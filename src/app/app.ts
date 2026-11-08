import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

import { AuthService } from './core/services/auth.service';
import { NavBarComponent } from './shared/components/nav-bar/nav-bar.component';
import { SideNavComponent } from './shared/components/side-nav/side-nav.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { ToastHostComponent } from './shared/components/toast-host/toast-host.component';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, NavBarComponent, SideNavComponent, FooterComponent, ToastHostComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  private readonly url = signal('/');

  readonly mostrarSideNav = computed(() => {
    const ruta = this.url().split('?')[0];
    const esPublica = ruta === '/' || ruta === '/login' || ruta === '/register';
    // The normal user navigates from the top bar and the dashboard cards; the
    // side panel is reserved for the operational roles (professional/admin).
    const usaPanelLateral = this.auth.role() === 'PROFESIONAL' || this.auth.role() === 'ADMINISTRADOR';
    return this.auth.autenticado() && !esPublica && usaPanelLateral;
  });

  constructor() {
    // Restore the session from the stored token on startup.
    this.auth.cargarSesion();
    this.url.set(this.router.url);
    this.router.events
      .pipe(filter((evento): evento is NavigationEnd => evento instanceof NavigationEnd))
      .subscribe((evento) => this.url.set(evento.urlAfterRedirects));
  }
}
