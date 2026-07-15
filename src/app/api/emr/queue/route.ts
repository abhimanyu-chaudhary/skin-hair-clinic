import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/emr/queue - Get the active check-in queue for the logged-in doctor
export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "DOCTOR") {
      return NextResponse.json({ error: "Unauthorized. Doctor role required." }, { status: 401 });
    }

    let doctorId = session.profileId;
    if (!doctorId) {
      const doc = await prisma.doctor.findUnique({
        where: { userId: session.userId },
      });
      if (doc) doctorId = doc.id;
    }

    if (!doctorId) {
      return NextResponse.json({ error: "Doctor profile not found" }, { status: 404 });
    }

    // Safe timezone-tolerant range for today's roster (current day +/- 24h)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    todayStart.setDate(todayStart.getDate() - 1);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const queue = await prisma.appointment.findMany({
      where: {
        doctorId,
        appointmentDate: {
          gte: todayStart,
          lte: todayEnd,
        },
        status: { in: ["BOOKED", "ARRIVED", "IN_CONSULTATION", "COMPLETED"] },
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            mrn: true,
            dob: true,
            gender: true,
            mobile: true,
            allergies: true,
            chronicConditions: true,
          },
        },
      },
      orderBy: [
        { status: "asc" }, // Groups ARRIVED/IN_CONSULTATION first
        { queueNumber: "asc" },
        { appointmentDate: "asc" },
      ],
    });

    return NextResponse.json(queue);
  } catch (error: any) {
    console.error("GET EMR Queue Error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve doctor queue" },
      { status: 500 }
    );
  }
}
