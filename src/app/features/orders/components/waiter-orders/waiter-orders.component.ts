import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Subscription, timer } from 'rxjs';
import { OrderService } from '../../services/order.service';
import { InvoiceService } from '../../services/invoice.service';
import { SseService } from '../../services/sse.service';
import { NotificationService } from '@core/services/notification.service';
import { AuthService } from '@features/auth/services/auth.service';
import { Router } from '@angular/router';
import { Order, OrderDetail, OrderStatus, ORDER_STATUS_LABEL } from '../../models/order.model';
import { Invoice, PaymentMethodType } from '../../models/invoice.model';

@Component({
  selector: 'app-waiter-orders',
  templateUrl: './waiter-orders.component.html',
  styleUrls: ['./waiter-orders.component.scss']
})
export class WaiterOrdersComponent implements OnInit, OnDestroy {

  orders: Order[] = [];
  loading = false;
  currentPage = 1;
  hasMorePages = false;
  sseOnline = false;

  selectedStatus?: OrderStatus;
  isCreateModalOpen = false;

  selectedOrder: Order | null = null;
  orderDetail: OrderDetail | null = null;
  loadingDetail = false;

  payingInvoice: Invoice | null = null;
  selectedMethod: PaymentMethodType = 'CASH';
  paymentReference = '';
  submittingPayment = false;

  confirmCancelId: string | null = null;

  private sseSub?: Subscription;
  private reconnectSub?: Subscription;
  private sseRetries = 0;
  private readonly MAX_SSE_RETRIES = 10;

  readonly STATUS_LABEL = ORDER_STATUS_LABEL;

  readonly STATUS_OPTIONS: { value: OrderStatus | undefined; label: string; icon: string }[] = [
    { value: undefined,     label: 'Todas',         icon: 'list'            },
    { value: 'PENDING',     label: 'Pendientes',     icon: 'hourglass_empty' },
    { value: 'IN_PROGRESS', label: 'En preparacion', icon: 'soup_kitchen'    },
    { value: 'COMPLETED',   label: 'Listas',         icon: 'check_circle'    },
    { value: 'DELIVERED',   label: 'Entregadas',     icon: 'done_all'        },
    { value: 'CANCELLED',   label: 'Canceladas',     icon: 'cancel'          },
  ];

  readonly PAYMENT_METHODS: { value: PaymentMethodType; label: string; icon: string }[] = [
    { value: 'CASH',     label: 'Efectivo',     icon: 'payments'        },
    { value: 'CARD',     label: 'Tarjeta',      icon: 'credit_card'     },
    { value: 'TRANSFER', label: 'Transferencia', icon: 'account_balance' },
  ];

  readonly statusBadge: Record<string, string> = {
    PENDING:     'bg-amber-400/10 text-amber-400 border-amber-400/20',
    IN_PROGRESS: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
    COMPLETED:   'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
    DELIVERED:   'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
    CANCELLED:   'bg-red-400/10 text-red-400 border-red-400/20',
  };

