import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { InViewDirective } from '../../../core/animations/in-view.directive';
import { Noticia } from '../../../core/models/api.models';
import { NoticiaService } from '../../../core/services/noticia.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-noticia-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, InViewDirective],
  templateUrl: './noticia-detail.component.html',
  styleUrl: './noticia-detail.component.scss',
})
export class NoticiaDetailComponent implements OnInit {
  private readonly ruta = inject(ActivatedRoute);
  private readonly noticiaService = inject(NoticiaService);
  private readonly notificaciones = inject(NotificationService);

  readonly cargando = signal(true);
  readonly noticia = signal<Noticia | null>(null);

  ngOnInit(): void {
    const id = Number(this.ruta.snapshot.paramMap.get('id'));
    this.noticiaService.obtener(id).subscribe({
      next: (noticia) => {
        this.noticia.set(noticia);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  /** Shares via the native sheet, falling back to the clipboard. */
  async compartir(): Promise<void> {
    const noticia = this.noticia();
    if (!noticia) {
      return;
    }
    const url = window.location.href;
    const compartirNativo = 'share' in navigator;
    try {
      if (compartirNativo) {
        await navigator.share({ title: noticia.titulo, text: noticia.resumen, url });
      } else {
        await navigator.clipboard.writeText(url);
        this.notificaciones.exito('Enlace copiado al portapapeles.');
      }
    } catch {
      // The user dismissed the share sheet or the clipboard was blocked.
    }
  }
}
