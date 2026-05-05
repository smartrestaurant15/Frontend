// Modelo de Producto según especificación del backend
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  weight: number;
  totalInventoryValue: number;
  photos: string[];
  state: 'ACTIVE' | 'INACTIVE';
  minimumStock: number;
  criticalStock?: number;
  currentWeight?: number;
  reservedWeight?: number;
  availableWeight?: number;
  suplier?: Suplier;
}

// DTO para crear producto
export interface CreateProductDTO {
  name: string;
  description: string;
  price: number;
  weight: number;
  photos: string[];
  minimumStock: number;
  criticalStock: number;
}

// DTO para actualizar producto
export interface UpdateProductDTO {
  name: string;
  description: string;
  price: number;
  weight: number;
  photos: string[];
  minimumStock: number;
  criticalStock: number;
  suplier_id: string;
}

// DTO para movimiento de stock
export interface StockMovementDTO {
  weight: number;
  unitPrice?: number;
  reason?: string;
}

// Proveedor asociado a producto
export interface Suplier {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  state: 'ACTIVE' | 'INACTIVE';
}

// Respuesta paginada de productos
export interface ProductListResponse {
  id: string;
  name: string;
  price: number;
  weight: number;
  totalInventoryValue: number;
  photo: string;
  minimumStock: number;
  criticalStock?: number;
  reservedWeight?: number;
  availableWeight?: number;
  state: string;
}
