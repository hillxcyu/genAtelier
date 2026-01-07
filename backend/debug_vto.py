import asyncio
import os
import base64
from services.vertex_service import VertexAIService
import logging

logging.basicConfig(level=logging.INFO)

async def test_vto():
    vertex = VertexAIService()
    # Create tiny dummy images (1x1 black pixel)
    dummy_img = base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==")
    
    print("Testing VTO...")
    result = await vertex.generate_vto(dummy_img, dummy_img, "High-end fashion vibe.")
    
    if result:
        print(f"Success! Result size: {len(result)} bytes")
    else:
        print("Failed: Result is empty")

if __name__ == "__main__":
    asyncio.run(test_vto())
