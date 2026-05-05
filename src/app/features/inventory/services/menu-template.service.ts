import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClientService } from '@core/services/http-client.service';
import { ApiResponse } from '../models/api-response.model';
import { CreateMenuTemplateRequest, MenuTemplateDTO } from '../models/menu.model';

@Injectable({ providedIn: 'root' })
export class MenuTemplateService {
  constructor(private http: HttpClientService) {}

  getAll(): Observable<ApiResponse<MenuTemplateDTO[]>> {
    return this.http.get<ApiResponse<MenuTemplateDTO[]>>('/menu/templates');
  }

  getById(id: string): Observable<ApiResponse<MenuTemplateDTO>> {
    return this.http.get<ApiResponse<MenuTemplateDTO>>(`/menu/templates/${id}`);
  }

  create(request: CreateMenuTemplateRequest): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>('/menu/templates', request);
  }

  delete(id: string): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(`/menu/templates/${id}`);
  }
}
