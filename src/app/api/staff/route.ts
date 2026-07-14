import { NextResponse } from "next/server";
import { getSession, logAudit } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

// GET /api/staff - List all clinic staff members
export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const staffs = await prisma.staff.findMany({
      include: {
        user: { select: { email: true, isActive: true } },
        clinic: { select: { name: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(staffs);
  } catch (error: any) {
    console.error("GET Staff Error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve staff members list" },
      { status: 500 }
    );
  }
}

// POST /api/staff - Register a new staff user profile & permissions
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { email, password, name, mobile, clinicId, permissions } = body; // permissions is an array of strings

    if (!email || !password || !name || !mobile || !clinicId) {
      return NextResponse.json(
        { error: "Required fields: email, password, name, mobile, clinicId" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Login User
      const user = await tx.user.create({
        data: {
          email,
          passwordHash: hashedPassword,
          role: "STAFF",
        },
      });

      // 2. Create Staff Profile
      const staff = await tx.staff.create({
        data: {
          userId: user.id,
          clinicId,
          name,
          mobile,
          permissions: JSON.stringify(permissions || []),
        },
      });

      return { user, staff };
    });

    await logAudit(
      session.userId,
      "Staff",
      result.staff.id,
      "CREATE",
      null,
      result.staff
    );

    return NextResponse.json({
      success: true,
      staff: result.staff,
    });
  } catch (error: any) {
    console.error("POST Create Staff Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to register staff profile" },
      { status: 500 }
    );
  }
}
