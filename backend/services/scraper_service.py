import asyncio
import logging
from playwright.async_api import async_playwright, Page
from playwright_stealth import Stealth
from typing import Dict, Any, List
from urllib.parse import urljoin
import re

logger = logging.getLogger("ScraperService")

class ScraperService:
    """
    Simplified scraper focused on essential brand assets:
    - Screenshot
    - Logos/Icons
    - Colors (Computed)
    - Fonts (Computed)
    """
    async def analyze_url(self, url: str) -> Dict[str, Any]:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True, args=["--no-sandbox"])
            context = await browser.new_context(viewport={"width": 1920, "height": 1080})
            page = await context.new_page()
            await Stealth().apply_stealth_async(page)
            
            try:
                # Normalize URL
                if not url.startswith(('http://', 'https://')):
                    url = 'https://' + url
                
                # Navigate with timeout
                try:
                    logger.info(f"Navigating to {url}...")
                    await page.goto(url, wait_until="domcontentloaded", timeout=15000)
                    await asyncio.sleep(2) # Settling time
                except Exception as e:
                    logger.warning(f"Navigation warning for {url}: {e}")

                # Extract Data
                logger.info(f"Extracting brand metadata from {url}")
                title = await page.title()
                screenshot = await page.screenshot() # binary
                
                assets = await self._extract_assets(page, url)
                fonts = await self._extract_fonts(page)
                colors = await self._extract_colors(page)
                css = await self._extract_css(page)
                
                logger.info(f"Extraction successful: {title}")
                
                return {
                    "url": url,
                    "title": title or "Unknown Brand",
                    "screenshot": screenshot,
                    "assets": assets,
                    "fonts": fonts,
                    "colors": colors,
                    "css": css
                }
            finally:
                await browser.close()

    async def _extract_assets(self, page: Page, base_url: str) -> List[Dict[str, str]]:
        return await page.evaluate("""(baseUrl) => {
            const assets = [];
            
            // Icons
            document.querySelectorAll("link[rel*='icon']").forEach(el => {
                if (el.href) assets.push({type: 'favicon', url: el.href});
            });
            
            // Logos
            document.querySelectorAll("img, svg").forEach(el => {
                const src = el.src || "";
                const cls = (el.className || "").toString().toLowerCase();
                const id = (el.id || "").toString().toLowerCase();
                if (src && (cls.includes('logo') || id.includes('logo') || src.includes('logo'))) {
                    assets.push({type: 'logo', url: src});
                }
            });
            
            return assets.slice(0, 10); // Limit count
        }""")

    async def _extract_fonts(self, page: Page) -> List[str]:
        return await page.evaluate("""() => {
            const fonts = new Set();
            ['h1', 'body', 'button'].forEach(tag => {
                const el = document.querySelector(tag);
                if (el) {
                    const family = window.getComputedStyle(el).fontFamily;
                    if (family) fonts.add(family);
                }
            });
            return Array.from(fonts);
        }""")

    async def _extract_colors(self, page: Page) -> List[str]:
        return await page.evaluate("""() => {
            const counts = {};
            document.querySelectorAll('*').forEach(el => {
                const style = window.getComputedStyle(el);
                const bg = style.backgroundColor;
                if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
                    counts[bg] = (counts[bg] || 0) + 1;
                }
            });
            return Object.entries(counts)
                .sort((a,b) => b[1] - a[1])
                .slice(0, 8)
                .map(x => x[0]);
        }""")
        
    async def _extract_css(self, page: Page) -> List[Dict[str, str]]:
        return await page.evaluate("""() => {
            const css = [];
            // Sheets
            document.querySelectorAll("link[rel='stylesheet']").forEach(el => {
                if (el.href) css.push({type: 'external_css', url: el.href});
            });
            return css.slice(0, 3);
        }""")
