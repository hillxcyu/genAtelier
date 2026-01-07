import asyncio
import os
import base64
from services.vertex_service import VertexAIService
import logging

logging.basicConfig(level=logging.INFO)

async def test_pdf_grounding():
    vertex = VertexAIService()
    print("Testing VTO with PDF Grounding...")
    
    # Tiny dummy images (1x1 black pixel)
    dummy_img = base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==")
    
    # Create a dummy PDF bytes (minimal valid PDF structure is complex, 
    # but Vertex AI just needs the bytes and 'application/pdf' mime type)
    # Using a fake but realistic-looking byte stream for testing the API call structure.
    dummy_pdf = b"%PDF-1.4\n1 0 obj\n<< /Title (Brand Guidelines) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF"
    
    result = await vertex.generate_vto(
        dummy_img, 
        dummy_img, 
        "Minimalist Brand Vibe", 
        brand_pdf_bytes=dummy_pdf
    )
    
    if result:
        print(f"Success! Result size: {len(result)} bytes")
    else:
        print("Failed: Result is empty")

if __name__ == "__main__":
    asyncio.run(test_pdf_grounding())
