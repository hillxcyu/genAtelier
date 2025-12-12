# GenFashion Atelier

**GenFashion Atelier** is an AI-powered creative workspace designed to revolutionize the fashion workflow. By leveraging Google's Gemini models, it enables brands to ingest their catalog, generate high-fidelity virtual try-ons, create automated lookbooks, and launch personalized marketing campaigns—all from a single interface.

## 🚀 Key Features

### 1. Virtual Fitting Room (VTO)
A state-of-the-art virtual try-on experience that allows users to visualize garments on their own photos.
*   **Generative Fitting:** Realistically warps and blends garments onto user photos using `gemini-3-pro-image-preview`.
*   **AI Styling Assistant:** Automatically suggests matching accessories from the catalog to "Complete the Look".
*   **Multi-Item Try-On:** Generates a cohesive outfit with multiple selected items.
*   [📄 Read Documentation](doc/Virtual_Try_On.md)

### 2. Brand Ingestion & Knowledge Base
Upload and analyze brand assets to create a "Brand Vibe" that guides all AI generations.
*   **Visual Analysis:** Extracts color palettes, textures, and style keywords from uploaded images.
*   **Vibe Definition:** Defines the brand's aesthetic (e.g., "Minimalist", "Boho", "Streetwear").
*   [📄 Read Documentation](doc/Brand_Ingestion.md)

### 3. Semantic Inference
Deeply analyzes product images to extract rich metadata for better search and styling.
*   **Attribute Extraction:** Identifies material, occasion, fit, and seasonality.
*   **Styling Graph:** Understands relationships between items for better recommendations.
*   [📄 Read Documentation](doc/Semantic_Inference.md)

### 4. Product-to-Model Transformation
Instantly transforms flat-lay or ghost mannequin product shots into professional on-model editorial images.
*   **Diverse Models:** Select from a range of AI-generated models.
*   **Scene Generation:** Place models in brand-appropriate environments.
*   [📄 Read Documentation](doc/Product_to_Model.md)

### 5. Automated Lookbook Generator
Creates cohesive fashion collections and lookbooks based on themes or seasons.
*   **Theme-Based Generation:** "Summer Vacation", "Office Chic", etc.
*   **Layout Automation:** Arranges images into professional layouts.
*   [📄 Read Documentation](doc/Lookbook_Generator.md)

### 6. Personalized Campaigns
Generates targeted marketing assets for specific user segments.
*   **Copywriting:** AI-generated taglines and descriptions.
*   **Visuals:** Custom campaign imagery aligned with the brand vibe.
*   [📄 Read Documentation](doc/Personalized_Campaigns.md)

---

## 🛠️ Getting Started

### Prerequisites
*   **Node.js** (v18 or higher)
*   **Google Gemini API Key** (Get one at [aistudio.google.com](https://aistudio.google.com))
    *   *Note: Some features like VTO require a paid tier key for `gemini-3-pro-image-preview`.*

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/genfashion-atelier.git
    cd genfashion-atelier
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up Environment Variables:**
    Create a `.env` file in the root directory and add your API key:
    ```env
    GEMINI_API_KEY=your_api_key_here
    ```

### Running the App

Start the development server:

```bash
npm run dev
```

Open your browser and navigate to `http://localhost:3000`.

---

## 🏗️ Tech Stack

*   **Frontend:** React, TypeScript, Vite
*   **Styling:** Tailwind CSS, Framer Motion
*   **AI Models:**
    *   `gemini-2.5-flash` (Text, Logic, JSON)
    *   `gemini-3-pro-image-preview` (High-Fidelity Image Generation)
*   **Icons:** Lucide React
