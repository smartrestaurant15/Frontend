import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HttpClientService } from '@core/services/http-client.service';
import { ApiResponse } from '@features/inventory/models/api-response.model';
import {
  Order,
  OrderDetail,
  OrderStatus,
  OrderChannel,
  CreateOrderDTO,
  UpdateOrderDTO
} from '../models/order.model';
import { Invoice } from '../models/invoice.model';

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  constructor(private http: HttpClientService) {}

  /**
   * Listar órdenes con filtros opcionales
   * GET /api/orders/{page}/page?status=&channel=
   */
  getOrders(page: number, status?: OrderStatus, channel?: OrderChannel): Observable<ApiResponse<Order[]>> {
    let params = new HttpParams();
    if (status)  params = params.set('status', status);
    if (channel) params = params.set('channel', channel);
    return this.http.get<ApiResponse<Order[]>>(`/orders/${page}/page`, params);
  }

  /**
   * Detalle de una orden
   * GET /api/orders/{id}
   */
  getOrderById(id: string): Observable<ApiResponse<OrderDetail>> {
    return this.http.get<ApiResponse<OrderDetail>>(`/orders/${id}`);
  }

  /**
   * Crear orden (mesero)
   * POST /api/orders
   */
  createOrder(dto: CreateOrderDTO): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>('/orders', dto);
  }

  /**
   * Actualizar estado de una orden
   * PUT /api/orders/{id}
   */
  updateOrder(id: string, dto: UpdateOrderDTO): Observable<ApiResponse<string>> {
    return this.http.put<ApiResponse<string>>(`/orders/${id}`, dto);
  }

  /**
   * Cancelar orden
   * PATCH /api/orders/{id}/cancel
   */
  cancelOrder(id: string): Observable<ApiResponse<string>> {
    return this.http.patch<ApiResponse<string>>(`/orders/${id}/cancel`, {});
  }

  /**
   * Órdenes del cliente autenticado
   * GET /api/orders/me/{page}/page
   */
  getMyOrders(page: number): Observable<ApiResponse<Order[]>> {
    return this.http.get<ApiResponse<Order[]>>(`/orders/me/${page}/page`);
  }

  /**
   * Factura asociada a una orden
   * GET /api/orders/{id}/invoice
   */
  getInvoiceByOrder(orderId: string): Observable<ApiResponse<Invoice>> {
    return this.http.get<ApiResponse<Invoice>>(`/orders/${orderId}/invoice`);
  }
}
