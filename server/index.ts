import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Support large image payloads

const projectId = process.env.GOOGLE_CLOUD_PROJECT;
const location = process.env.GOOGLE_CLOUD_LOCATION;
const apiKey = process.env.GEMINI_API_KEY;

// We initialize two instances: 
// 1. aiVertex - Primary for standard models (Flash, etc.)
// 2. aiStudio - Fallback or direct for Preview/Image models that 404 on Vertex
let aiVertex: GoogleGenAI | null = null;
let aiStudio: GoogleGenAI | null = null;

if (projectId) {
  console.log(`Initializing Vertex AI with project: ${projectId}, location: ${location || 'us-central1'}`);
  aiVertex = new GoogleGenAI({
    vertexai: true,
    project: projectId,
    location: location || 'us-central1',
  });
}

if (apiKey) {
  console.log(`Initializing AI Studio with API Key: ***${apiKey.slice(-4)}`);
  aiStudio = new GoogleGenAI({ 
    apiKey: apiKey 
  });
}

// Global variable for backward compatibility if needed, but we'll use the specific ones above.
const aiDefault = aiVertex || aiStudio;
if (!aiDefault) {
  console.error('CRITICAL: No AI service initialized. Check GEMINI_API_KEY or GOOGLE_CLOUD_PROJECT.');
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
    
    // Logic: 
    // - If model is gemini-3-pro-image-preview, try AI Studio first (known Vertex 404)
    // - Otherwise, try Vertex first, fallback to Studio
    
    let response;
    let usedService = 'none';

    try {
      if (model === 'gemini-3-pro-image-preview' && aiStudio) {
        console.log(`Directing ${model} to AI Studio...`);
        response = await aiStudio.models.generateContent({ model, contents, config });
        usedService = 'Studio (Direct)';
      } else if (aiVertex) {
        console.log(`Calling vertex: ${model} in project: ${projectId}`);
        response = await aiVertex.models.generateContent({ model, contents, config });
        usedService = 'Vertex';
      } else if (aiStudio) {
        console.log(`Calling Studio: ${model}`);
        response = await aiStudio.models.generateContent({ model, contents, config });
        usedService = 'Studio';
      } else {
        throw new Error('No AI service (Vertex or Studio) is available.');
      }
    } catch (primaryError: any) {
      console.warn(`Primary service call failed for ${model}:`, primaryError.message);
      
      // Fallback logic if first attempt failed and we have an alternative
      if (usedService === 'Vertex' && aiStudio) {
        console.log(`Falling back to AI Studio for ${model}...`);
        response = await aiStudio.models.generateContent({ model, contents, config });
        usedService = 'Studio (Fallback)';
      } else if (usedService === 'Studio (Direct)' && aiVertex) {
        console.log(`Falling back to Vertex for ${model}...`);
        response = await aiVertex.models.generateContent({ model, contents, config });
        usedService = 'Vertex (Fallback)';
      } else {
        throw primaryError; // No fallback available or primary error was final
      }
    }

    console.log(`Success using ${usedService}. Raw response type:`, typeof response);
    const rawResponse = (response as any).response ? (response as any).response : response;

    let textContent = null;
    try {
      if (typeof response.text === 'function') {
         textContent = response.text();
      } else if (rawResponse.candidates && rawResponse.candidates.length > 0) {
          textContent = rawResponse.candidates[0].content.parts.map((p: any) => p.text).join('');
      }
    } catch (e) {
      console.log('Text extraction skipped (might be image response)');
    }

    const dataToSend = {
        ...rawResponse,
        text: textContent,
        metadata: { service: usedService }
    };

    res.json(dataToSend);
  } catch (error: any) {
    console.error('Error generating content ERROR_BODY:', error);
    res.status(500).json({ 
      error: error.message || 'Internal Server Error',
      details: error.stack,
      raw: error.response?.data || error.response || error
    });
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
