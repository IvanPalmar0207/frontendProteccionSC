import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal } from '@angular/core';

/**
 * Reusable image picker with drag & drop, preview and client-side validation.
 * Emits `File` on selection and `null` when the user removes the image, so the
 * parent can distinguish "unchanged" (never emitted) from "cleared".
 *
 * The backend re-validates every upload; this is only user guidance.
 */
@Component({
  selector: 'app-image-uploader',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './image-uploader.component.html',
  styleUrl: './image-uploader.component.scss',
})
export class ImageUploaderComponent {
  @Input() imagenUrl: string | null = null;
  @Input() maxMb = 5;
  @Input() etiqueta = 'Imagen';
  @Output() imagenCambiada = new EventEmitter<File | null>();

  readonly arrastrando = signal(false);
  readonly error = signal('');
  readonly previewUrl = signal<string | null>(null);
  readonly nombreArchivo = signal('');

  private readonly tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];

  get urlMostrada(): string | null {
    return this.previewUrl() ?? this.imagenUrl;
  }

  onDragOver(evento: DragEvent): void {
    evento.preventDefault();
    this.arrastrando.set(true);
  }

  onDragLeave(): void {
    this.arrastrando.set(false);
  }

  onDrop(evento: DragEvent): void {
    evento.preventDefault();
    this.arrastrando.set(false);
    const archivo = evento.dataTransfer?.files?.[0];
    if (archivo) {
      this.procesar(archivo);
    }
  }

  onSeleccion(evento: Event): void {
    const archivo = (evento.target as HTMLInputElement).files?.[0];
    if (archivo) {
      this.procesar(archivo);
    }
  }

  quitar(): void {
    this.previewUrl.set(null);
    this.nombreArchivo.set('');
    this.error.set('');
    this.imagenCambiada.emit(null);
  }

  private procesar(archivo: File): void {
    this.error.set('');
    if (!this.tiposPermitidos.includes(archivo.type)) {
      this.error.set('Formato no permitido. Usá JPG, PNG o WEBP.');
      return;
    }
    if (archivo.size > this.maxMb * 1024 * 1024) {
      this.error.set(`La imagen supera el máximo de ${this.maxMb} MB.`);
      return;
    }
    this.previewUrl.set(URL.createObjectURL(archivo));
    this.nombreArchivo.set(archivo.name);
    this.imagenCambiada.emit(archivo);
  }
}
