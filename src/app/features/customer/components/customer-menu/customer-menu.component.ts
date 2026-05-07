import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { DishService } from '@features/inventory/services/dish.service';
import { DrinkService } from '@features/inventory/services/drink.service';
import { AdditionService } from '@features/inventory/services/addition.service';
import { MenuPublicationService } from '@features/inventory/services/menu-publication.service';
import { OrderService } from '@features/orders/services/order.service';
import { NotificationService } from '@core/services/notification.service';
import { StorageService } from '@core/services/storage.service';
import { CartService } from '../../services/cart.service';
import { WompiService } from '../../services/wompi.service';
import { CartItem } from '../../models/cart.model';
import { DishResponse } from '@features/inventory/models/dish.model';
import { DrinkResponse } from '@features/inventory/models/drink.model';
import { AdditionResponse } from '@features/inventory/models/addition.model';
import { ActiveMenuDTO, PublicationSectionDTO, SectionOptionDTO } from '@features/inventory/models/menu.model';
import { ProductType, MenuInstanceDraft, MenuSelectionDraft } from '@features/orders/models/order.model';

type Tab = 'DAILY_MENU' | 'DISH' | 'DRINK' | 'ADDITION';

@Component({
  selector: 'app-customer-menu',
  templateUrl: './customer-menu.component.html',
  styleUrls: ['./customer-menu.component.scss']
})
export class CustomerMenuComponent implements OnInit, OnDestroy {

  activeTab: Tab = 'DAILY_MENU';
  dishes:    DishResponse[]     = [];
  drinks:    DrinkResponse[]    = [];
  additions: AdditionResponse[] = [];
  activeMenu: ActiveMenuDTO | null = null;
  loading    = false;
  loadingMenu = false;

  searchQuery = '';
  cartOpen    = false;
  submitting  = false;

  cartItems: CartItem[] = [];
  private cartSub?: Subscription;

  // ─── Menú del Día ──────────────────────────────────────────────────────────
  menuInstances: MenuInstanceDraft[] = [];

  readonly tabs: { value: Tab; label: string; icon: string }[] = [
    { value: 'DAILY_MENU', label: 'Menú del Día', icon: 'restaurant_menu' },
    { value: 'DISH',       label: 'Platos',       icon: 'dinner_dining'   },
    { value: 'DRINK',      label: 'Bebidas',      icon: 'local_bar'       },
    { value: 'ADDITION',   label: 'Adiciones',    icon: 'add_circle'      },
  ];

  constructor(
    private dishService: DishService,
    private drinkService: DrinkService,
    private additionService: AdditionService,
    private menuPublicationService: MenuPublicationService,
    private orderService: OrderService,
    private notification: NotificationService,
    private storageService: StorageService,
    public cartService: CartService,
    private wompiService: WompiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadActiveMenu();
    this.loadAll();
    this.cartSub = this.cartService.items$.subscribe(items => { this.cartItems = items; });
  }

  ngOnDestroy(): void { this.cartSub?.unsubscribe(); }

  // ─── Menu del Día ──────────────────────────────────────────────────────────

  loadActiveMenu(): void {
    this.loadingMenu = true;
    this.menuPublicationService.getActive().subscribe({
      next: res => { this.activeMenu = res.message; this.loadingMenu = false; },
      error: () => { this.activeMenu = null; this.loadingMenu = false; }
    });
  }

  addMenuInstance(): void {
    this.menuInstances = [
      ...this.menuInstances,
      {
        seatIdentifier: '',
        observation:    '',
        selections:     new Map<string, MenuSelectionDraft>(),
        excludedSectionIds: new Set<string>()
      }
    ];
  }

  removeMenuInstance(index: number): void {
    this.menuInstances = this.menuInstances.filter((_, i) => i !== index);
  }

  selectOption(instanceIndex: number, section: PublicationSectionDTO, option: SectionOptionDTO): void {
    if (!option.active || (option.availablePortions !== null && option.availablePortions <= 0)) return;
    const inst = this.menuInstances[instanceIndex];
    inst.excludedSectionIds.delete(section.id);
    inst.selections.set(section.id, {
      sectionId:      section.id,
      sectionName:    section.name,
      optionId:       option.id,
      optionName:     option.itemName,
      additionalCost: option.additionalCost,
      observation:    ''
    });
    this.menuInstances = [...this.menuInstances];
  }

  toggleExclusion(instanceIndex: number, section: PublicationSectionDTO): void {
    const inst = this.menuInstances[instanceIndex];
    if (inst.excludedSectionIds.has(section.id)) {
      inst.excludedSectionIds.delete(section.id);
    } else {
      inst.excludedSectionIds.add(section.id);
      inst.selections.delete(section.id);
    }
    this.menuInstances = [...this.menuInstances];
  }

