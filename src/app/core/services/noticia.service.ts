import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Noticia, Paginated } from '../models/api.models';

export interface NoticiaPayload {
  titulo: string;
  resumen?: string;
  contenido: string;
  publicado: boolean;
}

@Injectable({ providedIn: 'root' })
export class NoticiaService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/noticias`;

  listar(): Observable<Noticia[]> {
    return this.http
      .get<Paginated<Noticia>>(`${this.base}/`)
      .pipe(map((pagina) => pagina.results));
  }

  obtener(id: number): Observable<Noticia> {
    return this.http.get<Noticia>(`${this.base}/${id}/`);
  }

  crear(payload: NoticiaPayload): Observable<Noticia> {
    return this.http.post<Noticia>(`${this.base}/`, payload);
  }

  actualizar(id: number, payload: Partial<NoticiaPayload>): Observable<Noticia> {
    return this.http.patch<Noticia>(`${this.base}/${id}/`, payload);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}/`);
  }
}
