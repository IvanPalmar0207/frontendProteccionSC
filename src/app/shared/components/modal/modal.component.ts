import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  effect,
} from '@angular/core';

/**
 * Accessible modal dialog with backdrop, ESC handling and initial focus.
 * Content is projected, so callers provide the body and footer.
 */
@Component({
  selector: 'app-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss',
})
export class ModalComponent {
  @Input() abierto = false;
  @Input() titulo = '';
  @Output() cerrar = new EventEmitter<void>();

  @ViewChild('contenedor') contenedor?: ElementRef<HTMLDivElement>;

  constructor() {
    effect(() => {
      if (this.abierto) {
        document.body.style.overflow = 'hidden';
        queueMicrotask(() => this.contenedor?.nativeElement.focus());
      } else {
        document.body.style.overflow = '';
      }
    });
  }

  onBackdrop(): void {
    this.cerrar.emit();
  }

  onEscape(evento: KeyboardEvent): void {
    if (evento.key === 'Escape') {
      this.cerrar.emit();
    }
  }
}
