export interface Product {
  id?: string;
  name: string;
  description: string;
  category?: {
    name: string;
  };
  category_id: string | undefined;
  user_id: string | undefined;
  featured: boolean;
  images?: string[] | null;
  currency: string;
  promotion_price?: number | null;
  price: number;
}
