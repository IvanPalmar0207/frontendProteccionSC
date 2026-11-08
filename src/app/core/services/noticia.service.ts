import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { CategoriaNoticia, Noticia, Paginated } from '../models/api.models';

export interface NoticiaPayload {
  titulo: string;
  resumen?: string;
  contenido: string;
  categoria: CategoriaNoticia;
  destacada: boolean;
  publicado: boolean;
  /** `undefined` leaves the image untouched, `null` clears it, a File replaces it. */
  imagen?: File | null;
}

@Injectable({ providedIn: 'root' })
export class NoticiaService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/noticias`;

  listar(categoria?: string): Observable<Noticia[]> {
    const url = categoria ? `${this.base}/?categoria=${encodeURIComponent(categoria)}` : `${this.base}/`;
    return this.http
      .get<Paginated<Noticia>>(url)
      .pipe(map((pagina) => pagina.results));
  }

  obtener(id: number): Observable<Noticia> {
    return this.http.get<Noticia>(`${this.base}/${id}/`);
  }

  /** Server-side paginated list used by the administrative table. */
  listarPagina(
    page = 1,
    search = '',
    publicado: boolean | null = null,
  ): Observable<Paginated<Noticia>> {
    let params = new HttpParams().set('page', page);
    if (search) {
      params = params.set('search', search);
    }
    if (publicado !== null) {
      params = params.set('publicado', String(publicado));
    }
    return this.http.get<Paginated<Noticia>>(`${this.base}/`, { params });
  }

  /** Public paginated list with optional category filter and search. */
  listarPublico(opciones: {
    page?: number;
    search?: string;
    categoria?: string;
  } = {}): Observable<Paginated<Noticia>> {
    let params = new HttpParams().set('page', opciones.page ?? 1);
    if (opciones.search) {
      params = params.set('search', opciones.search);
    }
    if (opciones.categoria) {
      params = params.set('categoria', opciones.categoria);
    }
    return this.http.get<Paginated<Noticia>>(`${this.base}/`, { params });
  }

  crear(payload: NoticiaPayload): Observable<Noticia> {
    return this.http.post<Noticia>(`${this.base}/`, this.aFormData(payload));
  }

  actualizar(id: number, payload: Partial<NoticiaPayload>): Observable<Noticia> {
    // Clearing the image needs a null, which multipart cannot express cleanly.
    if (payload.imagen === null) {
      return this.http.patch<Noticia>(`${this.base}/${id}/`, { imagen: null });
    }
    return this.http.patch<Noticia>(`${this.base}/${id}/`, this.aFormData(payload));
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}/`);
  }

  private aFormData(payload: Partial<NoticiaPayload>): FormData {
    const form = new FormData();
    if (payload.titulo !== undefined) form.append('titulo', payload.titulo);
    if (payload.resumen !== undefined) form.append('resumen', payload.resumen);
    if (payload.contenido !== undefined) form.append('contenido', payload.contenido);
    if (payload.categoria !== undefined) form.append('categoria', payload.categoria);
    if (payload.destacada !== undefined) form.append('destacada', String(payload.destacada));
    if (payload.publicado !== undefined) form.append('publicado', String(payload.publicado));
    if (payload.imagen instanceof File) form.append('imagen', payload.imagen);
    return form;
  }
}
