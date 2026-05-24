import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/visual-search
 * Receives a base64 image, forwards it to the Python CLIP server,
 * and returns full product details for the matched products.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image } = body;

    if (!image) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      );
    }

    // Forward image to Python visual search server
    const pythonResponse = await fetch("http://localhost:8000/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image }),
    });

    if (!pythonResponse.ok) {
      const errorData = await pythonResponse.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || "Visual search server error" },
        { status: pythonResponse.status }
      );
    }

    const { results } = await pythonResponse.json();

    if (!results || results.length === 0) {
      return NextResponse.json({ products: [] });
    }

    // Fetch full product details from database
    const productIds = results.map(
      (r: { product_id: number }) => r.product_id
    );

    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    // Merge product details with similarity scores, maintaining rank order
    const enrichedResults = results.map(
      (r: { product_id: number; similarity: number }) => {
        const product = products.find((p) => p.id === r.product_id);
        return {
          ...product,
          similarity: r.similarity,
        };
      }
    );

    return NextResponse.json({ products: enrichedResults });
  } catch (error) {
    console.error("Visual search error:", error);

    // Check if the Python server is unreachable
    if (
      error instanceof TypeError &&
      (error as Error).message?.includes("fetch")
    ) {
      return NextResponse.json(
        {
          error:
            "Visual search server is not running. Start it with: cd visual-search-server && python main.py",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
