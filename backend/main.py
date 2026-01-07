import os
import uuid
import asyncio
import base64
import logging
import json
from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Dict, Any, List, Optional

from services.scraper_service import ScraperService
from services.vertex_service import VertexAIService
from services.asset_manager import AssetManager
from services.pdf_generator import PDFGenerator

# Configure logging
class JsonFormatter(logging.Formatter):
    def format(self, record):
        log_entry = {
            "severity": record.levelname,
            "message": record.getMessage(),
            "name": record.name,
            "time": self.formatTime(record, self.datefmt)
        }
        return json.dumps(log_entry)

if os.getenv("DEPLOYMENT_ENV") == "production":
    handler = logging.StreamHandler()
    handler.setFormatter(JsonFormatter())
    logging.basicConfig(level=logging.INFO, handlers=[handler])
else:
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

logger = logging.getLogger("Main")

app = FastAPI(title="Lookbook Reforged API")

# Authentication Middleware
@app.middleware("http")
async def auth_middleware(request, call_next):
    if request.url.path in ["/health", "/docs", "/openapi.json"] or request.url.path.startswith("/results"):
        return await call_next(request)
    
    expected_key = os.getenv("LOOKBOOK_API_KEY")
    if expected_key:
        auth_header = request.headers.get("Authorization")
        if not auth_header or auth_header != f"Bearer {expected_key}":
            return json_response({"detail": "Unauthorized"}, status_code=401)
            
    return await call_next(request)

def json_response(data: dict, status_code: int = 200):
    from fastapi.responses import JSONResponse
    return JSONResponse(content=data, status_code=status_code)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static
os.makedirs("results", exist_ok=True)
app.mount("/results", StaticFiles(directory="results"), name="results")

# State
tasks: Dict[str, Dict[str, Any]] = {}

def save_task_state(task_id: str):
    """Saves task metadata to disk for persistence across restarts"""
    if task_id in tasks:
        try:
            task_dir = os.path.join("results", task_id)
            os.makedirs(task_dir, exist_ok=True)
            with open(os.path.join(task_dir, "task.json"), "w") as f:
                json.dump(tasks[task_id], f)
        except Exception as e:
            logger.error(f"Failed to save task state for {task_id}: {e}")

def load_task_state(task_id: str) -> bool:
    """Attempts to load task metadata from disk if not in memory"""
    task_path = os.path.join("results", task_id, "task.json")
    if os.path.exists(task_path):
        try:
            with open(task_path, "r") as f:
                tasks[task_id] = json.load(f)
                return True
        except Exception as e:
            logger.error(f"Failed to load task state for {task_id}: {e}")
    return False

class AnalyzeRequest(BaseModel):
    url: str

async def process_brand(task_id: str, url: str):
    logger.info(f"Task {task_id}: Starting brand processing for {url}")
    tasks[task_id].update({"status": "processing", "step": "Initializing"})
    
    # Helper to load brand PDF if it exists
    def load_brand_pdf(t_id):
        pdf_path = os.path.join("results", t_id, "Reports", "Brand_Report.pdf")
        if os.path.exists(pdf_path):
            with open(pdf_path, "rb") as f:
                return f.read()
        return None
    
    try:
        # Init Services
        scraper = ScraperService()
        vertex = VertexAIService()
        assets = AssetManager("results")
        pdf_gen = PDFGenerator()
        
        # 1. Setup
        assets.create_dirs(task_id)
        
        # 2. Scanning
        tasks[task_id]["step"] = "Scanning Website"
        logger.info(f"Task {task_id}: Scanning {url}")
        save_task_state(task_id)
        brand_data = await scraper.analyze_url(url)
        
        # 3. Save Assets
        tasks[task_id]["step"] = "Saving Assets"
        logger.info(f"Task {task_id}: Saving assets")
        save_task_state(task_id)
        await assets.save_screenshot(task_id, brand_data['screenshot'])
        saved_assets = await assets.save_assets(task_id, brand_data['assets'])
        color_swatches = assets.save_color_swatches(task_id, brand_data['colors'])
        
        # 4. Thinking (Vertex AI)
        tasks[task_id]["step"] = "Analyzing Identity (Vertex AI)"
        logger.info(f"Task {task_id}: Generating brand report and guidelines")
        save_task_state(task_id)
        guidelines = await vertex.search_brand_guidelines(brand_data['title'], url)
        report = await vertex.generate_brand_report(brand_data, guidelines)
        
        tasks[task_id]["step"] = "Extracting Brand DNA & Catalog"
        logger.info(f"Task {task_id}: Extracting vibe and catalog")
        save_task_state(task_id)
        vibe = await vertex.get_brand_vibe(url)
        
        brand_pdf = load_brand_pdf(task_id)
        catalog = await vertex.generate_synthetic_catalog(url, vibe.get('name', brand_data['title']), vibe.get('mood', 'High-end Fashion'), brand_pdf)

        # 5. Generate PDF
        tasks[task_id]["step"] = "Generating PDF"
        logger.info(f"Task {task_id}: Generating final report PDF")
        save_task_state(task_id)
        pdf_path = await pdf_gen.generate(task_id, "results", brand_data['title'], report, saved_assets, color_swatches, brand_data.get('css', []))
        
        # Done
        logger.info(f"Task {task_id}: Complete")
        tasks[task_id].update({
            "status": "completed",
            "step": "Done",
            "result": {
                "pdf_url": f"/results/{task_id}/Reports/Brand_Report.pdf",
                "report": report,
                "vibe": vibe,
                "catalog": catalog
            }
        })
        save_task_state(task_id)

    except Exception as e:
        import traceback
        logger.error(f"Task {task_id}: Failed - {e}\n{traceback.format_exc()}")
        tasks[task_id].update({"status": "failed", "error": str(e)})

