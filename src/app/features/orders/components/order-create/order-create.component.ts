import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { DishService } from '@features/inventory/services/dish.service';
import { DrinkService } from '@features/inventory/services/drink.service';
import { AdditionService } from '@features/inventory/services/addition.service';
import { MenuPublicationService } from '@features/inventory/services/menu-publication.service';
import { OrderService } from '../../services/order.service';
import { TableService, TableDTO } from '../../services/table.service';
import { NotificationService } from '@core/services/notification.service';
import { StorageService } from '@core/services/storage.service';
import {
  CartItem, CreateOrderDTO, ProductType,
  MenuInstanceDraft, MenuSelectionDraft
} from '../../models/order.model';
import { ActiveMenuDTO, PublicationSectionDTO, SectionOptionDTO } from '@features/inventory/models/menu.model';

@Component({
  selector: 'app-order-create',
  templateUrl: './order-create.component.html',
  styleUrls: ['./order-create.component.scss']
})
export class OrderCreateComponent implements OnInit {

  @Input()  isOpen = false;
  @Output() closeModal = new EventEmitter<void>();
  @Output() orderSaved = new EventEmitter<void>();

  // Productos
  dishes:    any[] = [];
  drinks:    any[] = [];
  additions: any[] = [];
  activeTab: ProductType = 'DISH';

  // Mesas
  tables:            TableDTO[] = [];
  filteredTables:    TableDTO[] = [];
  selectedTableId    = '';
  selectedTableLabel = '';
  tableSearch        = '';
  tableDropdownOpen  = false;

  // Carrito
  cart: CartItem[] = [];

  // Notas por item — map productId+type → note
  itemNotes: Record<string, string> = {};
  editingNoteKey: string | null = null;

  // Notas generales del pedido
  orderNotes = '';

  // Menú del día
  activeMenu:     ActiveMenuDTO | null = null;
  loadingMenu     = false;
  menuInstances:  MenuInstanceDraft[] = [];

  loading    = false;
  submitting = false;

  // Búsqueda de productos
  searchQuery = '';

  constructor(
    private dishService: DishService,
    private drinkService: DrinkService,
    private additionService: AdditionService,
    private menuPublicationService: MenuPublicationService,
    private orderService: OrderService,
    private tableService: TableService,
    private notification: NotificationService,
    private storageService: StorageService
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    this.loadTables();
    this.loadActiveMenu();
  }

  loadProducts(): void {
    this.loading = true;
    this.dishService.getDishes(0).subscribe({
      next: res => {
        this.dishes = this.asArray(res.message).filter((d: any) => d.availability !== 'MENU_DEL_DIA');
        this.loading = false;
      },
      error: () => { this.dishes = []; this.loading = false; }
    });
    this.drinkService.getDrinks(0).subscribe({
      next: res => { this.drinks = this.asArray(res.message); },
      error: () => { this.drinks = []; }
    });
    this.additionService.getAdditions(0).subscribe({
      next: res => { this.additions = this.asArray(res.message); },
      error: () => { this.additions = []; }
    });
  }

  loadTables(): void {
    this.tableService.getTables('FREE').subscribe({
      next: tables => {
        this.tables         = tables || [];
        this.filteredTables = this.tables;
      },
      error: () => { this.tables = []; this.filteredTables = []; }
    });
  }

  loadActiveMenu(): void {
    this.loadingMenu = true;
    this.menuPublicationService.getActive().subscribe({
      next: res => {
        this.activeMenu  = (res as any).data ?? (res as any).message ?? null;
        this.loadingMenu = false;
      },
      error: () => { this.activeMenu = null; this.loadingMenu = false; }
    });
  }

  // ─── Menú del Día ────────────────────────────────────────────────────────────

