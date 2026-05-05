export type AdditionType = 'SIMPLE' | 'PREPARED';

export interface AdditionRecipeItem {
  productId: string;
  productName: string;
  weight: number;
  unit: string;
}

export interface CreateAdditionRecipeDTO {
  productId: string;
  weight: number;
  unit: string;
}

// DTO para crear adición
export interface CreateAdditionDTO {
  name: string;
  description: string;
  additionType: AdditionType;
  salePrice: number;
  photos?: string[];
  // SIMPLE only
  purchasePrice?: number;
  units?: number;
  minimumStock?: number;
  // PREPARED only
  recipes?: CreateAdditionRecipeDTO[];
}

// DTO para actualizar adición
export interface UpdateAdditionDTO {
  name: string;
  description: string;
  salePrice: number;
  photos?: string[];
  // SIMPLE only
  units?: number;
  minimumStock?: number;
  // PREPARED only
  recipes?: CreateAdditionRecipeDTO[];
}

// DTO para reabastecimiento de adición simple
export interface AdditionRestockDTO {
  unit: number;
  purchasePrice: number;
}

// Respuesta de lista de adiciones
export interface AdditionResponse {
  id: string;
  name: string;
  photo: string;
  additionType: AdditionType;
  salePrice: number;
  units: number;
  availableUnits: number;
  state: string;
}

// Detalle de adición
export interface AdditionDetailResponse {
  id: string;
  name: string;
  description: string;
  photos: string[];
  additionType: AdditionType;
  purchasePrice?: number;
  salePrice: number;
  estimatedCost?: number;
  margin?: number;
  units: number;
  reservedUnits: number;
  availableUnits: number;
  minimumStock: number;
  state: string;
  recipes?: AdditionRecipeItem[];
}
