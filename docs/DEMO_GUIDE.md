# GenFashion Atelier — Seller Demo Guide

## Executive Summary & Pitch Context

- **Target Buyer Personas:** Chief Digital Officers (CDOs), VP of E-Commerce & Merchandising, Creative Directors, and Retail Marketing Leads.
- **Customer Pain Point:** Fashion and apparel retailers spend weeks and tens of thousands of dollars per collection coordinating physical photoshoots, manual product-card tagging, and fragmented regional marketing campaigns—creating severe time-to-market bottlenecks and inconsistent brand aesthetics across digital channels.
- **Value Proposition:** GenFashion Atelier demonstrates how Google Cloud's Vertex AI Gemini multimodal models compress seasonal creative production from weeks to minutes—ingesting any brand's live web storefront to extract its visual DNA, generating photorealistic virtual try-on (VTO) experiences, transforming flat-lay product shots into editorial on-model photography, and producing persona-targeted campaigns and lookbooks in one unified studio.
- **Estimated Demo Duration:** 10–15 minutes.

## How to Build

This section walks through how GenFashion Atelier is architected and built end-to-end on Google Cloud using **React, TypeScript, Express.js, Puppeteer Stealth, Vertex AI Gemini models, Cloud Run (multi-container), and External HTTPS Load Balancing with IAP**.

### Step 1: Scaffold the Project & Dependencies

The application is structured as a unified full-stack TypeScript project with a dedicated scraper sidecar:

- **Frontend & Backend Manifest (`package.json`, `tsconfig.json`, `vite.config.ts`):** React 19 + Vite + Tailwind CSS v4 frontend served alongside an Express.js API server (`server/index.ts`), using `@google/genai` for Vertex AI and AI Studio integration.
- **Production Container (`Dockerfile`):** Multi-stage Node 22 build using `npm ci` to compile the Vite frontend (`dist/`), bundle the Express server (`dist-server/index.js`), and package the built-in synthetic luxury retailer (`dummy-retailer/`).
- **Scraper Sidecar (`scraper-service/Dockerfile`, `scraper-service/package.json`):** Independent Node container built on `ghcr.io/puppeteer/puppeteer:24` running `puppeteer-extra` with `puppeteer-extra-plugin-stealth` on port `4000`.
- **Local Orchestration (`docker-compose.yml`):** Wires `frontend` (`:3000`), `backend` (`:3001`), and `scraper` (`:4000`) for local development with Application Default Credentials (ADC).

### Step 2: Build the Brand Ingestion & Stealth Scraper Pipeline

- **Stealth Sidecar (`scraper-service/index.js`):** Exposes `POST /scrape`, launches headless Chromium with stealth evasion, blocks non-essential media/font requests for speed, waits for DOM hydration, and returns rendered HTML.
- **Two-Stage Scraper (`server/services/scraper.ts`):** Calls `SCRAPER_SERVICE_URL` (`http://localhost:4000/scrape` inside the Cloud Run pod) and falls back to direct `axios` + `cheerio` extraction if the sidecar is unavailable.
- **Semantic DNA Extractor (`server/services/extractor.ts`):** Prompts `gemini-3-flash-preview` with `responseMimeType: 'application/json'` to extract a 5-role color palette (`primary`, `secondary`, `accent`, `background`, `text`), typography (`fonts`, `fontCategory`), brand mood, keywords, and structured product catalog items—with automatic URL-based fallback inference if a target site blocks bots.

### Step 3: Build the Backend AI Proxy & Frontend Creative Modules

- **Server-Side AI Proxy (`server/index.ts`, `src/utils/genai.ts`):** Exposes `POST /api/generate-content`, `POST /api/extract-brand`, and `GET /api/proxy-image`. When `GOOGLE_CLOUD_PROJECT` is set, the backend initializes `GoogleGenAI({ vertexai: true, project, location: 'global' })`, keeping all credentials server-side.
- **Dynamic Studio UI (`src/App.tsx`, `src/components/Layout.tsx`):** Dynamically re-themes CSS variables (`--accent`, `--card-bg`, background gradients, and contrast text) to match the ingested brand's extracted palette in real time.
- **Five Generative Modules (`src/components/`):**
  - `IngestionModule.tsx`: Live URL brand DNA extraction and catalog inspection.
  - `VTOModule.tsx`: Virtual Fitting Room using `gemini-3-pro-image-preview` for garment-to-person try-on plus `gemini-3-flash-preview` for "Complete the Look" catalog recommendations.
  - `ProductToModelModule.tsx`: Converts flat-lay or ghost-mannequin shots into editorial on-model imagery.
  - `LookbookModule.tsx`: Generates multi-page seasonal lookbooks with automated PDF export (`jspdf`).
  - `PersonalizedCampaignModule.tsx`: Generates segment-specific campaign visuals and copy for shopper personas (`src/constants.ts`).

