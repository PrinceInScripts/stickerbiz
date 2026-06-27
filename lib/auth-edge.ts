/**
 * Auth Edge Utilities
 * Edge-compatible auth functions for middleware.
 * These functions only use jose (Edge-compatible) and do NOT import Prisma/db.
 */

import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'fallback-secret-change-me'
);

const COOKIE_NAME = 'session-token';

type SessionPayload = {
  userId: string;
  role: string;
};

/**
 * Verify and decode a JWT session token (Edge-compatible).
 */
export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Get the session token from request cookies (Edge-compatible).
 */
export function getSessionTokenFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie') || '';
  const cookies = Object.fromEntries(
    cookieHeader.split('; ').map((c) => {
      const [key, ...val] = c.split('=');
      return [key, val.join('=')];
    })
  );
  return cookies[COOKIE_NAME] || null;
}
