import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { DishService } from '@features/inventory/services/dish.service';
import { DrinkService } from '@features/inventory/services/drink.service';
import { AdditionService } from '@features/inventory/services/addition.service';
import { OrderService } from '../../services/order.service';
import { TableService, TableDTO } from '../../services/table.service';
import { NotificationService } from '@core/services/notification.service';
import { StorageService } from '@core/services/storage.service';
import { CartItem, CreateOrderDTO, ProductType } from '../../models/order.model';

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

  loading    = false;
  submitting = false;

  // Búsqueda de productos
  searchQuery = '';

  constructor(
    private dishService: DishService,
    private drinkService: DrinkService,
    private additionService: AdditionService,
    private orderService: OrderService,
    private tableService: TableService,
    private notification: NotificationService,
    private storageService: StorageService
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    this.loadTables();
  }

  loadProducts(): void {
    this.loading = true;
    this.dishService.getDishes(0).subscribe({
      next: res => { this.dishes = this.asArray(res.message); this.loading = false; },
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

  onTableSearch(): void {
    this.tableDropdownOpen = true;
    const q = this.tableSearch.trim().toLowerCase();
    this.filteredTables = q
      ? this.tables.filter(t =>
          String(t.number).includes(q) ||
          t.location?.toLowerCase().includes(q))
      : this.tables;
    // Si el usuario borra el texto, limpiar selección
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
        unitPrice:   parseFloat(product.price) || 0,
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

  get cartTotal(): number {
    return this.cart.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  }

  get canSubmit(): boolean {
    return this.cart.length > 0 && !this.submitting;
  }

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
      items: this.cart.map(i => ({
        productId:   i.productId,
        productType: i.productType,
        quantity:    i.quantity,
        notes:       i.notes || undefined
      }))
    };

    this.orderService.createOrder(dto).subscribe({
      next: () => {
        this.notification.showSuccess('Orden creada');
        this.reset();
        this.submitting = false;
        this.orderSaved.emit();
        this.closeModal.emit();
      },
      error: () => {
        this.notification.showError('Error al crear la orden');
        this.submitting = false;
      }
    });
  }

  close(): void {
    this.reset();
    this.closeModal.emit();
  }

  private reset(): void {
    this.cart = [];
    this.itemNotes = {};
    this.selectedTableId    = '';
    this.selectedTableLabel = '';
    this.tableSearch        = '';
    this.tableDropdownOpen  = false;
    this.searchQuery = '';
    this.editingNoteKey = null;
    this.activeTab = 'DISH';
  }

  private asArray<T>(val: any): T[] {
    return Array.isArray(val) ? val : [];
  }

  trackById(_: number, item: any): string {
    return item.id ?? item.productId;
  }
}
