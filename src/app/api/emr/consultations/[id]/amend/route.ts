import { NextResponse } from "next/server";
import { getSession, logAudit } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "DOCTOR") {
      return NextResponse.json({ error: "Unauthorized. Doctor role required." }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      chiefComplaint,
      duration,
      onsetTriggers,
      medicalHistory,
      examinationFindings,
      provisionalDiagnosis,
      privateNotes,
    } = body;

    // Load original consultation
    const originalConsultation = await prisma.consultation.findUnique({
      where: { id },
    });

    if (!originalConsultation) {
      return NextResponse.json({ error: "Consultation record not found" }, { status: 404 });
    }

    // Determine the root parent consultation ID
    const rootParentId = originalConsultation.parentConsultId || originalConsultation.id;

    // Determine next version number
    const maxVersionConsult = await prisma.consultation.findFirst({
      where: {
        OR: [
          { id: rootParentId },
          { parentConsultId: rootParentId },
        ],
      },
      orderBy: { version: "desc" },
    });

    const nextVersion = (maxVersionConsult?.version || 1) + 1;

    // Create the amendment consultation (locked: true)
    const amendedConsultation = await prisma.consultation.create({
      data: {
        appointmentId: originalConsultation.appointmentId,
        patientId: originalConsultation.patientId,
        doctorId: originalConsultation.doctorId,
        chiefComplaint: chiefComplaint || originalConsultation.chiefComplaint,
        duration: duration || originalConsultation.duration,
        onsetTriggers: onsetTriggers !== undefined ? onsetTriggers : originalConsultation.onsetTriggers,
        medicalHistory: medicalHistory
          ? (typeof medicalHistory === "string" ? medicalHistory : JSON.stringify(medicalHistory))
          : originalConsultation.medicalHistory,
        examinationFindings: examinationFindings
          ? (typeof examinationFindings === "string" ? examinationFindings : JSON.stringify(examinationFindings))
          : originalConsultation.examinationFindings,
        provisionalDiagnosis: provisionalDiagnosis || originalConsultation.provisionalDiagnosis,
        privateNotes: privateNotes !== undefined ? privateNotes : originalConsultation.privateNotes,
        locked: true,
        version: nextVersion,
        parentConsultId: rootParentId,
      },
    });

    // Write audit log
    await logAudit(
      session.userId,
      "ConsultationAmendment",
      amendedConsultation.id,
      "CREATE",
      originalConsultation,
      amendedConsultation
    );

    return NextResponse.json({
      success: true,
      amendedConsultationId: amendedConsultation.id,
      amendedConsultation,
    });
  } catch (error: any) {
    console.error("POST EMR Amendment Error:", error);
    return NextResponse.json(
      { error: "Failed to create EMR amendment" },
      { status: 500 }
    );
  }
}
