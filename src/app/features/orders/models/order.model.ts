/**
 * Estados del ciclo de vida de una orden — deben coincidir exactamente
 * con el enum OrderStatus del backend.
 *
 * Flujo: PENDING → SENT → IN_PROGRESS → COMPLETED → DELIVERED
 *                                                  ↘ CANCELLED (desde PENDING, SENT o IN_PROGRESS)
 */
export type OrderStatus =
  | 'PENDING'      // Borrador: el mesero está construyendo el pedido
  | 'SENT'         // Enviado a cocina
  | 'IN_PROGRESS'  // Cocina inició la preparación
  | 'COMPLETED'    // Cocina terminó, listo para entregar
  | 'DELIVERED'    // Entregado al cliente
  | 'CANCELLED';   // Cancelado

export type OrderChannel = 'PRESENTIAL' | 'ONLINE';
export type OrderPaymentStatus = 'PENDING' | 'CONFIRMED' | 'NOT_REQUIRED';
export type ProductType = 'DISH' | 'DRINK' | 'ADDITION';

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING:     'Borrador',
  SENT:        'Enviado',
  IN_PROGRESS: 'En preparación',
  COMPLETED:   'Listo',
  DELIVERED:   'Entregado',
  CANCELLED:   'Cancelado',
};

export const ORDER_STATUS_CLASS: Record<OrderStatus, string> = {
  PENDING:     'status-pending',
  SENT:        'status-sent',
  IN_PROGRESS: 'status-in-progress',
  COMPLETED:   'status-completed',
  DELIVERED:   'status-delivered',
  CANCELLED:   'status-cancelled',
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
  paymentStatus: OrderPaymentStatus;
  menuInstanceCount: number;
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
  menuInstances: GetMenuInstanceDTO[];
  notes?: string;
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
  tableId?: string;                        // ID real de RestaurantTable (presencial)
  notes?: string;
  items?: CreateOrderItemDTO[];            // Opcional: puede haber solo menú del día
  menuInstances?: CreateMenuInstanceDTO[]; // Opcional: instancias del menú del día
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

// ─── Menú del Día — Respuesta del backend ────────────────────────────────────

/** Instancia de menú del día dentro del detalle de una orden */
export interface GetMenuInstanceDTO {
  id: string;
  publicationId: string;
  publicationDate: string;    // 'YYYY-MM-DD'
  timeSlot: string;           // 'LUNCH' | 'DINNER' | 'ALL_DAY'
  basePrice: number;
  seatIdentifier: string | null;
  observation: string | null;
  selections: GetMenuSectionSelectionDTO[];
  exclusions: GetMenuSectionExclusionDTO[];
}

/** Sección seleccionada dentro de una instancia de menú */
export interface GetMenuSectionSelectionDTO {
  sectionId: string;
  sectionName: string;
  optionId: string;
  optionName: string;
  additionalCost: number;
  observation: string | null;
}

/** Sección excluida dentro de una instancia de menú */
export interface GetMenuSectionExclusionDTO {
  sectionId: string;
  sectionName: string;
}

// ─── Menú del Día — Envío al backend ─────────────────────────────────────────

/** DTO para crear una instancia de menú del día en un pedido */
export interface CreateMenuInstanceDTO {
  publicationId: string;
  seatIdentifier?: string;
  observation?: string;
  selections: CreateMenuSectionSelectionDTO[];
  excludedSectionIds: string[];
}

/** DTO para una selección de opción dentro de una sección */
export interface CreateMenuSectionSelectionDTO {
  sectionId: string;
  optionId: string;
  observation?: string;
}

// ─── Menú del Día — Modelo local (borrador en memoria) ───────────────────────

/**
 * Borrador de instancia de menú mientras el usuario configura el pedido.
 * Usa Map y Set para validaciones y lookups O(1).
 * Se serializa a CreateMenuInstanceDTO al enviar.
 */
export interface MenuInstanceDraft {
  seatIdentifier: string;
  observation: string;
  /** key = sectionId */
  selections: Map<string, MenuSelectionDraft>;
  excludedSectionIds: Set<string>;
}

/** Selección individual dentro de un MenuInstanceDraft */
export interface MenuSelectionDraft {
  sectionId: string;
  sectionName: string;
  optionId: string;
  optionName: string;
  additionalCost: number;
  observation: string;
}
