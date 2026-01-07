'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Upload, Sparkles, Layout, Download, Loader2, Image as ImageIcon, X, FileText, ShoppingBag, CheckCircle, RefreshCw, Layers, ChevronRight, ChevronLeft } from 'lucide-react';
import { BrandVibe, CatalogItem } from '../types';
import jsPDF from 'jspdf';

interface LookbookModuleProps {
  brandId: string;
  brandVibe?: BrandVibe | null;
  catalog?: CatalogItem[] | null;
}

export const LookbookModule: React.FC<LookbookModuleProps> = ({ brandId, brandVibe, catalog }) => {
  const [selectedProducts, setSelectedProducts] = useState<CatalogItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPages, setGeneratedPages] = useState<string[]>([]);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [useBrandPdf, setUseBrandPdf] = useState(true);

  const handleToggleProduct = (item: CatalogItem) => {
    if (selectedProducts.find(p => p.id === item.id)) {
      setSelectedProducts(prev => prev.filter(p => p.id !== item.id));
    } else {
      setSelectedProducts(prev => [...prev, item]);
    }
  };

  const getBase64 = async (url: string): Promise<string> => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.error("Failed to fetch base64", e);
      return "";
    }
  };

  const generateLookbook = async () => {
    if (selectedProducts.length === 0) return;
    setIsGenerating(true);
    setGeneratedPages([]);
    setError(null);
    setCurrentPage(0);
    setProgress('Strategizing editorial layout...');

    try {
      const chunks: CatalogItem[][] = [];
      for (let i = 0; i < selectedProducts.length; i += 2) {
        chunks.push(selectedProducts.slice(i, i + 2));
      }

      const newPages: string[] = [];
      for (let i = 0; i < chunks.length; i++) {
        setProgress(`Dreaming up page ${i + 1} of ${chunks.length}...`);

        const imageBase64s = await Promise.all(chunks[i].map(p => getBase64(p.imageUrl)));

        const response = await fetch('http://localhost:8000/api/generate/lookbook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            brand_id: brandId,
            product_images: imageBase64s,
            brand_report: brandVibe?.mood, // Using mood/vibe as grounding
            useBrandPdf: useBrandPdf
          })
        });

        const data = await response.json();
        if (data.image && data.image.length > 50) {
          newPages.push(data.image);
        } else {
          throw new Error(data.error || `Failed to generate page ${i + 1}.`);
        }
      }
      setGeneratedPages(newPages);
    } catch (error: any) {
      console.error("Lookbook generation failed:", error);
      setError(error.message || "Failed to generate lookbook.");
    } finally {
      setIsGenerating(false);
      setProgress('');
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "px", format: [768, 1024] });
    generatedPages.forEach((page, i) => {
      if (i > 0) doc.addPage();
      doc.addImage(page, 'PNG', 0, 0, 768, 1024);
    });
    doc.save(`${brandVibe?.name || 'brand'}-lookbook.pdf`);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-12">
        <h2 className="text-4xl font-bold text-white mb-4 tracking-tight">Editorial Lookbook</h2>
        <p className="text-neutral-400 text-lg">Curate selection and transform catalog items into a cohesive seasonal narrative.</p>
      </div>

      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-center text-sm font-medium">
          {error}
        </motion.div>
      )}

      <div className="grid lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white/5 border border-white/10 rounded-[32px] p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xs font-black text-neutral-500 uppercase tracking-[0.2em] flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" /> Curate Selection
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-fuchsia-500/10 text-fuchsia-400 rounded-full border border-fuchsia-500/20">
                {selectedProducts.length} SELECTED
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 max-h-[500px] overflow-y-auto pr-3 custom-scrollbar">
              {catalog?.map(item => {
                const isSelected = !!selectedProducts.find(p => p.id === item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => handleToggleProduct(item)}
                    className={`aspect-[3/4] rounded-2xl overflow-hidden border-2 transition-all duration-300 relative group
                      ${isSelected ? 'border-fuchsia-500 scale-95 shadow-lg shadow-fuchsia-500/20' : 'border-transparent'}`}
                  >
                    <img src={item.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className={`absolute inset-0 flex items-center justify-center transition-all ${isSelected ? 'bg-fuchsia-500/20' : 'bg-black/0 group-hover:bg-black/40'}`}>
                      {isSelected ? <CheckCircle className="text-white w-6 h-6 drop-shadow-lg" /> : <Sparkles className="text-white w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-8 p-6 bg-white/5 border border-white/10 rounded-2xl">
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
              <p className="text-[10px] text-neutral-500 italic">Use generated Brand_Report.pdf for strict style compliance.</p>
            </div>

            <button
              onClick={generateLookbook}
              disabled={selectedProducts.length === 0 || isGenerating}
              className="w-full mt-10 py-5 bg-white text-black rounded-[24px] font-black text-lg tracking-wider flex items-center justify-center gap-3 disabled:opacity-30 hover:bg-neutral-200 transition-all active:scale-95 group shadow-xl"
            >
              {isGenerating ? <Loader2 className="animate-spin w-6 h-6" /> : <Layers className="w-6 h-6" />}
              COMPILE EDITORIAL
            </button>
          </div>
        </div>

        <div className="lg:col-span-8 flex flex-col h-full min-h-[700px]">
          <div className="bg-white/5 border border-white/10 rounded-[40px] flex-1 flex flex-col relative overflow-hidden group shadow-inner">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none" />

            {generatedPages.length > 0 ? (
              <div className="flex-1 flex flex-col p-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <h3 className="text-xl font-black text-white px-2">Editorial Result</h3>
                    <div className="p-1.5 bg-white/5 rounded-xl border border-white/10 flex items-center gap-1">
                      {generatedPages.map((_, i) => (
                        <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentPage ? 'bg-fuchsia-500 w-4' : 'bg-white/20'}`} />
                      ))}
                    </div>
                  </div>
                  <button onClick={exportPDF} className="flex items-center gap-2 px-6 py-3 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-2xl text-xs font-black tracking-widest transition-all shadow-xl shadow-fuchsia-600/20">
                    <Download className="w-4 h-4" /> EXPORT PDF
                  </button>
                </div>

                <div className="flex-1 relative flex items-center justify-center p-4">
                  <div className="w-full max-w-5xl flex gap-4 perspective-[2000px]">
                    <AnimatePresence mode="wait">
                      {/* Left Page */}
                      <motion.div
                        key={`left-${currentPage}`}
                        initial={{ rotateY: 90, opacity: 0 }}
                        animate={{ rotateY: 0, opacity: 1 }}
                        exit={{ rotateY: -90, opacity: 0 }}
                        transition={{ duration: 0.8, ease: "circOut" }}
                        className="flex-1 aspect-[3/4] bg-white rounded-l-2xl shadow-2xl border-r border-neutral-200 overflow-hidden relative origin-right"
                      >
                        <img src={generatedPages[currentPage * 2]} className="w-full h-full object-cover" />
                        <div className="absolute bottom-4 left-4 text-[10px] font-black text-black/20 uppercase tracking-widest">Page {currentPage * 2 + 1}</div>
                      </motion.div>

                      {/* Right Page (Next) */}
                      {generatedPages[currentPage * 2 + 1] && (
                        <motion.div
                          key={`right-${currentPage}`}
                          initial={{ rotateY: -90, opacity: 0 }}
                          animate={{ rotateY: 0, opacity: 1 }}
                          exit={{ rotateY: 90, opacity: 0 }}
                          transition={{ duration: 0.8, ease: "circOut", delay: 0.1 }}
                          className="flex-1 aspect-[3/4] bg-white rounded-r-2xl shadow-2xl overflow-hidden relative origin-left"
                        >
                          <img src={generatedPages[currentPage * 2 + 1]} className="w-full h-full object-cover" />
                          <div className="absolute bottom-4 right-4 text-[10px] font-black text-black/20 uppercase tracking-widest">Page {currentPage * 2 + 2}</div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Controls */}
                    <div className="absolute inset-y-0 -left-20 flex items-center">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                        disabled={currentPage === 0}
                        className="p-4 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 text-white disabled:opacity-0 transition-all active:scale-95"
                      >
                        <ChevronLeft />
                      </button>
                    </div>
                    <div className="absolute inset-y-0 -right-20 flex items-center">
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(Math.floor((generatedPages.length - 1) / 2), prev + 1))}
                        disabled={currentPage >= Math.floor((generatedPages.length - 1) / 2)}
                        className="p-4 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 text-white disabled:opacity-0 transition-all active:scale-95"
                      >
                        <ChevronRight />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                <div className="relative mb-8">
                  <div className="w-24 h-24 bg-fuchsia-500/10 blur-[80px] rounded-full absolute inset-0 animate-pulse" />
                  <div className="w-24 h-24 rounded-[40px] bg-white/5 border border-white/10 flex items-center justify-center relative backdrop-blur-3xl">
                    <BookOpen className="w-10 h-10 text-fuchsia-500/30" />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-wide">Ready for Production</h3>
                <p className="text-neutral-500 max-w-sm leading-relaxed">
                  {isGenerating ? progress : 'Select multiple catalog items and compile them into a high-fashion editorial layout page by page.'}
                </p>
              </div>
            )}

            {isGenerating && (
              <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center z-50 p-12 text-center">
                <div className="relative mb-8">
                  <div className="w-20 h-20 border-4 border-fuchsia-500/10 border-t-fuchsia-500 rounded-full animate-spin" />
                  <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-fuchsia-400 animate-pulse" />
                </div>
                <motion.h3 animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} className="text-2xl font-black text-white mb-2 tracking-widest uppercase">Rendering Volume...</motion.h3>
                <p className="text-fuchsia-400 font-medium mb-1 truncate max-w-xs">{progress}</p>
                <p className="text-neutral-500 text-sm">Applying brand-grounded composition logic</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