# --- Generation Endpoints ---

class VTORequest(BaseModel):
    brand_id: str
    person_image: str # base64
    garment_image: str # base64
    additional_items: Optional[List[str]] = None # list of base64 strings
    useBrandPdf: Optional[bool] = False

@app.post("/api/generate/vto")
async def api_generate_vto(req: VTORequest):
    logger.info(f"API: VTO request for brand {req.brand_id}")
    if req.brand_id not in tasks:
        load_task_state(req.brand_id)
    
    vertex = VertexAIService()
    context = tasks.get(req.brand_id, {}).get('result', {}).get('report', "High-end fashion style.")
    
    p_img = base64.b64decode(req.person_image.split(',')[-1])
    g_img = base64.b64decode(req.garment_image.split(',')[-1])
    
    additional_imgs = []
    if req.additional_items:
        logger.info(f"API: VTO including {len(req.additional_items)} additional items")
        additional_imgs = [base64.b64decode(img.split(',')[-1]) for img in req.additional_items]
    
    brand_pdf = None
    if req.useBrandPdf:
        pdf_path = os.path.join("results", req.brand_id, "Reports", "Brand_Report.pdf")
        if os.path.exists(pdf_path):
            logger.info(f"API: Loading Brand PDF for VTO grounding from {pdf_path}")
            with open(pdf_path, "rb") as f:
                brand_pdf = f.read()
    
    img_bytes = await vertex.generate_vto(p_img, g_img, context, additional_imgs, brand_pdf)
    logger.info("API: VTO generation complete")
    return {"image": f"data:image/png;base64,{base64.b64encode(img_bytes).decode('utf-8')}"}

class LookbookRequest(BaseModel):
    brand_id: str
    product_images: list # list of base64
    brand_report: Optional[str] = None
    useBrandPdf: Optional[bool] = False

@app.post("/api/generate/lookbook")
async def api_generate_lookbook(req: LookbookRequest):
    logger.info(f"API: Lookbook request for brand {req.brand_id} with {len(req.product_images)} products")
    if req.brand_id not in tasks:
        load_task_state(req.brand_id)
    
    vertex = VertexAIService()
    context = req.brand_report or tasks.get(req.brand_id, {}).get('result', {}).get('report', "High-end fashion style.")
    imgs = [base64.b64decode(url.split(',')[-1]) for url in req.product_images]
    
    brand_pdf = None
    if req.useBrandPdf:
        pdf_path = os.path.join("results", req.brand_id, "Reports", "Brand_Report.pdf")
        if os.path.exists(pdf_path):
            logger.info(f"API: Loading Brand PDF for Lookbook grounding from {pdf_path}")
            with open(pdf_path, "rb") as f:
                brand_pdf = f.read()

    img_bytes = await vertex.generate_lookbook_page(imgs, context, brand_pdf)
    logger.info("API: Lookbook page generation complete")
    return {"image": f"data:image/png;base64,{base64.b64encode(img_bytes).decode('utf-8')}"}

