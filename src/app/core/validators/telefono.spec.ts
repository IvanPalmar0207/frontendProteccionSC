import { describe, expect, it } from 'vitest';

import { TELEFONO_PATTERN, soloDigitos } from './telefono';

describe('soloDigitos', () => {
  it('quita letras, espacios y símbolos', () => {
    expect(soloDigitos('300ABC4567')).toBe('3004567');
    expect(soloDigitos('300-123-4567')).toBe('3001234567');
    expect(soloDigitos('300 123 4567')).toBe('3001234567');
    expect(soloDigitos('+57 (300).123-4567')).toBe('573001234567'.slice(0, 10));
    expect(soloDigitos('300/123/4567')).toBe('3001234567');
  });

  it('recorta a 10 dígitos', () => {
    expect(soloDigitos('1234567890123')).toBe('1234567890');
  });

  it('mantiene el valor vacío', () => {
    expect(soloDigitos('')).toBe('');
    expect(soloDigitos('abc')).toBe('');
  });
});

describe('TELEFONO_PATTERN', () => {
  it('acepta solo dígitos de 7 a 10', () => {
    expect(TELEFONO_PATTERN.test('3001234567')).toBe(true);
    expect(TELEFONO_PATTERN.test('3001234')).toBe(true);
  });

  it('rechaza letras, separadores y longitudes fuera de rango', () => {
    expect(TELEFONO_PATTERN.test('300ABC4567')).toBe(false);
    expect(TELEFONO_PATTERN.test('300-123-4567')).toBe(false);
    expect(TELEFONO_PATTERN.test('300 123 4567')).toBe(false);
    expect(TELEFONO_PATTERN.test('+573001234567')).toBe(false);
    expect(TELEFONO_PATTERN.test('300.123.4567')).toBe(false);
    expect(TELEFONO_PATTERN.test('123456')).toBe(false);
    expect(TELEFONO_PATTERN.test('30012345678901')).toBe(false);
  });
});
