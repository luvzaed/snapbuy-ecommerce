import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, isAdmin } from "@/lib/api-auth";
import { hashPassword, verifyPassword } from "@/lib/password";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/users/[id] — admin only
export async function GET(req: NextRequest, { params }: Params) {
  const session = getSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  try {
    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
      select: { id: true, email: true, role: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}

// PUT /api/users/[id]
// - A user may update only their own account (and never their own role).
// - An admin may update any account, including changing roles.
// - Passwords are always hashed; a self password change must verify the current one.
export async function PUT(req: NextRequest, { params }: Params) {
  const session = getSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const targetId = Number(id);
    const admin = isAdmin(session);

    // Non-admins may only modify their own record.
    if (!admin && session.id !== targetId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const data: Record<string, unknown> = {};

    if (body.name !== undefined) data.name = body.name;
    if (body.email !== undefined) {
      const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      if (!EMAIL_RE.test(body.email)) {
        return NextResponse.json({ error: "Geçersiz e-posta adresi" }, { status: 400 });
      }
      data.email = body.email;
    }

    // Role changes are admin-only; silently ignored for non-admins.
    if (body.role !== undefined && admin) {
      data.role = body.role;
    }

    // Password change: accept `newPassword` (profile) or `password` (admin reset).
    const newPassword = body.newPassword ?? body.password;
    if (newPassword !== undefined && newPassword !== "") {
      // A user changing their own password must prove the current one.
      if (!admin) {
        const existing = await prisma.user.findUnique({ where: { id: targetId } });
        if (!existing) {
          return NextResponse.json({ error: "User not found" }, { status: 404 });
        }
        const ok = await verifyPassword(body.currentPassword ?? "", existing.password);
        if (!ok) {
          return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
        }
        if (newPassword === (body.currentPassword ?? "")) {
          return NextResponse.json({ error: "Yeni şifre, mevcut şifre ile aynı olamaz." }, { status: 400 });
        }
      }
      data.password = await hashPassword(newPassword);
    }

    const updated = await prisma.user.update({
      where: { id: targetId },
      data,
      select: { id: true, name: true, email: true, role: true },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "User not found or update failed" }, { status: 404 });
  }
}

// DELETE /api/users/[id] — admin only
export async function DELETE(req: NextRequest, { params }: Params) {
  const session = getSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  try {
    const { id } = await params;
    await prisma.user.delete({ where: { id: Number(id) } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "User not found or delete failed" }, { status: 404 });
  }
}
