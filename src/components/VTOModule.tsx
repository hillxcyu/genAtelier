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

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, Sparkles, RefreshCw, Shirt, User, X, ShoppingBag, Loader2, CheckCircle } from 'lucide-react';
import { ai } from '../utils/genai';
import { BrandVibe, CatalogItem } from '../types';
import { getContrastText } from '../utils/color';

interface ImageState {
  file: File | null;
  preview: string | null;
}

interface VTOModuleProps {
  brandVibe?: BrandVibe | null;
  catalog?: CatalogItem[] | null;
}

export const VTOModule: React.FC<VTOModuleProps> = ({ brandVibe, catalog }) => {
  const [personImage, setPersonImage] = useState<ImageState>({ file: null, preview: null });
  const [garmentImage, setGarmentImage] = useState<ImageState>({ file: null, preview: null });
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<{ item: CatalogItem; reason: string }[] | null>(null);
  const [selectedSuggestions, setSelectedSuggestions] = useState<CatalogItem[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);

  const personInputRef = useRef<HTMLInputElement>(null);
  const garmentInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (garmentImage.preview) {
      // Clear previous suggestions when garment changes
      setSuggestions(null);
      setSelectedSuggestions([]);
      
      if (catalog && catalog.length > 0) {
        generateSuggestions();
      }
    } else {
      setSuggestions(null);
      setSelectedSuggestions([]);
    }
  }, [garmentImage.preview]);

  const generateSuggestions = async () => {
    if (!garmentImage.preview || !catalog || catalog.length === 0) return;
    setIsSuggesting(true);
    try {
      const garmentBase64 = garmentImage.preview.split(',')[1];
      const catalogList = catalog.map(c => ({ id: c.id, name: c.name, category: c.category }));
      
      const prompt = `
        You are a professional fashion stylist. Analyze the provided garment image. 
        From the following list of available catalog items, select 3 that would style best with this garment to create a complete look.
        
        CATALOG:
        ${JSON.stringify(catalogList)}
        
        Return strictly a JSON object with this structure: 
        { "suggestions": [{ "itemId": "string", "reason": "string" }] }
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: garmentBase64
              }
            }
          ]
        },
        config: { responseMimeType: 'application/json' }
      });

      const text = response.text?.replace(/```json\n?|```/g, '').trim() || '{}';
      const data = JSON.parse(text);

      if (data.suggestions) {
        const enrichedSuggestions = data.suggestions.map((s: any) => {
          const item = catalog.find(c => c.id === s.itemId);
          return item ? { item, reason: s.reason } : null;
        }).filter((s): s is { item: CatalogItem; reason: string } => s !== null);
        
        setSuggestions(enrichedSuggestions);
      }
    } catch (err) {
      console.error("Styling suggestion error:", err);
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
        }
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
        setGarmentImage({ 
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

  const clearImage = (type: 'person' | 'garment') => {
    if (type === 'person') {
      setPersonImage({ file: null, preview: null });
      if (personInputRef.current) personInputRef.current.value = '';
    } else {
      setGarmentImage({ file: null, preview: null });
      if (garmentInputRef.current) garmentInputRef.current.value = '';
    }
    setGeneratedImage(null);
  };

  const generateVTO = async () => {
    if (!personImage.preview || !garmentImage.preview) return;

    // Check for API Key selection for high-quality models
    if (window.aistudio?.hasSelectedApiKey) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await window.aistudio.openSelectKey();
        // Check again after selection
        const hasKeyAfter = await window.aistudio.hasSelectedApiKey();
        if (!hasKeyAfter) return;
      }
    }

    // Re-initialize AI with the potentially new key.
    // The instructions state that for paid key selection, the key is in process.env.API_KEY.
    // We try that first, then fallback to the standard GEMINI_API_KEY.
    
    setIsGenerating(true);
    setError(null);

    try {
      // Convert base64 to clean strings for the API
      const personBase64 = personImage.preview.split(',')[1];
      const garmentBase64 = garmentImage.preview.split(',')[1];

      const parts: any[] = [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: personBase64
          }
        },
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: garmentBase64
          }
        }
      ];

      let prompt = "Generate a high-quality, photorealistic image of the person from the first image wearing the garment from the second image. Maintain the person's pose, body shape, and skin tone exactly. Fit the garment naturally onto the person, respecting fabric drape and lighting. The output should be a fashion photography style shot.";

      if (selectedSuggestions.length > 0) {
        try {
          const suggestionParts = await Promise.all(selectedSuggestions.map(async (item) => {
            const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(item.imageUrl)}`;
            const response = await fetch(proxyUrl);
            const blob = await response.blob();
            const base64 = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });
            return {
              inlineData: {
                mimeType: blob.type || 'image/jpeg',
                data: base64.split(',')[1]
              }
            };
          }));
          
          parts.push(...suggestionParts);

          prompt = `Generate a high-quality, photorealistic image of the person from the first image wearing the garment from the second image AND the ${selectedSuggestions.length} additional accessory/item(s) provided in the subsequent images. 
          Maintain the person's pose, body shape, and skin tone exactly. 
          Fit all garments and accessories naturally onto the person, respecting fabric drape, layering, and lighting. 
          The output should be a cohesive fashion photography style shot showing the complete look.`;
        } catch (e) {
          console.error("Failed to load suggestion images", e);
        }
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
          role: 'user',
          parts: [
            { text: prompt },
            ...parts
          ]
        },
        config: {
          imageConfig: {
            aspectRatio: "3:4", // Portrait for fashion
            imageSize: "1K"
          }
        }
      });

      // Extract image from response
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
        throw new Error("No image generated. The model might have refused the request.");
      }

    } catch (err: any) {
      console.error("VTO Generation Error:", err);
      if (err.message?.includes('403') || err.status === 403) {
        setError("Permission Denied: This feature requires a paid API key with access to the 'gemini-3-pro-image-preview' model. Please ensure you have selected a valid key.");
      } else {
        setError(err.message || "Failed to generate image. Please try again.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = 'genfashion-vto-look.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    if (!generatedImage) return;
    try {
      const blob = await (await fetch(generatedImage)).blob();
      const file = new File([blob], 'vto-look.png', { type: 'image/png' });
      
      if (navigator.share) {
        await navigator.share({
          title: 'My Virtual Try-On Look',
          text: 'Check out my new look generated with GenFashion Atelier!',
          files: [file]
        });
      } else {
        // Fallback to clipboard
        await navigator.clipboard.write([
          new ClipboardItem({
            [blob.type]: blob
          })
        ]);
        alert('Image copied to clipboard!');
      }
    } catch (err) {
      console.error('Share failed:', err);
      alert('Could not share automatically. You can download the image instead.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-4">Virtual Fitting Room</h2>
        <p className="text-[var(--text-secondary)]">Upload a photo of yourself and a garment to see the magic happen.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Input Area */}
        <div className="lg:col-span-5 space-y-6 relative">
          
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
                      Select Garment
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

          {/* Person Upload */}
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6 relative group hover:border-fuchsia-500/50 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-[var(--text-primary)] font-medium">
                <User className="w-5 h-5 text-fuchsia-400" />
                Your Photo
              </div>
              {personImage.preview && (
                <button 
                  onClick={() => clearImage('person')}
                  className="p-1 hover:bg-[var(--card-bg)] rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <div 
              className={`aspect-[3/4] rounded-xl overflow-hidden bg-[var(--input-bg)] flex items-center justify-center border-2 border-dashed ${personImage.preview ? 'border-transparent' : 'border-[var(--card-border)] group-hover:border-[var(--text-secondary)]'} transition-all relative`}
              onClick={() => !personImage.preview && personInputRef.current?.click()}
            >
              {personImage.preview ? (
                <img src={personImage.preview} alt="Person" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-6 cursor-pointer">
                  <div className="w-12 h-12 rounded-full bg-[var(--card-bg)] flex items-center justify-center mx-auto mb-3">
                    <Upload className="w-6 h-6 text-[var(--text-secondary)]" />
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]">Click to upload or drag & drop</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">Recommended: Full body shot</p>
                </div>
              )}
              <input 
                type="file" 
                ref={personInputRef} 
                onChange={(e) => handleFileChange(e, 'person')} 
                className="hidden" 
                accept="image/*"
              />
            </div>
          </div>

          {/* Garment Upload */}
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6 relative group hover:border-purple-500/50 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-[var(--text-primary)] font-medium">
                <Shirt className="w-5 h-5 text-purple-400" />
                Garment
              </div>
              <div className="flex items-center gap-2">
                {garmentImage.preview && (
                  <button 
                    onClick={() => clearImage('garment')}
                    className="p-1 hover:bg-[var(--card-bg)] rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            
            <div className="relative">
              {!garmentImage.preview ? (
                <div className="grid grid-cols-2 gap-4 h-[300px]">
                  {/* Upload Button */}
                  <div 
                    className="rounded-xl border-2 border-dashed border-[var(--card-border)] hover:border-[var(--text-secondary)] bg-[var(--input-bg)] flex flex-col items-center justify-center cursor-pointer transition-all group"
                    onClick={() => garmentInputRef.current?.click()}
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
                  <img src={garmentImage.preview} alt="Garment" className="w-full h-full object-cover" />
                </div>
              )}
              
              <input 
                type="file" 
                ref={garmentInputRef} 
                onChange={(e) => handleFileChange(e, 'garment')} 
                className="hidden" 
                accept="image/*"
              />
            </div>

            {/* AI Suggestions - Moved under Garment */}
            <AnimatePresence>
              {(suggestions || isSuggesting) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t border-[var(--card-border)]"
                >
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Sparkles className="w-3 h-3 text-fuchsia-400" />
                    {isSuggesting ? "Getting Recommendations..." : "Complete the Look"}
                  </h3>
                  
                  {isSuggesting ? (
                    <div className="space-y-3 opacity-50">
                       {[1, 2, 3].map((i) => (
                         <div key={i} className="flex gap-3 p-2 rounded-lg animate-pulse bg-[var(--input-bg)] border border-[var(--card-border)]">
                           <div className="w-12 h-16 rounded bg-[var(--card-bg)]" />
                           <div className="flex-1 space-y-2 py-1">
                             <div className="h-3 bg-[var(--card-bg)] rounded w-3/4" />
                             <div className="h-2 bg-[var(--card-bg)] rounded w-1/2" />
                           </div>
                         </div>
                       ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {suggestions?.map((s, i) => {
                        const isSelected = selectedSuggestions.some(item => item.id === s.item.id);
                        return (
                          <motion.div 
                            key={i} 
                            whileHover={{ scale: 1.02 }}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedSuggestions(prev => prev.filter(item => item.id !== s.item.id));
                              } else {
                                setSelectedSuggestions(prev => [...prev, s.item]);
                              }
                            }}
                            className={`flex gap-3 p-2 rounded-lg cursor-pointer transition-all border ${isSelected ? 'bg-fuchsia-500/10 border-fuchsia-500 ring-1 ring-fuchsia-500/50' : 'bg-[var(--input-bg)] border-[var(--card-border)] hover:border-[var(--text-secondary)]'}`}
                          >
                            <div className="w-12 h-16 rounded overflow-hidden bg-[var(--card-bg)] flex-shrink-0 relative">
                              <img src={s.item.imageUrl} alt={s.item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              {isSelected && (
                                <div className="absolute inset-0 bg-fuchsia-500/20 flex items-center justify-center">
                                  <CheckCircle className="w-4 h-4 text-white drop-shadow-md" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate text-[var(--text-primary)]">{s.item.name}</div>
                              <div className="text-xs mb-1 text-[var(--text-secondary)]">{s.item.price}</div>
                              <div className="text-[10px] leading-tight line-clamp-2 italic text-[var(--text-secondary)]">"{s.reason}"</div>
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
        </div>

        {/* Action & Result Area */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center relative overflow-hidden min-h-[600px]">
             {/* Background Noise */}
             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none" />
             
             {generatedImage ? (
               <motion.div 
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className="relative w-full h-full flex items-center justify-center"
               >
                 <img src={generatedImage} alt="Generated VTO" className="max-h-full max-w-full rounded-lg shadow-2xl shadow-black/50" />
                 <div className="absolute bottom-4 right-4 flex gap-2">
                   <button 
                     onClick={handleDownload}
                     className="px-4 py-2 bg-black/60 backdrop-blur-md text-white rounded-lg text-sm font-medium hover:bg-black/80 transition-colors"
                   >
                     Download
                   </button>
                   <button 
                     onClick={handleShare}
                     className="px-4 py-2 bg-fuchsia-600 text-white rounded-lg text-sm font-medium hover:bg-fuchsia-700 transition-colors shadow-lg shadow-fuchsia-500/20"
                     style={brandVibe ? { 
                       backgroundColor: brandVibe.palette.accent, 
                       color: getContrastText(brandVibe.palette.accent),
                       boxShadow: `0 10px 15px -3px ${brandVibe.palette.accent}40`
                     } : undefined}
                   >
                     Share Look
                   </button>
                 </div>
               </motion.div>
             ) : (
               <div className="text-center max-w-sm">
                 <div className="relative group inline-block mx-auto mb-6">
                   {personImage.preview && garmentImage.preview && !isGenerating && (
                     <div className="absolute -inset-1 bg-gradient-to-r from-fuchsia-600 to-purple-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
                   )}
                   <button
                     onClick={generateVTO}
                     disabled={!personImage.preview || !garmentImage.preview || isGenerating}
                     className={`
                       relative w-20 h-20 rounded-full flex items-center justify-center transition-all
                       ${!personImage.preview || !garmentImage.preview || isGenerating
                         ? 'bg-white/5 text-white/20 cursor-not-allowed'
                         : 'bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white shadow-xl hover:scale-110 cursor-pointer'
                       }
                     `}
                     style={brandVibe && personImage.preview && garmentImage.preview && !isGenerating ? { 
                       backgroundImage: `linear-gradient(to right, ${brandVibe.palette.accent}, ${brandVibe.palette.secondary})`,
                       color: getContrastText(brandVibe.palette.accent),
                     } : undefined}
                   >
                     <Sparkles 
                       className={`w-10 h-10 ${!personImage.preview || !garmentImage.preview || isGenerating ? 'text-white/20' : ''}`} 
                       style={brandVibe && personImage.preview && garmentImage.preview && !isGenerating ? { color: getContrastText(brandVibe.palette.accent) } : undefined}
                     />
                   </button>
                 </div>
                 <h3 className="text-xl font-medium text-[var(--text-primary)] mb-2">Ready to Transform?</h3>
                 <p className="text-[var(--text-secondary)]">
                   Upload both images to generate your virtual try-on. Our AI will analyze fabric, fit, and lighting to create a realistic result.
                 </p>
               </div>
             )}

             {isGenerating && (
               <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                 <div className="w-16 h-16 border-4 border-fuchsia-500/30 border-t-fuchsia-500 rounded-full animate-spin mb-4" />
                 <p className="text-fuchsia-400 font-medium animate-pulse">Synthesizing Look...</p>
                 <p className="text-neutral-500 text-sm mt-2">Analyzing fabric physics & lighting</p>
               </div>
             )}
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-center text-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
