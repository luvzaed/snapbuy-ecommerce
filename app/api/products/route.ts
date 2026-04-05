import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/products — fetch all products
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' } // إضافة بسيطة عشان يعرض أحدث المنتجات أولاً
    });
    return NextResponse.json(products);
  } catch {
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

// POST /api/products — create a new product
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, price, image, category, stock } = body;

    // أضفنا الصورة كشرط أساسي
    if (!name || !price || !image) {
      return NextResponse.json({ error: "الاسم، السعر، والصورة حقول مطلوبة" }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name,
        description: description || "",
        price: Number(price),
        stock: Number(stock) || 0, // أضفنا حقل المخزون
        image,
        category: category || "General",
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error(error); // طباعة الخطأ في التيرمنال بتفيدك جداً وقت التطوير
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}