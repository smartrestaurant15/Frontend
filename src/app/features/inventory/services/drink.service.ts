import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClientService } from '@core/services/http-client.service';
import {
  CreateDrinkDTO,
  UpdateDrinkDTO,
  DrinkResponse,
  DrinkDetailResponse,
  DrinkRestockDTO,
  DrinkStockDTO
} from '../models/drink.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class DrinkService {

  constructor(private httpClient: HttpClientService) {}

  getDrinks(page: number = 0): Observable<ApiResponse<DrinkResponse[]>> {
    return this.httpClient.get<ApiResponse<DrinkResponse[]>>(`/drinks/${page}/page`);
  }

  getDrinkById(id: string): Observable<ApiResponse<DrinkDetailResponse>> {
    return this.httpClient.get<ApiResponse<DrinkDetailResponse>>(`/drinks/${id}`);
  }

  createDrink(categoryId: string, drink: CreateDrinkDTO): Observable<ApiResponse<string>> {
    return this.httpClient.post<ApiResponse<string>>(`/drinks/${categoryId}/categories`, drink);
  }

  updateDrink(id: string, drink: UpdateDrinkDTO): Observable<ApiResponse<string>> {
    return this.httpClient.put<ApiResponse<string>>(`/drinks/${id}`, drink);
  }

  deleteDrink(id: string): Observable<ApiResponse<string>> {
    return this.httpClient.delete<ApiResponse<string>>(`/drinks/${id}`);
  }

  /**
   * Reabastecer bebida SIMPLE: requiere unidades + precio de compra actualizado.
   */
  addStock(id: string, dto: DrinkRestockDTO): Observable<ApiResponse<string>> {
    return this.httpClient.patch<ApiResponse<string>>(`/drinks/${id}/add`, dto);
  }

  discountStock(id: string, dto: DrinkStockDTO): Observable<ApiResponse<string>> {
    return this.httpClient.patch<ApiResponse<string>>(`/drinks/${id}/discount`, dto);
  }

}
