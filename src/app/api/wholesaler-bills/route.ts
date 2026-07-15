import { NextResponse } from "next/server";
import { getSession, logAudit } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/wholesaler-bills - Fetch wholesaler billing logs
export async function GET() {
  try {
    const session = await getSession();
    if (!session || !["SUPER_ADMIN", "STAFF"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bills = await prisma.wholesalerBill.findMany({
      orderBy: { billDate: "desc" },
    });

    return NextResponse.json(bills);
  } catch (error: any) {
    console.error("GET Wholesaler Bills Error:", error);
    return NextResponse.json({ error: "Failed to retrieve wholesaler bills" }, { status: 500 });
  }
}

// POST /api/wholesaler-bills - Log wholesaler bill outflow
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
          if (perms.includes("record_wholesaler_bills")) {
            isAuthorized = true;
          }
        } catch {}
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: "Forbidden: requires record_wholesaler_bills permission" }, { status: 403 });
    }

    const { wholesaler, invoiceNumber, billDate, amount, notes } = await request.json();

    if (!wholesaler || !invoiceNumber || !billDate || amount === undefined) {
      return NextResponse.json(
        { error: "Required fields: wholesaler, invoiceNumber, billDate, amount" },
        { status: 400 }
      );
    }

    const bill = await prisma.wholesalerBill.create({
      data: {
        wholesaler,
        invoiceNumber,
        billDate: new Date(billDate),
        amount: parseFloat(amount),
        notes,
        recordedById: session.userId,
      },
    });

    await logAudit(
      session.userId,
      "WholesalerBill",
      bill.id,
      "CREATE",
      null,
      bill
    );

    return NextResponse.json({ success: true, bill });
  } catch (error: any) {
    console.error("POST Wholesaler Bill Error:", error);
    return NextResponse.json({ error: "Failed to log wholesaler bill record" }, { status: 500 });
  }
}
