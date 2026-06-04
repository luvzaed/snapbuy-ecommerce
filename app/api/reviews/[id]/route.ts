import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, isAdmin } from "@/lib/api-auth";

interface Params {
  params: Promise<{ id: string }>;
}

// DELETE /api/reviews/[id]
// Authorised when the requester either owns the review OR is an admin.
// After deletion the product's denormalised rating / reviewCount is
// recalculated so product cards immediately reflect the new average.
export async function DELETE(req: NextRequest, { params }: Params) {
  const session = getSession(req);
  if (!session) {
    return NextResponse.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401 });
  }

  const { id } = await params;
  const reviewId = Number(id);
  if (isNaN(reviewId)) {
    return NextResponse.json({ error: "Geçersiz yorum ID'si." }, { status: 400 });
  }

  // Fetch the review so we can verify ownership and know the productId for
  // the post-deletion rating recalculation.
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!review) {
    return NextResponse.json({ error: "Yorum bulunamadı." }, { status: 404 });
  }

  // Allow deletion only if the requester is the review author OR an admin.
  const ownsReview = session.id === review.userId;
  if (!ownsReview && !isAdmin(session)) {
    return NextResponse.json(
      { error: "Bu yorumu silme yetkiniz yok." },
      { status: 403 },
    );
  }

  // Delete the review.
  await prisma.review.delete({ where: { id: reviewId } });

  // Recalculate the product's rating cache (best-effort — same pattern as POST).
  // After deletion the aggregate runs over the remaining reviews, so if the
  // product now has zero reviews, _avg.rating is null and _count._all is 0.
  try {
    const aggregate = await prisma.review.aggregate({
      where: { productId: review.productId },
      _avg: { rating: true },
      _count: { _all: true },
    });

    await prisma.product.update({
      where: { id: review.productId },
      data: {
        rating: aggregate._avg.rating ?? null,
        reviewCount: aggregate._count._all,
      },
    });
  } catch (syncError) {
    console.error(
      "[reviews DELETE] Product rating sync failed (review was still deleted):",
      syncError instanceof Error ? syncError.message : syncError,
    );
  }

  return NextResponse.json({ success: true });
}
