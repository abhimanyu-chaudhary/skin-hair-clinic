"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (res.ok) {
        router.push("/login");
        router.refresh();
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <button
      onClick={handleLogout}
      type="button"
      title="Sign Out"
      className="p-2.5 hover:bg-rose-950/30 hover:border-rose-900/35 border border-transparent rounded-lg text-slate-400 hover:text-rose-400 transition-all duration-200 cursor-pointer"
    >
      <LogOut className="h-4.5 w-4.5" />
    </button>
  );
}
