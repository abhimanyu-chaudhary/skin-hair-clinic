import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getGlobalSettings, saveGlobalSettings } from "@/lib/settings-service";

export async function GET() {
  try {
    const settings = getGlobalSettings();
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: "Failed to retrieve configurations" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const updated = saveGlobalSettings(body);
    
    return NextResponse.json({
      success: true,
      settings: updated,
    });
  } catch (error: any) {
    console.error("POST Settings Error:", error);
    return NextResponse.json({ error: error.message || "Failed to save settings" }, { status: 500 });
  }
}
