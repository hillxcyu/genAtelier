import os
import base64
import asyncio
from google import genai
from google.genai import types
from typing import Dict, Any, List, Optional
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("VertexAIService")

class VertexAIService:
    def __init__(self):
        self.project_id = os.getenv("GOOGLE_CLOUD_PROJECT")
        self.location = os.getenv("GOOGLE_CLOUD_LOCATION", "global")
        try:
            self.client = genai.Client(
                vertexai=True,
                project=self.project_id,
                location=self.location
            )
            # Default to Flash for speed and efficiency
            self.model_id = "gemini-2.5-flash"
            logger.info(f"VertexAIService initialized with project {self.project_id} in {self.location}")
        except Exception as e:
            logger.error(f"VertexAIService Init failed: {e}")
            self.client = None

    async def search_brand_guidelines(self, brand_name: str, url: str) -> str:
        """Uses Google Search Grounding to find brand guidelines."""
        if not self.client: return "Vertex AI Client not initialized."

        prompt = f"""
        Find official brand guidelines for {brand_name} ({url}).
        Focus on:
        - Primary/Secondary Colors (Hex codes)
        - Typography/Fonts
        - Logo usage rules
        - Brand Tone/Voice
        
        Provide a structured summary.
        """
        
        try:
            response = await self.client.aio.models.generate_content(
                model=self.model_id,
                contents=prompt,
                config=types.GenerateContentConfig(
                    tools=[types.Tool(google_search=types.GoogleSearch())],
                    temperature=0.4
                )
            )
            return response.text
        except Exception as e:
            return f"Error finding guidelines: {e}"

    async def generate_brand_report(self, brand_data: Dict[str, Any], guidelines: str) -> str:
        """Generates a comprehensive Markdown report."""
        if not self.client: return "Vertex AI Client not initialized."

        prompt = f"""
        Act as a Senior Brand Strategist. Create a "Brand Identity Core" report for {brand_data.get('title')}.
        
        ## Input Data
        - URL: {brand_data.get('url')}
        - Scraped Colors: {brand_data.get('colors')}
        - Scraped Fonts: {brand_data.get('fonts')}
        - Research: {guidelines}
        
        ## Output Format
        Professional Markdown with sections for 1. Executive Summary, 2. Visual DNA (Colors, Typography), 3. Brand Voice, 4. Creative Direction, and 5. AI Imagery Prompts.
        """
        try:
            response = await self.client.aio.models.generate_content(
                model=self.model_id,
                contents=prompt
            )
            return response.text
        except Exception as e:
            return f"Error generating report: {e}"

    async def generate_vto(self, person_image: bytes, garment_image: bytes, brand_context: str, additional_items: List[bytes] = None, brand_pdf_bytes: Optional[bytes] = None) -> bytes:
        """Generates Virtual Try-On grounded in brand style, supporting multiple items and a brand guidelines PDF."""
        prompt = f"""
        Generate a photorealistic high-fashion shot of the person in the first image wearing the garment in the second image.
        
        {f"Additionally, the person should be wearing/carrying the items provided in the subsequent {len(additional_items)} images to create a complete look." if additional_items else ""}

        STRICT BRAND CONSISTENCY:
        {brand_context}
        
        { "Please follow the visual style, lighting, and aesthetic guidelines described in the attached brand PDF document." if brand_pdf_bytes else ""}
        
        Ensure lighting, background, modeling pose, and styling align with the brand's creative direction.
        The output should be a cohesive fashion photography style shot.
        """
        
        contents = [
            prompt,
            types.Part.from_bytes(data=person_image, mime_type="image/png"),
            types.Part.from_bytes(data=garment_image, mime_type="image/png")
        ]
        
        if additional_items:
            for item in additional_items:
                contents.append(types.Part.from_bytes(data=item, mime_type="image/png"))

        if brand_pdf_bytes:
            contents.append(types.Part.from_bytes(data=brand_pdf_bytes, mime_type="application/pdf"))

        try:
            logger.info(f"Starting VTO generation{' with PDF grounding' if brand_pdf_bytes else ''}...")
            response = await self.client.aio.models.generate_content(
                model="gemini-3-pro-image-preview", 
                contents=contents,
                config=types.GenerateContentConfig(
                    image_config=types.ImageConfig(aspect_ratio="3:4", image_size="1K")
                )
            )
            # Return first image part detected
            for part in response.candidates[0].content.parts:
                if part.inline_data:
                    logger.info("VTO generation successful")
                    return part.inline_data.data
            logger.warning("VTO generation produced no image part")
            return b""
        except Exception as e:
            logger.error(f"VTO failed: {e}")
            if hasattr(e, 'message'): logger.error(f"Msg: {e.message}")
            return b""

    async def generate_lookbook_page(self, product_images: List[bytes], brand_context: str, brand_pdf_bytes: Optional[bytes] = None) -> bytes:
        """Generates an editorial lookbook page with optional PDF grounding."""
        prompt = f"""
        Create a single-page high-fashion editorial lookbook layout featuring these products.
        Layout should be asymmetrical and artistic.
        
        STRICT BRAND CONSISTENCY:
        {brand_context}
        
        { "Please follow the layout, typography, and aesthetic guidelines described in the attached brand guidelines PDF." if brand_pdf_bytes else ""}
        
        Ensure the background colors, typography, and logo placement follow the brand guidelines exactly.
        """
        contents = [prompt]
        for img in product_images:
            contents.append(types.Part.from_bytes(data=img, mime_type="image/png"))
        
        if brand_pdf_bytes:
            contents.append(types.Part.from_bytes(data=brand_pdf_bytes, mime_type="application/pdf"))

        try:
            logger.info(f"Starting lookbook page generation with {len(product_images)} images{' and PDF grounding' if brand_pdf_bytes else ''}")
            response = await self.client.aio.models.generate_content(
                model="gemini-3-pro-image-preview",
                contents=contents,
                config=types.GenerateContentConfig(
                    image_config=types.ImageConfig(aspect_ratio="3:4", image_size="1K")
                )
            )
            for part in response.candidates[0].content.parts:
                if part.inline_data:
                    logger.info("Lookbook page generation successful")
                    return part.inline_data.data
            logger.warning("Lookbook generation produced no image part")
            return b""
        except Exception as e:
            logger.error(f"Lookbook gen failed: {e}")
            if hasattr(e, 'message'): logger.error(f"Msg: {e.message}")
            return b""

    async def generate_campaign(self, persona: Dict[str, Any], brand_context: str, cart_items: Optional[List[str]] = None, brand_pdf_bytes: Optional[bytes] = None, format: str = "mobile", input_images: Optional[List[bytes]] = None) -> Dict[str, Any]:
        """Generates a complete 'one-image' campaign email grounded in brand DNA, persona, and cart items."""
        if not self.client: return {}

        aspect_ratio = "9:16" if format == "mobile" else "16:9"
        
        prompt = f"""
        ACT AS A WORLD-CLASS FASHION ART DIRECTOR & UI DESIGNER.
        Create a SINGLE COMPOSITE IMAGE that is a complete marketing campaign email for {brand_context}.
        
        TARGET PERSONA:
        - Name: {persona.get('name', 'Customer')}
        - Age/Style: {persona.get('age', 25)}yo, {persona.get('style_preferences', 'Modern')}
        
        CONTENT REQUIREMENTS:
        - The image MUST include both high-fashion visuals AND integrated marketing copy (Subject, Headline, Call to Action).
        - VISUALS: Use the provided product images to create a stylish, aspirational 'look' or scene.
        - COPY: Generate a catchy subject line and a personalized message (max 30 words) embedded in the design.
        - LAYOUT: Professional {format} layout. Mobile (9:16) should be a vertical scroll-ready ad. Wide (16:9) should be a hero banner style.
        
        {f"FEATURED PRODUCTS: {', '.join(cart_items)}" if cart_items else ""}
        
        { "Follow the brand guidelines, typography, and color palette from the attached PDF." if brand_pdf_bytes else ""}
        
        OUTPUT: One single, high-resolution composite image acting as the entire email creative.
        """
        
        try:
            logger.info(f"Starting Unified Campaign generation for {persona.get('name')} in {format} format")
            
            contents = [prompt]
            if input_images:
                for img_bytes in input_images:
                    contents.append(types.Part.from_bytes(data=img_bytes, mime_type="image/png"))
            
            if brand_pdf_bytes:
                contents.append(types.Part.from_bytes(data=brand_pdf_bytes, mime_type="application/pdf"))

            response = await self.client.aio.models.generate_content(
                model="gemini-3-pro-image-preview",
                contents=contents,
                config=types.GenerateContentConfig(
                    image_config=types.ImageConfig(aspect_ratio=aspect_ratio, image_size="1K")
                )
            )
            
            img_data = b""
            for part in response.candidates[0].content.parts:
                if part.inline_data:
                    img_data = part.inline_data.data
                    logger.info("Unified Campaign image generated successfully")
                    break
            
            return {"image": img_data, "format": format, "subject": "Automated Campaign", "body": "Full image template generated."}
        except Exception as e:
            logger.error(f"Unified Campaign gen failed: {e}")
            return {}

    async def get_brand_vibe(self, url: str) -> Dict[str, Any]:
        """Infers a BrandVibe object (name, colors, font, mood, keywords) from URL and analysis"""
        if not self.client: return {}

        prompt = f"""
        Analyze the brand identity for: {url}
        Return JSON EXACTLY:
        {{
            "name": "Brand Name",
            "colors": ["#hex1", "#hex2", "#hex3"],
            "font": "serif" | "sans" | "mono",
            "accentColor": "#hex",
            "mood": "Short vibe description",
            "keywords": ["word1", "word2", "word3", "word4", "word5"],
            "fonts": ["Font 1", "Font 2"]
        }}
        """
        try:
            response = await self.client.aio.models.generate_content(
                model=self.model_id,
                contents=prompt,
                config=types.GenerateContentConfig(response_mime_type="application/json")
            )
            return json.loads(response.text)
        except:
            return {}

    async def generate_synthetic_catalog(self, url: str, brand_name: str, mood: str, brand_pdf_bytes: Optional[bytes] = None) -> List[Dict[str, Any]]:
        """Guesses 12 fashion products and generates AI images for them"""
        if not self.client: return []

        prompt = f"""
        Brand: {brand_name} ({url})
        Style: {mood}
        Generate a list of 12 fashion products this brand would likely sell.
        IMPORTANT: Include a diverse mix: 6 Garments (tops, bottoms, dresses), 3 Accessories (bags, jewelry, belts), and 3 Shoes (heels, boots, sneakers).
        For each product, provide: name, category, price (e.g. $120).
        Return JSON list of objects: [{{"name": "...", "category": "...", "price": "..."}}]
        """
        try:
            contents = [prompt]
            if brand_pdf_bytes:
                prompt += "\nRefer to the attached brand guidelines PDF for product categories and naming style."
                contents = [prompt, types.Part.from_bytes(data=brand_pdf_bytes, mime_type="application/pdf")]

            response = await self.client.aio.models.generate_content(
                model=self.model_id,
                contents=contents,
                config=types.GenerateContentConfig(response_mime_type="application/json")
            )
            
            # Robust JSON parsing
            clean_text = response.text.strip()
            if clean_text.startswith("```"):
                clean_text = clean_text.split("```")[1]
                if clean_text.startswith("json"):
                    clean_text = clean_text[4:].strip()
                clean_text = clean_text.split("```")[0].strip()
                
            products = json.loads(clean_text)
            
            async def generate_prod_image(p, i):
                img_prompt = f"""
                HIGH-END PRODUCT PHOTOGRAPHY:
                Item: {p['name']} by {brand_name}. 
                Category: {p['category']}.
                Style: {mood}. 
                
                SPECIFICATIONS:
                - Studio ghost mannequin or elegant flat lay only.
                - SOLID NEUTRAL BACKGROUND (Pure White or Light Grey).
                - NO MODELS, NO HUMANS, NO HANDS, NO LIFESTYLE SCENES.
                - NO BACKGROUND PROPS, NO FLOWERS, NO FURNITURE.
                - Centered, sharp focus, high-end commercial quality.
                """
                if brand_pdf_bytes:
                    img_prompt += "\nFollow the visual aesthetic and product presentation rules from the attached brand guidelines PDF."
                
                img_contents = [img_prompt]
                if brand_pdf_bytes:
                    img_contents.append(types.Part.from_bytes(data=brand_pdf_bytes, mime_type="application/pdf"))

                try:
                    res = await self.client.aio.models.generate_content(
                        model="gemini-2.5-flash-image",
                        contents=img_contents,
                        config=types.GenerateContentConfig(
                            image_config=types.ImageConfig(aspect_ratio="3:4", image_size="1K")
                        )
                    )
                    for part in res.candidates[0].content.parts:
                        if part.inline_data:
                            b64 = base64.b64encode(part.inline_data.data).decode('utf-8')
                            return f"data:image/png;base64,{b64}"
                except Exception as e:
                    logger.error(f"Image generation error for {p['name']}: {str(e)}")
                    print(f"!!! Error generating {p['name']}: {e}")
                return f"https://picsum.photos/seed/{brand_name}_{i}_fashion_fallback/400/600" # Fallback

            logger.info(f"Generating images for {len(products)} products in parallel...")
            tasks = [generate_prod_image(p, i) for i, p in enumerate(products)]
            image_urls = await asyncio.gather(*tasks)

            for i, p in enumerate(products):
                p['id'] = f"synth_{i}"
                p['imageUrl'] = image_urls[i]
            
            return products
        except Exception as e:
            logger.error(f"Catalog generation failed: {e}")
            return []
    async def generate_suggestions(self, garment_image: bytes, catalog: List[Dict[str, Any]], brand_context: str) -> List[Dict[str, Any]]:
        """Suggests matching items from the catalog for a given garment"""
        catalog_summary = [{"id": c['id'], "name": c['name'], "category": c['category']} for c in catalog]
        
        prompt = f"""
        Analyze the garment in the image and suggest 3 matching items from this catalog that would create a complete, brand-aligned look.
        
        BRAND CONTEXT:
        {brand_context}
        
        CATALOG:
        {json.dumps(catalog_summary)}
        
        Return STRICT JSON:
        {{
            "suggestions": [
                {{"itemId": "...", "reason": "Short styling tip"}}
            ]
        }}
        """
        try:
            response = await self.client.aio.models.generate_content(
                model=self.model_id,
                contents=[
                    prompt,
                    types.Part.from_bytes(data=garment_image, mime_type="image/png")
                ],
                config=types.GenerateContentConfig(response_mime_type="application/json")
            )
            data = json.loads(response.text)
            return data.get('suggestions', [])
        except Exception as e:
            print(f"Suggestions failed: {e}")
            return []
    async def generate_lifestyle_shot(self, product_image: bytes, brand_context: str, settings: Dict[str, str], brand_pdf_bytes: Optional[bytes] = None) -> bytes:
        """Generates a professional lifestyle shot for a product with optional PDF grounding."""
        prompt = f"""
        Create a professional, high-fashion lifestyle photograph of the product in the image.
        
        Set the product in this context:
        - Model Preference: {settings.get('modelType', 'Professional Fashion Model')}
        - Background: {settings.get('background', 'Studio Minimalist')}
        - Lighting: {settings.get('lighting', 'Soft Cinematic')}
        
        STRICT BRAND CONSISTENCY:
        {brand_context}
        
        { "Follow the lifestyle photography aesthetic and model styling found in the attached brand guidelines PDF." if brand_pdf_bytes else ""}
        
        The garment/product must be the centerpiece. The output should be a high-end, brand-aligned photography asset for a campaign.
        """
        
        contents = [
            prompt,
            types.Part.from_bytes(data=product_image, mime_type="image/png")
        ]
        
        if brand_pdf_bytes:
            contents.append(types.Part.from_bytes(data=brand_pdf_bytes, mime_type="application/pdf"))

        try:
            logger.info(f"Starting lifestyle shot generation{' with PDF grounding' if brand_pdf_bytes else ''}")
            response = await self.client.aio.models.generate_content(
                model="gemini-3-pro-image-preview",
                contents=contents,
                config=types.GenerateContentConfig(
                    image_config=types.ImageConfig(aspect_ratio="3:4", image_size="1K")
                )
            )
            for part in response.candidates[0].content.parts:
                if part.inline_data:
                    logger.info("Lifestyle shot generation successful")
                    return part.inline_data.data
            logger.warning("Lifestyle shot generation produced no image part")
            return b""
        except Exception as e:
            logger.error(f"Lifestyle gen failed: {e}")
            if hasattr(e, 'message'): logger.error(f"Msg: {e.message}")
            return b""
