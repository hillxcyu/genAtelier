import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, Sparkles, RefreshCw, Shirt, User, X, Camera, Settings2, ShoppingBag } from 'lucide-react';
import { ai } from '../utils/genai';
import { BrandVibe, CatalogItem } from '../types';
import { getContrastText } from '../utils/color';

interface ImageState {
  file: File | null;
  preview: string | null;
}

interface GenerationSettings {
  modelType: string;
  background: string;
  lighting: string;
}

interface ProductToModelModuleProps {
  brandVibe?: BrandVibe | null;
  catalog?: CatalogItem[] | null;
}

export const ProductToModelModule: React.FC<ProductToModelModuleProps> = ({ brandVibe, catalog }) => {
  const [productImage, setProductImage] = useState<ImageState>({ file: null, preview: null });
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCatalog, setShowCatalog] = useState(false);
  
  const [settings, setSettings] = useState<GenerationSettings>({
    modelType: 'European Female',
    background: 'Studio Minimal',
    lighting: 'Soft Daylight'
  });

  const productInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductImage({ file, preview: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCatalogSelect = async (item: CatalogItem) => {
    try {
      setShowCatalog(false);
      // Convert URL to base64 via proxy
      const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(item.imageUrl)}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) {
        throw new Error(`Failed to proxy image: ${response.statusText}`);
      }
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductImage({ 
          file: new File([blob], item.name, { type: blob.type }), 
          preview: reader.result as string 
        });
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error("Error loading catalog item:", err);
      setError("Failed to load catalog item image via proxy.");
    }
  };

  const clearImage = () => {
    setProductImage({ file: null, preview: null });
    if (productInputRef.current) productInputRef.current.value = '';
    setGeneratedImage(null);
  };

  const generateLifestyleShot = async () => {
    if (!productImage.preview) return;

    // Check for API Key selection for high-quality models
    if (window.aistudio?.hasSelectedApiKey) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await window.aistudio.openSelectKey();
        const hasKeyAfter = await window.aistudio.hasSelectedApiKey();
        if (!hasKeyAfter) return;
      }
    }

    setIsGenerating(true);
    setError(null);

    try {
      const productBase64 = productImage.preview.split(',')[1];

      const prompt = `
        Generate a high-end fashion lifestyle photograph.
        Subject: A ${settings.modelType} model wearing the EXACT clothing item provided in the input image.
        Clothing: The clothing from the input image must be preserved in detail, texture, and color. It should fit the model naturally.
        Background: ${settings.background}.
        Lighting: ${settings.lighting}.
        Style: Professional editorial fashion photography, 4k, highly detailed.
      `;

      const generateWithRetry = async (retries = 3, delay = 2000): Promise<any> => {
        try {
          return await ai.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: {
              role: 'user',
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: 'image/jpeg',
                    data: productBase64
                  }
                }
              ]
            },
            config: {
              imageConfig: {
                aspectRatio: "3:4",
                imageSize: "1K"
              }
            }
          });
        } catch (err: any) {
          if (retries > 0 && (err.status === 503 || err.message?.includes('503') || err.message?.includes('overloaded'))) {
            console.log(`Model overloaded, retrying in ${delay}ms... (${retries} retries left)`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return generateWithRetry(retries - 1, delay * 2);
          }
          throw err;
        }
      };

      const response = await generateWithRetry();

      let foundImage = false;
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const base64Data = part.inlineData.data;
            setGeneratedImage(`data:image/png;base64,${base64Data}`);
            foundImage = true;
            break;
          }
        }
      }

      if (!foundImage) {
        throw new Error("No image generated.");
      }

    } catch (err: any) {
      console.error("Generation Error:", err);
      if (err.message?.includes('403') || err.status === 403) {
        setError("Permission Denied: This feature requires a paid API key.");
      } else if (err.message?.includes('503') || err.status === 503) {
        setError("System Busy: The AI model is currently overloaded. Please try again in a moment.");
      } else {
        setError(err.message || "Failed to generate image.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = 'genfashion-lifestyle-shot.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-4">Product-to-Model Transformation</h2>
        <p className="text-[var(--text-secondary)]">Turn flat ghost mannequin shots into professional lifestyle photography.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Controls Area */}
        <div className="lg:col-span-4 space-y-6 relative">

          {/* Catalog Drawer */}
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
                  className="fixed left-0 top-0 bottom-0 w-full max-w-md bg-[var(--card-bg)] border-r border-[var(--card-border)] z-[70] p-6 shadow-2xl overflow-y-auto"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                      <ShoppingBag className="w-5 h-5 text-fuchsia-400" />
                      Select Product
                    </h3>
                    <button 
                      onClick={() => setShowCatalog(false)}
                      className="p-2 hover:bg-[var(--input-bg)] rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {catalog.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleCatalogSelect(item)}
                        className="group relative aspect-[3/4] rounded-xl overflow-hidden border border-[var(--card-border)] hover:border-fuchsia-500/50 transition-all text-left"
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

          {/* Upload */}
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6 relative group hover:border-fuchsia-500/50 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-[var(--text-primary)] font-medium">
                <Shirt className="w-5 h-5 text-fuchsia-400" />
                Product Source
              </div>
              {productImage.preview && (
                <button 
                  onClick={clearImage}
                  className="p-1 hover:bg-[var(--input-bg)] rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <div className="relative">
              {!productImage.preview ? (
                <div className="grid grid-cols-2 gap-4 h-[300px]">
                  {/* Upload Button */}
                  <div 
                    className="rounded-xl border-2 border-dashed border-[var(--card-border)] hover:border-[var(--text-secondary)] bg-[var(--input-bg)] flex flex-col items-center justify-center cursor-pointer transition-all group"
                    onClick={() => productInputRef.current?.click()}
                  >
                    <div className="w-12 h-12 rounded-full bg-[var(--card-bg)] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6 text-[var(--text-secondary)]" />
                    </div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">Upload File</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">Flat lay / Ghost</p>
                  </div>

                  {/* Catalog Button */}
                  {catalog && catalog.length > 0 ? (
                    <div 
                      className="rounded-xl border-2 border-dashed border-[var(--card-border)] hover:border-fuchsia-500/50 bg-[var(--input-bg)] flex flex-col items-center justify-center cursor-pointer transition-all group"
                      onClick={() => setShowCatalog(true)}
                    >
                      <div className="w-12 h-12 rounded-full bg-[var(--card-bg)] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <ShoppingBag className="w-6 h-6 text-fuchsia-400" />
                      </div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">Browse Catalog</p>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">{catalog.length} items available</p>
                    </div>
                  ) : (
                    <div className="rounded-xl border-2 border-dashed border-[var(--card-border)] bg-[var(--input-bg)]/50 flex flex-col items-center justify-center opacity-50">
                      <ShoppingBag className="w-6 h-6 text-[var(--text-secondary)] mb-2" />
                      <p className="text-sm text-[var(--text-secondary)]">Catalog Empty</p>
                    </div>
                  )}
              </div>
              ) : (
                <div className="aspect-[3/4] rounded-xl overflow-hidden bg-[var(--input-bg)] relative border border-[var(--card-border)]">
                  <img src={productImage.preview} alt="Product" className="w-full h-full object-cover" />
                </div>
              )}
              
              <input 
                type="file" 
                ref={productInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*"
              />
            </div>
          </div>

          {/* Settings */}
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2 mb-4">
              <Settings2 className="w-5 h-5 text-purple-400" />
              Configuration
            </h3>

            <div>
              <label className="block text-xs text-[var(--text-secondary)] font-medium uppercase tracking-wider mb-2">Model Type</label>
              <select 
                value={settings.modelType}
                onChange={(e) => setSettings({...settings, modelType: e.target.value})}
                className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-lg px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-fuchsia-500/50"
              >
                <option>European Female</option>
                <option>European Male</option>
                <option>Asian Female</option>
                <option>Asian Male</option>
                <option>African American Female</option>
                <option>African American Male</option>
                <option>Latina Female</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-[var(--text-secondary)] font-medium uppercase tracking-wider mb-2">Background</label>
              <select 
                value={settings.background}
                onChange={(e) => setSettings({...settings, background: e.target.value})}
                className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-lg px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-fuchsia-500/50"
              >
                <option>Studio Minimal</option>
                <option>Urban Street</option>
                <option>Nature / Park</option>
                <option>Luxury Interior</option>
                <option>Beach Sunset</option>
                <option>Cafe Setting</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-[var(--text-secondary)] font-medium uppercase tracking-wider mb-2">Lighting</label>
              <select 
                value={settings.lighting}
                onChange={(e) => setSettings({...settings, lighting: e.target.value})}
                className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-lg px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-fuchsia-500/50"
              >
                <option>Soft Daylight</option>
                <option>Studio High Contrast</option>
                <option>Warm Golden Hour</option>
                <option>Neon / Night</option>
              </select>
            </div>
          </div>

          <button
            onClick={generateLifestyleShot}
            disabled={!productImage.preview || isGenerating}
            className="w-full py-3 bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-fuchsia-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Camera className="w-5 h-5" />
                Generate Shot
              </>
            )}
          </button>
          
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
              {error}
            </div>
          )}
        </div>

        {/* Result Area */}
        <div className="lg:col-span-8">
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-2 h-full min-h-[600px] flex flex-col">
            <div className="flex-1 bg-[var(--bg-primary)] rounded-xl m-2 overflow-hidden relative flex items-center justify-center">
              {/* Background Noise */}
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none" />

              {generatedImage ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative w-full h-full flex items-center justify-center"
                >
                  <img src={generatedImage} alt="Generated Lifestyle" className="max-h-full max-w-full shadow-2xl" />
                  <div className="absolute bottom-6 right-6">
                    <button 
                      onClick={handleDownload}
                      className="px-6 py-3 bg-black/60 backdrop-blur-md text-white rounded-full font-medium hover:bg-black/80 transition-colors flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      Download Asset
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div className="text-center max-w-sm p-6">
                  <div className="w-20 h-20 bg-[var(--input-bg)] rounded-full flex items-center justify-center mx-auto mb-6">
                    <Camera className="w-10 h-10 text-[var(--text-secondary)] opacity-50" />
                  </div>
                  <h3 className="text-xl font-medium text-[var(--text-primary)] mb-2">No Image Generated Yet</h3>
                  <p className="text-[var(--text-secondary)]">
                    Upload a product image and select your model preferences to generate a professional lifestyle shot.
                  </p>
                </div>
              )}

              {isGenerating && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                  <div className="w-16 h-16 border-4 border-fuchsia-500/30 border-t-fuchsia-500 rounded-full animate-spin mb-4" />
                  <p className="text-fuchsia-400 font-medium animate-pulse">Synthesizing Lifestyle Shot...</p>
                  <p className="text-neutral-500 text-sm mt-2">Rendering model, lighting, and environment</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
