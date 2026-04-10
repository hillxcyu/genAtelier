import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const projectId = process.env.GOOGLE_CLOUD_PROJECT;
const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
const apiKey = process.env.GEMINI_API_KEY;

let ai: any;

if (projectId) {
  ai = new GoogleGenAI({
    vertexai: true,
    project: projectId,
    location: location,
  });
} else {
  ai = new GoogleGenAI({ 
    apiKey: apiKey 
  });
}

const products = [
  // --- Women ---
  { id: 'w1', name: 'Silk Satin Evening Gown', category: 'Women - Eveningwear', prompt: 'High-end fashion photography of a luxurious emerald green silk satin evening gown on a minimalist model, soft dramatic lighting.' },
  { id: 'w2', name: 'Structured Wool Blazer', category: 'Women - Tailoring', prompt: 'Editorial fashion shot of a sharp, structured charcoal wool blazer, minimalist aesthetic, neutral studio background.' },
  { id: 'w3', name: 'Cashmere Turtleneck Sweater', category: 'Women - Knitwear', prompt: 'Soft, cozy high-fashion photography of a cream cashmere turtleneck sweater, high-key lighting, clean minimalist studio.' },
  { id: 'w4', name: 'Pleated Midi Skirt', category: 'Women - Skirts', prompt: 'Movement-focused fashion shot of a pleated metallic midi skirt, dynamic pose, soft natural lighting.' },
  { id: 'w5', name: 'Oversized Poplin Shirt', category: 'Women - Tops', prompt: 'Crisp, high-fashion shot of a white oversized poplin cotton shirt, minimalist studio setting, sharp lighting.' },
  { id: 'w6', name: 'Wide-Leg Linen Trousers', category: 'Women - Bottoms', prompt: 'Elegant fashion photography of high-waisted wide-leg sand-colored linen trousers, soft natural daylight.' },
  { id: 'w7', name: 'Pointed-Toe Leather Pumps', category: 'Women - Shoes', prompt: 'Studio product photography of black pointed-toe leather stiletto pumps, high-gloss finish, dramatic lighting.' },
  { id: 'w8', name: 'Minimalist Leather Tote Bag', category: 'Women - Accessories', prompt: 'Luxury product shot of a structured black calfskin leather tote bag, minimalist design, soft studio lighting.' },
  { id: 'w9', name: 'Gold Chain Link Necklace', category: 'Women - Jewelry', prompt: 'Macro fashion photography of a heavy 18k gold bold chain link necklace on a model, warm lighting.' },
  { id: 'w10', name: 'Belted Wool Trench Coat', category: 'Women - Outerwear', prompt: 'Classic fashion shot of a camel-colored belted wool trench coat, outdoor urban setting, soft daylight.' },

  // --- Men ---
  { id: 'm1', name: 'Tailored Navy Suit', category: 'Men - Tailoring', prompt: 'Sophisticated fashion photography of a slim-fit tailored navy blue suit on a male model, urban luxury setting.' },
  { id: 'm2', name: 'Leather Biker Jacket', category: 'Men - Outerwear', prompt: 'Edgy editorial fashion shot of a premium black grain leather biker jacket, moody cinematic lighting.' },
  { id: 'm3', name: 'Oversized Cotton Hoodie', category: 'Men - Streetwear', prompt: 'Modern streetwear photography of a heavy-weight oversized charcoal cotton hoodie, minimalist urban background.' },
  { id: 'm4', name: 'Slim-Fit Selvedge Denim', category: 'Men - Denim', prompt: 'Product-focused fashion shot of premium indigo selvedge denim jeans, raw texture, industrial studio.' },
  { id: 'm5', name: 'Cuban Collar Linen Shirt', category: 'Men - Tops', prompt: 'Relaxed fashion photography of a sage green cuban collar linen shirt, beach sunset lighting.' },
  { id: 'm6', name: 'Pleated Chino Trousers', category: 'Men - Bottoms', prompt: 'Clean-cut fashion shot of olive green pleated chino trousers, minimalist studio, soft natural lighting.' },
  { id: 'm7', name: 'Minimalist Leather Sneakers', category: 'Men - Shoes', prompt: 'Luxury product shot of premium white matte leather minimalist sneakers, clean lines, high-key studio lighting.' },
  { id: 'm8', name: 'Luxury Chronograph Watch', category: 'Men - Accessories', prompt: 'Macro product shot of a silver chronograph watch with a black leather strap, sophisticated lighting.' },
  { id: 'm9', name: 'Double-Breasted Cashmere Overcoat', category: 'Men - Outerwear', prompt: 'High-fashion shot of a navy double-breasted cashmere overcoat, winter urban setting, cold lighting.' },
  { id: 'm10', name: 'Graphic Print Silk Shirt', category: 'Men - Tops', prompt: 'Bold editorial fashion shot of a black silk shirt with an abstract white graphic print, high-fashion lighting.' }
];

async function generateImages() {
  console.log('--- Starting Expanded Dummy Catalog Generation ---');
  
  for (const product of products) {
    const filePath = path.join('dummy-retailer', 'images', `${product.id}.png`);
    
    // Skip if already exists to save tokens/time
    if (fs.existsSync(filePath)) {
      console.log(`Skipping ${product.name} (exists)`);
      continue;
    }

    try {
      console.log(`Generating image for: ${product.name}...`);
      
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: { role: 'user', parts: [{ text: product.prompt }] },
        config: { imageConfig: { aspectRatio: "3:4", imageSize: "1K" } }
      });

      let foundImage = false;
      const candidates = (response as any).candidates || (response as any).response?.candidates;
      
      if (candidates?.[0]?.content?.parts) {
        for (const part of candidates[0].content.parts) {
          if (part.inlineData) {
            fs.writeFileSync(filePath, Buffer.from(part.inlineData.data, 'base64'));
            console.log(`Saved: ${filePath}`);
            foundImage = true;
            break;
          }
        }
      }
    } catch (error: any) {
      console.error(`Failed to generate ${product.name}:`, error.message);
    }
  }
  console.log('--- Catalog Generation Complete ---');
}

generateImages();
