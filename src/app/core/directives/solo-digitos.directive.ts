import { Directive, ElementRef, HostListener, inject } from '@angular/core';

import { soloDigitos } from '../validators/telefono';

/**
 * Keeps a phone input numeric: strips letters, spaces and symbols as the user
 * types or pastes, so the form control never holds an invalid value. The input
 * stays untouched (and its caret preserved) when there is nothing to clean.
 */
@Directive({ selector: 'input[appSoloDigitos]', standalone: true })
export class SoloDigitosDirective {
  private readonly elemento = inject<ElementRef<HTMLInputElement>>(ElementRef);

  @HostListener('input')
  onInput(): void {
    this.sanitizar(this.elemento.nativeElement.value);
  }

  @HostListener('paste', ['$event'])
  onPaste(evento: ClipboardEvent): void {
    // Handle the paste ourselves so no invalid character is ever inserted.
    evento.preventDefault();
    const input = this.elemento.nativeElement;
    const inicio = input.selectionStart ?? input.value.length;
    const fin = input.selectionEnd ?? inicio;
    const pegado = evento.clipboardData?.getData('text') ?? '';
    const combinado = input.value.slice(0, inicio) + pegado + input.value.slice(fin);
    this.sanitizar(combinado);
  }

  private sanitizar(valor: string): void {
    const input = this.elemento.nativeElement;
    const limpio = soloDigitos(valor);
    if (input.value === limpio) {
      return;
    }
    const posicion = input.selectionStart ?? valor.length;
    input.value = limpio;
    const nueva = Math.max(0, posicion - (valor.length - limpio.length));
    input.setSelectionRange(nueva, nueva);
    // Let the form control (reactive or template-driven) read the clean value.
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }
}
