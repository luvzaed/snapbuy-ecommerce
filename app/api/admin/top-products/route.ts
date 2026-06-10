import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/api-auth";

// GET /api/admin/top-products — top 5 products by units sold (admin only)
export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Group order items by product and sum quantities sold
    const grouped = await prisma.orderItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    });

    if (grouped.length === 0) return NextResponse.json([]);

    const productIds = grouped.map((g) => g.productId);

    // Fetch product names and images in one query
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, image: true },
    });

    // Compute revenue per product — sum(price × quantity) using stored order prices
    const allItems = await prisma.orderItem.findMany({
      where: { productId: { in: productIds } },
      select: { productId: true, price: true, quantity: true },
    });

    const revenueMap: Record<number, number> = {};
    for (const item of allItems) {
      revenueMap[item.productId] =
        (revenueMap[item.productId] ?? 0) + item.price * item.quantity;
    }

    const result = grouped.map((g) => {
      const product = products.find((p) => p.id === g.productId);
      return {
        productId: g.productId,
        name: product?.name ?? "Silinmiş Ürün",
        image: product?.image ?? "",
        totalQuantity: g._sum.quantity ?? 0,
        totalRevenue: revenueMap[g.productId] ?? 0,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching top products:", error);
    return NextResponse.json(
      { error: "Failed to fetch top products" },
      { status: 500 }
    );
  }
}
