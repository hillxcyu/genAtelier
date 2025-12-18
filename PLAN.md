# Plan: Phase 1.1 - True Brand Extraction (Web Scraping)

## Objective
Replace the current simulated brand ingestion (which relies purely on LLM hallucination) with a real-time web scraper. This will allow the application to extract actual product images, names, and pricing from a user-provided URL, processing the raw HTML with Vertex AI to structure the data into our schema.

## Architecture Changes

### Backend (`server/`)
1.  **Dependencies:** Add `axios` (or `node-fetch`) and `cheerio` for lightweight HTML parsing. (Avoiding `puppeteer` for now to keep the container lightweight for Cloud Run, unless dynamic JS rendering is strictly required).
2.  **New Endpoint:** `POST /api/extract-brand`
    *   **Input:** `{ url: string }`
    *   **Process:**
        1.  Fetch HTML content from the URL.
        2.  Use `cheerio` to extract potential product containers (images, headers, price text).
        3.  Construct a prompt for Vertex AI (Gemini 2.5 Flash) containing the raw extracted text/image URLs.
        4.  Gemini output: A structured JSON matching our `BrandAnalysisResult` interface (colors, fonts, mood, catalog items).
    *   **Output:** JSON object with `BrandVibe` and `CatalogItem[]`.

### Frontend (`src/`)
1.  **API Client:** Update `src/utils/brandGenerator.ts` to call the new `/api/extract-brand` endpoint instead of calling Vertex AI directly for the *extraction* phase.
2.  **Fallback:** Maintain the current LLM-only generation as a fallback if the scraper fails (e.g., due to bot protection on the target site).

## Implementation Steps

### 1. Server Setup
- [ ] Install `axios` and `cheerio` in `server/`.
- [ ] Create `server/scraper.ts` service module.
- [ ] Implement `fetchSiteData(url)` function to get raw HTML.
- [ ] Implement `extractContent(html)` using Cheerio to find likely content blocks (focusing on `img`, `h1-h6`, `span` with currency symbols).

### 2. AI Integration (Server-Side)
- [ ] Update `server/index.ts` to include the new endpoint.
- [ ] Construct a robust prompt for Gemini:
    *   *Input:* "Here is a list of image URLs and text snippets extracted from a fashion retailer's website..."
    *   *Task:* "Identify the brand identity (colors, mood) and identifying actual product items. Filter out icons/logos. Return JSON."

### 3. Frontend Integration
- [ ] Modify `src/utils/brandGenerator.ts`:
    *   Switch from `generateContent` (direct LLM) to `fetch('/api/extract-brand')`.
    *   Handle the response to populate `brandVibe` and `catalog`.
- [ ] Test with real URLs (e.g., Zara, H&M, or smaller boutiques).

### 4. Deployment
- [ ] Update `Dockerfile` if any new system dependencies are needed (none expected for `cheerio`).
- [ ] Deploy to Cloud Run.

## Risk Mitigation
*   **Bot Protection:** Many major retailer sites block simple scrapers.
    *   * mitigation:* If the fetch fails (403/401), we silently catch the error and fall back to the existing "hallucination" mode (Generative simulation), ensuring the user always gets *a* result.
*   **Latency:** Scraping + LLM processing might take 10-15s.
    *   *mitigation:* The existing `Notification` component is already set up to handle long-running processes. We will emit granular progress updates.
