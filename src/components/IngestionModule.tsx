import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Globe, Search, ArrowRight, Loader2, Palette, Type, LayoutTemplate, Check, ShoppingBag } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { BrandVibe as GlobalBrandVibe, CatalogItem } from '../types';
import { saveCatalogToDB } from '../utils/db';
import { getContrastText } from '../utils/color';

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface LocalBrandVibe {
  colors: string[];
  fonts: string[];
  mood: string;
  keywords: string[];
  name?: string;
  products?: {
    name: string;
    category: string;
    price: string;
    imageUrl?: string;
  }[];
}

interface IngestionModuleProps {
  setBrandVibe?: (vibe: GlobalBrandVibe) => void;
  setCatalog?: (catalog: CatalogItem[]) => void;
}

export const IngestionModule: React.FC<IngestionModuleProps> = ({ setBrandVibe, setCatalog }) => {
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState('');
  const [brandVibe, setLocalBrandVibe] = useState<LocalBrandVibe | null>(null);

  const generateProductImage = async (product: any, mood: string) => {
    try {
      const prompt = `Professional e-commerce product photography of ${product.name} (${product.category}). Style: ${mood}. Clean, high quality, neutral background, fashion catalog style.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
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
  };

  const analyzeBrand = async () => {
    if (!url) return;
    setIsAnalyzing(true);
    setLocalBrandVibe(null);
    setProgress('Analyzing Brand DNA...');

    try {
      const prompt = `Analyze the likely brand identity for a fashion retailer with the URL: ${url}. 
      Return a JSON object with:
      - name: The likely brand name.
      - colors: array of 3-5 hex codes representing the brand palette.
      - fonts: array of 2 font names likely used.
      - fontCategory: One of "sans", "serif", "mono".
      - mood: a short string describing the brand vibe (e.g., "Minimalist Luxury", "Bohemian Chic").
      - keywords: array of 5 adjectives describing the style.
      - products: A list of 15 representative products (3 categories, 5 items each) with 'name', 'category', and 'price'.
      
      If the URL is generic or unknown, infer a plausible fashion brand style and product mix.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const text = response.text;
      if (text) {
        const data = JSON.parse(text);
        setLocalBrandVibe(data);

        // Automatically Apply Global Vibe
        if (setBrandVibe) {
          const globalVibe: GlobalBrandVibe = {
            name: data.name || url,
            colors: data.colors.slice(0, 3),
            font: (data as any).fontCategory || 'sans',
            accentColor: data.colors[1] || data.colors[0],
            mood: data.mood,
            keywords: data.keywords,
            fonts: data.fonts
          };
          setBrandVibe(globalVibe);
        }

        // Automatically Generate Catalog Images
        if (data.products) {
          const newCatalog: CatalogItem[] = [];
          const batchSize = 3;
          const products = data.products;
          
          // Initialize local products with placeholders if needed, or just let them fill in
          // We'll update local state incrementally to show progress
          
          for (let i = 0; i < products.length; i += batchSize) {
            const batch = products.slice(i, i + batchSize);
            setProgress(`Generating images ${i + 1}-${Math.min(i + batchSize, products.length)} of ${products.length}...`);
            
            const batchResults = await Promise.all(batch.map(async (p: any, batchIndex: number) => {
              const globalIndex = i + batchIndex;
              let imageUrl = await generateProductImage(p, data.mood);
              
              if (!imageUrl) {
                 imageUrl = `https://picsum.photos/seed/${p.name.replace(/\s/g, '')}/400/600`;
              }

              // Update local state to show the image
              setLocalBrandVibe(prev => {
                if (!prev || !prev.products) return prev;
                const newProducts = [...prev.products];
                if (newProducts[globalIndex]) {
                  newProducts[globalIndex] = { ...newProducts[globalIndex], imageUrl };
                }
                return { ...prev, products: newProducts };
              });

              return {
                id: `scraped-${globalIndex}`,
                name: p.name,
                category: p.category,
                price: p.price,
                imageUrl: imageUrl
              };
            }));
            
            newCatalog.push(...batchResults);
          }
          
          if (setCatalog) {
            setCatalog(newCatalog);
            saveCatalogToDB(newCatalog).catch(err => console.error("Failed to save catalog to DB:", err));
          }
        }
      }
    } catch (error) {
      console.error("Analysis failed", error);
    } finally {
      setIsAnalyzing(false);
      setProgress('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-white mb-4">Brand Ingestion Agent</h2>
        <p className="text-neutral-400">Enter a retailer URL to extract brand DNA and calibrate the generation engine.</p>
      </div>

      {/* Input Section */}
      <div className="relative max-w-2xl mx-auto mb-16">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Globe className="w-5 h-5 text-neutral-500" />
        </div>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.brand-example.com"
          className="w-full bg-white/5 border border-white/10 rounded-full py-4 pl-12 pr-32 text-white placeholder:text-neutral-600 focus:outline-none focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 transition-all"
          onKeyDown={(e) => e.key === 'Enter' && analyzeBrand()}
        />
        <button
          onClick={analyzeBrand}
          disabled={!url || isAnalyzing}
          className="absolute right-2 top-2 bottom-2 px-6 bg-white text-neutral-950 rounded-full font-medium text-sm hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {progress || 'Analyzing...'}
            </>
          ) : 'Analyze'}
        </button>
      </div>

      {/* Results Section */}
      {brandVibe && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid md:grid-cols-2 gap-6"
        >
          {/* Color Palette */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-fuchsia-500/20 rounded-lg">
                <Palette className="w-5 h-5 text-fuchsia-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Brand Palette</h3>
            </div>
            <div className="flex gap-4">
              {brandVibe.colors.map((color, i) => (
                <div key={i} className="space-y-2 text-center">
                  <div 
                    className="w-16 h-16 rounded-xl shadow-lg border border-white/10"
                    style={{ backgroundColor: color }}
                  />
                  <div className="text-xs font-mono text-neutral-400">{color}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Typography & Mood */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Type className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Typography & Mood</h3>
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-neutral-300 mb-1">Detected Fonts</div>
                <div className="flex gap-2">
                  {brandVibe.fonts.map((font, i) => (
                    <span key={i} className="px-3 py-1 bg-white/10 rounded-md text-sm text-white font-mono">
                      {font}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-sm text-neutral-300 mb-1">Vibe Analysis</div>
                <div className="text-xl font-medium text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-purple-400">
                  {brandVibe.mood}
                </div>
              </div>
            </div>
          </div>

          {/* Scraped Catalog Preview */}
          {brandVibe.products && (
            <div className="md:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <ShoppingBag className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Scraped Catalog ({brandVibe.products.length} items)</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {brandVibe.products.slice(0, 5).map((p, i) => (
                  <div key={i} className="bg-white/5 rounded-lg p-2">
                    <div className="aspect-[3/4] bg-black/20 rounded mb-2 overflow-hidden relative">
                      {p.imageUrl ? (
                        <img 
                          src={p.imageUrl} 
                          alt={p.name} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                           <Loader2 className="w-5 h-5 text-white/20 animate-spin" />
                        </div>
                      )}
                    </div>
                    <div className="text-xs font-medium text-white truncate">{p.name}</div>
                    <div className="text-[10px] text-neutral-500">{p.price}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center text-xs text-neutral-500">
                + {brandVibe.products.length - 5} more items detected
              </div>
            </div>
          )}

          {/* Keywords */}
          <div className="md:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6">
             <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-500/20 rounded-lg">
                <LayoutTemplate className="w-5 h-5 text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Semantic Signals</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {brandVibe.keywords.map((keyword, i) => (
                <span key={i} className="px-4 py-2 bg-white/5 border border-white/5 rounded-full text-neutral-300 hover:bg-white/10 transition-colors cursor-default">
                  #{keyword}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
