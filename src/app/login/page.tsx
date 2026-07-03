"use client";

import React, { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

/* ──────────────────────────────────────────────────────────────────────────────
   Toast Component
────────────────────────────────────────────────────────────────────────────── */
function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-semibold max-w-sm animate-slide-in ${type === "success"
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-red-50 text-red-600 border-red-200"
        }`}
    >
      {type === "success" ? (
        <CheckCircle className="w-4.5 h-4.5 shrink-0" />
      ) : (
        <AlertCircle className="w-4.5 h-4.5 shrink-0" />
      )}
      <span>{message}</span>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   Login Page
────────────────────────────────────────────────────────────────────────────── */
export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = useCallback(
    (message: string, type: "success" | "error") => setToast({ message, type }),
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || "Login failed.", "error");
        setIsLoading(false);
        return;
      }

      // Store session
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("currentUser", JSON.stringify(data.user));

      showToast("Login successful! Redirecting…", "success");
      setTimeout(() => {
        window.location.href = "/";
      }, 1200);
    } catch {
      showToast("Network error. Please check your connection.", "error");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex select-none bg-[#f8fafc]">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* ── Left Panel ──────────────────────────────────────────────────────── */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-tr from-[#0a56e3] via-[#083ca3] to-[#041a4a] text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-blue-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />

        {/* Brand Header */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="bg-white/95 text-[#0a56e3] font-black w-10 h-10 rounded-xl flex items-center justify-center text-2xl shadow-lg">
            H
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-wide">haventust</h2>
            <p className="text-[10px] text-blue-200/90 font-medium tracking-wider uppercase">
              Invest • Grow • Earn
            </p>
          </div>
        </div>

        {/* Dynamic Presentation */}
        <div className="relative z-10 my-auto max-w-lg">
          <div className="bg-blue-400/25 text-blue-200 text-xs font-bold px-3 py-1.5 rounded-full w-fit flex items-center gap-1.5 mb-6 border border-white/5 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Empowering 10,000+ Investors Globally</span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-black tracking-tight leading-[1.15] mb-6">
            The Next Generation Investment Console
          </h1>
          <p className="text-blue-100 text-base leading-relaxed mb-8">
            Access your investment packages, view real-time commission analytics, track payouts, and manage
            your team from one unified dashboard.
          </p>

          {/* Testimonial */}
          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-lg relative">
            <div className="absolute top-4 right-4 text-white/10">
              <svg width="40" height="40" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
              </svg>
            </div>
            <p className="text-sm italic text-blue-50 leading-relaxed mb-4">
              &quot;haventust has completely transformed my career path. The investment plans are
              outstanding, and the affiliate wallet payouts are instant.&quot;
            </p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-300 to-indigo-400 flex items-center justify-center border border-white/20">
                <span className="text-xs font-black text-white">JD</span>
              </div>
              <div>
                <h4 className="text-xs font-bold">John Doe</h4>
                <p className="text-[10px] text-blue-200">Gold Member Elite</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs text-blue-200/60 font-medium relative z-10 flex justify-between items-center">
          <span>&copy; 2026 haventust Inc.</span>
          <div className="flex gap-4">
            <span className="hover:text-white cursor-pointer transition-colors">Privacy</span>
            <span className="hover:text-white cursor-pointer transition-colors">Terms</span>
          </div>
        </div>
      </div>

      {/* ── Right Panel (Form) ───────────────────────────────────────────────── */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 py-12 md:px-12 bg-white relative">
        {/* Mobile Header */}
        <div className="lg:hidden absolute top-6 left-6 flex items-center gap-2">
          <div className="bg-blue-600 text-white font-black w-8 h-8 rounded-lg flex items-center justify-center text-lg shadow-md">
            H
          </div>
          <span className="font-bold text-gray-800 tracking-wide text-sm">haventust</span>
        </div>

        <div className="w-full max-w-md">
          <div className="text-left mb-8">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Sign In</h2>
            <p className="text-sm text-gray-400 font-medium mt-2 leading-relaxed">
              Welcome back! Please enter your details to access your account dashboard.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Email */}
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-2">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#f8fafc] text-sm text-gray-800 pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:bg-white focus:border-[#0a56e3] focus:outline-none transition-all duration-200"
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-gray-700 block">Password</label>
                <Link href="/help-support" className="text-xs font-bold text-[#0a56e3] hover:underline">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#f8fafc] text-sm text-gray-800 pl-11 pr-12 py-3 rounded-xl border border-gray-200 focus:bg-white focus:border-[#0a56e3] focus:outline-none transition-all duration-200"
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 bg-[#f8fafc] cursor-pointer"
              />
              <label htmlFor="remember" className="ml-2 text-xs font-semibold text-gray-500 cursor-pointer select-none">
                Keep me signed in for 30 days
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#0a56e3] to-[#042ca3] hover:from-[#0b5be6] hover:to-[#0433a5] text-white font-bold py-3.5 px-4 rounded-xl text-sm transition-all duration-250 transform active:scale-[0.98] shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:pointer-events-none select-none cursor-pointer"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Signing In…</span>
                </>
              ) : (
                <>
                  <span>Sign In to Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Create account */}
          <div className="text-center mt-8 text-xs font-semibold text-gray-500">
            Don&apos;t have an account yet?{" "}
            <Link href="/signup" className="text-[#0a56e3] font-bold hover:underline">
              Create one now
            </Link>
          </div>

          <div className="text-center mt-4">
            <Link href="/admin/login" className="text-[10px] text-gray-400 font-bold hover:text-[#0a56e3] transition-colors">
              Admin Portal →
            </Link>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes slide-in {
          from { transform: translateX(120%); opacity: 0; }
          to   { transform: translateX(0);   opacity: 1; }
        }
        .animate-slide-in { animation: slide-in 0.35s ease; }
      `}</style>
    </div>
  );
}
