import { NextResponse } from "next/server";
import { getSession, logAudit } from "@/lib/auth";
import { prisma } from "@/lib/db";

// POST /api/emr/consultations - Save new consultation EMR, prescription, and treatment plan
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "DOCTOR") {
      return NextResponse.json({ error: "Unauthorized. Doctor role required." }, { status: 401 });
    }

    const doctorId = session.profileId;
    if (!doctorId) {
      return NextResponse.json({ error: "Doctor profile not configured" }, { status: 400 });
    }

    const body = await request.json();
    const {
      appointmentId,
      chiefComplaint,
      duration,
      onsetTriggers,
      medicalHistory, // Expected JSON object
      examinationFindings, // Expected JSON object
      provisionalDiagnosis,
      privateNotes,
      clinicalPhotos, // Array of { imageUrl, tag }
      investigations, // Array of strings (test names)
      prescriptionItems, // Array of { medicineName, dosage, frequency, duration, quantity, route, instructions, productId }
      treatmentAdvised, // { treatmentCatalogId, totalSessions, totalPrice, consentSigned, consentName, consentSignature }
      followUpDays, // Number of days
    } = body;

    if (!appointmentId || !chiefComplaint || !duration || !provisionalDiagnosis) {
      return NextResponse.json(
        { error: "Required fields: appointmentId, chiefComplaint, duration, provisionalDiagnosis" },
        { status: 400 }
      );
    }

    // Verify appointment exists
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { patient: true },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    const patientId = appointment.patientId;

    // Run transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Consultation (Locked by default, version 1)
      const consultation = await tx.consultation.create({
        data: {
          appointmentId,
          patientId,
          doctorId,
          chiefComplaint,
          duration,
          onsetTriggers: onsetTriggers || null,
          medicalHistory: typeof medicalHistory === "string" ? medicalHistory : JSON.stringify(medicalHistory || {}),
          examinationFindings: typeof examinationFindings === "string" ? examinationFindings : JSON.stringify(examinationFindings || {}),
          provisionalDiagnosis,
          privateNotes: privateNotes || null,
          locked: true,
          version: 1,
        },
      });

      // 2. Add clinical photos
      if (clinicalPhotos && Array.isArray(clinicalPhotos)) {
        await Promise.all(
          clinicalPhotos.map((photo) =>
            tx.clinicalPhoto.create({
              data: {
                consultationId: consultation.id,
                imageUrl: photo.imageUrl,
                tag: photo.tag,
              },
            })
          )
        );
      }

      // 3. Add diagnostic investigations
      if (investigations && Array.isArray(investigations)) {
        await Promise.all(
          investigations.map((testName) =>
            tx.diagnosticInvestigation.create({
              data: {
                consultationId: consultation.id,
                testName,
                status: "ADVISED",
              },
            })
          )
        );
      }

      // 4. Create Prescription
      let prescription = null;
      if (prescriptionItems && Array.isArray(prescriptionItems) && prescriptionItems.length > 0) {
        prescription = await tx.prescription.create({
          data: {
            consultationId: consultation.id,
            followUpDays: followUpDays ? parseInt(followUpDays, 10) : null,
          },
        });

        await Promise.all(
          prescriptionItems.map((item) =>
            tx.prescriptionItem.create({
              data: {
                prescriptionId: prescription!.id,
                medicineName: item.medicineName,
                dosage: item.dosage,
                frequency: item.frequency,
                duration: item.duration,
                quantity: item.quantity ? parseInt(item.quantity, 10) : 1,
                route: item.route || "ORAL",
                instructions: item.instructions || null,
                productId: item.productId || null,
              },
            })
          )
        );
      }

      // 5. Create Treatment Plan (if advised)
      let treatmentPlan = null;
      if (treatmentAdvised && treatmentAdvised.treatmentCatalogId) {
        treatmentPlan = await tx.treatmentPlan.create({
          data: {
            patientId,
            doctorId,
            treatmentCatalogId: treatmentAdvised.treatmentCatalogId,
            totalSessions: parseInt(treatmentAdvised.totalSessions, 10),
            totalPrice: parseFloat(treatmentAdvised.totalPrice),
            status: "ACTIVE",
            consentSigned: treatmentAdvised.consentSigned || false,
            consentName: treatmentAdvised.consentName || null,
            consentSignature: treatmentAdvised.consentSignature || null,
            consentTimestamp: treatmentAdvised.consentSigned ? new Date() : null,
          },
        });

        // Auto-generate session tracker records
        const sessionCount = parseInt(treatmentAdvised.totalSessions, 10);
        for (let i = 1; i <= sessionCount; i++) {
          await tx.treatmentSession.create({
            data: {
              treatmentPlanId: treatmentPlan.id,
              sessionNumber: i,
              status: "SCHEDULED",
            },
          });
        }
      }

      // 6. Update Appointment status to COMPLETED
      await tx.appointment.update({
        where: { id: appointmentId },
        data: { status: "COMPLETED" },
      });

      return { consultation, prescription, treatmentPlan };
    });

    // Write audit log
    await logAudit(
      session.userId,
      "Consultation",
      result.consultation.id,
      "CREATE",
      null,
      result.consultation
    );

    return NextResponse.json({
      success: true,
      consultationId: result.consultation.id,
      consultation: result.consultation,
      prescriptionId: result.prescription?.id || null,
      treatmentPlanId: result.treatmentPlan?.id || null,
    });
  } catch (error: any) {
    console.error("POST Consultation EMR Error:", error);
    return NextResponse.json(
      { error: "Failed to record EMR consultation" },
      { status: 500 }
    );
  }
}
