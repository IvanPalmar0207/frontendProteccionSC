import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';

import { SoloDigitosDirective } from './solo-digitos.directive';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, SoloDigitosDirective],
  template: `<input appSoloDigitos [formControl]="control" />`,
})
class HostComponent {
  readonly control = new FormControl('', { nonNullable: true });
}

function crearComponente() {
  const fixture = TestBed.createComponent(HostComponent);
  fixture.detectChanges();
  const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
  const directiva = fixture.debugElement
    .query(By.directive(SoloDigitosDirective))
    .injector.get(SoloDigitosDirective);
  return { fixture, input, directiva };
}

describe('SoloDigitosDirective', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [HostComponent] }));

  it('elimina letras y símbolos escritos y actualiza el formulario', () => {
    const { fixture, input } = crearComponente();
    input.value = '300ABC-45';
    input.dispatchEvent(new Event('input'));

    expect(input.value).toBe('30045');
    expect(fixture.componentInstance.control.value).toBe('30045');
  });

  it('recorta la entrada a 10 dígitos', () => {
    const { fixture, input } = crearComponente();
    input.value = '1234567890123';
    input.dispatchEvent(new Event('input'));

    expect(input.value).toBe('1234567890');
    expect(fixture.componentInstance.control.value).toBe('1234567890');
  });

  it('sanitiza el contenido pegado', () => {
    const { fixture, input, directiva } = crearComponente();
    const evento = {
      preventDefault: () => {},
      clipboardData: { getData: () => '300-123-4567' },
    } as unknown as ClipboardEvent;

    directiva.onPaste(evento);

    expect(input.value).toBe('3001234567');
    expect(fixture.componentInstance.control.value).toBe('3001234567');
  });

  it('deja intacto un valor numérico válido', () => {
    const { fixture, input } = crearComponente();
    input.value = '3001234567';
    input.dispatchEvent(new Event('input'));

    expect(input.value).toBe('3001234567');
    expect(fixture.componentInstance.control.value).toBe('3001234567');
  });
});
