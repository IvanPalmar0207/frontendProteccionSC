import { Pipe, PipeTransform } from '@angular/core';

import { EstadoDenuncia, Modalidad, Rol, TipoSituacion } from '../../core/models/api.models';

const ROLES: Record<Rol, string> = {
  USUARIO: 'Usuario',
  PROFESIONAL: 'Profesional',
  ADMINISTRADOR: 'Administrador',
};

const MODALIDADES: Record<Modalidad, string> = {
  PUBLICA: 'Pública',
  ANONIMA: 'Anónima',
};

const ESTADOS: Record<EstadoDenuncia, string> = {
  PENDIENTE: 'Pendiente',
  EN_PROCESO: 'En proceso',
  FINALIZADA: 'Completada',
};

const TIPOS: Record<TipoSituacion, string> = {
  VIOLENCIA_INTRAFAMILIAR: 'Violencia intrafamiliar',
  ABUSO: 'Abuso',
  ACOSO: 'Acoso',
  OTRO: 'Otro',
};

function etiqueta(mapa: Record<string, string>, valor: string | null | undefined): string {
  if (!valor) {
    return '—';
  }
  return mapa[valor] ?? valor;
}

/**
 * Human-readable Spanish labels for the API enum values. The input is typed as
 * `string` because state history entries may be empty (`''`) for the initial
 * transition.
 */
@Pipe({ name: 'rol' })
export class RolPipe implements PipeTransform {
  transform(valor: string | null | undefined): string {
    return etiqueta(ROLES, valor);
  }
}

@Pipe({ name: 'modalidad' })
export class ModalidadPipe implements PipeTransform {
  transform(valor: string | null | undefined): string {
    return etiqueta(MODALIDADES, valor);
  }
}

@Pipe({ name: 'estado' })
export class EstadoPipe implements PipeTransform {
  transform(valor: string | null | undefined): string {
    return etiqueta(ESTADOS, valor);
  }
}

@Pipe({ name: 'tipoSituacion' })
export class TipoSituacionPipe implements PipeTransform {
  transform(valor: string | null | undefined): string {
    return etiqueta(TIPOS, valor);
  }
}
