import { Directive, ElementRef, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { animate, scroll } from 'motion';

/**
 * Subtle parallax: translates the element a few percent as the page scrolls.
 * Disabled entirely when the user prefers reduced motion. The scroll control
 * is always cleaned up on destroy.
 *
 * Usage: `<img appParallax [intensidad]="3" …>`
 */
@Directive({
  selector: '[appParallax]',
  standalone: true,
})
export class ParallaxDirective implements OnInit, OnDestroy {
  /** Percentage of vertical travel (each direction). */
  @Input() intensidad = 3;

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private detener?: VoidFunction;

  ngOnInit(): void {
    const reducido = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
    if (reducido) {
      return;
    }
    const nodo = this.el.nativeElement;
    const control = animate(
      nodo,
      { y: [`-${this.intensidad}%`, `${this.intensidad}%`] },
      { ease: 'linear' },
    );
    this.detener = scroll(control, { target: nodo });
  }

  ngOnDestroy(): void {
    this.detener?.();
  }
}
