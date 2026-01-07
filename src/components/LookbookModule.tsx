import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Upload, Sparkles, Layout, Download, Loader2, Image as ImageIcon, X, FileText, ShoppingBag, CheckCircle, Plus, ArrowLeft, Grid, Edit3 } from 'lucide-react';
import { jsPDF } from "jspdf";
import { ai } from '../utils/genai';
import { BrandVibe, CatalogItem } from '../types';
import { getContrastText } from '../utils/color';

// --- Types ---

type LayoutType = 'grid' | 'editorial' | 'hero' | 'collage';
type ColorStrategy = 'monochromatic' | 'contrast' | 'minimalist';
type VibeType = 'studio' | 'golden_hour' | 'moody';
type TypographyType = 'minimal' | 'bold';
type CuratorialStrategy = 'by_color' | 'by_occasion' | 'by_category' | 'by_outfit' | 'eclectic';

interface LookbookConfig {
  layout: LayoutType;
  colorStrategy: ColorStrategy;
  vibe: VibeType;
  slogan: string;
  typography: TypographyType;
}

interface PageConfig {
  layout: LayoutType;
  vibe: VibeType;
  caption: string;
}

interface StoryboardPage {
  id: string;
  productIds: string[]; // References to ProductImage.id
  config: PageConfig;
  status: 'draft' | 'rendering' | 'completed' | 'failed';
  resultUrl?: string;
}

interface ProductImage {
  id: string;
  url: string;
  file: File;
  name?: string; // Optional name for AI context
}

interface LookbookModuleProps {
  brandVibe?: BrandVibe | null;
  catalog?: CatalogItem[] | null;
}

