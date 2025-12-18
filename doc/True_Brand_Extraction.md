# True Brand Extraction Architecture

## Overview
This feature moves **GenFashion Atelier** from a purely generative simulation to a "reality-augmented" platform. Instead of hallucinating a brand's identity based solely on its URL string, the application now visits the actual website, reads its content, and uses AI to structure real-world data into our application schema.

## The Pipeline

The extraction process follows a linear pipeline:

1.  **Frontend Request:** The user provides a URL in the `IngestionModule`. The client sends a `POST /api/extract-brand` request to the backend.
2.  **Scraping (The "Eyes"):** The backend fetches the raw HTML and extracts raw signals.
3.  **Extraction (The "Brain"):** Vertex AI analyzes the raw signals to infer abstract identity and concrete product data.
4.  **Hybrid Generation (The "Fill"):** The frontend merges this real data, using Generative AI only to fill gaps (e.g., missing product images).

## Component Architecture

### 1. Scraper Service (`server/services/scraper.ts`)
*   **Tech Stack:** `axios` (HTTP client), `cheerio` (HTML parsing).
*   **Responsibility:** Efficiently fetching page content while filtering out noise.
*   **Key Logic:**
    *   **Image Filtering:** It extracts `<img>` tags but filters out obvious UI elements (icons, logos, SVGs) to prioritize product photography.
    *   **Text Chunking:** It aggregates meaningful text blocks (`h1`-`h3`, `p`, `span`) to capture product names, pricing, and brand voice.

### 2. Extractor Service (`server/services/extractor.ts`)
*   **Tech Stack:** Google Vertex AI SDK.
*   **Model:** `gemini-3-flash-preview`.
*   **Responsibility:** Converting unstructured noise into structured JSON.
*   **The Prompt:**
    *   *Input:* "Here is the website title, description, 15 sample image URLs, and 50 text chunks..."
    *   *Task:* "Infer the Brand Vibe (Mood, Colors, Fonts) and identify a list of products."
    *   *Output:* A strict JSON object matching the `BrandAnalysisResult` interface.

### 3. Frontend Integration (`src/utils/brandGenerator.ts`)
*   **Responsibility:** Resilience and User Experience.
*   **Fallback Strategy:**
    *   If the API call fails (e.g., due to bot protection), it silently falls back to the legacy "hallucination" mode, ensuring the user is never blocked.
    *   If the scraper finds products but no valid images, the frontend uses `gemini-2.5-flash-image` to generate synthetic product shots that match the extracted name and category.

## Why `gemini-3-flash-preview`?
We selected **Gemini 3 Flash Preview** for the extraction task because:
*   **Speed:** It offers low latency, which is critical for an interactive "loading" state.
*   **Reasoning Capability:** It excels at extracting structured entities from unstructured text and inferring context (the "Vibe") from disparate data points.

## Future Improvements
*   **Headless Browser:** Migrating from `cheerio` to `puppeteer` to handle Single Page Applications (SPAs) that require JavaScript to render content.
*   **Proxy Rotation:** Implementing proxy integration to bypass stricter bot detection on major retailer sites.
