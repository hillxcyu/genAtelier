import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({
  vertexai: true,
  project: process.env.GOOGLE_CLOUD_PROJECT,
  location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
});

async function testInteractions() {
  console.log("Testing ai.interactions.create...");
  try {
    const interaction = await ai.interactions.create({
      model: 'gemini-3-pro-image-preview',
      input: 'Generate an image of a futuristic fashion accessory.',
      config: {
        responseModalities: ['IMAGE'],
      }
    } as any); // Cast because SDK types might be behind
    
    console.log("Interaction Response:", JSON.stringify(interaction, null, 2));
  } catch (err: any) {
    console.error("Interaction failed:", err.message);
    if (err.stack) console.error(err.stack);
  }
}

testInteractions();
