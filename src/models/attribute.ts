export interface Attribute {
  id?: string;
  name?: string;
  type?: number;
  user_id?: string | undefined;
}

export interface AttributeOption {
  id?: string;
  user_id?: string | undefined;
  option_name?: string;
  attribute_id?: string;
}

export interface AttributeProduct {
  id?: string;
  user_id?: string | undefined;
  attribute_id?: string;
  attribute_option_id?: string;
  product_id?: string;
}

