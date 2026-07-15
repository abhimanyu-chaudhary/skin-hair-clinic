import { NextResponse } from "next/server";
import { getSession, logAudit } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getGlobalSettings } from "@/lib/settings-service";

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
    const { status, slotDuration, weeklySchedule, consultFee, followUpFee, signatureUrl, baseSalary } = body;

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
    if (baseSalary !== undefined) updateData.baseSalary = baseSalary ? parseFloat(baseSalary) : null;
    if (weeklySchedule !== undefined) {
      updateData.weeklySchedule = typeof weeklySchedule === "string" 
        ? weeklySchedule 
        : JSON.stringify(weeklySchedule);
    }

    const updatedDoctor = await prisma.doctor.update({
      where: { id },
      data: updateData,
    });

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
    const url = new URL(request.url);
    const deletePassword = url.searchParams.get("password");

    // Retrieve active deletion password from settings
    const settings = getGlobalSettings();
    const requiredPassword = settings.profilePassword || "admin123";

    if (deletePassword !== requiredPassword) {
      return NextResponse.json({ error: "Incorrect profile deletion password" }, { status: 403 });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { id },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Doctor profile not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Clear linked child constraints
      await tx.appointment.deleteMany({ where: { doctorId: id } });
      await tx.consultation.deleteMany({ where: { doctorId: id } });
      await tx.treatmentPlan.deleteMany({ where: { doctorId: id } });
      
      // 2. Delete Profile
      await tx.doctor.delete({ where: { id } });

      // 3. Delete linked User login
      if (doctor.userId) {
        await tx.user.delete({ where: { id: doctor.userId } });
      }
    });

    await logAudit(
      session.userId,
      "Doctor",
      id,
      "DELETE",
      doctor,
      null
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE Doctor Error:", error);
    return NextResponse.json({ error: "Failed to delete doctor profile" }, { status: 500 });
  }
}
