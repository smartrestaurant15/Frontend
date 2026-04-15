export type OrderStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DELIVERED' | 'CANCELLED';
export type OrderChannel = 'PRESENTIAL' | 'ONLINE';
export type OrderPaymentStatus = 'PENDING' | 'CONFIRMED' | 'NOT_REQUIRED';
export type ProductType = 'DISH' | 'DRINK' | 'ADDITION';

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING:     'Pendiente',
  IN_PROGRESS: 'En preparación',
  COMPLETED:   'Listo',
  DELIVERED:   'Entregado',
  CANCELLED:   'Cancelado'
};

export const ORDER_STATUS_CLASS: Record<OrderStatus, string> = {
  PENDING:     'status-pending',
  IN_PROGRESS: 'status-in-progress',
  COMPLETED:   'status-completed',
  DELIVERED:   'status-delivered',
  CANCELLED:   'status-cancelled'
};

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productType: ProductType;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

/** Resumen de orden — usado en listas */
export interface Order {
  id: string;
  status: OrderStatus;
  channel: OrderChannel;
  customerName: string;
  createdAt: string;
  itemCount: number;
  totalAmount: number;
}

/** Detalle completo de orden */
export interface OrderDetail {
  id: string;
  status: OrderStatus;
  channel: OrderChannel;
  customerName: string;
  waiterId?: string;
  tableNumber?: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  totalAmount: number;
  paymentStatus?: OrderPaymentStatus;
}

export interface CreateOrderItemDTO {
  productId: string;
  productType: ProductType;
  quantity: number;
  notes?: string;
}

export interface CreateOrderDTO {
  channel: OrderChannel;
  customerId?: number;
  waiterId?: number;
  tableNumber?: string;
  items: CreateOrderItemDTO[];
}

export interface UpdateOrderDTO {
  status: OrderStatus;
  tableNumber?: string;
  notes?: string;
}

/** Item en el carrito local (antes de enviar al backend) */
export interface CartItem {
  productId: string;
  productName: string;
  productType: ProductType;
  unitPrice: number;
  quantity: number;
  notes?: string;
}