### Step 4: Test & Deploy to Google Cloud

- **Click-to-Deploy Terraform (`click-to-deploy/`):** Provisions Artifact Registry, a least-privilege runtime service account (`roles/aiplatform.user`), a multi-container Cloud Run v2 service (`INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER`), and an External HTTPS Application Load Balancer with Serverless NEG and IAP backend protection.
- **Cloud Build Pipeline (`cloudbuild.yaml`, `service.yaml`):** Builds and pushes both the `app` and `scraper` images to Artifact Registry and updates the multi-container Cloud Run service.

## Pillar 1: Setup & Deployment Instructions

### 1.1 Prerequisites & IAM Permissions

- **GCP Environment:** An Argolis project or standard Google Cloud project with Billing enabled.
- **Required IAM Roles for Deployer:** `roles/owner` or the combination of `roles/run.admin`, `roles/artifactregistry.admin`, `roles/compute.loadBalancerAdmin`, `roles/iap.admin`, `roles/iam.serviceAccountAdmin`, and `roles/serviceusage.serviceUsageAdmin`.
- **Required IAM Roles for Runtime Service Account:** `roles/aiplatform.user`, `roles/logging.logWriter`, `roles/serviceusage.serviceUsageConsumer`.
- **Required APIs:** Vertex AI (`aiplatform.googleapis.com`), Cloud Run (`run.googleapis.com`), Artifact Registry (`artifactregistry.googleapis.com`), Cloud Build (`cloudbuild.googleapis.com`), Compute Engine (`compute.googleapis.com`), Identity-Aware Proxy (`iap.googleapis.com`), Secret Manager (`secretmanager.googleapis.com`).
- **Model Access:** Ensure `gemini-3-flash-preview` and `gemini-3-pro-image-preview` are accessible in Vertex AI (`GOOGLE_CLOUD_LOCATION=global`).

### 1.2 Option A: One-Click Deployment via go/demos (Recommended)

1. Navigate to the GenFashion Atelier listing on `go/demos` and click **Deploy Demo (Click-to-Deploy)**.
2. Select your target Argolis organization and project.
3. Wait approximately **5–8 minutes** for Terraform provisioning and container deployment to complete.

### 1.3 Option B: Manual CLI / Terraform Deployment

1. Build and push the `app` and `scraper` container images to Artifact Registry:

```bash
export PROJECT_ID="your-project-id"
export REGION="us-central1"
export REPO="gen-fashion-atelier"

gcloud artifacts repositories create "${REPO}" \
  --repository-format=docker \
  --location="${REGION}" \
  --project="${PROJECT_ID}" || true

gcloud builds submit \
  --config=cloudbuild.yaml \
  --substitutions="_REGION=${REGION},_ARTIFACT_REPO=${REPO}" \
  --project="${PROJECT_ID}" .
```

2. Provision the multi-container Cloud Run service, least-privilege IAM, and External HTTPS Load Balancer with IAP:

```bash
cd click-to-deploy
terraform init
terraform apply \
  -var="project_id=${PROJECT_ID}" \
  -var="data_location=${REGION}" \
  -var="app_image=${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/gen-fashion-atelier:latest" \
  -var="scraper_image=${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/gen-fashion-scraper:latest"
```

### 1.4 Deployment Verification

Verify the Cloud Run service and retrieve the Load Balancer HTTPS URL:

```bash
gcloud run services describe gen-fashion-atelier \
  --project="${PROJECT_ID}" \
  --region="${REGION}"

terraform -chdir=click-to-deploy output -raw app_url
```

### 1.5 Teardown & Cost Cleanup

To avoid ongoing Load Balancer, Artifact Registry, or Cloud Run charges after your customer session:

```bash
cd click-to-deploy
terraform destroy -var="project_id=${PROJECT_ID}" -var="data_location=${REGION}"
```

## Pillar 2: How to Access the Demo

### 2.1 Retrieving Entry Point URLs

