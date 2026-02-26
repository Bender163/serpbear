import { performance } from 'perf_hooks';
import { setTimeout as sleep } from 'timers/promises';
import { RefreshResult, removeFromRetryQueue, resolveScraperType, retryScrape, scrapeKeywordFromGoogle } from './scraper';
import parseKeywords from './parseKeywords';
import Keyword from '../database/models/keyword';

/**
 * Refreshes the Keywords position by Scraping Google Search Result by
 * Determining whether the keywords should be scraped in Parallel or not
 * @param {Keyword[]} rawkeyword - Keywords to scrape
 * @param {SettingsType} settings - The App Settings that contain the Scraper settings
 * @returns {Promise}
 */
const refreshAndUpdateKeywords = async (rawkeyword:Keyword[], settings:SettingsType): Promise<KeywordType[]> => {
   if (!rawkeyword || rawkeyword.length === 0) { return []; }
   const start = performance.now();
   const updatedKeywords: KeywordType[] = [];

   // Group keywords by their resolved scraper type (per-keyword engine support)
   const groups: Map<string, Keyword[]> = new Map();
   for (const kw of rawkeyword) {
      const plain = kw.get({ plain: true });
      const scraperType = resolveScraperType(plain, settings);
      if (!groups.has(scraperType)) groups.set(scraperType, []);
      groups.get(scraperType)!.push(kw);
   }

   // Process each engine group separately
   for (const [scraperType, groupKeywords] of groups) {
      const groupPlain = groupKeywords.map((el) => el.get({ plain: true }));

      if (['scrapingant', 'serpapi', 'searchapi'].includes(scraperType)) {
         // Parallel scraping for API-based scrapers
         const refreshedResults = await refreshParallel(groupPlain, settings);
         if (refreshedResults.length > 0) {
            for (const keyword of groupKeywords) {
               const refreshedkeywordData = refreshedResults.find((k) => k && k.ID === keyword.ID);
               if (refreshedkeywordData) {
                  const updatedkeyword = await updateKeywordPosition(keyword, refreshedkeywordData, settings);
                  updatedKeywords.push(updatedkeyword);
               }
            }
         }
      } else {
         // Sequential scraping with delay
         // Yandex: enforce minimum 5.5s delay (XMLRiver rate limit, error 203)
         const isYandex = scraperType === 'xmlriver-yandex';
         const minDelay = isYandex ? 5500 : 0;
         const configuredDelay = settings.scrape_delay ? parseInt(settings.scrape_delay, 10) : 0;
         const effectiveDelay = Math.max(minDelay, configuredDelay);

         for (const keyword of groupKeywords) {
            console.log('START SCRAPE: ', keyword.keyword, `[${scraperType}]`);
            const updatedkeyword = await refreshAndUpdateKeyword(keyword, settings);
            updatedKeywords.push(updatedkeyword);
            if (groupKeywords.length > 1 && effectiveDelay > 0) {
               await sleep(effectiveDelay);
            }
         }
      }
   }

   const end = performance.now();
   console.log(`time taken: ${end - start}ms`);
   return updatedKeywords;
};

/**
 * Scrape Serp for given keyword and update the position in DB.
 * @param {Keyword} keyword - Keywords to scrape
 * @param {SettingsType} settings - The App Settings that contain the Scraper settings
 * @returns {Promise<KeywordType>}
 */
const refreshAndUpdateKeyword = async (keyword: Keyword, settings: SettingsType): Promise<KeywordType> => {
   const currentkeyword = keyword.get({ plain: true });
   const refreshedkeywordData = await scrapeKeywordFromGoogle(currentkeyword, settings);
   const updatedkeyword = refreshedkeywordData ? await updateKeywordPosition(keyword, refreshedkeywordData, settings) : currentkeyword;
   return updatedkeyword;
};

/**
 * Processes the scraped data for the given keyword and updates the keyword serp position in DB.
 * @param {Keyword} keywordRaw - Keywords to Update
 * @param {RefreshResult} udpatedkeyword - scraped Data for that Keyword
 * @param {SettingsType} settings - The App Settings that contain the Scraper settings
 * @returns {Promise<KeywordType>}
 */
export const updateKeywordPosition = async (keywordRaw:Keyword, udpatedkeyword: RefreshResult, settings: SettingsType): Promise<KeywordType> => {
   const keywordPrased = parseKeywords([keywordRaw.get({ plain: true })]);
      const keyword = keywordPrased[0];
      // const udpatedkeyword = refreshed;
      let updated = keyword;

      if (udpatedkeyword && keyword) {
         const newPos = udpatedkeyword.position;
         const { history } = keyword;
         const theDate = new Date();
         const dateKey = `${theDate.getFullYear()}-${theDate.getMonth() + 1}-${theDate.getDate()}`;
         history[dateKey] = newPos;

         const updatedVal = {
            position: newPos,
            updating: false,
            url: udpatedkeyword.url,
            lastResult: udpatedkeyword.result,
            history,
            lastUpdated: udpatedkeyword.error ? keyword.lastUpdated : theDate.toJSON(),
            lastUpdateError: udpatedkeyword.error
               ? JSON.stringify({ date: theDate.toJSON(), error: `${udpatedkeyword.error}`, scraper: settings.scraper_type })
               : 'false',
         };

         // If failed, Add to Retry Queue Cron
         if (udpatedkeyword.error && settings?.scrape_retry) {
            await retryScrape(keyword.ID);
         } else {
            await removeFromRetryQueue(keyword.ID);
         }

         // Update the Keyword Position in Database
         try {
            await keywordRaw.update({
               ...updatedVal,
               lastResult: Array.isArray(udpatedkeyword.result) ? JSON.stringify(udpatedkeyword.result) : udpatedkeyword.result,
               history: JSON.stringify(history),
            });
            console.log('[SUCCESS] Updating the Keyword: ', keyword.keyword);
            updated = { ...keyword, ...updatedVal, lastUpdateError: JSON.parse(updatedVal.lastUpdateError) };
         } catch (error) {
            console.log('[ERROR] Updating SERP for Keyword', keyword.keyword, error);
         }
      }

      return updated;
};

/**
 * Scrape Google Keyword Search Result in Parallel.
 * @param {KeywordType[]} keywords - Keywords to scrape
 * @param {SettingsType} settings - The App Settings that contain the Scraper settings
 * @returns {Promise}
 */
const refreshParallel = async (keywords:KeywordType[], settings:SettingsType) : Promise<RefreshResult[]> => {
   const promises: Promise<RefreshResult>[] = keywords.map((keyword) => {
      return scrapeKeywordFromGoogle(keyword, settings);
   });

   return Promise.all(promises).then((promiseData) => {
      console.log('ALL DONE!!!');
      return promiseData;
   }).catch((err) => {
      console.log(err);
      return [];
   });
};

export default refreshAndUpdateKeywords;
