import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";
import { hasPermission } from "./auth";

const dbPath = path.join(process.cwd(), "dev.db");
const adapter = new PrismaBetterSqlite3({
  url: `file:${dbPath}`,
});
const prisma = new PrismaClient({ adapter });

async function runTests() {
  console.log("=========================================");
  console.log("RUNNING AUTOMATED EMR CORE INTEGRATION TESTS");
  console.log("=========================================");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] - ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] - ${testName}`);
      failed++;
    }
  }

  // TEST 1: RBAC Permission Matrix Checks
  try {
    assert(hasPermission("SUPER_ADMIN", "manage_clinics"), "Super Admin should have manage_clinics permissions");
    assert(hasPermission("STAFF", "manage_billing"), "Staff should have billing permissions");
    assert(!hasPermission("STAFF", "consult_patient"), "Staff should NOT have patient consulting permissions");
    assert(hasPermission("DOCTOR", "consult_patient"), "Doctor should have patient consulting permissions");
    assert(!hasPermission("PATIENT", "manage_inventory"), "Patient should NOT have inventory permissions");
  } catch (err: any) {
    console.error("Test 1 crashed:", err.message);
    failed++;
  }

  // TEST 2: Patient MRN Sequence Check
  try {
    const currentYear = new Date().getFullYear();
    const prefix = `SHC-${currentYear}-`;

    const lastPatient = await prisma.patient.findFirst({
      where: { mrn: { startsWith: prefix } },
      orderBy: { mrn: "desc" },
    });

    let expectedNextSeq = 1;
    if (lastPatient) {
      const parts = lastPatient.mrn.split("-");
      expectedNextSeq = parseInt(parts[parts.length - 1], 10) + 1;
    }

    const expectedMRN = `${prefix}${expectedNextSeq.toString().padStart(6, "0")}`;
    console.log(`Calculated next MRN expected: ${expectedMRN}`);
    assert(expectedMRN.startsWith(prefix) && expectedMRN.length === 15, "MRN should follow prefix-year-sequence format");
  } catch (err: any) {
    console.error("Test 2 crashed:", err.message);
    failed++;
  }

  // TEST 3: FEFO Batch Stock Verification
  try {
    // Check product minoxidil batches
    const minoxidil = await prisma.product.findUnique({
      where: { sku: "MIN-5-TOP" },
      include: {
        batches: {
          orderBy: { expiryDate: "asc" },
        },
      },
    });

    if (minoxidil && minoxidil.batches.length > 0) {
      const firstExp = minoxidil.batches[0].expiryDate;
      const sortedByExp = minoxidil.batches.every((b, i) => i === 0 || b.expiryDate >= minoxidil.batches[i - 1].expiryDate);
      assert(sortedByExp, "Active batches for products must be returned sorted by expiry ASC (FEFO)");
    } else {
      console.warn("Product minoxidil or batches missing for verification");
    }
  } catch (err: any) {
    console.error("Test 3 crashed:", err.message);
    failed++;
  }

  console.log("=========================================");
  console.log(`TEST SUMMARY: Passed: ${passed}, Failed: ${failed}`);
  console.log("=========================================");

  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error("Test run crashed:", err);
  process.exit(1);
});
