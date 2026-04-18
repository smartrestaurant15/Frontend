// Modelo de Producto según especificación del backend
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  weight: number;
  photos: string[];
  state: 'ACTIVE' | 'INACTIVE';
  minimumStock: number;
  currentWeight?: number; // Stock actual del producto
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
}

// DTO para actualizar producto
export interface UpdateProductDTO {
  name: string;
  description: string;
  price: number;
  weight: number;
  photos: string[];
  minimumStock: number;
}

// DTO para movimiento de stock
export interface StockMovementDTO {
  weight: number;
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
  photo: string;
  minimumStock: number;
  state: string;
}
