"use client";

import React, { useState, useEffect } from "react";

import { Award, CheckCircle, Lock, TrendingUp, Calendar, Gift, Coins, Sparkles } from "lucide-react";

interface RankItem {
  name: string;
  volume: number;
  salary: number;
  reward: string;
}

const RANKS_LIST: RankItem[] = [
  { name: "Adviser", volume: 200000, salary: 1000, reward: "Adviser Recognition" },
  { name: "Star", volume: 500000, salary: 2000, reward: "Electric Iron" },
  { name: "Bronze", volume: 1000000, salary: 3000, reward: "Silver Coin" },
  { name: "Silver", volume: 2500000, salary: 7500, reward: "Microwave" },
  { name: "Gold", volume: 5000000, salary: 15000, reward: "Washing Machine" },
  { name: "Platinum", volume: 10000000, salary: 25000, reward: "Scooter" },
  { name: "Ruby", volume: 30000000, salary: 50000, reward: "Bike" },
  { name: "Sapphire", volume: 50000000, salary: 100000, reward: "Car (Maruti 800)" },
  { name: "Emerald", volume: 100000000, salary: 200000, reward: "Car (i20)" },
  { name: "Diamond", volume: 250000000, salary: 300000, reward: "1BHK Flat" },
  { name: "Blue Diamond", volume: 500000000, salary: 500000, reward: "2BHK Flat" },
  { name: "Black Diamond", volume: 1000000000, salary: 1000000, reward: "Thar + ₹1Cr Cash" },
  { name: "Crown", volume: 2500000000, salary: 2500000, reward: "Luxury Villa" },
  { name: "Crown Diamond", volume: 5000000000, salary: 5000000, reward: "Crown Diamond Club Entry" },
  { name: "Ambassador", volume: 10000000000, salary: 10000000, reward: "Ambassador Villa + Shareholding" },
];

export default function RankRewardsPage() {
  const [teamSalesVolume, setTeamSalesVolume] = useState(0);
  const [currentRank, setCurrentRank] = useState("Adviser");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    fetch("/api/user/team", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setTeamSalesVolume(data.teamSalesVolume || 0);
          setCurrentRank(data.currentRank || "Adviser");
        }
      })
      .catch((err) => console.error("Error loading team data:", err))
      .finally(() => setIsLoading(false));
  }, []);

  // Determine current salary and next rank targets
  const currentRankIndex = RANKS_LIST.findIndex((r) => r.name.toLowerCase() === currentRank.toLowerCase());
  const activeSalary = currentRankIndex !== -1 ? RANKS_LIST[currentRankIndex].salary : 0;

  const nextRankItem = currentRankIndex !== -1 && currentRankIndex < RANKS_LIST.length - 1
    ? RANKS_LIST[currentRankIndex + 1]
    : null;

  const progressPercent = nextRankItem
    ? Math.min(100, Math.floor((teamSalesVolume / nextRankItem.volume) * 100))
    : 100;

  return (
    <div className="w-full min-h-screen bg-[#f3f7fd] p-4 md:p-8 select-none text-left">

      {/* Top Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Card: Current Rank */}
        <div className="bg-gradient-to-br from-[#0c4cc6] to-[#04287a] text-white rounded-3xl p-5 shadow-lg relative overflow-hidden flex items-center gap-4">
          <div className="absolute right-[-10px] bottom-[-10px] w-24 h-24 bg-white/5 rounded-full blur-xl" />
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-inner">
            <Award className="w-6 h-6 text-yellow-300" />
          </div>
          <div>
            <span className="text-[10px] text-blue-100 font-bold block uppercase tracking-wider">Your Rank</span>
            <span className="text-xl font-black block mt-0.5">{currentRank}</span>
          </div>
        </div>

        {/* Card: Monthly Salary */}
        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Monthly Salary Plan</span>
            <span className="text-xl font-black text-emerald-600 block mt-0.5">₹{activeSalary.toLocaleString("en-IN")}</span>
          </div>
        </div>

        {/* Card: Team volume */}
        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Accumulated Team Volume</span>
            <span className="text-xl font-black text-gray-900 block mt-0.5">₹{teamSalesVolume.toLocaleString("en-IN")}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar widget */}
      {nextRankItem && (
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm mb-8 text-left">
          <div className="flex justify-between items-center mb-3">
            <div>
              <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Rank Milestone Progress</span>
              <span className="text-xs text-gray-800 font-extrabold block mt-0.5">
                Unlock next rank <strong className="text-[#0b5be6]">{nextRankItem.name}</strong>
              </span>
            </div>
            <span className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
              {progressPercent}% Achieved
            </span>
          </div>

          {/* Progress bar line */}
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex justify-between text-[10px] text-gray-400 font-bold mt-1.5">
            <span>Current Volume: ₹{teamSalesVolume.toLocaleString("en-IN")}</span>
            <span>Target: ₹{nextRankItem.volume.toLocaleString("en-IN")}</span>
          </div>
        </div>
      )}

      {/* Tiers List */}
      <div className="mb-6">
        <h2 className="text-base font-black text-gray-900 tracking-tight flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-yellow-500 fill-yellow-500/20" />
          <span>haventust Rank Milestones &amp; Salary Structure</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {RANKS_LIST.map((rank, index) => {
            const isAchieved = teamSalesVolume >= rank.volume;
            return (
              <div
                key={rank.name}
                className={`bg-white border rounded-3xl p-5 shadow-sm relative overflow-hidden transition-all flex flex-col justify-between min-h-[160px] ${isAchieved ? "border-emerald-200 bg-emerald-50/10" : "border-gray-100"
                  }`}
              >
                {/* Achieved Badge indicator */}
                <div className="absolute top-4 right-4">
                  {isAchieved ? (
                    <CheckCircle className="w-5 h-5 text-emerald-500 fill-emerald-50" />
                  ) : (
                    <Lock className="w-4 h-4 text-gray-300" />
                  )}
                </div>

                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Rank {index + 1}</span>
                  <h3 className={`text-base font-black tracking-tight mt-1 ${isAchieved ? "text-emerald-700" : "text-gray-900"}`}>
                    {rank.name}
                  </h3>

                  <div className="flex flex-col gap-1.5 mt-4 text-xs font-semibold text-gray-500">
                    <div className="flex justify-between">
                      <span>Required Volume:</span>
                      <span className="text-gray-800 font-bold">₹{rank.volume.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Monthly Salary:</span>
                      <span className="text-emerald-600 font-bold">₹{rank.salary.toLocaleString("en-IN")} / mo</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100/60 pt-3 mt-4 flex items-center gap-2 text-xs font-bold text-gray-600">
                  <Gift className="w-4 h-4 text-blue-500 shrink-0" />
                  <span className="truncate">{rank.reward}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
