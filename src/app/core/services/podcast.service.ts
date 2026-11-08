import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Paginated, PlataformaPodcast, Podcast } from '../models/api.models';

export interface PodcastPayload {
  titulo: string;
  descripcion?: string;
  programa?: string;
  plataforma: PlataformaPodcast;
  enlace: string;
  publicado: boolean;
  /** `undefined` leaves the cover untouched, `null` clears it, a File replaces it. */
  portada?: File | null;
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

  /** Server-side paginated list used by the administrative table. */
  listarPagina(
    page = 1,
    search = '',
    publicado: boolean | null = null,
  ): Observable<Paginated<Podcast>> {
    let params = new HttpParams().set('page', page);
    if (search) {
      params = params.set('search', search);
    }
    if (publicado !== null) {
      params = params.set('publicado', String(publicado));
    }
    return this.http.get<Paginated<Podcast>>(`${this.base}/`, { params });
  }

  crear(payload: PodcastPayload): Observable<Podcast> {
    return this.http.post<Podcast>(`${this.base}/`, this.aFormData(payload));
  }

  actualizar(id: number, payload: Partial<PodcastPayload>): Observable<Podcast> {
    if (payload.portada === null) {
      return this.http.patch<Podcast>(`${this.base}/${id}/`, { portada: null });
    }
    return this.http.patch<Podcast>(`${this.base}/${id}/`, this.aFormData(payload));
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}/`);
  }

  private aFormData(payload: Partial<PodcastPayload>): FormData {
    const form = new FormData();
    if (payload.titulo !== undefined) form.append('titulo', payload.titulo);
    if (payload.descripcion !== undefined) form.append('descripcion', payload.descripcion);
    if (payload.programa !== undefined) form.append('programa', payload.programa);
    if (payload.plataforma !== undefined) form.append('plataforma', payload.plataforma);
    if (payload.enlace !== undefined) form.append('enlace', payload.enlace);
    if (payload.publicado !== undefined) form.append('publicado', String(payload.publicado));
    if (payload.portada instanceof File) form.append('portada', payload.portada);
    return form;
  }
}
