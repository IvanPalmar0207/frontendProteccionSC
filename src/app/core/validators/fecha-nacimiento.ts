import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Minimum age (completed years) required to use the platform. */
export const EDAD_MINIMA = 10;

function aIso(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

/**
 * Latest accepted birth date (today minus the minimum age), computed at
 * runtime from the current date. Never a hardcoded date.
 */
export function fechaMaximaNacimiento(hoy: Date = new Date(), minimo = EDAD_MINIMA): string {
  return aIso(new Date(hoy.getFullYear() - minimo, hoy.getMonth(), hoy.getDate()));
}

/** Completed years between two dates (day and month aware). */
export function calcularEdad(nacimiento: Date, hoy: Date = new Date()): number {
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad -= 1;
  }
  return edad;
}

/** Parses `YYYY-MM-DD`, rejecting impossible dates such as 2020-02-30. */
function parsear(valor: string): Date | null {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
  if (!partes) {
    return null;
  }
  const anio = Number(partes[1]);
  const mes = Number(partes[2]) - 1;
  const dia = Number(partes[3]);
  const fecha = new Date(anio, mes, dia);
  if (fecha.getFullYear() !== anio || fecha.getMonth() !== mes || fecha.getDate() !== dia) {
    return null;
  }
  return fecha;
}

/** Reactive validator: optional field, but the value must be a real date of
 * someone at least `minimo` years old and never in the future. */
export function edadMinimaValidator(minimo = EDAD_MINIMA): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor = control.value as string | null;
    if (!valor) {
      return null;
    }
    const fecha = parsear(valor);
    if (!fecha) {
      return { fechaInvalida: true };
    }
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (fecha > hoy) {
      return { fechaFutura: true };
    }
    if (calcularEdad(fecha, hoy) < minimo) {
      return { edadMinima: true };
    }
    return null;
  };
}
