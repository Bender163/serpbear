import type { NextApiRequest, NextApiResponse } from 'next';
import Cookies from 'cookies';
import jwt from 'jsonwebtoken';

/**
 * Verifies MarketingOS JWT token from mos_token cookie.
 * Returns 'authorized' if valid, empty string otherwise.
 */
const verifyMosToken = (mosToken: string): string => {
   const mosSecret = process.env.MOS_JWT_SECRET;
   if (!mosToken || !mosSecret) return '';

   try {
      const decoded = jwt.verify(mosToken, mosSecret) as { userId?: string; companyId?: string; role?: string };
      if (decoded && decoded.userId) {
         return 'authorized';
      }
   } catch (err) {
      // Invalid MOS token, fall through
   }
   return '';
};

/**
 * Psuedo Middleware: Verifies the user by their cookie value, MarketingOS JWT, or API Key.
 * Auth priority: 1) SerpBear token cookie, 2) MarketingOS mos_token cookie, 3) API Key header.
 * @param {NextApiRequest} req - The Next Request
 * @param {NextApiResponse} res - The Next Response.
 * @returns {string}
 */
const verifyUser = (req: NextApiRequest, res: NextApiResponse): string => {
   const cookies = new Cookies(req, res);
   const token = cookies && cookies.get('token');
   const mosToken = cookies && cookies.get('mos_token');

   const allowedApiRoutes = [
      'GET:/api/keyword',
      'GET:/api/keywords',
      'GET:/api/domains',
      'POST:/api/refresh',
      'POST:/api/cron',
      'POST:/api/notify',
      'POST:/api/searchconsole',
      'GET:/api/searchconsole',
      'GET:/api/insight',
   ];
   const verifiedAPI = req.headers.authorization ? req.headers.authorization.substring('Bearer '.length) === process.env.APIKEY : false;
   const accessingAllowedRoute = req.url && req.method && allowedApiRoutes.includes(`${req.method}:${req.url.replace(/\?(.*)/, '')}`);
   console.log(req.method, req.url);

   let authorized: string = '';

   // 1. Check SerpBear native token cookie
   if (token && process.env.SECRET) {
      jwt.verify(token, process.env.SECRET, (err) => {
         authorized = err ? 'Not authorized' : 'authorized';
      });
   }

   // 2. If not authorized by native token, check MarketingOS JWT cookie
   if (authorized !== 'authorized' && mosToken) {
      const mosResult = verifyMosToken(mosToken);
      if (mosResult === 'authorized') {
         authorized = 'authorized';
      }
   }

   // 3. If still not authorized, check API key
   if (authorized !== 'authorized') {
      if (verifiedAPI && accessingAllowedRoute) {
         authorized = 'authorized';
      } else {
         if (!token && !mosToken) {
            authorized = 'Not authorized';
         }
         if (token && !process.env.SECRET) {
            authorized = 'Token has not been Setup.';
         }
         if (verifiedAPI && !accessingAllowedRoute) {
            authorized = 'This Route cannot be accessed with API.';
         }
         if (req.headers.authorization && !verifiedAPI) {
            authorized = 'Invalid API Key Provided.';
         }
      }
   }

   return authorized;
};

export default verifyUser;
