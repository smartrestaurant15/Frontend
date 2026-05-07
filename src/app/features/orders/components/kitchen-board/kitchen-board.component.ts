import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { interval, Subscription, timer } from 'rxjs';
import { OrderService } from '../../services/order.service';
import { SseService } from '../../services/sse.service';
import { NotificationService } from '@core/services/notification.service';
import { AuthService } from '@features/auth/services/auth.service';
import { Order, OrderDetail, GetMenuInstanceDTO, ORDER_STATUS_LABEL } from '../../models/order.model';

/** Extiende Order con las instancias de menú que puede traer el SSE o el detalle */
interface KitchenOrder extends Order {
  menuInstances?: GetMenuInstanceDTO[];
}

@Component({
  selector: 'app-kitchen-board',
  templateUrl: './kitchen-board.component.html',
  styleUrls: ['./kitchen-board.component.scss']
})
export class KitchenBoardComponent implements OnInit, OnDestroy {

  pendingOrders:    KitchenOrder[] = [];
  inProgressOrders: KitchenOrder[] = [];
  completedOrders:  KitchenOrder[] = [];

  expandedDetails: Record<string, OrderDetail | null> = {};
  loadingDetail:   Record<string, boolean> = {};

  // Confirmación de "marcar listo"
  confirmingId: string | null = null;

  loading    = false;
  sseOnline  = false;
  now        = new Date();

  private sseSub?:     Subscription;
  private pollSub?:    Subscription;
  private clockSub?:   Subscription;
  private reconnectSub?: Subscription;
  private sseRetries = 0;
  private readonly MAX_SSE_RETRIES = 10;

  // AudioContext para el sonido de nueva orden (Web Audio API — sin archivos externos)
  private audioCtx: AudioContext | null = null;

  readonly STATUS_LABEL = ORDER_STATUS_LABEL;

  readonly typeIcon: Record<string, string> = {
    DISH:     'restaurant_menu',
    DRINK:    'local_bar',
    ADDITION: 'add_circle'
  };

  constructor(
    private orderService: OrderService,
    private sseService: SseService,
    private notification: NotificationService,
    private authService: AuthService,
    private router: Router,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.loadOrders();
    this.startPolling();
    this.connectSse();
    this.startClock();
  }

  ngOnDestroy(): void {
    this.sseSub?.unsubscribe();
    this.pollSub?.unsubscribe();
    this.clockSub?.unsubscribe();
    this.reconnectSub?.unsubscribe();
    this.audioCtx?.close();
  }

  // ─── Auth ──────────────────────────────────────────────────────────────────

  logout(): void {
    this.authService.logout().subscribe({
      next:  () => this.router.navigate(['/auth/login']),
      error: () => this.router.navigate(['/auth/login'])
    });
  }

  // ─── Data ──────────────────────────────────────────────────────────────────

  loadOrders(): void {
    this.loading = true;

    // Conservar solo los detalles de órdenes que siguen en lista tras la recarga
    const refreshDetail = (orders: Order[]) => {
      const activeIds = new Set(orders.map(o => o.id));
      // Limpiar detalles de órdenes que ya no están en la columna
      Object.keys(this.expandedDetails).forEach(id => {
        if (!activeIds.has(id)) this.clearDetail(id);
      });
      // Refrescar detalles que siguen expandidos
      orders.forEach(o => {
        if (o.id in this.expandedDetails) this.loadDetail(o.id);
      });
    };

    // Columna 1: órdenes enviadas a cocina (SENT)
    this.orderService.getOrders(0, 'SENT').subscribe({
      next: res => {
        this.pendingOrders = this.asArray(res.data);
        refreshDetail(this.pendingOrders);
        this.loading = false;
      },
      error: () => { this.pendingOrders = []; this.loading = false; }
    });

    // Columna 2: en preparación (IN_PROGRESS)
    this.orderService.getOrders(0, 'IN_PROGRESS').subscribe({
      next: res => {
        this.inProgressOrders = this.asArray(res.data);
        refreshDetail(this.inProgressOrders);
      },
      error: () => { this.inProgressOrders = []; }
    });

    // Columna 3: listos para entregar (COMPLETED)
    this.orderService.getOrders(0, 'COMPLETED').subscribe({
      next: res => { this.completedOrders = this.asArray(res.data); },
      error: () => { this.completedOrders = []; }
    });
  }

