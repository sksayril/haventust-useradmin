"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UserCircle2,
  Users,
  BookOpen,
  ShoppingBag,
  Wallet,
  Percent,
  FileText,
  Award,
  Bell,
  MessageSquare,
  Calendar,
  Settings,
  HelpCircle,
  Crown,
  Lock
} from "lucide-react";

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const [isPending, setIsPending] = React.useState(false);

  React.useEffect(() => {
    const cached = localStorage.getItem("currentUser");
    if (cached) {
      try {
        const u = JSON.parse(cached);
        setIsPending(u.status === "PendingActivation");
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const menuItems = [
    { name: "Overview", href: "/", icon: LayoutDashboard },
    { name: "My Dashboard", href: "/users/dashboard", icon: UserCircle2 },
    { name: "Investment Packages", href: "/packages", icon: ShoppingBag },
    { name: "My Team", href: "/my-team", icon: Users },
    { name: "Wallet", href: "/wallet", icon: Wallet },
    { name: "Commission", href: "/commission", icon: Percent },
    { name: "Reports", href: "/reports", icon: FileText },
    { name: "Rank & Rewards", href: "/rank-rewards", icon: Award },
    {
      name: "Notifications",
      href: "/notifications",
      icon: Bell,
      badge: 3
    },
    { name: "Messages", href: "/messages", icon: MessageSquare },
    { name: "Calendar", href: "/calendar", icon: Calendar },
    { name: "Settings", href: "/settings", icon: Settings },
    { name: "Help & Support", href: "/help-support", icon: HelpCircle }
  ];

  return (
    <div className="w-64 h-screen bg-gradient-to-b from-[#0c4cc6] to-[#04287a] text-white flex flex-col justify-between py-6 overflow-y-auto shrink-0 select-none">
      {/* Brand Header */}
      <div>
        <div className="px-6 mb-6 flex items-center gap-3">
          <div className="bg-white/95 text-[#0c4cc6] font-black w-10 h-10 rounded-xl flex items-center justify-center text-2xl shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
            H
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-wide">haventust</h2>
            <p className="text-[10px] text-blue-200/90 font-medium tracking-wider uppercase">
              Learn • Grow • Earn
            </p>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex flex-col gap-1 pr-0">
          {menuItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            const Icon = item.icon;

            // Check if this menu item is locked
            const isLocked = isPending && item.href !== "/" && item.href !== "/users/dashboard";

            if (isLocked) {
              return (
                <div
                  key={item.name}
                  className="group flex items-center justify-between py-2.5 px-6 opacity-45 cursor-not-allowed text-blue-200 hover:text-blue-200 rounded-lg mx-4 select-none text-sm"
                  title="Activate your account to unlock this tab"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 shrink-0 text-blue-300" />
                    <span>{item.name}</span>
                  </div>
                  <Lock className="w-3.5 h-3.5 text-blue-300 shrink-0" />
                </div>
              );
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={`group flex items-center justify-between py-2.5 px-6 transition-all text-sm ${isActive
                    ? "bg-white text-[#0c4cc6] font-semibold rounded-l-full ml-4 shadow-md"
                    : "text-blue-100 hover:text-white hover:bg-white/10 rounded-lg mx-4"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-5 h-5 shrink-0 ${isActive ? "text-[#0c4cc6]" : "text-blue-200 group-hover:text-white"
                      }`}
                  />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive ? "bg-red-500 text-white" : "bg-orange-500 text-white"
                      }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Upgrade to Pro Card */}
      {isPending && (
        <div className="px-4 mt-6">
          <div className="bg-gradient-to-br from-[#1d6bf3] to-[#0433a5] border border-blue-400/20 rounded-2xl p-4 shadow-lg relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-white/5 rounded-full blur-xl" />
            <div className="flex items-start justify-between mb-3">
              <div className="bg-yellow-400/20 p-2 rounded-lg">
                <Crown className="w-6 h-6 text-yellow-400 fill-yellow-400/20" />
              </div>
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Upgrade to Pro Plan</h3>
            <p className="text-xs text-blue-200 mb-4 leading-relaxed">
              Unlock more benefits and higher earnings
            </p>
            <button className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold py-2 px-4 rounded-xl text-xs transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-orange-500/20">
              Upgrade Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
