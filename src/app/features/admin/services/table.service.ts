import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClientService } from '@core/services/http-client.service';
import { RestaurantTable, CreateTableDTO, UpdateTableDTO, TableStatus } from '../models/table.model';

@Injectable({ providedIn: 'root' })
export class TableService {
  constructor(private http: HttpClientService) {}

  getAll(status?: TableStatus): Observable<RestaurantTable[]> {
    const url = status ? `/tables?status=${status}` : '/tables';
    return this.http.get<RestaurantTable[]>(url);
  }

  create(dto: CreateTableDTO): Observable<RestaurantTable> {
    return this.http.post<RestaurantTable>('/tables', dto);
  }

  update(id: string, dto: UpdateTableDTO): Observable<RestaurantTable> {
    return this.http.put<RestaurantTable>(`/tables/${id}`, dto);
  }

  changeStatus(id: string, status: TableStatus): Observable<RestaurantTable> {
    return this.http.patch<RestaurantTable>(`/tables/${id}/status`, { status });
  }

  deactivate(id: string): Observable<void> {
    return this.http.delete<void>(`/tables/${id}`);
  }
}
