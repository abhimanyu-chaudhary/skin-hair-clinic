import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      );
    }

    // Double check user still exists and is active in database
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        doctorProfile: { select: { clinicId: true } },
        staffProfile: { select: { clinicId: true, permissions: true } },
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { authenticated: false, error: "User deactivated or deleted" },
        { status: 401 }
      );
    }

    // Attach active clinic id if applicable for scoping
    const clinicId = user.doctorProfile?.clinicId || user.staffProfile?.clinicId || null;

    let parsedPermissions: string[] = [];
    if (user.role === "STAFF" && user.staffProfile?.permissions) {
      try {
        parsedPermissions = JSON.parse(user.staffProfile.permissions);
      } catch {
        parsedPermissions = [];
      }
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: session.name,
        profileId: session.profileId,
        permissions: parsedPermissions,
        clinicId,
      },
    });
  } catch (error) {
    console.error("Auth Me API Error:", error);
    return NextResponse.json(
      { authenticated: false, error: "Authentication failed" },
      { status: 500 }
    );
  }
}
