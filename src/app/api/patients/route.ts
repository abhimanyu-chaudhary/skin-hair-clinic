import { NextResponse } from "next/server";
import { getSession, logAudit } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

// GET /api/patients - Available to Staff, Doctor, Super Admin
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const patients = await prisma.patient.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search } },
              { mrn: { contains: search } },
              { mobile: { contains: search } },
            ],
          }
        : {},
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(patients);
  } catch (error: any) {
    console.error("GET Patients Error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve patients list" },
      { status: 500 }
    );
  }
}

// POST /api/patients - Register a patient (can be Patient self-service or Staff-assisted)
export async function POST(request: Request) {
  try {
    // Session is optional because patients can register themselves on the portal
    const session = await getSession();

    const body = await request.json();
    const {
      name,
      dob,
      gender,
      mobile,
      altMobile,
      email,
      address,
      emergencyName,
      emergencyMobile,
      bloodGroup,
      allergies,
      chronicConditions,
      currentMedications,
      pastTreatments,
      referralSource,
      photoUrl,
      govtIdType,
      govtIdNumber,
      consentRecorded,
      force, // Force registration despite duplicate mobile
    } = body;

    if (!name || !dob || !gender || !mobile || !address || !emergencyName || !emergencyMobile || !referralSource) {
      return NextResponse.json(
        { error: "Required fields: name, dob, gender, mobile, address, emergencyName, emergencyMobile, referralSource" },
        { status: 400 }
      );
    }

    // 1. Check for duplicate mobile number
    const existingPatient = await prisma.patient.findUnique({
      where: { mobile },
    });

    if (existingPatient && !force) {
      return NextResponse.json(
        {
          error: "Duplicate phone number detected",
          exists: true,
          patient: {
            id: existingPatient.id,
            name: existingPatient.name,
            mrn: existingPatient.mrn,
          },
        },
        { status: 409 } // Conflict
      );
    }

    // 2. Generate unique MRN (e.g., SHC-2026-000002)
    const currentYear = new Date().getFullYear();
    const prefix = `SHC-${currentYear}-`;

    // Query for the last registered patient of the current year
    const lastPatient = await prisma.patient.findFirst({
      where: {
        mrn: {
          startsWith: prefix,
        },
      },
      orderBy: {
        mrn: "desc",
      },
    });

    let seqNumber = 1;
    if (lastPatient) {
      const parts = lastPatient.mrn.split("-");
      const lastSeq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSeq)) {
        seqNumber = lastSeq + 1;
      }
    }

    const mrn = `${prefix}${seqNumber.toString().padStart(6, "0")}`;

    const loginEmail = email || `${mrn.toLowerCase()}@clinic.com`;
    const defaultPassword = mobile; // e.g. "9876543210"
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // 3. Create the patient and their login user credentials transactionally
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: loginEmail,
          passwordHash: hashedPassword,
          role: "PATIENT",
        },
      });

      const patient = await tx.patient.create({
        data: {
          userId: user.id,
          mrn,
          name,
          dob: new Date(dob),
          gender,
          mobile,
          altMobile: altMobile || null,
          email: loginEmail,
          address,
          emergencyName,
          emergencyMobile,
          bloodGroup: bloodGroup || null,
          allergies: allergies || null,
          chronicConditions: chronicConditions || null,
          currentMedications: currentMedications || null,
          pastTreatments: pastTreatments || null,
          referralSource,
          photoUrl: photoUrl || null,
          govtIdType: govtIdType || null,
          govtIdNumber: govtIdNumber || null,
          consentRecorded: consentRecorded || false,
          consentTimestamp: consentRecorded ? new Date() : null,
        },
      });

      return { patient, user };
    });

    // Write audit log if done by staff/admin
    if (session) {
      await logAudit(
        session.userId,
        "Patient",
        result.patient.id,
        "CREATE",
        null,
        result.patient
      );
    }

    return NextResponse.json({
      success: true,
      patientId: result.patient.id,
      mrn: result.patient.mrn,
      patient: result.patient,
      loginEmail,
      loginPassword: defaultPassword,
    });
  } catch (error: any) {
    console.error("POST Register Patient Error:", error);
    return NextResponse.json(
      { error: "Failed to register patient" },
      { status: 500 }
    );
  }
}
