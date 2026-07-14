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
    const { name, mobile, clinicId, permissions } = body;

    const staff = await prisma.staff.findUnique({
      where: { id },
    });

    if (!staff) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }

    const beforeState = { ...staff };
    const updateData: any = {};

    if (name) updateData.name = name;
    if (mobile) updateData.mobile = mobile;
    if (clinicId) updateData.clinicId = clinicId;
    if (permissions !== undefined) {
      updateData.permissions = typeof permissions === "string"
        ? permissions
        : JSON.stringify(permissions);
    }

    const updatedStaff = await prisma.staff.update({
      where: { id },
      data: updateData,
    });

    await logAudit(
      session.userId,
      "Staff",
      id,
      "UPDATE",
      beforeState,
      updatedStaff
    );

    return NextResponse.json({
      success: true,
      staff: updatedStaff,
    });
  } catch (error: any) {
    console.error("PATCH Staff Error:", error);
    return NextResponse.json(
      { error: "Failed to update staff member details" },
      { status: 500 }
    );
  }
}
