export interface Category {
  id?: string;
  name?: string;
  category_id?: string;
  description?: string;
  user?: {
    name: string;
  };
  category?: {
    id?: string;
    name: string;
    description: string;
  };
  user_id?: string | undefined;
  image_url?: string;
}
