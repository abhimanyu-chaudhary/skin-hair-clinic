"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Activity, ShieldAlert, Sparkles, UserCheck, Shield } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("SUPER_ADMIN");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [businessName, setBusinessName] = useState("Nepal Skin & Hair Clinic");

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.businessName) {
          setBusinessName(data.businessName);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  // Helper to autofill demo credentials
  const handleAutofill = (selectedRole: string) => {
    setRole(selectedRole);
    if (selectedRole === "SUPER_ADMIN") {
      setEmail("admin@clinic.com");
      setPassword("admin123");
    } else if (selectedRole === "STAFF") {
      setEmail("staff@clinic.com");
      setPassword("staff123");
    } else if (selectedRole === "DOCTOR") {
      setEmail("doctor@clinic.com");
      setPassword("doctor123");
    } else if (selectedRole === "PATIENT") {
      setEmail("patient@clinic.com");
      setPassword("patient123");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Successful login -> Redirect
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-950/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-slate-900/45 rounded-full blur-[120px]" />

      {/* Main card wrapper */}
      <div className="w-full max-w-md bg-slate-900/60 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden relative z-10">
        
        {/* Card header */}
        <div className="p-8 text-center border-b border-slate-800 bg-slate-900/40">
          <div className="inline-flex items-center justify-center p-3 bg-emerald-950/40 border border-emerald-800/35 rounded-xl text-emerald-400 mb-4 animate-pulse">
            <Activity className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            {businessName} <Sparkles className="h-4 w-4 text-emerald-400" />
          </h1>
          <p className="text-xs text-slate-400 mt-2">
            Skin & Hair Care Out-Patient Department EMR
          </p>
        </div>

        {/* Quick demo accounts selectors */}
        <div className="px-8 pt-6 pb-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Load Demo Profile
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: "SUPER_ADMIN", label: "Admin" },
              { id: "STAFF", label: "Staff" },
              { id: "DOCTOR", label: "Doctor" },
              { id: "PATIENT", label: "Patient" },
            ].map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => handleAutofill(d.id)}
                className={`py-2 px-1 text-xs font-medium rounded-lg border transition-all duration-200 ${
                  role === d.id
                    ? "bg-emerald-900/30 border-emerald-500 text-emerald-300 shadow-sm"
                    : "bg-slate-850/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleLogin} className="p-8 pt-4 space-y-5">
          {error && (
            <div className="p-3 bg-rose-950/30 border border-rose-800/40 rounded-lg text-rose-300 text-xs flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="e.g. staff@clinic.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4.5 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Secret Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4.5 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold rounded-lg text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/20"
          >
            {loading ? (
              <span className="h-4 w-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <UserCheck className="h-4 w-4" /> Secure Access Login
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-slate-800 bg-slate-900/30 text-center">
          <p className="text-[10px] text-slate-500 flex items-center justify-center gap-1.5">
            <Shield className="h-3 w-3" /> End-to-End Encrypted EMR Session
          </p>
        </div>

      </div>
    </div>
  );
}
