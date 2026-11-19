/**
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { GoogleGenAI } from '@google/genai';
import type { ScrapedData } from './scraper.ts';

// Re-define interfaces to avoid shared code complexity for this prototype
interface BrandPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

interface BrandVibe {
  name: string;
  palette: BrandPalette;
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
    1. Identify the Brand Identity (Name, Palette, Fonts, Mood).
       - **Palette Extraction:** Identify 5 distinct roles:
         - **primary**: The main brand color (e.g., header, logo).
         - **secondary**: A supporting color.
         - **accent**: High-contrast color for buttons/CTAs.
         - **background**: The dominant page background (usually white, off-white, or black).
         - **text**: The dominant text color (ensure good contrast with background).
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
      "palette": {
        "primary": "#hex",
        "secondary": "#hex",
        "accent": "#hex",
        "background": "#hex",
        "text": "#hex"
      },
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
        palette: data.palette || { 
            primary: '#000000', 
            secondary: '#333333', 
            accent: '#000000', 
            background: '#ffffff', 
            text: '#000000' 
        },
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