class CampaignRequest(BaseModel):
    brand_id: str
    persona: dict
    cart_items: Optional[list] = None # list of product descriptions
    brand_report: Optional[str] = None
    useBrandPdf: Optional[bool] = False
    format: Optional[str] = "mobile"
    input_images: Optional[List[str]] = None # list of base64 strings

@app.post("/api/generate/campaign")
async def api_generate_campaign(req: CampaignRequest):
    logger.info(f"API: Campaign request for brand {req.brand_id} and persona {req.persona.get('name')}")
    if req.brand_id not in tasks:
        load_task_state(req.brand_id)
    
    vertex = VertexAIService()
    context = req.brand_report or tasks.get(req.brand_id, {}).get('result', {}).get('report', "High-end fashion style.")
    
    brand_pdf = None
    if req.useBrandPdf:
        pdf_path = os.path.join("results", req.brand_id, "Reports", "Brand_Report.pdf")
        if os.path.exists(pdf_path):
            logger.info(f"API: Loading Brand PDF for Campaign grounding from {pdf_path}")
            with open(pdf_path, "rb") as f:
                brand_pdf = f.read()

    input_imgs = []
    if req.input_images:
        logger.info(f"API: Campaign including {len(req.input_images)} input images")
        input_imgs = [base64.b64decode(img.split(',')[-1]) for img in req.input_images]

    campaign = await vertex.generate_campaign(req.persona, context, req.cart_items, brand_pdf, req.format, input_imgs)
    if campaign.get('image'):
        campaign['image'] = f"data:image/png;base64,{base64.b64encode(campaign['image']).decode('utf-8')}"
    logger.info("API: Campaign generation complete")
    return campaign

class SuggestionsRequest(BaseModel):
    brand_id: str
    garment_image: str # base64
    catalog: list

@app.post("/api/generate/suggestions")
async def api_generate_suggestions(req: SuggestionsRequest):
    if req.brand_id not in tasks:
        load_task_state(req.brand_id)
        
    vertex = VertexAIService()
    context = tasks.get(req.brand_id, {}).get('result', {}).get('report', "High-end fashion style.")
    g_img = base64.b64decode(req.garment_image.split(',')[-1])
    suggestions = await vertex.generate_suggestions(g_img, req.catalog, context)
    return {"suggestions": suggestions}

class LifestyleRequest(BaseModel):
    brand_id: str
    product_image: str # base64
    settings: dict
    useBrandPdf: Optional[bool] = False

@app.post("/api/generate/lifestyle")
async def api_generate_lifestyle(req: LifestyleRequest):
    logger.info(f"API: Lifestyle request for brand {req.brand_id}")
    if req.brand_id not in tasks:
        load_task_state(req.brand_id)
        
    vertex = VertexAIService()
    context = tasks.get(req.brand_id, {}).get('result', {}).get('report', "High-end fashion style.")
    p_img = base64.b64decode(req.product_image.split(',')[-1])
    
    brand_pdf = None
    if req.useBrandPdf:
        pdf_path = os.path.join("results", req.brand_id, "Reports", "Brand_Report.pdf")
        if os.path.exists(pdf_path):
            logger.info(f"API: Loading Brand PDF for Lifestyle grounding from {pdf_path}")
            with open(pdf_path, "rb") as f:
                brand_pdf = f.read()

    img_bytes = await vertex.generate_lifestyle_shot(p_img, context, req.settings, brand_pdf)
    logger.info("API: Lifestyle generation complete")
    return {"image": f"data:image/png;base64,{base64.b64encode(img_bytes).decode('utf-8')}"}

@app.post("/analyze")
async def start_analysis(req: AnalyzeRequest, bg: BackgroundTasks):
    task_id = str(uuid.uuid4())[:8]
    tasks[task_id] = {"status": "pending", "url": req.url}
    bg.add_task(process_brand, task_id, req.url)
    return {"task_id": task_id}

@app.get("/status/{task_id}")
async def get_status(task_id: str):
    if task_id not in tasks:
        if not load_task_state(task_id):
            raise HTTPException(404, "Task not found")
    return tasks[task_id]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
