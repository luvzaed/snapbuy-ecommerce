import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

interface Params {
  params: Promise<{ id: string }>;
}

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

// GET /api/products/[id] — fetch a single product
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id: Number(id) },
    });
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(product);
  } catch {
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}

// PUT /api/products/[id] — update a product (accepts multipart file upload OR JSON)
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const contentType = req.headers.get("content-type") || "";
    const data: Record<string, unknown> = {};

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const name = form.get("name");
      const description = form.get("description");
      const price = form.get("price");
      const category = form.get("category");
      const stock = form.get("stock");
      const img = form.get("image");

      if (name !== null) data.name = name as string;
      if (description !== null) data.description = description as string;
      if (price !== null && price !== "") data.price = Number(price);
      if (category !== null) data.category = category as string;
      if (stock !== null && stock !== "") data.stock = Number(stock);
      // Only update the image when a new file (or url) was actually provided
      if (typeof img === "string") {
        if (img) data.image = img;
      } else if (img) {
        data.image = await saveUploadedImage(img);
      }
    } else {
      const body = await req.json();
      if (body.name !== undefined) data.name = body.name;
      if (body.description !== undefined) data.description = body.description;
      if (body.price !== undefined) data.price = Number(body.price);
      if (body.image !== undefined) data.image = body.image;
      if (body.category !== undefined) data.category = body.category;
      if (body.stock !== undefined) data.stock = Number(body.stock);
    }

    const updated = await prisma.product.update({
      where: { id: Number(id) },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Not found or update failed" }, { status: 404 });
  }
}

// DELETE /api/products/[id] — delete a product
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await prisma.product.delete({
      where: { id: Number(id) },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Not found or delete failed" }, { status: 404 });
  }
}
