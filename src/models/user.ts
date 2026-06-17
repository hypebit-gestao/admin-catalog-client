export interface User {
  id?: string;
  name: string;
  cpf_cnpj: string;
  user_type: number;
  email: string;
  person_link: string;
  password?: string;
  payer_id: number;
  address_id: string | undefined;
  phone: string;
  status: string;
  plan_id?: string | null;
  stripe_subscription_id?: string | null;
  asaas_customer_id?: string | null;
  shipping_type: string | undefined | null;
  shipping_taxes: number | undefined | null;
  image_url?: string | null;
  banner_url?: string | null;
  banners?: string[] | null;
  og_image_url?: string | null;
  background_color?: string | null;
  pix_discount?: number | null;
  credit_discount?: number | null;
  debit_discount?: number | null;
  ga_measurement_id?: string | null;
  theme?: string | null;
  origin_cep?: string | null;
  payment_methods?: string[] | null;
  pix_key?: string | null;
  installments_enabled?: boolean | null;
  max_installments?: number | null;
  installment_with_interest?: boolean | null;
  installment_interest_value?: number | null;
}

export interface UserShippingPut {
  id?: string;
  shipping_type: string | undefined;
  shipping_taxes: number | undefined;
  origin_cep?: string;
}

export interface UserPersonalizationColorPut {
  id?: string;
  background_color: string | null;
}

export interface UserDiscountsMethods {
  pix_discount?: number | null;
  credit_discount?: number | null;
  debit_discount?: number | null;
}

export interface UserStoreSettingsPut {
  id?: string;
  payment_methods?: string[] | null;
  pix_key?: string | null;
  installments_enabled?: boolean | null;
  max_installments?: number | null;
  installment_with_interest?: boolean | null;
  installment_interest_value?: number | null;
}
