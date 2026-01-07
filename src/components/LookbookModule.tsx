import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Upload, Sparkles, Layout, Download, Loader2, Image as ImageIcon, X, FileText, ShoppingBag, CheckCircle, Plus } from 'lucide-react';
import { jsPDF } from "jspdf";
import { ai } from '../utils/genai';
import { BrandVibe, CatalogItem } from '../types';
import { getContrastText } from '../utils/color';

interface LookbookConfig {
  layout: 'grid' | 'editorial' | 'hero' | 'collage';
  colorStrategy: 'monochromatic' | 'contrast' | 'minimalist';
  vibe: 'studio' | 'golden_hour' | 'moody';
  slogan: string;
  typography: 'minimal' | 'bold';
}

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
  const [selectedCatalogItems, setSelectedCatalogItems] = useState<CatalogItem[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
  
  // Director's Mode State
  const [config, setConfig] = useState<LookbookConfig>({
    layout: 'editorial',
    colorStrategy: 'minimalist',
    vibe: 'studio',
    slogan: '',
    typography: 'bold'
  });
  const [showDirectorsControls, setShowDirectorsControls] = useState(true);

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

  const toggleCatalogItem = (item: CatalogItem) => {
    if (selectedCatalogItems.find(i => i.id === item.id)) {
      setSelectedCatalogItems(prev => prev.filter(i => i.id !== item.id));
    } else {
      setSelectedCatalogItems(prev => [...prev, item]);
    }
  };

  const handleToggleSelectAll = () => {
    if (!catalog) return;
    if (selectedCatalogItems.length === catalog.length) {
      setSelectedCatalogItems([]);
    } else {
      setSelectedCatalogItems([...catalog]);
    }
  };

  const handleAddSelectedCatalogItems = async () => {
    if (selectedCatalogItems.length === 0) return;
    setIsLoadingCatalog(true);
    
    try {
      const newProducts: ProductImage[] = await Promise.all(selectedCatalogItems.map(async (item) => {
         // Convert URL to base64 via proxy
        const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(item.imageUrl)}`;
        const response = await fetch(proxyUrl);
        if (!response.ok) {
          console.warn(`Failed to load ${item.name}: ${response.statusText}`);
          throw new Error(`Failed to load ${item.name}`);
        }
        const blob = await response.blob();
        const file = new File([blob], item.name, { type: blob.type });

        return {
          id: Math.random().toString(36).substr(2, 9),
          url: URL.createObjectURL(blob),
          file
        };
      }));
      
      setProducts(prev => [...prev, ...newProducts]);
      setSelectedCatalogItems([]); // Clear selection after adding
      setShowCatalog(false);
    } catch (err) {
      console.error("Error loading selected catalog items:", err);
      alert("Failed to load some items. Please try again.");
    } finally {
      setIsLoadingCatalog(false);
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
      let completedCount = 0;
      setProgress(`Starting generation of ${chunks.length} pages...`);

      const pageGenerationPromises = chunks.map(async (chunk, index) => {
        try {
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

          const vibeContext = brandVibe ? `
            Brand Identity: ${brandVibe.name}
            Color Palette: Primary: ${brandVibe.palette.primary}, Secondary: ${brandVibe.palette.secondary}, Background: ${brandVibe.palette.background}, Text: ${brandVibe.palette.text}
            Accent Color: ${brandVibe.palette.accent}
            Font Style: ${brandVibe.font}
          ` : 'Style: High-end, minimalist fashion editorial.';

          // Dynamic Prompt Construction based on Config
          let layoutDirective = "";
          if (config.layout === 'grid') layoutDirective = "Use a strict, symmetrical grid layout. Equal spacing. Clean white or solid background.";
          if (config.layout === 'editorial') layoutDirective = "Use an asymmetrical, artistic layout. Overlap elements slightly. Use negative space creatively.";
          if (config.layout === 'hero') layoutDirective = "Feature one image as a large 'Hero' shot, and place others as smaller detail insets.";
          if (config.layout === 'collage') layoutDirective = "Create a mixed-media collage style. Torn paper edges, layered elements, chaotic but stylish.";

          let colorDirective = "";
          if (config.colorStrategy === 'monochromatic') colorDirective = "Color Strategy: Monochromatic. Use various shades and tints of the brand's primary color only.";
          if (config.colorStrategy === 'contrast') colorDirective = "Color Strategy: High Contrast. Use complementary colors from the palette to create bold visual impact.";
          if (config.colorStrategy === 'minimalist') colorDirective = "Color Strategy: Minimalist/Neutral. Use predominantly white, beige, or gray backgrounds with subtle brand accents.";

          let lightingDirective = "";
          if (config.vibe === 'studio') lightingDirective = "Lighting: High-key, bright professional studio lighting. Minimal shadows.";
          if (config.vibe === 'golden_hour') lightingDirective = "Lighting: Warm, natural 'Golden Hour' sunlight. Soft shadows, warm tones.";
          if (config.vibe === 'moody') lightingDirective = "Lighting: Low-key, dramatic, moody. Strong contrast and shadows.";

          const sloganDirective = config.slogan ? `Incorporate the campaign slogan "${config.slogan}" elegantly into the page design.` : "";
          const typoDirective = config.typography === 'bold' ? "Typography: Bold, large headlines. Magazine style." : "Typography: Minimal, small, sans-serif text only.";

          const prompt = `
            Create a stunning, high-fashion editorial lookbook page featuring the provided clothing item(s).
            
            ${vibeContext}
            
            ART DIRECTION CONFIGURATION:
            1. LAYOUT: ${layoutDirective}
            2. COLOR & TONE: ${colorDirective}
            3. ATMOSPHERE: ${lightingDirective}
            4. NARRATIVE: ${sloganDirective}
            5. TYPOGRAPHY: ${typoDirective}
            
            Directives:
            - Content: Seamlessly integrate the provided product image(s).
            - Background: Use the brand's color palette to create a cohesive background.
            - Quality: The output must look like a scanned page from Vogue or Harper's Bazaar. High resolution, photorealistic.
          `;

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

          let resultUrl: string | null = null;
          if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
              if (part.inlineData) {
                resultUrl = `data:image/png;base64,${part.inlineData.data}`;
                break;
              }
            }
          }
          
          completedCount++;
          setProgress(`Generating pages... (${completedCount}/${chunks.length})`);
          return resultUrl;

        } catch (err) {
          console.error(`Page ${index + 1} generation failed:`, err);
          completedCount++;
          setProgress(`Generating pages... (${completedCount}/${chunks.length})`);
          return null;
        }
      });

      const results = await Promise.all(pageGenerationPromises);
      const validPages = results.filter(page => page !== null) as string[];
      
      if (validPages.length < chunks.length) {
        alert(`Lookbook generation complete, but ${chunks.length - validPages.length} page(s) failed to generate.`);
      }
      
      setGeneratedPages(validPages);

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
        <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-4">Automated Lookbook Generator</h2>
        <p className="text-[var(--text-secondary)]">Turn raw product shots into a cohesive, themed seasonal campaign.</p>
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
                    className="fixed left-0 top-0 bottom-0 w-full max-w-md bg-[var(--card-bg)] border-r border-[var(--card-border)] z-[70] p-6 shadow-2xl flex flex-col"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-fuchsia-400" />
                        Select Products
                      </h3>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={handleToggleSelectAll}
                          className="text-xs font-medium text-fuchsia-400 hover:text-fuchsia-300 transition-colors"
                        >
                          {catalog && selectedCatalogItems.length === catalog.length ? 'Deselect All' : 'Select All'}
                        </button>
                        <button 
                          onClick={() => setShowCatalog(false)}
                          className="p-2 hover:bg-[var(--input-bg)] rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                      <div className="grid grid-cols-2 gap-4">
                        {catalog.map((item) => {
                          const isSelected = !!selectedCatalogItems.find(i => i.id === item.id);
                          return (
                            <button
                              key={item.id}
                              onClick={() => toggleCatalogItem(item)}
                              className={`group relative aspect-[3/4] rounded-xl overflow-hidden border transition-all text-left ${isSelected ? 'border-fuchsia-500 ring-2 ring-fuchsia-500/50' : 'border-[var(--card-border)] hover:border-fuchsia-500/50'}`}
                            >
                              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                <span className="text-sm text-white font-medium truncate w-full">{item.name}</span>
                                <span className="text-xs text-neutral-300">{item.price}</span>
                              </div>
                              {isSelected && (
                                <div className="absolute top-2 right-2 bg-fuchsia-600 text-white rounded-full p-1 shadow-lg">
                                  <CheckCircle className="w-4 h-4" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Floating Bottom Action Bar */}
                    <div className="mt-6 p-4 -mx-6 bg-[var(--card-bg)] border-t border-[var(--card-border)] backdrop-blur-md">
                      <button 
                        onClick={handleAddSelectedCatalogItems}
                        disabled={selectedCatalogItems.length === 0 || isLoadingCatalog}
                        className="w-full py-3 bg-fuchsia-600 text-white rounded-xl font-bold shadow-lg hover:bg-fuchsia-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isLoadingCatalog ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            Add {selectedCatalogItems.length} Items
                          </>
                        )}
                      </button>
                    </div>

                  </motion.div>
                  </>
                )}
              </AnimatePresence>

          {/* Director's Controls (New) */}
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6 relative">
            <button 
              onClick={() => setShowDirectorsControls(!showDirectorsControls)}
              className="w-full flex items-center justify-between mb-4 text-left"
            >
              <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <Layout className="w-5 h-5 text-fuchsia-400" />
                Director's Controls
              </h3>
              <span className="text-[var(--text-secondary)] text-xs">
                {showDirectorsControls ? 'Hide' : 'Show'}
              </span>
            </button>
            
            <AnimatePresence>
              {showDirectorsControls && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden space-y-4"
                >
                  {/* Layout Selector */}
                  <div>
                    <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">Layout Archetype</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['grid', 'editorial', 'hero', 'collage'] as const).map(type => (
                        <button
                          key={type}
                          onClick={() => setConfig({ ...config, layout: type })}
                          className={`px-3 py-2 rounded-lg text-xs font-medium capitalize border transition-all ${
                            config.layout === type 
                              ? 'bg-fuchsia-600/20 border-fuchsia-600 text-fuchsia-400' 
                              : 'bg-[var(--input-bg)] border-transparent text-[var(--text-secondary)] hover:bg-[var(--card-border)]'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color Strategy Selector */}
                  <div>
                    <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">Color Strategy</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['monochromatic', 'contrast', 'minimalist'] as const).map(type => (
                        <button
                          key={type}
                          onClick={() => setConfig({ ...config, colorStrategy: type })}
                          className={`px-2 py-2 rounded-lg text-[10px] font-medium capitalize border transition-all ${
                            config.colorStrategy === type 
                              ? 'bg-fuchsia-600/20 border-fuchsia-600 text-fuchsia-400' 
                              : 'bg-[var(--input-bg)] border-transparent text-[var(--text-secondary)] hover:bg-[var(--card-border)]'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Vibe Selector */}
                  <div>
                    <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">Lighting & Vibe</label>
                     <div className="grid grid-cols-3 gap-2">
                      {(['studio', 'golden_hour', 'moody'] as const).map(type => (
                        <button
                          key={type}
                          onClick={() => setConfig({ ...config, vibe: type })}
                          className={`px-2 py-2 rounded-lg text-[10px] font-medium capitalize border transition-all ${
                            config.vibe === type 
                              ? 'bg-fuchsia-600/20 border-fuchsia-600 text-fuchsia-400' 
                              : 'bg-[var(--input-bg)] border-transparent text-[var(--text-secondary)] hover:bg-[var(--card-border)]'
                          }`}
                        >
                          {type.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                   {/* Typography Selector */}
                   <div>
                    <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">Typography Style</label>
                    <div className="flex gap-2">
                      {(['minimal', 'bold'] as const).map(type => (
                        <button
                          key={type}
                          onClick={() => setConfig({ ...config, typography: type })}
                          className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium capitalize border transition-all ${
                            config.typography === type 
                              ? 'bg-fuchsia-600/20 border-fuchsia-600 text-fuchsia-400' 
                              : 'bg-[var(--input-bg)] border-transparent text-[var(--text-secondary)] hover:bg-[var(--card-border)]'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Slogan Input */}
                  <div>
                     <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">Campaign Slogan</label>
                     <input 
                      type="text" 
                      value={config.slogan}
                      onChange={(e) => setConfig({ ...config, slogan: e.target.value })}
                      placeholder="e.g. Summer of Escapism"
                      className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-fuchsia-500 transition-colors"
                     />
                  </div>

                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Upload Area */}
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6 relative group hover:border-fuchsia-500/50 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <Upload className="w-5 h-5 text-fuchsia-400" />
                Collection
              </h3>
            </div>

            <div className="relative">
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                  {/* Upload Button */}
                  <label className="rounded-xl border-2 border-dashed border-[var(--card-border)] hover:border-[var(--text-secondary)] bg-[var(--input-bg)] flex flex-col items-center justify-center cursor-pointer transition-all group py-8">
                    <div className="w-12 h-12 rounded-full bg-[var(--card-bg)] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6 text-[var(--text-secondary)]" />
                    </div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">Upload File</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">Images</p>
                    <input type="file" multiple accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>

                  {/* Catalog Button */}
                  {catalog && catalog.length > 0 ? (
                    <div 
                      className="rounded-xl border-2 border-dashed border-[var(--card-border)] hover:border-fuchsia-500/50 bg-[var(--input-bg)] flex flex-col items-center justify-center cursor-pointer transition-all group py-8"
                      onClick={() => setShowCatalog(true)}
                    >
                      <div className="w-12 h-12 rounded-full bg-[var(--card-bg)] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <ShoppingBag className="w-6 h-6 text-fuchsia-400" />
                      </div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">Browse Catalog</p>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">{catalog.length} items available</p>
                    </div>
                  ) : (
                    <div className="rounded-xl border-2 border-dashed border-[var(--card-border)] bg-[var(--input-bg)]/50 flex flex-col items-center justify-center opacity-50 py-8">
                      <ShoppingBag className="w-6 h-6 text-[var(--text-secondary)] mb-2" />
                      <p className="text-sm text-[var(--text-secondary)]">Catalog Empty</p>
                    </div>
                  )}
              </div>

              {products.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {products.map((p) => (
                    <div key={p.id} className="aspect-square rounded-lg overflow-hidden relative group border border-[var(--card-border)]">
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
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
              <Layout className="w-4 h-4 text-purple-400" />
              How it works
            </h3>
            <ul className="text-xs text-[var(--text-secondary)] space-y-2 list-disc pl-4">
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
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-2 min-h-[800px] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--card-border)]">
              <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <BookOpen className="w-4 h-4" />
                Lookbook Preview
              </div>
              {generatedPages.length > 0 && (
                <button 
                  onClick={handleExportPDF}
                  className="text-xs flex items-center gap-1 text-fuchsia-400 hover:text-fuchsia-300"
                  style={brandVibe ? { color: brandVibe.palette.accent } : undefined}
                >
                  <Download className="w-3 h-3" />
                  Export PDF
                </button>
              )}
            </div>
            
            <div className="flex-1 bg-[var(--bg-primary)] rounded-xl m-2 overflow-y-auto p-8 custom-scrollbar relative">
              {/* Background Pattern */}
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none" />
              
              {generatedPages.length > 0 ? (
                <div className="space-y-8 max-w-2xl mx-auto relative z-10">
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
                      <div className="absolute -bottom-6 left-0 right-0 text-center text-xs text-[var(--text-secondary)]">
                        Page {index + 1}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-[var(--text-secondary)] relative z-10">
                  <div className="w-20 h-20 bg-[var(--card-bg)] rounded-full flex items-center justify-center mb-4">
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

