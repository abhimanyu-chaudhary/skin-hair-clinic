import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "clinic_session";

interface DecodedToken {
  userId: string;
  email: string;
  role: string;
  profileId: string | null;
  name: string;
  exp: number;
}

function decodeJWTPayload(token: string): DecodedToken | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    
    // Decode base64 URL format
    const raw = globalThis.atob(base64);
    const payload = JSON.parse(raw);
    
    // Check expiration
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return null;
    }
    
    return payload as DecodedToken;
  } catch (error) {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Read cookie
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const session = token ? decodeJWTPayload(token) : null;

  // 1. API Route Guards
  if (pathname.startsWith("/api/")) {
    // Exclude public auth APIs
    if (
      pathname.startsWith("/api/auth/login") ||
      pathname.startsWith("/api/auth/logout") ||
      pathname.startsWith("/api/patients/register") // Support patient self-registration
    ) {
      return NextResponse.next();
    }

    if (!session) {
      return NextResponse.json(
        { error: "Unauthenticated. Please log in." },
        { status: 401 }
      );
    }

    // Role-based scoping of API routes
    if (pathname.startsWith("/api/inventory") && session.role === "PATIENT") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    if (pathname.startsWith("/api/billing/reports") && !["SUPER_ADMIN", "STAFF"].includes(session.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.next();
  }

  // 2. UI Page Route Guards
  if (pathname.startsWith("/dashboard")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Redirect to respective role folders if they access /dashboard directly
    if (pathname === "/dashboard") {
      const rolePath = session.role === "SUPER_ADMIN" ? "admin" : session.role.toLowerCase().replace("_", "-");
      return NextResponse.redirect(new URL(`/dashboard/${rolePath}`, request.url));
    }

    // Strict UI routing access controls
    if (pathname.startsWith("/dashboard/admin") && session.role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    if (pathname.startsWith("/dashboard/doctor") && session.role !== "DOCTOR") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    if (pathname.startsWith("/dashboard/staff") && session.role !== "STAFF") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    if (pathname.startsWith("/dashboard/patient") && session.role !== "PATIENT") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Prevent accessing login page if already logged in
  if (pathname === "/login") {
    if (session) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/login",
    "/api/patients/:path*",
    "/api/appointments/:path*",
    "/api/emr/:path*",
    "/api/billing/:path*",
    "/api/inventory/:path*",
  ],
};
