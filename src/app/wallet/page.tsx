"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Bell,
  Eye,
  EyeOff,
  Plus,
  ArrowRight,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Download,
  Upload,
  History,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  PlusCircle,
  ShoppingBag,
  Lock
} from "lucide-react";
import ActivationPage from "@/components/ActivationPage";

interface Transaction {
  id: string;
  type: "deposit" | "withdrawal" | "bonus" | "purchase";
  desc: string;
  subdesc: string;
  amount: string;
  rawAmount: number;
  date: string;
  balance: string;
  status: "Success" | "Pending" | "Failed";
  color: string;
  bgColor: string;
  icon: React.ComponentType<{ className?: string }>;
}

export default function WalletPage() {
  const [showBalance, setShowBalance] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  const [addMoneyValue, setAddMoneyValue] = useState("");
  const [withdrawValue, setWithdrawValue] = useState("");
  const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [user, setUser] = useState<any>(null);
  const [isActivationModalOpen, setIsActivationModalOpen] = useState(false);

  const fetchUserProfile = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) return;
    try {
      const res = await fetch("/api/user/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          localStorage.setItem("currentUser", JSON.stringify(data.user));
        }
      }
    } catch (e) {
      console.error("Error loading user profile:", e);
    }
  };

  const handleActivationSuccess = () => {
    fetchUserProfile();
    fetchWalletData();
    setIsActivationModalOpen(false);
  };

  useEffect(() => {
    fetchWalletData();
    fetchUserProfile();
  }, []);

  const fetchWalletData = async () => {
    const token = localStorage.getItem("authToken");
    try {
      const res = await fetch("/api/wallet", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBalance(data.walletBalance || 0);

        const mapped = (data.transactions || []).map((t: any) => {
          let type: "deposit" | "withdrawal" | "bonus" | "purchase" = "deposit";
          if (t.type === "Deposit") type = "deposit";
          else if (t.type === "Withdrawal") type = "withdrawal";
          else if (t.type === "Commission" || t.type === "Salary" || t.type === "MonthlyReturn") type = "bonus";
          else if (t.type === "Purchase") type = "purchase";

          let desc = t.description;
          let subdesc = t.type;
          let color = "text-[#0b5be6]";
          let bgColor = "bg-blue-50";
          let icon = TrendingUp;

          if (t.type === "Deposit") {
            color = "text-emerald-600";
            bgColor = "bg-emerald-50";
            icon = ArrowDownLeft;
          } else if (t.type === "Withdrawal") {
            color = t.status === "Pending" ? "text-orange-500" : t.status === "Failed" ? "text-red-500" : "text-orange-600";
            bgColor = t.status === "Pending" ? "bg-orange-50/50" : t.status === "Failed" ? "bg-red-50" : "bg-orange-50";
            icon = ArrowUpRight;
          } else if (t.type === "Purchase") {
            color = "text-red-500";
            bgColor = "bg-red-50";
            icon = ShoppingBag;
          }

          const sign = (t.type === "Deposit" || t.type === "Commission" || t.type === "Salary" || t.type === "MonthlyReturn") ? "+" : "-";

          return {
            id: t._id,
            type,
            desc,
            subdesc,
            rawAmount: t.amount,
            amount: `${sign} ₹${t.amount.toLocaleString("en-IN")}`,
            date: new Date(t.createdAt).toLocaleString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            }),
            balance: `₹${(data.walletBalance || 0).toLocaleString("en-IN")}`,
            status: t.status,
            color,
            bgColor,
            icon,
          };
        });

        setTransactions(mapped);
      }
    } catch (e) {
      console.error("Error loading wallet details:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMoneySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addMoneyValue || Number(addMoneyValue) <= 0) return;

    setIsSubmitting(true);
    const token = localStorage.getItem("authToken");
    try {
      const res = await fetch("/api/wallet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: "Deposit",
          amount: Number(addMoneyValue),
          details: "UPI Deposit Request",
        }),
      });

      if (res.ok) {
        alert("Deposit request submitted successfully for admin review!");
        setIsAddMoneyOpen(false);
        setAddMoneyValue("");
        fetchWalletData();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to submit deposit.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawValue || Number(withdrawValue) <= 0) return;

    setIsSubmitting(true);
    const token = localStorage.getItem("authToken");
    try {
      const res = await fetch("/api/wallet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: "Withdrawal",
          amount: Number(withdrawValue),
          details: "Bank Withdrawal Transfer",
        }),
      });

      if (res.ok) {
        alert("Withdrawal request submitted successfully!");
        setIsWithdrawOpen(false);
        setWithdrawValue("");
        fetchWalletData();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to submit withdrawal.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter logic
  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch = tx.desc.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          tx.subdesc.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || tx.type === filterType;
    return matchesSearch && matchesType;
  });

  // Calculate Aggregates
  const totalCredits = transactions
    .filter((tx) => (tx.type === "deposit" || tx.type === "bonus") && tx.status === "Success")
    .reduce((sum, tx) => sum + tx.rawAmount, 0);

  const totalDebits = transactions
    .filter((tx) => (tx.type === "withdrawal" || tx.type === "purchase") && tx.status === "Success")
    .reduce((sum, tx) => sum + tx.rawAmount, 0);

  const pendingWithdrawalSum = transactions
    .filter((tx) => tx.type === "withdrawal" && tx.status === "Pending")
    .reduce((sum, tx) => sum + tx.rawAmount, 0);

  const pendingDepositSum = transactions
    .filter((tx) => tx.type === "deposit" && tx.status === "Pending")
    .reduce((sum, tx) => sum + tx.rawAmount, 0);

  const availableBalance = balance;
  const totalBalance = balance + pendingDepositSum;

  return (
    <div className="w-full min-h-screen bg-[#f3f7fd] select-none p-4 md:p-8 pb-24 lg:pb-8 relative">
      {/* ========================================================================= */}
      {/* TRANSACTION POPUPS */}
      {/* ========================================================================= */}
      {isAddMoneyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-150 max-w-sm w-full">
            <h3 className="text-base font-extrabold text-gray-900 mb-2">Deposit Funds</h3>
            <p className="text-xs text-gray-500 mb-4">Enter amount to add to your digital wallet balance</p>
            <form onSubmit={handleAddMoneySubmit} className="flex flex-col gap-4">
              <input
                type="number"
                required
                placeholder="Amount (₹)"
                value={addMoneyValue}
                onChange={(e) => setAddMoneyValue(e.target.value)}
                className="w-full bg-slate-50 text-sm font-bold text-gray-800 p-3 rounded-xl border border-gray-200 focus:bg-white focus:border-blue-400 focus:outline-none"
              />
              <div className="flex gap-3">
                <button type="button" onClick={() => setIsAddMoneyOpen(false)} className="flex-1 bg-gray-50 text-gray-700 font-bold py-2.5 rounded-xl text-xs border border-gray-200 active:scale-95 transition-transform">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-2.5 rounded-xl text-xs active:scale-95 transition-transform">{isSubmitting ? "Sending..." : "Deposit"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isWithdrawOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-150 max-w-sm w-full">
            <h3 className="text-base font-extrabold text-gray-900 mb-2">Withdraw Funds</h3>
            <p className="text-xs text-gray-500 mb-4">Transfer wallet balance directly to bank account</p>
            <form onSubmit={handleWithdrawSubmit} className="flex flex-col gap-4">
              <input
                type="number"
                required
                placeholder="Amount (₹)"
                value={withdrawValue}
                onChange={(e) => setWithdrawValue(e.target.value)}
                className="w-full bg-slate-50 text-sm font-bold text-gray-800 p-3 rounded-xl border border-gray-200 focus:bg-white focus:border-blue-400 focus:outline-none"
              />
              <div className="flex gap-3">
                <button type="button" onClick={() => setIsWithdrawOpen(false)} className="flex-1 bg-gray-50 text-gray-700 font-bold py-2.5 rounded-xl text-xs border border-gray-200 active:scale-95 transition-transform">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 bg-blue-600 text-white font-bold py-2.5 rounded-xl text-xs active:scale-95 transition-transform">{isSubmitting ? "Sending..." : "Request"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* ========================================================================= */}
        {/* MOBILE VIEW LAYOUT (<lg screens) */}
        {/* ========================================================================= */}
        <div className="block lg:hidden">
          {/* Blue Header Section */}
          <div className="bg-gradient-to-b from-[#0b5be6] to-[#073ca2] rounded-b-[40px] px-4 pt-14 pb-8 shadow-lg shadow-blue-500/10 text-white relative">
            <div className="flex items-center justify-between mb-6">
              <Link href="/" className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white active:scale-95 transition-transform">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-lg font-bold tracking-wide">Wallet</h1>
              <div className="flex items-center gap-3">
                <button className="relative w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white">
                  <Bell className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Wallet Balance Card */}
            <div className="bg-gradient-to-r from-[#0c5ae5] via-[#094fc6] to-[#ef9f15] rounded-3xl p-5 shadow-[0_10px_25px_rgba(0,0,0,0.15)] relative overflow-hidden text-white flex justify-between items-center border border-white/10 mt-4">
              <div className="flex-1 z-10 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-blue-100 font-medium">Total Balance</span>
                  <button onClick={() => setShowBalance(!showBalance)} className="text-blue-200 hover:text-white">
                    {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
                
                <div className="text-2xl md:text-3xl font-black tracking-tight mb-4">
                  {showBalance ? `₹${totalBalance.toLocaleString("en-IN")}` : "••••••"}
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-3">
                  <div>
                    <span className="text-[10px] text-blue-200 block">Available Balance</span>
                    <span className="text-sm font-bold text-yellow-300">
                      {showBalance ? `₹${availableBalance.toLocaleString("en-IN")}` : "••••••"}
                    </span>
                  </div>
                  <div className="border-l border-white/10 pl-4">
                    <span className="text-[10px] text-blue-200 block">Pending Balance</span>
                    <span className="text-sm font-bold text-orange-200">
                      {showBalance ? `₹${pendingWithdrawalSum.toLocaleString("en-IN")}` : "••••••"}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3D Wallet SVG Graphic */}
              <div className="absolute right-0 bottom-0 top-0 w-2/5 flex items-center justify-end pointer-events-none opacity-90">
                <svg viewBox="0 0 100 100" className="w-full h-full max-h-[140px] drop-shadow-[-8px_10px_12px_rgba(0,0,0,0.25)]">
                  <defs>
                    <radialGradient id="gold" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#ffe66d" />
                      <stop offset="70%" stopColor="#f3b007" />
                      <stop offset="100%" stopColor="#b77c00" />
                    </radialGradient>
                    <linearGradient id="wallet-blue" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#1e5bfb" />
                      <stop offset="100%" stopColor="#072b8d" />
                    </linearGradient>
                  </defs>
                  <circle cx="72" cy="30" r="14" fill="url(#gold)" />
                  <circle cx="72" cy="30" r="10" fill="none" stroke="#fff" strokeWidth="0.8" strokeDasharray="3 2" />
                  <circle cx="82" cy="45" r="14" fill="url(#gold)" />
                  <circle cx="82" cy="45" r="10" fill="none" stroke="#fff" strokeWidth="0.8" />
                  <rect x="35" cy="38" width="55" height="42" rx="8" fill="url(#wallet-blue)" stroke="#3b82f6" strokeWidth="1" />
                  <path d="M55,38 L85,38 C88,38 90,40 90,43 L90,48 C90,51 88,53 85,53 L55,53 Z" fill="#0b37ab" />
                  <circle cx="82" cy="46" r="4" fill="url(#gold)" />
                  <g transform="translate(68, 64)">
                    <ellipse cx="12" cy="12" rx="12" ry="5" fill="url(#gold)" />
                    <path d="M0,12 L0,18 A12,5 0 0,0 24,18 L24,12 Z" fill="url(#gold)" />
                    <ellipse cx="12" cy="18" rx="12" ry="5" fill="#f3b007" stroke="#ffe66d" strokeWidth="0.5" />
                  </g>
                </svg>
              </div>
            </div>

            {/* Main Action buttons */}
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setIsAddMoneyOpen(true)}
                className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black py-3 px-4 rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/10 active:scale-[0.98] transition-transform cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" /> Add Money
              </button>
              <button
                onClick={() => setIsWithdrawOpen(true)}
                className="flex-1 bg-white hover:bg-gray-50 border border-blue-200 text-[#0b5be6] font-black py-3 px-4 rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
              >
                <Download className="w-4 h-4" /> Withdraw
              </button>
            </div>
          </div>

          {/* Quick Actions Grid Card */}
          <div className="px-4 mt-6">
            <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 grid grid-cols-4 gap-2 text-center">
              <button onClick={() => setIsAddMoneyOpen(true)} className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2 shadow-inner">
                  <Download className="w-5 h-5" />
                </div>
                <span className="text-[9px] font-black text-gray-800">Add Money</span>
                <span className="text-[7.5px] text-gray-400 font-medium mt-0.5">Instantly add funds</span>
              </button>

              <button onClick={() => setIsWithdrawOpen(true)} className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mb-2 shadow-inner">
                  <Upload className="w-5 h-5" />
                </div>
                <span className="text-[9px] font-black text-gray-800">Withdraw</span>
                <span className="text-[7.5px] text-gray-400 font-medium mt-0.5">Transfer to bank</span>
              </button>

              <button onClick={() => setFilterType("all")} className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-2 shadow-inner">
                  <History className="w-5 h-5" />
                </div>
                <span className="text-[9px] font-black text-gray-800 leading-none">History</span>
                <span className="text-[7.5px] text-gray-400 font-medium mt-1">View transaction</span>
              </button>

              <button onClick={() => setFilterType("withdrawal")} className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 shadow-inner">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <span className="text-[9px] font-black text-gray-800">Payout</span>
                <span className="text-[7.5px] text-gray-400 font-medium mt-0.5">Request payout</span>
              </button>
            </div>
          </div>

          {/* Recent Transactions List Section */}
          <div className="p-4 mt-2">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-extrabold text-gray-800">Recent Transactions</h3>
              <button onClick={() => setFilterType("all")} className="text-xs font-bold text-[#0b5be6] hover:text-blue-700 flex items-center gap-1 cursor-pointer">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="bg-white border border-gray-100 rounded-3xl p-4 shadow-sm flex flex-col divide-y divide-gray-50">
              {filteredTransactions.slice(0, 10).map((tx) => {
                const Icon = tx.icon;
                return (
                  <div key={tx.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-2xl ${tx.bgColor} ${tx.color} shadow-sm`}>
                        <Icon className="w-4.5 h-4.5" />
                      </div>
                      <div className="text-left">
                        <span className="text-xs font-extrabold text-gray-800 block leading-tight">{tx.desc}</span>
                        <span className="text-[8px] font-bold text-gray-400 block uppercase mt-0.5 tracking-wider">{tx.subdesc}</span>
                        <span className="text-[8px] text-gray-400 font-medium block mt-0.5">{tx.date}</span>
                      </div>
                    </div>

                    <div className="text-right flex items-center gap-3">
                      <div>
                        <span className={`text-xs font-black block ${
                          tx.amount.startsWith("+") ? "text-emerald-600" : "text-orange-500"
                        }`}>
                          {tx.amount}
                        </span>
                        <span className="text-[8px] font-bold text-gray-400 block mt-0.5">Status: {tx.status}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Wallet Summary Banner Card */}
          <div className="px-4 mb-8">
            <div className="bg-gradient-to-r from-blue-50/50 via-indigo-50/50 to-purple-50/50 border border-indigo-100/50 rounded-3xl p-5 shadow-sm relative overflow-hidden flex justify-between items-center text-left">
              <div className="z-10">
                <h3 className="text-sm font-extrabold text-gray-800 mb-4">Wallet Summary</h3>
                <div className="flex flex-col gap-3">
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Total Credits</span>
                    <span className="text-sm font-black text-emerald-600 block mt-0.5">₹{totalCredits.toLocaleString("en-IN")}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Total Debits</span>
                    <span className="text-sm font-black text-orange-500 block mt-0.5">₹{totalDebits.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>

              <div className="w-1/2 h-full flex items-center justify-end pointer-events-none pr-1">
                <svg viewBox="0 0 120 90" className="w-full h-full max-h-[85px] drop-shadow-[-4px_6px_8px_rgba(0,0,0,0.15)]">
                  <g transform="translate(100, 30)">
                    <path d="M0,0 Q-10,-20 -20,-10 Q-30,0 -20,20 Z" fill="#34d399" opacity="0.7" />
                    <path d="M0,10 Q10,-10 20,0 Q30,10 10,30 Z" fill="#059669" opacity="0.6" />
                  </g>
                  <rect x="25" y="10" width="75" height="46" rx="6" fill="#1d4ed8" transform="rotate(-12, 62, 33)" stroke="#3b82f6" strokeWidth="0.8" />
                  <rect x="20" y="28" width="75" height="46" rx="6" fill="#ef9f15" stroke="#f59e0b" strokeWidth="0.8" />
                  <rect x="26" y="36" width="12" height="9" rx="2" fill="#fde047" opacity="0.8" />
                  <line x1="26" y1="62" x2="66" y2="62" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
                  <g transform="translate(15, 60)">
                    <ellipse cx="10" cy="10" rx="10" ry="4" fill="url(#gold)" />
                    <ellipse cx="20" cy="14" rx="10" ry="4" fill="url(#gold)" stroke="#ffe66d" strokeWidth="0.5" />
                  </g>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* DESKTOP VIEW LAYOUT (lg+ screens) */}
        {/* ========================================================================= */}
        <div className="hidden lg:block p-2 md:p-4 max-w-7xl mx-auto text-left">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/" className="w-10 h-10 bg-white border border-gray-150 text-gray-600 rounded-xl flex items-center justify-center shadow-sm hover:bg-gray-50 active:scale-95 transition-transform">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Wallet Overview</h1>
              <p className="text-xs text-gray-500 font-medium mt-0.5">Manage digital wallet transactions, withdrawals, and payouts</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-8 items-start">
            {/* Left column summary widgets */}
            <div className="col-span-1 flex flex-col gap-6">
              {/* Balance card details */}
              <div className="bg-gradient-to-br from-[#0c4cc6] to-[#04287a] rounded-[32px] p-6 text-white shadow-md relative overflow-hidden border border-blue-500/10 text-left">
                <div className="absolute right-[-10%] bottom-[-10%] w-40 h-40 bg-white/5 rounded-full blur-2xl" />
                
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-blue-100 font-medium">Total Balance</span>
                  <button onClick={() => setShowBalance(!showBalance)} className="text-blue-200 hover:text-white">
                    {showBalance ? <Eye className="w-4.5 h-4.5" /> : <EyeOff className="w-4.5 h-4.5" />}
                  </button>
                </div>
                
                <h2 className="text-3xl font-black tracking-tight mb-6">
                  {showBalance ? `₹${totalBalance.toLocaleString("en-IN")}` : "••••••"}
                </h2>

                <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4 mb-6">
                  <div>
                    <span className="text-[10px] text-blue-200 block uppercase font-bold">Available Balance</span>
                    <span className="text-base font-black text-yellow-300 block mt-1">
                      {showBalance ? `₹${availableBalance.toLocaleString("en-IN")}` : "••••••"}
                    </span>
                  </div>
                  <div className="border-l border-white/10 pl-5">
                    <span className="text-[10px] text-blue-200 block uppercase font-bold">Pending Balance</span>
                    <span className="text-base font-black text-orange-300 block mt-1">
                      {showBalance ? `₹${pendingWithdrawalSum.toLocaleString("en-IN")}` : "••••••"}
                    </span>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setIsAddMoneyOpen(true)}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-transform cursor-pointer border border-transparent"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" /> Add Money
                  </button>
                  <button
                    onClick={() => setIsWithdrawOpen(true)}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-transform cursor-pointer"
                  >
                    <Download className="w-4 h-4" /> Withdraw
                  </button>
                </div>
              </div>

              {/* Wallet credits debits block */}
              <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
                <h3 className="text-sm font-extrabold text-gray-900 mb-4 border-b border-gray-50 pb-3">Wallet Summary</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-emerald-50/30 border border-emerald-100/50 rounded-2xl p-4 text-left">
                    <TrendingUp className="w-5 h-5 text-emerald-600 mb-2" />
                    <span className="text-[10px] font-bold text-gray-400 block uppercase">Total Credits</span>
                    <span className="text-base font-black text-emerald-600 block mt-1">₹{totalCredits.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="bg-orange-50/30 border border-orange-100/50 rounded-2xl p-4 text-left">
                    <TrendingDown className="w-5 h-5 text-orange-500 mb-2" />
                    <span className="text-[10px] font-bold text-gray-400 block uppercase">Total Debits</span>
                    <span className="text-base font-black text-orange-500 block mt-1">₹{totalDebits.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                {/* SVG Visual Graphic stacked credit cards */}
                <div className="bg-[#f8fafc] border border-gray-100 rounded-2xl p-4 mt-4 flex items-center justify-center h-28">
                  <svg viewBox="0 0 120 90" className="w-2/3 h-full drop-shadow-[-4px_6px_8px_rgba(0,0,0,0.15)]">
                    <g transform="translate(100, 30)">
                      <path d="M0,0 Q-10,-20 -20,-10 Q-30,0 -20,20 Z" fill="#34d399" opacity="0.7" />
                      <path d="M0,10 Q10,-10 20,0 Q30,10 10,30 Z" fill="#059669" opacity="0.6" />
                    </g>
                    <rect x="25" y="10" width="75" height="46" rx="6" fill="#1d4ed8" transform="rotate(-12, 62, 33)" stroke="#3b82f6" strokeWidth="0.8" />
                    <rect x="20" y="28" width="75" height="46" rx="6" fill="#ef9f15" stroke="#f59e0b" strokeWidth="0.8" />
                    <rect x="26" y="36" width="12" height="9" rx="2" fill="#fde047" opacity="0.8" />
                    <line x1="26" y1="62" x2="66" y2="62" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
                    <g transform="translate(15, 60)">
                      <ellipse cx="10" cy="10" rx="10" ry="4" fill="url(#gold)" />
                      <ellipse cx="20" cy="14" rx="10" ry="4" fill="url(#gold)" stroke="#ffe66d" strokeWidth="0.5" />
                    </g>
                  </svg>
                </div>
              </div>
            </div>

            {/* Right column detailed transaction table */}
            <div className="col-span-2 bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 mb-6 border-b border-gray-50 gap-4">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">Recent Transactions</h3>
                  <p className="text-xs text-gray-400 font-medium">Browse and search detailed account ledger logs</p>
                </div>
                
                {/* Table search & filters */}
                <div className="flex gap-3">
                  <div className="relative w-48">
                    <input
                      type="text"
                      placeholder="Search description..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[#f8fafc] text-xs text-gray-700 pl-3 pr-8 py-2 rounded-xl border border-gray-200 focus:bg-white focus:border-blue-400 focus:outline-none"
                    />
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  </div>
                  
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="bg-[#f8fafc] border border-gray-200 text-xs font-bold text-gray-600 rounded-xl px-3 py-2 cursor-pointer focus:outline-none focus:bg-white focus:border-blue-400"
                  >
                    <option value="all">All Logs</option>
                    <option value="deposit">Deposits</option>
                    <option value="withdrawal">Withdrawals</option>
                    <option value="bonus">Referrals</option>
                    <option value="purchase">Purchases</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-xs font-bold text-gray-400 border-b border-gray-50">
                      <th className="pb-3 pr-2">Type</th>
                      <th className="pb-3">Description</th>
                      <th className="pb-3 text-right">Amount</th>
                      <th className="pb-3 text-center">Date & Time</th>
                      <th className="pb-3 text-right">Balance</th>
                      <th className="pb-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-xs font-medium text-gray-700">
                    {filteredTransactions.map((tx) => {
                      const Icon = tx.icon;
                      return (
                        <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-4 pr-2">
                            <div className={`w-8 h-8 rounded-xl ${tx.bgColor} ${tx.color} flex items-center justify-center shadow-inner`}>
                              <Icon className="w-4 h-4" />
                            </div>
                          </td>
                          <td className="py-4 text-left">
                            <span className="font-bold text-gray-800 block">{tx.desc}</span>
                            <span className="text-[10px] text-gray-400 font-medium mt-0.5 block">{tx.subdesc}</span>
                          </td>
                          <td className={`py-4 text-right font-extrabold ${
                            tx.amount.startsWith("+") ? "text-emerald-600" : "text-orange-500"
                          }`}>
                            {tx.amount}
                          </td>
                          <td className="py-4 text-center text-gray-400 font-bold">{tx.date}</td>
                          <td className="py-4 text-right text-gray-500 font-bold">{tx.balance}</td>
                          <td className="py-4 text-right">
                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold ${
                              tx.status === "Success"
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                : tx.status === "Failed"
                                ? "bg-red-50 text-red-500 border border-red-100"
                                : "bg-amber-50 text-amber-600 border border-amber-100 animate-pulse"
                            }`}>
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* WALLET LOCK OVERLAY */}
      {/* ========================================================================= */}
      {user?.status === "PendingActivation" && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center p-6 bg-slate-900/65 backdrop-blur-md transition-all duration-300">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-150 flex flex-col items-center text-center animate-slide-in">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mb-6 shadow-inner shadow-amber-100/50">
              <Lock className="w-8 h-8 text-amber-500 animate-pulse" />
            </div>
            <h3 className="text-xl font-black text-gray-900 tracking-tight mb-2">Wallet Locked</h3>
            <p className="text-sm text-gray-500 font-medium leading-relaxed mb-6">
              Your digital wallet is currently locked. Activate your Haventust console account to unlock deposits, withdrawals, and earning commission distributions.
            </p>
            <button
              onClick={() => setIsActivationModalOpen(true)}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-3.5 px-6 rounded-2xl text-sm transition-all duration-200 shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98] select-none"
            >
              <span>Unlock Wallet &amp; Activate Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ACTIVATION MODAL POPUP */}
      {/* ========================================================================= */}
      {isActivationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
          <div className="relative bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-150 p-6 md:p-8">
            <button
              onClick={() => setIsActivationModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-extrabold text-xl p-2 z-50"
            >
              ✕
            </button>
            <ActivationPage
              user={user}
              onRefreshProfile={handleActivationSuccess}
            />
          </div>
        </div>
      )}

    </div>
  );
}
