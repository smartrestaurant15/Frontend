import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClientService } from '@core/services/http-client.service';
import { 
  Dish, 
  CreateDishDTO, 
  UpdateDishDTO,
  DishResponse,
  DishDetailResponse
} from '../models/dish.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class DishService {

  constructor(private httpClient: HttpClientService) {}

  /**
   * Listar platos paginados
   * GET /api/dishes/{page}/page
   */
  getDishes(page: number = 0, categoryId?: string, menuEligible = false): Observable<ApiResponse<DishResponse[]>> {
    const params = new URLSearchParams();
    if (categoryId) params.set('categoryId', categoryId);
    if (menuEligible) params.set('menuEligible', 'true');
    const query = params.toString();
    const url = `/dishes/${page}/page${query ? '?' + query : ''}`;
    return this.httpClient.get<ApiResponse<DishResponse[]>>(url);
  }

  /**
   * Obtener detalle de un plato
   * GET /api/dishes/{id}
   */
  getDishById(id: string): Observable<ApiResponse<DishDetailResponse>> {
    return this.httpClient.get<ApiResponse<DishDetailResponse>>(`/dishes/${id}`);
  }

  /**
   * Crear plato en categoría
   * POST /api/dishes/{categoryId}/categories
   */
  createDish(categoryId: string, dish: CreateDishDTO): Observable<ApiResponse<string>> {
    return this.httpClient.post<ApiResponse<string>>(`/dishes/${categoryId}/categories`, dish);
  }

  /**
   * Actualizar plato
   * PUT /api/dishes/{id}
   */
  updateDish(id: string, dish: UpdateDishDTO): Observable<ApiResponse<string>> {
    return this.httpClient.put<ApiResponse<string>>(`/dishes/${id}`, dish);
  }

  /**
   * Eliminar (desactivar) plato
   * DELETE /api/dishes/{id}
   */
  deleteDish(id: string): Observable<ApiResponse<string>> {
    return this.httpClient.delete<ApiResponse<string>>(`/dishes/${id}`);
  }
}
