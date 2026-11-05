import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/api-auth';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (session) {
    try {
      await prisma.session.deleteMany({ where: { id: session.sessionId, userId: session.id } });
    } catch {
      return NextResponse.json({ error: 'Could not revoke session. Please try again.' }, { status: 503 });
    }
  }
  const response = NextResponse.json({ success: true });
  response.cookies.set('auth_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}
