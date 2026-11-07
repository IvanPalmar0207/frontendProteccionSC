/**
 * Types shared with the Django REST API.
 * Field names mirror the backend contract documented in
 * `odd/tasks/proteccion-inmediata-mvp.md` (section "API contract").
 */

export type Rol = 'USUARIO' | 'PROFESIONAL' | 'ADMINISTRADOR';
export type Modalidad = 'PUBLICA' | 'ANONIMA';
export type EstadoDenuncia = 'PENDIENTE' | 'EN_PROCESO' | 'FINALIZADA';
export type TipoSituacion = 'VIOLENCIA_INTRAFAMILIAR' | 'ABUSO' | 'ACOSO' | 'OTRO';
export type TipoNotificacion = 'DENUNCIA' | 'ESTADO' | 'MENSAJE' | 'SISTEMA';

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface Usuario {
  id: number;
  email: string;
  nombre_completo: string;
  telefono: string;
  documento: string;
  direccion: string;
  fecha_nacimiento: string | null;
  role: Rol;
  is_active: boolean;
  date_joined: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: Usuario;
}

export interface Seguimiento {
  id: number;
  estado_anterior: string;
  estado_nuevo: string;
  observacion: string;
  autor_nombre: string;
  creado_en: string;
}

export interface PersonaResumen {
  id: number;
  nombre_completo: string;
}

export interface Solicitante {
  nombre_completo: string;
  email: string;
  telefono: string;
  documento: string;
}

export interface Denuncia {
  id: number;
  identificador: string;
  modalidad: Modalidad;
  es_anonima: boolean;
  tipo_situacion: TipoSituacion;
  descripcion: string;
  ubicacion: string;
  fecha_hechos: string | null;
  estado: EstadoDenuncia;
  profesional_asignado: PersonaResumen | null;
  seguimientos: Seguimiento[];
  creado_en: string;
  actualizado_en: string;
  /** Only present in the professional serializer. `null` for anonymous reports. */
  solicitante?: Solicitante | null;
}

export interface CrearDenuncia {
  modalidad: Modalidad;
  tipo_situacion: TipoSituacion;
  descripcion: string;
  ubicacion?: string;
  fecha_hechos?: string | null;
}

export interface Participante {
  id: number;
  nombre_completo: string;
  role: Rol;
}

export interface UltimoMensaje {
  contenido: string;
  remitente_nombre: string;
  creado_en: string;
}

export interface Conversacion {
  id: number;
  denuncia: {
    id: number;
    identificador: string;
    modalidad: Modalidad;
    es_anonima: boolean;
    estado: EstadoDenuncia;
  };
  participantes: Participante[];
  ultimo_mensaje: UltimoMensaje | null;
  no_leidos: number;
  creado_en: string;
  actualizado_en: string;
}

export interface Mensaje {
  id: number;
  remitente: Participante;
  contenido: string;
  leido: boolean;
  creado_en: string;
}

export type CategoriaNoticia =
  | 'PREVENCION'
  | 'ACOMPANAMIENTO'
  | 'DERECHOS'
  | 'COMUNIDAD'
  | 'INSTITUCIONAL';

export interface Noticia {
  id: number;
  titulo: string;
  resumen: string;
  contenido: string;
  categoria: CategoriaNoticia;
  categoria_etiqueta: string;
  imagen: string | null;
  destacada: boolean;
  autor_nombre: string;
  publicado: boolean;
  fecha_publicacion: string;
}

export type PlataformaPodcast = 'SPOTIFY' | 'YOUTUBE' | 'APPLE_PODCASTS' | 'OTRA';

export interface Podcast {
  id: number;
  titulo: string;
  descripcion: string;
  programa: string;
  plataforma: PlataformaPodcast;
  plataforma_etiqueta: string;
  /** Validated HTTPS link to the externally hosted episode. */
  enlace: string;
  portada: string | null;
  autor_nombre: string;
  publicado: boolean;
  fecha_publicacion: string;
}

export interface RespuestaForo {
  id: number;
  publicacion: number;
  contenido: string;
  autor_nombre: string;
  creado_en: string;
}

export interface PublicacionForo {
  id: number;
  titulo: string;
  contenido: string;
  autor_nombre: string;
  respuestas: RespuestaForo[];
  respuestas_count: number;
  creado_en: string;
  actualizado_en: string;
}

export interface Notificacion {
  id: number;
  titulo: string;
  mensaje: string;
  tipo: TipoNotificacion;
  url: string;
  leida: boolean;
  creado_en: string;
}
