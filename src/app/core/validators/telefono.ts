/**
 * Colombian phone rules shared by the registration and profile forms.
 * Digits only, 7 to 10 of them; empty is allowed because the field is optional.
 */
export const TELEFONO_PATTERN = /^[0-9]{7,10}$/;
export const TELEFONO_MAX_DIGITOS = 10;

/** Removes every non-digit character and caps the length. */
export function soloDigitos(valor: string, max: number = TELEFONO_MAX_DIGITOS): string {
  return (valor ?? '').replace(/\D/g, '').slice(0, max);
}
