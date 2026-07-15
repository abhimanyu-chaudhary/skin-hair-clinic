import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/analytics - Dynamic analytics reports based on User Role and Date Range
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (startDateParam && endDateParam) {
      startDate = new Date(startDateParam);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(endDateParam);
      endDate.setHours(23, 59, 59, 999);
    }

    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setUTCHours(23, 59, 59, 999);

    // 1. SUPER ADMIN ANALYTICS
    if (session.role === "SUPER_ADMIN") {
      const paymentFilter: any = {};
      const invoiceFilter: any = {};
      const patientFilter: any = {};
      const appointmentFilter: any = {};
      const billFilter: any = {};
      const salaryFilter: any = {};

      if (startDate && endDate) {
        paymentFilter.createdAt = { gte: startDate, lte: endDate };
        invoiceFilter.createdAt = { gte: startDate, lte: endDate };
        patientFilter.createdAt = { gte: startDate, lte: endDate };
        appointmentFilter.appointmentDate = { gte: startDate, lte: endDate };
        billFilter.billDate = { gte: startDate, lte: endDate };
        salaryFilter.payoutDate = { gte: startDate, lte: endDate };
      }

      // Total Invoiced Revenue
      const invoiceAggregates = await prisma.invoice.aggregate({
        where: invoiceFilter,
        _sum: { totalAmount: true },
      });
      const totalRevenue = invoiceAggregates._sum.totalAmount || 0;

      // Total Inflow (Gross Collections)
      const paymentAggregates = await prisma.payment.aggregate({
        where: paymentFilter,
        _sum: { amount: true },
      });
      const totalInflow = paymentAggregates._sum.amount || 0;

      // Patient count (registered within the period)
      const totalPatients = await prisma.patient.count({
        where: patientFilter,
      });

      // Active Clinics
      const totalClinics = await prisma.clinic.count();

      // Total Appointments
      const totalAppointments = await prisma.appointment.count({
        where: appointmentFilter,
      });

      // Pharmacy Outflow (Wholesaler bills logged in date range)
      const wholesalerBillAgg = await prisma.wholesalerBill.aggregate({
        where: billFilter,
        _sum: { amount: true },
      });
      const pharmacyOutflow = wholesalerBillAgg._sum.amount || 0;

      // Salary Outflow (logged in date range)
      const salaryPayoutAgg = await prisma.salaryPayout.aggregate({
        where: salaryFilter,
        _sum: { amount: true },
      });
      const salaryOutflow = salaryPayoutAgg._sum.amount || 0;

      // Net margin
      const netMargin = totalInflow - (pharmacyOutflow + salaryOutflow);

      // Inflow per Clinic
      const clinicPayments = await prisma.payment.findMany({
        where: paymentFilter,
        include: {
          invoice: {
            include: { clinic: { select: { name: true } } },
          },
        },
      });
      const clinicInflowMap: Record<string, number> = {};
      clinicPayments.forEach((p) => {
        const cName = p.invoice.clinic.name;
        clinicInflowMap[cName] = (clinicInflowMap[cName] || 0) + p.amount;
      });
      const inflowPerClinic = Object.entries(clinicInflowMap).map(([name, value]) => ({
        name,
        value,
      }));

      // Appointments per Doctor
      const doctorsList = await prisma.doctor.findMany({
        include: {
          appointments: {
            where: appointmentFilter,
          },
        },
      });
      const appointmentsPerDoctor = doctorsList.map((doc) => ({
        name: doc.name,
        value: doc.appointments.length,
      }));

      // Inventory valuation (point-in-time asset value)
      const productBatches = await prisma.productBatch.findMany({
        where: { quantity: { gt: 0 } },
      });
      const inventoryValuation = productBatches.reduce(
        (sum, batch) => sum + batch.quantity * batch.purchaseCost,
        0
      );

      // Near Expiry Alert (60D) list
      const sixtyDaysLimit = new Date();
      sixtyDaysLimit.setDate(sixtyDaysLimit.getDate() + 60);
      const nearExpiryBatches = await prisma.productBatch.findMany({
        where: {
          quantity: { gt: 0 },
          expiryDate: {
            gt: new Date(),
            lte: sixtyDaysLimit,
          },
        },
        include: {
          product: { select: { name: true, sku: true } },
        },
        orderBy: { expiryDate: "asc" },
      });
      const nearExpiryAlerts = nearExpiryBatches.map((b) => ({
        id: b.id,
        sku: b.product.sku,
        name: b.product.name,
        batchNumber: b.batchNumber,
        quantity: b.quantity,
        expiryDate: b.expiryDate,
      }));

      // Stock Shortage Alert list (Product total stock < 5)
      const allProducts = await prisma.product.findMany({
        include: {
          batches: {
            where: { quantity: { gt: 0 } },
          },
        },
      });
      const stockShortageAlerts = allProducts
        .map((prod) => {
          const totalStock = prod.batches.reduce((sum, b) => sum + b.quantity, 0);
          return {
            id: prod.id,
            sku: prod.sku,
            name: prod.name,
            totalStock,
          };
        })
        .filter((p) => p.totalStock < 5);

      return NextResponse.json({
        kpis: {
          totalRevenue,
          totalPatients,
          totalClinics,
          totalAppointments,
          inventoryValuation,
          pharmacyOutflow,
          salaryOutflow,
          totalInflow,
          netMargin,
        },
        inflowPerClinic,
        appointmentsPerDoctor,
        nearExpiryAlerts,
        stockShortageAlerts,
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
      let doctorId = session.profileId;
      if (!doctorId) {
        const doc = await prisma.doctor.findUnique({
          where: { userId: session.userId },
        });
        if (doc) doctorId = doc.id;
      }

      if (!doctorId) {
        return NextResponse.json({ error: "Doctor profile not found" }, { status: 404 });
      }

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

    return NextResponse.json({ error: "No general analytics for Patient role." }, { status: 403 });
  } catch (error: any) {
    console.error("GET Analytics Error:", error);
    return NextResponse.json(
      { error: "Failed to compute analytics reports" },
      { status: 500 }
    );
  }
}
