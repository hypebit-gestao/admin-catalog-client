export interface Size {
  id?: string;
  size?: string;

  user?: {
    name: string;
  };
  user_id?: string | undefined;
}

export interface ProductSize {
  id?: string;
  product_id: string | undefined;
  size_id: string | undefined;
}
