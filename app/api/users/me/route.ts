import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedSession } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  const session = await getAuthenticatedSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, name: true, email: true, role: true },
  });
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({
    user: { ...user, role: user.role.toLowerCase() },
  }, { headers: { 'Cache-Control': 'no-store' } });
}
