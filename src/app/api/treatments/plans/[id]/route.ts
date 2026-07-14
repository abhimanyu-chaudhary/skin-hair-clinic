import { NextResponse } from "next/server";
import { getSession, logAudit } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/treatments/plans/[id] - Get details of a treatment plan and its sessions
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

    const plan = await prisma.treatmentPlan.findUnique({
      where: { id },
      include: {
        patient: { select: { id: true, name: true, mrn: true } },
        doctor: { select: { name: true } },
        catalogItem: true,
        sessions: {
          include: { sessionPhotos: true },
          orderBy: { sessionNumber: "asc" },
        },
      },
    });

    if (!plan) {
      return NextResponse.json({ error: "Treatment plan not found" }, { status: 404 });
    }

    // Patient access restriction
    if (session.role === "PATIENT" && session.profileId !== plan.patientId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json(plan);
  } catch (error: any) {
    console.error("GET Treatment Plan Error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve treatment plan details" },
      { status: 500 }
    );
  }
}

// PATCH /api/treatments/plans/[id] - Update consent sign-off or cancel/complete plan
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
    const { status, consentSigned, consentName, consentSignature } = body;

    const plan = await prisma.treatmentPlan.findUnique({ where: { id } });
    if (!plan) {
      return NextResponse.json({ error: "Treatment plan not found" }, { status: 404 });
    }

    const beforeState = { ...plan };
    const updateData: any = {};

    if (status) updateData.status = status;
    if (consentSigned !== undefined) {
      updateData.consentSigned = consentSigned;
      if (consentSigned) {
        updateData.consentName = consentName;
        updateData.consentSignature = consentSignature;
        updateData.consentTimestamp = new Date();
      }
    }

    const updatedPlan = await prisma.treatmentPlan.update({
      where: { id },
      data: updateData,
    });

    // Write audit log
    await logAudit(
      session.userId,
      "TreatmentPlan",
      id,
      "UPDATE",
      beforeState,
      updatedPlan
    );

    return NextResponse.json({ success: true, plan: updatedPlan });
  } catch (error: any) {
    console.error("PATCH Treatment Plan Error:", error);
    return NextResponse.json(
      { error: "Failed to update treatment plan" },
      { status: 500 }
    );
  }
}
