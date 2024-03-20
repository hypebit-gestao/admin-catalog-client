export interface Category {
  id?: string;
  name?: string;
  category_id?: string;

  user?: {
    name: string;
  };
  user_id?: string | undefined;
  image_url?: string;
}
