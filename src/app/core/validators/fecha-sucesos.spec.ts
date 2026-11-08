import { FormControl } from '@angular/forms';
import { describe, expect, it } from 'vitest';

import { fechaSucesosValidator, hoyIso } from './fecha-sucesos';

function iso(fecha: Date): string {
  return hoyIso(fecha);
}

function validar(valor: string) {
  return fechaSucesosValidator()(new FormControl(valor));
}

describe('hoyIso', () => {
  it('formatea la fecha local como YYYY-MM-DD', () => {
    expect(hoyIso(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

describe('fechaSucesosValidator', () => {
  it('permite la fecha de ayer', () => {
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    expect(validar(iso(ayer))).toBeNull();
  });

  it('permite la fecha de hoy', () => {
    expect(validar(iso(new Date()))).toBeNull();
  });

  it('rechaza la fecha de mañana', () => {
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    expect(validar(iso(manana))).toEqual({ fechaFutura: true });
  });

  it('rechaza una fecha futura de otro año', () => {
    const futuro = new Date();
    futuro.setFullYear(futuro.getFullYear() + 1);
    expect(validar(iso(futuro))).toEqual({ fechaFutura: true });
  });

  it('rechaza una fecha inexistente', () => {
    expect(validar('2020-02-30')).toEqual({ fechaInvalida: true });
  });

  it('acepta el campo vacío (opcional)', () => {
    expect(validar('')).toBeNull();
  });
});
