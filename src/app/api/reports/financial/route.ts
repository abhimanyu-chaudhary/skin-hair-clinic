import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/reports/financial - Aggregate inflow/outflow for date ranges (Admin only)
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");

    if (!startDateStr || !endDateStr) {
      return NextResponse.json(
        { error: "Query parameters startDate and endDate are required" },
        { status: 400 }
      );
    }

    // Parse dates (start at 00:00:00, end at 23:59:59)
    const startDate = new Date(startDateStr);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(endDateStr);
    endDate.setHours(23, 59, 59, 999);

    // 1. Gather Inflow (Patient Payments)
    const payments = await prisma.payment.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        invoice: {
          include: {
            patient: true,
            clinic: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 2. Gather Outflow: Salary Payouts
    const salaries = await prisma.salaryPayout.findMany({
      where: {
        payoutDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { payoutDate: "desc" },
    });

    // 3. Gather Outflow: Wholesaler Bills
    const wholesalerBills = await prisma.wholesalerBill.findMany({
      where: {
        billDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { billDate: "desc" },
    });

    // Aggregations
    const totalInflow = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalSalaryOutflow = salaries.reduce((sum, s) => sum + s.amount, 0);
    const totalWholesalerOutflow = wholesalerBills.reduce((sum, w) => sum + w.amount, 0);
    const totalOutflow = totalSalaryOutflow + totalWholesalerOutflow;
    const netRevenue = totalInflow - totalOutflow;

    const inflowDetail = payments.map((p) => ({
      id: p.id,
      patientName: p.invoice.patient.name,
      patientMrn: p.invoice.patient.mrn,
      invoiceNumber: p.invoice.invoiceNumber,
      clinicName: p.invoice.clinic.name,
      amount: p.amount,
      paymentMode: p.paymentMode,
      paymentType: p.paymentType,
      transactionId: p.transactionId,
      date: p.createdAt,
    }));

    const salaryDetail = salaries.map((s) => ({
      id: s.id,
      employeeName: s.employeeName,
      employeeType: s.employeeType,
      amount: s.amount,
      period: `${s.periodMonth}/${s.periodYear}`,
      payoutDate: s.payoutDate,
      notes: s.notes,
    }));

    const wholesalerDetail = wholesalerBills.map((w) => ({
      id: w.id,
      wholesaler: w.wholesaler,
      invoiceNumber: w.invoiceNumber,
      amount: w.amount,
      billDate: w.billDate,
      notes: w.notes,
    }));

    return NextResponse.json({
      startDate: startDateStr,
      endDate: endDateStr,
      summary: {
        totalInflow,
        totalSalaryOutflow,
        totalWholesalerOutflow,
        totalOutflow,
        netRevenue,
      },
      inflowDetail,
      salaryDetail,
      wholesalerDetail,
    });
  } catch (error: any) {
    console.error("GET Financial Report Error:", error);
    return NextResponse.json({ error: "Failed to generate financial statement report" }, { status: 500 });
  }
}
