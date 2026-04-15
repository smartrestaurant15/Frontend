import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DishService } from '@features/inventory/services/dish.service';
import { DrinkService } from '@features/inventory/services/drink.service';
import { AdditionService } from '@features/inventory/services/addition.service';
import { OrderService } from '../../services/order.service';
import { NotificationService } from '@core/services/notification.service';
import { CartItem, CreateOrderDTO, ProductType } from '../../models/order.model';

@Component({
  selector: 'app-order-create',
  templateUrl: './order-create.component.html',
  styleUrls: ['./order-create.component.scss']
})
export class OrderCreateComponent implements OnInit {

  @Input()  isOpen = false;
  @Output() closeModal  = new EventEmitter<void>();
  @Output() orderSaved  = new EventEmitter<void>();

  activeTab: ProductType = 'DISH';
  dishes:    any[] = [];
  drinks:    any[] = [];
  additions: any[] = [];
  cart:      CartItem[] = [];

  form: FormGroup;
  loading  = false;
  submitting = false;

  constructor(
    private fb: FormBuilder,
    private dishService: DishService,
    private drinkService: DrinkService,
    private additionService: AdditionService,
    private orderService: OrderService,
    private notification: NotificationService
  ) {
    this.form = this.fb.group({
      tableNumber: [''],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading = true;

    this.dishService.getDishes(0).subscribe({
      next: res => {
        this.dishes = Array.isArray(res.message) ? res.message : [];
        this.loading = false;
      },
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
        quantity:    1
      });
    }
  }

  removeFromCart(index: number): void {
    this.cart.splice(index, 1);
  }

  decreaseQty(item: CartItem): void {
    if (item.quantity > 1) { item.quantity--; }
    else { this.cart = this.cart.filter(i => i !== item); }
  }

  get cartTotal(): number {
    return this.cart.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  }

  submit(): void {
    if (this.cart.length === 0) {
      this.notification.showError('Agrega al menos un producto');
      return;
    }

    this.submitting = true;

    const dto: CreateOrderDTO = {
      channel:     'PRESENTIAL',
      tableNumber: this.form.value.tableNumber || undefined,
      items: this.cart.map(i => ({
        productId:   i.productId,
        productType: i.productType,
        quantity:    i.quantity,
        notes:       undefined
      }))
    };

    this.orderService.createOrder(dto).subscribe({
      next: () => {
        this.notification.showSuccess('Orden creada exitosamente');
        this.cart = [];
        this.form.reset();
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
    this.cart = [];
    this.form.reset();
    this.closeModal.emit();
  }
}
