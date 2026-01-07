"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles, Loader2, Zap, Shield, Image as ImageIcon, Globe, Search } from "lucide-react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (data.task_id) {
        router.push(`/analyze/${data.task_id}`);
      }
    } catch (err) {
      console.error("Failed to start analysis", err);
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 md:p-24 overflow-hidden relative selection:bg-fuchsia-500/30 selection:text-fuchsia-200">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-black -z-10" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(192,38,211,0.15),transparent_50%)] -z-10" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.2] brightness-50 pointer-events-none -z-10" />

      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-fuchsia-500/50 to-transparent shadow-[0_0_20px_rgba(192,38,211,0.5)]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: [0.19, 1, 0.22, 1] }}
        className="z-10 text-center w-full max-w-4xl"
      >
        <div className="inline-flex items-center gap-2 p-1.5 px-4 rounded-full bg-white/5 backdrop-blur-3xl border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-fuchsia-400 mb-10 shadow-xl shadow-fuchsia-500/5">
          <Sparkles className="w-3 h-3" />
          Neural Brand Engine v2.0
        </div>

        <h1 className="text-6xl md:text-8xl font-black text-white mb-8 tracking-tighter leading-[0.9] flex flex-col">
          <span>ATELIER</span>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-500 via-purple-400 to-indigo-500">EXPERIENCE</span>
        </h1>

        <p className="text-lg md:text-xl text-neutral-400 max-w-xl mx-auto mb-16 leading-relaxed font-medium">
          The world's first brand-grounded generative platform. Extract identity DNA from any domain and transform it into high-fashion assets.
        </p>

        <form onSubmit={handleSubmit} className="relative max-w-2xl mx-auto mb-20 group">
          <div className="absolute -inset-4 bg-fuchsia-600/20 blur-[60px] opacity-0 group-focus-within:opacity-100 transition-opacity duration-700 -z-10" />

          <div className="flex flex-col md:flex-row gap-4 p-2 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[32px] shadow-2xl relative">
            <div className="flex-1 flex items-center px-6 relative">
              <Globe className="w-5 h-5 text-neutral-500 absolute left-6" />
              <input
                type="text"
                placeholder="enter domain name (e.g. vogue.com)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full pl-10 pr-4 py-6 bg-transparent text-white placeholder-neutral-600 rounded-3xl focus:outline-none text-lg font-bold lowercase"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || !url}
              className="px-10 py-6 bg-white hover:bg-neutral-200 disabled:opacity-30 disabled:hover:bg-white text-black font-black rounded-[24px] transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 group/btn"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>SYNTHESIZING...</span>
                </>
              ) : (
                <>
                  <span>ANALYZE BRAND</span>
                  <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-8 opacity-40 hover:opacity-100 transition-opacity duration-500">
            <div className="flex items-center gap-2 text-[10px] font-black text-white uppercase tracking-widest"><Search className="w-3 h-3" /> Grounding</div>
            <div className="flex items-center gap-2 text-[10px] font-black text-white uppercase tracking-widest"><Shield className="w-3 h-3" /> Identity</div>
            <div className="flex items-center gap-2 text-[10px] font-black text-white uppercase tracking-widest"><Zap className="w-3 h-3" /> Generative</div>
          </div>
        </form>

        {/* Feature Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
          {[
            { label: 'Lookbook', icon: BookOpen, desc: 'Editorial generation' },
            { label: 'Fitting Room', icon: Shirt, desc: 'Multi-item VTO' },
            { label: 'Lifestyle', icon: Camera, desc: 'Professional shots' },
            { label: 'DNA Analysis', icon: ShieldCheck, desc: 'Scraper & Gemini' }
          ].map((f, i) => (
            <div key={i} className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl hover:bg-white/[0.05] transition-colors group cursor-default">
              <div className="w-10 h-10 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <f.icon className="w-5 h-5 text-fuchsia-500" />
              </div>
              <h3 className="text-white font-black text-xs uppercase tracking-widest mb-1">{f.label}</h3>
              <p className="text-[10px] text-neutral-500 font-bold uppercase">{f.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Decorative Elements */}
      <div className="absolute bottom-10 left-10 opacity-10 flex flex-col gap-2 pointer-events-none">
        <div className="text-[8px] font-mono text-white">SYSTEM_STATUS: ACTIVE</div>
        <div className="text-[8px] font-mono text-white">NEURAL_LOAD: OPTIMAL</div>
        <div className="text-[8px] font-mono text-white">LATENCY: 42MS</div>
      </div>
    </main>
  );
}

function BookOpen(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>
}
function Shirt(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 4V2H9v2c0 2-1 2-1 2s0 1 1 1h6c1 0 1-1 1-1s-1 0-1-2Z" /><path d="M4 7h4v10H4z" /><path d="m11 7 4-3h4v13h-4l-4 3z" /><path d="M16 17v4h-8v-4z" /><path d="M20 7h4v10h-4z" /></svg>
}
function Camera(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" /></svg>
}
function ShieldCheck(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /><path d="m9 12 2 2 4-4" /></svg>
}
