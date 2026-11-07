import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImageUploaderComponent } from './image-uploader.component';

function archivo(nombre: string, tipo: string, bytes = 1024): File {
  return new File([new Uint8Array(bytes)], nombre, { type: tipo });
}

describe('ImageUploaderComponent', () => {
  let fixture: ComponentFixture<ImageUploaderComponent>;
  let componente: ImageUploaderComponent;
  let emitidos: (File | null)[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ImageUploaderComponent] }).compileComponents();
    fixture = TestBed.createComponent(ImageUploaderComponent);
    componente = fixture.componentInstance;
    emitidos = [];
    componente.imagenCambiada.subscribe((valor) => emitidos.push(valor));
  });

  it('rejects an unsupported format without emitting', () => {
    componente['procesar'](archivo('nota.txt', 'text/plain'));
    expect(componente.error()).toContain('Formato no permitido');
    expect(emitidos.length).toBe(0);
  });

  it('rejects an oversized file', () => {
    componente.maxMb = 1;
    componente['procesar'](archivo('grande.png', 'image/png', 2 * 1024 * 1024));
    expect(componente.error()).toContain('supera el máximo');
    expect(emitidos.length).toBe(0);
  });

  it('accepts a valid image and emits the file', () => {
    componente['procesar'](archivo('foto.png', 'image/png', 2048));
    expect(componente.error()).toBe('');
    expect(emitidos.length).toBe(1);
    expect(emitidos[0]?.name).toBe('foto.png');
  });

  it('emits null when the image is removed', () => {
    componente.quitar();
    expect(emitidos).toEqual([null]);
  });
});