export const LookbookModule: React.FC<LookbookModuleProps> = ({ brandVibe, catalog }) => {
  // --- State ---
  const [products, setProducts] = useState<ProductImage[]>([]);
  const [viewMode, setViewMode] = useState<'selection' | 'storyboard'>('selection');
  
  // Selection Mode State
  const [showCatalog, setShowCatalog] = useState(false);
  const [selectedCatalogItems, setSelectedCatalogItems] = useState<CatalogItem[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
  const [globalConfig, setGlobalConfig] = useState<LookbookConfig>({
    layout: 'editorial',
    colorStrategy: 'minimalist',
    vibe: 'studio',
    slogan: '',
    typography: 'bold'
  });
  const [curatorialStrategy, setCuratorialStrategy] = useState<CuratorialStrategy>('eclectic');
  const [showDirectorsControls, setShowDirectorsControls] = useState(true);

  // Storyboard Mode State
  const [storyboard, setStoryboard] = useState<StoryboardPage[]>([]);
  const [isDrafting, setIsDrafting] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [progress, setProgress] = useState<string>('');

  // --- Handlers: Selection ---

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newProducts: ProductImage[] = Array.from(e.target.files).map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        url: URL.createObjectURL(file),
        file,
        name: file.name
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
        const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(item.imageUrl)}`;
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error(`Failed to load ${item.name}`);
        const blob = await response.blob();
        const file = new File([blob], item.name, { type: blob.type });

        return {
          id: Math.random().toString(36).substr(2, 9),
          url: URL.createObjectURL(blob),
          file,
          name: item.name
        };
      }));
      
      setProducts(prev => [...prev, ...newProducts]);
      setSelectedCatalogItems([]); 
      setShowCatalog(false);
    } catch (err) {
      console.error("Error loading items:", err);
      alert("Failed to load some items.");
    } finally {
      setIsLoadingCatalog(false);
    }
  };

  // --- Logic: Draft Storyboard (Gemini Flash) ---

  const draftStoryboard = async () => {
    if (products.length === 0) return;
    setIsDrafting(true);
    setProgress('AI Director is analyzing your collection...');

    try {
      // 1. Prepare Product List for AI
      const productList = products.map(p => `ID: ${p.id}, Name: ${p.name || 'Unknown Item'}`).join('\n');

      // 2. Construct Prompt
      const prompt = `
        You are a Fashion Editorial Director. Organize these ${products.length} products into a cohesive Lookbook Storyboard.
        
        Products:
        ${productList}

        Curatorial Strategy: ${curatorialStrategy.replace('_', ' ').toUpperCase()}
        Brand Vibe: ${brandVibe ? brandVibe.mood : 'High Fashion'}
        
        Task:
        Group these items into pages (1-3 items per page). 
        For each page, suggest a Layout (grid/editorial/hero/collage), a Vibe (studio/golden_hour/moody), and a short creative Caption.
        
        Return strictly a JSON object with this structure:
        {
          "pages": [
            {
              "productIds": ["id1", "id2"],
              "layout": "editorial",
              "vibe": "studio",
              "caption": "Summer Haze"
            }
          ]
        }
      `;

      // 3. Call Gemini Flash
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { role: 'user', parts: [{ text: prompt }] },
        config: { responseMimeType: 'application/json' }
      });

      const result = JSON.parse(response.text || '{"pages": []}');
      
      // 4. Transform to State
      const newStoryboard: StoryboardPage[] = result.pages.map((p: any) => ({
        id: Math.random().toString(36).substr(2, 9),
        productIds: p.productIds,
        config: {
          layout: p.layout || globalConfig.layout,
          vibe: p.vibe || globalConfig.vibe,
          caption: p.caption || ''
        },
        status: 'draft'
      }));

      setStoryboard(newStoryboard);
      setViewMode('storyboard');

    } catch (error) {
      console.error("Drafting failed:", error);
      alert("Failed to draft storyboard. Please try again.");
    } finally {
      setIsDrafting(false);
      setProgress('');
    }
  };

  // --- Logic: Render Storyboard (Gemini Pro Image) ---

  const renderPage = async (page: StoryboardPage) => {
    // Helper to render a single page
    const pageProducts = products.filter(p => page.productIds.includes(p.id));
    if (pageProducts.length === 0) return null;

    try {
      const imageParts = await Promise.all(pageProducts.map(async (p) => {
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(p.file);
        });
        return {
          inlineData: { mimeType: p.file.type, data: base64.split(',')[1] }
        };
      }));

      const layoutDirective = {
        grid: "Use a strict, symmetrical grid layout. Equal spacing.",
        editorial: "Use an asymmetrical, artistic layout. Overlap elements slightly.",
        hero: "Feature one large 'Hero' shot, others as details.",
        collage: "Mixed-media collage style. Torn edges, layered."
      }[page.config.layout];

      const vibeDirective = {
        studio: "High-key, bright studio lighting.",
        golden_hour: "Warm, natural sunlight. Soft shadows.",
        moody: "Low-key, dramatic, high contrast."
      }[page.config.vibe];

      const colorDirective = {
        monochromatic: "Monochromatic. Various shades of the brand's primary color.",
        contrast: "High Contrast. Complementary colors.",
        minimalist: "Minimalist. White/Beige/Gray backgrounds."
      }[globalConfig.colorStrategy]; // Use global color strategy for consistency

      const prompt = `
        Create a high-fashion lookbook page.
        Brand: ${brandVibe?.name || 'Generic'}. Mood: ${brandVibe?.mood || 'Stylish'}.
        
        CONFIG:
        Layout: ${layoutDirective}
        Lighting: ${vibeDirective}
        Color: ${colorDirective}
        Caption: Include the text "${page.config.caption}" elegantly.
        
        Directives:
        - Integrate provided products seamlessly.
        - Photorealistic, Vogue magazine quality.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
          role: 'user',
          parts: [{ text: prompt }, ...imageParts]
        },
        config: { imageConfig: { aspectRatio: "3:4", imageSize: "1K" } }
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
      }
      return null;
    } catch (e) {
      console.error("Page render failed:", e);
      return null;
    }
  };

  const renderStoryboard = async () => {
    setIsRendering(true);
    let completed = 0;
    
    // Process pages that are not yet completed
    const pagesToRender = storyboard.filter(p => p.status !== 'completed');
    setProgress(`Rendering ${pagesToRender.length} pages...`);

    // We can render in parallel batches of 3 to avoid rate limits/overload? 
    // Or just Promise.all for speed if API allows. Let's do Promise.all for now.
    
    const results = await Promise.all(storyboard.map(async (page) => {
      if (page.status === 'completed') return page;
      
      // Update status to rendering (locally purely visual) 
      
      const url = await renderPage(page);
      if (url) {
        completed++;
        setProgress(`Rendering... (${completed}/${pagesToRender.length})`);
        return { ...page, status: 'completed' as const, resultUrl: url };
      } else {
        return { ...page, status: 'failed' as const };
      }
    }));

    setStoryboard(results);
    setIsRendering(false);
    setProgress('');
  };

  const handleExportPDF = () => {
    const completedPages = storyboard.filter(p => p.status === 'completed' && p.resultUrl);
    if (completedPages.length === 0) return;
    
    const doc = new jsPDF({ orientation: "portrait", unit: "px", format: [768, 1024] });
    completedPages.forEach((page, index) => {
      if (index > 0) doc.addPage();
      if (page.resultUrl) doc.addImage(page.resultUrl, 'PNG', 0, 0, 768, 1024);
    });
    doc.save("genfashion-lookbook.pdf");
  };


  // --- UI Renders ---

  const renderSidebar = () => (
    <div className="lg:col-span-4 space-y-6 relative">
      
      {/* Directors Controls */}
      {viewMode === 'selection' && (
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
                  {/* Curatorial Strategy */}
                  <div>
                    <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">Curatorial Strategy</label>
                    <div className="grid grid-cols-2 gap-2">
                       {(['by_color', 'by_occasion', 'by_category', 'by_outfit', 'eclectic'] as const).map(s => (
                         <button
                           key={s}
                           onClick={() => setCuratorialStrategy(s)}
                           className={`px-2 py-2 rounded-lg text-[10px] font-medium capitalize border transition-all ${curatorialStrategy === s 
                             ? 'bg-fuchsia-600/20 border-fuchsia-600 text-fuchsia-400' 
                             : 'bg-[var(--input-bg)] border-transparent text-[var(--text-secondary)] hover:bg-[var(--card-border)]'}`}
                         >
                           {s.replace('_', ' ')}
                         </button>
                       ))}
                    </div>
                  </div>

                  {/* Layout Defaults */}
                  <div>
                    <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">Default Layout</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['grid', 'editorial', 'hero', 'collage'] as const).map(type => (
                        <button
                          key={type}
                          onClick={() => setGlobalConfig({ ...globalConfig, layout: type })}
                          className={`px-3 py-2 rounded-lg text-xs font-medium capitalize border transition-all ${globalConfig.layout === type 
                            ? 'bg-fuchsia-600/20 border-fuchsia-600 text-fuchsia-400' 
                            : 'bg-[var(--input-bg)] border-transparent text-[var(--text-secondary)] hover:bg-[var(--card-border)]'}`}
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
                          onClick={() => setGlobalConfig({ ...globalConfig, colorStrategy: type })}
                          className={`px-2 py-2 rounded-lg text-[10px] font-medium capitalize border transition-all ${globalConfig.colorStrategy === type 
                            ? 'bg-fuchsia-600/20 border-fuchsia-600 text-fuchsia-400' 
                            : 'bg-[var(--input-bg)] border-transparent text-[var(--text-secondary)] hover:bg-[var(--card-border)]'}`}
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
                          onClick={() => setGlobalConfig({ ...globalConfig, vibe: type })}
                          className={`px-2 py-2 rounded-lg text-[10px] font-medium capitalize border transition-all ${globalConfig.vibe === type 
                            ? 'bg-fuchsia-600/20 border-fuchsia-600 text-fuchsia-400' 
                            : 'bg-[var(--input-bg)] border-transparent text-[var(--text-secondary)] hover:bg-[var(--card-border)]'}`}
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
                          onClick={() => setGlobalConfig({ ...globalConfig, typography: type })}
                          className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium capitalize border transition-all ${globalConfig.typography === type 
                            ? 'bg-fuchsia-600/20 border-fuchsia-600 text-fuchsia-400' 
                            : 'bg-[var(--input-bg)] border-transparent text-[var(--text-secondary)] hover:bg-[var(--card-border)]'}`}
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
                      value={globalConfig.slogan}
                      onChange={(e) => setGlobalConfig({ ...globalConfig, slogan: e.target.value })}
                      placeholder="e.g. Summer of Escapism"
                      className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-fuchsia-500 transition-colors"
                     />
                  </div>

                </motion.div>
              )}
            </AnimatePresence>
        </div>
      )}

      {/* Collection Upload */}
       <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6 relative group hover:border-fuchsia-500/50 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <Upload className="w-5 h-5 text-fuchsia-400" />
                Collection
              </h3>
            </div>

            <div className="relative">
              <div className="grid grid-cols-2 gap-4 mb-4">
                  <label className="rounded-xl border-2 border-dashed border-[var(--card-border)] hover:border-[var(--text-secondary)] bg-[var(--input-bg)] flex flex-col items-center justify-center cursor-pointer transition-all group py-8">
                    <div className="w-12 h-12 rounded-full bg-[var(--card-bg)] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6 text-[var(--text-secondary)]" />
                    </div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">Upload File</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">Images</p>
                    <input type="file" multiple accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>

                  <div 
                      className="rounded-xl border-2 border-dashed border-[var(--card-border)] hover:border-fuchsia-500/50 bg-[var(--input-bg)] flex flex-col items-center justify-center cursor-pointer transition-all group py-8"
                      onClick={() => setShowCatalog(true)}
                    >
                      <div className="w-12 h-12 rounded-full bg-[var(--card-bg)] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <ShoppingBag className="w-6 h-6 text-fuchsia-400" />
                      </div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">Browse Catalog</p>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">{catalog?.length || 0} items</p>
                    </div>
              </div>

              {products.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mb-4 max-h-40 overflow-y-auto">
                  {products.map((p) => (
                    <div key={p.id} className="aspect-square rounded-lg overflow-hidden relative group border border-[var(--card-border)]">
                      <img src={p.url} alt="Product" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Button */}
            {viewMode === 'selection' ? (
              <button
                onClick={draftStoryboard}
                disabled={products.length === 0 || isDrafting}
                className="w-full py-3 bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-fuchsia-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDrafting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                Draft Storyboard
              </button>
            ) : (
               <button
                onClick={() => setViewMode('selection')}
                className="w-full py-3 bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-primary)] rounded-xl font-medium hover:bg-[var(--input-bg)] transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Selection
              </button>
            )}
            
            {(isDrafting || isRendering) && (
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
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-4">Automated Lookbook Generator</h2>
        <p className="text-[var(--text-secondary)]">Turn raw product shots into a cohesive, themed seasonal campaign.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {renderSidebar()}

        {/* Main Content Area */}
        <div className="lg:col-span-8">
           <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-2 min-h-[800px] flex flex-col">
             
             {/* Header */}
             <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--card-border)]">
               <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                 {viewMode === 'selection' ? (
                   <><BookOpen className="w-4 h-4" /> Lookbook Preview</>
                 ) : (
                   <><Grid className="w-4 h-4" /> Storyboard Editor</>
                 )}
               </div>
               {viewMode === 'storyboard' && (
                 <div className="flex gap-2">
                    <button
                      onClick={renderStoryboard}
                      disabled={isRendering}
                      className="text-xs px-3 py-1.5 bg-fuchsia-600 text-white rounded-lg font-medium hover:bg-fuchsia-500 disabled:opacity-50"
                    >
                      {isRendering ? 'Rendering...' : 'Render All Pages'}
                    </button>
                    <button 
                      onClick={handleExportPDF}
                      className="text-xs flex items-center gap-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    >
                      <Download className="w-3 h-3" /> PDF
                    </button>
                 </div>
               )}
             </div>

             {/* Content */}
             <div className="flex-1 bg-[var(--bg-primary)] rounded-xl m-2 overflow-y-auto p-8 custom-scrollbar relative">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none" />
                
                {viewMode === 'selection' && (
                  <div className="h-full flex flex-col items-center justify-center text-[var(--text-secondary)] relative z-10">
                    <div className="w-20 h-20 bg-[var(--card-bg)] rounded-full flex items-center justify-center mb-4">
                      <FileText className="w-10 h-10 opacity-20" />
                    </div>
                    <p>Select products and click "Draft Storyboard"</p>
                  </div>
                )}

                {viewMode === 'storyboard' && (
                  <div className="grid grid-cols-1 gap-8 relative z-10">
                    {storyboard.map((page, index) => (
                      <div key={page.id} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl overflow-hidden shadow-sm">
                        
                        {/* Status Header */}
                        <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--card-border)] bg-[var(--input-bg)]">
                           <span className="text-xs font-bold text-[var(--text-secondary)]">Page {index + 1}</span>
                           <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${page.status === 'completed' ? 'bg-green-500/20 text-green-400' : page.status === 'draft' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'}`}>
                             {page.status}
                           </span>
                        </div>

                        <div className="grid md:grid-cols-2 gap-0">
                           {/* Config Side */}
                           <div className="p-4 border-r border-[var(--card-border)] space-y-3">
                              {/* Thumbnails */}
                              <div className="flex gap-2 overflow-x-auto pb-2">
                                {products.filter(p => page.productIds.includes(p.id)).map(p => (
                                  <img key={p.id} src={p.url} className="w-10 h-10 rounded-md object-cover border border-[var(--card-border)]" />
                                ))}
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[10px] text-[var(--text-secondary)] uppercase">Layout</label>
                                  <select 
                                    value={page.config.layout}
                                    onChange={(e) => {
                                      const newBoard = [...storyboard];
                                      newBoard[index].config.layout = e.target.value as LayoutType;
                                      setStoryboard(newBoard);
                                    }}
                                    className="w-full text-xs bg-[var(--input-bg)] text-[var(--text-primary)] rounded p-1 border border-[var(--card-border)]"
                                  >
                                    <option value="grid">Grid</option>
                                    <option value="editorial">Editorial</option>
                                    <option value="hero">Hero</option>
                                    <option value="collage">Collage</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="text-[10px] text-[var(--text-secondary)] uppercase">Vibe</label>
                                  <select 
                                    value={page.config.vibe}
                                    onChange={(e) => {
                                      const newBoard = [...storyboard];
                                      newBoard[index].config.vibe = e.target.value as VibeType;
                                      setStoryboard(newBoard);
                                    }}
                                    className="w-full text-xs bg-[var(--input-bg)] text-[var(--text-primary)] rounded p-1 border border-[var(--card-border)]"
                                  >
                                    <option value="studio">Studio</option>
                                    <option value="golden_hour">Golden Hour</option>
                                    <option value="moody">Moody</option>
                                  </select>
                                </div>
                              </div>

                              <div>
                                <label className="text-[10px] text-[var(--text-secondary)] uppercase">Caption</label>
                                <input 
                                  type="text"
                                  value={page.config.caption}
                                  onChange={(e) => {
                                      const newBoard = [...storyboard];
                                      newBoard[index].config.caption = e.target.value;
                                      setStoryboard(newBoard);
                                  }}
                                  className="w-full text-xs bg-[var(--input-bg)] text-[var(--text-primary)] rounded p-1 border border-[var(--card-border)]"
                                />
                              </div>
                           </div>

                           {/* Result Side */}
                           <div className="aspect-[3/4] bg-white relative flex items-center justify-center">
                              {page.resultUrl ? (
                                <img src={page.resultUrl} className="w-full h-full object-cover" />
                              ) : (
                                <div className="text-center p-4">
                                  <ImageIcon className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                                  <p className="text-xs text-neutral-400">Waiting to render...</p>
                                </div>
                              )}
                           </div>
                        </div>

                      </div>
                    ))}
                  </div>
                )}
             </div>
           </div>
        </div>

        {/* Catalog Modal (Same as before) */}
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
                          {selectedCatalogItems.length === catalog.length ? 'Deselect All' : 'Select All'}
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

      </div>
    </div>
  );
};
