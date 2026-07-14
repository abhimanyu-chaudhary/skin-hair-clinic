import { NextResponse } from "next/server";
import { getSession, hasPermission, logAudit } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getGlobalSettings } from "@/lib/settings-service";

// GET /api/billing-entities
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const entities = await prisma.billingEntity.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(entities);
  } catch (error: any) {
    console.error("GET Billing Entities Error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve billing entities" },
      { status: 500 }
    );
  }
}

// POST /api/billing-entities - Only SUPER_ADMIN
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(session.role, "manage_billing_entities")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { legalName, address, gstin, pan, invoicePrefix, bankDetails, terms, logoUrl } = await request.json();

    if (!legalName || !address || !gstin || !pan || !invoicePrefix || !bankDetails || !terms) {
      return NextResponse.json(
        { error: "Required fields: legalName, address, gstin, pan, invoicePrefix, bankDetails, terms" },
        { status: 400 }
      );
    }

    const newEntity = await prisma.billingEntity.create({
      data: {
        legalName,
        address,
        gstin,
        pan,
        invoicePrefix,
        bankDetails,
        terms,
        logoUrl,
      },
    });

    // Write audit log
    await logAudit(
      session.userId,
      "BillingEntity",
      newEntity.id,
      "CREATE",
      null,
      newEntity
    );

    return NextResponse.json({ success: true, billingEntity: newEntity });
  } catch (error: any) {
    console.error("POST Billing Entity Error:", error);
    return NextResponse.json(
      { error: "Failed to create billing entity" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, legalName, address, gstin, pan, invoicePrefix, bankDetails, terms, logoUrl } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Billing Entity ID is required" }, { status: 400 });
    }

    const entity = await prisma.billingEntity.findUnique({
      where: { id },
    });

    if (!entity) {
      return NextResponse.json({ error: "Billing entity not found" }, { status: 404 });
    }

    const beforeState = { ...entity };
    const updateData: any = {};

    if (legalName) updateData.legalName = legalName;
    if (address) updateData.address = address;
    if (gstin) updateData.gstin = gstin;
    if (pan) updateData.pan = pan;
    if (invoicePrefix) updateData.invoicePrefix = invoicePrefix;
    if (bankDetails) updateData.bankDetails = bankDetails;
    if (terms) updateData.terms = terms;
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl;

    const updatedEntity = await prisma.billingEntity.update({
      where: { id },
      data: updateData,
    });

    await logAudit(
      session.userId,
      "BillingEntity",
      id,
      "UPDATE",
      beforeState,
      updatedEntity
    );

    return NextResponse.json({ success: true, billingEntity: updatedEntity });
  } catch (error: any) {
    console.error("PATCH Billing Entity Error:", error);
    return NextResponse.json(
      { error: "Failed to update billing entity details" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    const deletePassword = url.searchParams.get("password");

    if (!id) {
      return NextResponse.json({ error: "Billing Entity ID is required" }, { status: 400 });
    }

    const settings = getGlobalSettings();
    const requiredPassword = settings.profilePassword || "admin123";

    if (deletePassword !== requiredPassword) {
      return NextResponse.json({ error: "Incorrect profile deletion password" }, { status: 403 });
    }

    const entity = await prisma.billingEntity.findUnique({
      where: { id },
    });

    if (!entity) {
      return NextResponse.json({ error: "Billing entity not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // Unlink clinics first to avoid SQLite crashes
      await tx.clinic.updateMany({
        where: { billingEntityId: id },
        data: { billingEntityId: null },
      });
      // Delete entity
      await tx.billingEntity.delete({ where: { id } });
    });

    await logAudit(
      session.userId,
      "BillingEntity",
      id,
      "DELETE",
      entity,
      null
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE Billing Entity Error:", error);
    return NextResponse.json(
      { error: "Failed to delete billing entity (it might be linked to active invoices)" },
      { status: 500 }
    );
  }
}
