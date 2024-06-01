export interface Product {
  id?: string;
  name: string;
  description: string;
  category?: {
    name: string;
  };
  product_size?: [
    {
      size: {
        id: string;
        size: string;
      };
    }
  ];
  category_id: string | null;
  user_id: string | undefined;
  featured: boolean;
  active: boolean;
  images?: string[] | null;
  currency: string;
  promotion_price?: number | null;
  price: number;
}
