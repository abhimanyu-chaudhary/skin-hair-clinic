import { NextResponse } from "next/server";
import { getSession, hasPermission, logAudit } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/treatments - Available to Admin, Staff, Doctor
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const treatments = await prisma.treatmentCatalog.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json(treatments);
  } catch (error: any) {
    console.error("GET Treatments Error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve treatments catalog" },
      { status: 500 }
    );
  }
}

// POST /api/treatments - Only SUPER_ADMIN
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let isAuthorized = false;
    if (session.role === "SUPER_ADMIN") {
      isAuthorized = true;
    } else if (session.role === "STAFF") {
      const staff = await prisma.staff.findUnique({
        where: { userId: session.userId },
      });
      if (staff) {
        try {
          const perms = JSON.parse(staff.permissions);
          if (perms.includes("add_treatment_catalog")) {
            isAuthorized = true;
          }
        } catch {}
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: "Forbidden: requires add_treatment_catalog permission" }, { status: 403 });
    }

    const { name, category, description, basePrice } = await request.json();

    if (!name || !category || basePrice === undefined) {
      return NextResponse.json(
        { error: "Required fields: name, category (HAIR or SKIN), basePrice" },
        { status: 400 }
      );
    }

    const newTreatment = await prisma.treatmentCatalog.create({
      data: {
        name,
        category,
        description,
        basePrice: parseFloat(basePrice),
      },
    });

    // Write audit log
    await logAudit(
      session.userId,
      "TreatmentCatalog",
      newTreatment.id,
      "CREATE",
      null,
      newTreatment
    );

    return NextResponse.json({ success: true, treatment: newTreatment });
  } catch (error: any) {
    console.error("POST Treatment Error:", error);
    return NextResponse.json(
      { error: "Failed to create treatment catalog item" },
      { status: 500 }
    );
  }
}
