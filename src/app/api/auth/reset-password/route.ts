import { NextResponse } from "next/server";
import { getSession, logAudit } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

// POST /api/auth/reset-password - Super Admin password overrides
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { targetUserId, newPassword } = await request.json();

    if (session.role !== "SUPER_ADMIN" && targetUserId !== session.userId) {
      return NextResponse.json({ error: "Forbidden. You can only reset your own password." }, { status: 403 });
    }

    if (!targetUserId || !newPassword) {
      return NextResponse.json({ error: "userId and newPassword are required" }, { status: 400 });
    }

    if (newPassword.length < 5) {
      return NextResponse.json({ error: "Password must be at least 5 characters long" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const beforeState = { ...targetUser };

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { passwordHash: hashedPassword },
    });

    // Write audit log
    await logAudit(
      session.userId,
      "User",
      targetUserId,
      "UPDATE",
      { email: beforeState.email, role: beforeState.role },
      { email: updatedUser.email, role: updatedUser.role, message: "Password override by Super Admin" }
    );

    return NextResponse.json({
      success: true,
      message: `Password reset successfully for user: ${targetUser.email}`,
    });
  } catch (error: any) {
    console.error("Reset Password API Error:", error);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}
