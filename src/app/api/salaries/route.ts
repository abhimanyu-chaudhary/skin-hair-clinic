import { NextResponse } from "next/server";
import { getSession, logAudit } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/salaries - Fetch salary logs (Admin only)
export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payouts = await prisma.salaryPayout.findMany({
      orderBy: { payoutDate: "desc" },
    });

    return NextResponse.json(payouts);
  } catch (error: any) {
    console.error("GET Salaries Error:", error);
    return NextResponse.json({ error: "Failed to retrieve salary logs" }, { status: 500 });
  }
}

// POST /api/salaries - Log employee salary payout (Admin only)
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { employeeId, employeeType, employeeName, amount, payoutDate, periodMonth, periodYear, notes } = await request.json();

    if (!employeeId || !employeeType || !employeeName || amount === undefined || !periodMonth || !periodYear) {
      return NextResponse.json(
        { error: "Required fields: employeeId, employeeType, employeeName, amount, periodMonth, periodYear" },
        { status: 400 }
      );
    }

    const payout = await prisma.salaryPayout.create({
      data: {
        employeeId,
        employeeType,
        employeeName,
        amount: parseFloat(amount),
        payoutDate: payoutDate ? new Date(payoutDate) : new Date(),
        periodMonth: parseInt(periodMonth, 10),
        periodYear: parseInt(periodYear, 10),
        notes,
      },
    });

    await logAudit(
      session.userId,
      "SalaryPayout",
      payout.id,
      "CREATE",
      null,
      payout
    );

    return NextResponse.json({ success: true, payout });
  } catch (error: any) {
    console.error("POST Salary Error:", error);
    return NextResponse.json({ error: "Failed to record salary payout log" }, { status: 500 });
  }
}
