import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Enforce patient privacy: patients can only request their own details
    if (session.role === "PATIENT" && session.profileId !== id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        appointments: {
          include: {
            doctor: {
              select: { name: true, specializations: true },
            },
          },
          orderBy: { appointmentDate: "desc" },
        },
        consultations: {
          include: {
            doctor: { select: { name: true } },
            clinicalPhotos: true,
            investigations: true,
            prescription: {
              include: { items: true },
            },
          },
          orderBy: { date: "desc" },
        },
        treatmentPlans: {
          include: {
            catalogItem: true,
            doctor: { select: { name: true } },
            sessions: {
              orderBy: { sessionNumber: "asc" },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        invoices: {
          include: {
            items: true,
            payments: true,
          },
          orderBy: { date: "desc" },
        },
      },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Calculate total balance due
    let totalInvoiced = 0;
    let totalPaid = 0;

    patient.invoices.forEach((inv) => {
      totalInvoiced += inv.totalAmount;
      inv.payments.forEach((p) => {
        totalPaid += p.amount;
      });
    });

    const outstandingBalance = Math.max(0, totalInvoiced - totalPaid);

    return NextResponse.json({
      ...patient,
      outstandingBalance,
    });
  } catch (error: any) {
    console.error("GET Patient Details Error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve patient chart" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !["STAFF", "SUPER_ADMIN"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const patient = await prisma.patient.findUnique({
      where: { id },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Check unique mobile block (excluding current patient)
    if (body.mobile && body.mobile !== patient.mobile) {
      const duplicate = await prisma.patient.findUnique({
        where: { mobile: body.mobile },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: "Mobile number is already registered for another patient profile." },
          { status: 409 }
        );
      }
    }

    const updateData: any = {};
    const fields = [
      "name",
      "gender",
      "mobile",
      "altMobile",
      "email",
      "address",
      "emergencyName",
      "emergencyMobile",
      "bloodGroup",
      "allergies",
      "chronicConditions",
      "currentMedications",
      "pastTreatments",
      "referralSource",
      "govtIdType",
      "govtIdNumber",
      "photoUrl",
    ];

    fields.forEach((field) => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    if (body.dob) {
      updateData.dob = new Date(body.dob);
    }

    if (body.consentRecorded !== undefined) {
      updateData.consentRecorded = body.consentRecorded;
      if (body.consentRecorded) {
        updateData.consentTimestamp = new Date();
      }
    }

    const updatedPatient = await prisma.patient.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      patient: updatedPatient,
    });
  } catch (error: any) {
    console.error("PATCH Patient Error:", error);
    return NextResponse.json(
      { error: "Failed to update patient demographics" },
      { status: 500 }
    );
  }
}
