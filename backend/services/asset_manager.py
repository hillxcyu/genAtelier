import os
import aiofiles
import httpx
from typing import List, Dict

class AssetManager:
    def __init__(self, base_dir: str = "results"):
        self.base_dir = base_dir

    def create_dirs(self, brand_id: str):
        path = os.path.join(self.base_dir, brand_id)
        for d in ["Snapshot", "Assets", "Reports"]:
            os.makedirs(os.path.join(path, d), exist_ok=True)
        return path

    async def save_screenshot(self, brand_id: str, data: bytes):
        path = os.path.join(self.base_dir, brand_id, "Snapshot", "home.png")
        async with aiofiles.open(path, "wb") as f:
            await f.write(data)
        return path

    async def save_assets(self, brand_id: str, assets: List[Dict[str, str]]) -> List[str]:
        saved_paths = []
        async with httpx.AsyncClient() as client:
            for i, asset in enumerate(assets):
                try:
                    url = asset['url']
                    if not url.startswith('http'): continue
                    
                    # Extension guess
                    ext = "png"
                    if "svg" in url.lower(): ext = "svg"
                    elif "jpg" in url.lower() or "jpeg" in url.lower(): ext = "jpg"
                    elif "webp" in url.lower(): ext = "webp"
                    
                    filename = f"asset_{i}.{ext}"
                    path = os.path.join(self.base_dir, brand_id, "Assets", filename)
                    
                    resp = await client.get(url, timeout=5)
                    if resp.status_code == 200:
                        async with aiofiles.open(path, "wb") as f:
                            await f.write(resp.content)
                        saved_paths.append(path)
                except Exception:
                    pass
        return saved_paths

    def save_color_swatches(self, brand_id: str, colors: List[str]) -> List[Dict[str, str]]:
        """Generates small solid color PNGs for report embedding"""
        from PIL import Image as PILImage
        import re

        saved_data = []
        swatch_dir = os.path.join(self.base_dir, brand_id, "Assets", "Colors")
        os.makedirs(swatch_dir, exist_ok=True)

        for i, color_str in enumerate(colors):
            try:
                # Parse rgb(r,g,b) or rgba(r,g,b,a) or #hex
                rgb = (0,0,0)
                hex_code = color_str
                if color_str.startswith('rgb'):
                    nums = [int(n) for n in re.findall(r'\d+', color_str)]
                    rgb = tuple(nums[:3])
                    hex_code = '#%02x%02x%02x' % rgb
                elif color_str.startswith('#'):
                    c = color_str.lstrip('#')
                    rgb = tuple(int(c[i:i+2], 16) for i in (0, 2, 4))
                
                img = PILImage.new('RGB', (100, 100), color=rgb)
                path = os.path.join(swatch_dir, f"color_{i}.png")
                img.save(path)
                saved_data.append({"path": path, "hex": hex_code})
            except Exception as e:
                print(f"Failed to save color swatch {color_str}: {e}")
        
        return saved_data

    async def save_text(self, brand_id: str, filename: str, content: str):
        path = os.path.join(self.base_dir, brand_id, "Reports", filename)
        async with aiofiles.open(path, "w") as f:
            await f.write(content)
        return path
