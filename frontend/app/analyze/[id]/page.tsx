"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle, Loader2, FileText, Layout, ShieldCheck,
  UserCircle, BookOpen, Send, FileDown, ShoppingBag, X, Sparkles, Camera, Palette, Globe, Layers, ArrowLeft
} from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { VTOModule } from "../../../components/VTOModule";
import { LookbookModule } from "../../../components/LookbookModule";
import { PersonalizedCampaignModule } from "../../../components/PersonalizedCampaignModule";
import { ProductToModelModule } from "../../../components/ProductToModelModule";
import Link from "next/link";

type TabId = 'report' | 'vto' | 'lookbook' | 'campaign' | 'lifestyle';

export default function AnalyzePage() {
  const { id } = useParams();
  const [status, setStatus] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<TabId>('report');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!id) return;

    const poll = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:8000/status/${id}`);
        const data = await res.json();
        setStatus(data);

        if (data.status === "completed") {
          setIsComplete(true);
          clearInterval(poll);
        } else if (data.status === "failed") {
          clearInterval(poll);
        }
      } catch (e) {
        console.error("Polling error", e);
      }
    }, 2000);

    return () => clearInterval(poll);
  }, [id]);

  if (!status) return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-fuchsia-500/20 border-t-fuchsia-500 rounded-full animate-spin" />
        <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-fuchsia-400 animate-pulse" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white flex selection:bg-fuchsia-500/30 selection:text-fuchsia-200">
      {/* Noise Texture Panel */}
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none z-50" />

      {/* Sidebar */}
      {isComplete && (
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="w-72 border-r border-white/5 bg-white/[0.02] backdrop-blur-3xl flex flex-col p-8 space-y-10 sticky top-0 h-screen z-40"
        >
          <Link href="/" className="group flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center shadow-lg shadow-fuchsia-500/20 group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tighter">ATELIER AI</h1>
              <p className="text-[8px] font-black text-fuchsia-500 uppercase tracking-widest">Neural Analysis</p>
            </div>
          </Link>

          <nav className="flex-1 space-y-2">
            {[
              { id: 'report', label: 'Brand DNA', icon: ShieldCheck },
              { id: 'vto', label: 'Fitting Room', icon: UserCircle },
              { id: 'lookbook', label: 'Lookbook', icon: BookOpen },
              { id: 'campaign', label: 'Campaigns', icon: Send },
              { id: 'lifestyle', label: 'Lifestyle', icon: Camera }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as TabId)}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all relative group overflow-hidden ${activeTab === item.id
                  ? 'bg-white text-black font-black'
                  : 'text-neutral-500 hover:text-white hover:bg-white/5'
                  }`}
              >
                <item.icon className="w-5 h-5 relative z-10" />
                <span className="text-xs uppercase tracking-widest relative z-10">{item.label}</span>
                {activeTab === item.id && (
                  <motion.div layoutId="navGlow" className="absolute inset-0 bg-white" />
                )}
              </button>
            ))}
          </nav>

          <div className="pt-8 border-t border-white/5 space-y-4">
            {status.result?.pdf_url && (
              <a
                href={`http://localhost:8000${status.result.pdf_url}`}
                target="_blank"
                className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-black text-[10px] tracking-widest transition-all shadow-xl shadow-fuchsia-600/20"
              >
                <FileDown className="w-4 h-4" /> EXPORT REPORT
              </a>
            )}
            <Link href="/" className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl border border-white/10 text-neutral-500 hover:text-white hover:bg-white/5 text-[10px] font-black tracking-widest transition-all">
              <ArrowLeft className="w-4 h-4" /> START NEW
            </Link>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto relative z-10">
        <div className="p-8 md:p-16 max-w-7xl mx-auto min-h-screen flex flex-col">

          <AnimatePresence mode="wait">
            {!isComplete ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex-1 flex flex-col items-center justify-center space-y-12"
              >
                <div className="relative">
                  <div className="w-40 h-40 border-4 border-fuchsia-500/10 border-t-fuchsia-500 rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-fuchsia-500 to-purple-600 rounded-3xl rotate-45 animate-pulse shadow-2xl shadow-fuchsia-500/30" />
                  </div>
                  <Sparkles className="absolute -top-4 -right-4 w-8 h-8 text-fuchsia-400 animate-bounce" />
                </div>

                <div className="text-center space-y-4">
                  <h3 className="text-4xl font-black text-white tracking-tighter uppercase italic">Synthesizing DNA</h3>
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-fuchsia-500 font-black text-xs uppercase tracking-[0.4em] animate-pulse">{status.step}...</p>
                    <div className="w-64 h-1 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 30, ease: "linear" }}
                        className="h-full bg-gradient-to-r from-fuchsia-500 to-purple-600"
                      />
                    </div>
                  </div>
                  <p className="text-neutral-500 text-sm italic max-w-sm mx-auto font-medium">Scouring domain signals, verifying aesthetic patterns, and grounding the generative model.</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-1"
              >
                {activeTab === 'report' && (
                  <div className="max-w-5xl mx-auto space-y-20 pb-20">
                    <header className="relative py-20 px-12 bg-white/[0.02] border border-white/5 rounded-[40px] overflow-hidden shadow-2xl">
                      <div className="absolute top-0 right-0 w-96 h-96 bg-fuchsia-500/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />

                      <div className="relative z-10 flex flex-col items-center text-center">
                        <div className="p-3 bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-2xl mb-8">
                          <Globe className="w-6 h-6 text-fuchsia-400" />
                        </div>
                        <h1 className="text-7xl font-black text-white mb-4 tracking-tighter leading-none">{status.result?.vibe?.name || status.url}</h1>
                        <p className="text-fuchsia-400 font-black text-xl mb-10 tracking-widest uppercase italic">{status.result?.vibe?.mood}</p>

                        <div className="flex flex-wrap justify-center gap-3">
                          {status.result?.vibe?.keywords?.map((k: string) => (
                            <span key={k} className="px-6 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] text-neutral-300 uppercase font-black tracking-[0.2em] hover:bg-white/10 transition-colors cursor-default">#{k}</span>
                          ))}
                        </div>
                      </div>
                    </header>

                    <div className="grid lg:grid-cols-12 gap-10">
                      <div className="lg:col-span-4 space-y-10">
                        {/* Palette */}
                        <div className="bg-white/[0.02] border border-white/5 rounded-[32px] p-8 shadow-2xl">
                          <div className="flex items-center gap-3 mb-8">
                            <div className="p-2 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                              <Palette className="w-4 h-4 text-purple-400" />
                            </div>
                            <span className="text-[10px] uppercase font-black tracking-[0.2em] text-neutral-400">Extracted Palette</span>
                          </div>
                          <div className="grid grid-cols-4 gap-4">
                            {status.result?.vibe?.colors?.map((c: string) => (
                              <div key={c} className="group">
                                <div className="aspect-square rounded-2xl border border-white/10 mb-2 shadow-lg group-hover:scale-110 transition-transform cursor-pointer" style={{ backgroundColor: c }} />
                                <p className="text-[9px] font-mono text-neutral-500 group-hover:text-white transition-colors text-center">{c.toUpperCase()}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Snapshot */}
                        <div className="bg-white/[0.02] border border-white/5 rounded-[32px] p-8 shadow-2xl overflow-hidden group">
                          <div className="flex items-center gap-3 mb-8">
                            <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                              <Globe className="w-4 h-4 text-indigo-400" />
                            </div>
                            <span className="text-[10px] uppercase font-black tracking-[0.2em] text-neutral-400">Identity Source</span>
                          </div>
                          <div className="aspect-video bg-neutral-900 rounded-2xl border border-white/5 flex items-center justify-center relative overflow-hidden">
                            <ImageIcon className="w-12 h-12 text-white/5 opacity-50 group-hover:scale-150 transition-transform duration-1000" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 flex items-end p-6">
                              <div className="text-[10px] font-black text-white uppercase tracking-widest">Verified Digital Twin</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="lg:col-span-8">
                        <div className="bg-white/[0.02] border border-white/5 rounded-[40px] p-10 md:p-14 shadow-2xl relative overflow-hidden group">
                          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-fuchsia-500/30 to-transparent" />

                          <div className="flex items-center gap-4 mb-12">
                            <div className="p-3 bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-2xl">
                              <FileText className="w-6 h-6 text-fuchsia-400" />
                            </div>
                            <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">Brand DNA Report</h2>
                          </div>

                          <div className="prose prose-invert prose-fuchsia max-w-none prose-headings:font-black prose-headings:uppercase prose-headings:tracking-widest prose-p:text-neutral-400 prose-p:leading-relaxed prose-p:text-lg prose-strong:text-white">
                            <ReactMarkdown>{status.result?.report || ''}</ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Catalog Preview */}
                    <div className="space-y-10">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-2xl text-fuchsia-400">
                          <ShoppingBag className="w-6 h-6" />
                        </div>
                        <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">Synthetic Collection</h2>
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
                        {status.result?.catalog?.slice(0, 5).map((p: any) => (
                          <div key={p.id} className="bg-white/[0.02] border border-white/5 rounded-3xl p-3 hover:bg-white/[0.05] transition-all group cursor-pointer shadow-xl">
                            <div className="aspect-[3/4] rounded-2xl overflow-hidden mb-4 relative">
                              <img src={p.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                              <div className="absolute top-2 right-2 p-1.5 bg-black/40 backdrop-blur-md rounded-xl text-[10px] font-black text-white opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest">{p.price}</div>
                            </div>
                            <div className="px-2 pb-2">
                              <p className="text-[10px] font-black text-white truncate uppercase tracking-widest mb-1">{p.name}</p>
                              <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-tighter">{p.category}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'vto' && (
                  <VTOModule
                    brandId={id as string}
                    brandVibe={status.result?.vibe}
                    catalog={status.result?.catalog}
                  />
                )}

                {activeTab === 'lookbook' && (
                  <LookbookModule
                    brandId={id as string}
                    brandVibe={status.result?.vibe}
                    catalog={status.result?.catalog}
                  />
                )}

                {activeTab === 'campaign' && (
                  <PersonalizedCampaignModule
                    brandId={id as string}
                    brandVibe={status.result?.vibe}
                    catalog={status.result?.catalog}
                  />
                )}

                {activeTab === 'lifestyle' && (
                  <ProductToModelModule
                    brandId={id as string}
                    brandVibe={status.result?.vibe}
                    catalog={status.result?.catalog}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {status.status === 'failed' && (
            <div className="mt-8 p-10 bg-red-500/10 border border-red-500/20 rounded-[40px] text-red-500 text-center shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-red-500/30" />
              <h4 className="text-2xl font-black mb-2 uppercase tracking-tighter italic">Analysis Interrupted</h4>
              <p className="text-sm font-medium text-red-400 px-6">{status.error}</p>
              <button onClick={() => window.location.reload()} className="mt-8 px-8 py-3 bg-red-500 text-white font-black text-[10px] tracking-widest rounded-2xl hover:bg-red-600 transition-colors uppercase">Retry Authentication</button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function ImageIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
  );
}
