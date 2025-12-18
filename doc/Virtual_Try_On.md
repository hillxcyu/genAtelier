# Virtual Try-On (VTO)

The **Virtual Try-On** module allows customers to visualize how garments will look on their own bodies, reducing purchase anxiety and return rates. It now features an intelligent styling assistant that recommends complete outfits.

## Core Functionality

1.  **Dual Input System:**
    *   **User Photo:** Users upload a full-body photo of themselves.
    *   **Garment Source:** Users can upload a flat-lay/ghost mannequin image OR select an item directly from the ingested Brand Catalog via a slide-out drawer.

2.  **AI Styling Assistant ("Complete the Look"):**
    *   **Auto-Recommendations:** As soon as a garment is selected, the AI analyzes it and suggests 3 matching items from the brand's catalog (e.g., shoes, bags, accessories).
    *   **Multi-Item Selection:** Users can select multiple recommended items to build a full outfit.
    *   **Contextual Reasoning:** Each suggestion comes with a brief "stylist note" explaining why it pairs well with the main garment.

3.  **Generative Fitting:**
    *   **Multi-Item VTO:** The system generates a single cohesive image showing the user wearing the main garment AND any selected accessories.
    *   **Fidelity:** It respects the user's pose, lighting, and body shape while preserving the texture and drape of all items.

4.  **Sharing:**
    *   Generated results can be instantly shared via the native Web Share API or copied to the clipboard.

## Technical Implementation
*   **VTO Model:** `gemini-3-pro-image-preview` is used for high-fidelity image generation, capable of handling complex multi-item prompts.
*   **Styling Model:** `gemini-3-flash-preview` analyzes the garment image and queries the JSON catalog to return structured recommendations.
*   **Prompt Engineering:** 
    *   *Styling:* "Analyze this garment and pick 3 matching items from this JSON list..."
    *   *VTO:* "Generate a photorealistic image of person A wearing garment B and accessories C, D..."
*   **UX Features:**
    *   **Magic Trigger:** A central, pulsing "Sparkles" button serves as the primary call-to-action.
    *   **Slide-out Drawer:** Provides a seamless browsing experience for the product catalog.
    *   **Auto-Refresh:** Suggestions automatically update when the main garment is changed.
*   **Privacy:** Images are processed in memory and not permanently stored on the server.
