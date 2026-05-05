export interface DishCost {
  dishId: string;
  dishName: string;
  dishPrice: number;
  estimatedCost: number;
  margin: number;
}

export interface DrinkCost {
  drinkId: string;
  drinkName: string;
  drinkType: 'SIMPLE' | 'PREPARED';
  salePrice: number;
  purchasePrice: number | null;
  estimatedCost: number;
  margin: number;
  units: number;
}

export interface AdditionCost {
  additionId: string;
  additionName: string;
  additionType: 'SIMPLE' | 'PREPARED';
  salePrice: number;
  purchasePrice: number | null;
  estimatedCost: number;
  margin: number;
  units: number;
}

export interface AccountingSummary {
  totalExpenses: number;
  totalRevenue: number;
  inventoryCapital: number;
  drinkCapital: number;
  additionCapital: number;
  estimatedProfit: number;
  dishCosts: DishCost[];
  drinkCosts: DrinkCost[];
  additionCosts: AdditionCost[];
}
