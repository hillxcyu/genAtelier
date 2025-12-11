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

export default function App() {
  const [currentView, setCurrentView] = React.useState<'hero' | 'vto' | 'ingestion' | 'lookbook' | 'product-to-model' | 'campaign'>('hero');
  const [brandVibe, setBrandVibe] = useState<BrandVibe | null>(null);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const savedCatalog = await getCatalogFromDB();
        if (savedCatalog && savedCatalog.length > 0) {
          setCatalog(savedCatalog);
        }
      } catch (err) {
        console.error('Failed to load catalog from DB:', err);
      }
    };
    loadCatalog();
  }, []);

  return (
    <Layout currentView={currentView} setCurrentView={setCurrentView} brandVibe={brandVibe}>
      {currentView === 'hero' && (
        <Hero 
          onNavigate={(view) => setCurrentView(view)} 
          setBrandVibe={setBrandVibe}
          setCatalog={setCatalog}
          brandVibe={brandVibe}
        />
      )}
      {currentView === 'vto' && <VTOModule brandVibe={brandVibe} catalog={catalog} />}
      {currentView === 'lookbook' && <LookbookModule brandVibe={brandVibe} catalog={catalog} />}
      {currentView === 'product-to-model' && <ProductToModelModule brandVibe={brandVibe} catalog={catalog} />}
      {currentView === 'campaign' && <PersonalizedCampaignModule brandVibe={brandVibe} catalog={catalog} />}
      {currentView === 'ingestion' && <IngestionModule setBrandVibe={setBrandVibe} setCatalog={setCatalog} />}
    </Layout>
  );
}
