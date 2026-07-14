import { NextResponse } from "next/server";
import { getSession, logAudit } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { sku, name, category, unit, purchasePrice, sellingPrice, taxRate, reorderLevel, supplier } = body;

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const beforeState = { ...product };
    const updateData: any = {};

    if (sku) updateData.sku = sku;
    if (name) updateData.name = name;
    if (category) updateData.category = category;
    if (unit) updateData.unit = unit;
    if (purchasePrice !== undefined) updateData.purchasePrice = parseFloat(purchasePrice);
    if (sellingPrice !== undefined) updateData.sellingPrice = parseFloat(sellingPrice);
    if (taxRate !== undefined) updateData.taxRate = parseFloat(taxRate);
    if (reorderLevel !== undefined) updateData.reorderLevel = parseInt(reorderLevel, 10);
    if (supplier !== undefined) updateData.supplier = supplier;

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    await logAudit(
      session.userId,
      "Product",
      id,
      "UPDATE",
      beforeState,
      updatedProduct
    );

    return NextResponse.json({
      success: true,
      product: updatedProduct,
    });
  } catch (error: any) {
    console.error("PATCH Product Error:", error);
    return NextResponse.json({ error: "Failed to update product details" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    await prisma.product.delete({
      where: { id },
    });

    await logAudit(
      session.userId,
      "Product",
      id,
      "DELETE",
      product,
      null
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE Product Error:", error);
    return NextResponse.json({ error: "Failed to delete product (it might be linked to invoice transactions or active batches)" }, { status: 500 });
  }
}
