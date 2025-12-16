import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Upload, Sparkles, Layout, Download, Loader2, Image as ImageIcon, X, FileText, ShoppingBag } from 'lucide-react';
import { jsPDF } from "jspdf";
import { ai } from '../utils/genai';
import { BrandVibe, CatalogItem } from '../types';
import { getContrastText } from '../utils/color';

interface ProductImage {
  id: string;
  url: string;
  file: File;
}

interface LookbookModuleProps {
  brandVibe?: BrandVibe | null;
  catalog?: CatalogItem[] | null;
}

export const LookbookModule: React.FC<LookbookModuleProps> = ({ brandVibe, catalog }) => {
  const [products, setProducts] = useState<ProductImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPages, setGeneratedPages] = useState<string[]>([]);
  const [progress, setProgress] = useState<string>('');
  const [showCatalog, setShowCatalog] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newProducts: ProductImage[] = Array.from(e.target.files).map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        url: URL.createObjectURL(file),
        file
      }));
      setProducts(prev => [...prev, ...newProducts]);
    }
  };

  const handleCatalogSelect = async (item: CatalogItem) => {
    try {
      // Convert URL to base64/File
      const response = await fetch(item.imageUrl);
      const blob = await response.blob();
      const file = new File([blob], item.name, { type: blob.type });
      
      const newProduct: ProductImage = {
        id: Math.random().toString(36).substr(2, 9),
        url: URL.createObjectURL(blob), // Use blob URL for preview
        file
      };
      
      setProducts(prev => [...prev, newProduct]);
      setShowCatalog(false);
    } catch (err) {
      console.error("Error loading catalog item:", err);
      alert("Failed to load catalog item image.");
    }
  };

  const generateLookbook = async () => {
    if (products.length === 0) return;
    setIsGenerating(true);
    setGeneratedPages([]);
    setProgress('Initializing creative direction...');

    try {
      // Chunk products into pages (1 or 2 items per page)
      const chunks: ProductImage[][] = [];
      for (let i = 0; i < products.length; i += 2) {
        chunks.push(products.slice(i, i + 2));
      }

      const newPages: string[] = [];

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        setProgress(`Rendering page ${i + 1} of ${chunks.length}...`);

        // Prepare image parts for the prompt
        const imageParts = await Promise.all(chunk.map(async (p) => {
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(p.file);
          });
          return {
            inlineData: {
              mimeType: p.file.type,
              data: base64.split(',')[1]
            }
          };
        }));

        // Construct Prompt
        const vibeContext = brandVibe ? `
          Brand Identity: ${brandVibe.name}
          Color Palette: ${brandVibe.colors.join(', ')}
          Accent Color: ${brandVibe.accentColor}
          Font Style: ${brandVibe.font}
        ` : 'Style: High-end, minimalist fashion editorial.';

        const prompt = `
          Create a stunning, high-fashion editorial lookbook page featuring the provided clothing item(s).
          
          ${vibeContext}
          
          Directives:
          1. LAYOUT: Use an asymmetrical, artistic layout. Do NOT use a simple grid. Overlap elements slightly or use interesting whitespace.
          2. CONTENT: seamlessly integrate the provided product image(s) into the page. 
          3. TEXT: Generate and render elegant, legible marketing copy describing the items (e.g., "The Silk Touch", "Midnight Elegance"). Use the brand's font style.
          4. BACKGROUND: Use the brand's color palette to create a cohesive background that complements the products.
          5. QUALITY: The output must look like a scanned page from Vogue or Harper's Bazaar. High resolution, photorealistic.
        `;

        // Call Gemini 3 Pro
        const response = await ai.models.generateContent({
          model: 'gemini-3-pro-image-preview',
          contents: {
            role: 'user',
            parts: [
              { text: prompt },
              ...imageParts
            ]
          },
          config: {
            imageConfig: {
              aspectRatio: "3:4",
              imageSize: "1K"
            }
          }
        });

        // Extract Image
        if (response.candidates?.[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
              const base64Data = part.inlineData.data;
              newPages.push(`data:image/png;base64,${base64Data}`);
              break;
            }
          }
        }
      }

      setGeneratedPages(newPages);

    } catch (error) {
      console.error("Lookbook generation failed:", error);
      alert("Failed to generate lookbook. Please try again.");
    } finally {
      setIsGenerating(false);
      setProgress('');
    }
  };

  const handleExportPDF = () => {
    if (generatedPages.length === 0) return;
    
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "px",
      format: [768, 1024] // Matches 3:4 roughly
    });

    generatedPages.forEach((pageUrl, index) => {
      if (index > 0) doc.addPage();
      doc.addImage(pageUrl, 'PNG', 0, 0, 768, 1024);
    });

    doc.save("genfashion-lookbook.pdf");
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-white mb-4">Automated Lookbook Generator</h2>
        <p className="text-neutral-400">Turn raw product shots into a cohesive, themed seasonal campaign.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Sidebar / Controls */}
        <div className="lg:col-span-4 space-y-6 relative">
             <AnimatePresence>
                {showCatalog && catalog && (
                  <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowCatalog(false)}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
                  />
                  <motion.div
                    initial={{ x: '-100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '-100%' }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="fixed left-0 top-0 bottom-0 w-full max-w-md bg-neutral-900 border-r border-white/10 z-[70] p-6 shadow-2xl overflow-y-auto"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-fuchsia-400" />
                        Select Product
                      </h3>
                      <button 
                        onClick={() => setShowCatalog(false)}
                        className="p-2 hover:bg-white/10 rounded-full text-neutral-400 hover:text-white transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {catalog.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleCatalogSelect(item)}
                          className="group relative aspect-[3/4] rounded-xl overflow-hidden border border-white/5 hover:border-fuchsia-500/50 transition-all text-left"
                        >
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                            <span className="text-sm text-white font-medium truncate w-full">{item.name}</span>
                            <span className="text-xs text-neutral-300">{item.price}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                  </>
                )}
              </AnimatePresence>

          {/* Upload Area */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative group hover:border-fuchsia-500/50 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-fuchsia-400" />
                Collection
              </h3>
            </div>

            <div className="relative">
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                  {/* Upload Button */}
                  <label className="rounded-xl border-2 border-dashed border-white/10 hover:border-white/30 bg-white/5 flex flex-col items-center justify-center cursor-pointer transition-all group py-8">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6 text-neutral-400" />
                    </div>
                    <p className="text-sm font-medium text-white">Upload File</p>
                    <p className="text-xs text-neutral-500 mt-1">Images</p>
                    <input type="file" multiple accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>

                  {/* Catalog Button */}
                  {catalog && catalog.length > 0 ? (
                    <div 
                      className="rounded-xl border-2 border-dashed border-white/10 hover:border-fuchsia-500/50 bg-white/5 flex flex-col items-center justify-center cursor-pointer transition-all group py-8"
                      onClick={() => setShowCatalog(true)}
                    >
                      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <ShoppingBag className="w-6 h-6 text-fuchsia-400" />
                      </div>
                      <p className="text-sm font-medium text-white">Browse Catalog</p>
                      <p className="text-xs text-neutral-500 mt-1">{catalog.length} items available</p>
                    </div>
                  ) : (
                    <div className="rounded-xl border-2 border-dashed border-white/10 bg-white/5 flex flex-col items-center justify-center opacity-50 py-8">
                      <ShoppingBag className="w-6 h-6 text-neutral-400 mb-2" />
                      <p className="text-sm text-neutral-500">Catalog Empty</p>
                    </div>
                  )}
              </div>

              {products.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {products.map((p) => (
                    <div key={p.id} className="aspect-square rounded-lg overflow-hidden relative group border border-white/10">
                      <img src={p.url} alt="Product" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button 
                          onClick={() => setProducts(products.filter(i => i.id !== p.id))}
                          className="text-white hover:text-red-400"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={generateLookbook}
              disabled={products.length === 0 || isGenerating}
              className="w-full py-3 bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-fuchsia-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              Generate Campaign
            </button>
            
            {isGenerating && (
              <div className="mt-4 text-center">
                <p className="text-sm text-fuchsia-400 animate-pulse">{progress}</p>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <Layout className="w-4 h-4 text-purple-400" />
              How it works
            </h3>
            <ul className="text-xs text-neutral-400 space-y-2 list-disc pl-4">
              <li>Upload your product catalog images.</li>
              <li>Our AI groups them into editorial pages.</li>
              <li>Gemini 3 Pro generates high-fashion layouts.</li>
              <li>Brand colors and fonts are applied automatically.</li>
              <li>Export the final collection as a PDF.</li>
            </ul>
          </div>
        </div>

        {/* Preview Area */}
        <div className="lg:col-span-8">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-2 min-h-[800px] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <div className="flex items-center gap-2 text-sm text-neutral-400">
                <BookOpen className="w-4 h-4" />
                Lookbook Preview
              </div>
              {generatedPages.length > 0 && (
                <button 
                  onClick={handleExportPDF}
                  className="text-xs flex items-center gap-1 text-fuchsia-400 hover:text-fuchsia-300"
                  style={brandVibe ? { color: brandVibe.accentColor } : undefined}
                >
                  <Download className="w-3 h-3" />
                  Export PDF
                </button>
              )}
            </div>
            
            <div className="flex-1 bg-neutral-900/50 rounded-xl m-2 overflow-y-auto p-8 custom-scrollbar">
              {generatedPages.length > 0 ? (
                <div className="space-y-8 max-w-2xl mx-auto">
                  {generatedPages.map((page, index) => (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.2 }}
                      className="relative group"
                    >
                      <div className="aspect-[3/4] w-full bg-white rounded-sm shadow-2xl overflow-hidden">
                        <img src={page} alt={`Page ${index + 1}`} className="w-full h-full object-cover" />
                      </div>
                      <div className="absolute -bottom-6 left-0 right-0 text-center text-xs text-neutral-500">
                        Page {index + 1}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-neutral-600">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
                    <FileText className="w-10 h-10 opacity-20" />
                  </div>
                  <p>Upload products to generate your lookbook</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

