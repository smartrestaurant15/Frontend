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

export interface OrderTable {
  id: string;
  number: number;
  capacity: number;
  status: string;
  location: string;
}

export interface OrderPerson {
  email: string;
  firstName: string;
  lastName: string;
}

/** Detalle completo de orden (estructura real del backend) */
export interface OrderDetail {
  id: string;
  status: OrderStatus;
  channel: OrderChannel;
  customer: OrderPerson | null;
  waiter: OrderPerson | null;
  table: OrderTable | null;
  createdAt: string;
  updatedAt: string | null;
  items: OrderItem[];
  paymentStatus: OrderPaymentStatus;
  // alias de compatibilidad (legacy)
  customerName?: string;
  tableNumber?: string;
  totalAmount?: number;
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
  tableId?: string;       // ID real de RestaurantTable (presencial)
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
