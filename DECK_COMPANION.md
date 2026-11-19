# GenFashion Atelier: Demo Companion Deck Guide

This guide provides the core talk points, AI best practices, and technical summaries to support your demo of GenFashion Atelier. It is designed to showcase the power of Gemini models in a real-world creative workflow.

---

## 🚀 Key Talk Points by Feature

### 1. Brand Ingestion (The Identity Engine)
*   **Models:** `gemini-3-flash-preview` + `gemini-2.5-flash-image`
*   **Talk Point:** "Gemini acts as a Senior Brand Director. It doesn't just 'scrape' a site; it *reads* the aesthetic DNA. It extracts a live palette, font styles, and a brand mood in seconds."
*   **Best Practice:** **Multimodal Grounding.** The system fuses three distinct sources of truth—Live Website (Reality), Brand Guidelines PDF (Authority), and Search Results (Context)—to create a grounded, accurate JSON profile.

### 2. Virtual Fitting Room (Styling & Synthesis)
*   **Models:** `gemini-3-flash-preview` (Styling) & `gemini-3-pro-image-preview` (VTO)
*   **Talk Point:** "It’s not just a 'sticker' on a photo. Gemini understands fabric physics and human anatomy. It styles the look first using Flash, then Pro warps and blends multiple items—garments, bags, and accessories—into a single photorealistic frame."
*   **Best Practice:** **Logical Pre-processing.** Before generating an image, use a text/logic model (Flash) to 'curate' the scene. This ensures the visual model (Pro) isn't just generating "random" fashion, but "styled" fashion.

### 3. Product-to-Model (Infinite Editorial)
*   **Model:** `gemini-3-pro-image-preview`
*   **Talk Point:** "We are democratizing the photoshoot. A brand can take a flat-lay photo and instantly see it on any model type, in any environment, under any lighting—while perfectly preserving the original garment's texture and color."
*   **Best Practice:** **Context Injection.** By injecting the `BrandVibe` (mood/keywords) into the image generation prompt, we ensure that AI-generated models don't look generic; they look like they belong in *that* brand's specific magazine.

### 4. Automated Lookbook (Agentic Workflow)
*   **Models:** `gemini-3-flash-preview` (Director) & `gemini-3-pro-image-preview` (Production)
*   **Talk Point:** "This is a 2-stage creative pipeline. Flash acts as the **Director**, planning the layout and strategy. Then, Pro acts as the **Photographer**, executing the vision. It transforms a 'folder of images' into a 'cohesive brand story'."
*   **Best Practice:** **Human-in-the-Loop Storyboarding.** The implementation creates a middle "Storyboard" layer. It allows the AI to propose a strategy that the human can edit before the expensive "Render" phase begins.

### 5. Personalized Campaigns (The Segment of One)
*   **Models:** `gemini-3-flash-preview` (Copy) & `gemini-3-pro-image-preview` (Visuals)
*   **Talk Point:** "We are moving from 'Mass Marketing' to 'Mass Personalization'. Gemini generates a unique ad for a single customer, featuring *their* cart items on a model that reflects *their* persona, with copy written specifically for *them*."
*   **Best Practice:** **Cross-Modal Consistency.** Gemini ensures the visual narrative (the model's look) matches the textual narrative (the email copy) by using the same persona metadata for both generation tasks.

---

## 🛠️ AI Best Practices & Model Utilization

*   **Model Tiering Strategy:** We use `Gemini 3 Flash` as the **"Logical Workhorse"** for high-volume tasks (JSON extraction, copy, and storyboarding) to minimize latency and cost. We reserve `Gemini 3 Pro Image` as the **"Creative Specialist"** for high-fidelity visual production.
*   **The "Storyboard" Pattern:** Instead of a single "black box" generation, we implement a 2-stage **Agentic Workflow**. The AI first drafts a plan (the Storyboard) that a human can review and edit, ensuring creative control remains with the brand.
*   **Multimodal Fusion for Grounding:** To prevent "hallucination," the system uses **Multimodal Grounding**. It synthesizes live website visuals, official PDF guidelines, and search context to define a brand's "DNA" before any creative work begins.
*   **Context Injection & Global State:** The `BrandVibe` (mood, keywords, palette) is treated as a **Global Context Variable**. It is injected into every subsequent prompt, ensuring that every AI-generated asset is mathematically aligned with the brand's identity.
*   **Structured Output Enforcement:** We use `responseMimeType: 'application/json'` across all logical modules. This ensures that the AI's "thoughts" are directly actionable by the code, enabling complex automated features.

---

## 💻 Technical Implementation Summary

*   **Core Stack:** **React 19**, **Vite**, **Tailwind CSS**, and **Framer Motion**.
*   **Backend Orchestration:** **Node.js/Express** server utilizing the **Google Generative AI SDK**. Supports both **Google AI Studio** and **Vertex AI**.
*   **Stealth Scraping Engine:** Containerized **Playwright** service with stealth plugins to bypass bot detection.
*   **Multi-Container Cloud Run:** Deployed on **Google Cloud Run** using a multi-container architecture for high availability and low internal latency.
*   **Automated CI/CD:** Integrated with **Google Cloud Build** for automated builds and artifact management.
*   **CORS-Free Image Processing:** Specialized **Backend Image Proxy** handles external asset retrieval for secure server-side processing.

---
*Generated by Gemini CLI for GenFashion Atelier*
