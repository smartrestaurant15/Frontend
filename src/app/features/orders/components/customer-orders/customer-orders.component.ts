import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { OrderService } from '../../services/order.service';
import { SseService } from '../../services/sse.service';
import { NotificationService } from '@core/services/notification.service';
import { Order, OrderDetail, ORDER_STATUS_LABEL, ORDER_STATUS_CLASS } from '../../models/order.model';

@Component({
  selector: 'app-customer-orders',
  templateUrl: './customer-orders.component.html',
  styleUrls: ['./customer-orders.component.scss']
})
export class CustomerOrdersComponent implements OnInit, OnDestroy {

  orders: Order[] = [];
  selectedOrder: OrderDetail | null = null;
  loading        = false;
  loadingDetail  = false;
  currentPage    = 1;
  hasMorePages   = true;

  readonly STATUS_LABEL = ORDER_STATUS_LABEL;
  readonly STATUS_CLASS  = ORDER_STATUS_CLASS;

  private sseSub?: Subscription;

  constructor(
    private orderService: OrderService,
    private sseService: SseService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadOrders();
    this.connectSse();
  }

  ngOnDestroy(): void {
    this.sseSub?.unsubscribe();
  }

  loadOrders(): void {
    this.loading = true;
    this.orderService.getMyOrders(this.currentPage - 1).subscribe({
      next: res => {
        const data = Array.isArray(res.message) ? res.message : [];
        this.orders = data;
        this.hasMorePages = data.length >= 10;
        this.loading = false;
      },
      error: err => {
        if (err?.status !== 404) this.notification.showError('Error al cargar tus órdenes');
        this.orders = [];
        this.hasMorePages = false;
        this.loading = false;
      }
    });
  }

  private connectSse(): void {
    this.sseSub = this.sseService.subscribeCustomer().subscribe({
      next: notification => {
        if (notification.type === 'YOUR_ORDER_READY') {
          this.notification.showSuccess('¡Tu pedido está listo!');
          this.loadOrders();
        }
      },
      error: () => { /* SSE no disponible — la vista funciona sin tiempo real */ }
    });
  }

  viewDetail(id: string): void {
    this.loadingDetail = true;
    this.orderService.getOrderById(id).subscribe({
      next: res => {
        this.selectedOrder = res.message as OrderDetail;
        this.loadingDetail = false;
      },
      error: () => {
        this.notification.showError('Error al cargar el detalle');
        this.loadingDetail = false;
      }
    });
  }

  closeDetail(): void {
    this.selectedOrder = null;
  }

  nextPage(): void {
    this.currentPage++;
    this.loadOrders();
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadOrders();
    }
  }

  /** Devuelve true si el estado actual es igual o posterior al paso dado */
  isStepDone(current: string, step: string): boolean {
    const order = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'DELIVERED'];
    return order.indexOf(current) >= order.indexOf(step);
  }

  trackById(_: number, order: Order): string {
    return order.id;
  }
}
