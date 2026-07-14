import React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Link from "next/link";
import LogoutButton from "./LogoutButton";
import { getGlobalSettings } from "@/lib/settings-service";
import {
  Activity,
  Calendar,
  ClipboardList,
  Layers,
  Receipt,
  Package,
  TrendingUp,
  User,
  Users,
  Building,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // Sidebar link config depending on role
  const getNavLinks = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return [
          { href: "/dashboard/admin?tab=analytics", label: "Analytics Overview", icon: TrendingUp },
          { href: "/dashboard/admin?tab=clinics", label: "Clinic Branches", icon: Building },
          { href: "/dashboard/admin?tab=doctors", label: "Manage Doctors", icon: Users },
          { href: "/dashboard/admin?tab=staff", label: "Manage Staff", icon: User },
          { href: "/dashboard/admin?tab=masters", label: "Masters Setup", icon: Layers },
          { href: "/dashboard/admin?tab=settings", label: "Global Settings", icon: ShieldCheck },
        ];
      case "STAFF":
        return [
          { href: "/dashboard/staff?tab=checkin", label: "Reception Queue", icon: ClipboardList },
          { href: "/dashboard/staff?tab=search", label: "Bookings & Slots", icon: Calendar },
          { href: "/dashboard/staff?tab=billing", label: "Invoicing Ledgers", icon: Receipt },
          { href: "/dashboard/staff?tab=inventory", label: "Inventory Stock", icon: Package },
        ];
      case "DOCTOR":
        return [
          { href: "/dashboard/doctor?tab=queue", label: "Consultation Queue", icon: ClipboardList },
          { href: "/dashboard/doctor?tab=schedule", label: "My Roster & Availability", icon: Calendar },
        ];
      case "PATIENT":
        return [
          { href: "/dashboard/patient?tab=records", label: "My Medical Record", icon: User },
          { href: "/dashboard/patient?tab=treatment", label: "Treatment Packages", icon: Sparkles },
          { href: "/dashboard/patient?tab=billing", label: "Bills & Receipts", icon: Receipt },
          { href: "/dashboard/patient?tab=book", label: "Book Slot", icon: Calendar },
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks(session.role);
  const settings = getGlobalSettings();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans">
      {/* Desktop Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col shrink-0">
        
        {/* Branch Title/Logo */}
        <div className="p-6 border-b border-slate-800 flex items-center gap-3 bg-slate-900/60">
          <div className="p-2 bg-emerald-950/50 border border-emerald-800/40 rounded-lg text-emerald-400">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">{settings.businessName}</h2>
            <span className="text-[10px] text-emerald-400 font-semibold px-2 py-0.5 bg-emerald-950/40 border border-emerald-900/30 rounded-full mt-1 inline-block">
              {session.role.replace("_", " ")}
            </span>
          </div>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 px-4 py-3 text-xs font-medium text-slate-350 hover:text-white rounded-lg hover:bg-slate-850 border border-transparent hover:border-slate-800 transition-all duration-200"
              >
                <Icon className="h-4.5 w-4.5 text-slate-400" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logged user section */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/40 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">{session.name}</p>
            <p className="text-[9px] text-slate-500 truncate">{session.email}</p>
          </div>
          <LogoutButton />
        </div>

      </aside>

      {/* Main dashboard content container */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-950">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/20 flex items-center justify-between px-6 shrink-0 relative z-25">
          <div className="flex items-center gap-3">
            <h3 className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
              Skin & Hair OPD Management System
            </h3>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-2">
            <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
            <span>Clinic Live Session</span>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 p-6 relative">
          {children}
        </div>
      </main>
    </div>
  );
}
