# PLAN: AI Storyboard Workflow (The "Director's Cut")

**Goal:** Evolve the Lookbook Generator from a simple batch processor into a **Storyboard-First Workflow**. Enable retailers to "Draft" a campaign outline, review AI-suggested product groupings and layouts, and refine the narrative *before* committing to the final high-fidelity render.

## 1. The Workflow: Draft -> Edit -> Render

### Phase A: The Draft (Logic & Organization)
*   **User Action:** Selects a pool of products (e.g., 20 items).
*   **Configuration:** User selects a global **"Curatorial Strategy"**:
    *   *By Color:* Monochromatic grouping.
    *   *By Occasion:* "Work", "Party", "Casual".
    *   *By Outfit:* Complete looks (Top+Bottom).
    *   *By Category:* Merchandising view.
*   **AI Process (`gemini-3-flash`):**
    *   Analyzes the selected items.
    *   Groups them into pages based on the strategy.
    *   Assigns a specific **Layout** and **Caption** to each page.
    *   **Output:** A structured `Storyboard` (List of Pages).

### Phase B: The Editor (Visual Board)
*   **UI:** A grid of "Page Cards" representing the lookbook outline.
*   **Capabilities:**
    *   **Visual Preview:** See which items are on which page.
    *   **Per-Page Settings:** Override the AI's chosen Layout, Vibe, or Caption for *specific* pages.
    *   **Re-Organization:** Drag and drop items between pages (or remove pages entirely).

### Phase C: The Production (High-Fidelity Render)
*   **User Action:** Click "Render Storyboard".
*   **AI Process (`gemini-3-pro-image`):**
    *   Iterates through the approved Storyboard.
    *   Generates high-res editorial images, respecting the specific *per-page* configuration.
    *   Updates the UI card from "Draft View" to "Final Image View" as they complete.

## 2. Data Structure: `LookbookStoryboard`

```typescript
interface StoryboardPage {
  id: string;
  items: CatalogItem[];
  config: {
    layout: 'grid' | 'editorial' | 'hero' | 'collage';
    vibe: 'studio' | 'golden_hour' | 'moody';
    caption: string;
  };
  status: 'draft' | 'rendering' | 'completed';
  resultUrl?: string;
}
```

## 3. Execution Strategy
1.  **Refactor State:** Introduce the `Storyboard` mode and state objects in `LookbookModule`.
2.  **Implement "Drafter":** Create the `draftStoryboard` function using Gemini Flash to generate the JSON outline.
3.  **Build Editor UI:** Create the "Page Card" component with configuration controls and product thumbnails.
4.  **Update Renderer:** Modify `generateLookbook` to process the `StoryboardPage` objects.
