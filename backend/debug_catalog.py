import asyncio
import os
from services.vertex_service import VertexAIService
import logging

logging.basicConfig(level=logging.INFO)

async def test_catalog():
    vertex = VertexAIService()
    print("Testing Synthetic Catalog Generation (Product-Centric Prompt)...")
    
    # Simulate a brand with some PDF grounding if you want, or just test the prompt
    # Let's test just the prompt first
    catalog = await vertex.generate_synthetic_catalog("www.zara.com", "Zara", "Modern High-Street Fashion")
    
    if catalog:
        print(f"Success! Generated {len(catalog)} products.")
        for i, p in enumerate(catalog):
            print(f"{i+1}. {p['name']} ({p['category']}) - {p['price']}")
            if p['imageUrl'].startswith('data:image'):
                print(f"   Image: [Base64 OK]")
            elif "picsum.photos" in p['imageUrl']:
                print(f"   Image: [FAILED - FALLBACK USED: {p['imageUrl']}]")
            else:
                print(f"   Image: [URL: {p['imageUrl']}]")
    else:
        print("Failed: Catalog is empty")

if __name__ == "__main__":
    asyncio.run(test_catalog())
