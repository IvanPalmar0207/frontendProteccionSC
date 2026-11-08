import { FormControl } from '@angular/forms';
import { describe, expect, it } from 'vitest';

import {
  calcularEdad,
  edadMinimaValidator,
  fechaMaximaNacimiento,
} from './fecha-nacimiento';

function iso(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

function fechaHaceAnios(anios: number, dias = 0): string {
  const hoy = new Date();
  return iso(new Date(hoy.getFullYear() - anios, hoy.getMonth(), hoy.getDate() + dias));
}

function validar(valor: string) {
  return edadMinimaValidator()(new FormControl(valor));
}

describe('calcularEdad', () => {
  it('cuenta años cumplidos según mes y día', () => {
    const hoy = new Date(2026, 5, 15);
    // Cumple años mañana: todavía 9.
    expect(calcularEdad(new Date(2016, 5, 16), hoy)).toBe(9);
    // Cumple años hoy: 10.
    expect(calcularEdad(new Date(2016, 5, 15), hoy)).toBe(10);
    // Ya cumplió: 10.
    expect(calcularEdad(new Date(2016, 5, 14), hoy)).toBe(10);
  });

  it('contempla los años bisiestos (29 de febrero)', () => {
    expect(calcularEdad(new Date(2016, 1, 29), new Date(2026, 1, 28))).toBe(9);
    expect(calcularEdad(new Date(2016, 1, 29), new Date(2026, 2, 1))).toBe(10);
  });
});

describe('fechaMaximaNacimiento', () => {
  it('calcula dinámicamente hoy menos 10 años', () => {
    expect(fechaMaximaNacimiento(new Date(2026, 10, 8))).toBe('2016-11-08');
  });
});

describe('edadMinimaValidator', () => {
  it('rechaza a una persona de 9 años', () => {
    expect(validar(fechaHaceAnios(9))).toEqual({ edadMinima: true });
  });

  it('acepta a una persona de 10 años cumplidos', () => {
    expect(validar(fechaHaceAnios(10))).toBeNull();
  });

  it('acepta a una persona de 11 años', () => {
    expect(validar(fechaHaceAnios(11))).toBeNull();
  });

  it('rechaza a quien cumple 10 años mañana', () => {
    expect(validar(fechaHaceAnios(10, 1))).toEqual({ edadMinima: true });
  });

  it('rechaza una fecha de nacimiento de ayer', () => {
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    expect(validar(iso(ayer))).toEqual({ edadMinima: true });
  });

  it('rechaza una fecha futura', () => {
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    expect(validar(iso(manana))).toEqual({ fechaFutura: true });
  });

  it('rechaza una fecha inexistente', () => {
    expect(validar('2020-02-30')).toEqual({ fechaInvalida: true });
  });

  it('acepta el campo vacío (opcional)', () => {
    expect(validar('')).toBeNull();
  });
});
