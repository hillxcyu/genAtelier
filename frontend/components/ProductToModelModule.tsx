'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Sparkles, RefreshCw, Shirt, User, X, Camera, Settings2, ShoppingBag, Loader2, Download, Share2, FileText } from 'lucide-react';
import { BrandVibe, CatalogItem } from '../types';

interface ProductToModelModuleProps {
  brandId: string;
  brandVibe?: BrandVibe | null;
  catalog?: CatalogItem[] | null;
}

export const ProductToModelModule: React.FC<ProductToModelModuleProps> = ({ brandId, brandVibe, catalog }) => {
  const [productImage, setProductImage] = useState<{ file: File | null, preview: string | null }>({ file: null, preview: null });
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCatalog, setShowCatalog] = useState(false);
  const [useBrandPdf, setUseBrandPdf] = useState(true);

  const [settings, setSettings] = useState({
    modelType: 'Professional High-Fashion Model',
    background: 'Minimalist Architecture / Studio',
    lighting: 'Dramatic Contrast / Vermeer Style'
  });

  const productInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProductImage({ file, preview: reader.result as string });
      reader.readAsDataURL(file);
      setGeneratedImage(null);
    }
  };

  const handleCatalogSelect = async (item: CatalogItem) => {
    try {
      const resp = await fetch(item.imageUrl);
      const blob = await resp.blob();
      const reader = new FileReader();
      reader.onloadend = () => setProductImage({ file: new File([blob], item.name, { type: blob.type }), preview: reader.result as string });
      reader.readAsDataURL(blob);
      setShowCatalog(false);
      setGeneratedImage(null);
    } catch (err) {
      console.error("Failed to lead catalog item", err);
    }
  };

  const generateLifestyleShot = async () => {
    if (!productImage.preview) return;
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/api/generate/lifestyle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_id: brandId,
          product_image: productImage.preview,
          settings: settings,
          useBrandPdf: useBrandPdf
        })
      });

      const data = await response.json();
      if (data.image) {
        setGeneratedImage(data.image);
      } else {
        throw new Error(data.error || "Failed to generate shot.");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `lifestyle-shot-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-12">
        <h2 className="text-4xl font-bold text-white mb-4 tracking-tight">Lifestyle Studio</h2>
        <p className="text-neutral-400 text-lg">Elevate flat assets into professional, brand-aligned lifestyle photography.</p>
      </div>

      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-center text-sm font-medium">
          {error}
        </motion.div>
      )}

      <div className="grid lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:border-fuchsia-500/30 transition-all group shadow-2xl">
            <div className="flex items-center justify-between mb-5 text-white">
              <span className="flex items-center gap-2 font-semibold text-neutral-200">
                <Shirt className="w-5 h-5 text-fuchsia-400" /> Product Source
              </span>
              {productImage.preview && (
                <button onClick={() => setProductImage({ file: null, preview: null })} className="p-1.5 hover:bg-white/10 rounded-full text-neutral-500 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div
              className={`aspect-[3/4] rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-black/40 
                 ${productImage.preview ? 'border-transparent' : 'border-neutral-800 hover:border-fuchsia-500/50'}`}
              onClick={() => !productImage.preview && productInputRef.current?.click()}
            >
              {productImage.preview ? (
                <motion.img initial={{ opacity: 0 }} animate={{ opacity: 1 }} src={productImage.preview} className="w-full h-full object-contain" />
              ) : (
                <div className="text-center p-8">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="text-neutral-500 w-7 h-7 group-hover:text-fuchsia-400" />
                  </div>
                  <p className="text-sm font-medium text-neutral-400">Upload Product</p>
                  <p className="text-xs text-neutral-600 mt-1">Flat lay or ghost mannequin</p>
                </div>
              )}
              <input type="file" ref={productInputRef} className="hidden" onChange={handleFileChange} />
            </div>

            {!productImage.preview && catalog && catalog.length > 0 && (
              <button onClick={() => setShowCatalog(true)} className="w-full mt-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-neutral-400 hover:text-white transition-all">
                BROWSE CATALOG
              </button>
            )}
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6 shadow-2xl">
            <h3 className="text-xs font-black text-neutral-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <Settings2 className="w-4 h-4" /> Scene Config
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Model Preference</label>
                <select
                  value={settings.modelType}
                  onChange={(e) => setSettings({ ...settings, modelType: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-xs text-white outline-none focus:border-fuchsia-500/50 transition-colors"
                >
                  <option>Professional High-Fashion Model</option>
                  <option>Diverse Editorial Casting</option>
                  <option>Commercial Lifestyle Talent</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Background Environment</label>
                <select
                  value={settings.background}
                  onChange={(e) => setSettings({ ...settings, background: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-xs text-white outline-none focus:border-fuchsia-500/50 transition-colors"
                >
                  <option>Minimalist Architecture / Studio</option>
                  <option>Urban Industrial / Concrete</option>
                  <option>Luxury Resort / Coastal</option>
                  <option>Lush Botanical Garden</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Lighting Style</label>
                <select
                  value={settings.lighting}
                  onChange={(e) => setSettings({ ...settings, lighting: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-xs text-white outline-none focus:border-fuchsia-500/50 transition-colors"
                >
                  <option>Dramatic Contrast / Vermeer Style</option>
                  <option>Soft Golden Hour / Daylight</option>
                  <option>High-Key Professional Studio</option>
                </select>
              </div>
              <div className="p-6 bg-white/5 border border-white/10 rounded-[24px] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                    <FileText className="w-3.4 h-3.4" /> Ground in Brand PDF
                  </label>
                  <button
                    onClick={() => setUseBrandPdf(!useBrandPdf)}
                    className={`w-10 h-5 rounded-full relative transition-colors ${useBrandPdf ? 'bg-fuchsia-500' : 'bg-neutral-700'}`}
                  >
                    <motion.div
                      animate={{ x: useBrandPdf ? 22 : 2 }}
                      className="absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm"
                    />
                  </button>
                </div>
                <p className="text-[10px] text-neutral-500 italic">Apply strict brand guidelines from the PDF.</p>
              </div>
            </div>
          </div>

          <button
            onClick={generateLifestyleShot}
            disabled={!productImage.preview || isGenerating}
            className="w-full py-5 bg-white text-black rounded-3xl font-black text-lg tracking-wider flex items-center justify-center gap-3 disabled:opacity-30 hover:bg-neutral-200 transition-all active:scale-95 group shadow-xl"
          >
            {isGenerating ? <Loader2 className="animate-spin w-6 h-6" /> : <Camera className="w-6 h-6 group-hover:scale-110 transition-transform" />}
            RENDER SHOT
          </button>
        </div>

        <div className="lg:col-span-8 flex flex-col h-full">
          <div className="bg-white/5 border border-white/10 rounded-[40px] flex-1 min-h-[700px] flex items-center justify-center relative overflow-hidden group shadow-inner">
            {/* Dynamic Noise Overlay */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none" />

            {generatedImage ? (
              <div className="relative w-full h-full flex flex-col items-center justify-center p-10">
                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative z-10 max-h-full">
                  <img src={generatedImage} className="max-h-full rounded-2xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] border border-white/10" />
                  <div className="absolute top-4 right-4 flex gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                    <button onClick={handleDownload} className="p-3 bg-black/60 backdrop-blur-xl rounded-2xl text-white hover:bg-white hover:text-black transition-all shadow-xl" title="Download"><Download className="w-5 h-5" /></button>
                    <button className="p-3 bg-fuchsia-600 rounded-2xl text-white hover:bg-fuchsia-500 transition-all shadow-xl shadow-fuchsia-600/20" title="Share"><Share2 className="w-5 h-5" /></button>
                  </div>
                </motion.div>
                <button onClick={generateLifestyleShot} className="mt-8 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-sm font-bold text-neutral-400 hover:text-white transition-all flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" /> RE-GENERATE
                </button>
              </div>
            ) : (
              <div className="text-center p-12 relative z-10">
                <div className="relative mb-8 mx-auto w-24 h-24">
                  <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full scale-150 animate-pulse" />
                  <div className="w-full h-full rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center relative">
                    <Camera className="w-10 h-10 text-indigo-500/50" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Lifestyle Studio</h3>
                <p className="text-neutral-500 max-w-sm mx-auto leading-relaxed">
                  Upload a product shot to transform it into a lifestyle asset. Configure the model, background, and lighting to match your brand's creative vision.
                </p>
              </div>
            )}

            {isGenerating && (
              <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center z-50 p-12 text-center">
                <div className="relative mb-8">
                  <div className="w-20 h-20 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin" />
                  <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-indigo-400 animate-pulse" />
                </div>
                <motion.h3 animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} className="text-2xl font-black text-white mb-2 tracking-widest uppercase">Rendering Scene...</motion.h3>
                <p className="text-indigo-400 font-medium mb-1">Applying global illumination and model textures</p>
                <p className="text-neutral-500 text-sm">Targeting {settings.background} atmosphere</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showCatalog && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8">
            <div className="bg-neutral-900 border border-white/10 rounded-3xl p-8 max-w-4xl w-full">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">Generated Catalog</h3>
                <button onClick={() => setShowCatalog(false)}><X /></button>
              </div>
              <div className="grid grid-cols-4 gap-4 overflow-y-auto max-h-[60vh]">
                {catalog?.map(item => (
                  <button key={item.id} onClick={() => handleCatalogSelect(item)} className="aspect-[3/4] rounded-xl overflow-hidden border border-white/5 hover:border-fuchsia-500 transition-all">
                    <img src={item.imageUrl} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
