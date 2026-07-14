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
    const { name, address, contactNumber, gstNumber, logoUrl, operatingHours, billingEntityId } = body;

    const clinic = await prisma.clinic.findUnique({
      where: { id },
    });

    if (!clinic) {
      return NextResponse.json({ error: "Clinic branch not found" }, { status: 404 });
    }

    const beforeState = { ...clinic };
    const updateData: any = {};

    if (name) updateData.name = name;
    if (address) updateData.address = address;
    if (contactNumber) updateData.contactNumber = contactNumber;
    if (gstNumber) updateData.gstNumber = gstNumber;
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
    if (operatingHours) updateData.operatingHours = operatingHours;
    if (billingEntityId) updateData.billingEntityId = billingEntityId;

    const updatedClinic = await prisma.clinic.update({
      where: { id },
      data: updateData,
    });

    await logAudit(
      session.userId,
      "Clinic",
      id,
      "UPDATE",
      beforeState,
      updatedClinic
    );

    return NextResponse.json({
      success: true,
      clinic: updatedClinic,
    });
  } catch (error: any) {
    console.error("PATCH Clinic Error:", error);
    return NextResponse.json(
      { error: "Failed to update clinic branch details" },
      { status: 500 }
    );
  }
}
