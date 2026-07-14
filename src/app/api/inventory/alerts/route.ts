import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/inventory/alerts - Retrieve low-stock products and near-expiry batches
export async function GET() {
  try {
    const session = await getSession();
    if (!session || !["STAFF", "SUPER_ADMIN", "DOCTOR"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date();

    // 1. Expiry alerts: batches with stock expiring within 60 days
    const sixtyDaysFromNow = new Date();
    sixtyDaysFromNow.setDate(today.getDate() + 60);

    const nearExpiryBatches = await prisma.productBatch.findMany({
      where: {
        quantity: { gt: 0 },
        expiryDate: {
          gt: today,
          lte: sixtyDaysFromNow,
        },
      },
      include: {
        product: { select: { name: true, sku: true, unit: true } },
      },
      orderBy: { expiryDate: "asc" },
    });

    // 2. Low-stock alerts: products where total active unexpired stock < reorderLevel
    const products = await prisma.product.findMany({
      include: {
        batches: {
          where: {
            expiryDate: { gt: today },
          },
        },
      },
    });

    const lowStockProducts = products
      .map((prod) => {
        const totalActiveStock = prod.batches.reduce((sum, b) => sum + b.quantity, 0);
        return {
          id: prod.id,
          sku: prod.sku,
          name: prod.name,
          unit: prod.unit,
          reorderLevel: prod.reorderLevel,
          totalStock: totalActiveStock,
          supplier: prod.supplier,
        };
      })
      .filter((p) => p.totalStock < p.reorderLevel);

    return NextResponse.json({
      nearExpiry: nearExpiryBatches,
      lowStock: lowStockProducts,
    });
  } catch (error: any) {
    console.error("GET Inventory Alerts Error:", error);
    return NextResponse.json(
      { error: "Failed to load inventory alerts" },
      { status: 500 }
    );
  }
}
