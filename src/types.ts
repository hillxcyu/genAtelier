export interface UserPersona {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Non-binary';
  location: string;
  stylePreferences: string[];
  shoppingHistory: string[];
  cartItems: CatalogItem[];
  recommendedItems: CatalogItem[];
  imageUrl: string;
}

export interface BrandPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

export interface BrandVibe {
  palette: BrandPalette;
  font: 'sans' | 'serif' | 'mono';
  name: string;
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
