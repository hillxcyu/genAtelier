# DEFINE: Implementation Tasks for Director's Mode

## [Frontend] UI & State Management
- [ ] **Define `LookbookConfig` Interface:** Create a TypeScript interface for the new settings (layout, lighting, color, slogan).
- [ ] **Create Configuration Panel Component:**
    - [ ] Add a collapsible "Director's Controls" section in `LookbookModule.tsx`.
    - [ ] Implement Layout Selector (Grid, Editorial, Hero, Collage).
    - [ ] Implement Lighting/Vibe Selector (Studio, Golden Hour, Moody).
    - [ ] Implement Campaign Slogan input field.
- [ ] **State Wiring:** Connect the UI inputs to the local component state `config`.

## [Logic] Prompt Engineering & Integration
- [ ] **Refactor `generateLookbook` Function:**
    - [ ] Update function signature or closure to access the `config` state.
    - [ ] Implement a **Prompt Builder** logic that conditionally adds directives based on `config`.
    - [ ] **Layout Directive:** "Strict grid alignment" vs "Asymmetrical overlapping".
    - [ ] **Lighting Directive:** "Bright studio lighting" vs "Warm sunset glow".
    - [ ] **Text Directive:** Ensure the slogan is explicitly requested in the image generation text.

## [Testing] Verification
- [ ] **Layout Test:** Generate 4 pages, one for each layout type, and verify visual distinction.
- [ ] **Lighting Test:** Verify "Golden Hour" produces warm tones vs "Studio" cool/neutral tones.