import jwt from 'jsonwebtoken';
import type { NextRequest } from 'next/server';

export interface Session {
  id: number;
  role: string; // lowercase, e.g. 'admin' | 'user'
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
export function signSession(session: Session): string {
  return jwt.sign({ id: session.id, role: session.role }, getSecret(), {
    algorithm: JWT_ALG,
    expiresIn: JWT_EXPIRES_IN,
  });
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
      typeof (decoded as jwt.JwtPayload).id === 'number' &&
      typeof (decoded as jwt.JwtPayload).role === 'string'
    ) {
      const payload = decoded as jwt.JwtPayload;
      return { id: payload.id, role: payload.role };
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
