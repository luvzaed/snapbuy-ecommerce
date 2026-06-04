import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/reviews?productId=X — fetch reviews for a product
export async function GET(req: NextRequest) {
  try {
    const productId = req.nextUrl.searchParams.get("productId");

    if (!productId) {
      return NextResponse.json({ error: "productId is required" }, { status: 400 });
    }

    const reviews = await prisma.review.findMany({
      where: { productId: Number(productId) },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

// POST /api/reviews — create or update a review
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, productId, rating, comment } = body;

    // Auth check: verify the user is logged in and matches the userId
    const sessionCookie = req.cookies.get("auth_session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Login required to post a review" }, { status: 401 });
    }
    try {
      const session = JSON.parse(sessionCookie);
      if (session.id !== Number(userId)) {
        return NextResponse.json({ error: "You can only post reviews as yourself" }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    if (!userId || !productId || !rating) {
      return NextResponse.json({ error: "userId, productId, and rating are required" }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    // Comment is required and must not be empty
    const trimmedComment = typeof comment === "string" ? comment.trim() : "";
    if (!trimmedComment) {
      return NextResponse.json({ error: "Comment is required" }, { status: 400 });
    }

    // Any logged-in user may review (one review per user per product).
    // This is the source of truth — if it fails, the request fails.
    const review = await prisma.review.upsert({
      where: {
        userId_productId: {
          userId: Number(userId),
          productId: Number(productId),
        },
      },
      update: {
        rating: Number(rating),
        comment: trimmedComment,
      },
      create: {
        userId: Number(userId),
        productId: Number(productId),
        rating: Number(rating),
        comment: trimmedComment,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Sync the denormalised rating cache on Product so that ProductCard and
    // any listing reading product.rating / product.reviewCount reflects the
    // new review immediately. This is BEST-EFFORT — if the sync fails for any
    // reason (stale Prisma client, transient DB error, etc.) we log it but
    // still return the saved review. The review itself is already persisted.
    try {
      const aggregate = await prisma.review.aggregate({
        where: { productId: Number(productId) },
        _avg: { rating: true },
        _count: { _all: true },
      });

      await prisma.product.update({
        where: { id: Number(productId) },
        data: {
          rating: aggregate._avg.rating ?? null,
          reviewCount: aggregate._count._all,
        },
      });
    } catch (syncError) {
      // Non-fatal: the review was already saved. Surface enough detail in the
      // server logs to diagnose, then continue and return success.
      console.error(
        "[reviews POST] Product rating sync failed (review was still saved):",
        syncError instanceof Error ? syncError.message : syncError,
      );
      if (syncError instanceof Error && syncError.stack) {
        console.error(syncError.stack);
      }
    }

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    // Log full detail so the actual Prisma/SQL error shows up in the dev logs
    // instead of a generic "Failed to create review".
    console.error("[reviews POST] Error creating review:");
    if (error instanceof Error) {
      console.error("  message:", error.message);
      console.error("  stack:", error.stack);
    } else {
      console.error("  raw:", error);
    }
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
  }
}
