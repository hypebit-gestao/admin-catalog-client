export interface Recipe {
  id?: string;
  user_id?: string;
  title: string;
  description?: string | null;
  videos?: string[] | null;
  display_order?: number | null;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}
