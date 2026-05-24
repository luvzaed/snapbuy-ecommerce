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

    // Upsert: create new review or update existing one (one review per user per product)
    const review = await prisma.review.upsert({
      where: {
        userId_productId: {
          userId: Number(userId),
          productId: Number(productId),
        },
      },
      update: {
        rating: Number(rating),
        comment: comment || null,
      },
      create: {
        userId: Number(userId),
        productId: Number(productId),
        rating: Number(rating),
        comment: comment || null,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
  }
}
