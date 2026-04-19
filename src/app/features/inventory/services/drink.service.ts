import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClientService } from '@core/services/http-client.service';
import {
  Drink,
  CreateDrinkDTO,
  UpdateDrinkDTO,
  DrinkResponse,
  DrinkDetailResponse,
  DrinkStockDTO
} from '../models/drink.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class DrinkService {

  constructor(private httpClient: HttpClientService) {}

  /**
   * Listar bebidas paginadas
   * GET /api/drinks/{page}/page
   */
  getDrinks(page: number = 0): Observable<ApiResponse<DrinkResponse[]>> {
    return this.httpClient.get<ApiResponse<DrinkResponse[]>>(`/drinks/${page}/page`);
  }

  /**
   * Obtener detalle de una bebida
   * GET /api/drinks/{id}
   */
  getDrinkById(id: string): Observable<ApiResponse<DrinkDetailResponse>> {
    return this.httpClient.get<ApiResponse<DrinkDetailResponse>>(`/drinks/${id}`);
  }

  /**
   * Crear bebida en categoría
   * POST /api/drinks/{categorieId}/categories
   */
  createDrink(categoryId: string, drink: CreateDrinkDTO): Observable<ApiResponse<string>> {
    return this.httpClient.post<ApiResponse<string>>(`/drinks/${categoryId}/categories`, drink);
  }

  /**
   * Actualizar bebida
   * PUT /api/drinks/{id}
   */
  updateDrink(id: string, drink: UpdateDrinkDTO): Observable<ApiResponse<string>> {
    return this.httpClient.put<ApiResponse<string>>(`/drinks/${id}`, drink);
  }

  /**
   * Eliminar (desactivar) bebida
   * DELETE /api/drinks/{id}
   */
  deleteDrink(id: string): Observable<ApiResponse<string>> {
    return this.httpClient.delete<ApiResponse<string>>(`/drinks/${id}`);
  }

  /**
   * Añadir unidades a bebida
   * PATCH /api/drinks/{id}/add
   */
  addStock(id: string, dto: DrinkStockDTO): Observable<ApiResponse<string>> {
    return this.httpClient.patch<ApiResponse<string>>(`/drinks/${id}/add`, dto);
  }

  /**
   * Descontar unidades de bebida
   * PATCH /api/drinks/{id}/discount
   */
  discountStock(id: string, dto: DrinkStockDTO): Observable<ApiResponse<string>> {
    return this.httpClient.patch<ApiResponse<string>>(`/drinks/${id}/discount`, dto);
  }
}
