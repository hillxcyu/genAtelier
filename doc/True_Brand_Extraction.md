# True Brand Extraction Architecture

## Overview
This feature moves **GenFashion Atelier** from a purely generative simulation to a "reality-augmented" platform. The application visits the actual website, reads its content, and uses AI to structure real-world data into our application schema.

## The Pipeline

The extraction process follows a linear pipeline:

1.  **Frontend Request:** The user provides a URL in the `IngestionModule`. The client sends a `POST /api/extract-brand` request to the backend.
2.  **Scraping (The "Eyes"):** The backend fetches the raw HTML and sanitizes it.
3.  **Extraction (The "Brain"):** Vertex AI analyzes the cleaned HTML to infer abstract identity and extract concrete product data.
4.  **Hybrid Generation (The "Fill"):** The frontend uses this real data to populate the UI, falling back to generative placeholders only if extraction fails.

## Component Architecture

### 1. Scraper Service (`server/services/scraper.ts`)
*   **Tech Stack:** `axios` (HTTP client), `cheerio` (HTML parsing).
*   **Responsibility:** Efficiently fetching page content while filtering out noise.
*   **Optimization:**
    *   **Sanitization:** Strips `<script>`, `<style>`, `<iframe>`, and `<svg>` tags to significantly reduce the token count sent to the LLM.
    *   **Raw Output:** Returns the cleaned `<body>` HTML string directly to the extraction service.

### 2. Extractor Service (`server/services/extractor.ts`)
*   **Tech Stack:** Google Vertex AI SDK.
*   **Model:** `gemini-3-flash-preview`.
*   **Responsibility:** Converting unstructured HTML into structured JSON.
*   **The Prompt:**
    *   *Input:* The cleaned HTML string.
    *   *Task:* "Analyze the HTML. Extract the Brand Vibe (Mood, Colors, Fonts) and identifying repeating product patterns to create a catalog."
    *   *Output:* A strict JSON object matching the `BrandAnalysisResult` interface.

### 3. Frontend Integration (`src/utils/brandGenerator.ts`)
*   **Responsibility:** Resilience and User Experience.
*   **Fallback Strategy:**
    *   If the extraction API fails (e.g., strong bot protection), the system handles the error gracefully, potentially falling back to a "simulated" mode or alerting the user.

## Why `gemini-3-flash-preview`?
We selected **Gemini 3 Flash Preview** for the extraction task because:
*   **Context Window:** It can handle the large token counts typical of raw HTML dumps.
*   **Reasoning Capability:** It excels at identifying patterns (like product cards) within nested HTML structures without needing explicit CSS selector rules.