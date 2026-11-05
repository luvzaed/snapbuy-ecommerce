import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedSession, isAdmin } from "@/lib/api-auth";
import { hashPassword, verifyPassword } from "@/lib/password";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/users/[id] — admin only
export async function GET(req: NextRequest, { params }: Params) {
  const session = await getAuthenticatedSession(req);
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
  const session = await getAuthenticatedSession(req);
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

    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.length > 120) return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
      data.name = body.name;
    }
    if (body.email !== undefined) {
      const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      if (typeof body.email !== 'string' || body.email.length > 254 || !EMAIL_RE.test(body.email.trim())) {
        return NextResponse.json({ error: "Geçersiz e-posta adresi" }, { status: 400 });
      }
      data.email = body.email.trim().toLowerCase();
    }

    // Role changes are admin-only; silently ignored for non-admins.
    if (body.role !== undefined && admin) {
      if (typeof body.role !== 'string' || !['USER', 'ADMIN'].includes(body.role.toUpperCase())) return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
      if (targetId === session.id && body.role.toUpperCase() !== 'ADMIN') return NextResponse.json({ error: 'Cannot remove your own admin role' }, { status: 400 });
      data.role = body.role.toUpperCase();
    }

    // Password change: accept `newPassword` (profile) or `password` (admin reset).
    const newPassword = body.newPassword ?? body.password;
    if (newPassword !== undefined && newPassword !== "") {
      if (typeof newPassword !== "string" || newPassword.length < 8 || Buffer.byteLength(newPassword, 'utf8') > 72) return NextResponse.json({ error: "Password must be at least 8 characters and at most 72 UTF-8 bytes" }, { status: 400 });
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

    const updated = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
      where: { id: targetId },
      data,
      select: { id: true, name: true, email: true, role: true },
      });
      if (data.password) await tx.session.deleteMany({ where: { userId: targetId } });
      return user;
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "User not found or update failed" }, { status: 404 });
  }
}

// DELETE /api/users/[id] — admin only
export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await getAuthenticatedSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  try {
    const { id } = await params;
    if (session.id === Number(id)) return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    await prisma.user.delete({ where: { id: Number(id) } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "User not found or delete failed" }, { status: 404 });
  }
}
