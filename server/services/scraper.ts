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
  // Helper to process HTML string
  const processHtml = (html: string, baseUrl: string): ScrapedData => {
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
                const absoluteUrl = new URL(src, baseUrl).href;
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
      url: baseUrl,
      title,
      description,
      imageUrls: imageUrls.slice(0, 40),
      textChunks: textChunks.slice(0, 150),
      jsonLdProducts: [], 
      htmlBody: bodyHtml // Return static HTML for AI analysis
    };
  };

  try {
    // Basic validation
    new URL(url); 
    
    const scraperServiceUrl = process.env.SCRAPER_SERVICE_URL;

    if (scraperServiceUrl) {
      console.log(`[Scraper] Sending request to Stealth Scraper Service: ${scraperServiceUrl}`);
      try {
        const stealthResponse = await axios.post(scraperServiceUrl, { url }, { timeout: 90000 });
        if (stealthResponse.data && stealthResponse.data.html) {
           console.log(`[Scraper] Stealth scrape successful.`);
           return processHtml(stealthResponse.data.html, url);
        }
      } catch (stealthError: any) {
        console.error(`[Scraper] Stealth service failed:`, stealthError.message);
        // Fallthrough to direct axios if stealth fails? Or just throw?
        // Let's try direct axios as a last resort backup if the service is down but the site might be simple
        console.log(`[Scraper] Attempting direct fallback...`);
      }
    }

    console.log(`[Scraper] Fetching via direct Axios: ${url}`);
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 10000
    });

    return processHtml(response.data, url);

  } catch (error: any) {
    console.error(`Scraping failed for ${url}: ${error.message}`);
    throw new Error('Failed to scrape website. It might be blocked or unavailable.');
  }
}