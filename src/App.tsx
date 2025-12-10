/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Hero } from './components/Hero';
import { VTOModule } from './components/VTOModule';
import { IngestionModule } from './components/IngestionModule';
import { LookbookModule } from './components/LookbookModule';
import { ProductToModelModule } from './components/ProductToModelModule';
import { BrandVibe } from './types';

export default function App() {
  const [currentView, setCurrentView] = React.useState<'hero' | 'vto' | 'ingestion' | 'lookbook' | 'product-to-model'>('hero');
  const [brandVibe, setBrandVibe] = useState<BrandVibe | null>(null);

  return (
    <Layout currentView={currentView} setCurrentView={setCurrentView} brandVibe={brandVibe}>
      {currentView === 'hero' && (
        <Hero 
          onNavigate={(view) => setCurrentView(view)} 
          setBrandVibe={setBrandVibe}
          brandVibe={brandVibe}
        />
      )}
      {currentView === 'vto' && <VTOModule />}
      {currentView === 'lookbook' && <LookbookModule brandVibe={brandVibe} />}
      {currentView === 'product-to-model' && <ProductToModelModule />}
      {currentView === 'ingestion' && <IngestionModule setBrandVibe={setBrandVibe} />}
    </Layout>
  );
}
