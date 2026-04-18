// Modelo de Bebida según especificación del backend
export interface Drink {
  id: string;
  name: string;
  description: string;
  mililiters: number;
  alcohol: boolean;
  photos: string[];
  units: number;
  minimumStock: number;
  state: 'ACTIVE' | 'INACTIVE';
  categoryId?: string;
  categoryName?: string;
}

// DTO para crear bebida
export interface CreateDrinkDTO {
  name: string;
  description: string;
  mililiters: number;
  alcohol: boolean;
  photos: string[];
  units: number;
  minimumStock: number;
}

// DTO para actualizar bebida
export interface UpdateDrinkDTO {
  name: string;
  description: string;
  mililiters: number;
  alcohol: boolean;
  photos: string[];
  units: number;
  minimumStock: number;
}

// DTO para ajuste manual de stock de bebida
export interface DrinkStockDTO {
  unit: number;
}

// Respuesta de bebida
export interface DrinkResponse {
  id: string;
  name: string;
  mililiters: number;
  alcohol: boolean;
  photo: string;
  units: number;
  state: string;
}

// Detalle de bebida
export interface DrinkDetailResponse {
  id: string;
  name: string;
  description: string;
  mililiters: number;
  alcohol: boolean;
  photo: string;
  units: number;
  minimumStock: number;
  state: string;
  categoryName: string;
}