  private startPolling(): void {
    this.pollSub = interval(15_000).subscribe(() => this.loadOrders());
  }

  private startClock(): void {
    this.clockSub = interval(1000).subscribe(() => { this.now = new Date(); });
  }

  // ─── SSE con reconexión exponencial ────────────────────────────────────────

  private connectSse(): void {
    this.sseSub?.unsubscribe();
    this.reconnectSub?.unsubscribe();

    // Correr fuera de la zona para que el polling de reconexión no dispare change detection
    this.ngZone.runOutsideAngular(() => {
      this.sseSub = this.sseService.subscribeKitchen().subscribe({
        next: notif => {
          this.ngZone.run(() => {
            this.sseOnline = true;
            this.sseRetries = 0;
            if (notif.type === 'NEW_ORDER') {
              this.playNewOrderSound();
              this.notification.showSuccess('Nuevo pedido recibido');
              const payload = notif.data as any;
              if (Array.isArray(payload?.menuInstances)) {
                // Payload enriquecido (GetOrderDetailDTO) — tiene todo
                const ko = this.normalizeDetailToKitchen(payload);
                this.insertOrUpdateOrder(ko);
              } else {
                // Payload resumen (GetOrdersDTO)
                const ko: KitchenOrder = { ...payload };
                this.insertOrUpdateOrder(ko);
                if ((payload.menuInstanceCount ?? 0) > 0) {
                  this.loadMenuDetailForOrder(payload.id);
                }
              }
            }
          });
        },
        error: () => {
          this.ngZone.run(() => {
            this.sseOnline = false;
            this.scheduleReconnect();
          });
        },
        complete: () => {
          this.ngZone.run(() => {
            this.sseOnline = false;
            this.scheduleReconnect();
          });
        }
      });
    });

    // Marcar como online tras conectar exitosamente (primer tick)
    this.sseOnline = true;
  }

  private scheduleReconnect(): void {
    if (this.sseRetries >= this.MAX_SSE_RETRIES) return;

    // Backoff exponencial con techo de 60 s: 2s, 4s, 8s … 60s
    const delay = Math.min(2_000 * Math.pow(2, this.sseRetries), 60_000);
    this.sseRetries++;

    this.reconnectSub = timer(delay).subscribe(() => this.connectSse());
  }

  // ─── Sonido nueva orden (Web Audio API) ────────────────────────────────────

