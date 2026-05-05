import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClientService } from '@core/services/http-client.service';
import {
  CreateAdditionDTO,
  UpdateAdditionDTO,
  AdditionRestockDTO,
  AdditionResponse,
  AdditionDetailResponse
} from '../models/addition.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class AdditionService {

  constructor(private httpClient: HttpClientService) {}

  /**
   * Listar adiciones paginadas
   * GET /api/additions/{page}/page
   */
  getAdditions(page: number = 0): Observable<ApiResponse<AdditionResponse[]>> {
    return this.httpClient.get<ApiResponse<AdditionResponse[]>>(`/additions/${page}/page`);
  }

  /**
   * Obtener detalle de una adición
   * GET /api/additions/{id}
   */
  getAdditionById(id: string): Observable<ApiResponse<AdditionDetailResponse>> {
    return this.httpClient.get<ApiResponse<AdditionDetailResponse>>(`/additions/${id}`);
  }

  /**
   * Crear adición
   * POST /api/additions
   */
  createAddition(addition: CreateAdditionDTO): Observable<ApiResponse<string>> {
    return this.httpClient.post<ApiResponse<string>>('/additions', addition);
  }

  /**
   * Actualizar adición
   * PUT /api/additions/{id}
   */
  updateAddition(id: string, addition: UpdateAdditionDTO): Observable<ApiResponse<string>> {
    return this.httpClient.put<ApiResponse<string>>(`/additions/${id}`, addition);
  }

  /**
   * Eliminar (desactivar) adición
   * DELETE /api/additions/{id}
   */
  deleteAddition(id: string): Observable<ApiResponse<string>> {
    return this.httpClient.delete<ApiResponse<string>>(`/additions/${id}`);
  }

  /**
   * Reabastecer adición simple: añade unidades y actualiza precio de compra.
   * PATCH /api/additions/{id}/add
   */
  addStock(id: string, dto: AdditionRestockDTO): Observable<ApiResponse<string>> {
    return this.httpClient.patch<ApiResponse<string>>(`/additions/${id}/add`, dto);
  }
}
