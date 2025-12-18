# Comprehensive Brand Vibe Extraction Implementation Guide

This document details the architecture and implementation strategy for the **Brand Vibe Extraction** system within the GenFashion Atelier platform. This system is responsible for analyzing a retailer's website to extract its "Brand DNA," which subsequently drives the aesthetic of all generative features (UI theming, marketing copy, and visual style).

## 1. System Overview

The extraction pipeline transforms a raw URL into a structured `BrandVibe` object. It leverages a hybrid approach:
1.  **Static Scraping:** Efficiently fetching raw HTML content.
2.  **Semantic Inference (LLM):** Using Google's Gemini 1.5 Flash (or similar high-speed model) to parse the HTML, identify key visual/textual elements, and synthesize the brand's identity.

### Core Data Structure: `BrandVibe`

The ultimate output is a JSON object adhering to this schema:

```typescript
interface BrandVibe {
  name: string;          // Extracted Brand Name (e.g., "Prada")
  mood: string;          // A short, evocative description (e.g., "Minimalist Luxury")
  colors: string[];      // Array of hex codes representing the primary palette
  accentColor: string;   // A single hex code for buttons/highlights
  font: string;          // A description of the typography style (e.g., "Serif, Modern")
  keywords: string[];    // 5-7 semantic tags (e.g., "chic", "timeless", "leather")
}
```

## 2. Architecture & Data Flow

### Step 1: Client Request
*   **Trigger:** User enters a URL (e.g., `https://www.prada.com`) in the frontend `IngestionModule`.
*   **Action:** Frontend sends a `POST /api/extract-brand` request with the URL.

### Step 2: Backend Orchestration (`server/index.ts` & `server/services/scraper.ts`)
*   **Methods:** `axios` for HTTP requests and `cheerio` for basic DOM manipulation.
*   **Process:** The server validates the URL, fetches static HTML content, strips `<script>`, `<style>`, `<iframe>`, and `<svg>` tags using `cheerio` to reduce token count and noise, and then extracts the cleaned HTML `<body>` content.

### Step 3: AI Extraction (`server/services/extractor.ts`)
*   **Model:** Gemini 1.5 Flash is used for its speed and large context window.
*   **Method:** A carefully engineered prompt instructs the model to act as an expert fashion brand analyst and UI/UX designer. The cleaned HTML content is provided as input.
*   **Directives:** The model is directed to identify dominant colors, infer accent colors, detect typography styles (or infer based on brand prestige), synthesize the brand's mood, and identify repeating product card patterns for catalog extraction.
*   **Output Format:** Strict JSON, adhering to the `BrandVibe` and `CatalogItem` schemas.

### Step 4: Product Catalog Extraction (Parallel)
*   **Method:** The AI is instructed to identify and return a `catalog` array containing product details alongside the `brandVibe`.
*   **Heuristics:** The model specifically looks for repeating HTML structures indicative of product listings (e.g., `div` elements containing images, names, and prices).

---
*Created by Gemini CLI - 18 Dec 2025*