- **Shared Live Hosted Demo:** Open `https://gen-fashion-atelier-iytuxr6j5a-uc.a.run.app` in your browser.
- **Self-Deployed (Click-to-Deploy / Terraform):** Copy the `app_url` from your C2D completion output or run `terraform -chdir=click-to-deploy output -raw app_url`.
- **Built-in Synthetic Retailer Storefront (for Live Ingestion Demos):** Append `/dummy-retailer/index.html` to your base URL (for example, `https://gen-fashion-atelier-iytuxr6j5a-uc.a.run.app/dummy-retailer/index.html`) to preview the "Lumina Voile" luxury fashion catalog.

### 2.2 Credentials & Test Personas

- **Authentication Method:** Authenticate with your Google corporate or Argolis account when prompted by Identity-Aware Proxy (IAP) or Cloud Run IAM.
- **Built-In Synthetic Shopper Personas (Personalized Campaigns):**
  - **Emma Chen** (26, New York, NY — Minimalist, Sustainable, Neutral Tones)
  - **Marcus Johnson** (32, Austin, TX — Streetwear, Bold Colors, Oversized)
  - **Sophia Miller** (45, London, UK — Classic, Elegant, Tailored)
- **Default Fallback Brand & Catalog:** If no external URL is entered, the studio automatically loads the **Lumina** minimalist catalog (`Structured Wool Coat`, `Silk Slip Dress`, `Cashmere Turtleneck`, `Pleated Trousers`, `Leather Tote`) so all generative modules work immediately.

### 2.3 Expected Initial Landing State

Upon opening the application URL, confirm you see:

1. The dark-themed studio hero screen displaying **"The GenFashion Atelier"** badge and headline **"Where Brand DNA meets Generative Reality"**.
2. A rounded URL input bar with placeholder `Enter Retailer URL (e.g., zara.com)` and a **Begin** button.
3. A bottom status bar showing a green dot next to **System Operational**, along with live session metrics.

## Demo Walkthrough (Pillar 3 & Pillar 4: Step-by-Step Walkthrough & Seller Talking Script)

### Opening Discovery Hook (Before Sharing Screen)

> **What to Say:** *"Retailers we work with tell us their creative and merchandising teams spend 4 to 6 weeks coordinating studio shoots, retouching, and localized campaign variations for every seasonal drop—while shoppers still bounce because they can't picture how a garment fits them. Before I show you the studio, how long does it currently take your team to go from a flat-lay sample to a full-funnel campaign?"*

### Step 1: Live Brand DNA Extraction & Dynamic Studio Calibration

- **What to Do (Click Sequence):**
  1. On the Hero screen, paste the built-in synthetic retailer URL (`https://gen-fashion-atelier-iytuxr6j5a-uc.a.run.app/dummy-retailer/index.html`)—or a live fashion retailer URL—into the search bar.
  2. Click **Begin** (or press `Enter`).
  3. Wait ~5–10 seconds as the notification toast updates through scraping and Gemini extraction.
  4. Once the Split Gateway appears (**"Welcome, Lumina Voile"**), click **Brand Ingestion** in the top navigation bar to inspect the extracted palette, fonts, mood, and catalog items.
- **Expected Visual Outcome:** The entire application UI dynamically re-themes its background gradients, accent buttons, and typography to match the ingested brand's extracted color palette, and the **Brand Ingestion** view displays 5 color swatches (`primary`, `secondary`, `accent`, `background`, `text`), mood tags, and extracted product cards.
- **What to Say (Seller Script):** *"In under 10 seconds, our stealth scraper sidecar and Gemini Flash read the live storefront, extracted the brand's exact color palette, typography, and product catalog, and recalibrated the entire creative studio to match the brand's identity—no manual style guide upload required."*
- **Why Google Cloud (Differentiator Callout):** *"Gemini's large multimodal context window and native JSON schema enforcement let us parse messy real-world HTML and visual product cards into structured brand DNA in a single pass, hosted securely in a multi-container Cloud Run pod."*

### Step 2: Virtual Fitting Room (VTO) & AI Styling Assistant

- **What to Do (Click Sequence):**
  1. Click **Virtual Try-On** in the top navigation bar (or click **THE FITTING ROOM → Virtual Try-On** on the gateway).
  2. In the **Select Model / Person** panel, upload a shopper photo or select a sample model.
  3. In the **Select Garment** panel, choose a catalog item (e.g., `Structured Wool Coat` or `Silk Slip Dress`).
  4. Observe the **AI Styling Assistant** panel populate 3 complementary catalog items ("Complete the Look") automatically. Optionally select one accessory (e.g., `Leather Tote`).
  5. Click **Generate Virtual Try-On**.
