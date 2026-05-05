export type DrinkType = 'SIMPLE' | 'PREPARED';

// ——— Receta ———

export interface DrinkRecipeItem {
  productId: string;
  productName: string;
  weight: number;
  unit: string;
}

export interface CreateDrinkRecipeDTO {
  productId: string;
  weight: number;
  unit: string;
}

// ——— Creación y actualización ———

export interface CreateDrinkDTO {
  name: string;
  description: string;
  mililiters: number;
  drinkType: DrinkType;
  purchasePrice?: number;         // solo SIMPLE
  salePrice: number;
  alcohol: boolean;
  photos: string[];
  units?: number;                 // solo SIMPLE
  minimumStock?: number;          // solo SIMPLE
  recipes?: CreateDrinkRecipeDTO[]; // solo PREPARED
}

export interface UpdateDrinkDTO {
  name: string;
  description: string;
  mililiters: number;
  salePrice: number;
  alcohol: boolean;
  photos: string[];
  units?: number;
  minimumStock?: number;
  recipes?: CreateDrinkRecipeDTO[];
}

// ——— Reabastecimiento (solo SIMPLE) ———

export interface DrinkRestockDTO {
  unit: number;
  purchasePrice: number;
}

// ——— Descuento de stock ———

export interface DrinkStockDTO {
  unit: number;
}

// ——— Respuestas del servidor ———

export interface DrinkResponse {
  id: string;
  name: string;
  mililiters: number;
  drinkType: DrinkType;
  salePrice: number;
  alcohol: boolean;
  photo: string;
  units: number;
  reservedUnits?: number;
  availableUnits?: number;
  state: string;
}

export interface DrinkDetailResponse {
  id: string;
  name: string;
  description: string;
  mililiters: number;
  drinkType: DrinkType;
  purchasePrice?: number;
  salePrice: number;
  estimatedCost?: number;
  margin?: number;
  alcohol: boolean;
  photo: string;
  units: number;
  minimumStock: number;
  reservedUnits?: number;
  availableUnits?: number;
  state: string;
  categoryId: string;
  categoryName: string;
  recipes?: DrinkRecipeItem[];
}
