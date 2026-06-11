export interface Product {
  id?: string;
  name: string;
  description: string;
  category?: {
    name: string;
  };
  product_size?: Array<{
    id: string;
    price?: number | null;
    size: {
      id: string;
      size: string;
    };
  }>;
  product_attribute?: [
    {
      attribute: {
        id: string;
        name: string;
      }
    }
  ]
  category_id: string | null;
  user_id: string | undefined;
  featured: boolean;
  active: boolean;
  images?: string[] | null;
  currency: string;
  promotion_price?: number | null;
  price: number;
  installment_available?: boolean;
  installment_with_interest?: boolean;
  installment_interest_value?: number | null;
  max_installments?: number;
  archived?: boolean;
  best_seller?: boolean;
  unit?: string | null;
  variation_label?: string | null;
  type?: string;
  price_on_request?: boolean;
}
