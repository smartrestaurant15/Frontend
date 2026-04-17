import { ProductType } from '@features/orders/models/order.model';

export interface CartItem {
  productId: string;
  productName: string;
  productType: ProductType;
  unitPrice: number;
  quantity: number;
  photo?: string;
  notes?: string;
}

export interface Cart {
  items: CartItem[];
}
