import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import Cookies from 'cookies';

/**
 * MarketingOS Auto-Login Bridge.
 *
 * GET /api/mos-auth?token=<MOS_JWT>&redirect=<path>
 *
 * Verifies a MarketingOS JWT token, sets the mos_token cookie,
 * and redirects the user to the specified path (default: /domains).
 *
 * This allows seamless SSO from MarketingOS into the SERP Tracker.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
   if (req.method !== 'GET') {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
   }

   const { token, redirect } = req.query;
   const mosSecret = process.env.MOS_JWT_SECRET;

   if (!token || typeof token !== 'string') {
      return res.status(400).json({ success: false, error: 'Missing token parameter' });
   }

   if (!mosSecret) {
      return res.status(500).json({ success: false, error: 'MOS_JWT_SECRET not configured' });
   }

   try {
      // Verify the MarketingOS JWT
      const decoded = jwt.verify(token, mosSecret) as {
         userId?: string;
         companyId?: string;
         role?: string;
         email?: string;
      };

      if (!decoded || !decoded.userId) {
         return res.status(401).json({ success: false, error: 'Invalid token payload' });
      }

      // Set mos_token cookie (httpOnly, 15 minutes TTL)
      const cookies = new Cookies(req, res);
      const maxAge = 15 * 60 * 1000; // 15 minutes in milliseconds
      cookies.set('mos_token', token, {
         httpOnly: true,
         sameSite: 'lax',
         maxAge,
         path: '/',
      });

      // Redirect to the specified path or /domains
      const redirectPath = (typeof redirect === 'string' && redirect.startsWith('/')) ? redirect : '/domains';
      return res.redirect(302, redirectPath);
   } catch (err) {
      return res.status(401).json({ success: false, error: 'Invalid or expired token' });
   }
}
