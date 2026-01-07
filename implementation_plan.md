# Implementation Plan - Atelier AI Fixes & Enhancements

This plan outlines the steps to resolve functional bugs, enhance features with brand grounding (PDF integration), and polish the UI/UX.

## 1. Terminology & UI Polishing
- [x] Ensure all instances of "Scraping" are updated to "Scanning" in frontend and backend logs.
- [x] Verify premium UI consistency across all modules.

## 2. Catalog Refinement
- [x] Update `VertexAIService.generate_synthetic_catalog` prompt to explicitly request a mix of garments, accessories, and shoes.
- [x] **New**: Implement AI-powered image generation for each catalog item to avoid empty placeholders.

## 3. Bug Fixes
- [x] **VTO (Fitting Room)**: Debug the `generateVTO` flow. Ensure the backend returns the image correctly and the frontend updates the state. Check for base64 handling issues.
- [x] **Lookbook**: Debug the `api_generate_lookbook` endpoint. Ensure images are correctly passed and the response is handled.
- [x] **Lifestyle Studio**: Identify and fix the error (missing imports for `Download` and `Share2`).

## 4. Brand Grounding (PDF Integration)
- [ ] **Lookbook**: Update `LookbookModule` to pass the PDF content (or the full report text) to the backend. Update `VertexAIService.generate_lookbook_page` to accept this grounding.
- [ ] **Campaign**: Update `PersonalizedCampaignModule` to include the brand report and a selection of products (simulated cart) in the request. Update `VertexAIService.generate_campaign` to use this data.

## 5. PDF Enhancement
- [ ] Update `ScraperService` to extract more meaningful CSS data.
- [ ] Update `PDFGenerator` to include a "CSS/Styling" section in the brand report.

## 6. Verification
- [ ] Start services using `./dev.sh`.
- [ ] Use browser tool to run a full analysis on a target URL (e.g., `vogue.com`).
- [ ] Test each module: Fitting Room, Lookbook, Campaign, Lifestyle Studio.
- [ ] Verify PDF generation and content.
