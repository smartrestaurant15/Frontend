import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClientService } from '@core/services/http-client.service';
import { DailyMenuDish, DailyMenuResponse } from '../models/daily-menu.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class DailyMenuService {
  private readonly API_URL = '/dailyMenus';

  constructor(private httpClient: HttpClientService) {}

  getDailyMenuDishes(page: number): Observable<ApiResponse<DailyMenuDish[]>> {
    return this.httpClient.get<ApiResponse<DailyMenuDish[]>>(`${this.API_URL}/${page}/page`);
  }

  addDishToMenu(dishId: string): Observable<ApiResponse<string>> {
    return this.httpClient.post<ApiResponse<string>>(`${this.API_URL}/${dishId}/dishes`, {});
  }

  removeDishFromMenu(dishId: string): Observable<ApiResponse<string>> {
    return this.httpClient.delete<ApiResponse<string>>(`${this.API_URL}/${dishId}/dishes`);
  }
}
