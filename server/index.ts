import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
