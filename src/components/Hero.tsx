import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ArrowRight, Sparkles, Shirt, Camera, Loader2, TrendingUp, Layout as LayoutIcon } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { BrandVibe, CatalogItem } from '../types';
import { saveCatalogToDB } from '../utils/db';

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface HeroProps {
  onNavigate: (view: 'vto' | 'lookbook' | 'product-to-model') => void;
  setBrandVibe: (vibe: BrandVibe | null) => void;
  setCatalog?: (catalog: CatalogItem[]) => void;
  brandVibe: BrandVibe | null;
}

export const Hero: React.FC<HeroProps> = ({ onNavigate, setBrandVibe, setCatalog, brandVibe }) => {
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState('');

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

  const handleAnalyze = async () => {
    if (!url) return;
    setIsAnalyzing(true);
    setProgress('Analyzing Brand DNA...');

    try {
      // 1. Analyze Brand & Get Products
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
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });

      const data = JSON.parse(response.text || '{}');
      
      // 2. Set Brand Vibe
      setBrandVibe({
        colors: data.colors ? data.colors.slice(0, 3) : ['#000000', '#ffffff', '#333333'],
        font: (data as any).fontCategory || 'sans',
        name: data.name || url,
        accentColor: data.colors ? (data.colors[1] || data.colors[0]) : '#c026d3',
        mood: data.mood,
        keywords: data.keywords,
        fonts: data.fonts
      });

      // 3. Generate Catalog Images
      if (setCatalog && data.products) {
        const newCatalog: CatalogItem[] = [];
        const batchSize = 3;
        const products = data.products;
        const mood = data.mood || "High-end Fashion";

        for (let i = 0; i < products.length; i += batchSize) {
          const batch = products.slice(i, i + batchSize);
          setProgress(`Generating images ${i + 1}-${Math.min(i + batchSize, products.length)} of ${products.length}...`);
          
          const batchResults = await Promise.all(batch.map(async (p: any, batchIndex: number) => {
            const globalIndex = i + batchIndex;
            let imageUrl = await generateProductImage(p, mood);
            
            if (!imageUrl) {
               imageUrl = `https://picsum.photos/seed/${p.name.replace(/\s/g, '')}/400/600`;
            }

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
        
        setCatalog(newCatalog);
        saveCatalogToDB(newCatalog).catch(err => console.error("Failed to save catalog to DB:", err));
      }

    } catch (error) {
      console.error("Analysis failed", error);
      // Fallback
      setBrandVibe({
        colors: ['#4a2c2c', '#d4b08c', '#1a1a1a'],
        font: 'serif',
        name: url,
        accentColor: '#d4b08c'
      });
    } finally {
      setIsAnalyzing(false);
      setProgress('');
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] flex flex-col overflow-hidden">
      {/* Background Ambience - Now handled by Layout, but we keep local noise if needed, 
          or rely on Layout's global background. 
          To avoid double background, we remove the background styles here and let Layout handle it.
      */}
      
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 max-w-7xl mx-auto w-full">
        
        {/* 1. The Hook (Ingestion) */}
        <AnimatePresence mode="wait">
          {!brandVibe ? (
            <motion.div 
              key="ingestion"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-2xl text-center"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-neutral-400 mb-8">
                <Sparkles className="w-3 h-3" />
                <span>The GenFashion Atelier</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-8">
                Where Brand DNA meets <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-purple-400">Generative Reality</span>
              </h1>

              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500 to-purple-600 rounded-full blur opacity-20 group-hover:opacity-30 transition-opacity" />
                <div className="relative flex items-center bg-neutral-900/80 backdrop-blur-xl border border-white/10 rounded-full p-2 pl-6 shadow-2xl">
                  <Search className="w-5 h-5 text-neutral-500 mr-3" />
                  <input 
                    type="text" 
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                    placeholder="Enter Retailer URL (e.g., zara.com)"
                    className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-neutral-600 h-10"
                  />
                  <button 
                    onClick={handleAnalyze}
                    disabled={!url || isAnalyzing}
                    className="px-6 py-2 bg-white text-neutral-950 rounded-full font-medium text-sm hover:bg-neutral-200 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Begin'}
                  </button>
                </div>
              </div>
              
              <p className="mt-6 text-sm text-neutral-500">
                {isAnalyzing ? (
                  <span className="animate-pulse text-fuchsia-400">{progress || 'Analyzing Brand DNA...'}</span>
                ) : (
                  "Instantly calibrate our generative engine to your brand's aesthetic."
                )}
              </p>
            </motion.div>
          ) : (
            /* 2. The Split Gateway */
            <motion.div 
              key="gateway"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full"
            >
              <div className="text-center mb-12">
                <h2 className="text-3xl font-light text-white mb-2">
                  Welcome, <span className="capitalize font-bold" style={{ color: brandVibe.accentColor }}>{brandVibe.name}</span>
                </h2>
                <p className="text-neutral-400">Select your workspace</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                {/* Option A: The Fitting Room */}
                <div 
                  onClick={() => onNavigate('vto')}
                  className="group relative h-[400px] rounded-3xl overflow-hidden cursor-pointer border border-white/10 hover:border-fuchsia-500/50 transition-all"
                  style={{ borderColor: `${brandVibe.accentColor}40` }}
                >
                  <div className="absolute inset-0 bg-neutral-900 group-hover:scale-105 transition-transform duration-700">
                    <img 
                      src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop" 
                      alt="Fitting Room" 
                      className="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                  </div>
                  
                  <div className="absolute bottom-0 left-0 right-0 p-8">
                    <div className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: brandVibe.accentColor }}>
                      <Shirt className="w-4 h-4" />
                      THE FITTING ROOM
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-2">For Your Customer</h3>
                    <p className="text-neutral-400 mb-6 line-clamp-2">
                      Enable instant virtual try-on. Boost engagement and reduce returns with hyper-realistic visualization.
                    </p>
                    <div className="flex items-center gap-2 text-white font-medium group-hover:translate-x-2 transition-transform">
                      Enter VTO <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Option B: The Studio */}
                <div 
                  className="group relative h-[400px] rounded-3xl overflow-hidden border border-white/10 hover:border-purple-500/50 transition-all"
                  style={{ borderColor: `${brandVibe.accentColor}40` }}
                >
                  <div className="absolute inset-0 bg-neutral-900 group-hover:scale-105 transition-transform duration-700">
                     <img 
                      src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=1000&auto=format&fit=crop" 
                      alt="Studio" 
                      className="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                  </div>
                  
                  <div className="absolute bottom-0 left-0 right-0 p-8">
                    <div className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: brandVibe.accentColor }}>
                      <LayoutIcon className="w-4 h-4" />
                      THE STUDIO
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-2">For Your Brand</h3>
                    <p className="text-neutral-400 mb-6 line-clamp-2">
                      Generate seasonal lookbooks and lifestyle assets from ghost mannequin shots.
                    </p>
                    <div className="flex gap-3">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onNavigate('lookbook'); }}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm text-white backdrop-blur-md transition-colors"
                      >
                        Lookbooks
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onNavigate('product-to-model'); }}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm text-white backdrop-blur-md transition-colors"
                      >
                        Product-to-Model
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. Social Proof Ticker */}
      <div className="border-t border-white/5 bg-black/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap justify-between items-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-neutral-400">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            System Operational
          </div>
          
          <div className="flex gap-8 text-neutral-500 font-mono">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" style={{ color: brandVibe?.accentColor || '#d946ef' }} />
              <span>Active Sessions: <span className="text-white">124</span></span>
            </div>
            <div className="hidden md:block">
              Lookbooks Generated: <span className="text-white">842</span>
            </div>
            <div className="hidden md:block">
              Est. Production Savings: <span className="text-white">$15,000+</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

