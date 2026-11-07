import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { InViewDirective } from '../../../core/animations/in-view.directive';
import { Noticia } from '../../../core/models/api.models';
import { NoticiaService } from '../../../core/services/noticia.service';
import { NotificationService } from '../../../core/services/notification.service';

type Bloque =
  | { tipo: 'subtitulo'; texto: string }
  | { tipo: 'lista'; items: string[] }
  | { tipo: 'parrafo'; texto: string };

@Component({
  selector: 'app-noticia-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, InViewDirective],
  templateUrl: './noticia-detail.component.html',
  styleUrl: './noticia-detail.component.scss',
})
export class NoticiaDetailComponent implements OnInit, OnDestroy {
  private readonly ruta = inject(ActivatedRoute);
  private readonly noticiaService = inject(NoticiaService);
  private readonly notificaciones = inject(NotificationService);

  @ViewChild('articulo') articulo?: ElementRef<HTMLElement>;

  readonly cargando = signal(true);
  readonly noticia = signal<Noticia | null>(null);
  readonly relacionadas = signal<Noticia[]>([]);
  readonly avance = signal(0);

  private readonly onScroll = () => this.actualizarAvance();

  /** Estimated reading time, computed from the real content. */
  readonly tiempoLectura = computed(() => {
    const contenido = this.noticia()?.contenido?.trim() ?? '';
    if (!contenido) {
      return 1;
    }
    const palabras = contenido.split(/\s+/).length;
    return Math.max(1, Math.round(palabras / 200));
  });

  /** Parses the plain-text content into paragraphs, subtitles and lists. */
  readonly bloques = computed<Bloque[]>(() => this.parsear(this.noticia()?.contenido ?? ''));

  ngOnInit(): void {
    const id = Number(this.ruta.snapshot.paramMap.get('id'));
    this.noticiaService.obtener(id).subscribe({
      next: (noticia) => {
        this.noticia.set(noticia);
        this.cargando.set(false);
        this.cargarRelacionadas(noticia);
        setTimeout(() => this.actualizarAvance());
      },
      error: () => this.cargando.set(false),
    });

    window.addEventListener('scroll', this.onScroll, { passive: true });
    window.addEventListener('resize', this.onScroll, { passive: true });
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.onScroll);
    window.removeEventListener('resize', this.onScroll);
  }

  /** Shares via the native sheet, falling back to the clipboard. */
  async compartir(): Promise<void> {
    const noticia = this.noticia();
    if (!noticia) {
      return;
    }
    const url = window.location.href;
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ title: noticia.titulo, text: noticia.resumen, url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        this.notificaciones.exito('Enlace copiado al portapapeles.');
      }
    } catch {
      // The user dismissed the share sheet or the clipboard was blocked.
    }
  }

  private cargarRelacionadas(noticia: Noticia): void {
    // Real data only: same category, current article excluded.
    this.noticiaService
      .listarPublico({ categoria: noticia.categoria, page: 1 })
      .subscribe({
        next: (pagina) =>
          this.relacionadas.set(
            pagina.results.filter((item) => item.id !== noticia.id).slice(0, 3),
          ),
        error: () => this.relacionadas.set([]),
      });
  }

  private actualizarAvance(): void {
    const el = this.articulo?.nativeElement;
    if (!el) {
      return;
    }
    const rect = el.getBoundingClientRect();
    const total = rect.height - window.innerHeight + 120;
    const progreso = total > 0 ? (-rect.top / total) * 100 : 0;
    this.avance.set(Math.min(100, Math.max(0, progreso)));
  }

  private parsear(contenido: string): Bloque[] {
    const bloques: Bloque[] = [];
    let lista: string[] = [];

    const cerrarLista = () => {
      if (lista.length) {
        bloques.push({ tipo: 'lista', items: lista });
        lista = [];
      }
    };

    for (const lineaCruda of contenido.split('\n')) {
      const linea = lineaCruda.trim();
      if (!linea) {
        cerrarLista();
        continue;
      }
      if (linea.startsWith('# ')) {
        cerrarLista();
        bloques.push({ tipo: 'subtitulo', texto: linea.slice(2).trim() });
        continue;
      }
      if (/^([-*•])\s+/.test(linea)) {
        lista.push(linea.replace(/^([-*•])\s+/, ''));
        continue;
      }
      cerrarLista();
      bloques.push({ tipo: 'parrafo', texto: linea });
    }
    cerrarLista();
    return bloques;
  }
}
