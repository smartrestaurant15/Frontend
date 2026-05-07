export type DishAvailability = 'REGULAR' | 'MENU_DEL_DIA' | 'BOTH';

// Modelo de Plato según especificación del backend
export interface Dish {
  id: string;
  name: string;
  description: string;
  price: string;
  photos: string[];
  state: 'ACTIVE' | 'INACTIVE';
  availability: DishAvailability;
  categoryId?: string;
  categoryName?: string;
  ingredients?: Recipe[];
}

// DTO para crear plato
export interface CreateDishDTO {
  name: string;
  description: string;
  price: number;
  photos: string[];
  ingredients: CreateRecipeDTO[];
  availability: DishAvailability;
}

// DTO para actualizar plato
export interface UpdateDishDTO {
  name: string;
  description: string;
  price: number;
  photos: string[];
  ingredients: CreateRecipeDTO[];
  categoryId: string;
  availability: DishAvailability;
}

// Ingrediente de receta (GetRecipeDTO del backend)
// NOTA: El backend devuelve los campos en snake_case
export interface Recipe {
  product_id: string;
  product_name: string;
  weight: number;
  unit: string;
}

// DTO para crear ingrediente
export interface CreateRecipeDTO {
  product_id: string;
  quantity: number;
  unit: string;
}

// Respuesta de plato
export interface DishResponse {
  id: string;
  name: string;
  price: string;
  photo: string;
  availability: DishAvailability;
}

// Detalle de plato
export interface DishDetailResponse {
  id: string;
  name: string;
  description: string;
  price: string;
  photos: string[];
  ingredients: Recipe[];
  categoryId: string;
  categoryName: string;
  estimatedCost: number;
  margin: number;
  availability: DishAvailability;
}