  addMenuInstance(): void {
    this.menuInstances = [
      ...this.menuInstances,
      {
        seatIdentifier: `Puesto ${this.menuInstances.length + 1}`,
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
    // Forzar detección de cambios mutando la referencia del array
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

  /** Devuelve la selección actual de una sección en una instancia, o null. */
  getSelectionFor(inst: MenuInstanceDraft, sectionId: string): MenuSelectionDraft | null {
    return inst.selections.get(sectionId) ?? null;
  }

  /** Calcula el subtotal de una instancia de menú (base + extras seleccionados). */
  instanceTotal(inst: MenuInstanceDraft): number {
    if (!this.activeMenu) return 0;
    const extras = Array.from(inst.selections.values())
      .reduce((sum, s) => sum + s.additionalCost, 0);
    return this.activeMenu.basePrice + extras;
  }

  // ─── Tabla ───────────────────────────────────────────────────────────────────

  onTableSearch(): void {
    this.tableDropdownOpen = true;
    const q = this.tableSearch.trim().toLowerCase();
    this.filteredTables = q
      ? this.tables.filter(t =>
          String(t.number).includes(q) ||
          t.location?.toLowerCase().includes(q))
      : this.tables;
    if (!this.tableSearch.trim()) this.clearTable();
  }

  selectTable(t: TableDTO): void {
    this.selectedTableId    = t.id;
    this.selectedTableLabel = `Mesa ${t.number}${t.location ? ' · ' + t.location : ''}`;
    this.tableSearch        = '';
    this.tableDropdownOpen  = false;
  }

  clearTable(): void {
    this.selectedTableId    = '';
    this.selectedTableLabel = '';
    this.tableSearch        = '';
  }

  // ─── Productos ───────────────────────────────────────────────────────────────

  /** Devuelve el precio de venta independientemente del tipo de producto */
  getProductPrice(product: any): number {
    return product.price ?? product.salePrice ?? 0;
  }

  get filteredProducts(): any[] {
    const products = this.currentProducts;
    if (!this.searchQuery.trim()) return products;
    const q = this.searchQuery.toLowerCase();
    return products.filter(p => p.name?.toLowerCase().includes(q));
  }

  get currentProducts(): any[] {
    if (this.activeTab === 'DISH')     return this.dishes;
    if (this.activeTab === 'DRINK')    return this.drinks;
    if (this.activeTab === 'ADDITION') return this.additions;
    return [];
  }

  addToCart(product: any): void {
    const existing = this.cart.find(
      i => i.productId === product.id && i.productType === this.activeTab
    );
    if (existing) {
      existing.quantity++;
    } else {
      this.cart.push({
        productId:   product.id,
        productName: product.name,
        productType: this.activeTab,
        unitPrice:   this.getProductPrice(product),
        quantity:    1,
      });
    }
  }

  removeFromCart(index: number): void {
    const item = this.cart[index];
    delete this.itemNotes[this.noteKey(item)];
    this.cart.splice(index, 1);
  }

  decreaseQty(item: CartItem): void {
    if (item.quantity > 1) item.quantity--;
    else this.cart = this.cart.filter(i => i !== item);
  }

  noteKey(item: CartItem): string {
    return `${item.productId}_${item.productType}`;
  }

  setNote(item: CartItem, note: string): void {
    this.itemNotes[this.noteKey(item)] = note;
    item.notes = note || undefined;
    this.editingNoteKey = null;
  }

  // ─── Totales y validación ─────────────────────────────────────────────────────

  get cartTotal(): number {
    const itemsTotal = this.cart.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
    const menuTotal  = this.menuInstances.reduce((sum, inst) => sum + this.instanceTotal(inst), 0);
    return itemsTotal + menuTotal;
  }

  get menuInstanceCount(): number {
    return this.menuInstances.length;
  }

  get allMenuInstancesValid(): boolean {
    if (!this.activeMenu) return false;
    return this.menuInstances.every(inst =>
      this.activeMenu!.sections
        .filter(s => s.required)
        .every(s => inst.selections.has(s.id) || inst.excludedSectionIds.has(s.id))
    );
  }

  get canSubmit(): boolean {
    const hasItems      = this.cart.length > 0;
    const hasValidMenus = this.menuInstances.length > 0 && this.allMenuInstancesValid;
    return (hasItems || hasValidMenus) && !this.submitting;
  }

  // ─── Submit ──────────────────────────────────────────────────────────────────

  submit(): void {
    if (!this.canSubmit) return;

    if (!this.selectedTableId) {
      this.notification.showError('Selecciona una mesa antes de crear la orden');
      return;
    }

    this.submitting = true;
    const user = this.storageService.getUser();

    const dto: CreateOrderDTO = {
      channel: 'PRESENTIAL',
      waiterId: user?.id ?? undefined,
      tableId:  this.selectedTableId || undefined,
      notes:    this.orderNotes.trim() || undefined,
    };

    if (this.cart.length > 0) {
      dto.items = this.cart.map(i => ({
        productId:   i.productId,
        productType: i.productType,
        quantity:    i.quantity,
        notes:       i.notes || undefined
      }));
    }

    if (this.menuInstances.length > 0 && this.activeMenu) {
      dto.menuInstances = this.menuInstances.map(inst => ({
        publicationId:     this.activeMenu!.id,
        seatIdentifier:    inst.seatIdentifier.trim() || undefined,
        observation:       inst.observation.trim() || undefined,
        selections: Array.from(inst.selections.values()).map(s => ({
          sectionId:   s.sectionId,
          optionId:    s.optionId,
          observation: s.observation.trim() || undefined
        })),
        excludedSectionIds: Array.from(inst.excludedSectionIds)
      }));
    }

    this.orderService.createOrder(dto).subscribe({
      next: () => {
        this.notification.showSuccess('Orden creada');
        this.reset();
        this.submitting = false;
        this.orderSaved.emit();
        this.closeModal.emit();
      },
      error: (err) => {
        if (err?.status !== 409) {
          this.notification.showError('Error al crear la orden');
        }
        this.submitting = false;
      }
    });
  }

  close(): void {
    this.reset();
    this.closeModal.emit();
  }

  private reset(): void {
    this.cart            = [];
    this.itemNotes       = {};
    this.orderNotes      = '';
    this.menuInstances   = [];
    this.selectedTableId    = '';
    this.selectedTableLabel = '';
    this.tableSearch        = '';
    this.tableDropdownOpen  = false;
    this.searchQuery     = '';
    this.editingNoteKey  = null;
    this.activeTab       = 'DISH';
  }

  private asArray<T>(val: any): T[] {
    return Array.isArray(val) ? val : [];
  }

  trackById(_: number, item: any): string {
    return item.id ?? item.productId;
  }

  trackByIndex(index: number): number {
    return index;
  }
}
