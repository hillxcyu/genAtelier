import axios from 'axios';
import * as cheerio from 'cheerio';

export interface ScrapedData {
  url: string;
  title: string;
  description: string;
  imageUrls: string[];
  textChunks: string[];
}

export async function scrapeWebsite(url: string): Promise<ScrapedData> {
  try {
    // Basic validation
    new URL(url); 

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
    });

    const html = response.data;
    const $ = cheerio.load(html);

    const title = $('title').text() || '';
    const description = $('meta[name="description"]').attr('content') || '';

    // Extract Images
    const imageUrls: string[] = [];
    $('img').each((_, element) => {
      const src = $(element).attr('src');
      if (src) {
        // Simple filter for likely product images (ignore tiny icons)
        // In a real scraper, we'd check dimensions or look for specific classes
        if (!src.endsWith('.svg') && !src.includes('logo') && !src.includes('icon')) {
             // Handle relative URLs
             try {
                const absoluteUrl = new URL(src, url).href;
                imageUrls.push(absoluteUrl);
             } catch (e) {
                // ignore invalid urls
             }
        }
      }
    });

    // Extract Text (H1-H3, Product names, prices)
    const textChunks: string[] = [];
    $('h1, h2, h3, h4, p, span, div').each((_, element) => {
       const text = $(element).text().trim();
       if (text.length > 3 && text.length < 500) {
           textChunks.push(text);
       }
    });

    // Limit data size for LLM context
    return {
      url,
      title,
      description,
      imageUrls: imageUrls.slice(0, 30), // Top 30 images
      textChunks: textChunks.slice(0, 100) // Top 100 text chunks
    };

  } catch (error) {
    console.error(`Scraping failed for ${url}:`, error);
    throw new Error('Failed to scrape website. It might be blocked or unavailable.');
  }
}
