import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "./db";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-clinic-key-for-jwt-tokens-2026";
const COOKIE_NAME = "clinic_session";

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  profileId: string | null;
  name: string;
}

export async function signJWT(payload: JWTPayload): Promise<string> {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "8h" });
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

export async function setSessionCookie(payload: JWTPayload) {
  const token = await signJWT(payload);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 8, // 8 hours
    path: "/",
  });
}

export async function getSession(): Promise<JWTPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifyJWT(token);
  } catch (error) {
    return null;
  }
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });
}

// Role based access matrix
const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: [
    "view_analytics",
    "manage_clinics",
    "manage_staff",
    "manage_doctors",
    "manage_masters",
    "view_audit_logs",
    "manage_billing_entities",
  ],
  STAFF: [
    "manage_appointments",
    "manage_patients",
    "manage_billing",
    "manage_inventory",
    "view_reports",
  ],
  DOCTOR: [
    "view_appointments",
    "consult_patient",
    "write_prescription",
    "manage_availability",
    "view_medical_history",
  ],
  PATIENT: [
    "view_self_records",
    "book_self_appointment",
  ],
};

export function hasPermission(role: string, permission: string): boolean {
  if (role === "SUPER_ADMIN") return true; // Super admin has global bypass
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
}

export async function logAudit(
  userId: string,
  tableName: string,
  recordId: string,
  action: "CREATE" | "UPDATE" | "DELETE",
  beforeState: any = null,
  afterState: any = null
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        tableName,
        recordId,
        action,
        beforeState: beforeState ? JSON.stringify(beforeState) : null,
        afterState: afterState ? JSON.stringify(afterState) : null,
      },
    });
  } catch (error) {
    console.error("Audit log failed:", error);
  }
}
