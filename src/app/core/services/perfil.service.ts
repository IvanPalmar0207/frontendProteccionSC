import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Usuario } from '../models/api.models';

export interface PerfilPayload {
  nombre_completo?: string;
  telefono?: string;
  documento?: string;
  direccion?: string;
  fecha_nacimiento?: string | null;
}

@Injectable({ providedIn: 'root' })
export class PerfilService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/perfiles/mi-perfil/`;

  obtener(): Observable<Usuario> {
    return this.http.get<Usuario>(this.url);
  }

  actualizar(payload: PerfilPayload): Observable<Usuario> {
    return this.http.patch<Usuario>(this.url, payload);
  }
}
