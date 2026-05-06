import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { DishService } from '@features/inventory/services/dish.service';
import { DrinkService } from '@features/inventory/services/drink.service';
import { AdditionService } from '@features/inventory/services/addition.service';
import { OrderService } from '@features/orders/services/order.service';
import { NotificationService } from '@core/services/notification.service';
import { StorageService } from '@core/services/storage.service';
import { CartService } from '../../services/cart.service';
import { WompiService } from '../../services/wompi.service';
import { CartItem } from '../../models/cart.model';
import { DishResponse } from '@features/inventory/models/dish.model';
import { DrinkResponse } from '@features/inventory/models/drink.model';
import { AdditionResponse } from '@features/inventory/models/addition.model';
import { ProductType } from '@features/orders/models/order.model';

type Tab = 'DISH' | 'DRINK' | 'ADDITION';

@Component({
  selector: 'app-customer-menu',
  templateUrl: './customer-menu.component.html',
  styleUrls: ['./customer-menu.component.scss']
})
export class CustomerMenuComponent implements OnInit, OnDestroy {

  activeTab: Tab = 'DISH';
  dishes:    DishResponse[]     = [];
  drinks:    DrinkResponse[]    = [];
  additions: AdditionResponse[] = [];
  loading    = false;

  searchQuery = '';
  cartOpen    = false;
  submitting  = false;

  cartItems: CartItem[] = [];
  private cartSub?: Subscription;

  readonly tabs: { value: Tab; label: string; icon: string }[] = [
    { value: 'DISH',     label: 'Platos',    icon: 'restaurant_menu' },
    { value: 'DRINK',    label: 'Bebidas',   icon: 'local_bar'       },
    { value: 'ADDITION', label: 'Adiciones', icon: 'add_circle'      },
  ];

  constructor(
    private dishService: DishService,
    private drinkService: DrinkService,
    private additionService: AdditionService,
    private orderService: OrderService,
    private notification: NotificationService,
    private storageService: StorageService,
    public cartService: CartService,
    private wompiService: WompiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAll();
    this.cartSub = this.cartService.items$.subscribe(items => { this.cartItems = items; });
  }

  ngOnDestroy(): void { this.cartSub?.unsubscribe(); }

  // ─── Products ──────────────────────────────────────────────────────────────

  loadAll(): void {
    this.loading = true;
    this.dishService.getDishes(0).subscribe({
      next: res => { this.dishes = Array.isArray(res.message) ? res.message : []; this.loading = false; },
      error: () => { this.dishes = []; this.loading = false; }
    });
    this.drinkService.getDrinks(0).subscribe({
      next: res => { this.drinks = Array.isArray(res.message) ? res.message : []; },
      error: () => { this.drinks = []; }
    });
    this.additionService.getAdditions(0).subscribe({
      next: res => { this.additions = Array.isArray(res.message) ? res.message : []; },
      error: () => { this.additions = []; }
    });
  }

  get currentProducts(): any[] {
    const map: Record<Tab, any[]> = { DISH: this.dishes, DRINK: this.drinks, ADDITION: this.additions };
    const list = map[this.activeTab];
    if (!this.searchQuery.trim()) return list;
    const q = this.searchQuery.toLowerCase();
    return list.filter((p: any) => p.name?.toLowerCase().includes(q));
  }

  // ─── Cart ──────────────────────────────────────────────────────────────────

  addToCart(product: any): void {
    this.cartService.add({
      productId:   product.id,
      productName: product.name,
      productType: this.activeTab,
      unitPrice:   parseFloat(product.price) || 0,
      photo:       product.photo
    });
  }

  getQty(product: any): number {
    return this.cartService.getQty(product.id, this.activeTab);
  }

  increment(item: CartItem): void { this.cartService.increment(item.productId, item.productType); }
  decrement(item: CartItem): void { this.cartService.decrement(item.productId, item.productType); }
  removeItem(item: CartItem): void { this.cartService.remove(item.productId, item.productType); }

  get cartTotal(): number { return this.cartService.total; }
  get cartCount(): number { return this.cartService.count; }

  // ─── Checkout ──────────────────────────────────────────────────────────────

  placeOrder(): void {
    if (this.cartItems.length === 0 || this.submitting) return;
    this.submitting = true;
    const user = this.storageService.getUser();

    this.orderService.createOrder({
      channel:    'ONLINE',
      customerId: user?.id ?? undefined,
      items: this.cartItems.map(i => ({
        productId:   i.productId,
        productType: i.productType as ProductType,
        quantity:    i.quantity,
        notes:       i.notes || undefined
      }))
    }).subscribe({
      next: (res) => {
        const orderId = res.data;
        if (!orderId) {
          this.notification.showError('Error al crear la orden');
          this.submitting = false;
          return;
        }
        // Obtener firma de integridad y redirigir a Wompi
        const amountCents = Math.max(Math.round(this.cartTotal * 100), 100);
        this.wompiService.getCheckoutParams(orderId, amountCents).subscribe({
          next: (sigRes) => {
            const p = sigRes.data;
            const redirectUrl = `${window.location.origin}/customer/payment-result?orderId=${orderId}`;
            sessionStorage.setItem('pendingOrderId', orderId);
            this.wompiService.redirectToCheckout({
              publicKey:     p.publicKey,
              amountInCents: amountCents,
              reference:     orderId,
              signature:     p.signature,
              redirectUrl,
              currency:      'COP',
              description:   `Pedido #${orderId.slice(-6).toUpperCase()}`,
              customerEmail: user?.email ?? ''
            });
          },
          error: () => {
            this.notification.showError('Error al iniciar el pago');
            this.submitting = false;
          }
        });
      },
      error: (err) => {
        if (err?.status !== 409) {
          this.notification.showError('Error al crear la orden');
        }
        this.submitting = false;
      }
    });
  }

  // ─── Nav ───────────────────────────────────────────────────────────────────

  goHome(): void { this.router.navigate(['/customer/home']); }

  trackById(_: number, item: any): string { return item.id ?? item.productId; }
}
