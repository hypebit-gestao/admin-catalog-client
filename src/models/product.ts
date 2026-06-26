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
    group_name?: string | null;
    image_index?: number | null;
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
  videos?: { url: string; orientation: 'horizontal' | 'vertical' }[] | null;
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
  discount_enabled?: boolean;
  max_discount_type?: 'percentage' | 'absolute';
  max_discount_value?: number | null;
  stock_enabled?: boolean;
  stock_quantity?: number | null;
  out_of_stock_behavior?: 'show_unavailable' | 'hide';
  volume_prices?: Array<{
    id: string;
    product_id: string;
    min_quantity: number;
    unit_price: number;
  }>;
}
