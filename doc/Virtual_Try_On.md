# Virtual Try-On (VTO)

The **Virtual Try-On** module allows customers to visualize how garments will look on their own bodies, reducing purchase anxiety and return rates.

## Core Functionality

1.  **Dual Input System:**
    *   **User Photo:** Users upload a full-body photo of themselves.
    *   **Garment Source:** Users can upload a flat-lay/ghost mannequin image OR select an item directly from the ingested Brand Catalog.

2.  **Generative Fitting:**
    *   The system uses generative AI to "warp" and "blend" the garment onto the user's body.
    *   It respects the user's pose, lighting, and body shape.
    *   It preserves the texture, pattern, and drape of the original garment.

3.  **Sharing:**
    *   Generated results can be instantly shared via the native Web Share API or copied to the clipboard.

## Technical Implementation
*   **Model:** `gemini-2.5-flash-image` (or `gemini-3-pro-image-preview` for high fidelity).
*   **Prompt Engineering:** The prompt combines the user image and garment image with instructions to "wear" the item, maintaining photorealism.
*   **Privacy:** Images are processed in memory and not permanently stored on the server.
