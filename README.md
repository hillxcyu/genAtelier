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
*   **Docker Desktop** (or Docker Engine) for running services locally with `docker-compose`.
*   **Node.js** (v18 or higher) - *for development purposes outside Docker, if preferred.*
*   **Google Gemini API Key** (Get one at [aistudio.google.com](https://aistudio.google.com))
    *   *Note: Some features like VTO require a paid tier key for `gemini-3-pro-image-preview`.*

### Local Development Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/genfashion-atelier.git
    cd genfashion-atelier
    ```

2.  **Set up Environment Variables:**
    Create a `.env` file in the root directory and add your API key. If deploying to Cloud Run, ensure these are configured in `service.yaml` or through Cloud Run console.
    ```env
    GEMINI_API_KEY=your_api_key_here
    GOOGLE_CLOUD_PROJECT=your_gcp_project_id
    GOOGLE_CLOUD_LOCATION=global # Or your specific region if not global
    ```

3.  **Run with Docker Compose:**
    This will build and start all services (frontend, backend, and the stealth scraper) as defined in `docker-compose.yml`.
    ```bash
    docker compose up --build -d
    ```
    The application will be accessible at `http://localhost:3000`.
    To stop the services:
    ```bash
    docker compose down
    ```

### Deployment to Google Cloud Run

For automated, Argolis-compliant provisioning (multi-container Cloud Run + External HTTPS Load Balancer + IAP + least-privilege runtime SA), use the Terraform configuration in [`click-to-deploy/`](click-to-deploy/) and follow the full walkthrough in [`docs/DEMO_GUIDE.md`](docs/DEMO_GUIDE.md).

Manual deployment is also supported via **Google Cloud Build** using `cloudbuild.yaml` and `service.yaml`:

#### 1. Configure GCP Project
Ensure your target GCP project (`YOUR_PROJECT_ID`) has:
*   **Cloud Run API** (`run.googleapis.com`) enabled.
*   **Cloud Build API** (`cloudbuild.googleapis.com`) enabled.
*   **Artifact Registry API** (`artifactregistry.googleapis.com`) enabled.
*   **Vertex AI API** (`aiplatform.googleapis.com`) enabled.
*   The Cloud Build Service Account (`YOUR_PROJECT_NUMBER@cloudbuild.gserviceaccount.com`) has:
    *   `roles/run.admin`
    *   `roles/iam.serviceAccountUser`
    *   `roles/artifactregistry.writer`

#### 2. Service Account Permissions
Update `YOUR_RUNTIME_SERVICE_ACCOUNT` in `service.yaml` to a dedicated least-privilege service account with `roles/aiplatform.user` to access Vertex AI Gemini models.

#### 3. Triggering the Deployment

**a) Manual Trigger (CLI):**
From your project root, run:
```bash
gcloud builds submit --config cloudbuild.yaml .
```
This command builds your Docker images, pushes them to Artifact Registry, and deploys the multi-container Cloud Run service as defined in `service.yaml`.

**b) Automatic Trigger (Git Push):**
Set up a **Cloud Build Trigger** in the Google Cloud Console:
1.  Navigate to **Cloud Build > Triggers**.
2.  Click **Create Trigger**.
3.  **Name:** `deploy-gen-fashion-atelier-uat`
4.  **Event:** `Push to a branch`
5.  **Source:** Connect your repository (GitHub/Bitbucket/etc.)
6.  **Branch:** `^main$` (or your target branch)
7.  **Configuration:** Select `Cloud Build configuration file (yaml or json)` and specify `cloudbuild.yaml`.
8.  **Create** the trigger.

Every push to the configured branch will now automatically trigger a full build and deployment to Cloud Run.

#### 4. Accessing the Deployed Service
Once deployed, your Cloud Run service URL will be displayed in the Cloud Console or by running `gcloud run services describe gen-fashion-atelier-uat --region=us-central1`.

**Multi-Container Architecture Note:**
The `service.yaml` defines `gen-fashion-atelier-uat` as a multi-container Cloud Run service. The `app` (frontend/backend) and `scraper` containers run in the same pod. The `app` container can communicate with the `scraper` container directly via `http://localhost:4000/scrape` as specified in the `SCRAPER_SERVICE_URL` environment variable within `service.yaml`.

---

## 💡 Technologies Used

*   **Frontend:** React, TypeScript, Vite
*   **Styling:** Tailwind CSS, Framer Motion
*   **AI Models:**
    *   `gemini-3-flash-preview` (Text, Logic, JSON)
    *   `gemini-3-pro-image-preview` (High-Fidelity Image Generation)
*   **Icons:** Lucide React
*   **Backend:** Node.js, Express.js
*   **Scraping:** `axios`, `cheerio`, `puppeteer-extra` (with stealth plugin)
*   **Deployment:** Google Cloud Run, Cloud Build, Artifact Registry
