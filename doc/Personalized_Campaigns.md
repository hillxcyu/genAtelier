# Personalized Campaigns

The **Personalized Campaigns** module demonstrates the power of hyper-personalization by generating unique marketing assets for specific user personas.

## Core Functionality

1.  **User Personas:**
    *   The system simulates detailed user profiles (e.g., "Emma, 26, Minimalist") with specific style preferences, locations, and shopping histories.
    *   **Cart & Recommendations:** Each persona has specific items in their "Cart" and a list of "Recommended Items" derived from the brand catalog.

2.  **Generative Marketing:**
    *   **Copywriting:** Generates a personalized email subject line and body text tailored to the user's demographics and the brand's voice.
    *   **Visuals:** Generates a photorealistic image of *that specific user persona* wearing an item from their cart.

3.  **Curated Lookbook:**
    *   Automatically generates a mini-lookbook page combining the user's cart items with recommended items.
    *   This creates a "Complete the Look" experience tailored to the individual's taste.

## Technical Implementation
*   **Text Model:** `gemini-2.5-flash` for generating the email copy.
*   **Image Model:** `gemini-3-pro-image-preview` for generating the high-fidelity persona images and the editorial lookbook layout.
*   **API Key:** Requires a paid API key selection due to the use of the Pro model.
