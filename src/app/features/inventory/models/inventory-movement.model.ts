// Modelo de Movimiento de Inventario según especificación del backend
export interface InventoryMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'ENTRY' | 'EXIT';
  weight: number;
  timeAt: string;
  userName: string;
  reason: string;
  orderId: string | null;
}

// Tipo de movimiento
export type MovementType = 'ENTRY' | 'EXIT';

// Respuesta de movimiento de inventario
export interface InventoryMovementResponse {
  id: string;
  productId: string;
  productName: string;
  itemCategory: 'PRODUCT' | 'DRINK' | 'ADDITION' | null;
  type: string;
  weight: number;
  unitPrice: number;
  totalCost: number;
  timeAt: string;
  userName: string;
  reason: string;
  orderId: string | null;
}
