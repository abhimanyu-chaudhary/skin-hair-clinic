import { NextResponse } from "next/server";
import { getSession, hasPermission, logAudit } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/products - Available to Admin, Staff, Doctor
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const products = await prisma.product.findMany({
      include: {
        batches: {
          orderBy: { expiryDate: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(products);
  } catch (error: any) {
    console.error("GET Products Error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve products catalog" },
      { status: 500 }
    );
  }
}

// POST /api/products - Only Admin/Staff
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["SUPER_ADMIN", "STAFF"].includes(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { sku, name, category, unit, purchasePrice, sellingPrice, taxRate, reorderLevel, supplier } = await request.json();

    if (!sku || !name || !category || !unit || purchasePrice === undefined || sellingPrice === undefined || taxRate === undefined || !supplier) {
      return NextResponse.json(
        { error: "Required fields: sku, name, category (MEDICINE/RETAIL_PRODUCT/CONSUMABLE), unit, purchasePrice, sellingPrice, taxRate, supplier" },
        { status: 400 }
      );
    }

    // Check SKU uniqueness
    const existing = await prisma.product.findUnique({ where: { sku } });
    if (existing) {
      return NextResponse.json(
        { error: `Product with SKU '${sku}' already exists` },
        { status: 400 }
      );
    }

    const newProduct = await prisma.product.create({
      data: {
        sku,
        name,
        category,
        unit,
        purchasePrice: parseFloat(purchasePrice),
        sellingPrice: parseFloat(sellingPrice),
        taxRate: parseFloat(taxRate),
        reorderLevel: reorderLevel ? parseInt(reorderLevel) : 10,
        supplier,
      },
    });

    // Write audit log
    await logAudit(
      session.userId,
      "Product",
      newProduct.id,
      "CREATE",
      null,
      newProduct
    );

    return NextResponse.json({ success: true, product: newProduct });
  } catch (error: any) {
    console.error("POST Product Error:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
