# Brand Ingestion & DNA Analysis

The **Brand Ingestion** module is the entry point of the GenFashion Atelier. Its primary purpose is to instantly "calibrate" the entire generative engine to match a specific brand's aesthetic identity by analyzing its live website.

## Core Functionality

1.  **URL Scraping:**
    *   The user provides a retailer URL (e.g., `gucci.com`).
    *   The backend retrieves the live HTML content using a lightweight scraping mechanism (`axios` + `cheerio`).

2.  **Identity Extraction:**
    *   **AI Analysis:** The raw HTML is fed into **Gemini 3 Flash Preview**, which acts as an expert design analyst.
    *   **Visuals:** Extracts a color palette (Primary, Secondary, Accent) and determines the font category from CSS classes and style tags.
    *   **Vibe:** Derives a "Mood" (e.g., "Eclectic Maximalism") and semantic keywords based on the site's copy and structure.
    *   **Real Catalog:** Identifies and extracts real products (names, prices, images) from the HTML structure, populating the demo environment with actual brand inventory.

3.  **Global Theming:**
    *   Once analyzed, the application's UI transforms in real-time.
    *   **CSS Variables:** Text colors, background gradients, and button styles are updated to match the extracted brand palette.
    *   **Context Injection:** The extracted "Brand DNA" is passed as context to all subsequent generative tasks (VTO, Lookbooks, etc.), ensuring every AI-generated image feels "on-brand."

## Technical Implementation
*   **Scraper:** Lightweight backend service that fetches HTML and strips non-essential tags (scripts, iframes).
*   **Model:** `gemini-3-flash-preview` for high-speed HTML analysis and JSON extraction.
*   **State Management:** The `BrandVibe` object is stored in the global React state and persisted during the session.