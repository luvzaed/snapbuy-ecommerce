import type { NextRequest } from 'next/server';

export interface Session {
  id: number;
  role: string; // lowercase, e.g. 'admin' | 'user'
}

// Read and parse the `auth_session` cookie set at login.
// Returns null when the cookie is missing or malformed.
export function getSession(req: NextRequest): Session | null {
  const raw = req.cookies.get('auth_session')?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed?.id === 'number' && typeof parsed?.role === 'string') {
      return { id: parsed.id, role: parsed.role };
    }
    return null;
  } catch {
    return null;
  }
}

export function isAdmin(session: Session | null): boolean {
  return session?.role === 'admin';
}
