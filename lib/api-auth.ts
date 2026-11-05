import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import prisma from '@/lib/prisma';
import type { NextRequest } from 'next/server';

export interface Session {
  id: number;
  role: string; // lowercase, e.g. 'admin' | 'user'
  sessionId: string;
}

// HS256 (HMAC-SHA256) keeps a single shared secret. The Edge proxy verifies the
// same signature with Web Crypto, so both sides must agree on this algorithm.
const JWT_ALG = 'HS256' as const;
const JWT_EXPIRES_IN = '7d';

// Read the signing secret. Throwing (rather than falling back to a default)
// is deliberate: a hardcoded fallback secret would reintroduce the exact
// forgery vulnerability we're closing here.
function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      'JWT_SECRET is not set. Add it to your .env file before signing or verifying sessions.',
    );
  }
  return secret;
}

// Sign a session into a JWT for the `auth_session` cookie. Only the server,
// holding JWT_SECRET, can produce a token that getSession() will accept.
export async function signSession(session: Pick<Session, 'id' | 'role'>): Promise<string> {
  const sessionId = randomUUID();
  const token = jwt.sign({ id: session.id, role: session.role }, getSecret(), {
    algorithm: JWT_ALG,
    expiresIn: JWT_EXPIRES_IN,
    jwtid: sessionId,
  });
  await prisma.$transaction([
    prisma.session.deleteMany({ where: { userId: session.id, expiresAt: { lte: new Date() } } }),
    prisma.session.create({ data: { id: sessionId, userId: session.id, expiresAt: new Date(Date.now() + 7 * 86400_000) } }),
  ]);
  return token;
}

// Verify the `auth_session` cookie's signature and return the session claims.
// Returns null when the cookie is missing, tampered with, expired, or malformed.
export function getSession(req: NextRequest): Session | null {
  const token = req.cookies.get('auth_session')?.value;
  if (!token) return null;
  try {
    // Pin the algorithm so a forged token can't downgrade to `alg: none`.
    const decoded = jwt.verify(token, getSecret(), { algorithms: [JWT_ALG] });
    if (
      typeof decoded === 'object' &&
      decoded !== null &&
      Number.isSafeInteger((decoded as jwt.JwtPayload).id) &&
      (decoded as jwt.JwtPayload).id > 0 &&
      typeof (decoded as jwt.JwtPayload).role === 'string' &&
      typeof decoded.jti === 'string' && decoded.jti.length > 0
    ) {
      const payload = decoded as jwt.JwtPayload;
      return { id: payload.id, role: payload.role, sessionId: decoded.jti };
    }
    return null;
  } catch {
    // Invalid signature, expired token, or malformed payload.
    return null;
  }
}

export function isAdmin(session: Session | null): boolean {
  return session?.role === 'admin';
}

/** Resolve user identity and role from the database on every authenticated API request.
 * Stale admin-role claims and deleted accounts cannot keep accessing protected APIs.
 */
export async function getAuthenticatedSession(req: NextRequest): Promise<Session | null> {
  const tokenSession = getSession(req);
  if (!tokenSession) return null;
  const stored = await prisma.session.findUnique({
    where: { id: tokenSession.sessionId },
    select: { userId: true, expiresAt: true, user: { select: { id: true, role: true } } },
  });
  if (!stored || stored.userId !== tokenSession.id || stored.expiresAt <= new Date()) return null;
  return { id: stored.user.id, role: stored.user.role.toLowerCase(), sessionId: tokenSession.sessionId };
}
