# GenFashion Atelier: Lookbook Reformatted

GenFashion Atelier is an ultra-premium AI-powered platform designed for high-end fashion brands to automate brand analysis, catalog creation, and marketing content generation. It combines deep brand grounding with state-of-the-art multimodal AI synthesis.

## 🏗️ Architecture

The project follows a **Unified Backend-Frontend Architecture**, designed for high performance and seamless deployment.

- **Frontend**: Built with **Next.js 14** and **React**. It features a "flashy" Atelier Experience UI with **Framer Motion** animations and **Tailwind CSS** styling.
- **Backend**: A **FastAPI** (Python) service that orchestrates heavy AI workloads, web scraping, and asset management.
- **AI Engine**: Leverages a tiered **Google Vertex AI** strategy:
  - `gemini-2.5-flash`: For rapid web analysis, catalog guessing, and parallelized image generation.
  - `gemini-3-pro-image-preview`: For high-fidelity, multimodal grounded synthesis (VTO, Lookbooks, Campaigns).
- **Automation Layer**: Uses **Playwright** for robust web scraping and **ReportLab** for dynamic PDF brand report generation.
- **Deployment**: Unified **Docker** container orchestration on **Google Cloud Run** with structured JSON logging and Bearer token authentication.

## 🧠 AI Prompts & Logic

The system is guided by highly specific, role-based prompts to ensure "Atelier-grade" quality:

- **Brand Identity**: Acts as a *Senior Brand Strategist* to synthesize scraped website data and search results into a "Brand Identity Core" report.
- **Product Photography**: Uses strict specifications for *High-End Product Photography* (ghost mannequin styles, neutral backgrounds, no models) to generate synthetic catalogs.
- **Virtual Try-On (VTO)**: Generates photorealistic high-fashion shots by grounding models in extracted Brand DNA and optional PDF guidelines.
- **Art Direction**: Operates as a *World-Class Fashion Art Director & UI Designer* to create unified email campaign assets that blend visuals with integrated marketing copy.

## 🚀 Key Features

- **Brand Scanner**: Deep analysis of any website to extract colors, fonts, and assets.
- **Identity Core**: Grounded research via Google Search to find official brand guidelines.
- **Synthetic Catalog**: Automatically generate a 12-item collection based on brand mood.
- **Lookbook Studio**: Intelligent layout generation for editorial lookbooks.
- **Lifestyle Studio**: Convert product shots into professional lifestyle assets.
- **Campaign Engine**: Personalized vertical or wide campaign assets based on user persona and cart items.

## 🛠️ Setup & Deployment

### Local Development
```bash
./dev.sh
```

### Production Deployment
```bash
bash deploy_fresh.sh
```

Ensure the following environment variables are set:
- `GOOGLE_CLOUD_PROJECT`: Your GCP project ID.
- `GOOGLE_CLOUD_LOCATION`: (Optional) GCP region (default: `us-central1`).
- `LOOKBOOK_API_KEY`: Secure key for Bearer authentication.
- `DEPLOYMENT_ENV`: Set to `production` for structured logging.

---
*Created on the `fresh` branch for GenFashion Atelier.*
