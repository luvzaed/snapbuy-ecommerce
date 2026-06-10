import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/api-auth";

// Thrown inside the order transaction for stock/validation failures so the
// catch block can map it to a 400 with a clear message (vs. a generic 500).
class OrderError extends Error {}

// GET /api/orders?userId=X — fetch orders for a user
// GET /api/orders?all=true — fetch ALL orders (admin)
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    const fetchAll = req.nextUrl.searchParams.get("all");

    // Authenticate the session from the signed cookie
    const session = getSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    // Derive the user from the authenticated session cookie — never trust a
    // userId in the request body (prevents creating orders for other users).
    const session = getSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.id;

    const body = await req.json();
    const { items, shipping } = body;

    // items = [{ productId: number, quantity: number }]
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "items are required" },
        { status: 400 }
      );
    }

    const productIds = items.map((item: { productId: number }) => item.productId);

    // Re-verify stock, compute the total from real DB prices, create the order,
    // and decrement stock — all inside a SINGLE transaction so an order can
    // never be saved partially and concurrent orders can't oversell.
    const order = await prisma.$transaction(async (tx) => {
      // Look up real prices and stock from the database (never trust client prices)
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
      });

      // Validate all products exist
      if (products.length !== productIds.length) {
        throw new OrderError("One or more products not found");
      }

      // Validate stock availability (gives a friendly per-product error message)
      for (const item of items) {
        const product = products.find((p) => p.id === item.productId);
        if (!product) {
          throw new OrderError("One or more products not found");
        }
        if (product.stock < item.quantity) {
          throw new OrderError(
            `"${product.name}" için yeterli stok yok. Mevcut: ${product.stock}`
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
      const tax = subtotal * 0.20;
      const total = subtotal + tax;

      // Create order with items using real DB prices
      const created = await tx.order.create({
        data: {
          userId: Number(userId),
          total: Math.round(total * 100) / 100,
          status: "PENDING",
          // Persist the shipping + contact info collected at checkout (no card data)
          shipping: shipping ?? undefined,
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

      // Decrement stock with a conditional update. The `stock >= quantity`
      // guard makes each decrement atomic: if a concurrent order drained the
      // stock between the check above and here, `count` is 0 and we throw,
      // rolling back the whole transaction instead of overselling.
      for (const item of items) {
        const product = products.find((p) => p.id === item.productId);
        const result = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (result.count === 0) {
          throw new OrderError(
            `"${product?.name ?? "Ürün"}" için yeterli stok yok.`
          );
        }
      }

      return created;
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    // Stock / validation failures: reject the whole order with a clear message
    if (error instanceof OrderError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
