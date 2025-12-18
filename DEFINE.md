# Definition: Phase 1.1 - True Brand Extraction

## TODO List

### Backend (`server/`)
- [ ] **Install Dependencies:**
    - `npm install axios cheerio` in `server/` directory.
- [ ] **Create Scraper Service (`server/services/scraper.ts`):**
    - Implement `scrapeWebsite(url: string)`:
        - Validate URL.
        - Fetch HTML using `axios`.
        - Load into `cheerio`.
        - Extract metadata (title, description).
        - Extract all image URLs (`<img src>`) and filter for likely product images (size/aspect ratio checks if possible, or just gather top 20).
        - Extract visible text content (headers, paragraphs).
        - Return a `ScrapedData` object.
- [ ] **Create Extraction Logic (`server/services/extractor.ts`):**
    - Implement `processWithGemini(scrapedData)`:
        - Construct a prompt including the scraped metadata and text chunks.
        - Call `ai.models.generateContent` (Gemini 2.5 Flash).
        - Enforce JSON output schema matching `BrandAnalysisResult`.
- [ ] **Add API Route (`server/index.ts`):**
    - Add `POST /api/extract-brand`.
    - Call `scraper.scrapeWebsite`.
    - Call `extractor.processWithGemini`.
    - Return the structured JSON.

### Frontend (`src/`)
- [ ] **Update Generator Utility (`src/utils/brandGenerator.ts`):**
    - Modify `generateBrandAndCatalog` to attempt fetching from `/api/extract-brand` first.
    - If the API call returns successfully, map the response to the `BrandVibe` and `CatalogItem[]` structures.
    - If the API call fails (or returns a specific "blocked" code), fall back to the existing pure-generative logic.
- [ ] **Error Handling:**
    - Ensure the `Notification` system reports "Scraping website..." -> "Analyzing content..." -> "Finalizing...".

### Verification
- [ ] **Local Test:** Run `npm run server` and `npm run dev`. Test with a known "friendly" URL.
- [ ] **Fallback Test:** Test with a URL known to block scrapers (or a fake URL) to ensure the fallback generator kicks in.
