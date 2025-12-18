# Brand Ingestion & DNA Analysis

The **Brand Ingestion** module is the entry point of the GenFashion Atelier. Its primary purpose is to instantly "calibrate" the entire generative engine to match a specific brand's aesthetic identity.

## Core Functionality

1.  **URL Analysis:**
    *   The user provides a retailer URL (e.g., `gucci.com`).
    *   The system uses **Semantic Inference** (powered by Gemini 2.5 Flash) to analyze the brand's public identity without scraping HTML.

2.  **Identity Extraction:**
    *   **Visuals:** Extracts a color palette (Primary, Secondary, Accent) and determines the font category (Serif, Sans, Mono).
    *   **Vibe:** Derives a "Mood" (e.g., "Eclectic Maximalism") and descriptive keywords.
    *   **Catalog:** "Hallucinates" or retrieves a representative list of products (names, prices, categories) to populate the demo environment.

3.  **Global Theming:**
    *   Once analyzed, the application's UI transforms in real-time.
    *   **CSS Variables:** Text colors, background gradients, and button styles are updated to match the extracted brand palette.
    *   **Context Injection:** The extracted "Brand DNA" is passed as context to all subsequent generative tasks (VTO, Lookbooks, etc.), ensuring every AI-generated image feels "on-brand."

## Technical Implementation
*   **Model:** `gemini-3-flash-preview` for JSON extraction.
*   **Image Generation:** `gemini-2.5-flash-image` is used to generate placeholder product images for the "scraped" catalog if real images aren't available.
*   **State Management:** The `BrandVibe` object is stored in the global React state and persisted during the session.
