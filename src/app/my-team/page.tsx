"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Users,
  UserPlus,
  TrendingUp,
  Wallet,
  ShoppingBag,
  Award,
  ArrowUpRight,
  ChevronRight,
  Search,
  Bell,
  Calendar,
  Network,
  BookOpen,
  HelpCircle
} from "lucide-react";

interface TeamMember {
  rank: number;
  name: string;
  joinDate: string;
  sales: string;
  members: number;
  avatar: string;
  status: "Active" | "Inactive";
  tier: string;
}

interface TreeNode {
  id: string;
  name: string;
  role: string;
  sales: string;
  members: number;
  avatar: string;
  tier: string;
  x: number;
  y: number;
  childrenIds: string[];
}

export default function MyTeamPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "tree">("overview");
  const [selectedNodeId, setSelectedNodeId] = useState<string>("root");

  // Dynamic States
  const [teamSalesVolume, setTeamSalesVolume] = useState(0);
  const [currentRank, setCurrentRank] = useState("Adviser");
  const [directCount, setDirectCount] = useState(0);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [leaderName, setLeaderName] = useState("Leader (You)");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get current user name
    const cached = localStorage.getItem("currentUser");
    if (cached) {
      try {
        const u = JSON.parse(cached);
        setLeaderName(u.name || "Leader (You)");
      } catch (e) {
        console.error(e);
      }
    }

    // Fetch team stats
    const token = localStorage.getItem("authToken");
    fetch("/api/user/team", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setTeamSalesVolume(data.teamSalesVolume || 0);
          setCurrentRank(data.currentRank || "Adviser");
          setDirectCount(data.directCount || 0);
          setMembers(data.members || []);
        }
      })
      .catch((err) => console.error("Error loading team:", err))
      .finally(() => setIsLoading(false));
  }, []);

  const teamOverviewStats = [
    { label: "Total Team Sales", value: `₹${teamSalesVolume.toLocaleString("en-IN")}`, change: "Updated live", isPositive: true, icon: TrendingUp, color: "text-blue-600", bgColor: "bg-blue-50" },
    { label: "Team Commission Details", value: `${directCount} Directs`, change: "MLM unlocked levels", isPositive: true, icon: Wallet, color: "text-orange-600", bgColor: "bg-orange-50" },
    { label: "Current Rank", value: currentRank, change: "Active Affiliate", isPositive: true, icon: Award, color: "text-emerald-600", bgColor: "bg-emerald-50", isRank: true }
  ];

  // Dynamic tree structure builder
  const treeNodes: Record<string, TreeNode> = {
    root: { id: "root", name: leaderName, role: "Leader (You)", sales: `₹${teamSalesVolume.toLocaleString("en-IN")}`, members: directCount, avatar: "/avatar.png", tier: currentRank, x: 250, y: 35, childrenIds: members.map(m => `node_${m.rank}`) },
  };

  members.forEach((m, idx) => {
    const total = members.length;
    const spacing = total > 1 ? 400 / (total - 1) : 400;
    const startX = total > 1 ? 50 : 250;
    const x = startX + idx * spacing;

    treeNodes[`node_${m.rank}`] = {
      id: `node_${m.rank}`,
      name: m.name,
      role: "Direct Refer",
      sales: m.sales,
      members: m.members,
      avatar: m.avatar,
      tier: m.tier,
      x,
      y: 110,
      childrenIds: []
    };
  });

  const selectedNode = treeNodes[selectedNodeId] || treeNodes.root;

  return (
    <div className="w-full min-h-screen bg-[#f3f7fd] select-none p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* ========================================================================= */}
        {/* PAGE HEADER SECTION */}
        {/* ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="w-10 h-10 bg-white border border-gray-150 text-gray-600 rounded-xl flex items-center justify-center shadow-sm hover:bg-gray-50 active:scale-95 transition-transform">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">My Team</h1>
              <p className="text-xs text-gray-500 font-medium">Analyze and check your multi-level affiliate network</p>
            </div>
          </div>

          {/* Interactive Navigation Tabs: Overview vs Network Tree */}
          <div className="bg-white border border-gray-100 rounded-2xl p-1.5 shadow-sm flex items-center gap-1.5 w-fit">
            <button
              onClick={() => setActiveTab("overview")}
              className={`text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === "overview"
                  ? "bg-[#0b5be6] text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Overview Details
            </button>
            <button
              onClick={() => setActiveTab("tree")}
              className={`text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "tree"
                  ? "bg-[#0b5be6] text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Network Hierarchy Tree</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: OVERVIEW PANEL (Dashboard & stats list matching Image 1) */}
        {/* ========================================================================= */}
        {activeTab === "overview" && (
          <div className="flex flex-col gap-6">
            
            {/* Split statistics header card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Left half: Total Team Members */}
              <div className="bg-gradient-to-r from-[#0b5be6] to-[#073ca2] rounded-3xl p-5 text-white flex items-center justify-between shadow-lg shadow-blue-500/5 relative overflow-hidden border border-white/5">
                <div className="absolute right-[-10px] bottom-[-10px] w-24 h-24 bg-white/5 rounded-full blur-xl" />
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-white shadow-inner">
                    <Users className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-blue-200 uppercase tracking-wider block">Total Team Members</span>
                    <span className="text-3xl font-black mt-1 block">{directCount}</span>
                  </div>
                </div>

                <div className="flex gap-4 border-l border-white/10 pl-5 pr-2 py-1">
                  <div>
                    <span className="text-[9px] text-blue-200 block uppercase font-bold">Active</span>
                    <span className="text-sm font-black text-emerald-400 block mt-0.5">
                      {members.filter(m => m.status === "Active").length}
                    </span>
                  </div>
                  <div className="border-l border-white/10 pl-4">
                    <span className="text-[9px] text-blue-200 block uppercase font-bold">Inactive</span>
                    <span className="text-sm font-black text-orange-400 block mt-0.5">
                      {members.filter(m => m.status === "Inactive").length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right half: New This Month */}
              <div className="bg-gradient-to-r from-[#ef9f15] to-[#cca60a] rounded-3xl p-5 text-white flex items-center justify-between shadow-lg shadow-amber-500/5 relative overflow-hidden border border-white/5">
                <div className="absolute right-[-10px] bottom-[-10px] w-24 h-24 bg-white/5 rounded-full blur-xl" />
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-white shadow-inner">
                    <UserPlus className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-amber-100 uppercase tracking-wider block">New This Month</span>
                    <span className="text-3xl font-black mt-1 block">{members.length}</span>
                  </div>
                </div>

                <div className="flex border-l border-white/10 pl-6 pr-6 py-1">
                  <div>
                    <span className="text-[9px] text-amber-100 block uppercase font-bold">Today Joined</span>
                    <span className="text-sm font-black text-white block mt-0.5">
                      {members.filter(m => m.joinDate.includes("Today")).length}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Grid of 3 statistic summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-4">
              {teamOverviewStats.map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <div key={idx} className="bg-white border border-gray-100 rounded-3xl p-4 shadow-sm flex items-center justify-between">
                    <div className="text-left">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">{stat.label}</span>
                      <span className="text-lg font-black text-gray-900 mt-1 block">{stat.value}</span>
                      <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold text-emerald-500">
                        {stat.isRank ? null : <TrendingUp className="w-3 h-3" />}
                        <span>{stat.change}</span>
                      </div>
                    </div>
                    
                    <div className={`p-3 rounded-2xl ${stat.bgColor} ${stat.color} shadow-sm shrink-0`}>
                      <Icon className="w-5 h-5 stroke-[2.2]" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Leaderboard and Performance strip layout */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              
              {/* Leaderboard panel list */}
              <div className="xl:col-span-7 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-50">
                  <div>
                    <h3 className="text-base font-extrabold text-gray-900">Direct Team Referrals</h3>
                    <p className="text-xs text-gray-400 font-medium">Ranked by sales performance metrics</p>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {members.length === 0 ? (
                    <div className="py-8 text-center text-xs text-gray-400 font-semibold">No direct referrals yet. Share your link to start recruiting!</div>
                  ) : (
                    members.map((member) => (
                      <div key={member.rank} className="flex items-center justify-between p-2.5 hover:bg-slate-50 border border-transparent hover:border-gray-50 rounded-2xl transition-all">
                        <div className="flex items-center gap-3">
                          {/* Position Indicator Badge */}
                          <div className="w-6 h-6 flex items-center justify-center font-bold text-xs">
                            {member.rank === 1 ? (
                              <span className="w-5 h-5 rounded-full bg-yellow-400 text-white flex items-center justify-center font-black text-[9px] shadow-sm select-none">1</span>
                            ) : member.rank === 2 ? (
                              <span className="w-5 h-5 rounded-full bg-slate-300 text-white flex items-center justify-center font-black text-[9px] shadow-sm select-none">2</span>
                            ) : member.rank === 3 ? (
                              <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center font-black text-[9px] shadow-sm select-none">3</span>
                            ) : (
                              <span className="text-gray-400 text-[10px] font-bold">{member.rank}</span>
                            )}
                          </div>

                          {/* Avatar */}
                          <div className="relative w-9 h-9 rounded-full overflow-hidden border border-gray-150 bg-[#f3f7fd] flex items-center justify-center">
                            <span className="text-[10px] font-bold text-blue-600">{member.name.split(" ").map(w => w[0]).join("")}</span>
                          </div>

                          {/* Name and Date */}
                          <div className="text-left">
                            <h4 className="text-xs font-extrabold text-gray-800 leading-tight">{member.name}</h4>
                            <span className="text-[9px] text-gray-400 font-medium mt-0.5 block">{member.joinDate}</span>
                          </div>
                        </div>

                        {/* Stats columns */}
                        <div className="flex items-center gap-6 text-xs text-right pr-2">
                          <div>
                            <span className="text-[8px] font-bold text-gray-400 uppercase block tracking-wider">Team Sales</span>
                            <span className="text-xs font-extrabold text-gray-800 block mt-0.5">{member.sales}</span>
                          </div>
                          <div className="min-w-[80px]">
                            <span className="text-[8px] font-bold text-gray-400 uppercase block tracking-wider">Rank</span>
                            <span className="text-xs font-extrabold text-blue-600 block mt-0.5">{member.tier}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${
                            member.status === "Active" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-red-50 text-red-500 border border-red-100"
                          }`}>{member.status}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Team Performance curve line graph */}
              <div className="xl:col-span-5 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-gray-50 pb-4 mb-4">
                  <div>
                    <h3 className="text-base font-extrabold text-gray-900">Team Performance</h3>
                    <p className="text-xs text-gray-400 font-medium">Sales progression chart this month</p>
                  </div>
                  
                  {/* Legend filter */}
                  <div className="bg-gray-50 text-[10px] text-gray-500 py-1.5 px-2.5 rounded-lg border border-gray-100 flex items-center gap-1 cursor-pointer font-bold">
                    <span>This Month</span>
                  </div>
                </div>

                <div className="h-[200px] relative w-full flex flex-col justify-between">
                  {/* Gridlines */}
                  <div className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none opacity-40">
                    {[50, 40, 30, 20, 10, 0].map((val, idx) => (
                      <div key={idx} className="flex items-center w-full">
                        <span className="text-[9px] text-gray-400 font-bold w-6 text-right pr-2">{val}K</span>
                        <div className="flex-1 border-b border-dashed border-gray-100" />
                      </div>
                    ))}
                  </div>

                  {/* SVG Chart area */}
                  <svg viewBox="0 0 350 200" className="w-full h-full z-10 pl-6 pr-2">
                    <defs>
                      <linearGradient id="sales-area" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef9f15" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#ef9f15" stopOpacity="0" />
                      </linearGradient>
                    </defs>

                    {/* Active tooltip indicator marker line */}
                    <line x1="180" y1="0" x2="180" y2="175" stroke="#ef9f15" strokeWidth="1" strokeDasharray="3 3" />

                    {/* Gradient Area Fill */}
                    <path d="M 10,150 Q 60,110 110,105 T 180,85 T 250,55 T 320,25 L 320,175 L 10,175 Z" fill="url(#sales-area)" />

                    {/* Line path */}
                    <path d="M 10,150 Q 60,110 110,105 T 180,85 T 250,55 T 320,25" fill="none" stroke="#ef9f15" strokeWidth="3" strokeLinecap="round" />

                    {/* Hover dot */}
                    <circle cx="180" cy="85" r="5.5" fill="#ef9f15" stroke="#fff" strokeWidth="2" />

                    {/* Label tooltip block */}
                    <g transform="translate(150, 35)">
                      <rect width="60" height="24" rx="6" fill="#ef9f15" />
                      <text x="30" y="10" fill="#fff" fontSize="6.5" fontWeight="black" textAnchor="middle">₹18,450</text>
                      <text x="30" y="18" fill="#fff" fontSize="5.5" textAnchor="middle">15 May</text>
                    </g>
                  </svg>

                  {/* X Axis indicators */}
                  <div className="flex justify-between text-[9px] font-bold text-gray-400 pl-6 pr-2 z-20 mt-1">
                    <span>1 May</span>
                    <span>8 May</span>
                    <span>15 May</span>
                    <span>22 May</span>
                    <span>29 May</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom Widgets row (Growth & Leaderboard summary) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card: Team Growth */}
              <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm flex items-center justify-between">
                <div className="text-left">
                  <h4 className="text-xs font-bold text-blue-500 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                    <Users className="w-4 h-4" /> Team Growth
                  </h4>
                  <span className="text-[10px] text-gray-400 font-medium">Growth this month</span>
                  <span className="text-xl font-black text-gray-800 mt-1 block">24 <strong className="text-xs font-bold text-gray-400">New Members</strong></span>
                </div>
                
                {/* Graphics */}
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 relative overflow-hidden shrink-0">
                  <UserPlus className="w-6 h-6 stroke-[2.2]" />
                </div>
              </div>

              {/* Card: Leaderboard Status */}
              <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm flex items-center justify-between">
                <div className="text-left">
                  <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                    <Award className="w-4 h-4" /> Leaderboard Status
                  </h4>
                  <span className="text-[10px] text-gray-400 font-medium">Your Current Rank</span>
                  <span className="text-xl font-black text-gray-800 mt-1 block">Gold <strong className="text-xs font-bold text-gray-400">Tier</strong></span>
                </div>

                <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 shrink-0">
                  <Award className="w-6 h-6 stroke-[2.2]" />
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: NETWORK HIERARCHY TREE VIEW (Interactive SVG matching Image 2) */}
        {/* ========================================================================= */}
        {activeTab === "tree" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Interactive Hierarchy Canvas */}
            <div className="lg:col-span-8 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm overflow-hidden flex flex-col justify-between">
              <div className="border-b border-gray-50 pb-4 mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">Visual Network Hierarchy Tree</h3>
                  <p className="text-xs text-gray-400 font-medium">Click nodes to inspect sub-tree member performance metrics</p>
                </div>
                <div className="flex gap-2 text-[10px] font-bold">
                  <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded">Direct Tier</span>
                  <span className="bg-purple-50 text-purple-600 px-2 py-1 rounded">Indirect Tier</span>
                </div>
              </div>

              {/* Scrollable container for paning tree */}
              <div className="w-full overflow-x-auto pb-4 pt-2 flex justify-center scrollbar-thin select-none bg-[#fdfdfd] border border-dashed border-gray-100 rounded-2xl">
                <div className="relative w-[500px] h-[250px] shrink-0">
                  {/* Connection Lines (Drawn behind nodes) */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    {members.map((m, idx) => {
                      const total = members.length;
                      const spacing = total > 1 ? 400 / (total - 1) : 400;
                      const startX = total > 1 ? 50 : 250;
                      const targetX = startX + idx * spacing;
                      return (
                        <line key={idx} x1="250" y1="35" x2={targetX} y2="110" stroke="#cbd5e1" strokeWidth="1.5" />
                      );
                    })}
                  </svg>

                  {/* Render Node Circles as HTML over SVG */}
                  {Object.values(treeNodes).map((node) => {
                    const isSelected = selectedNodeId === node.id;
                    const isRoot = node.id === "root";
                    const isDirect = node.role === "Direct Refer";

                    return (
                      <button
                        key={node.id}
                        onClick={() => setSelectedNodeId(node.id)}
                        style={{ left: `${node.x - 20}px`, top: `${node.y - 20}px` }}
                        className={`absolute w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 active:scale-90 ${
                          isSelected
                            ? "bg-[#0b5be6] text-white shadow-md ring-4 ring-blue-100 scale-110 z-30"
                            : isRoot
                            ? "bg-slate-800 text-white shadow-md ring-2 ring-slate-200 z-20"
                            : isDirect
                            ? "bg-white text-gray-700 shadow border border-blue-200 hover:border-blue-400 z-10"
                            : "bg-white text-gray-500 shadow-sm border border-gray-150 hover:border-gray-300"
                        }`}
                      >
                        {/* Dynamic User Avatar / Silhouette */}
                        <div className="relative w-8 h-8 rounded-full overflow-hidden">
                          {isRoot ? (
                            <Image src="/avatar.png" alt={node.name} fill sizes="32px" className="object-cover" />
                          ) : (
                            <div className={`w-full h-full flex items-center justify-center font-bold text-[10px] ${
                              isSelected ? "text-white" : isDirect ? "text-blue-600 bg-blue-50" : "text-gray-500 bg-gray-50"
                            }`}>
                              {node.name.split(" ").map(w => w[0]).join("")}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Selected Node details inspector block */}
            <div className="lg:col-span-4 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between min-h-[250px]">
              <div>
                <div className="border-b border-gray-50 pb-4 mb-4 text-left">
                  <h3 className="text-base font-extrabold text-gray-900">Node Information</h3>
                  <p className="text-xs text-gray-400 font-medium">Referral hierarchy metrics card</p>
                </div>

                <div className="flex items-center gap-4.5 mb-6">
                  <div className="relative w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 shadow-inner">
                    <Users className="w-7 h-7" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-base font-black text-gray-900 leading-tight">{selectedNode.name}</h4>
                    <span className="text-[10px] font-bold text-[#0b5be6] uppercase tracking-wider block mt-1">{selectedNode.role}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-b border-gray-50 py-4 my-4">
                  <div className="text-left">
                    <span className="text-[9px] font-bold text-gray-400 block uppercase tracking-wider">Personal Sales</span>
                    <span className="text-sm font-extrabold text-gray-800 block mt-0.5">{selectedNode.sales}</span>
                  </div>
                  <div className="text-left border-l border-gray-50 pl-4">
                    <span className="text-[9px] font-bold text-gray-400 block uppercase tracking-wider">Direct Network</span>
                    <span className="text-sm font-extrabold text-blue-600 block mt-0.5">{selectedNode.members} Referrals</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-bold text-gray-500 mb-2">
                  <span>Tier Achievements</span>
                  <span className="bg-amber-50 text-amber-500 px-2 py-0.5 rounded text-[10px] border border-amber-100">
                    👑 {selectedNode.tier} Tier
                  </span>
                </div>
              </div>

              <button className="w-full mt-4 bg-slate-50 border border-gray-150 hover:bg-slate-100 text-gray-700 font-bold py-2.5 px-4 rounded-xl text-xs transition-all active:scale-[0.98]">
                Inspect Full Team Tree
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
