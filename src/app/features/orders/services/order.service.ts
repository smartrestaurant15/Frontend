import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HttpClientService } from '@core/services/http-client.service';
import { ResponseDTO } from '../models/response-dto.model';
import {
  Order,
  OrderDetail,
  OrderStatus,
  OrderChannel,
  CreateOrderDTO,
  CreateOrderItemDTO,
  UpdateOrderDTO
} from '../models/order.model';
import { Invoice } from '../models/invoice.model';

@Injectable({ providedIn: 'root' })
export class OrderService {

  constructor(private http: HttpClientService) {}

  /** GET /api/orders/{page}/page?status=&channel= */
  getOrders(page: number, status?: OrderStatus, channel?: OrderChannel): Observable<ResponseDTO<Order[]>> {
    let params = new HttpParams();
    if (status)  params = params.set('status', status);
    if (channel) params = params.set('channel', channel);
    return this.http.get<ResponseDTO<Order[]>>(`/orders/${page}/page`, params);
  }

  /** GET /api/orders/{id} */
  getOrderById(id: string): Observable<ResponseDTO<OrderDetail>> {
    return this.http.get<ResponseDTO<OrderDetail>>(`/orders/${id}`);
  }

  /** POST /api/orders */
  createOrder(dto: CreateOrderDTO): Observable<ResponseDTO<string>> {
    return this.http.post<ResponseDTO<string>>('/orders', dto);
  }

  /** PUT /api/orders/{id} */
  updateOrder(id: string, dto: UpdateOrderDTO): Observable<ResponseDTO<string>> {
    return this.http.put<ResponseDTO<string>>(`/orders/${id}`, dto);
  }

  /** PATCH /api/orders/{id}/cancel */
  cancelOrder(id: string): Observable<ResponseDTO<string>> {
    return this.http.patch<ResponseDTO<string>>(`/orders/${id}/cancel`, {});
  }

  /**
   * DELETE /api/orders/{id}/abandon
   * Elimina una orden online PENDING cuyo pago fue abandonado por el cliente.
   * Los ítems del carrito se conservan en el frontend (no se llama a cart.clear()).
   */
  abandonOrder(id: string): Observable<ResponseDTO<string>> {
    return this.http.delete<ResponseDTO<string>>(`/orders/${id}/abandon`);
  }

  /** GET /api/orders/me/{page}/page */
  getMyOrders(page: number): Observable<ResponseDTO<Order[]>> {
    return this.http.get<ResponseDTO<Order[]>>(`/orders/me/${page}/page`);
  }

  /** GET /api/orders/{id}/invoice */
  getInvoiceByOrder(orderId: string): Observable<ResponseDTO<Invoice>> {
    return this.http.get<ResponseDTO<Invoice>>(`/orders/${orderId}/invoice`);
  }

  /** PATCH /api/orders/{id}/items */
  editOrderItems(id: string, items: CreateOrderItemDTO[]): Observable<ResponseDTO<string>> {
    return this.http.patch<ResponseDTO<string>>(`/orders/${id}/items`, { items });
  }
}
