import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

interface NavItem {
  ruta: string;
  etiqueta: string;
}

const NAVEGACION: Record<string, NavItem[]> = {
  USUARIO: [
    { ruta: '/usuario', etiqueta: 'Inicio' },
    { ruta: '/usuario/denuncias', etiqueta: 'Mis denuncias' },
    { ruta: '/usuario/denuncias/nueva', etiqueta: 'Registrar denuncia' },
    { ruta: '/usuario/perfil', etiqueta: 'Mi perfil' },
    { ruta: '/chat', etiqueta: 'Chat' },
    { ruta: '/noticias', etiqueta: 'Noticias' },
    { ruta: '/podcasts', etiqueta: 'Pódcast' },
    { ruta: '/foro', etiqueta: 'Foro' },
  ],
  PROFESIONAL: [
    { ruta: '/profesional', etiqueta: 'Panel' },
    { ruta: '/profesional/denuncias', etiqueta: 'Casos' },
    { ruta: '/chat', etiqueta: 'Chat' },
  ],
  ADMINISTRADOR: [
    { ruta: '/admin', etiqueta: 'Panel' },
    { ruta: '/admin/usuarios', etiqueta: 'Usuarios' },
    { ruta: '/admin/noticias', etiqueta: 'Noticias' },
    { ruta: '/admin/podcasts', etiqueta: 'Pódcast' },
    { ruta: '/admin/foro', etiqueta: 'Foro' },
  ],
};

@Component({
  selector: 'app-side-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './side-nav.component.html',
  styleUrl: './side-nav.component.scss',
})
export class SideNavComponent {
  private readonly auth = inject(AuthService);

  readonly items = computed<NavItem[]>(() => {
    const role = this.auth.role();
    return role ? (NAVEGACION[role] ?? []) : [];
  });
}
