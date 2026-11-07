import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Conversacion, Mensaje, Paginated } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/chat/conversaciones`;

  listar(): Observable<Conversacion[]> {
    return this.http
      .get<Paginated<Conversacion>>(`${this.base}/`)
      .pipe(map((pagina) => pagina.results));
  }

  obtener(id: number): Observable<Conversacion> {
    return this.http.get<Conversacion>(`${this.base}/${id}/`);
  }

  abrir(denunciaId: number): Observable<Conversacion> {
    return this.http.post<Conversacion>(`${this.base}/`, { denuncia: denunciaId });
  }

  historial(conversacionId: number): Observable<Mensaje[]> {
    return this.http
      .get<Paginated<Mensaje>>(`${this.base}/${conversacionId}/mensajes/`)
      .pipe(map((pagina) => pagina.results));
  }

  enviar(conversacionId: number, contenido: string): Observable<Mensaje> {
    return this.http.post<Mensaje>(`${this.base}/${conversacionId}/mensajes/`, {
      contenido,
    });
  }

  marcarLeidos(conversacionId: number): Observable<{ actualizados: number }> {
    return this.http.post<{ actualizados: number }>(
      `${this.base}/${conversacionId}/marcar_leidos/`,
      {},
    );
  }
}
