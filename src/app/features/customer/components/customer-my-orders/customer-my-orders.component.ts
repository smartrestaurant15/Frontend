import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription, timer } from 'rxjs';
import { OrderService } from '@features/orders/services/order.service';
import { SseService } from '@features/orders/services/sse.service';
import { NotificationService } from '@core/services/notification.service';
import { Order, OrderDetail, ORDER_STATUS_LABEL } from '@features/orders/models/order.model';

@Component({
  selector: 'app-customer-my-orders',
  templateUrl: './customer-my-orders.component.html',
  styleUrls: ['./customer-my-orders.component.scss']
})
export class CustomerMyOrdersComponent implements OnInit, OnDestroy {

  orders:      Order[] = [];
  loading      = false;
  currentPage  = 1;
  hasMorePages = false;

  selectedOrder: OrderDetail | null = null;
  loadingDetail  = false;

  private sseSub?: Subscription;
  private reconnectSub?: Subscription;
  private sseRetries = 0;

  readonly STATUS_LABEL = ORDER_STATUS_LABEL;

  readonly statusBadge: Record<string, string> = {
    PENDING:     'bg-amber-400/10 text-amber-400 border-amber-400/20',
    IN_PROGRESS: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
    COMPLETED:   'bg-[#e6c487]/10 text-[#e6c487] border-[#e6c487]/20',
    DELIVERED:   'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
    CANCELLED:   'bg-red-400/10 text-red-400 border-red-400/20',
  };

  readonly STEPS = [
    { key: 'PENDING',     label: 'Recibido',   icon: 'receipt_long'    },
    { key: 'IN_PROGRESS', label: 'Preparando', icon: 'soup_kitchen'    },
    { key: 'COMPLETED',   label: 'Listo',      icon: 'check_circle'    },
    { key: 'DELIVERED',   label: 'Entregado',  icon: 'done_all'        },
  ];

  private readonly ORDER_SEQUENCE = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'DELIVERED'];

  constructor(
    private orderService: OrderService,
    private sseService: SseService,
    private notification: NotificationService,
    private router: Router,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.loadOrders();
    this.connectSse();
  }

  ngOnDestroy(): void {
    this.sseSub?.unsubscribe();
    this.reconnectSub?.unsubscribe();
  }

  loadOrders(): void {
    this.loading = true;
    this.orderService.getMyOrders(this.currentPage - 1).subscribe({
      next: res => {
        const data = Array.isArray(res.data) ? res.data : [];
        this.orders = data;
        this.hasMorePages = data.length >= 10;
        this.loading = false;
      },
      error: () => { this.orders = []; this.loading = false; }
    });
  }

  private connectSse(): void {
    this.sseSub?.unsubscribe();
    this.ngZone.runOutsideAngular(() => {
      this.sseSub = this.sseService.subscribeCustomer().subscribe({
        next: notif => {
          this.ngZone.run(() => {
            if (notif.type === 'YOUR_ORDER_READY') {
              this.notification.showSuccess('Tu pedido está listo');
              this.loadOrders();
              if (this.selectedOrder) this.refreshDetail(this.selectedOrder.id);
            }
          });
        },
        error: () => {
          this.ngZone.run(() => {
            if (this.sseRetries < 8) {
              const delay = Math.min(2000 * Math.pow(2, this.sseRetries++), 60000);
              this.reconnectSub = timer(delay).subscribe(() => this.connectSse());
            }
          });
        }
      });
    });
  }

  openDetail(order: Order): void {
    if (this.selectedOrder?.id === order.id) { this.selectedOrder = null; return; }
    this.refreshDetail(order.id);
  }

  private refreshDetail(id: string): void {
    this.loadingDetail = true;
    this.orderService.getOrderById(id).subscribe({
      next: res => { this.selectedOrder = res.data ?? null; this.loadingDetail = false; },
      error: () => { this.loadingDetail = false; }
    });
  }

  closeDetail(): void { this.selectedOrder = null; }

  isStepDone(current: string, step: string): boolean {
    return this.ORDER_SEQUENCE.indexOf(current) >= this.ORDER_SEQUENCE.indexOf(step);
  }

  isStepActive(current: string, step: string): boolean {
    return current === step;
  }

  nextPage():     void { this.currentPage++;                              this.loadOrders(); }
  previousPage(): void { if (this.currentPage > 1) { this.currentPage--; this.loadOrders(); } }

  goHome():   void { this.router.navigate(['/customer/home']); }
  goToMenu(): void { this.router.navigate(['/customer/menu']); }

  trackById(_: number, o: Order): string { return o.id; }
}
