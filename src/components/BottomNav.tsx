"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Wallet, User, Lock } from "lucide-react";

export default function BottomNav() {
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

  const navItems = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "My Team", href: "/my-team", icon: Users },
    { name: "Wallet", href: "/wallet", icon: Wallet },
    { name: "Profile", href: "/settings", icon: User }
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-2 flex items-center justify-between z-50 shadow-[0_-4px_16px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => {
        // Handle active matching
        const isActive =
          item.href === "/"
            ? (pathname === "/" || pathname === "/users/dashboard")
            : pathname.startsWith(item.href);
        const Icon = item.icon;

        // Check if item should show a lock
        const showLock = isPending && item.href === "/wallet";

        if (isActive) {
          return (
            <Link
              key={item.name}
              href={item.href}
              className="bg-[#0b5be6] text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all duration-300 transform scale-100 select-none shadow-sm shadow-blue-500/20"
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-semibold tracking-wide whitespace-nowrap flex items-center gap-1">
                {item.name}
                {showLock && <Lock className="w-3 h-3 text-white shrink-0" />}
              </span>
            </Link>
          );
        }

        return (
          <Link
            key={item.name}
            href={item.href}
            className="flex flex-col items-center justify-center py-1 px-3 text-gray-400 active:text-gray-600 transition-all select-none hover:text-gray-500"
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span className="text-[9px] font-medium tracking-wide flex items-center gap-0.5">
              {item.name}
              {showLock && <Lock className="w-2.5 h-2.5 text-gray-400 shrink-0" />}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
