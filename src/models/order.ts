export interface Order {
  id?: string;
  user_id?: string;
  observation?: string;
  customer_name?: string;
  status: string;
  total: number;
}
