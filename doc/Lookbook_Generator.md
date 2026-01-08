### **Phase A: Director's Mode & Draft (Logic & Strategy)**
*   **User Action:** Selects a pool of products and enters "Director's Mode" in the sidebar.
*   **Director's Controls (Global Configuration):**
    *   **Curatorial Strategy:** Defines how items are grouped (e.g., By Color, By Occasion, By Outfit, Eclectic).
    *   **Visual Direction:** Sets default Layout (Grid/Editorial/Hero), Lighting (Studio/Golden Hour/Moody), Mood, Color Strategy (Monochromatic/Contrast), and Typography.
    *   **Narrative:** Defines a global "Campaign Theme" to guide the AI's creative direction.
*   **AI Process (`gemini-3-flash`):**
    *   Analyzes products and organizes them into pages based on the Curatorial Strategy.
    *   Drafts a `Storyboard` where each page is assigned a specific Layout, Lighting, Mood, Slogan (headline), and Caption based on the Director's configuration.
*   **Output:** A structured, editable Storyboard.

### **Phase B: Storyboard Editor (Refinement & Organization)**
*   **UI:** An interactive workspace displaying the drafted pages and an "Unassigned Items" dock.
*   **Capabilities:**
    *   **Granular Control:** Adjust Layout, Lighting, Mood, Slogans, and Captions for *each* individual page. Toggle text visibility.
    *   **Flexible Organization (Click-to-Move):** 
        *   Click items to move them between pages.
        *   Remove items from pages to send them to the **Unassigned Items Dock**.
        *   Add new items from the Dock to any page.
    *   **Page Management:** Create new blank pages manually or delete existing ones.

### **Phase C: Production (High-Fidelity Rendering)**
*   **User Action:** Clicks "Render All Pages" (or exports as PDF).
*   **AI Process (`gemini-3-pro-image`):**
    *   Concurrently processes each page in the Storyboard.
    *   Generates high-fidelity, photo-realistic editorial images that strictly adhere to the specific Layout, Lighting, Mood, and Text directives defined in the Editor.
    *   **Incremental Updates:** UI cards update from "Draft" status to the final rendered image in real-time as each page completes.