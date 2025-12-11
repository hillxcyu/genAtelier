export interface BrandVibe {
  colors: string[];
  font: 'sans' | 'serif' | 'mono';
  name: string;
  accentColor: string;
  mood?: string;
  keywords?: string[];
  fonts?: string[];
}

export interface CatalogItem {
  id: string;
  name: string;
  category: string;
  price: string;
  imageUrl: string;
}
