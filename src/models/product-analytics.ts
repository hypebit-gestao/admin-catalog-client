export interface ProductCategoryItem {
  categoryName: string;
  count: number;
}

export interface ProductAnalyticsResponse {
  totalProducts: number;
  activeProducts: number;
  featuredProducts: number;
  productsWithoutCategory: number;
}

export interface ProductByCategoryResponse {
  categories: ProductCategoryItem[];
}
