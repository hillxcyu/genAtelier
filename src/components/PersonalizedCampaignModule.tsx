import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, ShoppingBag, Sparkles, Send, Loader2, RefreshCw, Mail, MessageSquare, MapPin, Calendar, Tag } from 'lucide-react';
import { ai } from '../utils/genai';
import { BrandVibe, CatalogItem, UserPersona } from '../types';
import { getContrastText } from '../utils/color';
import { MOCK_PERSONAS, DEMO_CATALOG } from '../constants';

interface PersonalizedCampaignModuleProps {
  brandVibe: BrandVibe | null;
  catalog: CatalogItem[];
}

export const PersonalizedCampaignModule: React.FC<PersonalizedCampaignModuleProps> = ({ brandVibe, catalog }) => {
  const [personas, setPersonas] = useState<UserPersona[]>(MOCK_PERSONAS);
  const [selectedPersona, setSelectedPersona] = useState<UserPersona>(MOCK_PERSONAS[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCampaign, setGeneratedCampaign] = useState<{
    subject: string;
    body: string;
    imageUrl: string;
    lookbookUrl?: string;
  } | null>(null);

  // Hydrate personas with catalog items on mount
  useEffect(() => {
    const activeCatalog = (catalog && catalog.length > 0) ? catalog : DEMO_CATALOG;
    
    if (activeCatalog.length > 0) {
      const hydrated = MOCK_PERSONAS.map((p, i) => {
        const cart = [activeCatalog[i % activeCatalog.length], activeCatalog[(i + 1) % activeCatalog.length]].filter(Boolean);
        // Simple recommendation: pick next 2 items not in cart
        const recommended = [
          activeCatalog[(i + 2) % activeCatalog.length], 
          activeCatalog[(i + 3) % activeCatalog.length]
        ].filter(Boolean);

        return {
          ...p,
          cartItems: cart,
          recommendedItems: recommended
        };
      });
      setPersonas(hydrated);
      setSelectedPersona(hydrated[0]);
    }
  }, [catalog]);

  const handleGenerate = async () => {
    if (!selectedPersona || !brandVibe) return;

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

    setIsGenerating(true);
    setGeneratedCampaign(null);

    try {
      const targetItem = selectedPersona.cartItems[0];
      
      // 1. Generate Ad Copy
      const copyPrompt = `
        Write a personalized email marketing campaign for a fashion brand named "${brandVibe.name}".
        Target Audience: ${selectedPersona.name}, ${selectedPersona.age} years old, ${selectedPersona.gender}, lives in ${selectedPersona.location}.
        Style Preferences: ${selectedPersona.stylePreferences.join(', ')}.
        Product in Cart: ${targetItem.name} (${targetItem.category}).
        Brand Vibe: ${brandVibe.mood} (${brandVibe.keywords?.join(', ')}).
        
        Return a JSON object with:
        - subject: Catchy email subject line.
        - body: A short, persuasive email body text (max 50 words).
      `;

      const copyResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { role: 'user', parts: [{ text: copyPrompt }] },
        config: { responseMimeType: 'application/json' }
      });
      
      const copyData = JSON.parse(copyResponse.text || '{}');

      // 2. Generate Personalized Image
      // We will use the user's image and the product image to generate a VTO-like shot
      const imagePrompt = `
        Fashion photography of a ${selectedPersona.age} year old ${selectedPersona.gender} model resembling the user, wearing a ${targetItem.name}.
        Style: ${brandVibe.mood}, ${selectedPersona.stylePreferences.join(', ')}.
        Setting: Professional studio or lifestyle matching the brand.
        High quality, photorealistic, 4k.
      `;

      const imageResponse = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { role: 'user', parts: [{ text: imagePrompt }] },
        config: {
          imageConfig: {
            aspectRatio: "3:4",
            imageSize: "1K"
          }
        }
      });

      let generatedImageUrl = '';
      for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          generatedImageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }

      // 3. Generate Lookbook
      // Combine cart items and recommended items
      const lookbookItems = [...selectedPersona.cartItems, ...selectedPersona.recommendedItems].slice(0, 4);
      
      const lookbookImageParts = await Promise.all(lookbookItems.map(async (item) => {
        try {
          const response = await fetch(item.imageUrl);
          const blob = await response.blob();
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          return {
            inlineData: {
              mimeType: blob.type,
              data: base64.split(',')[1]
            }
          };
        } catch (e) {
          return null;
        }
      }));

      const validLookbookParts = lookbookImageParts.filter(Boolean) as any[];

      const lookbookPrompt = `
        Create a single-page high-fashion editorial lookbook layout featuring these ${validLookbookParts.length} items.
        Theme: ${brandVibe.mood} for ${selectedPersona.name}.
        Style: ${selectedPersona.stylePreferences.join(', ')}.
        Layout: Asymmetrical, artistic, magazine style.
        Background: Complementary to ${brandVibe.colors.join(', ')}.
        Include the text "${brandVibe.name} x ${selectedPersona.name}" elegantly.
      `;

      const lookbookResponse = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
          role: 'user',
          parts: [
            { text: lookbookPrompt },
            ...validLookbookParts
          ]
        },
        config: {
          imageConfig: {
            aspectRatio: "3:4",
            imageSize: "1K"
          }
        }
      });

      let generatedLookbookUrl = '';
      for (const part of lookbookResponse.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          generatedLookbookUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }

      setGeneratedCampaign({
        subject: copyData.subject,
        body: copyData.body,
        imageUrl: generatedImageUrl || 'https://picsum.photos/800/600',
        lookbookUrl: generatedLookbookUrl
      });

    } catch (error) {
      console.error("Campaign generation failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-4">Personalized Campaigns</h2>
        <p className="text-[var(--text-secondary)]">Target specific user personas with hyper-personalized content generated from their shopping behavior.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left Column: Persona List & Details */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Persona Selector */}
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6">
            <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-4">Select Persona</h3>
            <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
              {personas.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { setSelectedPersona(p); setGeneratedCampaign(null); }}
                  className={`flex-shrink-0 relative group ${selectedPersona.id === p.id ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}
                >
                  <div className={`w-16 h-16 rounded-full overflow-hidden border-2 transition-all ${selectedPersona.id === p.id ? 'border-fuchsia-500 scale-110' : 'border-transparent'}`}>
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-medium text-[var(--text-primary)] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    {p.name}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Persona Details */}
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <User className="w-32 h-32 text-[var(--text-primary)]" />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[var(--card-border)]">
                  <img src={selectedPersona.imageUrl} alt={selectedPersona.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[var(--text-primary)]">{selectedPersona.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <MapPin className="w-3 h-3" /> {selectedPersona.location}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex gap-2 flex-wrap">
                  <span className="px-2 py-1 rounded-md bg-[var(--input-bg)] text-xs text-[var(--text-secondary)] flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {selectedPersona.age} Years
                  </span>
                  <span className="px-2 py-1 rounded-md bg-[var(--input-bg)] text-xs text-[var(--text-secondary)] flex items-center gap-1">
                    <User className="w-3 h-3" /> {selectedPersona.gender}
                  </span>
                </div>

                <div>
                  <div className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">Style Preferences</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedPersona.stylePreferences.map((style, i) => (
                      <span key={i} className="px-2 py-1 rounded-full border border-[var(--card-border)] text-xs text-[var(--text-primary)]">
                        {style}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">In Cart</div>
                  <div className="space-y-2">
                    {selectedPersona.cartItems.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 bg-[var(--input-bg)] rounded-lg p-2">
                        <div className="w-10 h-10 rounded bg-white/10 overflow-hidden">
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-[var(--text-primary)] truncate">{item.name}</div>
                          <div className="text-xs text-[var(--text-secondary)]">{item.price}</div>
                        </div>
                      </div>
                    ))}
                    {selectedPersona.cartItems.length === 0 && (
                      <div className="text-sm text-[var(--text-secondary)] italic">Cart is empty</div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-2 flex items-center gap-2">
                    <Sparkles className="w-3 h-3 text-fuchsia-400" /> Recommended for You
                  </div>
                  <div className="space-y-2">
                    {selectedPersona.recommendedItems.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 bg-[var(--input-bg)]/50 border border-[var(--card-border)] rounded-lg p-2">
                        <div className="w-10 h-10 rounded bg-white/10 overflow-hidden">
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-[var(--text-primary)] truncate">{item.name}</div>
                          <div className="text-xs text-[var(--text-secondary)]">{item.price}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={isGenerating || selectedPersona.cartItems.length === 0}
                className="w-full mt-6 py-3 bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-fuchsia-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Generate Campaign
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Generated Campaign */}
        <div className="lg:col-span-8">
          <div className="h-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[500px]">
            {!generatedCampaign ? (
              <div className="max-w-md">
                <div className="w-20 h-20 bg-[var(--input-bg)] rounded-full flex items-center justify-center mx-auto mb-6">
                  <Mail className="w-10 h-10 text-[var(--text-secondary)]" />
                </div>
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Ready to Personalize</h3>
                <p className="text-[var(--text-secondary)]">
                  Select a persona and click generate to create a hyper-personalized ad campaign featuring their cart items.
                </p>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl text-left"
              >
                <div className="bg-white rounded-xl overflow-hidden shadow-2xl text-neutral-900">
                  {/* Email Header */}
                  <div className="bg-neutral-100 p-4 border-b border-neutral-200 flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <div className="ml-4 text-sm text-neutral-500 font-mono flex-1">New Message</div>
                  </div>

                  {/* Email Content */}
                  <div className="p-8">
                    <div className="mb-6 border-b border-neutral-100 pb-6">
                      <div className="text-xs text-neutral-400 uppercase tracking-wider mb-1">Subject</div>
                      <h2 className="text-xl font-bold text-neutral-900">{generatedCampaign.subject}</h2>
                    </div>

                    <div className="flex gap-6">
                      <div className="flex-1">
                        <div className="text-xs text-neutral-400 uppercase tracking-wider mb-2">Message</div>
                        <p className="text-neutral-600 leading-relaxed mb-6">
                          {generatedCampaign.body}
                        </p>
                        <button 
                          className="px-6 py-2 bg-neutral-900 text-white rounded-lg font-medium text-sm hover:bg-neutral-800 transition-colors"
                          style={{ backgroundColor: brandVibe?.accentColor }}
                        >
                          Shop Now
                        </button>
                      </div>
                      
                      <div className="w-1/2">
                         <div className="aspect-[3/4] rounded-lg overflow-hidden bg-neutral-100 relative group cursor-pointer">
                           <img src={generatedCampaign.imageUrl} alt="Campaign" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                           <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                             <span className="text-white text-xs font-medium">Generated for {selectedPersona.name}</span>
                           </div>
                         </div>
                      </div>
                    </div>

                    {/* Lookbook Section */}
                    {generatedCampaign.lookbookUrl && (
                      <div className="mt-8 pt-8 border-t border-neutral-100">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">Curated Lookbook</h3>
                          <span className="text-xs text-neutral-400">Based on your style</span>
                        </div>
                        <div className="aspect-[3/4] rounded-lg overflow-hidden bg-neutral-50 border border-neutral-200 shadow-inner">
                          <img src={generatedCampaign.lookbookUrl} alt="Personalized Lookbook" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex justify-end items-center">
                  <div className="flex gap-3">
                    <button className="px-4 py-2 rounded-lg bg-[var(--input-bg)] text-[var(--text-primary)] text-sm font-medium hover:bg-[var(--card-border)] transition-colors">
                      Discard
                    </button>
                    <button className="px-4 py-2 rounded-lg bg-fuchsia-600 text-white text-sm font-medium hover:bg-fuchsia-700 transition-colors shadow-lg shadow-fuchsia-500/20">
                      Send Campaign
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
