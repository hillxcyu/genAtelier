'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Sparkles, Mail, Loader2, MapPin, CheckCircle, Share2, Download, Send, UserCircle2, ArrowRight, RefreshCw, FileText } from 'lucide-react';
import { BrandVibe, CatalogItem, UserPersona } from '../types';

const MOCK_PERSONAS: UserPersona[] = [
  {
    id: 'p1',
    name: 'Elena Vance',
    age: 28,
    gender: 'Female',
    location: 'Brooklyn, NY',
    stylePreferences: ['Minimalist', 'Sustainable', 'Workwear'],
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop',
    cartItems: [],
    recommendedItems: []
  },
  {
    id: 'p2',
    name: 'Marcus Chen',
    age: 32,
    gender: 'Male',
    location: 'San Francisco, CA',
    stylePreferences: ['Technical', 'Urban', 'Avant-garde'],
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    cartItems: [],
    recommendedItems: []
  }
];

interface PersonalizedCampaignModuleProps {
  brandId: string;
  brandVibe?: BrandVibe | null;
  catalog?: CatalogItem[] | null;
}

export const PersonalizedCampaignModule: React.FC<PersonalizedCampaignModuleProps> = ({ brandId, brandVibe, catalog }) => {
  const [selectedPersona, setSelectedPersona] = useState<UserPersona>(MOCK_PERSONAS[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [campaign, setCampaign] = useState<{ subject: string, body: string, image: string, format: string } | null>(null);
  const [cartItems, setCartItems] = useState<CatalogItem[]>([]);
  const [useBrandPdf, setUseBrandPdf] = useState(true);

  const handleToggleCart = (item: CatalogItem) => {
    if (cartItems.find(c => c.id === item.id)) {
      setCartItems(cartItems.filter(c => c.id !== item.id));
    } else {
      setCartItems([...cartItems, item]);
    }
  };

  const generateCampaign = async () => {
    setIsGenerating(true);
    setCampaign(null);
    try {
      const response = await fetch('http://localhost:8000/api/generate/campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_id: brandId,
          persona: {
            name: selectedPersona.name,
            age: selectedPersona.age,
            gender: selectedPersona.gender,
            location: selectedPersona.location,
            style_preferences: selectedPersona.stylePreferences
          },
          cart_items: cartItems.map(c => `${c.name} (${c.category})`),
          brand_report: brandVibe?.mood,
          useBrandPdf: useBrandPdf
        })
      });
      const data = await response.json();
      setCampaign(data);
    } catch (err) {
      console.error("Campaign gen failed", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadImage = () => {
    if (!campaign?.image) return;
    const link = document.createElement('a');
    link.href = campaign.image;
    link.download = `campaign-asset-${selectedPersona.name.replace(' ', '-')}.png`;
    link.click();
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-12">
        <h2 className="text-4xl font-bold text-white mb-4 tracking-tight">Personalized Campaigns</h2>
        <p className="text-neutral-400 text-lg">Target specific user personas with hyper-personalized creative assets and copy.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white/5 border border-white/10 rounded-[32px] p-8 shadow-2xl">
            <h3 className="text-xs font-black text-neutral-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <UserCircle2 className="w-4 h-4" /> Target Personas
            </h3>
            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
              {MOCK_PERSONAS.map(p => (
                <button
                  key={p.id}
                  onClick={() => { setSelectedPersona(p); setCampaign(null); }}
                  className={`flex-shrink-0 relative group`}
                >
                  <div className={`w-20 h-20 rounded-full overflow-hidden border-2 transition-all duration-500 ${selectedPersona.id === p.id ? 'border-fuchsia-500 scale-110 shadow-[0_0_20px_rgba(192,38,211,0.3)]' : 'border-neutral-800 opacity-40 hover:opacity-100'}`}>
                    <img src={p.imageUrl} className="w-full h-full object-cover" />
                  </div>
                  {selectedPersona.id === p.id && (
                    <motion.div layoutId="activeThumb" className="absolute -bottom-1 -right-1 bg-fuchsia-500 rounded-full p-1 border-2 border-black">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </motion.div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <motion.div
            key={selectedPersona.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 border border-white/10 rounded-[32px] p-8 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/5 blur-[60px] rounded-full -translate-y-1/2 translate-x-1/2" />

            <div className="flex items-center gap-5 mb-8 relative z-10">
              <div className="relative">
                <img src={selectedPersona.imageUrl} className="w-20 h-20 rounded-3xl object-cover border border-white/10 shadow-xl" />
                <div className="absolute -bottom-2 -right-2 bg-neutral-900 border border-white/10 rounded-xl px-2 py-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-fuchsia-400" />
                  <span className="text-[10px] font-bold text-white uppercase">{selectedPersona.location.split(',')[0]}</span>
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-black text-white">{selectedPersona.name}</h3>
                <div className="flex gap-2 mt-1">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{selectedPersona.age} YEARS</span>
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">/</span>
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{selectedPersona.gender}</span>
                </div>
              </div>
            </div>

            <div className="space-y-6 relative z-10">
              <div>
                <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-3">Style DNA</p>
                <div className="flex flex-wrap gap-2">
                  {selectedPersona.stylePreferences.map(s => (
                    <span key={s} className="px-4 py-1.5 bg-white/5 text-neutral-300 text-[11px] font-bold rounded-xl border border-white/5">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-fuchsia-500/5 rounded-2xl border border-fuchsia-500/10">
                <p className="text-[10px] text-fuchsia-400 font-bold uppercase tracking-widest mb-1 italic">Vibe Summary</p>
                <p className="text-xs text-neutral-400 leading-relaxed">Highly responsive to {selectedPersona.stylePreferences[0].toLowerCase()} aesthetics and lifestyle-first messaging.</p>
              </div>

              <div className="pt-4 border-t border-white/5">
                <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-4 flex items-center justify-between">
                  <span>Simulated Cart</span>
                  <span className="text-fuchsia-400">{cartItems.length} ITEMS</span>
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {catalog?.slice(0, 8).map(item => {
                    const isInCart = !!cartItems.find(c => c.id === item.id);
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleToggleCart(item)}
                        className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${isInCart ? 'border-fuchsia-500 scale-95 shadow-lg' : 'border-transparent opacity-40 hover:opacity-100'}`}
                      >
                        <img src={item.imageUrl} className="w-full h-full object-cover" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-6 bg-white/5 border border-white/10 rounded-2xl mb-4">
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
              <p className="text-[10px] text-neutral-500 italic">Apply strict brand guidelines from the PDF.</p>
            </div>

            <button
              onClick={generateCampaign}
              disabled={isGenerating}
              className="w-full mt-10 py-5 bg-white text-black rounded-[24px] font-black text-lg tracking-wider flex items-center justify-center gap-3 disabled:opacity-30 hover:bg-neutral-200 transition-all active:scale-95 group shadow-xl"
            >
              {isGenerating ? <Loader2 className="animate-spin w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
              GENERATE CREATIVE
            </button>
          </motion.div>
        </div>

        <div className="lg:col-span-8 flex flex-col h-[800px]">
          <AnimatePresence mode="wait">
            {campaign ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex-1 overflow-y-auto custom-scrollbar-light bg-white/5 border border-white/10 rounded-[40px] p-8 shadow-2xl space-y-10"
              >
                {/* Header info */}
                <div className="flex justify-between items-center">
                  <div className="px-4 py-2 bg-fuchsia-500/10 rounded-full border border-fuchsia-500/20 text-[10px] font-bold text-fuchsia-400 flex items-center gap-2">
                    <Sparkles className="w-3 h-3" /> PERSONALIZED {campaign.format.toUpperCase()} CAMPAIGN EMAIL
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleDownloadImage} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors flex items-center gap-2 text-[10px] font-bold text-white">
                      <Download className="w-3.5 h-3.5" /> SAVE EMAIL ASSET
                    </button>
                    <button onClick={() => setCampaign(null)} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors">
                      <RefreshCw className="w-3.5 h-3.5 text-neutral-400" />
                    </button>
                  </div>
                </div>

                {/* Main Visual - Unified Email Content */}
                <div className="flex flex-col items-center gap-8 py-4">
                  <div className="text-center">
                    <p className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-2">Campaign Newsletter Preview</p>
                    <div className="h-1 w-12 bg-fuchsia-500/30 mx-auto rounded-full" />
                  </div>

                  <div className={`w-full rounded-[40px] overflow-hidden shadow-2xl border-4 border-white/5 bg-black p-4 relative ${campaign.format === 'mobile' ? 'max-w-md' : 'max-w-5xl'}`}>
                    <div className="absolute top-0 left-0 right-0 h-10 bg-white/5 border-b border-white/5 flex items-center px-6 gap-2">
                      <div className="w-2 h-2 rounded-full bg-white/10" />
                      <div className="w-2 h-2 rounded-full bg-white/10" />
                      <div className="w-2 h-2 rounded-full bg-white/10" />
                    </div>
                    <div className="mt-8 rounded-[28px] overflow-hidden border border-white/10">
                      <img
                        src={campaign.image}
                        alt="Campaign Unified Image"
                        className={`w-full h-full object-cover ${campaign.format === 'mobile' ? 'aspect-[9/16]' : 'aspect-video'}`}
                      />
                    </div>
                  </div>
                </div>

                <div className="text-center pt-8 pb-10">
                  <p className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.4em] mb-4">Generated via GenFashion Neural Engine</p>
                  <div className="flex justify-center gap-4">
                    <div className="w-1 h-1 bg-neutral-800 rounded-full" />
                    <div className="w-1 h-1 bg-neutral-800 rounded-full" />
                    <div className="w-1 h-1 bg-neutral-800 rounded-full" />
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 bg-white/5 border border-white/10 rounded-[40px] flex flex-col items-center justify-center shadow-inner relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none" />
                <div className="relative mb-8">
                  <div className="w-24 h-24 bg-fuchsia-500/10 blur-[80px] rounded-full absolute inset-0 animate-pulse" />
                  <div className="w-24 h-24 rounded-[40px] bg-white/5 border border-white/10 flex items-center justify-center relative backdrop-blur-3xl">
                    <Mail className="w-10 h-10 text-fuchsia-500/30" />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-wide">Campaign Studio</h3>
                <p className="text-neutral-500 max-w-sm text-center leading-relaxed">
                  {isGenerating ? 'Synthesizing creative assets and copy...' : 'Select a target persona to generate a hyper-personalized multi-channel campaign strategy.'}
                </p>

                {isGenerating && (
                  <div className="mt-12 flex flex-col items-center gap-4">
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map(i => (
                        <motion.div
                          key={i}
                          animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                          className="w-2 h-2 bg-fuchsia-500 rounded-full"
                        />
                      ))}
                    </div>
                    <div className="text-[10px] font-black text-fuchsia-500 uppercase tracking-widest animate-pulse">Neural Engine Active</div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
