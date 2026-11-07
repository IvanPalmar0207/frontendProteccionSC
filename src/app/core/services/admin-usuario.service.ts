import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Paginated, Rol, Usuario } from '../models/api.models';

export interface AdminUsuarioPayload {
  role?: Rol;
  is_active?: boolean;
  nombre_completo?: string;
  telefono?: string;
  documento?: string;
}

/** Administrator-only account management. */
@Injectable({ providedIn: 'root' })
export class AdminUsuarioService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/auth/usuarios`;

  listar(): Observable<Usuario[]> {
    return this.http
      .get<Paginated<Usuario>>(`${this.base}/`)
      .pipe(map((pagina) => pagina.results));
  }

  actualizar(id: number, payload: AdminUsuarioPayload): Observable<Usuario> {
    return this.http.patch<Usuario>(`${this.base}/${id}/`, payload);
  }
}
