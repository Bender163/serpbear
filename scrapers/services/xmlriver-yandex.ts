/**
 * XMLRiver Yandex Scraper for SerpBear
 *
 * Uses XMLRiver API (xmlriver.com) to fetch Yandex SERP results.
 * API key format in settings.scaping_api: "user_id:api_key" (same as Google XMLRiver)
 *
 * CRITICAL: Use /search_yandex/xml (NOT /search_yandex/2/xml — causes IP block!)
 * CRITICAL: groupby MUST be exactly 10 for Yandex (error 102 otherwise)
 * Rate limit: minimum 5.5s between requests (error 203 if faster)
 */

import { parseXmlRiverResults } from './xmlriver';

// Map SerpBear country codes → Yandex lr region codes
// lr = Yandex region ID, determines search results localization
const yandexRegionMap: Record<string, number> = {
   RU: 225,      // Russia (all regions)
   BY: 149,      // Belarus
   KZ: 159,      // Kazakhstan
   UA: 187,      // Ukraine
   UZ: 171,      // Uzbekistan
};

// City-level Yandex lr codes (used when keyword.city is set)
const yandexCityMap: Record<string, number> = {
   // Russian names
   'Москва': 213,
   'Санкт-Петербург': 2,
   'Новосибирск': 65,
   'Екатеринбург': 54,
   'Казань': 43,
   'Нижний Новгород': 47,
   'Самара': 51,
   'Ростов-на-Дону': 39,
   'Краснодар': 35,
   'Воронеж': 193,
   'Красноярск': 62,
   'Пермь': 50,
   'Челябинск': 56,
   'Уфа': 172,
   'Волгоград': 38,
   'Омск': 66,
   'Тюмень': 55,
   // English names
   'Moscow': 213,
   'Saint Petersburg': 2,
   'St. Petersburg': 2,
   'SPb': 2,
   'Novosibirsk': 65,
   'Ekaterinburg': 54,
   'Kazan': 43,
   'Nizhny Novgorod': 47,
   'Samara': 51,
   'Rostov-on-Don': 39,
   'Krasnodar': 35,
   'Voronezh': 193,
   'Krasnoyarsk': 62,
   'Perm': 50,
   'Chelyabinsk': 56,
   'Ufa': 172,
   'Volgograd': 38,
   'Omsk': 66,
   'Tyumen': 55,
};

const xmlriverYandex: ScraperSettings = {
   id: 'xmlriver-yandex',
   name: 'XMLRiver (Yandex)',
   website: 'xmlriver.com',
   resultObjectKey: '',
   responseType: 'text',
   perKeywordOnly: true,  // Only available per-keyword via engine field, not as global scraper

   scrapeURL: (keyword, settings, countries) => {
      const apiCredentials = settings.scaping_api || '';
      const [user, key] = apiCredentials.split(':');
      if (!user || !key) {
         console.log('[XMLRiver Yandex] ERROR: API key must be in format "user_id:api_key"');
         return '';
      }

      // Determine Yandex region (lr)
      // Priority: city → country → default (Moscow=213)
      let lr = 213; // Default: Moscow
      if (keyword.city && yandexCityMap[keyword.city]) {
         lr = yandexCityMap[keyword.city];
      } else if (keyword.country && yandexRegionMap[keyword.country]) {
         lr = yandexRegionMap[keyword.country];
      }

      // CRITICAL: groupby MUST be 10 for Yandex (not 100 like Google!)
      // CRITICAL: /search_yandex/xml (NOT /search_yandex/2/xml — IP block!)
      const url = `http://xmlriver.com/search_yandex/xml?user=${user}&key=${key}`
         + `&query=${encodeURIComponent(keyword.keyword)}`
         + `&groupby=10&lr=${lr}&lang=ru`;

      console.log('[XMLRiver Yandex] URL:', url.replace(key, '***'), `lr=${lr}`);
      return url;
   },

   serpExtractor: (content: string): scraperExtractedItem[] => {
      return parseXmlRiverResults(content, 'Yandex');
   },
};

export default xmlriverYandex;
