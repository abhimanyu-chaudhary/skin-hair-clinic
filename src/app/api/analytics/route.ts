import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/analytics - Dynamic analytics reports based on User Role
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setUTCHours(23, 59, 59, 999);

    // 1. SUPER ADMIN ANALYTICS
    if (session.role === "SUPER_ADMIN") {
      // Total Invoiced Revenue
      const invoiceAggregates = await prisma.invoice.aggregate({
        _sum: { totalAmount: true },
      });
      const totalRevenue = invoiceAggregates._sum.totalAmount || 0;

      // Patient count
      const totalPatients = await prisma.patient.count();

      // Active Clinics
      const totalClinics = await prisma.clinic.count();

      // Total Appointments
      const totalAppointments = await prisma.appointment.count();

      // Revenue per Clinic
      const invoices = await prisma.invoice.findMany({
        include: { clinic: { select: { name: true } } },
      });
      const clinicRevenueMap: Record<string, number> = {};
      invoices.forEach((inv) => {
        const cName = inv.clinic.name;
        clinicRevenueMap[cName] = (clinicRevenueMap[cName] || 0) + inv.totalAmount;
      });
      const revenuePerClinic = Object.entries(clinicRevenueMap).map(([name, value]) => ({
        name,
        value,
      }));

      // Appointments per Doctor
      const doctorsList = await prisma.doctor.findMany({
        include: { _count: { select: { appointments: true } } },
      });
      const appointmentsPerDoctor = doctorsList.map((doc) => ({
        name: doc.name,
        value: doc._count.appointments,
      }));

      // Inventory valuation
      const productBatches = await prisma.productBatch.findMany({
        where: { quantity: { gt: 0 } },
      });
      const inventoryValuation = productBatches.reduce(
        (sum, batch) => sum + batch.quantity * batch.purchaseCost,
        0
      );

      return NextResponse.json({
        kpis: {
          totalRevenue,
          totalPatients,
          totalClinics,
          totalAppointments,
          inventoryValuation,
        },
        revenuePerClinic,
        appointmentsPerDoctor,
      });
    }

    // 2. STAFF DASHBOARD STATS
    if (session.role === "STAFF") {
      const staffProfile = await prisma.staff.findUnique({
        where: { userId: session.userId },
      });
      const clinicId = staffProfile?.clinicId;

      if (!clinicId) {
        return NextResponse.json({ error: "Staff clinic mapping missing" }, { status: 400 });
      }

      // Today's collections by payment mode
      const paymentsToday = await prisma.payment.findMany({
        where: {
          createdAt: { gte: todayStart, lte: todayEnd },
          invoice: { clinicId },
        },
      });

      const collectionsByMode = {
        CASH: 0,
        CARD: 0,
        UPI: 0,
        BANK_TRANSFER: 0,
        WALLET: 0,
      } as Record<string, number>;

      let totalCollectedToday = 0;
      paymentsToday.forEach((p) => {
        collectionsByMode[p.paymentMode] = (collectionsByMode[p.paymentMode] || 0) + p.amount;
        totalCollectedToday += p.amount;
      });

      // Total Outstanding/Pending Payments at this clinic
      const unpaidInvoices = await prisma.invoice.findMany({
        where: {
          clinicId,
          status: { in: ["UNPAID", "PARTIALLY_PAID"] },
        },
        include: { payments: true },
      });

      let totalOutstanding = 0;
      unpaidInvoices.forEach((inv) => {
        const paidAmt = inv.payments.reduce((sum, p) => sum + p.amount, 0);
        totalOutstanding += Math.max(0, inv.totalAmount - paidAmt);
      });

      // Low stock count
      const products = await prisma.product.findMany({
        include: {
          batches: {
            where: { expiryDate: { gt: new Date() } },
          },
        },
      });
      const lowStockCount = products.filter((prod) => {
        const stock = prod.batches.reduce((sum, b) => sum + b.quantity, 0);
        return stock < prod.reorderLevel;
      }).length;

      // Arrived patients queue length today
      const checkInQueueLength = await prisma.appointment.count({
        where: {
          clinicId,
          appointmentDate: { gte: todayStart, lte: todayEnd },
          status: { in: ["ARRIVED", "IN_CONSULTATION"] },
        },
      });

      return NextResponse.json({
        totalCollectedToday,
        collectionsByMode: Object.entries(collectionsByMode).map(([mode, val]) => ({ mode, value: val })),
        totalOutstanding,
        lowStockCount,
        checkInQueueLength,
      });
    }

    // 3. DOCTOR DASHBOARD STATS
    if (session.role === "DOCTOR") {
      const doctorId = session.profileId!;

      const queueSize = await prisma.appointment.count({
        where: {
          doctorId,
          appointmentDate: { gte: todayStart, lte: todayEnd },
          status: { in: ["ARRIVED", "IN_CONSULTATION"] },
        },
      });

      const completedToday = await prisma.appointment.count({
        where: {
          doctorId,
          appointmentDate: { gte: todayStart, lte: todayEnd },
          status: "COMPLETED",
        },
      });

      const followUpsToday = await prisma.appointment.count({
        where: {
          doctorId,
          appointmentDate: { gte: todayStart, lte: todayEnd },
          type: "FOLLOW_UP",
        },
      });

      return NextResponse.json({
        queueSize,
        completedToday,
        followUpsToday,
      });
    }

    // Default for patients (handled separately in Patient Portal views)
    return NextResponse.json({ error: "No general analytics for Patient role." }, { status: 403 });
  } catch (error: any) {
    console.error("GET Analytics Error:", error);
    return NextResponse.json(
      { error: "Failed to compute analytics reports" },
      { status: 500 }
    );
  }
}
