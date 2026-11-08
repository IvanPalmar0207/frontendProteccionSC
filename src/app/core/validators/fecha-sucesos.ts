import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const MENSAJE_FECHA_SUCESOS =
  'La fecha de los sucesos no puede ser posterior al día de hoy.';

/** Today as `YYYY-MM-DD` in the user's local calendar. */
export function hoyIso(hoy: Date = new Date()): string {
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return `${hoy.getFullYear()}-${mes}-${dia}`;
}

/** Optional date; when present it must be a real date and never in the future. */
export function fechaSucesosValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor = control.value as string | null;
    if (!valor) {
      return null;
    }
    const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
    if (!partes) {
      return { fechaInvalida: true };
    }
    const anio = Number(partes[1]);
    const mes = Number(partes[2]) - 1;
    const dia = Number(partes[3]);
    const fecha = new Date(anio, mes, dia);
    if (fecha.getFullYear() !== anio || fecha.getMonth() !== mes || fecha.getDate() !== dia) {
      return { fechaInvalida: true };
    }
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (fecha > hoy) {
      return { fechaFutura: true };
    }
    return null;
  };
}
