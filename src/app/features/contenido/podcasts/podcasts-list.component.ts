import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';

import { InViewDirective } from '../../../core/animations/in-view.directive';
import { PlataformaPodcast, Podcast } from '../../../core/models/api.models';
import { PodcastService } from '../../../core/services/podcast.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-podcasts-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, EmptyStateComponent, InViewDirective],
  templateUrl: './podcasts-list.component.html',
  styleUrl: './podcasts-list.component.scss',
})
export class PodcastsListComponent implements OnInit {
  private readonly podcastService = inject(PodcastService);

  readonly cargando = signal(true);
  readonly podcasts = signal<Podcast[]>([]);

  readonly destacado = computed<Podcast | null>(() => this.podcasts()[0] ?? null);
  readonly episodios = computed(() => this.podcasts().slice(1));

  ngOnInit(): void {
    this.podcastService.listar().subscribe({
      next: (lista) => {
        this.podcasts.set(lista);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  iconoPlataforma(plataforma: PlataformaPodcast): string {
    switch (plataforma) {
      case 'SPOTIFY':
        return '🎧';
      case 'YOUTUBE':
        return '▶️';
      case 'APPLE_PODCASTS':
        return '🎙️';
      default:
        return '🔗';
    }
  }

  /** Opens the externally hosted episode safely in a new tab. */
  escuchar(podcast: Podcast): void {
    window.open(podcast.enlace, '_blank', 'noopener,noreferrer');
  }
}
