"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Camera,
  Gift,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

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
   Profile Picture Uploader
────────────────────────────────────────────────────────────────────────────── */
function ProfilePictureUploader({
  preview,
  onFileChange,
}: {
  preview: string | null;
  onFileChange: (file: File) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileChange(file);
  };

  return (
    <div className="flex flex-col items-center gap-2 mb-2">
      <div
        onClick={handleClick}
        className="relative w-20 h-20 rounded-full cursor-pointer group"
      >
        {preview ? (
          <img
            src={preview}
            alt="Profile preview"
            className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 border-4 border-white shadow-lg flex items-center justify-center">
            <User className="w-8 h-8 text-blue-400" />
          </div>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Camera className="w-5 h-5 text-white" />
        </div>
      </div>
      <button
        type="button"
        onClick={handleClick}
        className="text-xs font-bold text-[#0a56e3] hover:underline flex items-center gap-1"
      >
        <Camera className="w-3 h-3" />
        {preview ? "Change Photo" : "Upload Photo"}
      </button>
      <p className="text-[10px] text-gray-400">JPG, PNG or WEBP · Max 5MB</p>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   Inner Signup Form (needs useSearchParams)
────────────────────────────────────────────────────────────────────────────── */
function SignupForm() {
  const searchParams = useSearchParams();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [referralCode, setReferralCode] = useState(searchParams.get("ref") || "");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Profile picture
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = useCallback(
    (message: string, type: "success" | "error") => setToast({ message, type }),
    []
  );

  const handleFileChange = (file: File) => {
    setProfileFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setProfilePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      showToast("Passwords do not match!", "error");
      return;
    }
    if (password.length < 8) {
      showToast("Password must be at least 8 characters.", "error");
      return;
    }
    if (!referralCode.trim()) {
      showToast("Referral code is required.", "error");
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Register user
      const signupRes = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName,
          email,
          phone,
          password,
          referralCode: referralCode.trim().toUpperCase(),
        }),
      });

      const signupData = await signupRes.json();

      if (!signupRes.ok) {
        showToast(signupData.error || "Signup failed.", "error");
        setIsLoading(false);
        return;
      }

      const { token, user } = signupData;
      const userId = user.id;

      // Step 2: Upload profile picture (if selected)
      let profilePicUrl: string | null = null;
      if (profileFile) {
        const formData = new FormData();
        formData.append("file", profileFile);
        formData.append("userId", userId);

        const uploadRes = await fetch("/api/upload/profile-picture", {
          method: "POST",
          body: formData,
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          profilePicUrl = uploadData.url;
        }
        // Don't block signup if upload fails – profile pic is optional
      }

      // Step 3: Store auth data
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("authToken", token);
      localStorage.setItem(
        "currentUser",
        JSON.stringify({ ...user, profilePicUrl: profilePicUrl || user.profilePicUrl })
      );

      showToast("Account created successfully! Redirecting…", "success");

      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    } catch {
      showToast("Network error. Please check your connection.", "error");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="text-left mb-5">
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Create Account</h2>
        <p className="text-sm text-gray-400 font-medium mt-2 leading-relaxed">
          Get started with your credentials to register your new affiliate console.
        </p>
      </div>

      {/* Profile Picture Upload */}
      <ProfilePictureUploader
        preview={profilePreview}
        onFileChange={handleFileChange}
      />

      {/* Divider */}
      <div className="flex items-center gap-3 my-4">
        <hr className="flex-1 border-gray-100" />
        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
          account details
        </span>
        <hr className="flex-1 border-gray-100" />
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        {/* Full Name */}
        <div>
          <label className="text-xs font-bold text-gray-700 block mb-1.5">Full Name</label>
          <div className="relative">
            <input
              type="text"
              required
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-[#f8fafc] text-sm text-gray-800 pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 focus:bg-white focus:border-[#0a56e3] focus:outline-none transition-all duration-200"
            />
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="text-xs font-bold text-gray-700 block mb-1.5">Email Address</label>
          <div className="relative">
            <input
              type="email"
              required
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#f8fafc] text-sm text-gray-800 pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 focus:bg-white focus:border-[#0a56e3] focus:outline-none transition-all duration-200"
            />
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="text-xs font-bold text-gray-700 block mb-1.5">Phone Number</label>
          <div className="relative">
            <input
              type="tel"
              required
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-[#f8fafc] text-sm text-gray-800 pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 focus:bg-white focus:border-[#0a56e3] focus:outline-none transition-all duration-200"
            />
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        {/* Passwords row */}
        <div className="grid grid-cols-2 gap-3">
          {/* Password */}
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#f8fafc] text-sm text-gray-800 pl-11 pr-10 py-2.5 rounded-xl border border-gray-200 focus:bg-white focus:border-[#0a56e3] focus:outline-none transition-all duration-200"
              />
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5">Confirm</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-[#f8fafc] text-sm text-gray-800 pl-11 pr-10 py-2.5 rounded-xl border border-gray-200 focus:bg-white focus:border-[#0a56e3] focus:outline-none transition-all duration-200"
              />
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Referral Code */}
        <div>
          <label className="text-xs font-bold text-gray-700 block mb-1.5">
            Referral Code <span className="text-red-500 font-bold">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Enter referral code"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              maxLength={8}
              className="w-full bg-[#f8fafc] text-sm text-gray-800 pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 focus:bg-white focus:border-[#0a56e3] focus:outline-none transition-all duration-200 uppercase tracking-widest font-bold"
            />
            <Gift className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            {referralCode && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                Applied
              </span>
            )}
          </div>
        </div>

        {/* Terms */}
        <div className="flex items-start mt-0.5">
          <input
            id="terms"
            type="checkbox"
            required
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 bg-[#f8fafc] cursor-pointer mt-0.5 shrink-0"
          />
          <label
            htmlFor="terms"
            className="ml-2 text-xs font-semibold text-gray-500 cursor-pointer select-none leading-relaxed"
          >
            I agree to the{" "}
            <span className="text-[#0a56e3] hover:underline font-bold">Terms &amp; Conditions</span>{" "}
            and{" "}
            <span className="text-[#0a56e3] hover:underline font-bold">Privacy Policy</span>
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-[#0a56e3] to-[#042ca3] hover:from-[#0b5be6] hover:to-[#0433a5] text-white font-bold py-3 px-4 rounded-xl text-sm transition-all duration-250 transform active:scale-[0.98] shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 mt-1 disabled:opacity-70 disabled:pointer-events-none select-none cursor-pointer"
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
              <span>Creating Account…</span>
            </>
          ) : (
            <>
              <span>Create Free Account</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Sign In footer */}
      <div className="text-center mt-5 text-xs font-semibold text-gray-500">
        Already have an account?{" "}
        <Link href="/login" className="text-[#0a56e3] font-bold hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   Main Page Export
────────────────────────────────────────────────────────────────────────────── */
export default function SignupPage() {
  return (
    <div className="w-full min-h-screen flex select-none bg-[#f8fafc]">
      {/* ── Left Panel ──────────────────────────────────────────────────────── */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-tr from-[#0a56e3] via-[#083ca3] to-[#041a4a] text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-blue-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />

        {/* Brand */}
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

        {/* Content */}
        <div className="relative z-10 my-auto max-w-lg">
          <div className="bg-blue-400/25 text-blue-200 text-xs font-bold px-3 py-1.5 rounded-full w-fit flex items-center gap-1.5 mb-6 border border-white/5 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Setup in less than 2 minutes</span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-black tracking-tight leading-[1.15] mb-6">
            Start Your Investment &amp; Earning Journey
          </h1>
          <p className="text-blue-100 text-base leading-relaxed mb-8">
            Create an account to gain unlimited access to investment plans, setup your affiliate
            digital wallet, and earn active commission metrics.
          </p>

          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-lg">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> What you get with haventust:
            </h3>
            <ul className="flex flex-col gap-3 text-xs text-blue-100 font-medium">
              {[
                "Immediate access to premium Gold &amp; Land investment plans",
                "Automatic affiliate digital wallet creation (no setup required)",
                "Real-time earnings tracking with customized graphical widgets",
                "Direct payout withdrawals directly to your local bank account",
                "Unique referral code to earn commissions on every signup",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-300 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Referral badge */}
          <div className="mt-6 bg-amber-400/15 border border-amber-300/20 rounded-xl p-4 flex items-center gap-3">
            <div className="bg-amber-400/20 p-2 rounded-lg shrink-0">
              <Gift className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-200">Referral Bonus Active</p>
              <p className="text-[10px] text-amber-200/70 mt-0.5">
                Enter a friend&apos;s referral code at signup and both of you earn bonus credits!
              </p>
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
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 py-10 md:px-12 bg-white relative overflow-y-auto">
        {/* Mobile Header */}
        <div className="lg:hidden absolute top-6 left-6 flex items-center gap-2">
          <div className="bg-blue-600 text-white font-black w-8 h-8 rounded-lg flex items-center justify-center text-lg shadow-md">
            H
          </div>
          <span className="font-bold text-gray-800 tracking-wide text-sm">haventust</span>
        </div>

        <Suspense
          fallback={
            <div className="flex items-center justify-center h-40">
              <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          }
        >
          <SignupForm />
        </Suspense>
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
