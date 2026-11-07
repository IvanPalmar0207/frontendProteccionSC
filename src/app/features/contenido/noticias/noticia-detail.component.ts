import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { Noticia } from '../../../core/models/api.models';
import { NoticiaService } from '../../../core/services/noticia.service';

@Component({
  selector: 'app-noticia-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe],
  templateUrl: './noticia-detail.component.html',
  styleUrl: './noticia-detail.component.scss',
})
export class NoticiaDetailComponent implements OnInit {
  private readonly ruta = inject(ActivatedRoute);
  private readonly noticiaService = inject(NoticiaService);

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
}
