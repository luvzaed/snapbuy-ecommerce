import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPassword } from '@/lib/password';
import { signSession } from '@/lib/api-auth';
import { isLoginBlocked, recordFailedLogin, clearFailedLogins } from '@/lib/login-rate-limit';

export async function POST(req: Request) {
  try {
    // 1. Parse the incoming request body
    const body = await req.json();
    const { email, password } = body;
    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password || email.length > 254 || password.length > 1024) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 400 });
    }
    const normalizedEmail = email.trim().toLowerCase();
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (isLoginBlocked(normalizedEmail, clientIp)) {
      return NextResponse.json({ message: 'Too many login attempts. Try again later.' }, { status: 429, headers: { 'Retry-After': '900' } });
    }

    // 2. Validate input
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 },
      );
    }

    // 3. Find the user in the database using Prisma
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // 4. Check if user exists
    if (!user) {
      recordFailedLogin(normalizedEmail, clientIp);
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 },
      );
    }

    // 5. Verify the stored bcrypt password hash.
    const isPasswordValid = await verifyPassword(password, user.password);

    if (!isPasswordValid) {
      recordFailedLogin(normalizedEmail, clientIp);
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 },
      );
    }

    clearFailedLogins(normalizedEmail);

    // 6. Return success response (Login successful)
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name || '',
      role: user.role.toLowerCase(),
    };

    const response = NextResponse.json(
      { message: 'Login successful', user: userData },
      { status: 200 },
    );

    // Set a signed JWT so the server can verify the session's integrity on
    // every request. The role is baked into the signature, so editing the
    // cookie in the browser invalidates the token instead of granting access.
    const token = signSession({ id: user.id, role: userData.role });
    response.cookies.set('auth_session', token, {
      httpOnly: true, // Never expose the signed session token to browser JavaScript
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Login Error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 },
    );
  }
}