  constructor(
    private orderService: OrderService,
    private invoiceService: InvoiceService,
    private sseService: SseService,
    private notification: NotificationService,
    private authService: AuthService,
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

  logout(): void {
    this.authService.logout().subscribe({
      next:  () => this.router.navigate(['/auth/login']),
      error: () => this.router.navigate(['/auth/login'])
    });
  }

  loadOrders(): void {
    this.loading = true;
    this.orderService.getOrders(this.currentPage - 1, this.selectedStatus).subscribe({
      next: (res) => {
        const data = Array.isArray(res.data) ? res.data : [];
        this.orders = data;
        this.hasMorePages = data.length >= 10;
        this.loading = false;
      },
      error: () => { this.orders = []; this.loading = false; }
    });
  }

  filterByStatus(status: OrderStatus | undefined): void {
    this.selectedStatus = status;
    this.currentPage = 1;
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

  private connectSse(): void {
    this.sseSub?.unsubscribe();
    this.reconnectSub?.unsubscribe();
    this.ngZone.runOutsideAngular(() => {
      this.sseSub = this.sseService.subscribeWaiter().subscribe({
        next: (notif) => {
          this.ngZone.run(() => {
            this.sseOnline = true;
            this.sseRetries = 0;
            if (notif.type === 'ORDER_READY') {
              this.notification.showSuccess('Un pedido esta listo para entregar');
              this.loadOrders();
            }
          });
        },
        error: () => this.ngZone.run(() => { this.sseOnline = false; this.scheduleReconnect(); }),
        complete: () => this.ngZone.run(() => { this.sseOnline = false; this.scheduleReconnect(); })
      });
    });
    this.sseOnline = true;
  }

  private scheduleReconnect(): void {
    if (this.sseRetries >= this.MAX_SSE_RETRIES) { return; }
    const delay = Math.min(2000 * Math.pow(2, this.sseRetries), 60000);
    this.sseRetries++;
    this.reconnectSub = timer(delay).subscribe(() => this.connectSse());
  }

  openDetail(order: Order): void {
    if (this.selectedOrder?.id === order.id) {
      this.closeDetail();
      return;
    }
    this.selectedOrder = order;
    this.orderDetail = null;
    this.loadingDetail = true;
    this.payingInvoice = null;
    this.orderService.getOrderById(order.id).subscribe({
      next: (res) => {
        this.orderDetail = res.data ?? null;
        this.loadingDetail = false;
      },
      error: () => { this.loadingDetail = false; }
    });
  }

  closeDetail(): void {
    this.selectedOrder = null;
    this.orderDetail = null;
    this.payingInvoice = null;
  }

  deliverOrder(order: Order): void {
    this.orderService.updateOrder(order.id, { status: 'DELIVERED' }).subscribe({
      next: () => {
        this.notification.showSuccess('Orden entregada');
        if (this.selectedOrder?.id === order.id) { this.closeDetail(); }
        this.loadOrders();
      },
      error: () => this.notification.showError('Error al actualizar la orden')
    });
  }

  requestCancel(order: Order): void {
    if (this.confirmCancelId === order.id) {
      this.confirmCancelId = null;
      this.orderService.cancelOrder(order.id).subscribe({
        next: () => {
          this.notification.showSuccess('Orden cancelada');
          if (this.selectedOrder?.id === order.id) { this.closeDetail(); }
          this.loadOrders();
        },
        error: () => this.notification.showError('Error al cancelar la orden')
      });
    } else {
      this.confirmCancelId = order.id;
      timer(4000).subscribe(() => {
        if (this.confirmCancelId === order.id) { this.confirmCancelId = null; }
      });
    }
  }

  openPayment(order: Order): void {
    this.orderService.getInvoiceByOrder(order.id).subscribe({
      next: (res) => {
        const inv = res.data ?? null;
        if (inv) {
          this.payingInvoice = inv;
          this.selectedMethod = 'CASH';
          this.paymentReference = '';
        } else {
          this.notification.showError('No se encontro la factura de esta orden');
        }
      },
      error: () => this.notification.showError('No se pudo obtener la factura')
    });
  }

  closePayment(): void {
    this.payingInvoice = null;
  }

  submitPayment(): void {
    if (!this.payingInvoice || this.submittingPayment) { return; }
    this.submittingPayment = true;
    this.invoiceService.payPresential(this.payingInvoice.id, {
      invoiceId: this.payingInvoice.id,
      paymentMethod: this.selectedMethod,
      reference: this.paymentReference || undefined,
    }).subscribe({
      next: () => {
        this.notification.showSuccess('Pago registrado correctamente');
        this.payingInvoice = null;
        this.submittingPayment = false;
        if (this.selectedOrder) { this.openDetail(this.selectedOrder); }
        this.loadOrders();
      },
      error: () => {
        this.notification.showError('Error al registrar el pago');
        this.submittingPayment = false;
      }
    });
  }

  canDeliver(o: Order): boolean { return o.status === 'COMPLETED'; }
  canCancel(o: Order): boolean  { return o.status === 'PENDING' || o.status === 'IN_PROGRESS'; }
  canPay(o: Order): boolean     { return o.status === 'COMPLETED'; }

  itemTypeIcon(type: string): string {
    if (type === 'DISH')     { return 'restaurant_menu'; }
    if (type === 'DRINK')    { return 'local_bar'; }
    return 'add_circle';
  }

  trackById(_: number, o: { id: string }): string { return o.id; }
}


