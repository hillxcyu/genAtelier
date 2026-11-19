/**
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import express from 'express';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import cors from 'cors';

puppeteer.use(StealthPlugin());

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

app.post('/scrape', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'Missing url' });

  console.log(`[Stealth Scraper] Processing: ${url}`);
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process', // Often needed in containers
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    
    // Optimize: Block unnecessary resources
    await page.setRequestInterception(true);
    page.on('request', (req) => {
        const resourceType = req.resourceType();
        if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
            req.abort();
        } else {
            req.continue();
        }
    });
    
    // Set a realistic viewport and User Agent
    await page.setViewport({ width: 1920, height: 1080 });

    // Navigate with a generous timeout
    // domcontentloaded is faster than networkidle2 and sufficient for HTML extraction
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });

    // Explicit wait for interstitial if needed
    // If we are stuck on a challenge, wait a bit for it to resolve
    // But don't wait too long if body is already there
    try {
      await page.waitForSelector('body', { timeout: 5000 });
      // Optional: Wait for a specific product selector if we knew it, but generic is safer
      // await page.waitForSelector('img', { timeout: 5000 }); 
    } catch (e) {
      console.log('Wait for selector failed, proceeding with content capture anyway');
    }

    // Wait a small buffer for JS to hydrate key elements
    await new Promise(r => setTimeout(r, 5000));

    const content = await page.content();
    const title = await page.title();

    console.log(`[Stealth Scraper] Success. Title: ${title}`);

    res.json({ html: content });

  } catch (error) {
    console.error('[Stealth Scraper] Failed:', error);
    res.status(500).json({ error: error.message || 'Scraping failed' });
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        console.error('Error closing browser:', e);
      }
    }
  }
});

app.listen(PORT, () => {
  console.log(`Stealth Scraper Service listening on port ${PORT}`);
});
