import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Paginated, PublicacionForo, RespuestaForo } from '../models/api.models';

export interface PublicacionPayload {
  titulo: string;
  contenido: string;
}

@Injectable({ providedIn: 'root' })
export class ForoService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/foro/publicaciones`;

  listar(): Observable<PublicacionForo[]> {
    return this.http
      .get<Paginated<PublicacionForo>>(`${this.base}/`)
      .pipe(map((pagina) => pagina.results));
  }

  obtener(id: number): Observable<PublicacionForo> {
    return this.http.get<PublicacionForo>(`${this.base}/${id}/`);
  }

  /** Server-side paginated list used by the administrative table. */
  listarPagina(page = 1, search = ''): Observable<Paginated<PublicacionForo>> {
    let params = new HttpParams().set('page', page);
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<Paginated<PublicacionForo>>(`${this.base}/`, { params });
  }

  crear(payload: PublicacionPayload): Observable<PublicacionForo> {
    return this.http.post<PublicacionForo>(`${this.base}/`, payload);
  }

  actualizar(id: number, payload: Partial<PublicacionPayload>): Observable<PublicacionForo> {
    return this.http.patch<PublicacionForo>(`${this.base}/${id}/`, payload);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}/`);
  }

  responder(publicacionId: number, contenido: string): Observable<RespuestaForo> {
    return this.http.post<RespuestaForo>(`${this.base}/${publicacionId}/responder/`, {
      contenido,
    });
  }

  eliminarRespuesta(respuestaId: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/foro/respuestas/${respuestaId}/`);
  }
}
