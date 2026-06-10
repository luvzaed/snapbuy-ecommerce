import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Edge proxy (Next.js 16 replacement for middleware) for route-level protection.
 * Protects /admin/* routes by verifying the signed `auth_session` JWT and
 * checking the role claim it carries.
 *
 * Note: Next.js 16 renamed the "middleware" convention to "proxy". The file
 * MUST be named proxy.ts (or proxy.js) at the project root, and the exported
 * function MUST be named `proxy`.
 *
 * This runs on the Edge runtime, where the `jsonwebtoken` package (Node crypto)
 * cannot run. So we verify the same HS256 signature here using the platform's
 * native Web Crypto API. Token signing and the authoritative API-route checks
 * still use `jsonwebtoken` (see lib/api-auth.ts) — same secret, same algorithm.
 */

// Decode a base64url segment into raw bytes (Edge has atob but not Buffer).
function base64UrlToBytes(segment: string): Uint8Array<ArrayBuffer> {
  const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  const binary = atob(padded);
  // Allocate over an explicit ArrayBuffer so the type satisfies BufferSource
  // (crypto.subtle.verify rejects the SharedArrayBuffer-backed inference).
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function base64UrlToString(segment: string): string {
  return new TextDecoder().decode(base64UrlToBytes(segment));
}

interface SessionPayload {
  id: number;
  role: string;
}

// Verify a HS256 JWT and return its payload, or null if anything is off
// (bad shape, unexpected algorithm, invalid signature, or expired).
async function verifySessionToken(
  token: string,
  secret: string,
): Promise<SessionPayload | null> {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [headerB64, payloadB64, signatureB64] = parts;

  try {
    const header = JSON.parse(base64UrlToString(headerB64));
    if (header.alg !== 'HS256') return null;

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    );

    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      base64UrlToBytes(signatureB64),
      new TextEncoder().encode(`${headerB64}.${payloadB64}`),
    );
    if (!valid) return null;

    const payload = JSON.parse(base64UrlToString(payloadB64));
    // Reject expired tokens (exp is in seconds since epoch).
    if (typeof payload.exp === 'number' && Date.now() / 1000 >= payload.exp) {
      return null;
    }
    if (typeof payload.id !== 'number' || typeof payload.role !== 'string') {
      return null;
    }
    return { id: payload.id, role: payload.role };
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Admin route protection ──────────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('auth_session')?.value;
    const secret = process.env.JWT_SECRET;
    const session =
      token && secret ? await verifySessionToken(token, secret) : null;

    if (!session) {
      // Missing, tampered, or expired token → clear it and send to login.
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('auth_session');
      return response;
    }

    if (session.role !== 'admin') {
      // Valid session but not an admin → redirect to home.
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

// Only run on these routes
export const config = {
  matcher: ['/admin/:path*'],
};
