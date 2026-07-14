import { NextResponse } from "next/server";
import { getSession, hasPermission, logAudit } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/clinics - Available to authenticated users
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clinics = await prisma.clinic.findMany({
      include: {
        billingEntity: {
          select: {
            id: true,
            legalName: true,
            invoicePrefix: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(clinics);
  } catch (error: any) {
    console.error("GET Clinics Error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve clinics" },
      { status: 500 }
    );
  }
}

// POST /api/clinics - Only SUPER_ADMIN
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(session.role, "manage_clinics")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { name, address, contactNumber, gstNumber, logoUrl, operatingHours, billingEntityId } = await request.json();

    if (!name || !address || !contactNumber || !gstNumber || !operatingHours) {
      return NextResponse.json(
        { error: "Required fields: name, address, contactNumber, gstNumber, operatingHours" },
        { status: 400 }
      );
    }

    const newClinic = await prisma.clinic.create({
      data: {
        name,
        address,
        contactNumber,
        gstNumber,
        logoUrl,
        operatingHours: typeof operatingHours === "string" ? operatingHours : JSON.stringify(operatingHours),
        billingEntityId: billingEntityId || null,
      },
    });

    // Write audit log
    await logAudit(
      session.userId,
      "Clinic",
      newClinic.id,
      "CREATE",
      null,
      newClinic
    );

    return NextResponse.json({ success: true, clinic: newClinic });
  } catch (error: any) {
    console.error("POST Clinic Error:", error);
    return NextResponse.json(
      { error: "Failed to create clinic branch" },
      { status: 500 }
    );
  }
}
