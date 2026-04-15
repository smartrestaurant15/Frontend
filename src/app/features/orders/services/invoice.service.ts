import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClientService } from '@core/services/http-client.service';
import { ApiResponse } from '@features/inventory/models/api-response.model';
import { Invoice, PayPresentialDTO } from '../models/invoice.model';

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {

  constructor(private http: HttpClientService) {}

  /**
   * Obtener factura por ID
   * GET /api/invoices/{id}
   */
  getInvoice(id: string): Observable<ApiResponse<Invoice>> {
    return this.http.get<ApiResponse<Invoice>>(`/invoices/${id}`);
  }

  /**
   * Registrar pago presencial
   * POST /api/invoices/pay/presential
   */
  payPresential(dto: PayPresentialDTO): Observable<ApiResponse<Invoice>> {
    return this.http.post<ApiResponse<Invoice>>('/invoices/pay/presential', dto);
  }
}
