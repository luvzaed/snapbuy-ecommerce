import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ImageValidationError, deleteLocalImage, saveUploadedImage, validateImageReference } from '@/lib/product-images';
import { getAuthenticatedSession, isAdmin } from "@/lib/api-auth";
import { triggerVisualSearchReindex } from "@/lib/reindex";

interface Params {
  params: Promise<{ id: string }>;
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

// PUT /api/products/[id] — update a product (admin only; accepts multipart file upload OR JSON)
export async function PUT(req: NextRequest, { params }: Params) {
  const session = await getAuthenticatedSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  try {
    const { id } = await params;

    // Read the existing product so we can clean up its image file if it changes.
    const existing = await prisma.product.findUnique({
      where: { id: Number(id) },
      select: { image: true },
    });

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

    if (data.image !== undefined) data.image = validateImageReference(data.image);
    if ((data.price !== undefined && (!Number.isFinite(data.price) || Number(data.price) < 0)) ||
        (data.stock !== undefined && (!Number.isSafeInteger(data.stock) || Number(data.stock) < 0))) {
      return NextResponse.json({ error: 'Invalid price or stock' }, { status: 400 });
    }
    const updated = await prisma.product.update({
      where: { id: Number(id) },
      data,
    });

    // If the image was replaced with a different local file, delete the old one.
    if (
      existing?.image &&
      typeof data.image === "string" &&
      data.image !== existing.image
    ) {
      await deleteLocalImage(existing.image);
    }

    // Keep visual search in sync (re-embeds only if the image changed).
    triggerVisualSearchReindex(`update product #${id}`);

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof ImageValidationError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error(error);
    return NextResponse.json({ error: "Not found or update failed" }, { status: 404 });
  }
}

// DELETE /api/products/[id] — delete a product (admin only)
export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await getAuthenticatedSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  try {
    const { id } = await params;

    // Read the image path before the record is gone so we can clean up the file.
    const existing = await prisma.product.findUnique({
      where: { id: Number(id) },
      select: { image: true },
    });

    await prisma.product.delete({
      where: { id: Number(id) },
    });

    // Best-effort: delete the local image file. Errors are logged, not thrown.
    if (existing?.image) {
      await deleteLocalImage(existing.image);
    }

    // Drop the deleted product from the visual search index (non-blocking).
    triggerVisualSearchReindex(`delete product #${id}`);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Not found or delete failed" }, { status: 404 });
  }
}
