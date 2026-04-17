export type TableStatus = 'FREE' | 'OCCUPIED' | 'RESERVED';

export interface RestaurantTable {
  id: string;
  number: number;
  capacity: number;
  status: TableStatus;
  location: string | null;
  active: boolean;
}

export interface CreateTableDTO {
  number: number;
  capacity: number;
  location?: string;
}

export interface UpdateTableDTO {
  capacity?: number;
  location?: string;
}
