import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { AdminUsuarioService } from '../../../core/services/admin-usuario.service';
import { ForoService } from '../../../core/services/foro.service';
import { NoticiaService } from '../../../core/services/noticia.service';
import { PodcastService } from '../../../core/services/podcast.service';

@Component({
  selector: 'app-admin-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly usuarios = inject(AdminUsuarioService);
  private readonly noticias = inject(NoticiaService);
  private readonly podcasts = inject(PodcastService);
  private readonly foro = inject(ForoService);

  readonly usuario = this.auth.usuarioActual;
  readonly totales = signal({ usuarios: 0, noticias: 0, podcasts: 0, foro: 0 });

  ngOnInit(): void {
    this.usuarios.listar().subscribe({
      next: (lista) => this.totales.update((t) => ({ ...t, usuarios: lista.length })),
    });
    this.noticias.listar().subscribe({
      next: (lista) => this.totales.update((t) => ({ ...t, noticias: lista.length })),
    });
    this.podcasts.listar().subscribe({
      next: (lista) => this.totales.update((t) => ({ ...t, podcasts: lista.length })),
    });
    this.foro.listar().subscribe({
      next: (lista) => this.totales.update((t) => ({ ...t, foro: lista.length })),
      error: () => this.totales.update((t) => ({ ...t, foro: 0 })),
    });
  }
}
