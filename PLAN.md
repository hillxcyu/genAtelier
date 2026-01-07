# PLAN: Advanced Editorial Control Module ("Director's Mode")

**Goal:** Transform the Lookbook Generator from a simple image compositor into a professional **Campaign Art Direction Tool**. Give retailers granular control over layout, lighting, and narrative elements to ensure generated assets match specific seasonal campaign goals.

## 1. The "Director's Mode" UI (Frontend)
Introduce a collapsible configuration panel in `LookbookModule.tsx` that exposes three key dimensions of control:

### A. Layout Archetypes (Structure)
*   **"The Catalog Grid":** Clean, symmetrical, product-focused. (e.g., E-commerce listings)
*   **"The Editorial Asymmetry":** Overlapping, dynamic sizing, artistic whitespace. (e.g., Vogue/Campaigns)
*   **"The Hero & Details":** One dominant full-shot + detailed close-ups. (e.g., Product Launches)
*   **"The Mood Collage":** Scrapbook style, mixed media vibe. (e.g., Social Media/Streetwear)

### B. Chromatic & Atmospheric Control (Vibe)
*   **Color Strategy:** Monochromatic, High Contrast, or Minimalist/Neutral.
*   **Lighting Simulation:** High-Key (Studio), Golden Hour (Natural), or Moody/Noir (Dramatic).

### C. Narrative Elements (Story)
*   **Campaign Slogan:** Text input for specific campaign themes (e.g., "Summer Escapism").
*   **Typography Style:** Toggle between Minimal (Info only) vs. Editorial (Headlines/Quotes).

## 2. AI Logic & Prompt Engineering (Backend Integration)
*   **Structured Prompt Builder:** Refactor the prompt generation logic to ingest these new parameters.
*   **Dynamic Directives:** Inject specific constraints based on the user's selection (e.g., *If Layout="Grid" -> "Enforce strict alignment"*).
*   **Context Passing:** Ensure the chosen "Campaign Slogan" is effectively integrated into the visual composition logic.

## 3. Execution Strategy
1.  **Refactor State:** Update `LookbookModule` to hold a complex `LookbookConfig` state.
2.  **Build Controls:** Implement the UI controls (Selects/Toggles) using the existing Glassmorphism style.
3.  **Update Generator:** Rewrite the `generateLookbook` function to utilize the config state in the prompt.
4.  **Test:** Verify that changing parameters actually yields visibly different results from the AI.