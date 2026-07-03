"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  TrendingUp,
  Users,
  CircleDollarSign,
  RefreshCw,
  Coins,
  ChevronRight,
  Award,
  Info,
} from "lucide-react";

interface CommissionTx {
  _id: string;
  type: string;
  amount: number;
  description: string;
  status: string;
  createdAt: string;
}

export default function CommissionPage() {
  const [commissions, setCommissions] = useState<CommissionTx[]>([]);
  const [totalEarned, setTotalEarned] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rates, setRates] = useState({
    l1: 0.5,
    l2to5: 0.2,
    l6to10: 0.15,
    l11to20: 0.1,
  });

  const fetchData = useCallback(async () => {
    setRefreshing(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;
      const [walletRes, settingsRes] = await Promise.all([
        fetch("/api/wallet", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/admin/settings"),
      ]);
      if (walletRes.ok) {
        const wData = await walletRes.json();
        const commTxs: CommissionTx[] = (wData.transactions || []).filter(
          (tx: CommissionTx) => tx.type === "Commission"
        );
        setCommissions(commTxs);
        setTotalEarned(commTxs.reduce((s, tx) => s + tx.amount, 0));
      }
      if (settingsRes.ok) {
        const sData = await settingsRes.json();
        setRates({
          l1: parseFloat(sData.commissionLevel1 || "0.50"),
          l2to5: parseFloat(sData.commissionLevel2to5 || "0.20"),
          l6to10: parseFloat(sData.commissionLevel6to10 || "0.15"),
          l11to20: parseFloat(sData.commissionLevel11to20 || "0.10"),
        });
      }
    } catch { /* silent */ } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const levelCards = [
    { label: "Level 1", sublabel: "Direct Referrals", rate: rates.l1, bg: "from-amber-50 to-yellow-50", border: "border-amber-200", color: "text-amber-700", icon: "bg-amber-400" },
    { label: "Level 2-5", sublabel: "2nd to 5th Tier", rate: rates.l2to5, bg: "from-blue-50 to-indigo-50", border: "border-blue-200", color: "text-blue-700", icon: "bg-blue-500" },
    { label: "Level 6-10", sublabel: "6th to 10th Tier", rate: rates.l6to10, bg: "from-purple-50 to-violet-50", border: "border-purple-200", color: "text-purple-700", icon: "bg-purple-500" },
    { label: "Level 11-20", sublabel: "11th to 20th Tier", rate: rates.l11to20, bg: "from-emerald-50 to-teal-50", border: "border-emerald-200", color: "text-emerald-700", icon: "bg-emerald-500" },
  ];

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <div className="flex items-center gap-3">
          <Link href="/users/dashboard" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Team Sales Commission</h1>
            <p className="text-xs text-gray-500 font-medium mt-0.5">Earn bonus on every team purchase — up to 20 levels deep</p>
          </div>
        </div>
        <button onClick={fetchData} disabled={refreshing}
          className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-[#0b5be6] hover:border-blue-100 transition-all cursor-pointer">
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Hero Card */}
      <div className="bg-gradient-to-br from-[#0a56e3] via-[#073ca3] to-[#041a4a] rounded-3xl p-6 mb-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-400/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="bg-white/15 p-2 rounded-xl"><Coins className="w-5 h-5 text-amber-300" /></div>
            <span className="text-xs font-bold text-blue-200 uppercase tracking-wider">Total Commission Earned</span>
          </div>
          <p className="text-4xl font-black tracking-tight mb-1">
            &#8377;{totalEarned.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-blue-200 font-semibold">
            {commissions.length} commission credit{commissions.length !== 1 ? "s" : ""} across your downline
          </p>
          <div className="mt-5 grid grid-cols-3 gap-3">
            {[
              { val: commissions.length.toString(), label: "Credits" },
              { val: "20", label: "Levels" },
              { val: `${rates.l1}%`, label: "Top Rate" },
            ].map((s) => (
              <div key={s.label} className="bg-white/10 border border-white/10 rounded-2xl p-3 text-center">
                <p className="text-lg font-black">{s.val}</p>
                <p className="text-[10px] text-blue-200 font-bold uppercase tracking-wider mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Commission Structure */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-[#0b5be6]/10 rounded-xl"><TrendingUp className="w-4 h-4 text-[#0b5be6]" /></div>
          <div>
            <h2 className="text-sm font-extrabold text-gray-900">Team Sales Bonus Structure</h2>
            <p className="text-[10px] text-gray-400 font-semibold">Based on business value of each package purchase</p>
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 flex items-start gap-2 mb-5">
          <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
          <p className="text-[10px] text-blue-700 font-semibold leading-relaxed">
            When a team member purchases a Gold or Land package, you automatically receive a commission credited directly to your wallet based on the level they are in your network.
          </p>
        </div>

        {/* Level Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {levelCards.map((lv) => (
            <div key={lv.label} className={`bg-gradient-to-br ${lv.bg} border ${lv.border} rounded-2xl p-4 relative overflow-hidden`}>
              <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-white/40 rounded-full" />
              <div className={`w-8 h-8 ${lv.icon} rounded-xl flex items-center justify-center mb-3 shadow-sm`}>
                <Users className="w-4 h-4 text-white" />
              </div>
              <p className={`text-[10px] font-black uppercase tracking-wider ${lv.color} mb-0.5`}>{lv.label}</p>
              <p className={`text-[9px] font-semibold text-gray-400 mb-2`}>{lv.sublabel}</p>
              <p className={`text-2xl font-black ${lv.color}`}>{lv.rate}%</p>
              <p className="text-[9px] text-gray-400 font-bold mt-0.5">per purchase</p>
            </div>
          ))}
        </div>

        {/* Detail Table */}
        <div className="overflow-x-auto rounded-2xl border border-gray-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                <th className="px-4 py-3">Level</th>
                <th className="px-4 py-3 text-center">Bonus Rate</th>
                <th className="px-4 py-3 text-right">Example: &#8377;1L Purchase</th>
                <th className="px-4 py-3 text-right">Example: &#8377;10L Purchase</th>
              </tr>
            </thead>
            <tbody className="text-xs font-medium text-gray-700 divide-y divide-gray-50">
              {[
                { range: "Level 1 (Direct)", rate: rates.l1, highlight: true },
                { range: "Level 2–5", rate: rates.l2to5, highlight: false },
                { range: "Level 6–10", rate: rates.l6to10, highlight: false },
                { range: "Level 11–20", rate: rates.l11to20, highlight: false },
              ].map((row) => (
                <tr key={row.range} className={`${row.highlight ? "bg-amber-50/40" : ""} hover:bg-[#f8faff] transition-colors`}>
                  <td className="px-4 py-3 font-bold text-gray-900">{row.range}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="bg-[#0b5be6]/10 text-[#0b5be6] font-black text-[11px] px-2.5 py-1 rounded-full">{row.rate}%</span>
                  </td>
                  <td className="px-4 py-3 text-right font-black text-emerald-600">
                    &#8377;{(100000 * row.rate / 100).toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3 text-right font-black text-emerald-600">
                    &#8377;{(1000000 * row.rate / 100).toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Commission History */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 rounded-xl"><CircleDollarSign className="w-4 h-4 text-emerald-600" /></div>
            <h2 className="text-sm font-extrabold text-gray-900">Commission History</h2>
          </div>
          <Link href="/wallet" className="text-xs font-bold text-[#0b5be6] hover:underline flex items-center gap-1">
            View Wallet <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-gray-400 font-bold uppercase tracking-wider animate-pulse">Loading...</div>
        ) : commissions.length === 0 ? (
          <div className="py-14 text-center">
            <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <Award className="w-7 h-7 text-emerald-300" />
            </div>
            <p className="text-sm font-bold text-gray-500">No commissions yet</p>
            <p className="text-xs text-gray-400 font-medium mt-1">Build your team and start earning!</p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-gray-50">
            {commissions.map((tx) => {
              const levelMatch = tx.description?.match(/Level (\d+)/i);
              const level = levelMatch ? parseInt(levelMatch[1]) : null;
              let levelBg = "bg-gray-100 text-gray-600";
              if (level === 1) levelBg = "bg-amber-100 text-amber-700";
              else if (level && level <= 5) levelBg = "bg-blue-100 text-blue-700";
              else if (level && level <= 10) levelBg = "bg-purple-100 text-purple-700";
              else if (level && level <= 20) levelBg = "bg-emerald-100 text-emerald-700";
              return (
                <div key={tx._id} className="flex items-center gap-3 py-3.5 hover:bg-[#f8faff] rounded-xl px-2 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <CircleDollarSign className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate">{tx.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {level && (
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${levelBg}`}>L{level}</span>
                      )}
                      <span className="text-[9px] text-gray-400 font-semibold">
                        {new Date(tx.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-black text-emerald-600 shrink-0">
                    + &#8377;{tx.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
