import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Notificacion, Paginated } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class NotificacionService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/notificaciones`;

  listar(): Observable<Notificacion[]> {
    return this.http
      .get<Paginated<Notificacion>>(`${this.base}/`)
      .pipe(map((pagina) => pagina.results));
  }

  contarNoLeidas(): Observable<number> {
    return this.http
      .get<{ no_leidas: number }>(`${this.base}/no_leidas/`)
      .pipe(map((respuesta) => respuesta.no_leidas));
  }

  marcarLeida(id: number): Observable<Notificacion> {
    return this.http.post<Notificacion>(`${this.base}/${id}/marcar_leida/`, {});
  }

  marcarTodasLeidas(): Observable<{ detail: string }> {
    return this.http.post<{ detail: string }>(`${this.base}/marcar_todas_leidas/`, {});
  }
}
