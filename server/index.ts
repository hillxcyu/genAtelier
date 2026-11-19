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
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { scrapeWebsite } from './services/scraper.ts';
import { processWithGemini } from './services/extractor.ts';
import axios from 'axios';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Support large image payloads

const projectId = process.env.GOOGLE_CLOUD_PROJECT;
const location = process.env.GOOGLE_CLOUD_LOCATION;
const apiKey = process.env.GEMINI_API_KEY;

let ai: GoogleGenAI;

if (projectId) {
  // Use Vertex AI
  console.log(`Initializing Vertex AI with project: ${projectId}, location: ${location}`);
  ai = new GoogleGenAI({
    vertexai: true,
    project: projectId,
    location: location || 'us-central1',
  });
} else {
  // Fallback to AI Studio
  console.log(`Initializing AI Studio with API Key: ${apiKey ? '***' + apiKey.slice(-4) : 'MISSING'}`);
  ai = new GoogleGenAI({ 
    apiKey: apiKey 
  });
}

// --- STATIC PATHS ---
const distPath = path.join(__dirname, '../dist');
const indexPath = path.join(distPath, 'index.html');

// 1. API Routes
app.post('/api/generate-content', async (req, res) => {
  console.log('Received request for /api/generate-content');
  try {
    const { model, contents, config } = req.body;
    
    if (!model || !contents) {
      console.error('Missing model or contents');
      res.status(400).json({ error: 'Model and contents are required' });
      return;
    }
    
    console.log(`Calling model: ${model}`);

    const response = await ai.models.generateContent({
      model: model,
      contents: contents,
      config: config
    });
    
    const rawResponse = (response as any).response ? (response as any).response : response;

    let textContent = null;
    try {
      if (typeof response.text === 'function') {
         textContent = response.text();
      } else if (rawResponse.candidates && rawResponse.candidates.length > 0) {
          textContent = rawResponse.candidates[0].content.parts.map((p: any) => p.text).join('');
      }
    } catch (e) {
      // Ignore text extraction errors
    }

    const dataToSend = {
        ...rawResponse,
        text: textContent
    };

    res.json(dataToSend);
  } catch (error: any) {
    console.error('Error generating content:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

app.post('/api/extract-brand', async (req, res) => {
  console.log('Received request for /api/extract-brand');
  try {
    const { url } = req.body;
    if (!url) {
      res.status(400).json({ error: 'URL is required' });
      return;
    }

    console.log(`Scraping website: ${url}`);
    const scrapedData = await scrapeWebsite(url);
    
    console.log('Extracting brand vibe with Gemini');
    const extractionResult = await processWithGemini(ai, scrapedData);

    res.json({
      success: true,
      data: extractionResult
    });
  } catch (error: any) {
    console.error('Error in brand extraction:', error);
    res.status(500).json({ error: error.message || 'Failed to extract brand' });
  }
});

app.get('/api/proxy-image', async (req, res) => {
  const imageUrl = req.query.url as string;
  if (!imageUrl) {
    res.status(400).send('Image URL is required');
    return;
  }

  try {
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000 // 10 second timeout
    });
    
    res.set('Content-Type', response.headers['content-type']);
    res.set('Access-Control-Allow-Origin', '*');
    res.send(response.data);

  } catch (error) {
    console.error(`Error proxying image ${imageUrl}:`, error);
    res.status(500).send('Failed to proxy image.');
  }
});

// 2. Serve Static Content (Unifies React App and Dummy Retailer)
if (fs.existsSync(distPath)) {
  console.log(`[Static] Serving unified content from ${distPath}`);
  app.use(express.static(distPath));
  
  // 3. Catch-all: Route non-file requests to the Frontend's index.html
  app.get('*', (req, res) => {
    // Exclude API routes
    if (!req.path.startsWith('/api')) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('Not Found');
    }
  });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
