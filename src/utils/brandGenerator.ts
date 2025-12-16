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
  
  if (onProgress) onProgress('Analyzing Brand DNA...');

  try {
    const prompt = `Analyze the likely brand identity for a fashion retailer with the URL: "${url}". 
    Return a JSON object with:
    - name: The likely brand name.
    - colors: array of 3-5 hex codes representing the brand palette.
    - fonts: array of 2 font names likely used.
    - fontCategory: One of "sans", "serif", "mono".
    - mood: a short string describing the brand vibe (e.g., "Minimalist Luxury", "Bohemian Chic").
    - keywords: array of 5 adjectives describing the style.
    - products: A list of 15 representative products (3 categories, 5 items each) with 'name', 'category', and 'price'.
    
    If the URL is generic or unknown, infer a plausible high-end fashion style and product mix.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { role: 'user', parts: [{ text: prompt }] },
      config: { responseMimeType: 'application/json' }
    });

    const text = response.text?.replace(/```json\n?|```/g, '').trim() || '{}';
    const data: BrandAnalysisResult = JSON.parse(text);

    // Create Brand Vibe
    const brandVibe: BrandVibe = {
      name: data.name || url,
      colors: data.colors ? data.colors.slice(0, 3) : ['#000000', '#ffffff', '#333333'],
      font: data.fontCategory || 'sans',
      accentColor: data.colors ? (data.colors[1] || data.colors[0]) : '#c026d3',
      mood: data.mood,
      keywords: data.keywords,
      fonts: data.fonts
    };

    if (onBrandVibeReady) {
      onBrandVibeReady(brandVibe);
    }

    const newCatalog: CatalogItem[] = [];

    // Generate Catalog Images
    if (data.products && data.products.length > 0) {
      const products = data.products;
      const mood = data.mood || "High-end Fashion";

      for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize);
        if (onProgress) {
          onProgress(`Extracting catalog assets ${i + 1}-${Math.min(i + batchSize, products.length)} of ${products.length}...`);
        }
        
        const batchResults = await Promise.all(batch.map(async (p, batchIndex) => {
          const globalIndex = i + batchIndex;
          let imageUrl = await generateProductImage(p.name, p.category, mood);
          
          if (!imageUrl) {
             imageUrl = `https://picsum.photos/seed/${p.name.replace(/\s/g, '')}/400/600`;
          }

          return {
            id: `generated-${globalIndex}`,
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
