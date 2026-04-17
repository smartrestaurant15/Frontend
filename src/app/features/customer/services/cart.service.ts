import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CartItem } from '../models/cart.model';
import { ProductType } from '@features/orders/models/order.model';

@Injectable({ providedIn: 'root' })
export class CartService {

  private _items = new BehaviorSubject<CartItem[]>([]);
  readonly items$ = this._items.asObservable();

  get items(): CartItem[] { return this._items.getValue(); }

  get count(): number {
    return this.items.reduce((s, i) => s + i.quantity, 0);
  }

  get total(): number {
    return this.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  }

  add(item: { productId: string; productName: string; productType: ProductType; unitPrice: number; photo?: string }): void {
    const current = [...this.items];
    const idx = current.findIndex(i => i.productId === item.productId && i.productType === item.productType);
    if (idx >= 0) {
      current[idx] = { ...current[idx], quantity: current[idx].quantity + 1 };
    } else {
      current.push({ ...item, quantity: 1 });
    }
    this._items.next(current);
  }

  increment(productId: string, productType: ProductType): void {
    this._items.next(this.items.map(i =>
      i.productId === productId && i.productType === productType
        ? { ...i, quantity: i.quantity + 1 }
        : i
    ));
  }

  decrement(productId: string, productType: ProductType): void {
    const updated = this.items
      .map(i => i.productId === productId && i.productType === productType
        ? { ...i, quantity: i.quantity - 1 } : i)
      .filter(i => i.quantity > 0);
    this._items.next(updated);
  }

  remove(productId: string, productType: ProductType): void {
    this._items.next(this.items.filter(i => !(i.productId === productId && i.productType === productType)));
  }

  setNote(productId: string, productType: ProductType, notes: string): void {
    this._items.next(this.items.map(i =>
      i.productId === productId && i.productType === productType
        ? { ...i, notes } : i
    ));
  }

  clear(): void { this._items.next([]); }

  getQty(productId: string, productType: ProductType): number {
    return this.items.find(i => i.productId === productId && i.productType === productType)?.quantity ?? 0;
  }
}
