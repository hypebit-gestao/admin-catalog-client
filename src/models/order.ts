export interface Order {
  id?: string;
  user_id?: string;
  observation?: string;
  seller_code?: string | null;
  customer_name?: string;
  status: string;
  total: number;
  created_at?: string;
}
