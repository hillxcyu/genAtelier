import axios from 'axios';
import * as cheerio from 'cheerio';

export interface ScrapedData {
  url: string;
  title: string;
  description: string;
  imageUrls: string[];
  textChunks: string[];
  jsonLdProducts: any[]; // Kept for interface compatibility, mostly empty now
  htmlBody: string; // The raw static HTML body
}

export async function scrapeWebsite(url: string): Promise<ScrapedData> {
  try {
    // Basic validation
    new URL(url); 

    console.log(`[Scraper] Fetching static HTML: ${url}`);
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 10000
    });

    const html = response.data;
    const $ = cheerio.load(html);

    const title = $('title').text() || '';
    const description = $('meta[name="description"]').attr('content') || '';
    const bodyHtml = $('body').html() || '';

    // Extract Images (Static)
    const imageUrls: string[] = [];
    $('img').each((_, element) => {
      const src = $(element).attr('src');
      if (src) {
        if (!src.endsWith('.svg') && !src.includes('logo') && !src.includes('icon')) {
             try {
                const absoluteUrl = new URL(src, url).href;
                imageUrls.push(absoluteUrl);
             } catch (e) {}
        }
      }
    });

    // Extract Text (Static)
    const textChunks: string[] = [];
    $('h1, h2, h3, h4, p, span, div').each((_, element) => {
       const text = $(element).text().trim();
       if (text.length > 3 && text.length < 500) {
           textChunks.push(text);
       }
    });

    return {
      url,
      title,
      description,
      imageUrls: imageUrls.slice(0, 40),
      textChunks: textChunks.slice(0, 150),
      jsonLdProducts: [], 
      htmlBody: bodyHtml // Return static HTML for AI analysis
    };

  } catch (error) {
    console.error(`Scraping failed for ${url}:`, error);
    throw new Error('Failed to scrape website. It might be blocked or unavailable.');
  }
}