import { Rol } from '../models/api.models';

export interface NavItem {
  ruta: string;
  etiqueta: string;
  /** Exact match for the active state (used for panel roots). */
  exacto?: boolean;
}

/** Role-aware navigation shared by the side navigation and the mobile menu. */
export const NAVEGACION: Record<Rol, NavItem[]> = {
  USUARIO: [
    { ruta: '/usuario', etiqueta: 'Inicio', exacto: true },
    { ruta: '/usuario/denuncias', etiqueta: 'Mis denuncias' },
    { ruta: '/usuario/denuncias/nueva', etiqueta: 'Registrar denuncia' },
    { ruta: '/usuario/perfil', etiqueta: 'Mi perfil' },
    { ruta: '/chat', etiqueta: 'Chat' },
    { ruta: '/noticias', etiqueta: 'Noticias' },
    { ruta: '/podcasts', etiqueta: 'Pódcast' },
    { ruta: '/foro', etiqueta: 'Foro' },
  ],
  PROFESIONAL: [
    { ruta: '/profesional', etiqueta: 'Panel', exacto: true },
    { ruta: '/profesional/denuncias', etiqueta: 'Casos' },
    { ruta: '/profesional/perfil', etiqueta: 'Mi perfil' },
    { ruta: '/chat', etiqueta: 'Chat' },
  ],
  ADMINISTRADOR: [
    { ruta: '/admin', etiqueta: 'Panel', exacto: true },
    { ruta: '/admin/denuncias', etiqueta: 'Casos' },
    { ruta: '/admin/usuarios', etiqueta: 'Usuarios' },
    { ruta: '/admin/noticias', etiqueta: 'Noticias' },
    { ruta: '/admin/podcasts', etiqueta: 'Pódcast' },
    { ruta: '/admin/foro', etiqueta: 'Foro' },
    { ruta: '/admin/perfil', etiqueta: 'Mi perfil' },
  ],
};

/** Public content links shown in the top navigation. */
export const RECURSOS: NavItem[] = [
  { ruta: '/noticias', etiqueta: 'Noticias' },
  { ruta: '/podcasts', etiqueta: 'Pódcast' },
  { ruta: '/foro', etiqueta: 'Foro' },
];
