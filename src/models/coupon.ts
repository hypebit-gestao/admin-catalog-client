export interface Coupon {
  id?: string;
  user_id?: string;
  code: string;
  discount: number;
  stock: number;
  active: boolean;
  expires_at: Date | any;
}
