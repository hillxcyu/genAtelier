import { ai } from '../utils/genai';
import { BrandVibe, CatalogItem } from '../types';
import { saveCatalogToDB } from '../utils/db';

export type IngestionProgressCallback = (progress: string) => void;

interface BrandAnalysisResult {
  name: string;
  colors: string[];
  fonts: string[];
  fontCategory?: 'sans' | 'serif' | 'mono';
  mood: string;
  keywords: string[];
  products: {
    name: string;
    category: string;
    price: string;
    imageUrl?: string;
  }[];
}

async function generateProductImage(productName: string, category: string, mood: string): Promise<string | null> {
  try {
    const prompt = `Professional e-commerce product photography of ${productName} (${category}). Style: ${mood}. Clean, high quality, neutral background, fashion catalog style.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { role: 'user', parts: [{ text: prompt }] },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (e) {
    console.error("Image gen failed", e);
    return null;
  }
}

export async function generateBrandAndCatalog(
  url: string, 
  onProgress?: IngestionProgressCallback,
  onBrandVibeReady?: (vibe: BrandVibe) => void,
  onCatalogUpdate?: (catalog: CatalogItem[]) => void,
  batchSize: number = 3
): Promise<{ brandVibe: BrandVibe; catalog: CatalogItem[] }> {
  
  if (onProgress) onProgress('Scraping & Extracting Brand DNA...');

  try {
    // 1. Call Backend Scraper + Extractor
    const response = await fetch('/api/extract-brand', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });

    if (!response.ok) {
      throw new Error(`Extraction failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Create Brand Vibe
    const brandVibe: BrandVibe = {
      name: data.brandVibe.name || url,
      colors: data.brandVibe.colors || ['#000000', '#ffffff', '#333333'],
      font: data.brandVibe.fontCategory || 'sans',
      accentColor: data.brandVibe.colors ? (data.brandVibe.colors[1] || data.brandVibe.colors[0]) : '#c026d3',
      mood: data.brandVibe.mood,
      keywords: data.brandVibe.keywords,
      fonts: data.brandVibe.fonts
    };

    if (onBrandVibeReady) {
      onBrandVibeReady(brandVibe);
    }

    const newCatalog: CatalogItem[] = [];

    // 2. Process Products (Generate images if scraped ones are missing or low quality)
    if (data.products && data.products.length > 0) {
      const products = data.products;
      const mood = data.brandVibe.mood || "High-end Fashion";

      for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize);
        if (onProgress) {
          onProgress(`Processing catalog assets ${i + 1}-${Math.min(i + batchSize, products.length)} of ${products.length}...`);
        }
        
        const batchResults = await Promise.all(batch.map(async (p: any, batchIndex: number) => {
          const globalIndex = i + batchIndex;
          let imageUrl = p.imageUrl;

          // If no image scraped, generate one
          if (!imageUrl || imageUrl.length < 10) {
             imageUrl = await generateProductImage(p.name, p.category, mood);
          }
          
          // Fallback
          if (!imageUrl) {
             imageUrl = `https://picsum.photos/seed/${p.name.replace(/\s/g, '')}/400/600`;
          }

          return {
            id: `extracted-${globalIndex}`,
            name: p.name,
            category: p.category,
            price: p.price,
            imageUrl: imageUrl
          };
        }));
        
        newCatalog.push(...batchResults);
        if (onCatalogUpdate) {
          onCatalogUpdate([...newCatalog]);
        }
      }
      
      // Save to DB in background
      saveCatalogToDB(newCatalog).catch(err => console.error("Failed to save catalog to DB:", err));
    }

    return { brandVibe, catalog: newCatalog };

  } catch (error) {
    console.error("Brand generation failed", error);
    throw error;
  }
}
