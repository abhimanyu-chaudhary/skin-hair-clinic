import { NextResponse } from "next/server";
import { getSession, logAudit } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/appointments - List appointments with filters
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date"); // e.g. "2026-07-14"
    const doctorId = searchParams.get("doctorId");
    const clinicId = searchParams.get("clinicId");
    const status = searchParams.get("status");

    // Scoping for Patient: patients can only view their own appointments
    const patientFilter = session.role === "PATIENT" ? { patientId: session.profileId! } : {};

    // Date range filter
    let dateFilter = {};
    if (dateStr) {
      const start = new Date(dateStr);
      start.setUTCHours(0, 0, 0, 0);
      const end = new Date(dateStr);
      end.setUTCHours(23, 59, 59, 999);
      dateFilter = {
        appointmentDate: {
          gte: start,
          lte: end,
        },
      };
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        ...patientFilter,
        ...dateFilter,
        ...(doctorId ? { doctorId } : {}),
        ...(clinicId ? { clinicId } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        patient: {
          select: { id: true, name: true, mrn: true, mobile: true, gender: true, dob: true },
        },
        doctor: {
          select: { id: true, name: true, consultFee: true, followUpFee: true },
        },
        clinic: {
          select: { id: true, name: true },
        },
      },
      orderBy: { appointmentDate: "asc" },
    });

    return NextResponse.json(appointments);
  } catch (error: any) {
    console.error("GET Appointments Error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve appointments" },
      { status: 500 }
    );
  }
}

// POST /api/appointments - Book an appointment
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { patientId, doctorId, clinicId, appointmentDate, type, notes } = body;

    if (!patientId || !doctorId || !clinicId || !appointmentDate || !type) {
      return NextResponse.json(
        { error: "Required fields: patientId, doctorId, clinicId, appointmentDate, type" },
        { status: 400 }
      );
    }

    const targetDate = new Date(appointmentDate);
    if (isNaN(targetDate.getTime())) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
    }

    // 1. Verify Doctor exists and is ACTIVE
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
    });

    if (!doctor || doctor.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Selected doctor is not active or unavailable" },
        { status: 400 }
      );
    }

    // 2. Check for duplicate appointment by same patient at the exact same time
    const patientConflict = await prisma.appointment.findFirst({
      where: {
        patientId,
        appointmentDate: targetDate,
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
      },
    });

    if (patientConflict) {
      return NextResponse.json(
        { error: "Patient already has an active appointment booked at this exact slot" },
        { status: 400 }
      );
    }

    // 3. Double-booking check: count active bookings for this doctor at the exact slot
    const slotBookingsCount = await prisma.appointment.count({
      where: {
        doctorId,
        appointmentDate: targetDate,
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
      },
    });

    // Default overbooking buffer allowed = 1 extra patient (total 2 bookings per slot)
    const maxBookingsPerSlot = 2; // Overbooking buffer of 1
    if (slotBookingsCount >= maxBookingsPerSlot) {
      return NextResponse.json(
        { error: "This slot is fully booked. Double-booking buffer exceeded." },
        { status: 400 }
      );
    }

    // 4. Register the appointment
    const newAppointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId,
        clinicId,
        appointmentDate: targetDate,
        type,
        status: "BOOKED",
        notes: notes || null,
      },
    });

    // Write audit log
    await logAudit(
      session.userId,
      "Appointment",
      newAppointment.id,
      "CREATE",
      null,
      newAppointment
    );

    return NextResponse.json({
      success: true,
      appointmentId: newAppointment.id,
      appointment: newAppointment,
    });
  } catch (error: any) {
    console.error("POST Booking Error:", error);
    return NextResponse.json(
      { error: "Failed to book appointment" },
      { status: 500 }
    );
  }
}
