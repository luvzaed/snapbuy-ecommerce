import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPassword, hashPassword, isHashed } from '@/lib/password';

export async function POST(req: Request) {
  try {
    // 1. Parse the incoming request body
    const body = await req.json();
    const { email, password } = body;

    // 2. Validate input
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 },
      );
    }

    // 3. Find the user in the database using Prisma
    const user = await prisma.user.findUnique({
      where: { email: email },
    });

    // 4. Check if user exists
    if (!user) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 },
      );
    }

    // 5. Verify password (bcrypt, with a legacy plaintext fallback)
    const isPasswordValid = await verifyPassword(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 },
      );
    }

    // Lazy migration: once a legacy plaintext password is verified, upgrade it
    // to a bcrypt hash so the account is hashed going forward.
    if (!isHashed(user.password)) {
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { password: await hashPassword(password) },
        });
      } catch (e) {
        console.error('Password hash upgrade failed (non-fatal):', e);
      }
    }

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

    // Set auth cookie so server-side middleware can verify access
    response.cookies.set('auth_session', JSON.stringify({ id: user.id, role: userData.role }), {
      httpOnly: false, // Needs to be readable for client-side logout clearing
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
