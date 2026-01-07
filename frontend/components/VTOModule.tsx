'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Sparkles, RefreshCw, Shirt, User, X, ShoppingBag, Loader2, CheckCircle, Download, Share2, FileText } from 'lucide-react';
import { BrandVibe, CatalogItem } from '../types';

interface VTOModuleProps {
  brandId: string;
  brandVibe?: BrandVibe | null;
  catalog?: CatalogItem[] | null;
}

export const VTOModule: React.FC<VTOModuleProps> = ({ brandId, brandVibe, catalog }) => {
  const [personImage, setPersonImage] = useState<{ file: File | null, preview: string | null }>({ file: null, preview: null });
  const [garmentImage, setGarmentImage] = useState<{ file: File | null, preview: string | null }>({ file: null, preview: null });
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCatalog, setShowCatalog] = useState(false);
  const [useBrandPdf, setUseBrandPdf] = useState(true);

  const [suggestions, setSuggestions] = useState<{ item: CatalogItem; reason: string }[] | null>(null);
  const [selectedSuggestions, setSelectedSuggestions] = useState<CatalogItem[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const personInputRef = useRef<HTMLInputElement>(null);
  const garmentInputRef = useRef<HTMLInputElement>(null);

  // Fetch suggestions when garment changes
  useEffect(() => {
    if (garmentImage.preview && catalog && catalog.length > 0) {
      fetchSuggestions();
    } else {
      setSuggestions(null);
      setSelectedSuggestions([]);
    }
  }, [garmentImage.preview, catalog]);

  const fetchSuggestions = async () => {
    if (!garmentImage.preview || !catalog) return;
    setIsSuggesting(true);
    try {
      const resp = await fetch('http://localhost:8000/api/generate/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_id: brandId,
          garment_image: garmentImage.preview,
          catalog: catalog
        })
      });
      const data = await resp.json();
      if (data.suggestions) {
        const enriched = data.suggestions.map((s: any) => {
          const item = catalog.find(c => c.id === s.itemId);
          return item ? { item, reason: s.reason } : null;
        }).filter(Boolean);
        setSuggestions(enriched);
      }
    } catch (err) {
      console.error("Suggestions failed", err);
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'person' | 'garment') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'person') {
          setPersonImage({ file, preview: reader.result as string });
        } else {
          setGarmentImage({ file, preview: reader.result as string });
          setGeneratedImage(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCatalogSelect = async (item: CatalogItem) => {
    try {
      const response = await fetch(item.imageUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        setGarmentImage({
          file: new File([blob], item.name, { type: blob.type }),
          preview: reader.result as string
        });
        setGeneratedImage(null);
        setShowCatalog(false);
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error("Error loading catalog item:", err);
      setError("Failed to load catalog item image.");
    }
  };

  const toggleSuggestion = (item: CatalogItem) => {
    if (selectedSuggestions.find(s => s.id === item.id)) {
      setSelectedSuggestions(selectedSuggestions.filter(s => s.id !== item.id));
    } else {
      setSelectedSuggestions([...selectedSuggestions, item]);
    }
  };

  const getBase64 = async (url: string): Promise<string> => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const generateVTO = async () => {
    if (!personImage.preview || !garmentImage.preview) return;
    setIsGenerating(true);
    setError(null);

    try {
      // Get base64 for selected suggestions
      const additionalBase64s = await Promise.all(
        selectedSuggestions.map(s => getBase64(s.imageUrl))
      );

      const response = await fetch('http://localhost:8000/api/generate/vto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_id: brandId,
          person_image: personImage.preview,
          garment_image: garmentImage.preview,
          additional_items: additionalBase64s,
          useBrandPdf: useBrandPdf
        })
      });

      const data = await response.json();
      if (data.image && data.image.length > 50) { // Check for valid non-empty base64
        setGeneratedImage(data.image);
      } else {
        throw new Error(data.error || "The AI produced an empty result. Please try again.");
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
    link.download = `vto-look-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20 text-[10px] font-black text-fuchsia-400 uppercase tracking-widest mb-4">
          Neural Synthesis v2
        </div>
        <h2 className="text-6xl font-black text-white mb-4 tracking-tighter italic uppercase">Fitting Room</h2>
        <p className="text-neutral-400 text-lg max-w-2xl font-medium">Elevate the digital experience by synthesizing any item from the collection onto a custom persona.</p>
      </div>

      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-center text-sm font-medium">
          {error}
        </motion.div>
      )}

      <div className="grid lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5 space-y-8">
          {/* Person Upload */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:border-fuchsia-500/30 transition-all group shadow-2xl">
            <div className="flex items-center justify-between mb-5 text-white">
              <span className="flex items-center gap-2 font-semibold text-neutral-200">
                <User className="w-5 h-5 text-fuchsia-400" /> Your Photo
              </span>
              {personImage.preview && (
                <button onClick={() => setPersonImage({ file: null, preview: null })} className="p-1.5 hover:bg-white/10 rounded-full text-neutral-500 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div
              className={`aspect-[3/4] rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-black/40 
                ${personImage.preview ? 'border-transparent' : 'border-neutral-800 hover:border-fuchsia-500/50'}`}
              onClick={() => !personImage.preview && personInputRef.current?.click()}
            >
              {personImage.preview ? (
                <motion.img initial={{ opacity: 0 }} animate={{ opacity: 1 }} src={personImage.preview} className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-8">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="text-neutral-500 w-7 h-7 group-hover:text-fuchsia-400" />
                  </div>
                  <p className="text-sm font-medium text-neutral-400">Upload Portrait</p>
                  <p className="text-xs text-neutral-600 mt-1">Clear full body shot recommended</p>
                </div>
              )}
              <input type="file" ref={personInputRef} className="hidden" onChange={(e) => handleFileChange(e, 'person')} />
            </div>
          </div>

          {/* Garment Upload & Suggestions */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:border-purple-500/30 transition-all group shadow-2xl">
            <div className="flex items-center justify-between mb-5 text-white">
              <span className="flex items-center gap-2 font-semibold text-neutral-200">
                <Shirt className="w-5 h-5 text-purple-400" /> Garment
              </span>
              <div className="flex gap-2 items-center">
                {catalog && (
                  <button
                    onClick={() => setShowCatalog(true)}
                    className="text-xs font-bold bg-fuchsia-500/10 text-fuchsia-400 px-3 py-1.5 rounded-lg hover:bg-fuchsia-500/20 transition-all border border-fuchsia-500/20"
                  >
                    SELECT FROM CATALOG
                  </button>
                )}
                {garmentImage.preview && (
                  <button onClick={() => { setGarmentImage({ file: null, preview: null }); setSuggestions(null); }} className="p-1.5 hover:bg-white/10 rounded-full text-neutral-500 hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div
              className={`aspect-[3/4] rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-black/40 mb-6
                ${garmentImage.preview ? 'border-transparent' : 'border-neutral-800 hover:border-purple-500/50'}`}
              onClick={() => !garmentImage.preview && garmentInputRef.current?.click()}
            >
              {garmentImage.preview ? (
                <motion.img initial={{ opacity: 0 }} animate={{ opacity: 1 }} src={garmentImage.preview} className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-8">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="text-neutral-500 w-7 h-7 group-hover:text-purple-400" />
                  </div>
                  <p className="text-sm font-medium text-neutral-400">Upload Item Image</p>
                  <p className="text-xs text-neutral-600 mt-1">Flat lay or ghost mannequin</p>
                </div>
              )}
              <input type="file" ref={garmentInputRef} className="hidden" onChange={(e) => handleFileChange(e, 'garment')} />
            </div>

            {/* Styling Suggestions */}
            <AnimatePresence>
              {(suggestions || isSuggesting) && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="pt-6 border-t border-white/10">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-4 h-4 text-fuchsia-400" />
                    <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Complete the Look</h4>
                  </div>

                  {isSuggesting ? (
                    <div className="space-y-3">
                      {[1, 2].map(i => (
                        <div key={i} className="flex gap-4 p-3 rounded-2xl bg-white/5 animate-pulse">
                          <div className="w-14 h-18 bg-white/5 rounded-lg" />
                          <div className="flex-1 space-y-2 py-1">
                            <div className="h-3 bg-white/5 rounded w-3/4" />
                            <div className="h-2 bg-white/5 rounded w-1/2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {suggestions?.map((s, i) => {
                        const isSelected = selectedSuggestions.find(item => item.id === s.item.id);
                        return (
                          <motion.div
                            key={i}
                            onClick={() => toggleSuggestion(s.item)}
                            className={`flex gap-4 p-3 rounded-2xl cursor-pointer transition-all border ${isSelected ? 'bg-fuchsia-500/10 border-fuchsia-500/30' : 'bg-white/5 border-transparent hover:border-white/10'}`}
                          >
                            <div className="w-14 h-18 rounded-lg overflow-hidden flex-shrink-0 bg-black/40">
                              <img src={s.item.imageUrl} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                              <p className="text-sm font-semibold text-white truncate">{s.item.name}</p>
                              <p className="text-[11px] text-neutral-500 mt-0.5 line-clamp-2 italic leading-snug">"{s.reason}"</p>
                            </div>
                            <div className="flex items-center">
                              {isSelected ? <CheckCircle className="w-5 h-5 text-fuchsia-400" /> : <div className="w-5 h-5 rounded-full border border-white/20" />}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="p-6 bg-white/5 border border-white/10 rounded-3xl mb-4">
            <div className="flex items-center justify-between mb-2">
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
            <p className="text-[10px] text-neutral-500 italic">Enable for strict brand guideline compliance.</p>
          </div>

          <button
            onClick={generateVTO}
            disabled={!personImage.preview || !garmentImage.preview || isGenerating}
            className="w-full py-5 bg-gradient-to-br from-fuchsia-600 via-purple-600 to-indigo-600 rounded-3xl font-black text-white text-lg tracking-wider flex items-center justify-center gap-3 disabled:opacity-30 disabled:grayscale hover:shadow-[0_0_40px_-10px_rgba(192,38,211,0.5)] transition-all active:scale-95 group"
          >
            {isGenerating ? <Loader2 className="animate-spin w-6 h-6" /> : <Sparkles className="w-6 h-6 group-hover:animate-pulse" />}
            SYNTHESIZE LOOK
          </button>
        </div>

        <div className="lg:col-span-12 xl:col-span-7 flex flex-col h-full">
          <div className="bg-white/5 border border-white/10 rounded-[32px] flex-1 min-h-[700px] flex items-center justify-center relative overflow-hidden group shadow-inner">
            {/* Dynamic Noise/Texture Overlay */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none" />

            {generatedImage ? (
              <div className="relative w-full h-full flex flex-col items-center justify-center p-10">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 max-h-full">
                  <img src={generatedImage} className="max-h-full rounded-2xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] border border-white/10" />
                  <div className="absolute top-4 right-4 flex gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                    <button onClick={handleDownload} className="p-3 bg-black/60 backdrop-blur-xl rounded-2xl text-white hover:bg-white hover:text-black transition-all shadow-xl" title="Download"><Download className="w-5 h-5" /></button>
                    <button className="p-3 bg-fuchsia-600 rounded-2xl text-white hover:bg-fuchsia-500 transition-all shadow-xl shadow-fuchsia-600/20" title="Share"><Share2 className="w-5 h-5" /></button>
                  </div>
                </motion.div>

                {/* Re-generate button overlay */}
                <button onClick={generateVTO} className="mt-8 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-sm font-bold text-neutral-400 hover:text-white transition-all flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" /> RE-GENERATE
                </button>
              </div>
            ) : (
              <div className="text-center p-12 relative z-10">
                <div className="relative mb-8 mx-auto w-24 h-24">
                  <div className="absolute inset-0 bg-fuchsia-500/20 blur-3xl rounded-full scale-150 animate-pulse" />
                  <div className="w-full h-full rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center relative">
                    <Sparkles className="w-10 h-10 text-fuchsia-500/50" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">AI Vision Studio</h3>
                <p className="text-neutral-500 max-w-sm mx-auto leading-relaxed">
                  Upload your photo and a garment to begin. Our neural engine will synthesize fit, textures, and lighting for a professional studio result.
                </p>
              </div>
            )}

            {isGenerating && (
              <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center z-50 p-12 text-center">
                <div className="relative mb-8">
                  <div className="w-20 h-20 border-4 border-fuchsia-500/10 border-t-fuchsia-500 rounded-full animate-spin" />
                  <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-fuchsia-400 animate-pulse" />
                </div>
                <motion.h3 animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} className="text-2xl font-black text-white mb-2 tracking-widest">SYNTHESIZING...</motion.h3>
                <p className="text-fuchsia-400 font-medium mb-1">Mapping garment geometry to physique</p>
                <p className="text-neutral-500 text-sm">Strictly following brand creative direction</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Catalog Modal */}
      <AnimatePresence>
        {showCatalog && catalog && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCatalog(false)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-[#0a0a0a] border border-white/10 rounded-[40px] p-10 max-w-5xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-[0_0_100px_-20px_rgba(0,0,0,1)]">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h3 className="text-3xl font-black text-white flex items-center gap-3">
                    <ShoppingBag className="w-8 h-8 text-fuchsia-500" />
                    Product Catalog
                  </h3>
                  <p className="text-neutral-500 mt-1">Select an item to try on instantly</p>
                </div>
                <button onClick={() => setShowCatalog(false)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-colors group"><X className="group-hover:rotate-90 transition-transform" /></button>
              </div>
              <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                  {catalog.map(item => (
                    <button key={item.id} onClick={() => handleCatalogSelect(item)} className="group text-left">
                      <div className="aspect-[3/4] rounded-2xl overflow-hidden border border-white/5 group-hover:border-fuchsia-500/50 transition-all duration-500 bg-black shadow-lg">
                        <img src={item.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                      </div>
                      <div className="mt-4 px-1">
                        <p className="text-white font-bold text-sm truncate group-hover:text-fuchsia-400 transition-colors uppercase tracking-tight">{item.name}</p>
                        <p className="text-neutral-500 text-xs font-medium mt-1">{item.price}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
