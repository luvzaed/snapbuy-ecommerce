import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/orders?userId=X — fetch orders for a user
// GET /api/orders?all=true — fetch ALL orders (admin)
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    const fetchAll = req.nextUrl.searchParams.get("all");

    // Authenticate the session from the cookie
    const sessionCookie = req.cookies.get("auth_session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let session;
    try {
      session = JSON.parse(sessionCookie);
    } catch {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    // Admin: fetch all orders with user info
    if (fetchAll === "true") {
      if (session.role !== "admin") {
        return NextResponse.json({ error: "Admin access required" }, { status: 403 });
      }

      const orders = await prisma.order.findMany({
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json(orders);
    }

    // Regular user: fetch their orders
    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Prevent IDOR: users can only fetch their own orders (unless admin)
    if (session.id !== Number(userId) && session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const orders = await prisma.order.findMany({
      where: { userId: Number(userId) },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

// POST /api/orders — create a new order
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, items } = body;

    // items = [{ productId: number, quantity: number }]
    if (!userId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "userId and items are required" },
        { status: 400 }
      );
    }

    // Look up real prices and stock from the database (never trust client prices)
    const productIds = items.map((item: { productId: number }) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    // Validate all products exist
    if (products.length !== productIds.length) {
      return NextResponse.json(
        { error: "One or more products not found" },
        { status: 400 }
      );
    }

    // Validate stock availability
    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) continue;
      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for "${product.name}". Available: ${product.stock}` },
          { status: 400 }
        );
      }
    }

    // Calculate total using REAL prices from database
    const subtotal = items.reduce(
      (sum: number, item: { productId: number; quantity: number }) => {
        const product = products.find((p) => p.id === item.productId);
        return sum + (product?.price || 0) * item.quantity;
      },
      0
    );
    const tax = subtotal * 0.08;
    const total = subtotal + tax;

    // Create order with items using real DB prices
    const order = await prisma.order.create({
      data: {
        userId: Number(userId),
        total: Math.round(total * 100) / 100,
        status: "PENDING",
        items: {
          create: items.map(
            (item: { productId: number; quantity: number }) => {
              const product = products.find((p) => p.id === item.productId);
              return {
                productId: item.productId,
                quantity: item.quantity,
                price: product?.price || 0, // Use real DB price
              };
            }
          ),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Update stock for each product
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
    }

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
