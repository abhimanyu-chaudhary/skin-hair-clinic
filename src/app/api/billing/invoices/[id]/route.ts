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

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        items: true,
        payments: true,
        patient: {
          select: { id: true, name: true, mrn: true, mobile: true, email: true, address: true },
        },
        clinic: true,
        billingEntity: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Patient access check
    if (session.role === "PATIENT" && session.profileId !== invoice.patientId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json(invoice);
  } catch (error: any) {
    console.error("GET Invoice Details Error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve invoice details" },
      { status: 500 }
    );
  }
}
