import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { SseService } from '../../services/sse.service';
import { NotificationService } from '@core/services/notification.service';
import { Order, OrderStatus, ORDER_STATUS_LABEL, ORDER_STATUS_CLASS } from '../../models/order.model';

@Component({
  selector: 'app-waiter-orders',
  templateUrl: './waiter-orders.component.html',
  styleUrls: ['./waiter-orders.component.scss']
})
export class WaiterOrdersComponent implements OnInit, OnDestroy {

  orders: Order[] = [];
  loading   = false;
  currentPage = 1;
  hasMorePages = true;
  isCreateModalOpen = false;

  selectedStatus?: OrderStatus;

  readonly STATUS_LABEL = ORDER_STATUS_LABEL;
  readonly STATUS_CLASS  = ORDER_STATUS_CLASS;
  readonly STATUS_OPTIONS: { value: OrderStatus | undefined; label: string }[] = [
    { value: undefined,      label: 'Todas' },
    { value: 'PENDING',      label: 'Pendientes' },
    { value: 'IN_PROGRESS',  label: 'En preparación' },
    { value: 'COMPLETED',    label: 'Listas' },
    { value: 'DELIVERED',    label: 'Entregadas' },
    { value: 'CANCELLED',    label: 'Canceladas' }
  ];

  private sseSub?: Subscription;

  constructor(
    private orderService: OrderService,
    private sseService: SseService,
    private notification: NotificationService,
    private router: Router
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
    this.orderService.getOrders(this.currentPage - 1, this.selectedStatus).subscribe({
      next: res => {
        const data = Array.isArray(res.message) ? res.message : [];
        this.orders = data;
        this.hasMorePages = data.length >= 10;
        this.loading = false;
      },
      error: () => {
        this.orders = [];
        this.hasMorePages = false;
        this.loading = false;
      }
    });
  }

  private connectSse(): void {
    this.sseSub = this.sseService.subscribeWaiter().subscribe({
      next: notification => {
        if (notification.type === 'ORDER_READY') {
          this.notification.showSuccess('¡Un pedido está listo para entregar!');
          this.loadOrders();
        }
      },
      error: () => { /* SSE no disponible — la vista funciona sin tiempo real */ }
    });
  }

  filterByStatus(status: OrderStatus | undefined): void {
    this.selectedStatus = status;
    this.currentPage = 1;
    this.loadOrders();
  }

  deliverOrder(order: Order): void {
    this.orderService.updateOrder(order.id, { status: 'DELIVERED' }).subscribe({
      next: () => {
        this.notification.showSuccess(`Orden #${order.id.slice(-6)} entregada`);
        this.loadOrders();
      },
      error: () => this.notification.showError('Error al actualizar la orden')
    });
  }

  cancelOrder(order: Order): void {
    if (!confirm('¿Cancelar esta orden?')) return;
    this.orderService.cancelOrder(order.id).subscribe({
      next: () => {
        this.notification.showSuccess('Orden cancelada');
        this.loadOrders();
      },
      error: () => this.notification.showError('Error al cancelar la orden')
    });
  }

  viewDetail(id: string): void {
    this.router.navigate(['/orders/detail', id]);
  }

  openCreateModal(): void {
    this.isCreateModalOpen = true;
  }

  onOrderCreated(): void {
    this.loadOrders();
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

  canDeliver(order: Order): boolean {
    return order.status === 'COMPLETED';
  }

  canCancel(order: Order): boolean {
    return order.status === 'PENDING' || order.status === 'IN_PROGRESS';
  }

  trackById(_: number, order: Order): string {
    return order.id;
  }
}
