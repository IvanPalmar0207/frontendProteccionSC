import { Routes } from '@angular/router';

import { authGuard, publicOnlyGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

/**
 * Application routes, lazy-loaded per role. Guards are a UX convenience only:
 * the Django API re-checks every permission and ownership rule.
 */
export const routes: Routes = [
  {
    path: '',
    title: 'Protección Inmediata SC',
    loadComponent: () =>
      import('./features/public/landing/landing.component').then((m) => m.LandingComponent),
  },
  {
    path: 'login',
    title: 'Iniciar sesión · Protección Inmediata SC',
    canActivate: [publicOnlyGuard],
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    title: 'Crear cuenta · Protección Inmediata SC',
    canActivate: [publicOnlyGuard],
    loadComponent: () =>
      import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'recuperar',
    title: 'Recuperar contraseña · Protección Inmediata SC',
    loadComponent: () =>
      import('./features/auth/recuperacion/solicitar-recuperacion.component').then(
        (m) => m.SolicitarRecuperacionComponent,
      ),
  },
  {
    path: 'restablecer',
    title: 'Nueva contraseña · Protección Inmediata SC',
    loadComponent: () =>
      import('./features/auth/recuperacion/restablecer.component').then(
        (m) => m.RestablecerComponent,
      ),
  },

  // Public informational content
  {
    path: 'noticias',
    title: 'Noticias · Protección Inmediata SC',
    loadComponent: () =>
      import('./features/contenido/noticias/noticias-list.component').then(
        (m) => m.NoticiasListComponent,
      ),
  },
  {
    path: 'noticias/:id',
    title: 'Noticia · Protección Inmediata SC',
    loadComponent: () =>
      import('./features/contenido/noticias/noticia-detail.component').then(
        (m) => m.NoticiaDetailComponent,
      ),
  },
  {
    path: 'podcasts',
    title: 'Pódcast · Protección Inmediata SC',
    loadComponent: () =>
      import('./features/contenido/podcasts/podcasts-list.component').then(
        (m) => m.PodcastsListComponent,
      ),
  },

  // Authenticated content and chat (any role)
  {
    path: 'foro',
    title: 'Foro · Protección Inmediata SC',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/contenido/foro/foro-list.component').then((m) => m.ForoListComponent),
  },
  {
    path: 'foro/:id',
    title: 'Publicación · Protección Inmediata SC',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/contenido/foro/foro-detail.component').then((m) => m.ForoDetailComponent),
  },
  {
    path: 'chat',
    title: 'Conversaciones · Protección Inmediata SC',
    canActivate: [authGuard, roleGuard(['USUARIO', 'PROFESIONAL'])],
    loadComponent: () => import('./features/chat/chat-list.component').then((m) => m.ChatListComponent),
  },
  {
    path: 'chat/:id',
    title: 'Chat · Protección Inmediata SC',
    canActivate: [authGuard, roleGuard(['USUARIO', 'PROFESIONAL'])],
    loadComponent: () => import('./features/chat/chat-room.component').then((m) => m.ChatRoomComponent),
  },
  {
    path: 'notificaciones',
    title: 'Notificaciones · Protección Inmediata SC',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/notificaciones/notificaciones-page.component').then(
        (m) => m.NotificacionesPageComponent,
      ),
  },

  // User panel
  {
    path: 'usuario',
    canActivate: [authGuard, roleGuard(['USUARIO'])],
    children: [
      {
        path: '',
        title: 'Mi panel · Protección Inmediata SC',
        loadComponent: () =>
          import('./features/usuario/dashboard/usuario-dashboard.component').then(
            (m) => m.UsuarioDashboardComponent,
          ),
      },
      {
        path: 'perfil',
        title: 'Mi perfil · Protección Inmediata SC',
        loadComponent: () =>
          import('./features/usuario/perfil/perfil.component').then((m) => m.PerfilComponent),
      },
      {
        path: 'denuncias',
        title: 'Mis denuncias · Protección Inmediata SC',
        loadComponent: () =>
          import('./features/usuario/denuncias/denuncias-list.component').then(
            (m) => m.DenunciasListComponent,
          ),
      },
      {
        path: 'denuncias/nueva',
        title: 'Registrar denuncia · Protección Inmediata SC',
        loadComponent: () =>
          import('./features/usuario/denuncias/denuncia-create.component').then(
            (m) => m.DenunciaCreateComponent,
          ),
      },
      {
        path: 'denuncias/:id',
        title: 'Detalle de denuncia · Protección Inmediata SC',
        loadComponent: () =>
          import('./features/usuario/denuncias/denuncia-detail.component').then(
            (m) => m.DenunciaDetailComponent,
          ),
      },
    ],
  },

  // Professional panel
  {
    path: 'profesional',
    canActivate: [authGuard, roleGuard(['PROFESIONAL'])],
    children: [
      {
        path: '',
        title: 'Panel profesional · Protección Inmediata SC',
        loadComponent: () =>
          import('./features/profesional/dashboard/profesional-dashboard.component').then(
            (m) => m.ProfesionalDashboardComponent,
          ),
      },
      {
        path: 'denuncias',
        title: 'Casos · Protección Inmediata SC',
        loadComponent: () =>
          import('./features/profesional/denuncias/profesional-denuncias.component').then(
            (m) => m.ProfesionalDenunciasComponent,
          ),
      },
      {
        path: 'denuncias/:id',
        title: 'Detalle del caso · Protección Inmediata SC',
        loadComponent: () =>
          import('./features/profesional/denuncias/profesional-denuncia-detail.component').then(
            (m) => m.ProfesionalDenunciaDetailComponent,
          ),
      },
      {
        path: 'perfil',
        title: 'Mi perfil · Protección Inmediata SC',
        loadComponent: () =>
          import('./features/usuario/perfil/perfil.component').then((m) => m.PerfilComponent),
      },
    ],
  },

  // Administrator panel
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard(['ADMINISTRADOR'])],
    children: [
      {
        path: '',
        title: 'Panel administrativo · Protección Inmediata SC',
        loadComponent: () =>
          import('./features/admin/dashboard/admin-dashboard.component').then(
            (m) => m.AdminDashboardComponent,
          ),
      },
      {
        path: 'denuncias',
        title: 'Casos · Protección Inmediata SC',
        loadComponent: () =>
          import('./features/admin/denuncias/admin-denuncias.component').then(
            (m) => m.AdminDenunciasComponent,
          ),
      },
      {
        path: 'usuarios',
        title: 'Usuarios · Protección Inmediata SC',
        loadComponent: () =>
          import('./features/admin/usuarios/admin-usuarios.component').then(
            (m) => m.AdminUsuariosComponent,
          ),
      },
      {
        path: 'noticias',
        title: 'Noticias · Protección Inmediata SC',
        loadComponent: () =>
          import('./features/admin/noticias/admin-noticias.component').then(
            (m) => m.AdminNoticiasComponent,
          ),
      },
      {
        path: 'podcasts',
        title: 'Pódcast · Protección Inmediata SC',
        loadComponent: () =>
          import('./features/admin/podcasts/admin-podcasts.component').then(
            (m) => m.AdminPodcastsComponent,
          ),
      },
      {
        path: 'foro',
        title: 'Foro · Protección Inmediata SC',
        loadComponent: () =>
          import('./features/admin/foro/admin-foro.component').then((m) => m.AdminForoComponent),
      },
      {
        path: 'perfil',
        title: 'Mi perfil · Protección Inmediata SC',
        loadComponent: () =>
          import('./features/usuario/perfil/perfil.component').then((m) => m.PerfilComponent),
      },
    ],
  },

  { path: '**', redirectTo: '' },
];
