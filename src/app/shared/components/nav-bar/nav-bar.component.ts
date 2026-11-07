import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, Subscription } from 'rxjs';

import { NAVEGACION, RECURSOS, NavItem } from '../../../core/nav/navegacion';
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
  readonly desplazado = signal(false);
  readonly menuMovil = signal(false);
  readonly menuRecursos = signal(false);
  readonly menuUsuario = signal(false);

  readonly recursos = RECURSOS;
  readonly enlacesPanel = computed<NavItem[]>(() => {
    const role = this.auth.role();
    return role ? (NAVEGACION[role] ?? []) : [];
  });

  private readonly suscripciones = new Subscription();

  constructor() {
    this.actualizarScroll();
    const onScroll = () => this.actualizarScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    this.suscripciones.add(
      this.router.events
        .pipe(filter((evento): evento is NavigationEnd => evento instanceof NavigationEnd))
        .subscribe(() => this.cerrarMenus()),
    );

    this.suscripciones.add(
      new Subscription(() => window.removeEventListener('scroll', onScroll)),
    );

    effect(() => {
      if (this.auth.usuarioActual()) {
        this.cargarNoLeidas();
      } else {
        this.noLeidas.set(0);
      }
    });
  }

  ngOnDestroy(): void {
    this.suscripciones.unsubscribe();
  }

  toggleMovil(): void {
    this.menuMovil.update((v) => !v);
    this.menuRecursos.set(false);
    this.menuUsuario.set(false);
  }

  toggleRecursos(evento: Event): void {
    evento.stopPropagation();
    this.menuRecursos.update((v) => !v);
    this.menuUsuario.set(false);
  }

  toggleUsuario(evento: Event): void {
    evento.stopPropagation();
    this.menuUsuario.update((v) => !v);
    this.menuRecursos.set(false);
  }

  cerrarMenus(): void {
    this.menuMovil.set(false);
    this.menuRecursos.set(false);
    this.menuUsuario.set(false);
  }

  cerrarSesion(): void {
    this.cerrarMenus();
    this.auth.logout();
  }

  private actualizarScroll(): void {
    this.desplazado.set(window.scrollY > 8);
  }

  private cargarNoLeidas(): void {
    this.notificaciones.contarNoLeidas().subscribe({
      next: (total) => this.noLeidas.set(total),
      error: () => this.noLeidas.set(0),
    });
  }
}