- **Expected Visual Outcome:** Within ~5–8 seconds, `gemini-3-pro-image-preview` renders a photorealistic composite showing the selected person wearing the chosen garment and accessories with natural lighting, drape, and fabric texture preserved.
- **What to Say (Seller Script):** *"Notice two things happening at once: first, Gemini analyzes the garment and recommends three complementary cross-sell items from the live catalog with styling rationale. Second, our image generation model drapes the full outfit onto the customer's photo while preserving identity, pose, and fabric realism—turning single-item browsers into multi-item baskets."*
- **Why Google Cloud (Differentiator Callout):** *"Vertex AI gives retailers enterprise-grade data governance and IP indemnification—customer photos and unreleased seasonal SKUs stay inside your Google Cloud project boundary and are never used to train public models."*

### Step 3: Product-to-Model Editorial Transformation

- **What to Do (Click Sequence):**
  1. Click **Product to Model** in the top navigation bar.
  2. Select a flat-lay or catalog item from the left rail (e.g., `Cashmere Turtleneck`).
  3. Choose a model demographic/pose preset and an editorial scene setting (e.g., `Minimalist Studio` or `Milan Street Style`).
  4. Click **Transform to Model**.
- **Expected Visual Outcome:** The flat-lay product image is transformed into an editorial on-model photograph matching the selected environment and the brand's extracted aesthetic.
- **What to Say (Seller Script):** *"Instead of shipping physical samples to studios around the world, merchandising teams can take a single ghost-mannequin or flat-lay photo and generate localization-ready editorial imagery across diverse models and settings in seconds."*

### Step 4: Automated Lookbook & Personalized Campaigns

- **What to Do (Click Sequence):**
  1. Click **Lookbook** in the top navigation bar, select a seasonal theme (e.g., `Autumn Quiet Luxury`), and click **Generate Lookbook** to produce a multi-outfit editorial spread (with **Export PDF** available).
  2. Click **Campaigns** in the top navigation bar.
  3. Select persona **Emma Chen** (`Minimalist, Sustainable, Neutral Tones`), choose a channel/format, and click **Generate Campaign**.
  4. Switch to **Marcus Johnson** (`Streetwear, Bold Colors, Oversized`) and regenerate to show instant creative adaptation.
- **Expected Visual Outcome:** Each persona receives tailored campaign copy, headlines, and brand-aligned visual creative tuned to their style preferences and shopping history.
- **What to Say (Seller Script):** *"Finally, the same brand DNA powers downstream marketing. Compare Emma's minimalist neutral campaign to Marcus's bold streetwear creative—generated from the exact same catalog in real time, ready for email, social, or paid media."*

### Closing & Next-Step Transition

- **Common Customer Objection & Response:**
  - *Objection:* *"How do we ensure AI-generated imagery stays strictly on-brand and doesn't hallucinate product details?"*
  - *Response:* *"Every generation is conditioned on the extracted Brand DNA palette, mood keywords, and the actual SKU reference image—not freeform text prompts alone. And because it runs on Vertex AI behind your own Cloud Run + IAP perimeter, your creative team keeps full human-in-the-loop approval before anything publishes."*
- **Call to Action:** *"We can stand up a private sandbox of GenFashion Atelier against 10 of your real catalog SKUs in a 2-hour technical workshop next week. Which merchandising or digital creative lead should we include?"*

## Troubleshooting & Live-Demo Recovery Tips

- **Cloud Run Cold-Start Latency:** Cloud Run scales to zero when idle (`min_instance_count = 0`). Open the URL and run one quick brand ingestion 5 minutes before your customer call to warm up both the `app` and `scraper` containers.
- **External Retailer Bot Protection:** Some luxury e-commerce sites block automated scraping even with stealth plugins. If a live customer URL times out or returns a challenge page, `server/services/extractor.ts` automatically falls back to URL-based brand inference, or you can immediately paste `/dummy-retailer/index.html` (`Lumina Voile`) for a guaranteed 100% deterministic live scrape.
- **Resetting Demo State:** Refresh the browser tab (`Cmd+R` / `Ctrl+R`) or click **Brand Ingestion** to enter a new retailer URL and reset the studio theme.
- **Image CORS Errors in Browser:** All external catalog images are routed through `/api/proxy-image` on the Express backend so canvas rendering and PDF lookbook exports never fail on cross-origin restrictions.
