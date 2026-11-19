# Product-to-Model Transformation

The **Product-to-Model** module is a tool for brands to generate professional lifestyle photography from simple product assets, significantly reducing photoshoot costs.

## Core Functionality

1.  **Input:**
    *   **Product:** A "Ghost Mannequin" or flat-lay image of a clothing item.
    *   **Configuration:**
        *   **Model Type:** Ethnicity/Gender (e.g., "European Female", "Asian Male").
        *   **Background:** Setting (e.g., "Studio Minimal", "Urban Street", "Beach Sunset").
        *   **Lighting:** Mood (e.g., "Soft Daylight", "Neon/Night").

2.  **Generative Compositing:**
    *   The AI generates a photorealistic model wearing the product.
    *   The product is seamlessly integrated into the scene, matching the selected lighting and background.
    *   The "Brand DNA" (mood, colors) is injected into the prompt to ensure the final shot aligns with the brand's campaign style.

## Technical Implementation
*   **Model:** `gemini-3-pro-image-preview`.
*   **Context Awareness:** The prompt dynamically constructs a scene description based on the selected configuration and the global Brand Vibe.
