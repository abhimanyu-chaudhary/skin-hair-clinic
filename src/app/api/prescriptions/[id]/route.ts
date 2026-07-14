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

    const prescription = await prisma.prescription.findUnique({
      where: { id },
      include: {
        items: true,
        consultation: {
          include: {
            doctor: {
              select: {
                name: true,
                qualifications: true,
                regNumber: true,
                issuingCouncil: true,
                signatureUrl: true,
                clinic: {
                  select: {
                    name: true,
                    address: true,
                    contactNumber: true,
                    gstNumber: true,
                  },
                },
              },
            },
            patient: {
              select: {
                id: true,
                name: true,
                mrn: true,
                dob: true,
                gender: true,
                mobile: true,
              },
            },
          },
        },
      },
    });

    if (!prescription) {
      return NextResponse.json({ error: "Prescription not found" }, { status: 404 });
    }

    // Patient privacy check
    if (session.role === "PATIENT" && session.profileId !== prescription.consultation.patient.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json(prescription);
  } catch (error: any) {
    console.error("GET Prescription Error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve prescription details" },
      { status: 500 }
    );
  }
}
