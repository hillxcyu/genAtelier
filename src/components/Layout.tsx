import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shirt, Wand2, Layers, ShoppingBag, Menu, X, BookOpen, Camera, Palette, Type, Droplet, Sparkles } from 'lucide-react';
import { BrandVibe } from '../types';
import { getContrastText } from '../utils/color';

interface LayoutProps {
  children: React.ReactNode;
  currentView: 'hero' | 'vto' | 'ingestion' | 'lookbook' | 'product-to-model';
  setCurrentView: (view: 'hero' | 'vto' | 'ingestion' | 'lookbook' | 'product-to-model') => void;
  brandVibe: BrandVibe | null;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, setCurrentView, brandVibe }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isBrandPanelOpen, setIsBrandPanelOpen] = React.useState(false);

  const navItems = [
    { id: 'hero', label: 'Home', icon: Layers },
    { id: 'vto', label: 'Virtual Try-On', icon: Shirt },
    { id: 'lookbook', label: 'Lookbook', icon: BookOpen },
    { id: 'product-to-model', label: 'Product to Model', icon: Camera },
    { id: 'ingestion', label: 'Brand Ingestion', icon: ShoppingBag },
  ];

  const primaryColor = brandVibe ? brandVibe.colors[0] : '#000000';
  const contrastColor = getContrastText(primaryColor);
  const isLightBackground = contrastColor === '#000000';

  const containerStyle = {
    ...(brandVibe ? {
      background: `linear-gradient(135deg, ${brandVibe.colors[0]} 0%, ${brandVibe.colors[2]} 100%)`,
      fontFamily: brandVibe.font === 'serif' ? 'serif' : brandVibe.font === 'mono' ? 'monospace' : 'sans-serif',
    } : {}),
    '--text-primary': isLightBackground ? '#000000' : '#ffffff',
    '--text-secondary': isLightBackground ? '#404040' : '#a3a3a3', // neutral-700 vs neutral-400
    '--text-tertiary': isLightBackground ? '#525252' : '#737373', // neutral-600 vs neutral-500
    '--card-bg': isLightBackground ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.05)',
    '--card-border': isLightBackground ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)',
    '--input-bg': isLightBackground ? 'rgba(0, 0, 0, 0.05)' : 'rgba(0, 0, 0, 0.4)',
  } as React.CSSProperties;

  return (
    <div 
      className="min-h-screen bg-neutral-950 text-[var(--text-primary)] font-sans selection:bg-fuchsia-500 selection:text-white overflow-x-hidden transition-all duration-1000 ease-in-out"
      style={containerStyle}
    >
      {/* Dynamic Ambient Glow (Global) */}
      {brandVibe && (
        <div className="fixed inset-0 z-0 pointer-events-none transition-opacity duration-1000">
           <div 
            className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full blur-[128px] opacity-20 transition-colors duration-1000"
            style={{ backgroundColor: brandVibe.colors[1] }} 
          />
          <div 
            className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full blur-[128px] opacity-20 transition-colors duration-1000"
            style={{ backgroundColor: brandVibe.accentColor }}
          />
        </div>
      )}

      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-neutral-950/80 backdrop-blur-md border-b border-[var(--card-border)] transition-colors duration-500"
           style={{ 
             backgroundColor: brandVibe ? `${brandVibe.colors[0]}CC` : undefined,
             borderColor: brandVibe ? `${brandVibe.accentColor}33` : undefined,
             color: 'var(--text-primary)'
           }}
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => setCurrentView('hero')}
          >
            <div 
              className="w-10 h-10 bg-gradient-to-tr from-fuchsia-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-fuchsia-500/20 group-hover:shadow-fuchsia-500/40 transition-all duration-300"
              style={brandVibe ? { 
                backgroundImage: `linear-gradient(to top right, ${brandVibe.accentColor}, ${brandVibe.colors[1]})`,
                boxShadow: `0 10px 15px -3px ${brandVibe.accentColor}40`
              } : undefined}
            >
              <Wand2 className="w-6 h-6 text-white" />
            </div>
            <span 
              className="text-xl font-bold tracking-tight bg-clip-text text-transparent"
              style={{ 
                backgroundImage: isLightBackground 
                  ? 'linear-gradient(to right, #000000, rgba(0,0,0,0.6))' 
                  : 'linear-gradient(to right, #ffffff, rgba(255,255,255,0.6))' 
              }}
            >
              {brandVibe ? brandVibe.name : <>GenFashion<span className="font-light">Atelier</span></>}
            </span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-3">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id as any)}
                className={`group flex items-center rounded-full transition-all duration-300 ease-in-out hover:bg-[var(--card-bg)]`}
                style={{
                  color: currentView === item.id && brandVibe ? brandVibe.accentColor : 'var(--text-secondary)',
                  backgroundColor: currentView === item.id && brandVibe ? `${brandVibe.accentColor}20` : undefined
                }}
              >
                <div className="p-2.5">
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out opacity-0 group-hover:opacity-100 whitespace-nowrap">
                  <span className="pr-4 text-sm font-medium">{item.label}</span>
                </span>
              </button>
            ))}
            
            {brandVibe && (
              <>
                <div className="w-px h-8 bg-white/10 mx-2" />
                <button
                  onClick={() => setIsBrandPanelOpen(true)}
                  className="p-3 rounded-full text-white transition-all hover:scale-110 relative group shadow-lg shadow-white/10"
                  style={{ 
                    backgroundColor: brandVibe.accentColor,
                    boxShadow: `0 0 20px ${brandVibe.accentColor}60`
                  }}
                  title="View Brand DNA"
                >
                  <Palette className="w-6 h-6" style={{ color: getContrastText(brandVibe.accentColor) }} />
                  <span className="absolute inset-0 rounded-full animate-ping opacity-75" style={{ backgroundColor: brandVibe.accentColor }} />
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-neutral-400 hover:text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* Brand DNA Side Panel */}
      <AnimatePresence>
        {isBrandPanelOpen && brandVibe && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBrandPanelOpen(false)}
              className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 z-[70] w-80 bg-neutral-900/95 backdrop-blur-xl border-l border-white/10 p-6 shadow-2xl overflow-y-auto"
              style={{ borderColor: `${brandVibe.accentColor}40` }}
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2 text-lg font-bold text-white">
                  <Sparkles className="w-5 h-5" style={{ color: brandVibe.accentColor }} />
                  Brand DNA
                </div>
                <button 
                  onClick={() => setIsBrandPanelOpen(false)}
                  className="p-1 hover:bg-white/10 rounded-full text-neutral-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-8">
                {/* Brand Identity */}
                <div>
                  <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Identity</h3>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="text-2xl font-bold text-white mb-1">{brandVibe.name}</div>
                    <div className="text-sm text-neutral-400 font-mono">vibe_match: 99.8%</div>
                  </div>
                </div>

                {/* Typography */}
                <div>
                  <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Type className="w-3 h-3" /> Typography
                  </h3>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="text-3xl text-white mb-2" style={{ fontFamily: brandVibe.font === 'serif' ? 'serif' : brandVibe.font === 'mono' ? 'monospace' : 'sans-serif' }}>
                      Aa Bb Cc
                    </div>
                    <div className="text-xs text-neutral-500 font-mono capitalize">{brandVibe.font} Family</div>
                    {brandVibe.fonts && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {brandVibe.fonts.map((f, i) => (
                           <span key={i} className="px-2 py-1 bg-white/10 rounded text-[10px] text-neutral-300 font-mono">{f}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Mood & Keywords */}
                {(brandVibe.mood || brandVibe.keywords) && (
                  <div>
                    <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Sparkles className="w-3 h-3" /> Vibe & Keywords
                    </h3>
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-3">
                      {brandVibe.mood && (
                        <div>
                          <div className="text-xs text-neutral-500 mb-1">Core Mood</div>
                          <div className="text-lg font-medium text-white">{brandVibe.mood}</div>
                        </div>
                      )}
                      {brandVibe.keywords && (
                        <div className="flex flex-wrap gap-2">
                          {brandVibe.keywords.map((k, i) => (
                            <span key={i} className="text-xs text-neutral-400">#{k}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Colors */}
                <div>
                  <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Droplet className="w-3 h-3" /> Color Palette
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {brandVibe.colors.map((color, i) => (
                      <div key={i} className="flex items-center gap-3 bg-white/5 rounded-lg p-2 border border-white/5">
                        <div 
                          className="w-10 h-10 rounded-md shadow-lg border border-white/10"
                          style={{ backgroundColor: color }}
                        />
                        <div className="flex-1">
                          <div className="text-xs text-neutral-500 uppercase">Primary {i + 1}</div>
                          <div className="text-sm font-mono text-white">{color}</div>
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center gap-3 bg-white/5 rounded-lg p-2 border border-white/5">
                      <div 
                        className="w-10 h-10 rounded-md shadow-lg border border-white/10"
                        style={{ backgroundColor: brandVibe.accentColor }}
                      />
                      <div className="flex-1">
                        <div className="text-xs text-neutral-500 uppercase">Accent</div>
                        <div className="text-sm font-mono text-white">{brandVibe.accentColor}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-12 pt-6 border-t border-white/10">
                <p className="text-xs text-neutral-500 leading-relaxed">
                  This brand identity was extracted dynamically by Gemini 2.5 Flash and is currently powering the generative engine's style parameters.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-neutral-950 pt-24 px-6 md:hidden"
          >
            <div className="flex flex-col gap-6">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentView(item.id as any);
                    setIsMenuOpen(false);
                  }}
                  className={`flex items-center gap-4 text-lg font-medium ${
                    currentView === item.id 
                      ? 'text-fuchsia-400' 
                      : 'text-neutral-400'
                  }`}
                >
                  <item.icon className="w-6 h-6" />
                  {item.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="pt-20 min-h-screen">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};
