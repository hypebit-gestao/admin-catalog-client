export interface OrderStatusSummary {
  status: string;
  count: number;
  revenue: number;
}

export interface MonthlyRevenueTrend {
  month: string;
  revenue: number;
  orders: number;
}

export interface OrderAnalyticsResponse {
  totalRevenue: number;
  deliveredRevenue: number;
  totalOrders: number;
  averageTicket: number;
  pendingOrders: number;
  statusSummary: OrderStatusSummary[];
  monthlyRevenue: MonthlyRevenueTrend[];
}

export interface RecentOrderItem {
  id?: string;
  customer_name?: string;
  total: number;
  status: string;
}

export interface OrderDashboardResponse {
  totalRevenue: number;
  totalOrders: number;
  recentOrders: RecentOrderItem[];
  ordersByStatus: Record<string, number>;
}
