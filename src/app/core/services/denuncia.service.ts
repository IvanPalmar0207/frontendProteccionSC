import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  CrearDenuncia,
  Denuncia,
  EstadoDenuncia,
  Modalidad,
  Paginated,
} from '../models/api.models';

export interface FiltrosProfesional {
  estado?: EstadoDenuncia | '';
  modalidad?: Modalidad | '';
}

export interface FiltrosAdmin {
  estado?: EstadoDenuncia | '';
  /** `pendientes` = unassigned; `asignadas` = with a professional. */
  asignacion?: 'pendientes' | 'asignadas' | '';
}

export interface ProfesionalResumen {
  id: number;
  nombre_completo: string;
  casos_activos: number;
}

/** Result shape returned by the report creation endpoint. */
export interface CreacionDenuncia {
  detail: string;
  denuncia: Denuncia;
}

@Injectable({ providedIn: 'root' })
export class DenunciaService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/denuncias`;

  listarPropias(): Observable<Denuncia[]> {
    return this.http
      .get<Paginated<Denuncia>>(`${this.base}/mis-denuncias/`)
      .pipe(map((pagina) => pagina.results));
  }

  obtenerPropia(id: number): Observable<Denuncia> {
    return this.http.get<Denuncia>(`${this.base}/mis-denuncias/${id}/`);
  }

  crear(payload: CrearDenuncia): Observable<CreacionDenuncia> {
    return this.http.post<CreacionDenuncia>(`${this.base}/mis-denuncias/`, payload);
  }

  /** Only the cases assigned to the authenticated professional (backend-guaranteed). */
  listarProfesional(filtros: FiltrosProfesional = {}): Observable<Denuncia[]> {
    let params = new HttpParams();
    if (filtros.estado) {
      params = params.set('estado', filtros.estado);
    }
    if (filtros.modalidad) {
      params = params.set('modalidad', filtros.modalidad);
    }
    return this.http
      .get<Paginated<Denuncia>>(`${this.base}/profesional/`, { params })
      .pipe(map((pagina) => pagina.results));
  }

  obtenerProfesional(id: number): Observable<Denuncia> {
    return this.http.get<Denuncia>(`${this.base}/profesional/${id}/`);
  }

  // -- Administración de casos (asignación manual) --------------------------

  listarAdmin(filtros: FiltrosAdmin = {}): Observable<Denuncia[]> {
    let params = new HttpParams();
    if (filtros.estado) {
      params = params.set('estado', filtros.estado);
    }
    if (filtros.asignacion) {
      params = params.set('asignacion', filtros.asignacion);
    }
    return this.http
      .get<Paginated<Denuncia>>(`${this.base}/admin/`, { params })
      .pipe(map((pagina) => pagina.results));
  }

  listarProfesionales(): Observable<ProfesionalResumen[]> {
    return this.http.get<ProfesionalResumen[]>(`${this.base}/admin/profesionales/`);
  }

  asignar(id: number, profesionalId: number): Observable<Denuncia> {
    return this.http.post<Denuncia>(`${this.base}/admin/${id}/asignar/`, {
      profesional: profesionalId,
    });
  }

  cambiarEstado(
    id: number,
    estado: EstadoDenuncia,
    observacion = '',
  ): Observable<Denuncia> {
    return this.http.post<Denuncia>(`${this.base}/profesional/${id}/cambiar_estado/`, {
      estado,
      observacion,
    });
  }
}
