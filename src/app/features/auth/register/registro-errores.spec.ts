import { describe, expect, it } from 'vitest';

import {
  MENSAJES_REGISTRO,
  mensajeErrorRegistro,
  mensajeFormularioInvalido,
} from './registro-errores';

describe('mensajeErrorRegistro', () => {
  it('informa un problema de conexión cuando no hay respuesta', () => {
    expect(mensajeErrorRegistro(0, null).mensaje).toBe(MENSAJES_REGISTRO.conexion);
  });

  it('informa el correo duplicado', () => {
    const resultado = mensajeErrorRegistro(400, { email: ['Ya existe.'] });
    expect(resultado.mensaje).toBe(MENSAJES_REGISTRO.correoDuplicado);
  });

  it('informa el documento duplicado', () => {
    const resultado = mensajeErrorRegistro(400, { documento: ['Ya existe.'] });
    expect(resultado.mensaje).toBe(MENSAJES_REGISTRO.documentoDuplicado);
  });

  it('informa cuando el correo y el documento ya existen', () => {
    const resultado = mensajeErrorRegistro(400, { email: ['x'], documento: ['y'] });
    expect(resultado.mensaje).toBe(MENSAJES_REGISTRO.ambosDuplicados);
  });

  it('trata un 409 como conflicto de duplicados', () => {
    const resultado = mensajeErrorRegistro(409, { email: ['x'] });
    expect(resultado.mensaje).toBe(MENSAJES_REGISTRO.correoDuplicado);
  });

  it('distingue un correo inválido reportado por el servidor', () => {
    const resultado = mensajeErrorRegistro(400, {
      email: ['Introduzca una dirección de correo electrónico válida.'],
    });
    expect(resultado.mensaje).toBe(MENSAJES_REGISTRO.correoInvalido);
  });

  it('prioriza el documento duplicado si el correo además es inválido', () => {
    const resultado = mensajeErrorRegistro(400, {
      email: ['Introduzca una dirección de correo electrónico válida.'],
      documento: ['Ya existe una cuenta con este número de documento.'],
    });
    expect(resultado.mensaje).toBe(MENSAJES_REGISTRO.documentoDuplicado);
  });

  it('usa un mensaje genérico para un 400 sin campos conocidos', () => {
    const resultado = mensajeErrorRegistro(400, { password: ['débil'] });
    expect(resultado.mensaje).toBe(MENSAJES_REGISTRO.inesperado);
  });

  it('usa un mensaje genérico ante un error inesperado del servidor', () => {
    expect(mensajeErrorRegistro(500, null).mensaje).toBe(MENSAJES_REGISTRO.inesperado);
    expect(mensajeErrorRegistro(503, 'html').mensaje).toBe(MENSAJES_REGISTRO.inesperado);
  });
});

describe('mensajeFormularioInvalido', () => {
  it('pide completar los obligatorios', () => {
    const resultado = mensajeFormularioInvalido({
      faltanObligatorios: true,
      correoInvalido: false,
    });
    expect(resultado.mensaje).toBe(MENSAJES_REGISTRO.obligatorios);
  });

  it('informa un correo inválido', () => {
    const resultado = mensajeFormularioInvalido({
      faltanObligatorios: false,
      correoInvalido: true,
    });
    expect(resultado.mensaje).toBe(MENSAJES_REGISTRO.correoInvalido);
  });

  it('prioriza los obligatorios sobre otros errores', () => {
    const resultado = mensajeFormularioInvalido({
      faltanObligatorios: true,
      correoInvalido: true,
    });
    expect(resultado.mensaje).toBe(MENSAJES_REGISTRO.obligatorios);
  });

  it('informa un teléfono inválido', () => {
    const resultado = mensajeFormularioInvalido({
      faltanObligatorios: false,
      correoInvalido: false,
      telefonoInvalido: true,
    });
    expect(resultado.mensaje).toBe(MENSAJES_REGISTRO.telefonoInvalido);
  });
});