  getSelectionFor(inst: MenuInstanceDraft, sectionId: string): MenuSelectionDraft | null {
    return inst.selections.get(sectionId) ?? null;
  }

  instanceTotal(inst: MenuInstanceDraft): number {
    if (!this.activeMenu) return 0;
    const extras = Array.from(inst.selections.values()).reduce((s, sel) => s + sel.additionalCost, 0);
    return this.activeMenu.basePrice + extras;
  }

  get allMenuInstancesValid(): boolean {
    if (!this.activeMenu) return false;
    return this.menuInstances.every(inst =>
      this.activeMenu!.sections
        .filter(s => s.required)
        .every(s => inst.selections.has(s.id) || inst.excludedSectionIds.has(s.id))
    );
  }

  trackByIndex(index: number): number { return index; }

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
    if (this.activeTab === 'DAILY_MENU') return [];
    const map: Record<Exclude<Tab, 'DAILY_MENU'>, any[]> = { 
      DISH: this.dishes, 
      DRINK: this.drinks, 
      ADDITION: this.additions 
    };
    const list = map[this.activeTab as Exclude<Tab, 'DAILY_MENU'>];
    if (!this.searchQuery.trim()) return list;
    const q = this.searchQuery.toLowerCase();
    return list.filter((p: any) => p.name?.toLowerCase().includes(q));
  }

  // ─── Cart ──────────────────────────────────────────────────────────────────

  addToCart(product: any): void {
    const productType = this.activeTab as ProductType;
    this.cartService.add({
      productId:   product.id,
      productName: product.name,
      productType: productType,
      unitPrice:   parseFloat(product.salePrice ?? product.price) || 0,
      photo:       product.photo
    });
  }

  getQty(product: any): number {
    if (this.activeTab === 'DAILY_MENU') return 0;
    return this.cartService.getQty(product.id, this.activeTab as ProductType);
  }

  increment(item: CartItem): void { this.cartService.increment(item.productId, item.productType); }
  decrement(item: CartItem): void { this.cartService.decrement(item.productId, item.productType); }
  removeItem(item: CartItem): void { this.cartService.remove(item.productId, item.productType); }

  get cartTotal(): number {
    const itemsTotal = this.cartService.total;
    const menuTotal  = this.menuInstances.reduce((s, inst) => s + this.instanceTotal(inst), 0);
    return itemsTotal + menuTotal;
  }

  get cartCount(): number {
    return this.cartService.count + this.menuInstances.length;
  }

  get canPlaceOrder(): boolean {
    const hasItems    = this.cartItems.length > 0;
    const hasValidMenus = this.menuInstances.length > 0 && this.allMenuInstancesValid;
    return (hasItems || hasValidMenus) && !this.submitting;
  }

  // ─── Checkout ──────────────────────────────────────────────────────────────

  placeOrder(): void {
    if (!this.canPlaceOrder) return;
    this.submitting = true;
    const user = this.storageService.getUser();

    const dto: any = {
      channel:    'ONLINE',
      customerId: user?.id ?? undefined,
    };

    if (this.cartItems.length > 0) {
      dto.items = this.cartItems.map(i => ({
        productId:   i.productId,
        productType: i.productType as ProductType,
        quantity:    i.quantity,
        notes:       i.notes || undefined
      }));
    }

    if (this.menuInstances.length > 0 && this.activeMenu) {
      dto.menuInstances = this.menuInstances.map(inst => ({
        publicationId:      this.activeMenu!.id,
        seatIdentifier:     inst.seatIdentifier.trim() || undefined,
        observation:        inst.observation.trim() || undefined,
        selections: Array.from(inst.selections.values()).map(s => ({
          sectionId:   s.sectionId,
          optionId:    s.optionId,
          observation: s.observation.trim() || undefined
        })),
        excludedSectionIds: Array.from(inst.excludedSectionIds)
      }));
    }

    this.orderService.createOrder(dto).subscribe({
      next: (res) => {
        const orderId = res.data;
        if (!orderId) {
          this.notification.showError('Error al crear la orden');
          this.submitting = false;
          return;
        }
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
      error: () => {
        this.notification.showError('Error al crear la orden');
        this.submitting = false;
      }
    });
  }

  // ─── Nav ───────────────────────────────────────────────────────────────────

  goHome(): void { this.router.navigate(['/customer/home']); }

  trackById(_: number, item: any): string { return item.id ?? item.productId; }
}
