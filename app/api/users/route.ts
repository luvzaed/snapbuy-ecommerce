import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, isAdmin } from "@/lib/api-auth";
import { hashPassword } from "@/lib/password";

// GET /api/users — list all users (admin only)
export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  try {
    const users = await prisma.user.findMany({
      // never return passwords; include fields the admin table needs
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(users);
  } catch {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

// POST /api/users — public registration.
// Always creates a normal USER and hashes the password; any role in the body is ignored.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password } = body; // `role` intentionally ignored here

    if (!email || !password) {
      return NextResponse.json({ error: "email and password are required" }, { status: 400 });
    }

    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Geçersiz e-posta adresi" }, { status: 400 });
    }

    const user = await prisma.user.create({
      data: {
        name: name ?? null,
        email,
        password: await hashPassword(password),
        role: "USER", // public registration can never create an admin
      },
      select: { id: true, name: true, email: true, role: true },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === "P2002") {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
