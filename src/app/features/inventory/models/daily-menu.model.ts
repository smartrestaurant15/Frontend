// Modelo de Daily Menu según especificación del backend

export interface DailyMenuDish {
  id: string;
  name: string;
  price: number;
  photo: string;
}

export interface DailyMenuResponse {
  message: DailyMenuDish[] | string;
  error: boolean;
}
