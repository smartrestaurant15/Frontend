import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Subscription, timer } from 'rxjs';
import { OrderService } from '../../services/order.service';
import { InvoiceService } from '../../services/invoice.service';
import { SseService } from '../../services/sse.service';
import { NotificationService } from '@core/services/notification.service';
import { AuthService } from '@features/auth/services/auth.service';
import { Router } from '@angular/router';
import { Order, OrderDetail, OrderStatus, ORDER_STATUS_LABEL, CartItem, ProductType, CreateOrderItemDTO } from '../../models/order.model';
import { Invoice, PaymentMethodType } from '../../models/invoice.model';
import { DishService } from '@features/inventory/services/dish.service';
import { DrinkService } from '@features/inventory/services/drink.service';
import { AdditionService } from '@features/inventory/services/addition.service';

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

  editingNotes = false;
  notesText    = '';
  savingNotes  = false;

  // Edición de items (solo PENDING)
  editingItems   = false;
  editItemsList: CartItem[] = [];
  savingItems    = false;
  showAddProduct = false;
  addProductTab: ProductType = 'DISH';
  addProductSearch = '';
  availableDishes:    any[] = [];
  availableDrinks:    any[] = [];
  availableAdditions: any[] = [];

  readonly PRODUCT_TABS: { value: ProductType; label: string }[] = [
    { value: 'DISH',     label: 'Platos'   },
    { value: 'DRINK',    label: 'Bebidas'  },
    { value: 'ADDITION', label: 'Adiciones' },
  ];

  private sseSub?: Subscription;
  private reconnectSub?: Subscription;
  private sseRetries = 0;
  private readonly MAX_SSE_RETRIES = 10;

  readonly STATUS_LABEL = ORDER_STATUS_LABEL;

  readonly STATUS_OPTIONS: { value: OrderStatus | undefined; label: string; icon: string }[] = [
    { value: undefined,     label: 'Todas',           icon: 'list'            },
    { value: 'PENDING',     label: 'Borrador',         icon: 'draft'           },
    { value: 'SENT',        label: 'Enviadas',         icon: 'send'            },
    { value: 'IN_PROGRESS', label: 'En preparación',   icon: 'soup_kitchen'    },
    { value: 'COMPLETED',   label: 'Listas',           icon: 'check_circle'    },
    { value: 'DELIVERED',   label: 'Entregadas',       icon: 'done_all'        },
    { value: 'CANCELLED',   label: 'Canceladas',       icon: 'cancel'          },
  ];

  readonly PAYMENT_METHODS: { value: PaymentMethodType; label: string; icon: string }[] = [
    { value: 'CASH',     label: 'Efectivo',     icon: 'payments'        },
    { value: 'CARD',     label: 'Tarjeta',      icon: 'credit_card'     },
    { value: 'TRANSFER', label: 'Transferencia', icon: 'account_balance' },
  ];

  readonly statusBadge: Record<string, string> = {
    PENDING:     'bg-gray-400/10 text-gray-400 border-gray-400/20',
    SENT:        'bg-sky-400/10 text-sky-400 border-sky-400/20',
    IN_PROGRESS: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
    COMPLETED:   'bg-[#e6c487]/10 text-[#e6c487] border-[#e6c487]/20',
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
    private ngZone: NgZone,
    private dishService: DishService,
    private drinkService: DrinkService,
    private additionService: AdditionService
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
    this.editingNotes = false;
    this.editingItems = false;
  }

  startEditNotes(): void {
    this.notesText    = this.orderDetail?.notes ?? '';
    this.editingNotes = true;
  }

  cancelEditNotes(): void {
    this.editingNotes = false;
  }

  saveNotes(): void {
    if (!this.selectedOrder || !this.orderDetail || this.savingNotes) { return; }
    this.savingNotes = true;
    this.orderService.updateOrder(this.selectedOrder.id, {
      status: this.orderDetail.status as any,
      notes:  this.notesText
    }).subscribe({
      next: () => {
        this.notification.showSuccess('Notas actualizadas');
        this.orderDetail!.notes = this.notesText;
        this.editingNotes = false;
        this.savingNotes  = false;
      },
      error: () => {
        this.notification.showError('Error al guardar las notas');
        this.savingNotes = false;
      }
    });
  }

  sendToKitchen(order: Order): void {
    // PENDING → SENT
    this.orderService.updateOrder(order.id, { status: 'SENT' }).subscribe({
      next: () => {
        this.notification.showSuccess('Orden enviada a cocina');
        if (this.selectedOrder?.id === order.id) { this.closeDetail(); }
        this.loadOrders();
      },
      error: () => {
        // El interceptor ya muestra el mensaje del backend (ej: stock insuficiente)
      }
    });
  }

  deliverOrder(order: Order): void {
    // COMPLETED → DELIVERED
    this.orderService.updateOrder(order.id, { status: 'DELIVERED' }).subscribe({
      next: () => {
        this.notification.showSuccess('Orden entregada');
        if (this.selectedOrder?.id === order.id) { this.closeDetail(); }
        this.loadOrders();
      },
      error: () => this.notification.showError('Error al actualizar la orden')
    });
  }

  closeOrder(order: Order): void {
    // DELIVERED es el estado final en el backend — no existe CLOSED.
    // Este método queda como no-op para no romper el template mientras se actualiza el HTML.
    this.notification.showError('El estado CLOSED no existe. El flujo termina en DELIVERED.');
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

  // ── Edit items ──────────────────────────────────────────────────────────────

  startEditItems(): void {
    if (!this.orderDetail) { return; }
    this.editItemsList = this.orderDetail.items.map(i => ({
      productId:   i.productId,
      productName: i.productName,
      productType: i.productType,
      unitPrice:   i.unitPrice,
      quantity:    i.quantity,
      notes:       i.notes
    }));
    this.showAddProduct = false;
    this.addProductSearch = '';
    this.editingItems = true;
    this.loadProductsForEdit();
  }

  cancelEditItems(): void {
    this.editingItems = false;
    this.showAddProduct = false;
  }

  private loadProductsForEdit(): void {
    this.dishService.getDishes(0).subscribe({
      next: res => { this.availableDishes = this.asAny(res.message); },
      error: () => { this.availableDishes = []; }
    });
    this.drinkService.getDrinks(0).subscribe({
      next: res => { this.availableDrinks = this.asAny(res.message); },
      error: () => { this.availableDrinks = []; }
    });
    this.additionService.getAdditions(0).subscribe({
      next: res => { this.availableAdditions = this.asAny(res.message); },
      error: () => { this.availableAdditions = []; }
    });
  }

  increaseQty(item: CartItem): void { item.quantity++; }

  decreaseQty(item: CartItem): void {
    if (item.quantity > 1) { item.quantity--; }
    else { this.removeEditItem(item); }
  }

  removeEditItem(item: CartItem): void {
    this.editItemsList = this.editItemsList.filter(i => i !== item);
  }

  addProductToEdit(product: any, type: ProductType): void {
    const existing = this.editItemsList.find(
      i => i.productId === product.id && i.productType === type
    );
    if (existing) {
      existing.quantity++;
    } else {
      this.editItemsList.push({
        productId:   product.id,
        productName: product.name,
        productType: type,
        unitPrice:   product.price ?? 0,
        quantity:    1
      });
    }
  }

  get filteredProductsForEdit(): any[] {
    const q = this.addProductSearch.toLowerCase();
    const list = this.addProductTab === 'DISH'     ? this.availableDishes
               : this.addProductTab === 'DRINK'    ? this.availableDrinks
               : this.availableAdditions;
    return q ? list.filter(p => p.name?.toLowerCase().includes(q)) : list;
  }

  saveItems(): void {
    if (!this.selectedOrder || this.savingItems || this.editItemsList.length === 0) { return; }
    this.savingItems = true;
    const payload: CreateOrderItemDTO[] = this.editItemsList.map(i => ({
      productId:   i.productId,
      productType: i.productType,
      quantity:    i.quantity,
      notes:       i.notes
    }));
    const orderRef = this.selectedOrder;
    this.orderService.editOrderItems(this.selectedOrder.id, payload).subscribe({
      next: () => {
        this.notification.showSuccess('Items actualizados');
        this.editingItems = false;
        this.savingItems  = false;
        // Forzar recarga del detalle limpiando la referencia antes de abrir
        this.selectedOrder = null;
        this.openDetail(orderRef);
        this.loadOrders();
      },
      error: () => {
        this.notification.showError('Error al actualizar los items');
        this.savingItems = false;
      }
    });
  }

  private asAny(val: any): any[] { return Array.isArray(val) ? val : []; }

  // ── Guards de estado — alineados con VALID_TRANSITIONS del backend ──────────
  // PENDING → SENT (enviar a cocina)
  canSendToKitchen(o: Order): boolean { return o.status === 'PENDING'; }
  // COMPLETED → DELIVERED (mesero entrega el pedido)
  canDeliver(o: Order): boolean       { return o.status === 'COMPLETED'; }
  // El pago lo gestiona el cajero — el mesero no cobra
  canPay(o: Order): boolean           { return false; }
  // DELIVERED no tiene más transiciones — closeOrder ya no aplica
  canClose(o: Order): boolean         { return false; }
  // Cancelable desde PENDING, SENT o IN_PROGRESS (con advertencia de desperdicio)
  canCancel(o: Order): boolean        { return o.status === 'PENDING' || o.status === 'SENT' || o.status === 'IN_PROGRESS'; }

  itemTypeIcon(type: string): string {
    if (type === 'DISH')     { return 'restaurant_menu'; }
    if (type === 'DRINK')    { return 'local_bar'; }
    return 'add_circle';
  }

  trackById(_: number, o: { id: string }): string { return o.id; }
}


