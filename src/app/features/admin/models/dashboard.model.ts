export interface RevenueMetric {
  today: number;
  thisWeek: number;
  thisMonth: number;
}

export interface TopDish {
  id: string;
  name: string;
  price: number;
  totalSold: number;
  totalRevenue: number;
}

export interface CancellationMetric {
  total: number;
  cancelled: number;
  rate: number;
}

export interface LowStockProduct {
  id: string;
  name: string;
  minimumStock: number;
  currentStock: number;
}

export interface CustomerMetric {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
}

export interface DashboardData {
  revenue: RevenueMetric;
  activeOrders: number;
  averageTicket: number;
  topDishes: TopDish[];
  cancellation: CancellationMetric;
  lowStockProducts: LowStockProduct[];
  customers: CustomerMetric;
  inventoryCapital: number;
  monthlyExpenses: number;
  estimatedProfit: number;
}
