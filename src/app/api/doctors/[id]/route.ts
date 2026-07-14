import { NextResponse } from "next/server";
import { getSession, logAudit } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Access control: only the doctor themselves or SUPER_ADMIN can update doctor details
    if (session.role !== "SUPER_ADMIN" && session.profileId !== id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const { status, slotDuration, weeklySchedule, consultFee, followUpFee, signatureUrl } = body;

    const doctor = await prisma.doctor.findUnique({
      where: { id },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Doctor profile not found" }, { status: 404 });
    }

    const beforeState = { ...doctor };
    const updateData: any = {};

    if (status) updateData.status = status;
    if (slotDuration !== undefined) updateData.slotDuration = parseInt(slotDuration, 10);
    if (consultFee !== undefined) updateData.consultFee = parseFloat(consultFee);
    if (followUpFee !== undefined) updateData.followUpFee = parseFloat(followUpFee);
    if (signatureUrl !== undefined) updateData.signatureUrl = signatureUrl;
    if (weeklySchedule !== undefined) {
      updateData.weeklySchedule = typeof weeklySchedule === "string" 
        ? weeklySchedule 
        : JSON.stringify(weeklySchedule);
    }

    const updatedDoctor = await prisma.doctor.update({
      where: { id },
      data: updateData,
    });

    // Write audit log
    await logAudit(
      session.userId,
      "Doctor",
      id,
      "UPDATE",
      beforeState,
      updatedDoctor
    );

    return NextResponse.json({
      success: true,
      doctor: updatedDoctor,
    });
  } catch (error: any) {
    console.error("PATCH Doctor Profile Error:", error);
    return NextResponse.json(
      { error: "Failed to update doctor profile" },
      { status: 500 }
    );
  }
}
