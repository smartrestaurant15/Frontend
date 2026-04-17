import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpClientService } from '@core/services/http-client.service';
import { DashboardData } from '../models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private http: HttpClientService) {}

  getDashboard(): Observable<DashboardData> {
    return this.http.get<DashboardData>('/dashboard');
  }
}
