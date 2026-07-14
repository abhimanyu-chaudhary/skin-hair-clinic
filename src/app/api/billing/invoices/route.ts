import { NextResponse } from "next/server";
import { getSession, logAudit } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/billing/invoices - List invoices with filters
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");
    const status = searchParams.get("status");

    // Patients can only view their own invoices
    const patientFilter = session.role === "PATIENT" ? { patientId: session.profileId! } : {};

    const invoices = await prisma.invoice.findMany({
      where: {
        ...patientFilter,
        ...(patientId ? { patientId } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        patient: { select: { name: true, mrn: true } },
        clinic: { select: { name: true } },
        items: true,
        payments: true,
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(invoices);
  } catch (error: any) {
    console.error("GET Invoices Error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve invoices" },
      { status: 500 }
    );
  }
}

// POST /api/billing/invoices - Generate invoice, deduct stock batch-wise (FEFO), record split payments
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || !["STAFF", "SUPER_ADMIN"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized. Staff or Admin billing access required." }, { status: 401 });
    }

    const body = await request.json();
    const {
      clinicId,
      billingEntityId,
      patientId,
      items, // Array of { itemType, description, quantity, unitPrice, taxRate, discountAmount, productId, treatmentPlanId }
      discountAmount: billDiscount, // Bill-level discount
      discountReason,
      payments, // Array of { amount, paymentMode, paymentType, transactionId }
    } = body;

    if (!clinicId || !billingEntityId || !patientId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Required fields missing. Ensure patient, clinic, billing entity, and items are provided." },
        { status: 400 }
      );
    }

    // 1. Fetch Billing Entity to get prefix
    const billingEntity = await prisma.billingEntity.findUnique({
      where: { id: billingEntityId },
    });
    if (!billingEntity) {
      return NextResponse.json({ error: "Billing Entity not found" }, { status: 404 });
    }

    // Run transaction
    const result = await prisma.$transaction(async (tx) => {
      // 2. Generate sequential invoice number (gapless prefix validation)
      const currentYear = new Date().getFullYear();
      const prefix = `${billingEntity.invoicePrefix}-${currentYear}-`;

      const lastInvoice = await tx.invoice.findFirst({
        where: {
          invoiceNumber: { startsWith: prefix },
        },
        orderBy: { invoiceNumber: "desc" },
      });

      let seq = 1;
      if (lastInvoice) {
        const parts = lastInvoice.invoiceNumber.split("-");
        const lastSeq = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(lastSeq)) {
          seq = lastSeq + 1;
        }
      }

      const invoiceNumber = `${prefix}${seq.toString().padStart(6, "0")}`;

      // Calculate totals
      let subTotal = 0;
      let totalTax = 0;
      let totalDiscount = parseFloat(billDiscount || 0);

      items.forEach((item) => {
        const qty = parseInt(item.quantity, 10);
        const price = parseFloat(item.unitPrice);
        const taxRate = parseFloat(item.taxRate || 0);
        const itemDiscount = parseFloat(item.discountAmount || 0);

        const lineCost = qty * price - itemDiscount;
        const lineTax = lineCost * (taxRate / 100);

        subTotal += lineCost;
        totalTax += lineTax;
      });

      const totalAmount = Math.max(0, subTotal + totalTax - totalDiscount);

      // 3. Create the Invoice record
      const invoice = await tx.invoice.create({
        data: {
          billingEntityId,
          clinicId,
          patientId,
          invoiceNumber,
          totalAmount,
          taxAmount: totalTax,
          discountAmount: totalDiscount,
          discountReason: discountReason || null,
          status: "UNPAID", // Will update below based on logged payments
        },
      });

      // 4. Create Invoice Items and execute FEFO stock deduction
      for (const item of items) {
        const qty = parseInt(item.quantity, 10);
        const productId = item.productId || null;

        if (productId) {
          // Verify product exists
          const product = await tx.product.findUnique({
            where: { id: productId },
            include: { batches: true },
          });

          if (!product) {
            throw new Error(`Product not found in master catalog: ID ${productId}`);
          }

          // Count active stock in batches (not expired)
          const today = new Date();
          const activeBatches = await tx.productBatch.findMany({
            where: {
              productId,
              quantity: { gt: 0 },
              expiryDate: { gt: today },
            },
            orderBy: { expiryDate: "asc" }, // FEFO sorting!
          });

          const totalAvailableStock = activeBatches.reduce((acc, b) => acc + b.quantity, 0);

          if (totalAvailableStock < qty) {
            throw new Error(
              `Insufficient stock for ${product.name}. Required: ${qty}, Available: ${totalAvailableStock}`
            );
          }

          // Deduct quantity sequentially from batches
          let remainingToDeduct = qty;
          for (const batch of activeBatches) {
            if (remainingToDeduct === 0) break;

            const deduction = Math.min(remainingToDeduct, batch.quantity);

            // Update batch quantity
            await tx.productBatch.update({
              where: { id: batch.id },
              data: { quantity: batch.quantity - deduction },
            });

            // Record StockMovement
            await tx.stockMovement.create({
              data: {
                productId,
                batchId: batch.id,
                quantity: -deduction,
                type: "SALE",
                reason: `Sold via Invoice ${invoiceNumber}`,
                userId: session.userId,
              },
            });

            remainingToDeduct -= deduction;
          }
        }

        // Create the invoice line item
        await tx.invoiceItem.create({
          data: {
            invoiceId: invoice.id,
            itemType: item.itemType,
            description: item.description,
            quantity: qty,
            unitPrice: parseFloat(item.unitPrice),
            taxRate: parseFloat(item.taxRate || 0),
            discountAmount: parseFloat(item.discountAmount || 0),
            productId,
            treatmentPlanId: item.treatmentPlanId || null,
          },
        });
      }

      // 5. Record Payments
      let totalPaid = 0;
      if (payments && Array.isArray(payments)) {
        for (const p of payments) {
          const amt = parseFloat(p.amount);
          if (amt <= 0) continue;

          await tx.payment.create({
            data: {
              invoiceId: invoice.id,
              amount: amt,
              paymentMode: p.paymentMode,
              paymentType: p.paymentType || "FULL",
              transactionId: p.transactionId || null,
            },
          });
          totalPaid += amt;
        }
      }

      // 6. Update Invoice Status
      let finalStatus = "UNPAID";
      if (totalPaid >= totalAmount) {
        finalStatus = "PAID";
      } else if (totalPaid > 0) {
        finalStatus = "PARTIALLY_PAID";
      }

      const updatedInvoice = await tx.invoice.update({
        where: { id: invoice.id },
        data: { status: finalStatus },
      });

      return updatedInvoice;
    });

    // Write audit log
    await logAudit(
      session.userId,
      "Invoice",
      result.id,
      "CREATE",
      null,
      result
    );

    return NextResponse.json({
      success: true,
      invoiceId: result.id,
      invoice: result,
    });
  } catch (error: any) {
    console.error("POST Invoice Generation Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate invoice" },
      { status: 500 }
    );
  }
}
