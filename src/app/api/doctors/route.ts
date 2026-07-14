import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSession, hasPermission, logAudit } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/doctors - Available to authenticated users
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const doctors = await prisma.doctor.findMany({
      include: {
        clinic: {
          select: { id: true, name: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(doctors);
  } catch (error: any) {
    console.error("GET Doctors Error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve doctors list" },
      { status: 500 }
    );
  }
}

// POST /api/doctors - Register a Doctor (SUPER_ADMIN only)
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(session.role, "manage_doctors")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      email,
      password,
      clinicId,
      name,
      gender,
      dob,
      mobile,
      regNumber,
      issuingCouncil,
      qualifications,
      specializations,
      experienceYrs,
      consultFee,
      followUpFee,
      slotDuration,
      weeklySchedule,
      signatureUrl,
    } = body;

    // Validation
    if (
      !email ||
      !password ||
      !clinicId ||
      !name ||
      !gender ||
      !dob ||
      !mobile ||
      !regNumber ||
      !issuingCouncil ||
      !qualifications ||
      !specializations ||
      experienceYrs === undefined ||
      consultFee === undefined ||
      followUpFee === undefined
    ) {
      return NextResponse.json(
        { error: "Required fields missing. Ensure license, qualification, fees, and contact details are provided." },
        { status: 400 }
      );
    }

    // Check duplicate email
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: `User with email '${email}' already exists` },
        { status: 400 }
      );
    }

    // Check duplicate mobile
    const existingDoctor = await prisma.doctor.findUnique({ where: { mobile } });
    if (existingDoctor) {
      return NextResponse.json(
        { error: `Doctor with mobile '${mobile}' already exists` },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user and doctor profile in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          passwordHash,
          role: "DOCTOR",
          isActive: true,
        },
      });

      const newDoctor = await tx.doctor.create({
        data: {
          userId: newUser.id,
          clinicId,
          name,
          gender,
          dob: new Date(dob),
          mobile,
          regNumber,
          issuingCouncil,
          qualifications,
          specializations,
          experienceYrs: parseInt(experienceYrs, 10),
          consultFee: parseFloat(consultFee),
          followUpFee: parseFloat(followUpFee),
          slotDuration: slotDuration ? parseInt(slotDuration, 10) : 15,
          weeklySchedule: typeof weeklySchedule === "string" ? weeklySchedule : JSON.stringify(weeklySchedule),
          signatureUrl: signatureUrl || null,
          status: "ACTIVE",
        },
      });

      return { user: newUser, doctor: newDoctor };
    });

    // Write audit log
    await logAudit(
      session.userId,
      "Doctor",
      result.doctor.id,
      "CREATE",
      null,
      result.doctor
    );

    return NextResponse.json({
      success: true,
      doctorId: result.doctor.id,
      doctor: result.doctor,
    });
  } catch (error: any) {
    console.error("POST Doctor Registration Error:", error);
    return NextResponse.json(
      { error: "Failed to register doctor" },
      { status: 500 }
    );
  }
}
