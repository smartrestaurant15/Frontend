import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { interval, Subscription, timer } from 'rxjs';
import { Router } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { InvoiceService } from '../../services/invoice.service';
import { SseService, SseNotification } from '../../services/sse.service';
import { NotificationService } from '@core/services/notification.service';
import { AuthService } from '@features/auth/services/auth.service';
import { Order, OrderDetail, ORDER_STATUS_LABEL } from '../../models/order.model';
import { Invoice, PaymentMethodType } from '../../models/invoice.model';

@Component({
  selector: 'app-cashier',
  templateUrl: './cashier.component.html',
  styleUrls: ['./cashier.component.scss']
})
export class CashierComponent implements OnInit, OnDestroy {

  /** Órdenes entregadas pendientes de cobro */
  orders: Order[] = [];
  loading    = false;
  sseOnline  = false;

  selectedOrder: OrderDetail | null = null;
  loadingDetail  = false;

  payingInvoice: Invoice | null = null;
  selectedMethod: PaymentMethodType = 'CASH';
  paymentReference = '';
  submittingPayment = false;

  readonly STATUS_LABEL = ORDER_STATUS_LABEL;

  readonly PAYMENT_METHODS: { value: PaymentMethodType; label: string; icon: string }[] = [
    { value: 'CASH',     label: 'Efectivo',      icon: 'payments'        },
    { value: 'CARD',     label: 'Tarjeta',        icon: 'credit_card'     },
    { value: 'TRANSFER', label: 'Transferencia',  icon: 'account_balance' },
  ];

  private sseSub?: Subscription;
  private reconnectSub?: Subscription;
  private pollSub?: Subscription;
  private sseRetries = 0;
  private readonly MAX_SSE_RETRIES = 10;

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
    // Polling cada 15s como respaldo al SSE
    this.pollSub = interval(15_000).subscribe(() => this.loadOrders());
  }

  ngOnDestroy(): void {
    this.sseSub?.unsubscribe();
    this.reconnectSub?.unsubscribe();
    this.pollSub?.unsubscribe();
  }

  logout(): void {
    this.authService.logout().subscribe({
      next:  () => this.router.navigate(['/auth/login']),
      error: () => this.router.navigate(['/auth/login'])
    });
  }

  // ── Carga de órdenes entregadas (pendientes de pago) ───────────────────────

  loadOrders(): void {
    this.loading = true;
    this.orderService.getOrders(0, 'DELIVERED').subscribe({
      next: res => {
        const all = Array.isArray(res.data) ? res.data : [];
        // Excluir órdenes ya pagadas (paymentStatus === CONFIRMED)
        this.orders = all.filter(o => o.paymentStatus !== 'CONFIRMED');
        this.loading = false;
      },
      error: () => { this.orders = []; this.loading = false; }
    });
  }

  // ── SSE ────────────────────────────────────────────────────────────────────

  private connectSse(): void {
    this.sseSub?.unsubscribe();
    this.reconnectSub?.unsubscribe();
    this.ngZone.runOutsideAngular(() => {
      this.sseSub = this.sseService.subscribeCashier().subscribe({
        next: (notif: SseNotification) => {
          this.ngZone.run(() => {
            this.sseOnline = true;
            this.sseRetries = 0;
            if (notif.type === 'ORDER_READY_TO_PAY') {
              this.notification.showSuccess('Nueva orden lista para cobrar');
              this.loadOrders();
            } else if (notif.type === 'PAYMENT_CONFIRMED') {
              // Sacar la orden pagada de la lista automáticamente
              const orderId = notif.data as string;
              this.orders = this.orders.filter(o => o.id !== orderId);
              if (this.selectedOrder?.id === orderId) { this.closeDetail(); }
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

  // ── Detalle de orden ───────────────────────────────────────────────────────

  openDetail(order: Order): void {
    if (this.selectedOrder?.id === order.id) { this.closeDetail(); return; }
    this.loadingDetail = true;
    this.selectedOrder = null;
    this.payingInvoice = null;
    this.orderService.getOrderById(order.id).subscribe({
      next: res => { this.selectedOrder = res.data ?? null; this.loadingDetail = false; },
      error: () => { this.loadingDetail = false; }
    });
  }

  closeDetail(): void {
    this.selectedOrder = null;
    this.payingInvoice = null;
  }

  // ── Pago ───────────────────────────────────────────────────────────────────

  openPayment(order: Order | OrderDetail): void {
    this.orderService.getInvoiceByOrder(order.id).subscribe({
      next: res => {
        if (res.data) {
          this.payingInvoice    = res.data;
          this.selectedMethod   = 'CASH';
          this.paymentReference = '';
        } else {
          this.notification.showError('No se encontró la factura de esta orden');
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
    const orderId = this.payingInvoice.orderId;
    this.invoiceService.payPresential(this.payingInvoice.id, {
      invoiceId:     this.payingInvoice.id,
      paymentMethod: this.selectedMethod,
      reference:     this.paymentReference || undefined,
    }).subscribe({
      next: () => {
        this.notification.showSuccess('Pago registrado — mesa liberada');
        this.payingInvoice     = null;
        this.submittingPayment = false;
        // Remover la orden de la lista inmediatamente
        this.orders = this.orders.filter(o => o.id !== orderId);
        this.closeDetail();
      },
      error: () => {
        this.notification.showError('Error al registrar el pago');
        this.submittingPayment = false;
      }
    });
  }

  isPaid(_orderId: string): boolean {
    return false;
  }

  trackById(_: number, o: Order): string { return o.id; }
}
