import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// POST /api/newsletter — subscribe an email address (no auth required)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email: string = (body?.email ?? "").trim().toLowerCase();

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json(
        { error: "Geçersiz e-posta adresi" },
        { status: 400 },
      );
    }

    await prisma.newsletter.create({ data: { email } });

    return NextResponse.json(
      { message: "Başarıyla abone oldunuz!" },
      { status: 200 },
    );
  } catch (error: unknown) {
    // Prisma unique-constraint violation code: P2002
    if (
      typeof error === "object" &&
      error !== null &&
      (error as { code?: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Bu e-posta zaten kayıtlı." },
        { status: 400 },
      );
    }
    console.error("Newsletter subscription error:", error);
    return NextResponse.json(
      { error: "Bir hata oluştu. Lütfen tekrar deneyin." },
      { status: 500 },
    );
  }
}
