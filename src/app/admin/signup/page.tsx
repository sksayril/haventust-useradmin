"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, ShieldAlert, User, ArrowRight, Eye, EyeOff, CheckCircle2 } from "lucide-react";

export default function AdminSignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const auth = localStorage.getItem("adminAuthenticated") === "true";
    if (auth) {
      router.replace("/admin");
    } else {
      setIsChecking(false);
    }
  }, [router]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, phone: "9999999999" }),
      });

      const data = await res.json();
      if (res.ok) {
        // Authenticate by storing session key
        localStorage.setItem("adminAuthenticated", "true");
        localStorage.setItem("adminEmail", email);
        localStorage.setItem("adminName", name);
        router.replace("/admin");
      } else {
        setError(data.error || "Failed to create admin profile.");
      }
    } catch {
      setError("Network connection issue. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="w-screen h-screen bg-gradient-to-br from-[#f3f7fd] via-white to-[#eef4ff] flex flex-col items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-[#0b5be6] mb-3" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">Checking Session...</span>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex select-none bg-[#f8fafc]">

      {/* ========================================================================= */}
      {/* LEFT SIDE PANEL (Admin Branding - Hidden on mobile) */}
      {/* ========================================================================= */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-tr from-[#0a56e3] via-[#083ca3] to-[#041a4a] text-white p-12 flex-col justify-between relative overflow-hidden">

        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-blue-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#ef9f15]/10 rounded-full blur-3xl" />

        <div className="flex items-center gap-3 relative z-10">
          <div className="bg-white/95 text-[#0a56e3] font-black w-10 h-10 rounded-xl flex items-center justify-center text-2xl shadow-lg">
            H
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-wide">haventust</h2>
            <p className="text-[10px] text-blue-200/90 font-medium tracking-wider uppercase">Admin Control Panel</p>
          </div>
        </div>

        <div className="relative z-10 my-auto max-w-lg">
          <div className="bg-[#ef9f15]/25 text-amber-200 text-xs font-bold px-3 py-1.5 rounded-full w-fit flex items-center gap-1.5 mb-6 border border-white/5 backdrop-blur-sm">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Secure Registry Registration</span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-black tracking-tight leading-[1.15] mb-6">
            Create Admin<br />Account
          </h1>
          <p className="text-blue-100 text-base leading-relaxed mb-8">
            Create an administrator account to securely access user logs, manage package activations, execute payouts, and control system configuration settings.
          </p>

          <div className="flex flex-col gap-3">
            {[
              "Database-backed administrator credentials",
              "Full administrative privileges upon activation",
              "Access to user management & payout controls"
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-3 text-sm text-blue-100">
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-xs text-blue-200/60 font-medium relative z-10 flex justify-between items-center">
          <span>&copy; 2026 haventust Inc.</span>
          <div className="flex gap-4">
            <span className="hover:text-white cursor-pointer transition-colors">Security</span>
            <span className="hover:text-white cursor-pointer transition-colors">Compliance</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT SIDE PANEL (Signup Form) */}
      {/* ========================================================================= */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 py-12 md:px-12 bg-white relative">

        <div className="lg:hidden absolute top-6 left-6 flex items-center gap-2">
          <div className="bg-[#0b5be6] text-white font-black w-8 h-8 rounded-lg flex items-center justify-center text-lg shadow-md">
            H
          </div>
          <span className="font-bold text-gray-800 tracking-wide text-sm">haventust Admin</span>
        </div>

        <div className="w-full max-w-md">

          <div className="w-14 h-14 bg-gradient-to-br from-[#0b5be6] to-[#073ca2] text-white rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-blue-500/20">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div className="text-left mb-8">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">
              Create Admin Profile
            </h2>
            <p className="text-sm text-gray-400 font-medium mt-2 leading-relaxed">
              Fill in your details and enter a valid invite key to register.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-xs font-semibold p-3.5 rounded-xl mb-6 text-left">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="flex flex-col gap-5">
            {/* Full Name */}
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-2">Admin Name</label>
              <div className="relative">
                <input type="text" required placeholder="Admin Officer" value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#f8fafc] text-sm text-gray-800 pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:bg-white focus:border-[#0b5be6] focus:outline-none transition-all duration-200"
                />
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-2">Admin Email</label>
              <div className="relative">
                <input type="email" required placeholder="officer@haventust.com" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#f8fafc] text-sm text-gray-800 pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:bg-white focus:border-[#0b5be6] focus:outline-none transition-all duration-200"
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-2">Security Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#f8fafc] text-sm text-gray-800 pl-11 pr-12 py-3 rounded-xl border border-gray-200 focus:bg-white focus:border-[#0b5be6] focus:outline-none transition-all duration-200"
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>



            {/* Submit */}
            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-[#0b5be6] to-[#073ca2] hover:from-[#0a50d0] hover:to-[#062e8a] disabled:opacity-60 text-white font-bold py-3.5 px-4 rounded-xl text-sm transition-all duration-250 transform active:scale-[0.98] shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 mt-2 disabled:pointer-events-none select-none cursor-pointer"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <span>Create Admin Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer links */}
          <div className="flex flex-col items-center gap-3 mt-8">
            <p className="text-xs font-semibold text-gray-500">
              Already have admin access?{" "}
              <Link href="/admin/login" className="text-[#0b5be6] font-bold hover:underline">
                Sign In
              </Link>
            </p>
            <div className="w-full h-px bg-gray-100" />
            <p className="text-[10px] text-gray-400 font-bold">
              Not an admin?{" "}
              <Link href="/login" className="text-[#0b5be6] hover:underline">
                Go to User Login →
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
