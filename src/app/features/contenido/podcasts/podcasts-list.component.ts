import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';

import { Podcast } from '../../../core/models/api.models';
import { PodcastService } from '../../../core/services/podcast.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-podcasts-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmptyStateComponent],
  templateUrl: './podcasts-list.component.html',
  styleUrl: './podcasts-list.component.scss',
})
export class PodcastsListComponent implements OnInit {
  private readonly podcastService = inject(PodcastService);

  readonly cargando = signal(true);
  readonly podcasts = signal<Podcast[]>([]);

  ngOnInit(): void {
    this.podcastService.listar().subscribe({
      next: (lista) => {
        this.podcasts.set(lista);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  duracion(segundos: number | null): string {
    if (!segundos) {
      return 'Duración no indicada';
    }
    const minutos = Math.floor(segundos / 60);
    const resto = segundos % 60;
    return `${minutos}:${resto.toString().padStart(2, '0')}`;
  }
}
