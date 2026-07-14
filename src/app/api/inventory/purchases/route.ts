import { NextResponse } from "next/server";
import { getSession, logAudit } from "@/lib/auth";
import { prisma } from "@/lib/db";

// POST /api/inventory/purchases - Log supplier delivery of new product stock batches
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || !["STAFF", "SUPER_ADMIN"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized. Staff or Admin inventory access required." }, { status: 401 });
    }

    const body = await request.json();
    const { supplier, invoiceNumber, productId, batchNumber, expiryDate, quantity, cost } = body;

    if (!supplier || !invoiceNumber || !productId || !batchNumber || !expiryDate || quantity === undefined || cost === undefined) {
      return NextResponse.json(
        { error: "Required fields: supplier, invoiceNumber, productId, batchNumber, expiryDate, quantity, cost" },
        { status: 400 }
      );
    }

    // Run transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create or retrieve ProductBatch
      let batch = await tx.productBatch.findFirst({
        where: {
          productId,
          batchNumber,
        },
      });

      if (batch) {
        // If batch already exists, increment the quantity
        batch = await tx.productBatch.update({
          where: { id: batch.id },
          data: {
            quantity: batch.quantity + parseInt(quantity, 10),
            expiryDate: new Date(expiryDate), // update in case it was modified
          },
        });
      } else {
        // Create new batch
        batch = await tx.productBatch.create({
          data: {
            productId,
            batchNumber,
            expiryDate: new Date(expiryDate),
            quantity: parseInt(quantity, 10),
            purchaseCost: parseFloat(cost) / parseInt(quantity, 10), // cost per unit
          },
        });
      }

      // 2. Create Purchase record
      const purchase = await tx.purchase.create({
        data: {
          supplier,
          invoiceNumber,
          batchId: batch.id,
          quantity: parseInt(quantity, 10),
          cost: parseFloat(cost),
        },
      });

      // 3. Log positive StockMovement
      await tx.stockMovement.create({
        data: {
          productId,
          batchId: batch.id,
          quantity: parseInt(quantity, 10),
          type: "PURCHASE",
          reason: `Logged purchase delivery invoice: ${invoiceNumber}`,
          userId: session.userId,
        },
      });

      return { batch, purchase };
    });

    // Write audit log
    await logAudit(
      session.userId,
      "Purchase",
      result.purchase.id,
      "CREATE",
      null,
      result.purchase
    );

    return NextResponse.json({
      success: true,
      purchaseId: result.purchase.id,
      batch: result.batch,
    });
  } catch (error: any) {
    console.error("POST Purchase Entry Error:", error);
    return NextResponse.json(
      { error: "Failed to record purchase entry" },
      { status: 500 }
    );
  }
}
