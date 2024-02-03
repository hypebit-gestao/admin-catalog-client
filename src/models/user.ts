export interface User {
  id?: string;
  name: string;
  cpf_cnpj: string;
  user_type: number;
  email: string;
  username: string;
  person_link: string;
  password?: string;
  address_id: string | undefined;
  phone: string;
  status: string;
  image_url?: string | null;
}
