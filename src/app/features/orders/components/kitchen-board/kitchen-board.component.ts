import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { OrderService } from '../../services/order.service';
import { SseService } from '../../services/sse.service';
import { NotificationService } from '@core/services/notification.service';
import { Order, OrderStatus, ORDER_STATUS_LABEL, ORDER_STATUS_CLASS } from '../../models/order.model';

@Component({
  selector: 'app-kitchen-board',
  templateUrl: './kitchen-board.component.html',
  styleUrls: ['./kitchen-board.component.scss']
})
export class KitchenBoardComponent implements OnInit, OnDestroy {

  pendingOrders:    Order[] = [];
  inProgressOrders: Order[] = [];
  completedOrders:  Order[] = [];

  loading = false;
  private sseSub?: Subscription;

  readonly STATUS_LABEL = ORDER_STATUS_LABEL;
  readonly STATUS_CLASS  = ORDER_STATUS_CLASS;

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
    // Cargamos PENDING e IN_PROGRESS (las que interesan a cocina)
    this.orderService.getOrders(0, 'PENDING').subscribe({
      next: res => {
        this.pendingOrders = Array.isArray(res.message) ? res.message : [];
        this.loading = false;
      },
      error: () => { this.pendingOrders = []; this.loading = false; }
    });

    this.orderService.getOrders(0, 'IN_PROGRESS').subscribe({
      next: res => {
        this.inProgressOrders = Array.isArray(res.message) ? res.message : [];
      },
      error: () => { this.inProgressOrders = []; }
    });

    this.orderService.getOrders(0, 'COMPLETED').subscribe({
      next: res => {
        this.completedOrders = Array.isArray(res.message) ? res.message : [];
      },
      error: err => {
        this.completedOrders = [];
      }
    });
  }

  private connectSse(): void {
    this.sseSub = this.sseService.subscribeKitchen().subscribe({
      next: notification => {
        if (notification.type === 'NEW_ORDER') {
          this.notification.showSuccess('¡Nuevo pedido recibido!');
          this.loadOrders();
        }
      },
      error: () => {
        // SSE se desconectó — no mostramos error al usuario, reconectará al recargar
      }
    });
  }

  startOrder(order: Order): void {
    this.orderService.updateOrder(order.id, { status: 'IN_PROGRESS' }).subscribe({
      next: () => {
        this.notification.showSuccess(`Orden #${order.id.slice(-6)} iniciada`);
        this.loadOrders();
      },
      error: () => this.notification.showError('Error al actualizar la orden')
    });
  }

  completeOrder(order: Order): void {
    this.orderService.updateOrder(order.id, { status: 'COMPLETED' }).subscribe({
      next: () => {
        this.notification.showSuccess(`Orden #${order.id.slice(-6)} lista para entregar`);
        this.loadOrders();
      },
      error: () => this.notification.showError('Error al completar la orden')
    });
  }

  trackById(_: number, order: Order): string {
    return order.id;
  }
}
