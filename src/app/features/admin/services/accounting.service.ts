import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { HttpClientService } from '@core/services/http-client.service';
import { AccountingSummary } from '../models/accounting.model';

@Injectable({ providedIn: 'root' })
export class AccountingService {
  constructor(private httpClient: HttpClientService) {}

  getSummary(from: string, to: string): Observable<AccountingSummary> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.httpClient.get<AccountingSummary>('/accounting/summary', params);
  }
}
