"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  QrCode,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileText,
  LogOut,
  RefreshCw,
  Clock,
  Sparkles,
  CreditCard,
} from "lucide-react";

interface ActivationPageProps {
  user: any;
  onRefreshProfile: () => void;
}

export default function ActivationPage({ user, onRefreshProfile }: ActivationPageProps) {
  const router = useRouter();
  
  // Settings state
  const [price, setPrice] = useState("500");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  
  // Form state
  const [transactionId, setTransactionId] = useState("");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  
  // UI states
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showWelcomePopup, setShowWelcomePopup] = useState(!user?.paymentScreenshotUrl);

  // Load activation settings
  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.activationPrice) setPrice(data.activationPrice);
        if (data.qrCodeUrl) setQrCodeUrl(data.qrCodeUrl);
      })
      .catch((err) => console.error("Error loading activation settings:", err));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      setErrorMsg("Only image files are allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("File size must be under 5MB.");
      return;
    }

    setErrorMsg("");
    setScreenshotFile(file);
    setScreenshotPreview(URL.createObjectURL(file));
  };

  const handleLogout = () => {
    localStorage.setItem("isAuthenticated", "false");
    localStorage.removeItem("authToken");
    localStorage.removeItem("currentUser");
    router.push("/login");
  };

  const handleStatusCheck = async () => {
    setIsCheckingStatus(true);
    try {
      await onRefreshProfile();
    } catch {
      // ignore
    } finally {
      setTimeout(() => setIsCheckingStatus(false), 800);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!screenshotFile) {
      setErrorMsg("Please upload your payment screenshot.");
      return;
    }
    if (!transactionId.trim()) {
      setErrorMsg("Please enter your transaction ID.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Upload screenshot to S3
      const formData = new FormData();
      formData.append("file", screenshotFile);
      formData.append("folder", "payments");

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const uploadData = await uploadRes.json();
        throw new Error(uploadData.error || "Failed to upload screenshot.");
      }

      const { url: screenshotUrl } = await uploadRes.json();

      // 2. Submit payment details
      const token = localStorage.getItem("authToken");
      const submitRes = await fetch("/api/user/submit-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          screenshotUrl,
          transactionId: transactionId.trim(),
        }),
      });

      if (!submitRes.ok) {
        const submitData = await submitRes.json();
        throw new Error(submitData.error || "Failed to submit payment details.");
      }

      setSuccessMsg("Payment details submitted successfully!");
      onRefreshProfile();
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = async () => {
    // Clear dynamic states to show the payment form again
    setErrorMsg("");
    setSuccessMsg("");
    setTransactionId("");
    setScreenshotFile(null);
    setScreenshotPreview(null);
    
    // We send a request to admin users PATCH to reset payment info
    // But since users can do it locally in the form, we can just reset user local state 
    // or let them edit and resubmit
  };

  const isPendingReview = !!user?.paymentScreenshotUrl;

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-4 sm:p-6 md:p-10 select-none">
      <div className="w-full max-w-4xl bg-white border border-gray-100 shadow-xl rounded-[32px] overflow-hidden flex flex-col md:flex-row relative">
        {/* Glow Effects */}
        <div className="absolute -left-16 -top-16 w-48 h-48 bg-[#0b5be6]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -right-16 -bottom-16 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Left Side: Scan & Instructions (Blue Gradient) */}
        <div className="md:w-1/2 bg-gradient-to-br from-[#0c5ae5] via-[#094fc6] to-[#04287a] p-6 sm:p-8 text-white flex flex-col justify-between items-center relative">
          <div className="w-full text-center md:text-left z-10">
            <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/15 mb-4 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-100">Haventist Activation</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight leading-tight mb-2">
              Activate Your Account
            </h2>
            <p className="text-xs text-blue-100 font-medium leading-relaxed max-w-sm mx-auto md:mx-0">
              Your account has been registered successfully. Scan the QR code, pay the activation fee, and submit proof to start earning.
            </p>
          </div>

          {/* QR Container */}
          <div className="my-6 p-4 bg-white/5 backdrop-blur-sm border border-white/15 rounded-3xl flex flex-col items-center shadow-2xl relative w-64 z-10 transition-all hover:scale-[1.02]">
            <div className="bg-white p-3 rounded-2xl shadow-inner w-full flex items-center justify-center aspect-square overflow-hidden relative border border-gray-100">
              {qrCodeUrl && qrCodeUrl !== "/avatar.png" ? (
                <img
                  src={qrCodeUrl}
                  alt="Payment QR Code"
                  className="w-full h-full object-contain"
                />
              ) : (
                <QrCode className="w-24 h-24 text-blue-500 animate-pulse" />
              )}
            </div>
            <div className="text-center mt-4">
              <span className="text-[9px] text-blue-200 font-bold uppercase tracking-wider block">Activation Pricing</span>
              <span className="text-2xl font-black text-yellow-300 tracking-tight block mt-0.5">
                ₹{Number(price).toLocaleString("en-IN")}.00
              </span>
            </div>
          </div>

          <div className="w-full text-center z-10">
            <span className="text-[10px] text-blue-200 font-medium">Scan QR with Google Pay, PhonePe, Paytm, etc.</span>
          </div>
        </div>

        {/* Right Side: Form / Status Review */}
        <div className="md:w-1/2 p-6 sm:p-8 flex flex-col justify-between relative z-10 bg-white">
          
          {/* Status Message Display */}
          {(errorMsg || successMsg) && (
            <div className={`mb-6 p-4 rounded-2xl border text-xs font-semibold flex items-start gap-2.5 ${
              errorMsg ? "bg-red-50 text-red-600 border-red-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
            }`}>
              {errorMsg ? (
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              )}
              <span>{errorMsg || successMsg}</span>
            </div>
          )}

          {isPendingReview ? (
            /* CASE A: Verification in Progress */
            <div className="flex-1 flex flex-col justify-center text-center items-center py-6">
              <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-500 border border-amber-100 flex items-center justify-center mb-4 relative shadow-inner animate-pulse">
                <Clock className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-gray-900 tracking-tight">Verification in Progress</h3>
              <p className="text-xs text-gray-400 font-medium leading-relaxed max-w-xs mt-2">
                Your payment screenshot and transaction ID have been submitted. Our admin team is checking the details.
              </p>

              <div className="w-full mt-6 bg-[#f8fafc] rounded-2xl border border-gray-100 p-4 text-left flex flex-col gap-2">
                <div>
                  <span className="text-[9px] text-gray-400 font-bold block uppercase tracking-wider">Transaction ID</span>
                  <span className="text-xs font-bold text-gray-800 tracking-wider block mt-0.5">{user.paymentTransactionId}</span>
                </div>
                <div>
                  <span className="text-[9px] text-gray-400 font-bold block uppercase tracking-wider">Submitted On</span>
                  <span className="text-xs font-bold text-gray-800 block mt-0.5">
                    {user.paymentSubmittedAt ? new Date(user.paymentSubmittedAt).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }) : "Just now"}
                  </span>
                </div>
                {user.paymentScreenshotUrl && (
                  <div>
                    <span className="text-[9px] text-gray-400 font-bold block uppercase tracking-wider mb-1.5">Submitted Screenshot</span>
                    <a
                      href={user.paymentScreenshotUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                    >
                      <img
                        src={user.paymentScreenshotUrl}
                        alt="Submitted Payment Proof"
                        className="max-h-24 object-cover object-center"
                      />
                    </a>
                  </div>
                )}
              </div>

              <div className="flex gap-3 w-full mt-8">
                <button
                  onClick={handleReset}
                  className="flex-1 bg-gray-50 border border-gray-100 hover:bg-gray-100 hover:border-gray-200 text-gray-600 font-bold text-xs py-3 rounded-xl transition-all cursor-pointer active:scale-95 text-center"
                >
                  Edit / Resubmit
                </button>
                <button
                  onClick={handleStatusCheck}
                  disabled={isCheckingStatus}
                  className="flex-1 bg-gradient-to-r from-[#0c5ae5] to-[#094fc6] text-white hover:opacity-95 font-bold text-xs py-3 rounded-xl transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCheckingStatus ? "animate-spin" : ""}`} />
                  Check Status
                </button>
              </div>
            </div>
          ) : (
            /* CASE B: Submission Form */
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-center">
              <h3 className="text-base font-extrabold text-gray-900 tracking-tight mb-4 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-[#0b5be6]" /> Submission Details
              </h3>
              
              <div className="flex flex-col gap-4">
                {/* Upload Section */}
                <div>
                  <label className="text-[10px] font-bold text-gray-500 block uppercase tracking-wider mb-2">Payment Screenshot Proof</label>
                  
                  {screenshotPreview ? (
                    <div className="relative border border-dashed border-gray-200 rounded-2xl p-2.5 bg-[#f8fafc] flex items-center justify-between gap-3 shadow-inner">
                      <img src={screenshotPreview} alt="Screenshot Preview" className="w-16 h-16 rounded-xl object-cover border border-gray-100" />
                      <div className="flex-1 text-left min-w-0">
                        <span className="text-xs font-bold text-gray-700 block truncate">{screenshotFile?.name}</span>
                        <span className="text-[10px] text-gray-400 block mt-0.5">{( (screenshotFile?.size ?? 0) / (1024 * 1024) ).toFixed(2)} MB</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setScreenshotFile(null); setScreenshotPreview(null); }}
                        className="bg-red-50 hover:bg-red-100 text-red-500 font-bold text-[10px] px-2.5 py-1.5 rounded-lg active:scale-90 transition-transform cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-gray-200 hover:border-[#0b5be6] hover:bg-blue-50/20 rounded-2xl py-6 px-4 flex flex-col items-center justify-center cursor-pointer transition-all active:scale-[0.99] group shadow-inner">
                      <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                      <UploadCloud className="w-8 h-8 text-gray-400 group-hover:text-[#0b5be6] group-hover:scale-105 transition-all mb-2" />
                      <span className="text-xs font-bold text-gray-700 group-hover:text-[#0b5be6] transition-colors block">Upload Payment Screenshot</span>
                      <span className="text-[9px] text-gray-400 mt-1 block">JPG, PNG, WEBP up to 5MB</span>
                    </label>
                  )}
                </div>

                {/* Transaction ID */}
                <div>
                  <label className="text-[10px] font-bold text-gray-500 block uppercase tracking-wider mb-2">UPI Transaction ID / Ref No.</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. 617839485728 or UPI Ref No."
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      className="w-full bg-[#f8fafc] text-gray-800 text-xs font-bold px-4 py-3.5 rounded-2xl border border-gray-150 focus:border-[#0b5be6] focus:bg-white focus:outline-none transition-all shadow-inner"
                    />
                    <FileText className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-4 bg-gradient-to-r from-[#0c5ae5] via-[#094fc6] to-[#04287a] text-white hover:opacity-95 font-bold py-3.5 rounded-2xl text-xs active:scale-[0.98] transition-transform cursor-pointer shadow-md shadow-blue-500/10 flex items-center justify-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span>Submitting Details…</span>
                    </>
                  ) : (
                    <span>Submit Payment Details</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Footer logout button */}
          <div className="mt-8 pt-4 border-t border-gray-50 flex justify-center">
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 hover:text-red-500 active:scale-95 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out Account</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Welcome Activation ID Popup ── */}
      {showWelcomePopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-[32px] p-6 sm:p-8 w-full max-w-md border border-gray-100 shadow-2xl relative text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-blue-50 text-[#0b5be6] border border-blue-100 flex items-center justify-center mb-4 shadow-inner relative animate-bounce">
              <Sparkles className="w-8 h-8" />
            </div>
            
            <h3 className="text-lg font-black text-gray-900 tracking-tight">Activate Your Account First</h3>
            <p className="text-xs text-gray-500 font-medium leading-relaxed mt-2.5 max-w-xs">
              Welcome to Haventist! To start earning, refer members, and unlock your dashboard overview, you must first activate your ID.
            </p>

            <div className="w-full mt-5 bg-[#f8fafc] rounded-2xl border border-gray-150 p-4 text-left flex flex-col gap-3">
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">1</div>
                <p className="text-[11px] font-bold text-gray-700">Scan the QR code and pay the activation charge of ₹{Number(price).toLocaleString("en-IN")}.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">2</div>
                <p className="text-[11px] font-bold text-gray-700">Upload your payment screenshot and enter the UPI Transaction ID.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">3</div>
                <p className="text-[11px] font-bold text-gray-700">Wait for admin manual approval to unlock access instantly.</p>
              </div>
            </div>

            <button
              onClick={() => setShowWelcomePopup(false)}
              className="w-full mt-6 bg-gradient-to-r from-[#0c5ae5] via-[#094fc6] to-[#04287a] text-white hover:opacity-95 font-bold py-3.5 rounded-2xl text-xs active:scale-[0.98] transition-transform cursor-pointer shadow-md shadow-blue-500/10 flex items-center justify-center gap-1.5"
            >
              <span>Proceed to Activation</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
