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
    const body = await request.json();
    const { status, appointmentDate, notes } = body;

    // Get current appointment details
    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    // Capture before state for audit logging
    const beforeState = { ...appointment };

    const updateData: any = {};
    if (status) updateData.status = status;
    if (appointmentDate) updateData.appointmentDate = new Date(appointmentDate);
    if (notes !== undefined) updateData.notes = notes;

    // If patient is checking in ("ARRIVED"), generate a sequential queue token number for today
    if (status === "ARRIVED" && appointment.status !== "ARRIVED" && !appointment.queueNumber) {
      const targetDate = appointment.appointmentDate;
      const start = new Date(targetDate);
      start.setUTCHours(0, 0, 0, 0);
      const end = new Date(targetDate);
      end.setUTCHours(23, 59, 59, 999);

      // Count check-ins with an assigned queue number
      const checkInCount = await prisma.appointment.count({
        where: {
          doctorId: appointment.doctorId,
          appointmentDate: {
            gte: start,
            lte: end,
          },
          queueNumber: { not: null },
        },
      });

      updateData.queueNumber = checkInCount + 1;
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        patient: { select: { name: true, mrn: true } },
        doctor: { select: { name: true } },
      },
    });

    // Write audit log
    await logAudit(
      session.userId,
      "Appointment",
      id,
      "UPDATE",
      beforeState,
      updatedAppointment
    );

    return NextResponse.json({
      success: true,
      appointment: updatedAppointment,
    });
  } catch (error: any) {
    console.error("PATCH Appointment Error:", error);
    return NextResponse.json(
      { error: "Failed to update appointment" },
      { status: 500 }
    );
  }
}
