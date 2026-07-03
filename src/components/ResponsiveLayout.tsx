"use client";

import React, { useState, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import { Bell, Search, ChevronDown, Menu, X, Calendar as CalendarIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import ActivationPage from "./ActivationPage";

interface ResponsiveLayoutProps {
  children: React.ReactNode;
}

export default function ResponsiveLayout({ children }: ResponsiveLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<{
    name: string;
    profilePicUrl: string | null;
    status?: string;
  } | null>(null);

  const isAdminRoute = pathname.startsWith("/admin");
  const isAuthRoute = pathname === "/login" || pathname === "/signup";

  useEffect(() => {
    if (isAdminRoute) return;

    // Validate session on client side
    const authStatus = localStorage.getItem("isAuthenticated") === "true";
    setIsAuthenticated(authStatus);

    if (!authStatus && !isAuthRoute) {
      router.push("/login");
    } else if (authStatus && isAuthRoute) {
      router.push("/");
    }
  }, [pathname, router, isAuthRoute, isAdminRoute]);

  const fetchUserProfile = useCallback(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      fetch("/api/user/profile", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.user) {
            setUser(data.user);
            localStorage.setItem("currentUser", JSON.stringify(data.user));
          }
        })
        .catch((err) => console.error("Error fetching user profile:", err));
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      const cached = localStorage.getItem("currentUser");
      if (cached) {
        try {
          setUser(JSON.parse(cached));
        } catch (e) {
          console.error("Error parsing cached user profile:", e);
        }
      }
      fetchUserProfile();
    } else {
      setUser(null);
    }
  }, [isAuthenticated, fetchUserProfile]);

  if (isAdminRoute) {
    return <>{children}</>;
  }

  // Prevent UI flashing during auth state changes
  if (isAuthenticated === null || (!isAuthenticated && !isAuthRoute) || (isAuthenticated && isAuthRoute)) {
    return (
      <div className="w-screen h-screen bg-gradient-to-tr from-[#0a56e3] via-[#083ca3] to-[#041a4a] flex flex-col items-center justify-center text-white select-none">
        <svg className="animate-spin h-10 w-10 text-white mb-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-xs font-bold tracking-wider uppercase animate-pulse">Verifying Session...</span>
      </div>
    );
  }

  if (isAuthRoute) {
    return (
      <div className="w-full h-full min-h-screen overflow-y-auto bg-[#f3f7fd]">
        {children}
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f3f7fd]">
      {/* ========================================================================= */}
      {/* DESKTOP SIDEBAR (Static on lg+) */}
      {/* ========================================================================= */}
      <aside className="hidden lg:block shrink-0">
        <Sidebar />
      </aside>

      {/* ========================================================================= */}
      {/* MOBILE DRAWER SIDEBAR (Slide-over menu) */}
      {/* ========================================================================= */}
      {isDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative flex w-64 max-w-xs flex-1 flex-col bg-gradient-to-b from-[#0c4cc6] to-[#04287a] focus:outline-none transition-transform duration-300">
            {/* Close Button */}
            <div className="absolute top-4 right-4 z-10">
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white focus:outline-none"
                onClick={() => setIsDrawerOpen(false)}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Sidebar content */}
            <Sidebar onClose={() => setIsDrawerOpen(false)} />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MAIN CONTAINER */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* ========================================================================= */}
        {/* DESKTOP TOP HEADER (Visible on lg+) */}
        {/* ========================================================================= */}
        <header className="hidden lg:flex shrink-0 h-20 items-center justify-between px-8 bg-white border-b border-gray-100 shadow-sm z-30">
          {/* Search bar */}
          <div className="w-96 relative">
            <input
              type="text"
              placeholder="Search here..."
              className="w-full bg-[#f3f7fd] text-sm text-gray-700 pl-4 pr-12 py-2.5 rounded-full border border-transparent focus:bg-white focus:border-blue-400 focus:outline-none transition-all duration-200"
            />
            <button className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#0b5be6]">
              <Search className="w-5 h-5" />
            </button>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-6">
            {/* Date range picker */}
            <div className="flex items-center gap-2 bg-[#f3f7fd] border border-gray-100 rounded-xl px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors select-none">
              <CalendarIcon className="w-4 h-4 text-blue-500" />
              <span>15 May 2024 - 21 May 2024</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </div>

            {/* Notification icon */}
            <button className="relative p-2.5 bg-[#f3f7fd] hover:bg-blue-50 rounded-xl text-gray-600 hover:text-[#0b5be6] transition-all cursor-pointer">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-[10px] text-white font-black rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                3
              </span>
            </button>

            {/* Vertical Divider */}
            <div className="w-px h-8 bg-gray-100" />

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                className="flex items-center gap-3 hover:bg-gray-50 p-1.5 rounded-xl transition-all"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
              >
                <div className="relative w-10 h-10 rounded-xl overflow-hidden border-2 border-blue-100 bg-gray-150">
                  {user?.profilePicUrl ? (
                    <img
                      src={user.profilePicUrl}
                      alt={user.name ?? "Profile"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Image
                      src="/avatar.png"
                      alt="User Avatar"
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="text-left hidden xl:block select-none">
                  <h4 className="text-sm font-bold text-gray-800">{user?.name ?? "User"}</h4>
                  <p className="text-[10px] font-black text-amber-500 uppercase tracking-wide">
                    {user?.status === "Active" ? "Active Member" : "Gold Member"}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl py-2 z-50">
                  <Link
                    href="/settings"
                    onClick={() => setIsProfileOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-[#0b5be6]"
                  >
                    My Profile
                  </Link>
                  <Link
                    href="/wallet"
                    onClick={() => setIsProfileOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-[#0b5be6]"
                  >
                    Wallet Details
                  </Link>
                  <hr className="my-1 border-gray-100" />
                  <button
                    onClick={() => {
                      localStorage.setItem("isAuthenticated", "false");
                      setIsProfileOpen(false);
                      router.push("/login");
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* MOBILE TOP HEADER */}
        {/* ========================================================================= */}
        <header className="lg:hidden shrink-0 h-16 flex items-center justify-between px-4 bg-white border-b border-gray-100 shadow-sm z-30">
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="p-2 text-gray-600 hover:text-gray-800 focus:outline-none"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-base font-bold text-gray-800">
            {pathname === "/"
              ? "Overview"
              : pathname === "/my-team"
                ? "My Team"
                : pathname === "/users/dashboard"
                  ? "My Dashboard"
                  : pathname === "/wallet"
                    ? "Wallet"
                    : pathname === "/commission"
                      ? "Commission"
                      : pathname === "/reports"
                        ? "Reports"
                        : pathname === "/rank-rewards"
                          ? "Rank & Rewards"
                          : pathname === "/notifications"
                            ? "Notifications"
                            : pathname === "/messages"
                              ? "Messages"
                              : pathname === "/calendar"
                                ? "Calendar"
                                : pathname === "/settings"
                                  ? "Profile"
                                  : pathname === "/help-support"
                                    ? "Help & Support"
                                    : pathname === "/packages"
                                      ? "Investment Packages"
                                      : "haventust"}
          </h1>
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="relative w-8 h-8 rounded-lg overflow-hidden border border-blue-100 bg-gray-150 flex items-center justify-center focus:outline-none active:scale-95 transition-transform"
            >
              {user?.profilePicUrl ? (
                <img
                  src={user.profilePicUrl}
                  alt={user.name ?? "Profile"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Image
                  src="/avatar.png"
                  alt="User Avatar"
                  fill
                  className="object-cover"
                />
              )}
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-36 bg-white border border-gray-100 rounded-xl shadow-xl py-1.5 z-50">
                <Link
                  href="/settings"
                  onClick={() => setIsProfileOpen(false)}
                  className="block px-4 py-2 text-xs font-bold text-gray-700 hover:bg-blue-50"
                >
                  My Profile
                </Link>
                <hr className="my-1 border-gray-50" />
                <button
                  onClick={() => {
                    localStorage.setItem("isAuthenticated", "false");
                    setIsProfileOpen(false);
                    router.push("/login");
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 cursor-pointer"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>

        {/* ========================================================================= */}
        {/* PAGE CONTENT CONTAINER */}
        {/* ========================================================================= */}
        <main className="flex-1 overflow-y-auto pb-24 lg:pb-8 bg-[#f4f7fe] focus:outline-none">
          {user?.status === "PendingActivation" ? (
            <ActivationPage user={user} onRefreshProfile={fetchUserProfile} />
          ) : (
            children
          )}
        </main>

        {/* ========================================================================= */}
        {/* MOBILE BOTTOM NAVIGATION */}
        {/* ========================================================================= */}
        <BottomNav />
      </div>
    </div>
  );
}
