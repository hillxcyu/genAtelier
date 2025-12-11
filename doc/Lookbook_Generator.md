# Automated Lookbook Generator

The **Lookbook Generator** automates the creation of high-fashion editorial content, turning a collection of individual product shots into a cohesive seasonal campaign.

## Core Functionality

1.  **Collection Management:**
    *   Users upload multiple product images or select a range from the Brand Catalog.
    *   The system groups these items into "pages" (typically 1-2 items per page).

2.  **Editorial Layout Generation:**
    *   **Gemini 3 Pro** is used to generate full-page layouts.
    *   **Directives:** The AI is instructed to use asymmetrical, artistic layouts (avoiding simple grids) and to treat the output as a scanned page from a high-end fashion magazine (e.g., Vogue).
    *   **Branding:** The brand's specific fonts and color palette are applied to the background and typography of the generated page.

3.  **PDF Export:**
    *   The generated pages are compiled into a downloadable PDF document, ready for distribution.

## Technical Implementation
*   **Model:** `gemini-3-pro-image-preview` (Required for high-resolution text rendering and complex layouts).
*   **Aspect Ratio:** Generates `3:4` vertical editorial images.
*   **Library:** `jspdf` is used to stitch the generated images into a multi-page PDF.
