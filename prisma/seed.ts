import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";
import bcrypt from "bcryptjs";

const dbPath = path.join(process.cwd(), "dev.db");
const adapter = new PrismaBetterSqlite3({
  url: `file:${dbPath}`,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Starting database seeding...");

  // Clear existing data to allow fresh seeds
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.stockMovement.deleteMany({});
  await prisma.purchase.deleteMany({});
  await prisma.productBatch.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.invoiceItem.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.treatmentSessionPhoto.deleteMany({});
  await prisma.treatmentSession.deleteMany({});
  await prisma.treatmentPlan.deleteMany({});
  await prisma.treatmentCatalog.deleteMany({});
  await prisma.prescriptionItem.deleteMany({});
  await prisma.prescription.deleteMany({});
  await prisma.diagnosticInvestigation.deleteMany({});
  await prisma.clinicalPhoto.deleteMany({});
  await prisma.consultation.deleteMany({});
  await prisma.appointment.deleteMany({});
  await prisma.patient.deleteMany({});
  await prisma.doctor.deleteMany({});
  await prisma.staff.deleteMany({});
  await prisma.clinic.deleteMany({});
  await prisma.billingEntity.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("Database cleared.");

  // 1. Create default Billing Entity
  const billingEntity = await prisma.billingEntity.create({
    data: {
      legalName: "Antigravity Skin & Hair Clinic Pvt Ltd",
      address: "102, 1st Floor, Signature Towers, Koramangala, Bangalore - 560034",
      gstin: "29AAAAA1111A1Z1",
      pan: "AAAAA1111A",
      invoicePrefix: "AG-INV",
      bankDetails: "ICICI Bank, A/C: 123456789012, IFSC: ICIC0000123",
      terms: "1. Fees are non-refundable.\n2. Standard package sessions expire in 6 months.\n3. Tax is levied as per state guidelines.",
      logoUrl: "/logo.png",
    },
  });

  // 2. Create default Clinic Branch
  const clinic = await prisma.clinic.create({
    data: {
      name: "Antigravity Skin & Hair Clinic - Koramangala",
      address: "80 Feet Road, Koramangala 4th Block, Bangalore - 560034",
      contactNumber: "+91 80 4991 2233",
      gstNumber: "29AAAAA1111A1Z1",
      logoUrl: "/logo.png",
      operatingHours: JSON.stringify({
        weekdays: "09:00 AM - 08:00 PM",
        sunday: "10:00 AM - 04:00 PM",
      }),
      billingEntityId: billingEntity.id,
    },
  });

  console.log("Billing Entity and Clinic Branch created.");

  // Password hashes
  const adminHash = await bcrypt.hash("admin123", 10);
  const staffHash = await bcrypt.hash("staff123", 10);
  const doctorHash = await bcrypt.hash("doctor123", 10);
  const patientHash = await bcrypt.hash("patient123", 10);

  // 3. Create Super Admin User
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@clinic.com",
      passwordHash: adminHash,
      role: "SUPER_ADMIN",
      isActive: true,
    },
  });

  // 4. Create Staff User
  const staffUser = await prisma.user.create({
    data: {
      email: "staff@clinic.com",
      passwordHash: staffHash,
      role: "STAFF",
      isActive: true,
    },
  });

  const staff = await prisma.staff.create({
    data: {
      userId: staffUser.id,
      clinicId: clinic.id,
      name: "Sarah Jenkins",
      mobile: "9988776655",
      permissions: JSON.stringify([
        "manage_appointments",
        "manage_patients",
        "manage_billing",
        "manage_inventory",
      ]),
    },
  });

  // 5. Create Doctor User
  const doctorUser = await prisma.user.create({
    data: {
      email: "doctor@clinic.com",
      passwordHash: doctorHash,
      role: "DOCTOR",
      isActive: true,
    },
  });

  const doctor = await prisma.doctor.create({
    data: {
      userId: doctorUser.id,
      clinicId: clinic.id,
      name: "Dr. Ananya Rao",
      gender: "FEMALE",
      dob: new Date("1985-05-15"),
      mobile: "9876543210",
      regNumber: "KMC-2010-98765",
      issuingCouncil: "Karnataka Medical Council",
      qualifications: "MBBS, MD - Dermatology, Venereology & Leprosy",
      specializations: "Clinical Dermatology, Cosmetology, Hair Transplant",
      experienceYrs: 12,
      consultFee: 800.0,
      followUpFee: 400.0,
      slotDuration: 15,
      weeklySchedule: JSON.stringify([
        { day: "Monday", slots: [{ start: "09:00", end: "13:00" }, { start: "16:00", end: "20:00" }] },
        { day: "Tuesday", slots: [{ start: "09:00", end: "13:00" }, { start: "16:00", end: "20:00" }] },
        { day: "Wednesday", slots: [{ start: "09:00", end: "13:00" }, { start: "16:00", end: "20:00" }] },
        { day: "Thursday", slots: [{ start: "09:00", end: "13:00" }, { start: "16:00", end: "20:00" }] },
        { day: "Friday", slots: [{ start: "09:00", end: "13:00" }, { start: "16:00", end: "20:00" }] },
        { day: "Saturday", slots: [{ start: "09:00", end: "14:00" }] },
      ]),
      signatureUrl: "/signatures/dr_ananya.png",
      status: "ACTIVE",
    },
  });

  // 6. Create Patient User
  const patientUser = await prisma.user.create({
    data: {
      email: "patient@clinic.com",
      passwordHash: patientHash,
      role: "PATIENT",
      isActive: true,
    },
  });

  const patient = await prisma.patient.create({
    data: {
      userId: patientUser.id,
      mrn: "SHC-2026-000001",
      name: "John Doe",
      dob: new Date("1992-08-20"),
      gender: "MALE",
      mobile: "9876500001",
      altMobile: "9876500002",
      email: "patient@clinic.com",
      address: "456, 12th Main, HSR Layout, Sector 6, Bangalore - 560102",
      emergencyName: "Jane Doe",
      emergencyMobile: "9876500003",
      bloodGroup: "O+",
      allergies: "Sulfonamides, Peanuts",
      chronicConditions: "Mild Thyroid",
      currentMedications: "Thyronorm 25mcg",
      pastTreatments: "Laser Hair Reduction (2 sittings elsewhere)",
      referralSource: "Google Maps",
      photoUrl: "/patients/john_doe.jpg",
      govtIdType: "Aadhaar",
      govtIdNumber: "1234-5678-9012",
      consentRecorded: true,
      consentTimestamp: new Date(),
    },
  });

  console.log("Core users (Admin, Staff, Doctor, Patient) seeded.");

  // 7. Create default Treatments Catalog
  const tr1 = await prisma.treatmentCatalog.create({
    data: { name: "PRP (Platelet-Rich Plasma) Therapy - Hair", category: "HAIR", basePrice: 5000.0, description: "Advanced hair regrowth therapy utilizing patient's autologous plasma." }
  });
  const tr2 = await prisma.treatmentCatalog.create({
    data: { name: "FUE Hair Transplant (1000 Grafts)", category: "HAIR", basePrice: 45000.0, description: "Follicular Unit Extraction transplant session for hairline reconstruction." }
  });
  const tr3 = await prisma.treatmentCatalog.create({
    data: { name: "HydraFacial Skin Rejuvenation", category: "SKIN", basePrice: 4500.0, description: "Deep cleansing, exfoliation, extraction, and hydration facial treatment." }
  });
  const tr4 = await prisma.treatmentCatalog.create({
    data: { name: "Salicylic Acid Chemical Peel (30%)", category: "SKIN", basePrice: 2500.0, description: "Acne control chemical exfoliation peel for face." }
  });

  console.log("Treatments catalog items seeded.");

  // 8. Create default Products in inventory
  const prod1 = await prisma.product.create({
    data: {
      sku: "MIN-5-TOP",
      name: "Minoxidil 5% Topical Solution (60ml)",
      category: "MEDICINE",
      unit: "Bottle",
      purchasePrice: 380.0,
      sellingPrice: 720.0,
      taxRate: 12.0,
      reorderLevel: 10,
      supplier: "Apex Pharmaceutical Distributors",
    }
  });

  const prod2 = await prisma.product.create({
    data: {
      sku: "FIN-1-TAB",
      name: "Finasteride 1mg (30 Tablets)",
      category: "MEDICINE",
      unit: "Strip",
      purchasePrice: 65.0,
      sellingPrice: 150.0,
      taxRate: 12.0,
      reorderLevel: 15,
      supplier: "Apex Pharmaceutical Distributors",
    }
  });

  const prod3 = await prisma.product.create({
    data: {
      sku: "PRP-KIT-CON",
      name: "PRP Extraction Vacuum Kits (Dual Spin)",
      category: "CONSUMABLE",
      unit: "Kit",
      purchasePrice: 450.0,
      sellingPrice: 900.0,
      taxRate: 18.0,
      reorderLevel: 5,
      supplier: "Meditech Surgical Supplies",
    }
  });

  const prod4 = await prisma.product.create({
    data: {
      sku: "CLE-HYD-RET",
      name: "Glycolic Acid Face Cleanser (150ml)",
      category: "RETAIL_PRODUCT",
      unit: "Tube",
      purchasePrice: 190.0,
      sellingPrice: 380.0,
      taxRate: 18.0,
      reorderLevel: 12,
      supplier: "Aura Cosmetics Ltd",
    }
  });

  console.log("Inventory products seeded.");

  // 9. Create Product Batches & Initial purchases
  // Batch for Minoxidil - normal
  const batch1 = await prisma.productBatch.create({
    data: {
      productId: prod1.id,
      batchNumber: "MN5-26A",
      expiryDate: new Date("2028-06-30"),
      quantity: 45,
      purchaseCost: 380.0,
    }
  });
  await prisma.purchase.create({
    data: { supplier: prod1.supplier, invoiceNumber: "PINV-9821", batchId: batch1.id, quantity: 45, cost: 17100.0 }
  });
  await prisma.stockMovement.create({
    data: { productId: prod1.id, batchId: batch1.id, quantity: 45, type: "PURCHASE", reason: "Initial seed stock delivery", userId: adminUser.id }
  });

  // Batch for Finasteride - normal
  const batch2 = await prisma.productBatch.create({
    data: {
      productId: prod2.id,
      batchNumber: "FN1-26B",
      expiryDate: new Date("2028-08-31"),
      quantity: 120,
      purchaseCost: 65.0,
    }
  });
  await prisma.purchase.create({
    data: { supplier: prod2.supplier, invoiceNumber: "PINV-9821", batchId: batch2.id, quantity: 120, cost: 7800.0 }
  });
  await prisma.stockMovement.create({
    data: { productId: prod2.id, batchId: batch2.id, quantity: 120, type: "PURCHASE", reason: "Initial seed stock delivery", userId: adminUser.id }
  });

  // Batch for PRP Kits - NEAR EXPIRY! (60-day window)
  const nearExpiryDate = new Date();
  nearExpiryDate.setDate(nearExpiryDate.getDate() + 25); // Expiry in 25 days!
  const batch3 = await prisma.productBatch.create({
    data: {
      productId: prod3.id,
      batchNumber: "PK-EXP26",
      expiryDate: nearExpiryDate,
      quantity: 4, // Low stock + near expiry!
      purchaseCost: 450.0,
    }
  });
  await prisma.purchase.create({
    data: { supplier: prod3.supplier, invoiceNumber: "MT-3829", batchId: batch3.id, quantity: 4, cost: 1800.0 }
  });
  await prisma.stockMovement.create({
    data: { productId: prod3.id, batchId: batch3.id, quantity: 4, type: "PURCHASE", reason: "Urgent top-up batch", userId: adminUser.id }
  });

  // Batch for Cleanser - normal
  const batch4 = await prisma.productBatch.create({
    data: {
      productId: prod4.id,
      batchNumber: "CLE-01",
      expiryDate: new Date("2027-11-30"),
      quantity: 32,
      purchaseCost: 190.0,
    }
  });
  await prisma.purchase.create({
    data: { supplier: prod4.supplier, invoiceNumber: "COSMO-1002", batchId: batch4.id, quantity: 32, cost: 6080.0 }
  });
  await prisma.stockMovement.create({
    data: { productId: prod4.id, batchId: batch4.id, quantity: 32, type: "PURCHASE", reason: "Initial seed stock delivery", userId: adminUser.id }
  });

  console.log("Batches, purchases and initial stock movements seeded.");
  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
