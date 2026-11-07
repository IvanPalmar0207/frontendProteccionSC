import { Directive, ElementRef, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { inView } from 'motion';

export type RevealDireccion = 'up' | 'down' | 'left' | 'right' | 'scale' | 'fade';

function prefiereMenosMovimiento(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
  );
}

/**
 * Reveals an element when it enters the viewport.
 *
 * Uses Motion's `inView` (MIT) to observe, and CSS for the transition so the
 * animation stays off the main thread. When the user prefers reduced motion
 * the element is shown immediately. The observer is always disconnected on
 * destroy.
 *
 * Usage: `<div appInView="up" [retraso]="120">…</div>`
 */
@Directive({
  selector: '[appInView]',
  standalone: true,
})
export class InViewDirective implements OnInit, OnDestroy {
  @Input('appInView') direccion: RevealDireccion | '' = 'up';
  @Input() retraso = 0;

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private detener?: () => void;

  ngOnInit(): void {
    const nodo = this.el.nativeElement;
    const direccion: RevealDireccion = this.direccion || 'up';
    if (prefiereMenosMovimiento()) {
      nodo.classList.add('reveal', 'is-visible');
      return;
    }

    nodo.classList.add('reveal', `reveal--${direccion}`);
    if (this.retraso) {
      nodo.style.transitionDelay = `${this.retraso}ms`;
    }

    this.detener = inView(
      nodo,
      () => {
        nodo.classList.add('is-visible');
        // Reveal once; stop observing after the first entrance.
        return () => this.detener?.();
      },
      { amount: 0.15, margin: '0px 0px -60px 0px' },
    );
  }

  ngOnDestroy(): void {
    this.detener?.();
  }
}
