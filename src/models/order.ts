export interface OrderItemSummary {
  id: string;
  product_id: string;
  product_name: string;
  product_image: string | null;
  size_name: string | null;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Order {
  id?: string;
  user_id?: string;
  observation?: string;
  seller_code?: string | null;
  custom_fields?: Record<string, string> | null;
  customer_name?: string;
  customer_phone?: string | null;
  delivery_cep?: string | null;
  delivery_street?: string | null;
  delivery_number?: string | null;
  delivery_district?: string | null;
  delivery_city?: string | null;
  delivery_state?: string | null;
  status: string;
  total: number;
  created_at?: string;
  items?: OrderItemSummary[];
}
