/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Hero } from './components/Hero';
import { VTOModule } from './components/VTOModule';
import { IngestionModule } from './components/IngestionModule';
import { LookbookModule } from './components/LookbookModule';
import { ProductToModelModule } from './components/ProductToModelModule';
import { PersonalizedCampaignModule } from './components/PersonalizedCampaignModule';
import { BrandVibe, CatalogItem } from './types';
import { getCatalogFromDB } from './utils/db';
import { generateBrandAndCatalog } from './utils/brandGenerator';
import { Notification } from './components/Notification';
import { DEMO_BRAND_VIBE, DEMO_CATALOG } from './constants';

export default function App() {
  const [currentView, setCurrentView] = React.useState<'hero' | 'vto' | 'ingestion' | 'lookbook' | 'product-to-model' | 'campaign'>('hero');
  const [brandVibe, setBrandVibe] = useState<BrandVibe | null>(null);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [ingestionUrl, setIngestionUrl] = useState('');
  const [isIngesting, setIsIngesting] = useState(false);
  const [notification, setNotification] = useState<{ message: string, isVisible: boolean, type: 'info' | 'success' | 'error' }>({
    message: '',
    isVisible: false,
    type: 'info'
  });

  const showNotification = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setNotification({ message, isVisible: true, type });
    if (type !== 'info') {
      setTimeout(() => setNotification(prev => ({ ...prev, isVisible: false })), 5000);
    }
  };

  const handleBrandAnalysis = async (url: string) => {
    if (!url) return;
    setIsIngesting(true);
    setIngestionUrl(url); // Persist URL
    
    showNotification('Initializing Brand Analysis...', 'info');

    try {
      const result = await generateBrandAndCatalog(
        url,
        (progress) => {
          showNotification(progress, 'info');
        },
        (vibe) => {
          setBrandVibe(vibe);
        },
        (newCatalog) => {
          setCatalog(newCatalog);
        }
      );

      // Final complete
      if (result.catalog.length > 0) {
        setCatalog(result.catalog);
      }
      showNotification('Brand analysis complete! Welcome to your studio.', 'success');

    } catch (error) {
      console.error("Analysis failed", error);
      showNotification('Analysis failed. Using fallback config.', 'error');
      // Fallback logic could go here or be handled by the caller, 
      // but App.tsx is the best place to set fallback state.
      setBrandVibe(DEMO_BRAND_VIBE);
    } finally {
      setIsIngesting(false);
    }
  };

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const savedCatalog = await getCatalogFromDB();
        if (savedCatalog && savedCatalog.length > 0) {
          setCatalog(savedCatalog);
        } else {
          // If no catalog, trigger background generation for demo brand
          showNotification('Initializing background generation...', 'info');
          
          try {
            // We generate catalog but NOT automatically apply the vibe (per user request), 
            // unless we want to populate the "Lumina" vibe internally but not show it?
            // Actually, the user said: "sample catalog items didn't get generated. Make sure the catalog items are generated... Do not automatically apply Lumina brandvibe"
            // So we generate the catalog items and set them, but maybe keep brandVibe null?
            // generateBrandAndCatalog returns { brandVibe, catalog }.
            
            const result = await generateBrandAndCatalog(
              'https://lumina-fashion-demo.com', // Pseudo URL for demo
              (progress) => setNotification({ message: progress, isVisible: true, type: 'info' }),
              undefined, // No brand vibe callback for background init
              (newCatalog) => setCatalog(newCatalog)
            );

            setCatalog(result.catalog);
            // We do NOT setBrandVibe(result.brandVibe) here based on previous instructions to keep it null by default.
            
            showNotification('Demo catalog generated successfully.', 'success');
            
          } catch (genErr) {
            console.error("Background generation failed:", genErr);
            setCatalog(DEMO_CATALOG); // Fallback to static
            showNotification('Generation failed. Loaded static demo data.', 'error');
          }
        }
      } catch (err) {
        console.error('Failed to load catalog from DB:', err);
        setCatalog(DEMO_CATALOG);
      }
    };
    loadCatalog();
  }, []);

  return (
    <Layout currentView={currentView} setCurrentView={setCurrentView} brandVibe={brandVibe}>
      <Notification 
        message={notification.message} 
        isVisible={notification.isVisible} 
        type={notification.type} 
        onClose={() => setNotification(prev => ({ ...prev, isVisible: false }))}
      />
      {currentView === 'hero' && (
        <Hero 
          onNavigate={(view) => setCurrentView(view)} 
          setBrandVibe={setBrandVibe}
          setCatalog={setCatalog}
          brandVibe={brandVibe}
          showNotification={showNotification}
          onAnalyze={handleBrandAnalysis}
          isAnalyzing={isIngesting}
          currentUrl={ingestionUrl}
          setUrl={setIngestionUrl}
        />
      )}
      {currentView === 'vto' && <VTOModule brandVibe={brandVibe} catalog={catalog} />}
      {currentView === 'lookbook' && <LookbookModule brandVibe={brandVibe} catalog={catalog} />}
      {currentView === 'product-to-model' && <ProductToModelModule brandVibe={brandVibe} catalog={catalog} />}
      {currentView === 'campaign' && <PersonalizedCampaignModule brandVibe={brandVibe} catalog={catalog} />}
      {currentView === 'ingestion' && (
        <IngestionModule 
          brandVibe={brandVibe}
          catalog={catalog}
          url={ingestionUrl}
          setUrl={setIngestionUrl}
          onAnalyze={handleBrandAnalysis}
          isAnalyzing={isIngesting}
        />
      )}
    </Layout>
  );
}
