# DEFINE: Implementation Tasks for AI Storyboard

## [Frontend] State & Types
- [ ] **Define Interfaces:** `StoryboardPage`, `PageConfig`, `CuratorialStrategy`.
- [ ] **State Management:** Add `storyboard` (array of pages) and `viewMode` ('selection' | 'storyboard') to `LookbookModule`.

## [Logic] The "Drafter" Service (Gemini Flash)
- [ ] **Implement `draftStoryboard`:**
    *   Input: `selectedItems`, `groupingStrategy`, `globalConfig`.
    *   Prompt: "Group these items into pages based on [Strategy]. Return JSON with item IDs assigned to pages, plus a suggested layout and caption for each page."
    *   Parsing: Convert the AI response into the `StoryboardPage[]` state.

## [Frontend] The Storyboard Editor UI
- [ ] **"Drafting" Controls:** Add the "Curatorial Strategy" selector to the initial selection view.
- [ ] **Storyboard Grid:** Create a view that displays the list of `StoryboardPage` objects.
- [ ] **Page Card Component:**
    *   Display thumbnails of items on that page.
    *   Show/Edit Layout and Vibe dropdowns (per page).
    *   Show/Edit Caption input.
    *   "Render Page" button (or global Render).

## [Logic] The Renderer
- [ ] **Refactor `generateLookbook`:**
    *   Update it to accept `StoryboardPage[]` instead of raw chunks.
    *   Iterate through the pages, generating only those marked for rendering.
    *   Use the *page-specific* config for the prompt, overriding global defaults if needed.
