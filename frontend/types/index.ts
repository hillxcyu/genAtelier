export interface BrandVibe {
  name: string;
  colors: string[];
  font: 'sans' | 'serif' | 'mono';
  accentColor: string;
  mood: string;
  keywords: string[];
  fonts?: string[];
}

export interface CatalogItem {
  id: string;
  name: string;
  category: string;
  price: string;
  imageUrl: string;
}

export interface UserPersona {
  id: string;
  name: string;
  age: number;
  gender: string;
  location: string;
  stylePreferences: string[];
  imageUrl: string;
  cartItems: CatalogItem[];
  recommendedItems: CatalogItem[];
}
