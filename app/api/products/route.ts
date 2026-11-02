import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ImageValidationError, saveUploadedImage, validateImageReference } from '@/lib/product-images';
import { getAuthenticatedSession, isAdmin } from "@/lib/api-auth";
import { triggerVisualSearchReindex } from "@/lib/reindex";

// GET /api/products — fetch all products
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(products);
  } catch {
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

// POST /api/products — create a new product (admin only; accepts multipart file upload OR JSON)
export async function POST(req: NextRequest) {
  const session = await getAuthenticatedSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  try {
    const contentType = req.headers.get("content-type") || "";
    let name = "";
    let description = "";
    let price = "";
    let category = "";
    let stock = "";
    let image: string | undefined;

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      name = (form.get("name") as string) || "";
      description = (form.get("description") as string) || "";
      price = (form.get("price") as string) || "";
      category = (form.get("category") as string) || "";
      stock = (form.get("stock") as string) || "";
      const img = form.get("image");
      if (typeof img === "string") {
        if (img) image = img;
      } else if (img) {
        image = await saveUploadedImage(img);
      }
    } else {
      const body = await req.json();
      name = body.name;
      description = body.description;
      price = body.price;
      category = body.category;
      stock = body.stock;
      image = body.image;
    }

    if (!name || !price || !image) {
      return NextResponse.json(
        { error: "İsim, fiyat ve görsel zorunlu alanlardır" },
        { status: 400 },
      );
    }
    image = validateImageReference(image);
    if (!Number.isFinite(Number(price)) || Number(price) < 0 || !Number.isSafeInteger(Number(stock || 0)) || Number(stock || 0) < 0) {
      return NextResponse.json({ error: 'Invalid price or stock' }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name,
        description: description || "",
        price: Number(price),
        stock: Number(stock) || 0,
        image,
        category: category || "General",
      },
    });

    // Make the new product searchable by visual search (non-blocking).
    triggerVisualSearchReindex(`create product #${product.id}`);

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    if (error instanceof ImageValidationError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error(error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
