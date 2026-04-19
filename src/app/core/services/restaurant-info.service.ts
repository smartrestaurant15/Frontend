import { Injectable } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpClientService } from './http-client.service';

export interface RestaurantInfo {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  openingTime: string;  // "HH:mm:ss"
  closingTime: string;
  openDays: string;
  logoUrl: string | null;
}

interface ApiResponse<T> {
  data: T;
  error: boolean;
}

@Injectable({ providedIn: 'root' })
export class RestaurantInfoService {

  // Cache para no repetir la llamada en cada componente
  private info$: Observable<RestaurantInfo> | null = null;

  constructor(private http: HttpClientService) {}

  get(): Observable<RestaurantInfo> {
    if (!this.info$) {
      this.info$ = this.http.get<ApiResponse<RestaurantInfo>>('/restaurant')
        .pipe(
          map(res => res.data),
          shareReplay(1)
        );
    }
    return this.info$;
  }

  isOpen(): Observable<boolean> {
    return this.http.get<ApiResponse<boolean>>('/restaurant/is-open')
      .pipe(map(res => res.data));
  }

  /** Formatea "HH:mm:ss" → "HH:mm" */
  formatTime(time: string): string {
    return time?.substring(0, 5) ?? '';
  }
}
