/**
 * Maps backend/HTTP failures of the registration flow to user-facing Spanish
 * (Colombia) messages. Kept as pure functions so the wording is unit-testable
 * without Angular or SweetAlert2.
 */

export interface MensajeRegistro {
  titulo: string;
  mensaje: string;
}

export const MENSAJES_REGISTRO = {
  correoDuplicado:
    'Este correo electrónico ya se encuentra registrado. Utiliza otro correo o inicia sesión.',
  documentoDuplicado:
    'Este número de documento ya se encuentra registrado. Verifica la información ingresada.',
  ambosDuplicados:
    'El correo electrónico y el documento ya se encuentran registrados. Verifica los datos ingresados.',
  correoInvalido: 'Ingresa una dirección de correo electrónico válida.',
  telefonoInvalido: 'Ingresa un teléfono válido (solo números, 7 a 10 dígitos).',
  obligatorios: 'Completa todos los campos obligatorios para continuar.',
  inesperado: 'No fue posible completar el registro. Inténtalo nuevamente.',
  conexion: 'No se pudo conectar con el servidor. Verifica tu conexión e inténtalo nuevamente.',
} as const;

function tieneCampo(cuerpo: unknown, campo: string): boolean {
  return (
    !!cuerpo &&
    typeof cuerpo === 'object' &&
    Object.prototype.hasOwnProperty.call(cuerpo, campo)
  );
}

function primerMensaje(cuerpo: unknown, campo: string): string {
  if (!cuerpo || typeof cuerpo !== 'object') {
    return '';
  }
  const valor = (cuerpo as Record<string, unknown>)[campo];
  return Array.isArray(valor) && typeof valor[0] === 'string' ? valor[0] : '';
}

/** Message for an HTTP failure returned by the registration endpoint. */
export function mensajeErrorRegistro(status: number, cuerpo: unknown): MensajeRegistro {
  if (status === 0) {
    return { titulo: 'Sin conexión', mensaje: MENSAJES_REGISTRO.conexion };
  }

  if (status === 400 || status === 409) {
    const email = tieneCampo(cuerpo, 'email');
    const documento = tieneCampo(cuerpo, 'documento');
    // Django is stricter than the browser validators, so an invalid address can
    // still reach the backend: distinguish it from a duplicate.
    const emailInvalido = /v[aá]lid/i.test(primerMensaje(cuerpo, 'email'));

    if (email && documento && !emailInvalido) {
      return { titulo: 'Datos ya registrados', mensaje: MENSAJES_REGISTRO.ambosDuplicados };
    }
    if (documento) {
      return {
        titulo: 'Documento ya registrado',
        mensaje: MENSAJES_REGISTRO.documentoDuplicado,
      };
    }
    if (email) {
      return emailInvalido
        ? { titulo: 'Correo inválido', mensaje: MENSAJES_REGISTRO.correoInvalido }
        : { titulo: 'Correo ya registrado', mensaje: MENSAJES_REGISTRO.correoDuplicado };
    }
    return { titulo: 'Datos inválidos', mensaje: MENSAJES_REGISTRO.inesperado };
  }

  return { titulo: 'No se pudo completar el registro', mensaje: MENSAJES_REGISTRO.inesperado };
}

/** Message for a locally invalid form (shown before hitting the backend). */
export function mensajeFormularioInvalido(opciones: {
  faltanObligatorios: boolean;
  correoInvalido: boolean;
  telefonoInvalido?: boolean;
}): MensajeRegistro {
  if (opciones.faltanObligatorios) {
    return { titulo: 'Faltan datos', mensaje: MENSAJES_REGISTRO.obligatorios };
  }
  if (opciones.correoInvalido) {
    return { titulo: 'Correo inválido', mensaje: MENSAJES_REGISTRO.correoInvalido };
  }
  if (opciones.telefonoInvalido) {
    return { titulo: 'Teléfono inválido', mensaje: MENSAJES_REGISTRO.telefonoInvalido };
  }
  return { titulo: 'Datos inválidos', mensaje: MENSAJES_REGISTRO.inesperado };
}
