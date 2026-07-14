import { NextResponse } from "next/server";
import { getSession, logAudit } from "@/lib/auth";
import { prisma } from "@/lib/db";

// PATCH /api/treatments/plans/[id]/sessions/[sessionId] - Complete a treatment session
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !["DOCTOR", "STAFF", "SUPER_ADMIN"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized. Clinical staff only." }, { status: 401 });
    }

    const { id: planId, sessionId } = await params;
    const body = await request.json();
    const { status, notes, photos } = body; // status: "COMPLETED" or "MISSED"

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    const targetSession = await prisma.treatmentSession.findUnique({
      where: { id: sessionId },
    });

    if (!targetSession || targetSession.treatmentPlanId !== planId) {
      return NextResponse.json({ error: "Treatment session not found" }, { status: 404 });
    }

    const beforeState = { ...targetSession };

    // Update session details
    const result = await prisma.$transaction(async (tx) => {
      const updatedSession = await tx.treatmentSession.update({
        where: { id: sessionId },
        data: {
          status,
          notes: notes || targetSession.notes,
          completedAt: status === "COMPLETED" ? new Date() : null,
        },
      });

      // Save photos if provided
      if (photos && Array.isArray(photos) && status === "COMPLETED") {
        await Promise.all(
          photos.map((url) =>
            tx.treatmentSessionPhoto.create({
              data: {
                treatmentSessionId: sessionId,
                imageUrl: url,
              },
            })
          )
        );
      }

      // Check if all sessions in this plan are now completed
      const remainingSessions = await tx.treatmentSession.count({
        where: {
          treatmentPlanId: planId,
          status: { not: "COMPLETED" },
        },
      });

      if (remainingSessions === 0) {
        await tx.treatmentPlan.update({
          where: { id: planId },
          data: { status: "COMPLETED" },
        });
      }

      return updatedSession;
    });

    // Write audit log
    await logAudit(
      session.userId,
      "TreatmentSession",
      sessionId,
      "UPDATE",
      beforeState,
      result
    );

    return NextResponse.json({
      success: true,
      treatmentSession: result,
    });
  } catch (error: any) {
    console.error("PATCH Treatment Session Error:", error);
    return NextResponse.json(
      { error: "Failed to record session outcome" },
      { status: 500 }
    );
  }
}
