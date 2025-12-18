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
    
    // Handle SDK wrapper: if response.response exists, return that (it contains candidates)
    // Otherwise return response directly.
    const rawResponse = (response as any).response ? (response as any).response : response;

    // The SDK's `text()` method is a helper that isn't serialized in JSON.
    // We need to manually extract it if it exists.
    let textContent = null;
    try {
      if (typeof response.text === 'function') {
         textContent = response.text();
      } else if (rawResponse.candidates && rawResponse.candidates.length > 0) {
          // Fallback extraction if .text() isn't available on the raw object
          textContent = rawResponse.candidates[0].content.parts.map((p: any) => p.text).join('');
      }
    } catch (e) {
      // Ignore text extraction errors (e.g. for image generation responses)
    }

    const dataToSend = {
        ...rawResponse,
        text: textContent // Add the extracted text as a property
    };

    // Log the response structure (shallow) to debug
    console.log('Response received, sending data keys:', Object.keys(dataToSend));

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

    console.log(`Scraping: ${url}`);
    let scrapedData;
    try {
      scrapedData = await scrapeWebsite(url);
    } catch (scrapeError: any) {
      console.warn(`[Warning] Scraping failed completely: ${scrapeError.message}`);
      console.log(`[Fallback] Proceeding with Semantic Inference (Hallucination) based on URL.`);
      
      // Construct fallback data
      const domain = new URL(url).hostname.replace('www.', '');
      scrapedData = {
        url: url,
        title: `${domain} (Inferred)`,
        description: `Brand analysis for ${domain}`,
        imageUrls: [],
        textChunks: [],
        jsonLdProducts: [],
        htmlBody: `<!-- SCRAPING FAILED. FALLBACK MODE. URL: ${url} -->` 
      };
    }
    
    console.log(`Extracting with AI...`);
    const extractionResult = await processWithGemini(ai, scrapedData);

    res.json(extractionResult);
  } catch (error: any) {
    console.error('Extraction flow failed:', error);
    res.status(500).json({ error: error.message || 'Failed to extract brand data' });
  }
});

app.get('/api/proxy-image', async (req, res) => {
  const imageUrl = req.query.url as string;

  if (!imageUrl) {
    return res.status(400).send('Image URL is required.');
  }

  try {
    // Fetch the image from the external URL
    const response = await axios.get(imageUrl, { 
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    // Set appropriate headers to allow cross-origin access and correctly serve the image
    res.set('Content-Type', response.headers['content-type']);
    res.set('Access-Control-Allow-Origin', '*'); // Allow all origins
    res.send(response.data);

  } catch (error) {
    console.error(`Error proxying image ${imageUrl}:`, error);
    res.status(500).send('Failed to proxy image.');
  }
});

// Serve static files from the React app if available
const distPath = path.join(__dirname, '../dist');
const indexPath = path.join(distPath, 'index.html');

if (fs.existsSync(indexPath)) {
  app.use(express.static(distPath));
  // The "catchall" handler: for any request that doesn't
  // match one above, send back React's index.html file.
  app.get('*', (req, res) => {
    res.sendFile(indexPath);
  });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
