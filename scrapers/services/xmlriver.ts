/**
 * XMLRiver Google Scraper for SerpBear
 *
 * Uses XMLRiver API (xmlriver.com) to fetch Google SERP results.
 * API key format in settings.scaping_api: "user_id:api_key"
 * Example: "2212:f80f8dd20b97f85414bc6bd08ae7139e7c33deea"
 *
 * XMLRiver returns XML, not JSON. This scraper uses responseType: 'text'
 * (handled by the modified scraper.ts) and parses XML in serpExtractor.
 */

// Map SerpBear country codes (ISO 2-letter) → XMLRiver Google country codes
const countryMap: Record<string, number> = {
   IN: 2356,  // India
   RU: 2008,  // Russia
   US: 2840,  // USA
   GB: 2826,  // UK
   DE: 2276,  // Germany
   FR: 2250,  // France
   BR: 2076,  // Brazil
   AU: 2036,  // Australia
   CA: 2124,  // Canada
   JP: 2392,  // Japan
   KR: 2410,  // South Korea
   CN: 2156,  // China
   AE: 2784,  // UAE
   SA: 2682,  // Saudi Arabia
   SG: 2702,  // Singapore
   IL: 2376,  // Israel
   TR: 2792,  // Turkey
   PL: 2616,  // Poland
   NL: 2528,  // Netherlands
   IT: 2380,  // Italy
   ES: 2724,  // Spain
};

// Override language for specific countries (SerpBear defaults may be wrong)
const langOverrides: Record<string, string> = {
   IN: 'en',  // India → English (not Hindi)
   RU: 'ru',  // Russia → Russian
};

const xmlriver: ScraperSettings = {
   id: 'xmlriver',
   name: 'XMLRiver (Google)',
   website: 'xmlriver.com',
   resultObjectKey: '',  // We handle parsing in serpExtractor
   responseType: 'text', // XMLRiver returns XML, not JSON

   scrapeURL: (keyword, settings, countries) => {
      const apiCredentials = settings.scaping_api || '';
      const [user, key] = apiCredentials.split(':');
      if (!user || !key) {
         console.log('[XMLRiver] ERROR: API key must be in format "user_id:api_key"');
         return '';
      }

      const country = keyword.country || 'US';
      const countryCode = countryMap[country] || 2840; // Default: USA
      const lang = langOverrides[country] || (countries[country] ? countries[country][2] : 'en');

      const url = `http://xmlriver.com/search/xml?user=${user}&key=${key}`
         + `&query=${encodeURIComponent(keyword.keyword)}`
         + `&groupby=100&country=${countryCode}&lang=${lang}`;

      console.log('[XMLRiver Google] URL:', url.replace(key, '***'));
      return url;
   },

   serpExtractor: (content: string): scraperExtractedItem[] => {
      return parseXmlRiverResults(content);
   },
};

/**
 * Parse XMLRiver XML response and extract organic search results.
 * XMLRiver format:
 *   <results><grouping>
 *     <group id="0"><doc><url>...</url><title>...</title></doc></group>
 *     <group id="1"><doc><url>...</url><title>...</title></doc></group>
 *   </grouping></results>
 */
export function parseXmlRiverResults(xml: string, source: string = 'Google'): scraperExtractedItem[] {
   const results: scraperExtractedItem[] = [];

   // Check for XMLRiver error
   const errorMatch = xml.match(/<error\s+code="(\d+)"[^>]*>([^<]*)<\/error>/i);
   if (errorMatch) {
      console.log(`[XMLRiver] API Error ${errorMatch[1]}: ${errorMatch[2]}`);
      return results;
   }

   // Extract <results> section
   const resultsSection = xml.match(/<results>([\s\S]*)<\/results>/);
   const searchArea = resultsSection ? resultsSection[1] : xml;

   // Extract URLs and titles from <group> blocks
   const groupPattern = /<group[^>]*>([\s\S]*?)<\/group>/gi;
   let match;
   let position = 0;

   while ((match = groupPattern.exec(searchArea)) !== null) {
      const groupContent = match[1];

      // Extract URL
      const urlMatch = groupContent.match(/<url>(.*?)<\/url>/i);
      if (!urlMatch || !urlMatch[1].trim()) continue;

      // Extract title
      const titleMatch = groupContent.match(/<title>(.*?)<\/title>/i);
      const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : '';

      position += 1;
      results.push({
         title: title || `Result ${position}`,
         url: urlMatch[1].trim(),
         position,
      });
   }

   console.log(`[XMLRiver ${source}] Extracted ${results.length} results`);
   return results;
}

export default xmlriver;
