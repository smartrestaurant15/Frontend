// Modelo de Adición/Extra según especificación del backend
export interface Addition {
  id: string;
  name: string;
  description: string;
  price: number;
  photos: string[];
  createdAt: string;
  state: 'ACTIVE' | 'INACTIVE';
  units: number;
  minimumStock: number;
}

// DTO para crear adición
export interface CreateAdditionDTO {
  name: string;
  description: string;
  price: number;
  units: number;
  minimumStock: number;
}

// DTO para actualizar adición
export interface UpdateAdditionDTO {
  name: string;
  description: string;
  price: number;
  units: number;
  minimumStock: number;
}

// DTO para ajuste manual de stock de adición
export interface AdditionStockDTO {
  unit: number;
}

// Respuesta de adición
export interface AdditionResponse {
  id: string;
  name: string;
  photo: string;
  price: number;
  units: number;
}

// Detalle de adición
export interface AdditionDetailResponse {
  id: string;
  name: string;
  description: string;
  photos: string[];
  price: number;
  units: number;
  minimumStock: number;
}
