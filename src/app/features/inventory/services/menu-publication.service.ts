import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClientService } from '@core/services/http-client.service';
import { ApiResponse, PaginatedResponse } from '../models/api-response.model';
import {
  AdjustPortionsRequest,
  AddPublicationSectionRequest,
  AddSectionOptionRequest,
  CreateMenuPublicationRequest,
  MenuPublicationDTO,
  MenuPublicationSummaryDTO,
  UpdateMenuPublicationRequest,
  ActiveMenuDTO
} from '../models/menu.model';

@Injectable({ providedIn: 'root' })
export class MenuPublicationService {
  constructor(private http: HttpClientService) {}

  // ── Publicaciones ───────────────────────────────────────────────────────────

  getAll(page: number): Observable<ApiResponse<PaginatedResponse<MenuPublicationSummaryDTO>>> {
    return this.http.get<ApiResponse<PaginatedResponse<MenuPublicationSummaryDTO>>>(`/menu/publications/${page}/page`);
  }

  getById(id: string): Observable<ApiResponse<MenuPublicationDTO>> {
    return this.http.get<ApiResponse<MenuPublicationDTO>>(`/menu/publications/${id}`);
  }

  create(request: CreateMenuPublicationRequest): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>('/menu/publications', request);
  }

  update(id: string, request: UpdateMenuPublicationRequest): Observable<ApiResponse<string>> {
    return this.http.put<ApiResponse<string>>(`/menu/publications/${id}`, request);
  }

  delete(id: string): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(`/menu/publications/${id}`);
  }

  publish(id: string): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`/menu/publications/${id}/publish`, {});
  }

  close(id: string): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`/menu/publications/${id}/close`, {});
  }

  adjustPortions(id: string, request: AdjustPortionsRequest): Observable<ApiResponse<string>> {
    return this.http.patch<ApiResponse<string>>(`/menu/publications/${id}/portions`, request);
  }

  // ── Secciones ───────────────────────────────────────────────────────────────

  addSection(publicationId: string, request: AddPublicationSectionRequest): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`/menu/publications/${publicationId}/sections`, request);
  }

  deleteSection(publicationId: string, sectionId: string): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(`/menu/publications/${publicationId}/sections/${sectionId}`);
  }

  // ── Opciones ────────────────────────────────────────────────────────────────

  addOption(publicationId: string, sectionId: string, request: AddSectionOptionRequest): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(
      `/menu/publications/${publicationId}/sections/${sectionId}/options`, request);
  }

  deleteOption(publicationId: string, sectionId: string, optionId: string): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(
      `/menu/publications/${publicationId}/sections/${sectionId}/options/${optionId}`);
  }

  toggleOption(publicationId: string, sectionId: string, optionId: string): Observable<ApiResponse<string>> {
    return this.http.patch<ApiResponse<string>>(
      `/menu/publications/${publicationId}/sections/${sectionId}/options/${optionId}/toggle`, {});
  }

  // ── Menú Activo ─────────────────────────────────────────────────────────────

  getActive(): Observable<ApiResponse<ActiveMenuDTO | null>> {
    return this.http.get<ApiResponse<ActiveMenuDTO | null>>('/menu/publications/active');
  }
}
