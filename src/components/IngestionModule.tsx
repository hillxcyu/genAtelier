import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Globe, Search, ArrowRight, Loader2, Palette, Type, LayoutTemplate, Check, ShoppingBag } from 'lucide-react';
import { BrandVibe, CatalogItem } from '../types';

interface IngestionModuleProps {
  brandVibe: BrandVibe | null;
  catalog: CatalogItem[];
  url: string;
  setUrl: (url: string) => void;
  onAnalyze: (url: string) => Promise<void>;
  isAnalyzing: boolean;
}

export const IngestionModule: React.FC<IngestionModuleProps> = ({ 
  brandVibe, 
  catalog, 
  url, 
  setUrl, 
  onAnalyze, 
  isAnalyzing 
}) => {
  const [showAllItems, setShowAllItems] = useState(false);

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
          onKeyDown={(e) => e.key === 'Enter' && onAnalyze(url)}
        />
        <button
          onClick={() => onAnalyze(url)}
          disabled={!url || isAnalyzing}
          className="absolute right-2 top-2 bottom-2 px-6 bg-white text-neutral-950 rounded-full font-medium text-sm hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Extracting...
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
                  {brandVibe.fonts && brandVibe.fonts.map((font, i) => (
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
          {catalog && catalog.length > 0 && (
            <div className="md:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <ShoppingBag className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Scraped Catalog ({catalog.length} items)</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {(showAllItems ? catalog : catalog.slice(0, 5)).map((p, i) => (
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
              {catalog.length > 5 && (
                <button
                  onClick={() => setShowAllItems(!showAllItems)}
                  className="mt-4 text-center text-xs text-neutral-500 hover:text-white transition-colors cursor-pointer w-full py-2 rounded-md hover:bg-white/5"
                >
                  {showAllItems ? 'Show less' : `+ ${catalog.length - 5} more items detected`}
                </button>
              )}
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
              {brandVibe.keywords && brandVibe.keywords.map((keyword, i) => (
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
