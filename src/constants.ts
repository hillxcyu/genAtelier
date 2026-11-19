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

import { BrandVibe, CatalogItem, UserPersona } from './types';

export const DEMO_BRAND_VIBE: BrandVibe = {
  name: "Lumina",
  colors: ["#0a0a0a", "#0a0a0a", "#0a0a0a"],
  font: "sans",
  accentColor: "#d946ef",
  mood: "Modern Minimalist",
  keywords: ["Clean", "Sophisticated", "Timeless", "Urban"],
  fonts: ["Inter", "system-ui"]
};

export const DEMO_CATALOG: CatalogItem[] = [
  { id: "demo-1", name: "Structured Wool Coat", category: "Outerwear", price: "$295", imageUrl: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?q=80&w=1000&auto=format&fit=crop" },
  { id: "demo-2", name: "Silk Slip Dress", category: "Dresses", price: "$180", imageUrl: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=1000&auto=format&fit=crop" },
  { id: "demo-3", name: "Cashmere Turtleneck", category: "Knitwear", price: "$150", imageUrl: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=1000&auto=format&fit=crop" },
  { id: "demo-4", name: "Pleated Trousers", category: "Bottoms", price: "$120", imageUrl: "https://images.unsplash.com/photo-1509631179647-0177f4cd6867?q=80&w=1000&auto=format&fit=crop" },
  { id: "demo-5", name: "Leather Tote", category: "Accessories", price: "$350", imageUrl: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=1000&auto=format&fit=crop" }
];

export const MOCK_PERSONAS: UserPersona[] = [
  {
    id: '1',
    name: 'Emma Chen',
    age: 26,
    gender: 'Female',
    location: 'New York, NY',
    stylePreferences: ['Minimalist', 'Sustainable', 'Neutral Tones'],
    shoppingHistory: ['Silk Blouse', 'Wide Leg Trousers'],
    cartItems: [], 
    recommendedItems: [],
    imageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=1000&auto=format&fit=crop'
  },
  {
    id: '2',
    name: 'Marcus Johnson',
    age: 32,
    gender: 'Male',
    location: 'Austin, TX',
    stylePreferences: ['Streetwear', 'Bold Colors', 'Oversized'],
    shoppingHistory: ['Graphic Tee', 'Cargo Pants'],
    cartItems: [], 
    recommendedItems: [],
    imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1000&auto=format&fit=crop'
  },
  {
    id: '3',
    name: 'Sophia Miller',
    age: 45,
    gender: 'Female',
    location: 'London, UK',
    stylePreferences: ['Classic', 'Elegant', 'Tailored'],
    shoppingHistory: ['Trench Coat', 'Cashmere Sweater'],
    cartItems: [], 
    recommendedItems: [],
    imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1000&auto=format&fit=crop'
  }
];
