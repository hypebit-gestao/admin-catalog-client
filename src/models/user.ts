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
  shipping_type: string | undefined | null;
  shipping_taxes: number | undefined | null;
  image_url?: string | null;
}

export interface UserShippingPut {
  id?: string;
  shipping_type: string | undefined;
  shipping_taxes: number | undefined;
}
