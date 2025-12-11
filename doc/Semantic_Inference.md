# Semantic Inference: How Brand Analysis Works

The GenFashion Atelier application analyzes a brand's "vibe" from a URL using a process called **Semantic Inference** powered by **Gemini 2.5 Flash**.

Here is the step-by-step breakdown of how it works in the code:

## 1. The Prompt
When you enter a URL (e.g., `zara.com`), the app constructs a specific prompt for the AI. It doesn't just ask "what is this?"; it asks for a structured brand analysis.

> **Prompt:** `Analyze the likely brand identity for a fashion retailer with the URL: "${url}".`

## 2. Knowledge Retrieval (Not Scraping)
Instead of trying to scrape the live HTML of the website (which can be slow, blocked, or messy), the app leverages Gemini's vast training data. The model "knows" the aesthetic, color palette, and typical products of major brands associated with that URL.

*   **Fallback:** If the URL is unknown or generic, the prompt instructs the model to *"infer a plausible high-end fashion style,"* ensuring the app always produces a beautiful result.

## 3. Structured Extraction
The AI is instructed to return the data in a strict **JSON format** containing specific design tokens:

*   **Palette:** 3-5 hex color codes (e.g., `#000000` for primary, `#c026d3` for accent).
*   **Typography:** It categorizes the font style as `sans`, `serif`, or `mono`.
*   **Mood & Keywords:** It generates descriptive terms like "Minimalist Luxury" or "Bohemian Chic."
*   **Representative Catalog:** It even hallucinates a plausible product list (names, categories, prices) consistent with that brand's inventory.

## 4. Dynamic Theming
The application takes this JSON output and instantly applies it to the UI:

*   The **CSS Variables** (`--text-primary`, `--card-bg`) are updated to match the brand's contrast levels.
*   The **Global Font** switches to match the `fontCategory`.
*   The **Ambient Glow** in the background changes to the brand's primary and accent colors.

## Summary
In essence, the system translates a simple text URL into a comprehensive **Design System** and **Data Model** in real-time, allowing the application to "wear" the brand's identity instantly.
