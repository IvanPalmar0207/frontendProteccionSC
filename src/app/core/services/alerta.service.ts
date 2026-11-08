import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

/**
 * Thin wrapper over SweetAlert2 so application code never talks to the dialog
 * library directly (easier to centralize wording and to mock in tests).
 */
@Injectable({ providedIn: 'root' })
export class AlertaService {
  error(titulo: string, mensaje: string): void {
    void Swal.fire({
      icon: 'error',
      title: titulo,
      text: mensaje,
      confirmButtonText: 'Entendido',
    });
  }

  exito(titulo: string, mensaje: string): void {
    void Swal.fire({
      icon: 'success',
      title: titulo,
      text: mensaje,
      confirmButtonText: 'Aceptar',
    });
  }
}
