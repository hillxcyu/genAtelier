import asyncio
import os
from services.vertex_service import VertexAIService

async def list_models():
    vertex = VertexAIService()
    if not vertex.client:
        print("Client not initialized")
        return
    
    print("Listing models...")
    try:
        # The SDK might have a way to list models
        # For now let's just try to list them via the client if possible
        # Or check the documentation/search again for the EXACT string
        models = await vertex.client.aio.models.list()
        for m in models:
            print(f"Model: {m.name}, Display Name: {m.display_name}")
    except Exception as e:
        print(f"Failed to list models: {e}")

if __name__ == "__main__":
    asyncio.run(list_models())
