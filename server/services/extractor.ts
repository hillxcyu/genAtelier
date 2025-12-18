import { GoogleGenAI } from '@google/genai';
import type { ScrapedData } from './scraper.ts';

// Re-define interfaces to avoid shared code complexity for this prototype
interface BrandVibe {
  name: string;
  colors: string[];
  fonts: string[];
  fontCategory?: 'sans' | 'serif' | 'mono';
  mood: string;
  keywords: string[];
}

interface ExtractedProduct {
  name: string;
  category: string;
  price: string;
  imageUrl?: string;
}

export interface ExtractionResult {
  brandVibe: BrandVibe;
  products: ExtractedProduct[];
}

export async function processWithGemini(ai: GoogleGenAI, scrapedData: ScrapedData): Promise<ExtractionResult> {
  const prompt = `
    Analyze the following raw data scraped from a fashion retailer's website (${scrapedData.url}).
    
    Website Title: ${scrapedData.title}
    Description: ${scrapedData.description}
    
    STRUCTURED PRODUCT DATA (JSON-LD or Visual Cards) [High Confidence]:
    ${JSON.stringify(scrapedData.jsonLdProducts, null, 2)}

    RAW HTML BODY FOR PRODUCT EXTRACTION:
    \`\`\`html
    ${scrapedData.htmlBody}
    \`\`\`

    Image URLs (Sample):
    ${scrapedData.imageUrls.slice(0, 15).join('\n')}
    
    Text Content (Sample):
    ${scrapedData.textChunks.slice(0, 50).join(' | ')}
    
    Task:
    1. Identify the Brand Identity (Name, Colors, Fonts, Mood).
    2. Extract **all visible** product items from the RAW HTML BODY. 
       IMPORTANT: PRIORITY RULE
       - If "STRUCTURED PRODUCT DATA" is available, USE IT as the primary source of truth for product names, prices, and images. Extract from it.
       - If not, then carefully analyze the "RAW HTML BODY" to find **all repeating product card structures**. Extract product name, price, and the absolute URL of the primary product image from these cards.
       - Only use the raw "Text Content" and "Image URLs" to fill in gaps or if no structured data can be found from the HTML.
       - Ensure product images are mapped correctly and are absolute URLs.

    FALLBACK INSTRUCTION:
    - If the "RAW HTML BODY" is empty, sparse, or looks like a security challenge/error page, and no structured data is found:
    - IGNORE the HTML.
    - INFER the brand identity based solely on the URL string ("${scrapedData.url}") and Title ("${scrapedData.title}").
    - GENERATE a list of 6-8 PLAUSIBLE products that this brand would likely sell. Use generic high-quality placeholders or leave imageUrl empty if you cannot guess a valid one.
    - Set the "mood" to something appropriate for the brand inferred from the URL (e.g. if 'zara.com', infer 'Fast Fashion Chic').
    
    Return a STRICT JSON object with this schema:
    {
      "name": "string",
      "colors": ["#hex", "#hex", "#hex"],
      "fonts": ["string", "string"],
      "fontCategory": "sans" | "serif" | "mono",
      "mood": "string",
      "keywords": ["string", "string", "string", "string", "string"],
      "products": [
        { "name": "string", "category": "string", "price": "string", "imageUrl": "string (optional)" }
      ]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { role: 'user', parts: [{ text: prompt }] },
      config: { responseMimeType: 'application/json' }
    });

    const text = response.text?.replace(/```json\n?|```/g, '').trim() || '{}';
    const data = JSON.parse(text);

    return {
      brandVibe: {
        name: data.name || scrapedData.title,
        colors: data.colors || [],
        fonts: data.fonts || [],
        fontCategory: data.fontCategory || 'sans',
        mood: data.mood || 'Modern',
        keywords: data.keywords || []
      },
      products: data.products || []
    };

  } catch (error) {
    console.error("Extraction failed:", error);
    throw error;
  }
}