  private playNewOrderSound(): void {
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = this.audioCtx;

      // Dos pitidos cortos ascendentes
      const tones = [880, 1100];
      tones.forEach((freq, i) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'sine';
        osc.frequency.value = freq;

        const start = ctx.currentTime + i * 0.18;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.35, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.15);

        osc.start(start);
        osc.stop(start + 0.16);
      });
    } catch {
      // Silenciar si el navegador bloquea AudioContext (política autoplay)
    }
  }

  // ─── SSE helpers ──────────────────────────────────────────────────────────

  private normalizeDetailToKitchen(detail: any): KitchenOrder {
    return {
      id:               detail.id,
      status:           detail.status,
      channel:          detail.channel,
      customerName:     detail.customerName ?? 'Presencial',
      createdAt:        detail.createdAt,
      itemCount:        detail.items?.length ?? 0,
      totalAmount:      detail.totalAmount ?? 0,
      paymentStatus:    detail.paymentStatus,
      menuInstanceCount: detail.menuInstances?.length ?? 0,
      menuInstances:    detail.menuInstances ?? []
    };
  }

  private insertOrUpdateOrder(ko: KitchenOrder): void {
    // Las nuevas órdenes llegan en estado SENT → columna pendingOrders
    const idx = this.pendingOrders.findIndex(o => o.id === ko.id);
    if (idx >= 0) {
      this.pendingOrders[idx] = { ...this.pendingOrders[idx], ...ko };
    } else {
      this.pendingOrders = [ko, ...this.pendingOrders];
    }
  }

  private loadMenuDetailForOrder(id: string): void {
    this.orderService.getOrderById(id).subscribe({
      next: res => {
        const detail = (res as any).data;
        if (!detail?.menuInstances) return;
        const patch = (list: KitchenOrder[]) => {
          const i = list.findIndex(o => o.id === id);
          if (i >= 0) list[i] = { ...list[i], menuInstances: detail.menuInstances };
          return [...list];
        };
        this.pendingOrders    = patch(this.pendingOrders);
        this.inProgressOrders = patch(this.inProgressOrders);
        this.completedOrders  = patch(this.completedOrders);
      }
    });
  }

  // ─── Actions ───────────────────────────────────────────────────────────────

  startOrder(order: Order): void {
    // SENT → IN_PROGRESS
    this.orderService.updateOrder(order.id, { status: 'IN_PROGRESS' }).subscribe({
      next: () => {
        this.notification.showSuccess(`Orden #${order.id.slice(-6).toUpperCase()} iniciada`);
        this.clearDetail(order.id);
        this.loadOrders();
      },
      error: () => this.notification.showError('No se pudo actualizar la orden')
    });
  }

  // Primer clic pide confirmación, segundo clic ejecuta
  requestComplete(order: Order): void {
    if (this.confirmingId === order.id) {
      this.confirmComplete(order);
    } else {
      this.confirmingId = order.id;
      // Auto-cancelar confirmación tras 4 s sin segundo clic
      timer(4000).subscribe(() => {
        if (this.confirmingId === order.id) this.confirmingId = null;
      });
    }
  }

  private confirmComplete(order: Order): void {
    this.confirmingId = null;
    // IN_PROGRESS → COMPLETED
    this.orderService.updateOrder(order.id, { status: 'COMPLETED' }).subscribe({
      next: () => {
        this.notification.showSuccess(`Orden #${order.id.slice(-6).toUpperCase()} lista`);
        this.clearDetail(order.id);
        this.loadOrders();
      },
      error: () => this.notification.showError('No se pudo completar la orden')
    });
  }

  cancelConfirm(): void {
    this.confirmingId = null;
  }

  // ─── Detail expand ─────────────────────────────────────────────────────────

  toggleDetail(order: Order): void {
    if (order.id in this.expandedDetails && this.expandedDetails[order.id] !== null) {
      this.clearDetail(order.id);
    } else {
      this.loadDetail(order.id);
    }
  }

  loadDetail(id: string): void {
    this.loadingDetail[id] = true;
    this.expandedDetails[id] = null;
    this.orderService.getOrderById(id).subscribe({
      next: res => {
        this.expandedDetails[id] = (res as any).data ?? null;
        this.loadingDetail[id] = false;
      },
      error: () => {
        delete this.expandedDetails[id];
        this.loadingDetail[id] = false;
      }
    });
  }

  isExpanded(id: string): boolean {
    return id in this.expandedDetails;
  }

  private clearDetail(id: string): void {
    delete this.expandedDetails[id];
    delete this.loadingDetail[id];
  }

  // ─── Time helpers ──────────────────────────────────────────────────────────

  elapsedMinutes(createdAt: string): number {
    return Math.floor((this.now.getTime() - new Date(createdAt).getTime()) / 60_000);
  }

  urgencyClass(createdAt: string): string {
    const mins = this.elapsedMinutes(createdAt);
    if (mins >= 20) return 'urgent';
    if (mins >= 10) return 'warning';
    return 'normal';
  }

  // ─── Utils ─────────────────────────────────────────────────────────────────

  private asArray<T>(val: any): T[] {
    return Array.isArray(val) ? val : [];
  }

  trackById(_: number, item: { id: string }): string {
    return item.id;
  }
}
