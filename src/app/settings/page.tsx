"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  MoreHorizontal,
  Camera,
  Mail,
  Phone,
  Calendar,
  Pencil,
  Wallet,
  Users,
  TrendingUp,
  Award,
  ChevronRight,
  User,
  MapPin,
  Globe,
  Key,
  ShieldCheck,
  Trash2,
  Lock,
  RefreshCw,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  referralCode: string;
  referredBy: string | null;
  profilePicUrl: string | null;
  walletBalance: number;
  status: string;
  referrals: number;
  teamSalesVolume: number;
  dob: string;
  address: string;
  joinedAt: string;
}

export default function ProfileSettingsPage() {
  const [twoFactorActive, setTwoFactorActive] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // User details state for editing
  const [fullName, setFullName] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [dob, setDob] = useState("");
  const [address, setAddress] = useState("");
  const [profilePicUrl, setProfilePicUrl] = useState("/avatar.png");
  const [stats, setStats] = useState({
    walletBalance: 0,
    referrals: 0,
    teamSalesVolume: 0,
    status: "PendingActivation",
    joinedAt: "",
    referralCode: "",
  });

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [approvedPurchases, setApprovedPurchases] = useState<any[]>([]);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      const res = await fetch("/api/user/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const u = data.user as UserProfile;
        setFullName(u.name || "");
        setEmailAddress(u.email || "");
        setPhoneNumber(u.phone || "");
        setDob(u.dob || "");
        setAddress(u.address || "");
        setProfilePicUrl(u.profilePicUrl || "/avatar.png");
        setStats({
          walletBalance: u.walletBalance || 0,
          referrals: u.referrals || 0,
          teamSalesVolume: u.teamSalesVolume || 0,
          status: u.status || "PendingActivation",
          joinedAt: u.joinedAt || "",
          referralCode: u.referralCode || "",
        });
      }

      // Fetch package invoices
      const pkgRes = await fetch("/api/packages", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (pkgRes.ok) {
        const pkgData = await pkgRes.json();
        const approved = (pkgData.purchases || []).filter((p: any) => p.status === "Approved");
        setApprovedPurchases(approved);
      }
    } catch {
      showToast("Failed to load profile.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const printInvoice = (pkg: any) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const rate = pkg.goldPriceAtPurchase || 7350;
    const taxable = pkg.taxableAmount || Number((pkg.amount / 1.18).toFixed(2));
    const gst = pkg.gstAmount || Number((pkg.amount - taxable).toFixed(2));
    const weight = pkg.goldWeightGrams || Number((taxable / rate).toFixed(3));
    const karat = pkg.karat || "24K";
    const city = pkg.city || "Kolkata";
    const dateStr = new Date(pkg.createdAt).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice - ${pkg.transactionId}</title>
          <style>
            body { font-family: 'Segoe UI', system-ui, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; background: #f8fafc; }
            .invoice-box { max-width: 800px; margin: auto; border: 1px solid #e2e8f0; background: #ffffff; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05); padding: 40px; border-radius: 16px; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #f1f5f9; padding-bottom: 24px; margin-bottom: 24px; }
            .logo { font-size: 24px; font-weight: 900; color: #0b5be6; tracking-tight }
            .title { text-align: right; font-size: 18px; font-weight: 800; color: #475569; }
            .details-table { width: 100%; border-collapse: collapse; margin-top: 30px; }
            .details-table th, .details-table td { padding: 14px; text-align: left; border-bottom: 1px solid #f1f5f9; }
            .details-table th { background: #f8fafc; font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 800; letter-spacing: 0.05em; }
            .details-table td { font-size: 13px; font-weight: 600; color: #334155; }
            .summary-box { margin-top: 30px; display: flex; justify-content: flex-end; }
            .summary-table { width: 320px; border-collapse: collapse; }
            .summary-table td { padding: 8px 12px; font-size: 13px; font-weight: 600; color: #475569; }
            .summary-table .total { font-size: 16px; font-weight: 800; color: #0b5be6; border-top: 2px solid #e2e8f0; padding-top: 12px; }
            .footer { text-align: center; margin-top: 50px; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 24px; }
          </style>
        </head>
        <body>
          <div class="invoice-box">
            <div class="header">
              <div>
                <div class="logo">HAVENTUST LTD.</div>
                <p style="font-size: 11px; color: #64748b; margin: 4px 0 0 0;">Kolkata Head Office, West Bengal, India</p>
                <p style="font-size: 11px; color: #64748b; margin: 2px 0 0 0;">GSTIN: 19AAACH1234F1Z5</p>
              </div>
              <div class="title">
                TAX INVOICE
                <p style="font-size: 11px; color: #64748b; margin: 4px 0 0 0;">Invoice: INV-${pkg._id.slice(-6).toUpperCase()}</p>
                <p style="font-size: 11px; color: #64748b; margin: 2px 0 0 0;">Date: ${dateStr}</p>
              </div>
            </div>
            
            <div style="margin-bottom: 30px; font-size: 13px; color: #334155; line-height: 1.6;">
              <strong style="color: #64748b; font-size: 11px; text-transform: uppercase;">Customer Details:</strong><br/>
              <span style="font-weight: 700; font-size: 14px; color: #1e293b;">${fullName}</span><br/>
              Email: ${emailAddress}<br/>
              Phone: ${phoneNumber}<br/>
              Address: ${address || "Address Not Configured"}
            </div>

            <table class="details-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Karat / Rate</th>
                  <th>City Hub</th>
                  <th>Qty / Weight</th>
                  <th style="text-align: right;">Taxable Val</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>${pkg.type === "Gold" ? "Gold Purchase Return Benefits Plan" : "Land Purchase Return Benefits Plan"}</td>
                  <td>${pkg.type === "Gold" ? `${karat} @ ₹${rate}/g` : "Booking Option"}</td>
                  <td>${pkg.type === "Gold" ? city : "N/A"}</td>
                  <td>${pkg.type === "Gold" ? `${weight}g` : "1 Unit"}</td>
                  <td style="text-align: right;">₹${taxable.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </table>

            <div class="summary-box">
              <table class="summary-table">
                <tr>
                  <td>Taxable Value:</td>
                  <td style="text-align: right;">₹${taxable.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                  <td>CGST (1.5%):</td>
                  <td style="text-align: right;">₹${(gst / 2).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                  <td>SGST (1.5%):</td>
                  <td style="text-align: right;">₹${(gst / 2).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr class="total">
                  <td>Total Price (GST Incl.):</td>
                  <td style="text-align: right;">₹${pkg.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                </tr>
              </table>
            </div>

            <div style="margin-top: 40px; border: 1px solid #cbd5e1; border-radius: 12px; padding: 16px; font-size: 12px; background: #f8fafc; color: #475569; line-height: 1.6;">
              <strong>Transaction Reference Details:</strong><br/>
              Reference TXID: ${pkg.transactionId}<br/>
              Verification: Approved by Administration<br/>
              Payment Status: Fully Realized
            </div>

            <div class="footer">
              This invoice is electronically generated and requires no physical signature.<br/>
              Thank you for choose Haventust.
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: fullName,
          phone: phoneNumber,
          dob,
          address,
          profilePicUrl,
        }),
      });

      if (res.ok) {
        showToast("Profile details updated successfully!", "success");
        setIsEditing(false);
        fetchProfile();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to update profile.", "error");
      }
    } catch {
      showToast("Network error saving profile.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(false);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "avatars");

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const d = await res.json();
        setProfilePicUrl(d.url);
        // Automatically save the picture URL to profile
        const token = localStorage.getItem("authToken");
        if (token) {
          await fetch("/api/user/profile", {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ profilePicUrl: d.url }),
          });
        }
        showToast("Avatar image uploaded and updated!", "success");
      } else {
        showToast("Failed to upload image.", "error");
      }
    } catch {
      showToast("Upload network error.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const memberSinceStr = stats.joinedAt
    ? new Date(stats.joinedAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f3f7fd]">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <RefreshCw className="animate-spin h-8 w-8 text-[#0b5be6]" />
          <span className="text-xs font-bold uppercase tracking-wider">Loading Profile…</span>
        </div>
      </div>
    );
  }

  const personalInfoList = [
    { label: "Full Name", value: fullName, icon: User, color: "text-blue-500", bgColor: "bg-blue-50" },
    { label: "Email Address", value: emailAddress, icon: Mail, color: "text-orange-500", bgColor: "bg-orange-50" },
    { label: "Mobile Number", value: phoneNumber, icon: Phone, color: "text-emerald-500", bgColor: "bg-emerald-50" },
    { label: "Date of Birth", value: dob || "Not Set", icon: Calendar, color: "text-purple-500", bgColor: "bg-purple-50" },
    { label: "Address", value: address || "Not Set", icon: MapPin, color: "text-indigo-500", bgColor: "bg-indigo-50" }
  ];

  return (
    <div className="w-full min-h-screen bg-[#f3f7fd] select-none pb-24 lg:pb-8">
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-semibold max-w-sm animate-slide-in ${
          toast.type === "success" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-600 border-red-200"
        }`}>
          {toast.type === "success" ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MOBILE LAYOUT (<lg viewports) */}
      {/* ========================================================================= */}
      <div className="block lg:hidden">
        
        {/* Blue Header Section */}
        <div className="bg-gradient-to-b from-[#0b5be6] to-[#073ca2] rounded-b-[40px] px-4 pt-14 pb-8 shadow-lg shadow-blue-500/10 text-white relative">
          <div className="flex items-center justify-between mb-6">
            <Link href="/users/dashboard" className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white active:scale-95 transition-transform">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-bold tracking-wide">Profile Settings</h1>
            <div className="w-10 h-10" />
          </div>

          {/* User Profile Card */}
          <div className="bg-white rounded-[32px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100/50 text-gray-800 relative mt-4">
            <div className="flex items-center gap-4">
              {/* Profile Avatar with Camera icon */}
              <div className="relative">
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-[3.5px] border-blue-100 shadow-inner bg-slate-100">
                  <img src={profilePicUrl} alt={fullName} className="w-full h-full object-cover" />
                </div>
                <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center border-2 border-white shadow-md active:scale-90 transition-transform cursor-pointer">
                  <Camera className="w-4.5 h-4.5" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                </label>
              </div>

              {/* Profile Meta info */}
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-lg font-black text-gray-900 tracking-tight truncate max-w-[130px]">{fullName}</h2>
                  {stats.status === "Active" && (
                    <span className="w-4.5 h-4.5 rounded-full bg-amber-400 text-white flex items-center justify-center font-bold text-[9px] shadow-sm border border-amber-300">✓</span>
                  )}
                </div>
                
                <span className={`inline-block text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider mt-1.5 border ${
                  stats.status === "Active" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-500 border-amber-100"
                }`}>
                  {stats.status}
                </span>

                <div className="flex flex-col gap-1 mt-2.5 text-[10px] text-gray-400 font-medium">
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3 h-3 text-blue-500" />
                    <span className="truncate max-w-[140px]">{emailAddress}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-emerald-500" />
                    <span>{phoneNumber}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Strip Quick Grid */}
        <div className="px-4 -mt-4 z-20 relative">
          <div className="bg-white rounded-[28px] p-4 shadow-md border border-gray-100 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
            
            <Link href="/wallet" className="flex flex-col items-start p-2.5 rounded-2xl bg-slate-50 border border-gray-50 flex-1 min-w-[90px] relative">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl mb-2"><Wallet className="w-4 h-4" /></div>
              <span className="text-[9px] font-bold text-gray-400 block uppercase leading-none">Wallet</span>
              <span className="text-xs font-black text-gray-900 mt-1 block">₹{stats.walletBalance.toLocaleString("en-IN")}</span>
            </Link>

            <Link href="/my-team" className="flex flex-col items-start p-2.5 rounded-2xl bg-slate-50 border border-gray-50 flex-1 min-w-[90px] relative">
              <div className="p-2 bg-orange-50 text-orange-600 rounded-xl mb-2"><Users className="w-4 h-4" /></div>
              <span className="text-[9px] font-bold text-gray-400 block uppercase leading-none">Referrals</span>
              <span className="text-xs font-black text-gray-900 mt-1 block">{stats.referrals}</span>
            </Link>

            <Link href="/commission" className="flex flex-col items-start p-2.5 rounded-2xl bg-slate-50 border border-gray-50 flex-1 min-w-[90px] relative">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl mb-2"><TrendingUp className="w-4 h-4" /></div>
              <span className="text-[9px] font-bold text-gray-400 block uppercase leading-none">Earnings</span>
              <span className="text-xs font-black text-gray-900 mt-1 block">₹{stats.teamSalesVolume.toLocaleString("en-IN")}</span>
            </Link>

          </div>
        </div>

        {/* Form Fields */}
        <div className="p-4 mt-2">
          <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" /> Account details
              </h3>
              <button onClick={() => { if (isEditing) handleSave(); else setIsEditing(true); }}
                className={`text-[10px] font-black px-3 py-1.5 rounded-lg border transition-all ${
                  isEditing ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-blue-50 text-blue-600 border-blue-100"
                }`}>
                {isSaving ? "Saving..." : isEditing ? "Save" : "Edit"}
              </button>
            </div>

            <div className="flex flex-col gap-3.5 text-left">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Full Name</label>
                <input type="text" disabled={!isEditing} value={fullName} onChange={e => setFullName(e.target.value)}
                  className="w-full bg-[#f8fafc] disabled:opacity-75 text-xs font-bold text-gray-800 p-2.5 rounded-xl border border-gray-200 focus:bg-white focus:outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Email (Read Only)</label>
                <input type="email" disabled value={emailAddress}
                  className="w-full bg-[#f8fafc] opacity-60 text-xs font-bold text-gray-500 p-2.5 rounded-xl border border-gray-200 focus:outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Phone Number</label>
                <input type="text" disabled={!isEditing} value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)}
                  className="w-full bg-[#f8fafc] disabled:opacity-75 text-xs font-bold text-gray-800 p-2.5 rounded-xl border border-gray-200 focus:bg-white focus:outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Date of Birth</label>
                <input type="text" placeholder="e.g. 15 May 1995" disabled={!isEditing} value={dob} onChange={e => setDob(e.target.value)}
                  className="w-full bg-[#f8fafc] disabled:opacity-75 text-xs font-bold text-gray-800 p-2.5 rounded-xl border border-gray-200 focus:bg-white focus:outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Address</label>
                <input type="text" placeholder="e.g. Kolkata, West Bengal" disabled={!isEditing} value={address} onChange={e => setAddress(e.target.value)}
                  className="w-full bg-[#f8fafc] disabled:opacity-75 text-xs font-bold text-gray-800 p-2.5 rounded-xl border border-gray-200 focus:bg-white focus:outline-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Security Options */}
        <div className="px-4 pb-10">
          <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm flex flex-col gap-3 text-left">
            <h3 className="text-sm font-extrabold text-gray-900 border-b border-gray-50 pb-3 mb-1">Security &amp; Verification</h3>
            <div className="flex items-center justify-between text-xs font-bold text-gray-800">
              <span>KYC Verification Status</span>
              <span className="bg-emerald-50 text-emerald-600 text-[9px] font-black px-2 py-0.5 rounded border border-emerald-100">Verified ✓</span>
            </div>
            <div className="flex items-center justify-between text-xs font-bold text-gray-800 mt-2">
              <span>Member Joined Since</span>
              <span className="text-[10px] text-gray-400 font-semibold">{memberSinceStr}</span>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* DESKTOP LAYOUT (lg+ viewports) */}
      {/* ========================================================================= */}
      <div className="hidden lg:block p-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/users/dashboard" className="w-10 h-10 bg-white border border-gray-200 text-gray-600 rounded-xl flex items-center justify-center shadow-sm hover:bg-gray-50 active:scale-95 transition-transform">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="text-left">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Profile Settings</h1>
            <p className="text-xs text-gray-500 font-medium mt-0.5">Manage your personal credentials, contact inputs, and view live wallet stats</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-8 items-start">
          {/* Left Column: Avatar */}
          <div className="col-span-1 flex flex-col gap-6">
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute top-[-10%] right-[-10%] w-36 h-36 bg-blue-50 rounded-full blur-3xl" />
              
              <div className="relative mb-4">
                <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-blue-50 shadow-md bg-slate-100 shrink-0">
                  <img src={profilePicUrl} alt={fullName} className="w-full h-full object-cover" />
                </div>
                <label className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center border-2 border-white shadow-md cursor-pointer active:scale-95 transition-transform">
                  <Camera className="w-4.5 h-4.5" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                </label>
              </div>

              <div className="flex items-center gap-1.5">
                <h2 className="text-lg font-black text-gray-900">{fullName}</h2>
                {stats.status === "Active" && (
                  <span className="w-5 h-5 rounded-full bg-amber-400 text-white flex items-center justify-center font-bold text-[9px] shadow-sm border border-amber-300">✓</span>
                )}
              </div>
              
              <span className={`inline-block text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-wider mt-2 border ${
                stats.status === "Active" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-500 border-amber-100"
              }`}>
                {stats.status} Member
              </span>

              <span className="text-[10px] font-bold text-gray-400 mt-4 block">
                Member Since: {memberSinceStr}
              </span>

              <div className="w-full h-px bg-gray-50 my-6" />

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 w-full">
                <Link href="/wallet" className="bg-[#f8fafc] border border-gray-100 rounded-2xl p-4 flex flex-col items-center hover:bg-blue-50/20 hover:border-blue-200 transition-all">
                  <Wallet className="w-5 h-5 text-blue-600 mb-2" />
                  <span className="text-[10px] font-extrabold text-gray-400 block uppercase leading-none">Wallet</span>
                  <span className="text-xs font-black text-gray-800 mt-2 block">₹{stats.walletBalance.toLocaleString("en-IN")}</span>
                </Link>

                <Link href="/my-team" className="bg-[#f8fafc] border border-gray-100 rounded-2xl p-4 flex flex-col items-center hover:bg-orange-50/20 hover:border-orange-200 transition-all">
                  <Users className="w-5 h-5 text-orange-600 mb-2" />
                  <span className="text-[10px] font-extrabold text-gray-400 block uppercase leading-none">Referrals</span>
                  <span className="text-xs font-black text-gray-800 mt-2 block">{stats.referrals}</span>
                </Link>

                <Link href="/commission" className="bg-[#f8fafc] border border-gray-100 rounded-2xl p-4 flex flex-col items-center hover:bg-emerald-50/20 hover:border-emerald-200 transition-all">
                  <TrendingUp className="w-5 h-5 text-emerald-600 mb-2" />
                  <span className="text-[10px] font-extrabold text-gray-400 block uppercase leading-none">Earnings</span>
                  <span className="text-xs font-black text-gray-800 mt-2 block">₹{stats.teamSalesVolume.toLocaleString("en-IN")}</span>
                </Link>

                <div className="bg-[#f8fafc] border border-gray-100 rounded-2xl p-4 flex flex-col items-center">
                  <Award className="w-5 h-5 text-purple-600 mb-2" />
                  <span className="text-[10px] font-extrabold text-gray-400 block uppercase leading-none">Status</span>
                  <span className="text-xs font-black text-gray-800 mt-2 block capitalize">{stats.status}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Form */}
          <div className="col-span-2 flex flex-col gap-6">
            <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-50 pb-5 mb-6">
                <div className="text-left">
                  <h3 className="text-base font-extrabold text-gray-900">Personal Information</h3>
                  <p className="text-xs text-gray-400 font-medium">Keep your account configuration keys and contact details updated</p>
                </div>
                <button onClick={() => { if (isEditing) handleSave(); else setIsEditing(true); }}
                  className={`text-xs font-bold py-2 px-4 rounded-xl border flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform ${
                    isEditing ? "bg-emerald-600 text-white border-transparent" : "bg-blue-50 text-blue-600 border-transparent hover:bg-blue-100"
                  }`}>
                  <Pencil className="w-3.5 h-3.5" />
                  <span>{isSaving ? "Saving..." : isEditing ? "Save Details" : "Edit Profile"}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6 text-left">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-2">Full Name</label>
                  <input type="text" disabled={!isEditing} value={fullName} onChange={e => setFullName(e.target.value)}
                    className="w-full bg-[#f8fafc] disabled:opacity-75 disabled:cursor-not-allowed text-xs font-bold text-gray-800 p-3 rounded-xl border border-gray-200 focus:bg-white focus:border-blue-400 focus:outline-none transition-all" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-2">Email Address (Read Only)</label>
                  <input type="email" disabled value={emailAddress}
                    className="w-full bg-[#f8fafc] opacity-60 disabled:cursor-not-allowed text-xs font-bold text-gray-500 p-3 rounded-xl border border-gray-200 focus:outline-none transition-all" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-2">Mobile Number</label>
                  <input type="text" disabled={!isEditing} value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)}
                    className="w-full bg-[#f8fafc] disabled:opacity-75 disabled:cursor-not-allowed text-xs font-bold text-gray-800 p-3 rounded-xl border border-gray-200 focus:bg-white focus:border-blue-400 focus:outline-none transition-all" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-2">Date of Birth</label>
                  <input type="text" placeholder="e.g. 15 May 1995" disabled={!isEditing} value={dob} onChange={e => setDob(e.target.value)}
                    className="w-full bg-[#f8fafc] disabled:opacity-75 disabled:cursor-not-allowed text-xs font-bold text-gray-800 p-3 rounded-xl border border-gray-200 focus:bg-white focus:border-blue-400 focus:outline-none transition-all" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-gray-700 block mb-2">Address</label>
                  <input type="text" placeholder="e.g. Kolkata, West Bengal" disabled={!isEditing} value={address} onChange={e => setAddress(e.target.value)}
                    className="w-full bg-[#f8fafc] disabled:opacity-75 disabled:cursor-not-allowed text-xs font-bold text-gray-800 p-3 rounded-xl border border-gray-200 focus:bg-white focus:border-blue-400 focus:outline-none transition-all" />
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm text-left">
              <h3 className="text-base font-extrabold text-gray-900 border-b border-gray-50 pb-4 mb-4">Security Verification</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-gray-150 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-extrabold text-gray-800 block">KYC Verification Status</span>
                    <span className="text-[10px] text-gray-400 font-semibold mt-0.5 block">Required to unlock bank withdrawals</span>
                  </div>
                  <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-2.5 py-1 rounded-full border border-emerald-100 select-none">Verified ✓</span>
                </div>
                <div className="border border-gray-150 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-extrabold text-gray-800 block">Two-Factor Authentication</span>
                    <span className="text-[10px] text-gray-400 font-semibold mt-0.5 block">Protects wallet transactions</span>
                  </div>
                  <button onClick={() => setTwoFactorActive(!twoFactorActive)}
                    className={`w-12 h-6.5 rounded-full p-1 transition-colors duration-300 relative focus:outline-none cursor-pointer ${
                      twoFactorActive ? "bg-[#0b5be6]" : "bg-gray-200"
                    }`}>
                    <div className={`bg-white w-4.5 h-4.5 rounded-full shadow-md transition-transform duration-300 absolute top-1 ${
                      twoFactorActive ? "translate-x-5.5" : "translate-x-0.5"
                    }`} />
                  </button>
                </div>
              </div>
            </div>

            {/* GST Purchase Invoices Section */}
            <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm text-left">
              <h3 className="text-base font-extrabold text-gray-900 border-b border-gray-50 pb-4 mb-4">Investment &amp; GST Invoices</h3>
              {approvedPurchases.length === 0 ? (
                <div className="text-center py-6 text-xs text-gray-400 font-bold">
                  No approved package purchases found to generate invoices.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {approvedPurchases.map((pkg) => {
                    const dateStr = new Date(pkg.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    });
                    const rate = pkg.goldPriceAtPurchase || 7350;
                    const weight = pkg.goldWeightGrams || ((pkg.amount / 1.18) / rate);

                    return (
                      <div
                        key={pkg._id}
                        className="border border-gray-150 hover:border-blue-200 hover:bg-blue-50/10 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all"
                      >
                        <div className="text-left">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${
                              pkg.type === "Gold" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                            }`}>
                              {pkg.type} Package
                            </span>
                            <span className="text-[10px] text-gray-400 font-bold">{dateStr}</span>
                          </div>
                          <p className="text-xs font-bold text-gray-800">
                            Amount Paid: ₹{pkg.amount.toLocaleString("en-IN")}
                          </p>
                          {pkg.type === "Gold" && (
                            <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                              Purity: {pkg.karat || "24K"} &bull; Price: ₹{rate.toLocaleString("en-IN")}/g &bull; Weight: {Number(weight).toFixed(3)}g
                            </p>
                          )}
                          <p className="text-[9px] text-gray-400 font-mono mt-1 select-all">
                            TXID: {pkg.transactionId}
                          </p>
                        </div>
                        <button
                          onClick={() => printInvoice(pkg)}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer active:scale-95 transition-transform flex items-center gap-1.5"
                        >
                          <span>Print Invoice</span>
                          <span className="text-[10px]">▼</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
