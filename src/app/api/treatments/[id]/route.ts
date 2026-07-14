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
    const { name, category, description, basePrice } = body;

    const treatment = await prisma.treatmentCatalog.findUnique({
      where: { id },
    });

    if (!treatment) {
      return NextResponse.json({ error: "Treatment catalog item not found" }, { status: 404 });
    }

    const beforeState = { ...treatment };
    const updateData: any = {};

    if (name) updateData.name = name;
    if (category) updateData.category = category;
    if (description !== undefined) updateData.description = description;
    if (basePrice) updateData.basePrice = parseFloat(basePrice);

    const updatedTreatment = await prisma.treatmentCatalog.update({
      where: { id },
      data: updateData,
    });

    await logAudit(
      session.userId,
      "TreatmentCatalog",
      id,
      "UPDATE",
      beforeState,
      updatedTreatment
    );

    return NextResponse.json({
      success: true,
      treatment: updatedTreatment,
    });
  } catch (error: any) {
    console.error("PATCH Treatment Error:", error);
    return NextResponse.json({ error: "Failed to update treatment catalog item" }, { status: 500 });
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
    const treatment = await prisma.treatmentCatalog.findUnique({
      where: { id },
    });

    if (!treatment) {
      return NextResponse.json({ error: "Treatment catalog item not found" }, { status: 404 });
    }

    await prisma.treatmentCatalog.delete({
      where: { id },
    });

    await logAudit(
      session.userId,
      "TreatmentCatalog",
      id,
      "DELETE",
      treatment,
      null
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE Treatment Error:", error);
    return NextResponse.json({ error: "Failed to delete treatment catalog item (it might be linked to active treatment plans)" }, { status: 500 });
  }
}
