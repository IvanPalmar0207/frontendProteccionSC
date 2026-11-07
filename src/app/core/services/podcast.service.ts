import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Paginated, Podcast } from '../models/api.models';

export interface PodcastPayload {
  titulo: string;
  descripcion?: string;
  audio_url?: string;
  duracion_segundos?: number | null;
  publicado: boolean;
}

@Injectable({ providedIn: 'root' })
export class PodcastService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/podcasts`;

  listar(): Observable<Podcast[]> {
    return this.http
      .get<Paginated<Podcast>>(`${this.base}/`)
      .pipe(map((pagina) => pagina.results));
  }

  obtener(id: number): Observable<Podcast> {
    return this.http.get<Podcast>(`${this.base}/${id}/`);
  }

  crear(payload: PodcastPayload): Observable<Podcast> {
    return this.http.post<Podcast>(`${this.base}/`, payload);
  }

  actualizar(id: number, payload: Partial<PodcastPayload>): Observable<Podcast> {
    return this.http.patch<Podcast>(`${this.base}/${id}/`, payload);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}/`);
  }
}
