import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { setSessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // 1. Find the user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        doctorProfile: true,
        staffProfile: true,
        patientProfile: true,
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // 2. Validate password
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // 3. Resolve profile details
    let profileId: string | null = null;
    let name = "System Administrator";

    if (user.role === "DOCTOR") {
      if (!user.doctorProfile) {
        return NextResponse.json(
          { error: "Doctor profile not configured" },
          { status: 400 }
        );
      }
      profileId = user.doctorProfile.id;
      name = user.doctorProfile.name;
    } else if (user.role === "STAFF") {
      if (!user.staffProfile) {
        return NextResponse.json(
          { error: "Staff profile not configured" },
          { status: 400 }
        );
      }
      profileId = user.staffProfile.id;
      name = user.staffProfile.name;
    } else if (user.role === "PATIENT") {
      if (!user.patientProfile) {
        return NextResponse.json(
          { error: "Patient profile not configured" },
          { status: 400 }
        );
      }
      profileId = user.patientProfile.id;
      name = user.patientProfile.name;
    }

    // 4. Set cookie session
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      profileId,
      name,
    };

    await setSessionCookie(payload);

    return NextResponse.json({
      success: true,
      user: {
        email: user.email,
        role: user.role,
        name,
        profileId,
      },
    });
  } catch (error: any) {
    console.error("Login API Error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during login" },
      { status: 500 }
    );
  }
}
