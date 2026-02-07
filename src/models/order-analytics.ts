export interface OrderStatusSummary {
  status: string;
  count: number;
  revenue: number;
}

export interface OrderAnalyticsResponse {
  totalRevenue: number;
  deliveredRevenue: number;
  totalOrders: number;
  averageTicket: number;
  pendingOrders: number;
  statusSummary: OrderStatusSummary[];
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
