"use client";

import React, { useState, useEffect, useCallback } from "react";

import {
  Sparkles,
  Layers,
  ArrowRight,
  Upload,
  CheckCircle,
  AlertCircle,
  Clock,
  Coins,
  Map,
  FileText,
  TrendingUp
} from "lucide-react";

interface PackagePurchase {
  _id: string;
  type: "Gold" | "Land";
  amount: number;
  status: "Pending" | "Approved" | "Rejected";
  screenshotUrl: string;
  transactionId: string;
  monthlyReturnRate: number;
  redemptionLimit: number;
  redeemedSoFar: number;
  monthsPaid: number;
  createdAt: string;
  goldPriceAtPurchase?: number;
  goldWeightGrams?: number;
  gstAmount?: number;
  taxableAmount?: number;
  karat?: string;
  city?: string;
}

export default function PackagesPage() {
  const [activeTab, setActiveTab] = useState<"Gold" | "Land">("Gold");
  const [purchases, setPurchases] = useState<PackagePurchase[]>([]);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [goldPrice, setGoldPrice] = useState("");
  const [landPrice, setLandPrice] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [selectedCity, setSelectedCity] = useState("Kolkata");
  const [selectedKarat, setSelectedKarat] = useState("24K");

  // Live gold price data
  const [goldPriceData, setGoldPriceData] = useState<any>({
    Kolkata: { "24K": 7350, "22K": 6740 },
    Mumbai:  { "24K": 7358, "22K": 6747 },
    Delhi:   { "24K": 7372, "22K": 6758 },
    Chennai: { "24K": 7338, "22K": 6729 },
  });
  const [isLiveGold, setIsLiveGold] = useState(false);

  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchLiveGoldPrice = useCallback(async () => {
    try {
      const res = await fetch("/api/gold-price");
      if (res.ok) {
        const data = await res.json();
        if (data.prices) {
          setGoldPriceData(data.prices);
          setIsLiveGold(!!data.isLive);
        }
      }
    } catch { /* silent */ }
  }, []);

  // Load configuration and user's purchases
  useEffect(() => {
    // 1. Fetch QR Code config
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.qrCodeUrl) setQrCodeUrl(data.qrCodeUrl);
      })
      .catch((err) => console.error("Error fetching QR config:", err));

    // 2. Fetch purchases
    fetchPurchases();

    // 3. Fetch live gold price
    fetchLiveGoldPrice();
    const interval = setInterval(fetchLiveGoldPrice, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchLiveGoldPrice]);

  const fetchPurchases = async () => {
    const token = localStorage.getItem("authToken");
    try {
      const res = await fetch("/api/packages", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPurchases(data.purchases || []);
      }
    } catch (err) {
      console.error("Error fetching purchases:", err);
    }
  };

  // Derived: current live price for selected city+karat
  const currentGoldPricePerGram: number =
    (goldPriceData[selectedCity]?.[selectedKarat]) ?? 7350;

  // Derived: estimated grams for purchase amount (ex GST)
  const purchaseAmountNum = Number(activeTab === "Gold" ? goldPrice : landPrice);
  const estimatedTaxable = purchaseAmountNum > 0 ? purchaseAmountNum / 1.03 : 0;
  const estimatedGoldGrams = estimatedTaxable > 0 ? estimatedTaxable / currentGoldPricePerGram : 0;
  const estimatedGST = purchaseAmountNum - estimatedTaxable;

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

  const handlePurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const purchaseAmount = activeTab === "Gold" ? Number(goldPrice) : Number(landPrice);
    const minAmount = activeTab === "Gold" ? 10000 : 100000;

    if (!purchaseAmount || purchaseAmount < minAmount) {
      setErrorMsg(`Minimum amount for ${activeTab} package is ₹${minAmount.toLocaleString("en-IN")}.`);
      return;
    }
    if (!screenshotFile) {
      setErrorMsg("Please upload your payment screenshot proof.");
      return;
    }
    if (!transactionId.trim()) {
      setErrorMsg("Please enter your transaction ID.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Upload screenshot to AWS S3
      const formData = new FormData();
      formData.append("file", screenshotFile);
      formData.append("folder", "packages");

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to upload screenshot to S3.");
      }

      const uploadData = await uploadRes.json();
      const screenshotUrl = uploadData.url;

      // 2. Submit package booking to server
      const token = localStorage.getItem("authToken");
      const submitRes = await fetch("/api/packages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: activeTab,
          amount: purchaseAmount,
          screenshotUrl,
          transactionId: transactionId.trim(),
          goldPrice: currentGoldPricePerGram,
          karat: selectedKarat,
          city: selectedCity,
        }),
      });

      const submitData = await submitRes.json();
      if (!submitRes.ok) {
        throw new Error(submitData.error || "Failed to submit package purchase.");
      }

      setSuccessMsg(submitData.message || "Purchase submitted successfully! Admin will verify soon.");
      setGoldPrice("");
      setLandPrice("");
      setTransactionId("");
      setScreenshotFile(null);
      setScreenshotPreview(null);
      fetchPurchases();
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#f3f7fd] p-4 md:p-8 select-none">
        {/* Header Title */}
        <div className="mb-6 text-left">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-yellow-500 fill-yellow-500/20" />
            <span>Investment Packages</span>
          </h1>
          <p className="text-xs text-gray-500 font-semibold mt-1">
            After activation, you can buy packages of Gold Jewelry or Land Booking to start earning monthly returns.
          </p>
        </div>

        {/* Outer Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Purchase Forms Tab (Left Side, 2 Columns on desktop) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Tabs Selector */}
            <div className="bg-white border border-gray-100 rounded-2xl p-1.5 shadow-sm flex items-center gap-1.5">
              <button
                onClick={() => {
                  setActiveTab("Gold");
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === "Gold"
                    ? "bg-[#0b5be6] text-white shadow-md shadow-blue-500/10"
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                }`}
              >
                <Coins className="w-4 h-4" />
                <span>Gold Jewelry Package</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab("Land");
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === "Land"
                    ? "bg-[#0b5be6] text-white shadow-md shadow-blue-500/10"
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                }`}
              >
                <Map className="w-4 h-4" />
                <span>Land Booking Package</span>
              </button>
            </div>

            {/* Selected Tab Form Panel */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm text-left">
              <h3 className="text-sm font-extrabold text-gray-900 mb-2">
                Configure Your {activeTab} Investment
              </h3>
              <p className="text-xs text-gray-400 font-medium mb-6">
                {activeTab === "Gold"
                  ? "Gold investments start at ₹10,000. Earn up to 2.5% to 3.5% monthly payouts until total returns reach 60% of purchase value."
                  : "Land booking deposits start at ₹1,00,000. Earn 4% to 6% monthly payouts for 6 months (reaching 24% to 36% total returns)."}
              </p>

              {/* Status Banner */}
              {errorMsg && (
                <div className="bg-red-50 border border-red-100 text-red-500 p-3 rounded-2xl text-[11px] font-bold flex items-center gap-2 mb-4 animate-fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
              {successMsg && (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 p-3 rounded-2xl text-[11px] font-bold flex items-center gap-2 mb-4 animate-fade-in">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handlePurchaseSubmit} className="flex flex-col gap-5">

                {/* Gold: live price bar */}
                {activeTab === "Gold" && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-amber-600" />
                      <div>
                        <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Current {selectedKarat} Rate — {selectedCity}</p>
                        <p className="text-lg font-black text-amber-800">
                          ₹{currentGoldPricePerGram.toLocaleString("en-IN")}
                          <span className="text-[10px] font-semibold text-amber-500 ml-1">/gram</span>
                        </p>
                      </div>
                    </div>
                    <span className={`text-[9px] font-black px-2 py-1 rounded-full border ${isLiveGold ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-amber-100 text-amber-600 border-amber-200"}`}>
                      {isLiveGold ? "● GoldAPI Live" : "Simulated"}
                    </span>
                  </div>
                )}

                {/* City + Karat selectors (Gold only) */}
                {activeTab === "Gold" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 block uppercase tracking-wider mb-2">Your City</label>
                      <select
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                        className="w-full bg-[#f8fafc] text-gray-800 text-xs font-bold p-3 rounded-xl border border-gray-200 focus:border-[#0b5be6] focus:outline-none cursor-pointer"
                      >
                        {["Kolkata", "Mumbai", "Delhi", "Chennai"].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 block uppercase tracking-wider mb-2">Gold Purity</label>
                      <select
                        value={selectedKarat}
                        onChange={(e) => setSelectedKarat(e.target.value)}
                        className="w-full bg-[#f8fafc] text-gray-800 text-xs font-bold p-3 rounded-xl border border-gray-200 focus:border-[#0b5be6] focus:outline-none cursor-pointer"
                      >
                        {["24K", "22K"].map(k => (
                          <option key={k} value={k}>{k} Gold</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Investment Input */}
                <div>
                  <label className="text-[10px] font-bold text-gray-400 block uppercase tracking-wider mb-2">
                    Purchase Value / Investment Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={activeTab === "Gold" ? goldPrice : landPrice}
                    onChange={(e) =>
                      activeTab === "Gold" ? setGoldPrice(e.target.value) : setLandPrice(e.target.value)
                    }
                    placeholder={activeTab === "Gold" ? "Minimum ₹10,000" : "Minimum ₹1,00,000"}
                    className="w-full bg-[#f8fafc] text-gray-800 text-xs font-bold p-3.5 rounded-xl border border-gray-200 focus:border-[#0b5be6] focus:outline-none"
                    required
                  />
                </div>

                {/* Gold weight + GST estimate (Gold only) */}
                {activeTab === "Gold" && purchaseAmountNum >= 10000 && (
                  <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-4 text-left">
                    <h4 className="text-[10px] font-black text-amber-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5" /> Gold Weight &amp; GST Estimate
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-white/70 rounded-xl p-2.5 text-center">
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wide">Taxable Value</p>
                        <p className="text-xs font-black text-gray-800 mt-0.5">₹{estimatedTaxable.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</p>
                      </div>
                      <div className="bg-white/70 rounded-xl p-2.5 text-center">
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wide">GST (3%)</p>
                        <p className="text-xs font-black text-orange-600 mt-0.5">₹{estimatedGST.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</p>
                      </div>
                      <div className="bg-amber-500 rounded-xl p-2.5 text-center">
                        <p className="text-[9px] text-white/80 font-bold uppercase tracking-wide">{selectedKarat} Weight</p>
                        <p className="text-xs font-black text-white mt-0.5">~{estimatedGoldGrams.toFixed(3)}g</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Return rates summary block */}
                <div className="bg-[#f8fafc] border border-gray-150 rounded-2xl p-4">
                  <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2.5">
                    Estimated Benefit Schedule
                  </h4>
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400 font-semibold">Monthly Return Rate:</span>
                      <span className="text-gray-800 font-bold">
                        {activeTab === "Gold" ? "2.5% to 3.5%" : "4% to 6%"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400 font-semibold">Total Payout Limit:</span>
                      <span className="text-[#0b5be6] font-black">
                        {activeTab === "Gold" ? "60% of purchase value" : "24% to 36% of value"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Upload Payment proof & UPI transaction ID */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Upload box */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 block uppercase tracking-wider mb-2">
                      Upload Payment Receipt
                    </label>
                    <label className="border border-dashed border-gray-300 hover:border-[#0b5be6] hover:bg-blue-50/50 bg-[#f8fafc] rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all h-28 relative overflow-hidden group select-none">
                      {screenshotPreview ? (
                        <img
                          src={screenshotPreview}
                          alt="Screenshot Preview"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <>
                          <Upload className="w-6 h-6 text-gray-400 group-hover:text-[#0b5be6] group-hover:scale-105 transition-transform mb-1.5" />
                          <span className="text-[10px] text-gray-500 font-extrabold text-center">
                            Upload Receipt (Max 5MB)
                          </span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Transaction ID */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 block uppercase tracking-wider mb-2">
                      UPI Transaction ID / Ref No
                    </label>
                    <input
                      type="text"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="Enter 12-digit transaction ID"
                      className="w-full bg-[#f8fafc] text-gray-800 text-xs font-bold p-3.5 rounded-xl border border-gray-200 focus:border-[#0b5be6] focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-4 bg-gradient-to-r from-[#0c5ae5] via-[#094fc6] to-[#04287a] text-white hover:opacity-95 font-bold py-3.5 rounded-2xl text-xs active:scale-[0.98] transition-transform cursor-pointer shadow-md shadow-blue-500/10 flex items-center justify-center gap-1.5"
                >
                  <span>{isSubmitting ? "Submitting Request..." : "Book Investment Package"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>

          {/* Payment QR Code display card (Right Side, 1 Column on desktop) */}
          <div className="flex flex-col gap-6">
            <div className="bg-gradient-to-b from-[#0c4cc6] to-[#04287a] text-white rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col items-center text-center">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
              <div className="mb-4">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-100">Scan &amp; Book Tiers</span>
              </div>
              <h3 className="text-lg font-black tracking-tight leading-tight mb-2">
                Haventist Company QR Code
              </h3>
              <p className="text-xs text-blue-100 leading-relaxed mb-6 max-w-xs">
                Scan the QR code below via Google Pay, PhonePe, Paytm, etc., to pay your investment package amount.
              </p>

              {/* QR Image Box */}
              <div className="bg-white p-3.5 rounded-3xl w-48 h-48 flex items-center justify-center shadow-2xl relative border border-white/10 aspect-square mb-6 overflow-hidden">
                {qrCodeUrl ? (
                  <img
                    src={qrCodeUrl}
                    alt="Company Payment QR"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <Clock className="w-10 h-10 animate-pulse text-blue-500 mb-1" />
                    <span className="text-[8px] font-black uppercase tracking-wider">Loading Company QR...</span>
                  </div>
                )}
              </div>

              <div className="bg-white/10 rounded-2xl px-4 py-2 border border-white/10 text-xs font-bold text-yellow-300">
                Instantly Active on Manual Audit
              </div>
            </div>
          </div>
        </div>

        {/* Purchases history list */}
        <div className="mt-8 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm text-left">
          <h3 className="text-sm font-extrabold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-500" />
            <span>Your Package Investments</span>
          </h3>

          {purchases.length === 0 ? (
            <div className="py-10 text-center flex flex-col items-center justify-center">
              <Clock className="w-10 h-10 text-gray-300 mb-2 animate-bounce" />
              <p className="text-xs text-gray-400 font-bold">No investments booked yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase text-[9px] tracking-wider">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Package</th>
                    <th className="py-3 px-4 text-right">Investment (₹)</th>
                    <th className="py-3 px-4 text-center">Return Rate</th>
                    <th className="py-3 px-4 text-center">Payouts Made</th>
                    <th className="py-3 px-4 text-right">Redeemed (₹)</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-gray-800 font-semibold">
                  {purchases.map((p) => {
                    const limit = p.redemptionLimit * p.amount;
                    return (
                      <tr key={p._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3.5 px-4 font-medium text-gray-400">
                          {new Date(p.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric"
                          })}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-block px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${
                            p.type === "Gold" ? "bg-yellow-50 text-yellow-600 border border-yellow-100" : "bg-blue-50 text-blue-600 border border-blue-100"
                          }`}>
                            {p.type} Package
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-gray-900">
                          ₹{p.amount.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3.5 px-4 text-center text-[#0b5be6] font-extrabold">
                          {(p.monthlyReturnRate * 100).toFixed(1)}% / mo
                        </td>
                        <td className="py-3.5 px-4 text-center text-gray-500 font-bold">
                          {p.monthsPaid} months
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-emerald-600">
                          ₹{p.redeemedSoFar.toLocaleString("en-IN")} / ₹{limit.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                            p.status === "Approved"
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                              : p.status === "Rejected"
                              ? "bg-red-50 text-red-500 border border-red-100"
                              : "bg-amber-50 text-amber-600 border border-amber-100 animate-pulse"
                          }`}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
    </div>
  );
}
