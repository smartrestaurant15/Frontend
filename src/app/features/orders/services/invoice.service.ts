import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClientService } from '@core/services/http-client.service';
import { ResponseDTO } from '../models/response-dto.model';
import { Invoice, PayPresentialDTO } from '../models/invoice.model';

@Injectable({ providedIn: 'root' })
export class InvoiceService {

  constructor(private http: HttpClientService) {}

  /** GET /api/invoices/{id} */
  getInvoice(id: string): Observable<ResponseDTO<Invoice>> {
    return this.http.get<ResponseDTO<Invoice>>(`/invoices/${id}`);
  }

  /** POST /api/invoices/{id}/pay-presential */
  payPresential(invoiceId: string, dto: PayPresentialDTO): Observable<ResponseDTO<Invoice>> {
    return this.http.post<ResponseDTO<Invoice>>(`/invoices/${invoiceId}/pay-presential`, dto);
  }
}
