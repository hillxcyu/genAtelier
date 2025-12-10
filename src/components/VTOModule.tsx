import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Upload, Sparkles, RefreshCw, Shirt, User, X } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { BrandVibe } from '../types';

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface ImageState {
  file: File | null;
  preview: string | null;
}

interface VTOModuleProps {
  brandVibe?: BrandVibe | null;
}

export const VTOModule: React.FC<VTOModuleProps> = ({ brandVibe }) => {
  const [personImage, setPersonImage] = useState<ImageState>({ file: null, preview: null });
  const [garmentImage, setGarmentImage] = useState<ImageState>({ file: null, preview: null });
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const personInputRef = useRef<HTMLInputElement>(null);
  const garmentInputRef = useRef<HTMLInputElement>(null);

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
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    const ai = new GoogleGenAI({ apiKey: apiKey! });

    setIsGenerating(true);
    setError(null);

    try {
      // Convert base64 to clean strings for the API
      const personBase64 = personImage.preview.split(',')[1];
      const garmentBase64 = garmentImage.preview.split(',')[1];

      // 1. Analyze the garment to understand what we are trying on
      // We use a lighter model for quick analysis if needed, but here we'll just prompt the image generator directly
      // with both images as reference.
      
      // Note: For "Nano Banana" style VTO, we ideally want to use a specific VTO pipeline.
      // Since we are using Gemini, we will use the multimodal capabilities to "edit" the person image
      // or generate a new one based on the person and the garment.
      
      const prompt = "Generate a high-quality, photorealistic image of the person from the first image wearing the garment from the second image. Maintain the person's pose, body shape, and skin tone exactly. Fit the garment naturally onto the person, respecting fabric drape and lighting. The output should be a fashion photography style shot.";

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: 'image/jpeg', // Assuming JPEG for simplicity, ideally detect from file
                data: personBase64
              }
            },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: garmentBase64
              }
            }
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
        <h2 className="text-3xl font-bold text-white mb-4">Virtual Fitting Room</h2>
        <p className="text-neutral-400">Upload a photo of yourself and a garment to see the magic happen.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Input Area */}
        <div className="lg:col-span-5 space-y-6">
          {/* Person Upload */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative group hover:border-fuchsia-500/50 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-white font-medium">
                <User className="w-5 h-5 text-fuchsia-400" />
                Your Photo
              </div>
              {personImage.preview && (
                <button 
                  onClick={() => clearImage('person')}
                  className="p-1 hover:bg-white/10 rounded-full text-neutral-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <div 
              className={`aspect-[3/4] rounded-xl overflow-hidden bg-black/40 flex items-center justify-center border-2 border-dashed ${personImage.preview ? 'border-transparent' : 'border-white/10 group-hover:border-white/20'} transition-all relative`}
              onClick={() => !personImage.preview && personInputRef.current?.click()}
            >
              {personImage.preview ? (
                <img src={personImage.preview} alt="Person" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-6 cursor-pointer">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
                    <Upload className="w-6 h-6 text-neutral-400" />
                  </div>
                  <p className="text-sm text-neutral-400">Click to upload or drag & drop</p>
                  <p className="text-xs text-neutral-600 mt-1">Recommended: Full body shot</p>
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
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative group hover:border-purple-500/50 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-white font-medium">
                <Shirt className="w-5 h-5 text-purple-400" />
                Garment
              </div>
              {garmentImage.preview && (
                <button 
                  onClick={() => clearImage('garment')}
                  className="p-1 hover:bg-white/10 rounded-full text-neutral-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <div 
              className={`aspect-[3/4] rounded-xl overflow-hidden bg-black/40 flex items-center justify-center border-2 border-dashed ${garmentImage.preview ? 'border-transparent' : 'border-white/10 group-hover:border-white/20'} transition-all relative`}
              onClick={() => !garmentImage.preview && garmentInputRef.current?.click()}
            >
              {garmentImage.preview ? (
                <img src={garmentImage.preview} alt="Garment" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-6 cursor-pointer">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
                    <Upload className="w-6 h-6 text-neutral-400" />
                  </div>
                  <p className="text-sm text-neutral-400">Click to upload or drag & drop</p>
                  <p className="text-xs text-neutral-600 mt-1">Flat lay or ghost mannequin</p>
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
                       backgroundColor: brandVibe.accentColor, 
                       boxShadow: `0 10px 15px -3px ${brandVibe.accentColor}40`
                     } : undefined}
                   >
                     Share Look
                   </button>
                 </div>
               </motion.div>
             ) : (
               <div className="text-center max-w-sm">
                 <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                   <Sparkles className="w-10 h-10 text-white/20" />
                 </div>
                 <h3 className="text-xl font-medium text-white mb-2">Ready to Transform?</h3>
                 <p className="text-neutral-500">
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

          {/* Controls */}
          <div className="mt-6 flex justify-center">
            <button
              onClick={generateVTO}
              disabled={!personImage.preview || !garmentImage.preview || isGenerating}
              className={`
                px-8 py-4 rounded-full font-bold text-lg flex items-center gap-3 transition-all
                ${!personImage.preview || !garmentImage.preview || isGenerating
                  ? 'bg-white/10 text-white/40 cursor-not-allowed'
                  : 'bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white hover:shadow-[0_0_40px_-10px_rgba(192,38,211,0.5)] hover:scale-105'
                }
              `}
              style={brandVibe && personImage.preview && garmentImage.preview && !isGenerating ? { 
                backgroundImage: `linear-gradient(to right, ${brandVibe.accentColor}, ${brandVibe.colors[1]})`,
                boxShadow: `0 10px 15px -3px ${brandVibe.accentColor}40`
              } : undefined}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Try-On
                </>
              )}
            </button>
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
