"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Wallet,
  Users,
  TrendingUp,
  Gift,
  Copy,
  CheckCheck,
  ArrowUpRight,
  ArrowDownLeft,
  Bell,
  Share2,
  Star,
  RefreshCw,
  ChevronRight,
  ShoppingBag,
  Award,
  Zap,
  CircleDollarSign,
  Coins,
  Map,
  Landmark,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────────────────────── */
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
  joinedAt: string;
}

interface TxItem {
  _id: string;
  type: string;
  amount: number;
  description: string;
  status: string;
  createdAt: string;
}

interface PurchaseItem {
  _id: string;
  type: "Gold" | "Land";
  amount: number;
  status: string;
  monthlyReturnRate: number;
  redemptionLimit: number;
  redeemedSoFar: number;
  createdAt: string;
  goldWeightGrams?: number;
  goldPriceAtPurchase?: number;
  gstAmount?: number;
  taxableAmount?: number;
  karat?: string;
  city?: string;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Stat Card
───────────────────────────────────────────────────────────────────────────── */
function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  color,
  bg,
  border,
  trend,
}: {
  title: string;
  value: string;
  sub: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  trend?: string;
}) {
  return (
    <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex items-start justify-between">
      <div className="flex flex-col gap-1 min-w-0">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate">
          {title}
        </span>
        <span className="text-2xl font-black text-gray-900 tracking-tight">{value}</span>
        <div className="flex items-center gap-1.5 mt-0.5">
          {trend && (
            <span className="text-[9px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              {trend}
            </span>
          )}
          <span className="text-[10px] font-medium text-gray-400">{sub}</span>
        </div>
      </div>
      <div className={`shrink-0 p-3 ${bg} ${color} border ${border} rounded-2xl`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Referral Card
───────────────────────────────────────────────────────────────────────────── */
function ReferralCard({ code, count }: { code: string; count: number }) {
  const [copied, setCopied] = useState(false);

  const referralLink = typeof window !== "undefined"
    ? `${window.location.origin}/signup?ref=${code}`
    : `/signup?ref=${code}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: "Join haventust!",
        text: `Use my referral code ${code} to sign up and we both earn bonus credits!`,
        url: referralLink,
      });
    } else {
      handleCopy();
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#0b5be6] via-[#073ca2] to-[#041a4a] rounded-3xl p-6 text-white relative overflow-hidden">
      {/* Decorations */}
      <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
      <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-blue-300/10 rounded-full blur-2xl" />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-white/15 p-1.5 rounded-lg">
            <Gift className="w-4 h-4 text-amber-300" />
          </div>
          <span className="text-xs font-bold text-blue-100 uppercase tracking-wider">
            Your Referral Code
          </span>
        </div>

        {/* Code Display */}
        <div className="bg-white/10 border border-white/15 backdrop-blur-sm rounded-2xl px-5 py-3 flex items-center justify-between mb-4">
          <span className="text-2xl font-black tracking-[0.25em] text-white">{code}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all active:scale-95"
          >
            {copied ? (
              <><CheckCheck className="w-3.5 h-3.5 text-emerald-300" /><span className="text-emerald-300">Copied!</span></>
            ) : (
              <><Copy className="w-3.5 h-3.5" /><span>Copy</span></>
            )}
          </button>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 mb-5">
          <div className="bg-white/10 rounded-xl px-3 py-2 flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-blue-200" />
            <span className="text-xs font-bold text-white">{count} Referrals</span>
          </div>
          <div className="bg-emerald-500/20 border border-emerald-400/20 rounded-xl px-3 py-2 flex items-center gap-2">
            <CircleDollarSign className="w-3.5 h-3.5 text-emerald-300" />
            <span className="text-xs font-bold text-emerald-200">Earn per referral</span>
          </div>
        </div>

        {/* Share button */}
        <button
          onClick={handleShare}
          className="w-full flex items-center justify-center gap-2 bg-white text-[#0b5be6] font-bold py-2.5 rounded-xl text-sm transition-all hover:bg-blue-50 active:scale-[0.98]"
        >
          <Share2 className="w-4 h-4" />
          Share Referral Link
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Quick Action Card
───────────────────────────────────────────────────────────────────────────── */
function QuickAction({
  icon: Icon,
  label,
  href,
  color,
  bg,
}: {
  icon: React.ElementType;
  label: string;
  href: string;
  color: string;
  bg: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-100 rounded-2xl hover:shadow-md hover:border-blue-100 transition-all group active:scale-[0.97]"
    >
      <div className={`p-3 ${bg} ${color} rounded-xl group-hover:scale-110 transition-transform`}>
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-[10px] font-bold text-gray-600 text-center leading-tight">{label}</span>
    </Link>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Transaction Row
───────────────────────────────────────────────────────────────────────────── */
function TxRow({
  type,
  label,
  amount,
  time,
  isCredit,
}: {
  type: string;
  label: string;
  amount: string;
  time: string;
  isCredit: boolean;
}) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isCredit ? "bg-emerald-50" : "bg-red-50"
          }`}
      >
        {isCredit ? (
          <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
        ) : (
          <ArrowUpRight className="w-4 h-4 text-red-500" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-gray-900 truncate">{label}</p>
        <p className="text-[10px] text-gray-400 font-medium mt-0.5">{time}</p>
      </div>
      <span
        className={`text-xs font-black shrink-0 ${isCredit ? "text-emerald-600" : "text-red-500"
          }`}
      >
        {amount}
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Achievement Badge
───────────────────────────────────────────────────────────────────────────── */
function AchievementBadge({
  label,
  icon: Icon,
  earned,
}: {
  label: string;
  icon: React.ElementType;
  earned: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border text-center transition-all ${earned
          ? "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200"
          : "bg-gray-50 border-gray-100 opacity-50"
        }`}
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center ${earned ? "bg-gradient-to-br from-amber-400 to-orange-500" : "bg-gray-200"
          }`}
      >
        <Icon className="w-5 h-5 text-white" />
      </div>
      <span
        className={`text-[9px] font-bold leading-tight ${earned ? "text-amber-700" : "text-gray-400"
          }`}
      >
        {label}
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Main User Dashboard Page
───────────────────────────────────────────────────────────────────────────── */
export default function UserDashboardPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [transactions, setTransactions] = useState<TxItem[]>([]);
  const [packages, setPackages] = useState<PurchaseItem[]>([]);

  // Ticker states (city → karat → ₹/gram)
  const [goldPrices, setGoldPrices] = useState<any>({
    Kolkata: { "24K": 7350, "22K": 6740 },
    Mumbai: { "24K": 7358, "22K": 6747 },
    Delhi: { "24K": 7372, "22K": 6758 },
    Chennai: { "24K": 7338, "22K": 6729 },
  });
  const [activeCityIndex, setActiveCityIndex] = useState(0);
  const [isLiveGold, setIsLiveGold] = useState(false);

  const fetchGoldPrices = useCallback(async () => {
    try {
      const res = await fetch("/api/gold-price");
      if (res.ok) {
        const data = await res.json();
        if (data.prices) {
          setGoldPrices(data.prices);
          setIsLiveGold(!!data.isLive);
        }
      }
    } catch { /* silent */ }
  }, []);

  const fetchProfile = useCallback(async () => {
    setRefreshing(true);
    try {
      const token = localStorage.getItem("authToken");
      const cachedUser = localStorage.getItem("currentUser");

      if (cachedUser) {
        const parsed = JSON.parse(cachedUser);
        setUser(parsed);
        setWalletBalance(parsed.walletBalance ?? 0);
        setIsLoading(false);
      }

      if (token) {
        const res = await fetch("/api/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setWalletBalance(data.user.walletBalance ?? 0);
          localStorage.setItem("currentUser", JSON.stringify(data.user));
        }

        // Fetch live wallet transactions
        const walletRes = await fetch("/api/wallet", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (walletRes.ok) {
          const wData = await walletRes.json();
          setWalletBalance(wData.walletBalance ?? 0);
          setTransactions(wData.transactions ?? []);
        }

        // Fetch user packages (investments)
        const pkgRes = await fetch("/api/packages", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (pkgRes.ok) {
          const pkgData = await pkgRes.json();
          setPackages(pkgData.purchases ?? []);
        }
      }
    } catch {
      // Use cached data if fetch fails
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchGoldPrices();
    const interval = setInterval(fetchGoldPrices, 12000); // 12s price tick
    return () => clearInterval(interval);
  }, [fetchProfile, fetchGoldPrices]);

  // Rotate carousel city index every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveCityIndex((prev) => (prev + 1) % 4);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const memberSince = user?.joinedAt
    ? new Date(user.joinedAt).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    : "—";

  // Investment summaries from live packages data
  const approvedGold = packages.filter(p => p.type === "Gold" && p.status === "Approved");
  const approvedLand = packages.filter(p => p.type === "Land" && p.status === "Approved");
  const totalGoldInvested = approvedGold.reduce((s, p) => s + p.amount, 0);
  const totalLandInvested = approvedLand.reduce((s, p) => s + p.amount, 0);
  const totalGoldReturns = approvedGold.reduce((s, p) => s + p.redeemedSoFar, 0);
  const totalLandReturns = approvedLand.reduce((s, p) => s + p.redeemedSoFar, 0);
  const totalGoldWeight = approvedGold.reduce((s, p) => s + (p.goldWeightGrams || 0), 0);
  const pendingPackages = packages.filter(p => p.status === "Pending").length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <svg className="animate-spin h-8 w-8 text-[#0b5be6]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-xs font-bold uppercase tracking-wider">Loading Dashboard…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Welcome back, {user?.name?.split(" ")[0] ?? "User"} 👋
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Member since {memberSince} · Referral Code:{" "}
            <span className="font-black text-[#0b5be6]">{user?.referralCode ?? "—"}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchProfile}
            className="p-2.5 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-[#0b5be6] hover:border-blue-100 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
          <Link
            href="/notifications"
            className="relative p-2.5 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-[#0b5be6] hover:border-blue-100 transition-all"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
          </Link>
        </div>
      </div>

      {/* ── Main Grid ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Left Column (2/3 width on xl) */}
        <div className="xl:col-span-2 flex flex-col gap-6">

          {/* Live Gold Price Ticker Card */}
          <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 w-28 h-28 bg-amber-50 rounded-full blur-2xl" />
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 bg-gradient-to-br from-amber-400 to-yellow-500 text-white rounded-xl shadow-md shadow-amber-200 ${isLiveGold ? "animate-pulse" : ""}`}>
                  <Coins className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <h3 className="text-xs font-black text-gray-900 uppercase tracking-wide">Gold Spot Price &bull; India</h3>
                  <p className="text-[9px] text-gray-400 font-semibold">Per gram &bull; 24K &amp; 22K &bull; Updated every 5 min</p>
                </div>
              </div>
              <span className={`text-[9px] font-black px-2.5 py-1 rounded-full border uppercase ${isLiveGold
                  ? "bg-emerald-50 text-emerald-600 border-emerald-200 animate-pulse"
                  : "bg-amber-50 text-amber-600 border-amber-100"
                }`}>
                {isLiveGold ? "● GoldAPI Live" : "Simulated"}
              </span>
            </div>

            {/* City ticker grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 relative z-10 text-left">
              {["Kolkata", "Mumbai", "Delhi", "Chennai"].map((city, idx) => {
                const cityPrices = goldPrices[city] ?? {};
                const price24K: number = cityPrices["24K"] ?? 7350;
                const price22K: number = cityPrices["22K"] ?? 6740;
                const isActive = idx === activeCityIndex;

                return (
                  <div
                    key={city}
                    className={`border rounded-2xl p-3 transition-all duration-500 cursor-pointer ${isActive
                        ? "bg-gradient-to-br from-amber-50 to-yellow-50/60 border-amber-300 shadow-md shadow-amber-100 scale-[1.02]"
                        : "bg-slate-50/50 border-gray-100 opacity-55 hover:opacity-80"
                      }`}
                    onClick={() => setActiveCityIndex(idx)}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-black text-gray-700 uppercase tracking-wider">{city}</span>
                      {isActive && <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />}
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] text-gray-400 font-bold">24K /g</span>
                        <span className="text-[11px] text-amber-700 font-black">₹{price24K.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] text-gray-400 font-bold">22K /g</span>
                        <span className="text-[10px] text-gray-700 font-bold">₹{price22K.toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>


          {/* ─ Wallet Hero Card ─────────────────────────────────────────── */}
          <div className="bg-gradient-to-br from-[#0a56e3] via-[#073ca3] to-[#041a4a] rounded-3xl p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-400/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  {/* Profile pic + name */}
                  <div className="flex items-center gap-3 mb-4">
                    {user?.profilePicUrl ? (
                      <img
                        src={user.profilePicUrl}
                        alt={user.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-white/30"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center">
                        <span className="text-lg font-black">
                          {user?.name?.charAt(0) ?? "U"}
                        </span>
                      </div>
                    )}
                    <div className="text-left">
                      <p className="text-xs text-blue-200 font-medium">Affiliate Account</p>
                      <p className="text-sm font-bold">{user?.name}</p>
                    </div>
                  </div>

                  <p className="text-xs text-blue-200 font-medium mb-1">Total Wallet Balance</p>
                  <div className="flex items-end gap-3">
                    <span className="text-4xl font-black tracking-tight">
                      {showBalance
                        ? `₹${walletBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                        : "₹ ••••••"}
                    </span>
                    <button
                      onClick={() => setShowBalance(!showBalance)}
                      className="mb-1.5 text-blue-200 hover:text-white transition-colors text-xs font-bold"
                    >
                      {showBalance ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <div className="bg-white/10 border border-white/10 p-3 rounded-2xl">
                  <Wallet className="w-7 h-7 text-blue-200" />
                </div>
              </div>

              {/* Status badge + account info */}
              <div className="flex flex-wrap gap-3">
                <div className="bg-white/10 border border-white/10 rounded-xl px-3 py-1.5 flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${user?.status === "Active" ? "bg-emerald-400" : "bg-red-400"
                      }`}
                  />
                  <span className="text-xs font-bold">{user?.status ?? "Active"}</span>
                </div>
                <div className="bg-white/10 border border-white/10 rounded-xl px-3 py-1.5 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-200" />
                  <span className="text-xs font-bold">{user?.referrals ?? 0} Referrals</span>
                </div>
                <Link
                  href="/wallet"
                  className="bg-white text-[#0b5be6] font-bold text-xs px-4 py-1.5 rounded-xl hover:bg-blue-50 transition-colors flex items-center gap-1.5 ml-auto"
                >
                  Manage Wallet <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* My Investments Summary */}
          {packages.length > 0 && (
            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-amber-500" /> My Investments
                </h3>
                <Link href="/packages" className="text-xs font-bold text-[#0b5be6] hover:underline flex items-center gap-1">
                  View All <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {/* Gold */}
                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-100 rounded-2xl p-4 relative overflow-hidden text-left">
                  <div className="absolute -bottom-3 -right-3 w-16 h-16 bg-amber-100/50 rounded-full" />
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-xl flex items-center justify-center shadow-md shadow-amber-200">
                      <Coins className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider">Gold</span>
                  </div>
                  <p className="text-lg font-black text-amber-700">&#8377;{totalGoldInvested.toLocaleString("en-IN")}</p>
                  <p className="text-[9px] text-amber-500 font-bold mt-0.5">Invested &middot; {approvedGold.length} package{approvedGold.length !== 1 ? "s" : ""}</p>
                  {totalGoldReturns > 0 && (
                    <p className="text-[9px] text-emerald-600 font-bold mt-1">&#8377;{totalGoldReturns.toLocaleString("en-IN")} earned</p>
                  )}
                </div>
                {/* Land */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-4 relative overflow-hidden">
                  <div className="absolute -bottom-3 -right-3 w-16 h-16 bg-emerald-100/50 rounded-full" />
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md shadow-emerald-200">
                      <Landmark className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">Land</span>
                  </div>
                  <p className="text-lg font-black text-emerald-700">&#8377;{totalLandInvested.toLocaleString("en-IN")}</p>
                  <p className="text-[9px] text-emerald-500 font-bold mt-0.5">Invested &middot; {approvedLand.length} package{approvedLand.length !== 1 ? "s" : ""}</p>
                  {totalLandReturns > 0 && (
                    <p className="text-[9px] text-emerald-600 font-bold mt-1">&#8377;{totalLandReturns.toLocaleString("en-IN")} earned</p>
                  )}
                </div>
              </div>
              {pendingPackages > 0 && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 flex items-center gap-2">
                  <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold text-amber-700">{pendingPackages} package request{pendingPackages !== 1 ? "s" : ""} pending admin approval</span>
                </div>
              )}
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-4">
            <StatCard
              title="Total Referrals"
              value={String(user?.referrals ?? 0)}
              sub="All time"
              icon={Users}
              color="text-[#0b5be6]"
              bg="bg-blue-50"
              border="border-blue-100"
              trend="+ Live"
            />
            <StatCard
              title="Wallet Balance"
              value={`₹${walletBalance.toLocaleString("en-IN")}`}
              sub="Available"
              icon={CircleDollarSign}
              color="text-emerald-600"
              bg="bg-emerald-50"
              border="border-emerald-100"
              trend="Live"
            />
            <StatCard
              title="Team Sales"
              value={`₹${(user?.teamSalesVolume ?? 0).toLocaleString("en-IN")}`}
              sub="All time"
              icon={TrendingUp}
              color="text-orange-600"
              bg="bg-orange-50"
              border="border-orange-100"
            />
          </div>

          {/* ─ Quick Actions ────────────────────────────────────────────── */}
          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
            <h3 className="text-sm font-extrabold text-gray-900 mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#0b5be6]" /> Quick Actions
            </h3>
            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3">
              {[
                { label: "Wallet", href: "/wallet", icon: Wallet, color: "text-blue-600", bg: "bg-blue-50" },
                { label: "My Team", href: "/my-team", icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
                { label: "Commission", href: "/commission", icon: CircleDollarSign, color: "text-emerald-600", bg: "bg-emerald-50" },
                { label: "Reports", href: "/reports", icon: TrendingUp, color: "text-orange-600", bg: "bg-orange-50" },
                { label: "Rank", href: "/rank-rewards", icon: Award, color: "text-purple-600", bg: "bg-purple-50" },
                { label: "Share", href: "#", icon: Share2, color: "text-pink-600", bg: "bg-pink-50" },
                { label: "Profile", href: "/settings", icon: Star, color: "text-yellow-600", bg: "bg-yellow-50" },
              ].map((a) => (
                <QuickAction key={a.label} {...a} />
              ))}
            </div>
          </div>


          {/* Investment Plans */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* ── Gold Purchase Plan ─────────────────────────────────── */}
            <div className="bg-white rounded-3xl border border-amber-100 shadow-sm overflow-hidden flex flex-col">
              {/* Header */}
              <div className="bg-gradient-to-r from-amber-400 to-yellow-500 px-5 pt-5 pb-4 relative overflow-hidden">
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full blur-xl" />
                <div className="relative z-10">
                  <span className="inline-flex items-center gap-1.5 bg-white/20 text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full mb-2">
                    <span>✦</span> Investment Package
                  </span>
                  <h3 className="text-base font-black text-white leading-tight">Gold Purchase Plan</h3>
                  <p className="text-[11px] text-yellow-100 mt-0.5">Gold Purchase Returns — Customer Benefit</p>
                </div>
              </div>

              {/* Table */}
              <div className="px-5 pt-4 pb-2 flex-1">
                {/* Column Headers */}
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-wider">Purchase Value</span>
                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-wider text-center">Monthly Return</span>
                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-wider text-right">Total Limit</span>
                </div>
                {[
                  { range: "₹10K – ₹4.99L", rate: "2.5%", limit: "60% of value" },
                  { range: "₹5L – ₹19.99L", rate: "3%", limit: "60% of value" },
                  { range: "₹20L & above", rate: "3.5%", limit: "60% of value" },
                ].map((row, i) => (
                  <div
                    key={i}
                    className={`grid grid-cols-3 gap-2 py-2.5 ${i < 2 ? "border-b border-gray-50" : ""}`}
                  >
                    <span className="text-[11px] font-bold text-gray-800">{row.range}</span>
                    <span className="text-[11px] font-black text-amber-600 text-center">{row.rate} / mo</span>
                    <span className="text-[11px] font-bold text-gray-500 text-right">{row.limit}</span>
                  </div>
                ))}

                {/* Duration note */}
                <div className="mt-3 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 flex items-center gap-2">
                  <span className="text-[9px] font-black text-amber-600 uppercase tracking-wider">Duration:</span>
                  <span className="text-[10px] font-bold text-amber-700">Until redemption reaches 60% of purchase value</span>
                </div>
              </div>

              {/* CTA */}
              <div className="px-5 pb-5 pt-3">
                <Link
                  href="/packages"
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-white font-black py-3 rounded-2xl text-xs shadow-md shadow-amber-200 active:scale-[0.98] transition-all"
                >
                  Purchase Now <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* ── Land Purchase Plan ─────────────────────────────────── */}
            <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm overflow-hidden flex flex-col">
              {/* Header */}
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-5 pt-5 pb-4 relative overflow-hidden">
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full blur-xl" />
                <div className="relative z-10">
                  <span className="inline-flex items-center gap-1.5 bg-white/20 text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full mb-2">
                    <span>✦</span> Investment Package
                  </span>
                  <h3 className="text-base font-black text-white leading-tight">Land Purchase Plan</h3>
                  <p className="text-[11px] text-emerald-100 mt-0.5">Land Purchase Returns — Customer Benefit</p>
                </div>
              </div>

              {/* Table */}
              <div className="px-5 pt-4 pb-2 flex-1">
                {/* Column Headers */}
                <div className="grid grid-cols-4 gap-1 mb-2">
                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-wider">Purchase Value</span>
                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-wider text-center">Monthly</span>
                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-wider text-center">Duration</span>
                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-wider text-right">Total</span>
                </div>
                {[
                  { range: "₹1L – ₹4.99L", rate: "4%", duration: "6 months", total: "24% of value" },
                  { range: "₹5L & above", rate: "6%", duration: "6 months", total: "36% of value" },
                ].map((row, i) => (
                  <div
                    key={i}
                    className={`grid grid-cols-4 gap-1 py-3 ${i < 1 ? "border-b border-gray-50" : ""}`}
                  >
                    <span className="text-[11px] font-bold text-gray-800">{row.range}</span>
                    <span className="text-[11px] font-black text-emerald-600 text-center">{row.rate} / mo</span>
                    <span className="text-[11px] font-bold text-teal-600 text-center">{row.duration}</span>
                    <span className="text-[11px] font-bold text-gray-500 text-right">{row.total}</span>
                  </div>
                ))}

                {/* Duration note */}
                <div className="mt-3 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2 flex items-center gap-2">
                  <span className="text-[9px] font-black text-emerald-600 uppercase tracking-wider">Fixed Term:</span>
                  <span className="text-[10px] font-bold text-emerald-700">Fixed 6-month payout period</span>
                </div>
              </div>

              {/* CTA */}
              <div className="px-5 pb-5 pt-3">
                <Link
                  href="/packages"
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black py-3 rounded-2xl text-xs shadow-md shadow-emerald-200 active:scale-[0.98] transition-all"
                >
                  Purchase Now <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

          </div>

          {/* ─ Recent Transactions ──────────────────────────────────────── */}
          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-extrabold text-gray-900">Recent Transactions</h3>
              <Link
                href="/wallet"
                className="text-xs font-bold text-[#0b5be6] hover:underline flex items-center gap-1"
              >
                View All <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            <div>
              {transactions.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400 font-semibold">No transactions yet.</div>
              ) : (
                transactions.slice(0, 6).map((tx) => {
                  const isCredit = ["Commission", "Payout", "Referral", "Bonus", "Deposit", "MonthlyReturn", "Salary"].some(k => tx.type.includes(k));
                  return (
                    <TxRow
                      key={tx._id}
                      type={tx.type}
                      label={tx.description || tx.type}
                      amount={`${isCredit ? "+" : "-"} ₹${tx.amount.toLocaleString("en-IN")}`}
                      time={new Date(tx.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      isCredit={isCredit}
                    />
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column (1/3 width on xl) */}
        <div className="flex flex-col gap-6">

          {/* ─ Referral Card ─────────────────────────────────────────────── */}
          {user?.referralCode && (
            <ReferralCard code={user.referralCode} count={user.referrals ?? 0} />
          )}
        </div>
      </div>
    </div>
  );
}
