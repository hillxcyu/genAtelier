# Semantic Inference: From HTML to Brand DNA

The GenFashion Atelier application analyzes a brand's "vibe" by transforming raw, scraped HTML into a structured design system using a process called **Semantic Inference** powered by **Gemini 3 Flash Preview**.

## 1. The Context
When a user inputs a URL, the system scrapes the raw HTML. This data is messy, unstructured, and noisy. Semantic inference is the "brain" that makes sense of it.

## 2. The Prompt Strategy
The system constructs a prompt that positions the AI as an expert UI/UX designer and fashion analyst.
> **Task:** "Analyze the provided HTML content. Extract the visual identity, infer the mood, and identify product card patterns."

## 3. Structured Extraction
The AI processes the HTML context and returns a strict **JSON object** (`BrandVibe`), inferring missing pieces where necessary:

*   **Palette:** Identifies dominant colors from inline styles or infers them from the brand's mood (e.g., if "Minimalist", use #FFFFFF and #000000).
*   **Typography:** Detects font names in the code or categorizes the likely style (`serif`, `sans`).
*   **Mood & Keywords:** Synthesizes terms like "Urban Streetwear" or "Timeless Luxury" by reading the marketing copy found in the HTML.
*   **Catalog extraction:** Recognizes repeating patterns of images and prices to build a list of real products.

## 4. Why "Semantic"?
It is "semantic" because the AI understands the *meaning* of the content, not just the syntax.
*   It knows that a generic `div` containing "$2,500" and "Silk Gown" is a **Product Card**.
*   It understands that "Carbon Neutral" and "Recycled" implies a **Sustainable** vibe.

## Summary
Semantic Inference bridges the gap between raw web data and a usable Design System, allowing the application to adapt to any brand's identity dynamically.