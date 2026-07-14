import { NextResponse } from "next/server";
import { getSession, logAudit } from "@/lib/auth";
import { prisma } from "@/lib/db";

// POST /api/inventory/adjustments - Record manual inventory adjustment with reason
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || !["STAFF", "SUPER_ADMIN"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { productId, batchId, quantityChange, reason } = body; // quantityChange is signed, e.g. -5 (damaged) or +2 (found)

    if (!productId || !batchId || quantityChange === undefined || !reason) {
      return NextResponse.json(
        { error: "Required fields: productId, batchId, quantityChange (signed integer), reason" },
        { status: 400 }
      );
    }

    const change = parseInt(quantityChange, 10);
    if (isNaN(change) || change === 0) {
      return NextResponse.json({ error: "Invalid quantity change value" }, { status: 400 });
    }

    // Run transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Verify batch exists
      const batch = await tx.productBatch.findUnique({
        where: { id: batchId },
      });

      if (!batch || batch.productId !== productId) {
        throw new Error("Target product batch not found");
      }

      // Check that final quantity is not negative
      const newQuantity = batch.quantity + change;
      if (newQuantity < 0) {
        throw new Error(
          `Adjustment cannot result in negative stock. Current batch quantity: ${batch.quantity}, Adjustment requested: ${change}`
        );
      }

      // 2. Update batch quantity
      const updatedBatch = await tx.productBatch.update({
        where: { id: batchId },
        data: { quantity: newQuantity },
      });

      // 3. Log StockMovement
      const movement = await tx.stockMovement.create({
        data: {
          productId,
          batchId,
          quantity: change,
          type: "ADJUSTMENT",
          reason,
          userId: session.userId,
        },
      });

      return { batch: updatedBatch, movement };
    });

    // Write audit log
    await logAudit(
      session.userId,
      "StockMovement",
      result.movement.id,
      "CREATE",
      null,
      result.movement
    );

    return NextResponse.json({
      success: true,
      batch: result.batch,
      movement: result.movement,
    });
  } catch (error: any) {
    console.error("POST Stock Adjustment Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to adjust stock" },
      { status: 500 }
    );
  }
}
