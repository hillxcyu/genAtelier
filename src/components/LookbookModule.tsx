/**
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Upload, Sparkles, Layout, Download, Loader2, Image as ImageIcon, X, FileText, ShoppingBag, CheckCircle, Plus, ArrowLeft, Grid, Edit3, ChevronDown, Trash2, PackageOpen } from 'lucide-react';
import { jsPDF } from "jspdf";
import { ai } from '../utils/genai';
import { BrandVibe, CatalogItem } from '../types';
import { getContrastText } from '../utils/color';

// --- Types ---

type LayoutType = 'grid' | 'editorial' | 'hero' | 'collage';
type ColorStrategy = 'monochromatic' | 'contrast' | 'minimalist';
type LightingType = 'studio' | 'golden_hour' | 'moody' | 'natural';
type MoodType = 'minimalist' | 'luxury' | 'streetwear' | 'bohemian' | 'romantic';
type TypographyType = 'minimal' | 'bold';
type CuratorialStrategy = 'by_color' | 'by_occasion' | 'by_category' | 'by_outfit' | 'eclectic';

interface LookbookConfig {
  layout: LayoutType;
  colorStrategy: ColorStrategy;
  lighting: LightingType;
  mood: MoodType;
  theme: string;
  typography: TypographyType;
}

interface PageConfig {
  layout: LayoutType;
  lighting: LightingType;
  mood: MoodType;
  caption: string;
  showCaption: boolean;
  slogan: string;      // Per-page catchy headline
  showSlogan: boolean; // Toggle for slogan
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
    lighting: 'studio',
    mood: 'luxury',
    theme: '',
    typography: 'bold'
  });
  const [curatorialStrategy, setCuratorialStrategy] = useState<CuratorialStrategy>('eclectic');
  const [showDirectorsControls, setShowDirectorsControls] = useState(true);

  // Storyboard Mode State
  const [storyboard, setStoryboard] = useState<StoryboardPage[]>([]);
  const [isDrafting, setIsDrafting] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [progress, setProgress] = useState<string>('');
  
  // "Click-to-Move" State
  const [movingItem, setMovingItem] = useState<{ pageId: string, productId: string } | null>(null);

  // --- Derived State ---
  const allAssignedProductIds = new Set(storyboard.flatMap(p => p.productIds));
  const unassignedProducts = products.filter(p => !allAssignedProductIds.has(p.id));

  const isSidebarVisible = viewMode === 'selection' || (viewMode === 'storyboard' && unassignedProducts.length > 0);

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

  // --- Handlers: Storyboard Editing (Click-to-Move) ---

  const handleRemovePage = (pageId: string) => {
    setStoryboard(prev => prev.filter(p => p.id !== pageId));
  };

  const handleRemoveItem = (pageId: string, productId: string) => {
    setStoryboard(prev => prev.map(p => {
      if (p.id === pageId) {
        return { ...p, productIds: p.productIds.filter(id => id !== productId) };
      }
      return p;
    }));
  };

  const handleMoveStart = (pageId: string, productId: string) => {
    setMovingItem({ pageId, productId });
  };

  const handleMoveComplete = (targetPageId: string) => {
    if (!movingItem) return;
    
    setStoryboard(prev => {
        const newBoard = [...prev];

        // If moving from 'unassigned' dock, no source page modification needed
        if (movingItem.pageId !== 'unassigned') {
            const sourcePage = newBoard.find(p => p.id === movingItem.pageId);
            if (sourcePage) {
                sourcePage.productIds = sourcePage.productIds.filter(id => id !== movingItem.productId);
            }
        }

        // Add to target
        const targetPage = newBoard.find(p => p.id === targetPageId);
        if (targetPage) {
            if (!targetPage.productIds.includes(movingItem.productId)) {
               targetPage.productIds.push(movingItem.productId);
            }
        }
        return newBoard;
    });
    setMovingItem(null);
  };

  const cancelMove = () => setMovingItem(null);

  const handleAddPage = () => {
    setStoryboard(prev => [
      ...prev,
      {
        id: Math.random().toString(36).substr(2, 9),
        productIds: [],
        config: {
          layout: globalConfig.layout,
          lighting: globalConfig.lighting,
          mood: globalConfig.mood,
          caption: '',
          showCaption: true,
          slogan: '',
          showSlogan: true,
        },
        status: 'draft',
      },
    ]);
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
        Campaign Theme: ${globalConfig.theme || 'None specified.'}
        
        Task:
        Group these items into pages (1-3 items per page). 
        For each page, suggest:
        1. Layout (grid/editorial/hero/collage)
        2. Lighting style (studio/golden_hour/moody/natural)
        3. Mood (minimalist/luxury/streetwear/bohemian/romantic)
        4. A catchy Slogan (headline) based on the Campaign Theme.
        5. A short descriptive Caption for the products.
        
        Return strictly a JSON object with this structure:
        {
          "pages": [
            {
              "productIds": ["id1", "id2"],
              "layout": "editorial",
              "lighting": "studio",
              "mood": "luxury",
              "slogan": "Chasing Sunsets",
              "caption": "Silk Evening Dress"
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
          lighting: p.lighting || globalConfig.lighting,
          mood: p.mood || globalConfig.mood,
          caption: p.caption || '',
          showCaption: true,
          slogan: p.slogan || '',
          showSlogan: true
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

      const lightingDirective = {
        studio: "Lighting: High-key, bright professional studio lighting. Minimal shadows.",
        golden_hour: "Lighting: Warm, natural 'Golden Hour' sunlight. Soft shadows, warm tones.",
        moody: "Lighting: Low-key, dramatic, high contrast.",
        natural: "Lighting: Soft, diffused, natural daylight."
      }[page.config.lighting];

      const moodDirective = {
        minimalist: "Mood: Clean, understated, sophisticated, less is more.",
        luxury: "Mood: Expensive, polished, high-end, elegant.",
        streetwear: "Mood: Edgy, urban, cool, raw energy.",
        bohemian: "Mood: Free-spirited, artistic, textured, relaxed.",
        romantic: "Mood: Soft, dreamy, ethereal, nostalgic."
      }[page.config.mood];

      const colorDirective = {
        monochromatic: "Color Strategy: Monochromatic. Use various shades and tints of the brand's primary color only.",
        contrast: "Color Strategy: High Contrast. Use complementary colors from the palette to create bold visual impact.",
        minimalist: "Minimalist. White/Beige/Gray backgrounds."
      }[globalConfig.colorStrategy]; 

      const typoDirective = globalConfig.typography === 'bold' ? "Typography: Bold, large headlines. Magazine style." : "Typography: Minimal, small, sans-serif text only.";

      // Narrative Directives based on showSlogan / showCaption
      const themeGuideline = globalConfig.theme 
        ? `Campaign Theme Guideline: ${globalConfig.theme}. Use this to guide the visual narrative.` 
        : '';

      const sloganDirective = page.config.showSlogan
        ? `Headline Text: Include the slogan "${page.config.slogan}" as a prominent design element.`
        : 'Do not include a headline slogan.';

      const captionDirective = page.config.showCaption
        ? `Caption Text: Include the product description "${page.config.caption}" in small, elegant type.`
        : 'Do not include the product description text.';

      const prompt = `
        Create a high-fashion lookbook page.
        Brand: ${brandVibe?.name || 'Generic'}. Mood: ${brandVibe?.mood || 'Stylish'}.
        
        CONFIG:
        Layout: ${layoutDirective}
        Lighting: ${lightingDirective}
        Mood: ${moodDirective}
        Color: ${colorDirective}
        Typography: ${typoDirective}
        Narrative Context: ${themeGuideline}
        ${sloganDirective}
        ${captionDirective}
        
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
    
    // Process pages that are not yet completed
    const pagesToRender = storyboard.filter(p => p.status !== 'completed');
    if (pagesToRender.length === 0) {
        setIsRendering(false);
        return;
    }
    
    let completedCount = 0;
    setProgress(`Starting render of ${pagesToRender.length} pages...`);

    const updatePageStatus = (pageId: string, status: 'rendering' | 'completed' | 'failed', resultUrl?: string) => {
        setStoryboard(prev => prev.map(p => 
            p.id === pageId ? { ...p, status, resultUrl } : p
        ));
    };

    setStoryboard(prev => prev.map(p => 
        pagesToRender.find(target => target.id === p.id) ? { ...p, status: 'rendering' } : p
    ));

    await Promise.all(pagesToRender.map(async (page) => {
      const url = await renderPage(page);
      completedCount++;
      setProgress(`Rendering... (${completedCount}/${pagesToRender.length})`);
      if (url) updatePageStatus(page.id, 'completed', url);
      else updatePageStatus(page.id, 'failed');
    }));

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
      
      {/* Directors Controls - Show only in selection mode */}
      {viewMode === 'selection' && (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6 relative">
            <button 
                onClick={() => setShowDirectorsControls(!showDirectorsControls)}
                className="w-full flex items-center justify-between mb-4 text-left"
              >
                <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  <Layout className="w-5 h-5 text-fuchsia-400" />
                  Creative Director
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
                      <p className="text-[10px] text-[var(--text-tertiary)] mt-1.5 ml-1">
                        {{
                          by_color: "Group items into monochromatic color stories.",
                          by_occasion: "Organize products by intended use (e.g., casual, formal, active).",
                          by_category: "Standard merchandising (Tops, Bottoms).",
                          by_outfit: "Create complete, wearable looks per page.",
                          eclectic: "High-fashion mix for maximum visual impact."
                        }[curatorialStrategy]}
                      </p>
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
                      <p className="text-[10px] text-[var(--text-tertiary)] mt-1.5 ml-1">
                        {{
                          grid: "Symmetrical, product-focused layout.",
                          editorial: "Asymmetrical, artistic layout with overlap.",
                          hero: "One large hero image with smaller details.",
                          collage: "Mixed-media, layered scrapbook style."
                        }[globalConfig.layout]}
                      </p>
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
                      <p className="text-[10px] text-[var(--text-tertiary)] mt-1.5 ml-1">
                        {{
                          monochromatic: "Shades of a single brand color.",
                          contrast: "High-impact complementary colors.",
                          minimalist: "Clean white/neutral background."
                        }[globalConfig.colorStrategy]}
                      </p>
                    </div>

                     {/* Lighting Selector */}
                    <div>
                      <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">Lighting</label>
                       <div className="grid grid-cols-2 gap-2">
                        {(['studio', 'golden_hour', 'moody', 'natural'] as const).map(type => (
                          <button
                            key={type}
                            onClick={() => setGlobalConfig({ ...globalConfig, lighting: type })}
                            className={`px-2 py-2 rounded-lg text-[10px] font-medium capitalize border transition-all ${globalConfig.lighting === type 
                              ? 'bg-fuchsia-600/20 border-fuchsia-600 text-fuchsia-400' 
                              : 'bg-[var(--input-bg)] border-transparent text-[var(--text-secondary)] hover:bg-[var(--card-border)]'}`}
                          >
                            {type.replace('_', ' ')}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-[var(--text-tertiary)] mt-1.5 ml-1">
                        {{
                          studio: "Bright, high-key professional lighting.",
                          golden_hour: "Warm, natural sunlight and soft shadows.",
                          moody: "Dark, dramatic, high-contrast lighting.",
                          natural: "Soft, diffused, natural daylight."
                        }[globalConfig.lighting]}
                      </p>
                    </div>

                     {/* Mood Selector */}
                    <div>
                      <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">Mood</label>
                       <div className="grid grid-cols-2 gap-2">
                        {(['minimalist', 'luxury', 'streetwear', 'bohemian', 'romantic'] as const).map(type => (
                          <button
                            key={type}
                            onClick={() => setGlobalConfig({ ...globalConfig, mood: type })}
                            className={`px-2 py-2 rounded-lg text-[10px] font-medium capitalize border transition-all ${globalConfig.mood === type 
                              ? 'bg-fuchsia-600/20 border-fuchsia-600 text-fuchsia-400' 
                              : 'bg-[var(--input-bg)] border-transparent text-[var(--text-secondary)] hover:bg-[var(--card-border)]'}`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-[var(--text-tertiary)] mt-1.5 ml-1">
                        {{
                          minimalist: "Clean, understated, sophisticated.",
                          luxury: "Expensive, polished, high-end.",
                          streetwear: "Edgy, urban, cool, raw energy.",
                          bohemian: "Free-spirited, artistic, textured.",
                          romantic: "Soft, dreamy, ethereal, nostalgic."
                        }[globalConfig.mood]}
                      </p>
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
                      <p className="text-[10px] text-[var(--text-tertiary)] mt-1.5 ml-1">
                        {{
                          minimal: "Clean, small sans-serif text.",
                          bold: "Large, magazine-style headlines."
                        }[globalConfig.typography]}
                      </p>
                    </div>

                    {/* Campaign Theme Input */}
                    <div>
                       <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">Campaign Theme</label>
                       <input 
                        type="text" 
                        value={globalConfig.theme}
                        onChange={(e) => setGlobalConfig({ ...globalConfig, theme: e.target.value })}
                        placeholder="e.g. Summer of Escapism"
                        className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-fuchsia-500 transition-colors"
                       />
                    </div>

                  </motion.div>
                )}
              </AnimatePresence>
        </div>
      )}

      {/* Collection Upload - Show only in selection mode */}
      {viewMode === 'selection' && (
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
      )}

      {/* Unassigned Items Dock - Show only in storyboard mode */}
      {viewMode === 'storyboard' && unassignedProducts.length > 0 && (
         <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6 relative">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <PackageOpen className="w-5 h-5 text-yellow-400" />
              Unassigned Items
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mb-4">
              These items are not on any page. Click to move them to a storyboard page.
            </p>
            
            <div className="grid grid-cols-3 gap-3">
              {unassignedProducts.map(p => (
                <div 
                  key={p.id} 
                  onClick={() => handleMoveStart('unassigned', p.id)}
                  className={`aspect-square rounded-lg overflow-hidden relative group border cursor-pointer transition-all ${ 
                    movingItem?.productId === p.id 
                    ? 'border-fuchsia-500 ring-2 ring-fuchsia-500/50' 
                    : 'border-[var(--card-border)] hover:border-fuchsia-400'
                  }`}
                >
                  <img src={p.url} className="w-full h-full object-cover" />
                  
                  {/* Overlay for selection indication */}
                  {movingItem?.productId === p.id && (
                    <div className="absolute inset-0 bg-fuchsia-500/20 flex items-center justify-center">
                       <CheckCircle className="w-6 h-6 text-white drop-shadow-md" />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-xs text-white font-medium flex items-center gap-1">
                      <ArrowLeft className="w-3 h-3" /> Move
                    </span>
                  </div>
                </div>
              ))}
            </div>
         </div>
      )}

          {/* Instructions - Show only in selection mode */}
          {viewMode === 'selection' && (
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
          )}
        </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-4">Automated Lookbook Generator</h2>
        <p className="text-[var(--text-secondary)]">Turn raw product shots into a cohesive, themed seasonal campaign.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {isSidebarVisible && renderSidebar()}

        {/* Main Content Area */}
        <div className={isSidebarVisible ? "lg:col-span-8" : "lg:col-span-12"}>
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
                 <div className="flex gap-2 relative">
                    <button
                      onClick={handleAddPage}
                      className="text-xs px-3 py-1.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-500 disabled:opacity-50 inline-flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> New Page
                    </button>
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
                      <div 
                        key={page.id} 
                        className={`bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl overflow-hidden shadow-sm transition-colors relative ${movingItem && movingItem.pageId !== page.id ? 'border-dashed border-fuchsia-500/50 bg-fuchsia-500/5' : ''}`}
                        onClick={() => movingItem && movingItem.pageId !== page.id && handleMoveComplete(page.id)}
                      >
                        {movingItem && movingItem.pageId !== page.id && (
                            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-[1px]">
                                <div className="bg-fuchsia-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2">
                                    <ArrowLeft className="w-4 h-4" /> Move Here
                                </div>
                            </div>
                        )}
                        
                        {/* Status Header */}
                        <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--card-border)] bg-[var(--input-bg)]">
                           <div className="flex items-center gap-3">
                             <span className="text-xs font-bold text-[var(--text-secondary)]">Page {index + 1}</span>
                             <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${page.status === 'completed' ? 'bg-green-500/20 text-green-400' : page.status === 'draft' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'}`}>
                               {page.status}
                             </span>
                           </div>
                           <button 
                             onClick={(e) => { e.stopPropagation(); handleRemovePage(page.id); }}
                             className="text-[var(--text-secondary)] hover:text-red-400 p-1"
                             title="Remove Page"
                           >
                             <Trash2 className="w-4 h-4" />
                           </button>
                        </div>

                        <div className="grid md:grid-cols-2 gap-0">
                           {/* Config Side */}
                           <div className="p-4 border-r border-[var(--card-border)] space-y-3">
                              {/* Thumbnails */}
                              <div className="flex gap-2 overflow-x-auto pb-2 min-h-[50px]">
                                {products.filter(p => page.productIds.includes(p.id)).map(p => (
                                  <div 
                                    key={p.id} 
                                    className={`relative group flex-shrink-0 cursor-pointer transition-all ${movingItem?.productId === p.id ? 'ring-2 ring-fuchsia-500 scale-105' : ''}`}
                                    onClick={(e) => { e.stopPropagation(); handleMoveStart(page.id, p.id); }}
                                  >
                                    <img src={p.url} className="w-10 h-10 rounded-md object-cover border border-[var(--card-border)]" />
                                    
                                    {!movingItem && (
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 rounded-md">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleMoveStart(page.id, p.id); }}
                                                className="text-white hover:text-fuchsia-400 p-1"
                                                title="Move Item"
                                            >
                                                <ArrowLeft className="w-3 h-3" />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleRemoveItem(page.id, p.id); }}
                                                className="text-white hover:text-red-400 p-1"
                                                title="Remove Item"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    )}
                                  </div>
                                ))}
                                {page.productIds.length === 0 && (
                                  <div className="text-[10px] text-[var(--text-tertiary)] italic flex items-center">
                                    Empty Page
                                  </div>
                                )}
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
                                  <label className="text-[10px] text-[var(--text-secondary)] uppercase">Lighting</label>
                                  <select 
                                    value={page.config.lighting}
                                    onChange={(e) => {
                                      const newBoard = [...storyboard];
                                      newBoard[index].config.lighting = e.target.value as LightingType;
                                      setStoryboard(newBoard);
                                    }}
                                    className="w-full text-xs bg-[var(--input-bg)] text-[var(--text-primary)] rounded p-1 border border-[var(--card-border)]"
                                  >
                                    <option value="studio">Studio</option>
                                    <option value="golden_hour">Golden Hour</option>
                                    <option value="moody">Moody</option>
                                    <option value="natural">Natural</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="text-[10px] text-[var(--text-secondary)] uppercase">Mood</label>
                                  <select 
                                    value={page.config.mood}
                                    onChange={(e) => {
                                      const newBoard = [...storyboard];
                                      newBoard[index].config.mood = e.target.value as MoodType;
                                      setStoryboard(newBoard);
                                    }}
                                    className="w-full text-xs bg-[var(--input-bg)] text-[var(--text-primary)] rounded p-1 border border-[var(--card-border)]"
                                  >
                                    <option value="minimalist">Minimalist</option>
                                    <option value="luxury">Luxury</option>
                                    <option value="streetwear">Streetwear</option>
                                    <option value="bohemian">Bohemian</option>
                                    <option value="romantic">Romantic</option>
                                  </select>
                                </div>
                              </div>

                              <div className="space-y-3 pt-2 border-t border-[var(--card-border)]">
                                {/* Slogan Toggle & Input */}
                                <div>
                                    <label className="text-[10px] text-[var(--text-secondary)] uppercase flex items-center gap-2 mb-1 cursor-pointer">
                                    <input 
                                        type="checkbox"
                                        checked={page.config.showSlogan}
                                        onChange={(e) => {
                                            const newBoard = [...storyboard];
                                            newBoard[index].config.showSlogan = e.target.checked;
                                            setStoryboard(newBoard);
                                        }}
                                        className="rounded border-[var(--card-border)] bg-[var(--input-bg)] text-fuchsia-600 focus:ring-fuchsia-500"
                                    />
                                    Show Slogan
                                    </label>
                                    {page.config.showSlogan && (
                                        <input 
                                        type="text"
                                        value={page.config.slogan}
                                        onChange={(e) => {
                                            const newBoard = [...storyboard];
                                            newBoard[index].config.slogan = e.target.value;
                                            setStoryboard(newBoard);
                                        }}
                                        placeholder="Page Slogan"
                                        className="w-full text-xs bg-[var(--input-bg)] text-[var(--text-primary)] rounded p-1 border border-[var(--card-border)] placeholder:text-[var(--text-tertiary)] font-bold"
                                        />
                                    )}
                                </div>

                                {/* Caption Toggle & Input */}
                                <div>
                                    <label className="text-[10px] text-[var(--text-secondary)] uppercase flex items-center gap-2 mb-1 cursor-pointer">
                                    <input 
                                        type="checkbox"
                                        checked={page.config.showCaption}
                                        onChange={(e) => {
                                            const newBoard = [...storyboard];
                                            newBoard[index].config.showCaption = e.target.checked;
                                            setStoryboard(newBoard);
                                        }}
                                        className="rounded border-[var(--card-border)] bg-[var(--input-bg)] text-fuchsia-600 focus:ring-fuchsia-500"
                                    />
                                    Show Caption
                                    </label>
                                    {page.config.showCaption && (
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
                                    )}
                                </div>
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

                    {/* Add New Page Button */}
                    <div className="p-4 text-center">
                        <button 
                            onClick={handleAddPage}
                            className="inline-flex items-center px-4 py-2 border border-dashed border-[var(--card-border)] text-sm font-medium rounded-md text-[var(--text-secondary)] hover:bg-[var(--input-bg)] hover:border-fuchsia-500 transition-colors"
                        >
                            <Plus className="w-4 h-4 mr-2" /> Add New Page
                        </button>
                    </div>
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