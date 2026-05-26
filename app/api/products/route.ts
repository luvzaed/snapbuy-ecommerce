import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// Save an uploaded image File to /public/images/products and return its public path
async function saveUploadedImage(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const dir = path.join(process.cwd(), "public", "images", "products");
  await mkdir(dir, { recursive: true });
  const safe = (file.name || "image").replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const filename = `${Date.now()}-${safe}`;
  await writeFile(path.join(dir, filename), buffer);
  return `/images/products/${filename}`;
}

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

// POST /api/products — create a new product (accepts multipart file upload OR JSON)
export async function POST(req: NextRequest) {
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

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
