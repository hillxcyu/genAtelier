# True Brand Extraction Architecture

## Overview
This feature moves **GenFashion Atelier** from a purely generative simulation to a "reality-augmented" platform. The application visits the actual website, reads its content, and uses AI to structure real-world data into our application schema.

## The Pipeline

The extraction process follows a multi-stage pipeline, designed for robustness against modern web challenges:

1.  **Frontend Request:** The user provides a URL in the `IngestionModule`. The client sends a `POST /api/extract-brand` request to the backend.
2.  **Scraping (The "Eyes"):** The backend employs a two-stage scraping strategy:
    *   **Initial Fetch (Axios):** A fast, lightweight attempt to fetch static HTML.
    *   **Intelligent Fallback (Puppeteer Stealth):** If the initial fetch encounters anti-bot blocks (403/429) or detects an empty JavaScript shell, it seamlessly retries using a dedicated headless browser with stealth capabilities.
3.  **Extraction (The "Brain"):** Vertex AI analyzes the cleaned, fully rendered HTML to infer abstract identity and extract concrete product data.
4.  **Hybrid Generation (The "Fill"):** The frontend uses this real data to populate the UI, falling back to generative placeholders only if extraction fails entirely.

## Component Architecture

### 1. Scraper Orchestrator (`server/services/scraper.ts`)
*   **Responsibility:** This module orchestrates the scraping process. It first attempts a quick static fetch using `axios`.
    *   **Detection:** It includes logic to detect "soft blocks" (interstitial pages from anti-bot systems that return 200 OK) and empty JavaScript SPA shells (low text/image content).
    *   **Fallback:** If a block or empty shell is detected, or if the `axios` request fails with a 403/429 status, it intelligently falls back to requesting the content from the `Stealth Scraper Service`.
*   **Optimization:** Sanitizes HTML (strips `<script>`, `<style>` etc.) received from either source before passing to the LLM.

### 2. Stealth Scraper Service (`scraper-service/index.js`)
*   **Tech Stack:** `express` (for API endpoint), `puppeteer`, `puppeteer-extra`, `puppeteer-extra-plugin-stealth` (for anti-detection).
*   **Responsibility:** Runs a headless Chrome browser to navigate to the target URL, execute JavaScript, and bypass advanced anti-bot protections. It is designed to emulate a real user browsing the web.
*   **Deployment:** Runs as a separate Docker container (locally via `docker-compose`) or as a dedicated service (e.g., another Cloud Run service in production).
*   **Optimization:** Blocks unnecessary resources (images, fonts, CSS) during navigation to speed up scraping and reduce resource consumption, as only the raw HTML content is needed.

### 3. Extractor Service (`server/services/extractor.ts`)
*   **Tech Stack:** Google Vertex AI SDK.
*   **Model:** `gemini-3-flash-preview`.
*   **Responsibility:** Converting the unstructured HTML (from either scraping stage) into structured JSON. This includes inferring the brand vibe and extracting product details.
*   **The Prompt:**
    *   *Input:* The cleaned, fully rendered HTML string.
    *   *Task:* "Analyze the HTML. Extract the Brand Vibe (Mood, Colors, Fonts) and identifying repeating product patterns to create a catalog."
    *   *Output:* A strict JSON object matching the `ExtractionResult` interface, including the new `BrandPalette` structure.

### 4. Frontend Integration (`src/utils/brandGenerator.ts`)
*   **Responsibility:** Resilience and User Experience.
*   **Fallback Strategy:** If **all** scraping and extraction attempts fail (even the stealth scraper), the system now intelligently falls back to a "Semantic Inference (Hallucination)" mode, where Gemini attempts to infer brand details solely from the URL and title, ensuring a graceful user experience.

## Why `gemini-3-flash-preview`?
We selected **Gemini 3 Flash Preview** for the extraction task because:
*   **Context Window:** It can handle the large token counts typical of raw HTML dumps.
*   **Reasoning Capability:** It excels at identifying patterns (like product cards) within nested HTML structures without needing explicit CSS selector rules.
*   **JSON Mode:** Provides reliable, strictly formatted JSON output directly, simplifying parsing.