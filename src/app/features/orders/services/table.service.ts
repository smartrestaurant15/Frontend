import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HttpClientService } from '@core/services/http-client.service';

export interface TableDTO {
  id: string;
  number: number;
  capacity: number;
  status: 'FREE' | 'OCCUPIED' | 'RESERVED';
  location: string;
  active: boolean;
}

@Injectable({ providedIn: 'root' })
export class TableService {
  constructor(private http: HttpClientService) {}

  /** GET /api/tables?status=FREE */
  getTables(status?: 'FREE' | 'OCCUPIED' | 'RESERVED'): Observable<TableDTO[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<TableDTO[]>('/tables', params);
  }
}
