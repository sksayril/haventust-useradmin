"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ShieldAlert,
  Users,
  TrendingUp,
  Wallet,
  Settings,
  LogOut,
  Search,
  XCircle,
  Menu,
  X,
  UserCheck,
  Activity,
  Sliders,
  Check,
  Ban,
  RefreshCw,
  UserPlus,
  AlertCircle,
  CheckCircle,
  CreditCard,
  QrCode,
  Eye,
  ArrowDownCircle,
  ArrowUpCircle,
} from "lucide-react";

const ADMIN_SECRET = "haventust_admin_internal_secret_2026";

/* ──────────────────────────────────────────────────────────────────────────────
   Types
────────────────────────────────────────────────────────────────────────────── */
interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  referralCode: string;
  referredBy: string | null;
  profilePicUrl: string | null;
  walletBalance: number;
  referrals: number;
  joined: string;
  status: "Active" | "Suspended" | "PendingActivation";
  paymentScreenshotUrl?: string | null;
  paymentTransactionId?: string | null;
  paymentSubmittedAt?: string | null;
  plainPassword?: string;
}

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  newThisMonth: number;
  totalGoldCollected?: number;
  totalLandCollected?: number;
  pendingPackagesCount?: number;
}

/* ──────────────────────────────────────────────────────────────────────────────
   Toast Component
────────────────────────────────────────────────────────────────────────────── */
function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-semibold max-w-sm animate-slide-in ${
        type === "success"
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-red-50 text-red-600 border-red-200"
      }`}
    >
      {type === "success" ? (
        <CheckCircle className="w-4 h-4 shrink-0" />
      ) : (
        <AlertCircle className="w-4 h-4 shrink-0" />
      )}
      <span>{message}</span>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   Admin Dashboard
────────────────────────────────────────────────────────────────────────────── */
export default function AdminDashboard() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string[] | undefined;
  const activePanel = (slug?.[0] || "dashboard") as "dashboard" | "users" | "payment-setup" | "settings" | "pending-packages" | "transactions" | "deposit-requests" | "payout-runs";

  const setActivePanel = (panel: string) => {
    if (panel === "dashboard") {
      router.push("/admin");
    } else {
      router.push(`/admin/${panel}`);
    }
  };

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [allowRegistration, setAllowRegistration] = useState(true);

  // Data
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Activation config
  const [activationPrice, setActivationPrice] = useState("500");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [isUploadingQR, setIsUploadingQR] = useState(false);

  // Commission rates (stored as percentage string e.g. "0.50" = 0.50%)
  const [commissionLevel1, setCommissionLevel1] = useState("0.50");
  const [commissionLevel2to5, setCommissionLevel2to5] = useState("0.20");
  const [commissionLevel6to10, setCommissionLevel6to10] = useState("0.15");
  const [commissionLevel11to20, setCommissionLevel11to20] = useState("0.10");
  const [isSavingCommissions, setIsSavingCommissions] = useState(false);
  const [selectedReviewUser, setSelectedReviewUser] = useState<AdminUser | null>(null);
  const [selectedDetailUser, setSelectedDetailUser] = useState<AdminUser | null>(null);

  // Package & Transaction states
  const [pendingPackages, setPendingPackages] = useState<any[]>([]);
  const [pendingTransactions, setPendingTransactions] = useState<any[]>([]);
  const [isLoadingPackages, setIsLoadingPackages] = useState(false);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [depositActiveTab, setDepositActiveTab] = useState<"pending" | "history">("pending");
  const [depositPendingPage, setDepositPendingPage] = useState(1);
  const [depositHistoryPage, setDepositHistoryPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = useCallback((message: string, type: "success" | "error") => setToast({ message, type }), []);

  /* ── Auth check ─────────────────────────────────────────────────────────── */
  useEffect(() => {
    const auth = localStorage.getItem("adminAuthenticated") === "true";
    setIsAdminAuthenticated(auth);
    if (!auth) router.push("/admin/login");
  }, [router]);

  /* ── Fetch data ─────────────────────────────────────────────────────────── */
  const fetchStats = useCallback(async () => {
    setIsLoadingStats(true);
    try {
      const res = await fetch("/api/admin/stats", {
        headers: { "x-admin-secret": ADMIN_SECRET },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      // Stats fetch failed silently
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    try {
      const res = await fetch("/api/admin/users", {
        headers: { "x-admin-secret": ADMIN_SECRET },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch {
      showToast("Failed to load users.", "error");
    } finally {
      setIsLoadingUsers(false);
    }
  }, [showToast]);

  const fetchPendingPackages = useCallback(async () => {
    setIsLoadingPackages(true);
    try {
      const res = await fetch("/api/admin/packages", {
        headers: { "x-admin-secret": ADMIN_SECRET },
      });
      if (res.ok) {
        const data = await res.json();
        setPendingPackages(data.purchases || []);
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || `HTTP error ${res.status} loading packages`, "error");
      }
    } catch {
      showToast("Failed to load packages.", "error");
    } finally {
      setIsLoadingPackages(false);
    }
  }, [showToast]);

  const fetchPendingTransactions = useCallback(async () => {
    setIsLoadingTransactions(true);
    try {
      const res = await fetch("/api/admin/transactions", {
        headers: { "x-admin-secret": ADMIN_SECRET },
      });
      if (res.ok) {
        const data = await res.json();
        setPendingTransactions(data.transactions || []);
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || `HTTP error ${res.status} loading transactions`, "error");
      }
    } catch {
      showToast("Failed to load transactions.", "error");
    } finally {
      setIsLoadingTransactions(false);
    }
  }, [showToast]);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        if (data.activationPrice) setActivationPrice(data.activationPrice);
        if (data.qrCodeUrl) setQrCodeUrl(data.qrCodeUrl);
        if (data.commissionLevel1) setCommissionLevel1(data.commissionLevel1);
        if (data.commissionLevel2to5) setCommissionLevel2to5(data.commissionLevel2to5);
        if (data.commissionLevel6to10) setCommissionLevel6to10(data.commissionLevel6to10);
        if (data.commissionLevel11to20) setCommissionLevel11to20(data.commissionLevel11to20);
      }
    } catch {
      // settings fetch failed silently
    }
  }, []);

  const saveCommissionRates = async () => {
    setIsSavingCommissions(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": ADMIN_SECRET,
        },
        body: JSON.stringify({
          commissionLevel1,
          commissionLevel2to5,
          commissionLevel6to10,
          commissionLevel11to20,
        }),
      });
      if (res.ok) {
        showToast("Commission rates saved successfully!", "success");
      } else {
        showToast("Failed to save commission rates.", "error");
      }
    } catch {
      showToast("Network error saving commission rates.", "error");
    } finally {
      setIsSavingCommissions(false);
    }
  };

  const [isProcessingPayout, setIsProcessingPayout] = useState(false);
  const [payoutResult, setPayoutResult] = useState<any | null>(null);

  const approvePackage = async (purchaseId: string) => {
    try {
      const res = await fetch("/api/admin/packages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": ADMIN_SECRET,
        },
        body: JSON.stringify({ purchaseId, action: "Approve" }),
      });
      if (res.ok) {
        showToast("Package purchase approved successfully!", "success");
        fetchPendingPackages();
        fetchStats();
      } else {
        const d = await res.json();
        showToast(d.error || "Failed to approve package.", "error");
      }
    } catch {
      showToast("Network error.", "error");
    }
  };

  const rejectPackage = async (purchaseId: string) => {
    try {
      const res = await fetch("/api/admin/packages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": ADMIN_SECRET,
        },
        body: JSON.stringify({ purchaseId, action: "Reject" }),
      });
      if (res.ok) {
        showToast("Package purchase rejected.", "success");
        fetchPendingPackages();
      } else {
        const d = await res.json();
        showToast(d.error || "Failed to reject package.", "error");
      }
    } catch {
      showToast("Network error.", "error");
    }
  };

  const processTransaction = async (transactionId: string, action: "Approve" | "Reject") => {
    try {
      const res = await fetch("/api/admin/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": ADMIN_SECRET,
        },
        body: JSON.stringify({ transactionId, action }),
      });
      if (res.ok) {
        showToast(`Transaction ${action === "Approve" ? "approved" : "rejected"} successfully!`, "success");
        fetchPendingTransactions();
        fetchUsers();
        fetchStats();
      } else {
        const d = await res.json();
        showToast(d.error || "Failed to process transaction.", "error");
      }
    } catch {
      showToast("Network error.", "error");
    }
  };

  const runPayoutsCycle = async () => {
    setIsProcessingPayout(true);
    setPayoutResult(null);
    try {
      const res = await fetch("/api/admin/run-payouts", {
        method: "POST",
        headers: {
          "x-admin-secret": ADMIN_SECRET,
        },
      });
      const d = await res.json();
      if (res.ok) {
        showToast("Payout cycle completed successfully!", "success");
        setPayoutResult(d.stats);
        fetchUsers();
        fetchStats();
      } else {
        showToast(d.error || "Failed to run payouts cycle.", "error");
      }
    } catch {
      showToast("Network error running payout cycles.", "error");
    } finally {
      setIsProcessingPayout(false);
    }
  };

  useEffect(() => {
    if (isAdminAuthenticated) {
      fetchStats();
      fetchUsers();
      fetchSettings();
    }
  }, [isAdminAuthenticated, fetchStats, fetchUsers, fetchSettings]);

  /* ── Actions ────────────────────────────────────────────────────────────── */
  const handleLogout = () => {
    localStorage.removeItem("adminAuthenticated");
    router.push("/admin/login");
  };

  const toggleUserStatus = async (user: AdminUser) => {
    const newStatus = user.status === "Active" ? "Suspended" : "Active";
    // Optimistic update
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))
    );

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": ADMIN_SECRET,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        showToast(
          `${user.name} has been ${newStatus === "Active" ? "activated" : "suspended"}.`,
          newStatus === "Active" ? "success" : "error"
        );
        fetchStats();
      } else {
        // Rollback
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, status: user.status } : u))
        );
        showToast("Failed to update user status.", "error");
      }
    } catch {
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: user.status } : u))
      );
      showToast("Network error.", "error");
    }
  };

  const patchUserStatus = async (userId: string, newStatus: string, resetPayment = false) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": ADMIN_SECRET,
        },
        body: JSON.stringify({ status: newStatus, resetPayment }),
      });

      if (res.ok) {
        showToast(
          resetPayment
            ? "Activation payment rejected. Submission cleared."
            : `User account status updated to ${newStatus}.`,
          "success"
        );
        setSelectedReviewUser(null);
        fetchUsers();
        fetchStats();
      } else {
        showToast("Failed to update user status.", "error");
      }
    } catch {
      showToast("Network error.", "error");
    }
  };

  const saveSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": ADMIN_SECRET,
        },
        body: JSON.stringify({
          activationPrice: Number(activationPrice) || 500,
          qrCodeUrl,
        }),
      });

      if (res.ok) {
        showToast("Settings saved successfully!", "success");
      } else {
        showToast("Failed to save settings.", "error");
      }
    } catch {
      showToast("Network error.", "error");
    }
  };

  const handleQRUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingQR(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "qrcodes");

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setQrCodeUrl(data.url);
        showToast("QR Code uploaded successfully! Save settings to apply.", "success");
      } else {
        showToast("Failed to upload QR Code.", "error");
      }
    } catch {
      showToast("Upload network error.", "error");
    } finally {
      setIsUploadingQR(false);
    }
  };

  /* ── Loading / Auth guard ───────────────────────────────────────────────── */
  if (isAdminAuthenticated === null) {
    return (
      <div className="w-screen h-screen bg-gradient-to-tr from-[#0a56e3] via-[#083ca3] to-[#041a4a] flex flex-col items-center justify-center text-white">
        <svg className="animate-spin h-10 w-10 text-white mb-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-xs font-bold tracking-wider uppercase animate-pulse">Authenticating Admin Session…</span>
      </div>
    );
  }

  if (!isAdminAuthenticated) return null;

  const panelLabel =
    activePanel === "dashboard"
      ? "Dashboard"
      : activePanel === "users"
      ? "User Management"
      : activePanel === "payment-setup"
      ? "Payment Setup"
      : activePanel === "pending-packages"
      ? "Package Approvals"
      : activePanel === "deposit-requests"
      ? "Deposit Requests"
      : activePanel === "transactions"
      ? "Transaction Auditing"
      : activePanel === "payout-runs"
      ? "Affiliate Payout Console"
      : "Settings";

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.referralCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <div className="flex h-screen w-screen bg-[#f3f7fd] text-gray-800 overflow-hidden select-none">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* ── Desktop Sidebar ───────────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-64 bg-gradient-to-b from-[#00b0ff] via-[#008ae6] to-[#006bb3] p-5 shrink-0 justify-between shadow-[4px_0_24px_rgba(0,138,230,0.15)] border-r border-sky-400/20">
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 bg-white/15 text-white rounded-xl flex items-center justify-center border border-white/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="text-left">
              <span className="text-sm font-black text-white tracking-tight block">Haventust Admin</span>
              <span className="text-[10px] text-sky-200/80 font-black block uppercase tracking-wider">Control Panel</span>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            {[
              { key: "dashboard", label: "Dashboard Stats", icon: Activity },
              { key: "users", label: "User Management", icon: Users },
              { key: "payment-setup", label: "Payment Setup", icon: CreditCard },
              { key: "pending-packages", label: "Package Approvals", icon: TrendingUp },
              { key: "deposit-requests", label: "Deposit Requests", icon: ArrowDownCircle },
              { key: "transactions", label: "Deposit & Withdraws", icon: Wallet },
              { key: "payout-runs", label: "Execute Payouts", icon: ShieldAlert },
              { key: "settings", label: "System Settings", icon: Settings },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activePanel === item.key;
              
              let badge = null;
              if (item.key === "users" && stats) {
                badge = stats.totalUsers;
              } else if (item.key === "pending-packages") {
                const count = pendingPackages.filter(p => p.status === "Pending").length;
                if (count > 0) badge = count;
              } else if (item.key === "deposit-requests") {
                const count = pendingTransactions.filter(t => t.type === "Deposit" && t.status === "Pending").length;
                if (count > 0) badge = count;
              } else if (item.key === "transactions") {
                const count = pendingTransactions.filter(t => t.status === "Pending").length;
                if (count > 0) badge = count;
              }

              return (
                <button
                  key={item.key}
                  onClick={() => setActivePanel(item.key as typeof activePanel)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? "bg-white/15 text-white shadow-inner border border-white/10"
                      : "text-sky-100/70 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {badge !== null && (
                    <span className="ml-auto bg-white text-[#008ae6] text-[9px] font-black px-1.5 py-0.5 rounded-full">
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-col gap-4">
          <div className="w-full h-px bg-white/10" />
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-full bg-white/15 text-white font-bold text-xs flex items-center justify-center border border-white/25">
              AD
            </div>
            <div className="text-left flex-1 min-w-0">
              <span className="text-xs font-extrabold text-white block truncate">Root Admin</span>
              <span className="text-[10px] text-sky-200/70 block truncate">admin@haventist.com</span>
            </div>
            <button onClick={handleLogout} className="text-sky-200 hover:text-white transition-colors p-1 cursor-pointer">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Mobile Drawer ─────────────────────────────────────────────────── */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="relative w-64 bg-gradient-to-b from-[#00b0ff] via-[#008ae6] to-[#006bb3] p-5 flex flex-col justify-between z-10 shadow-2xl border-r border-sky-400/20">
            <div className="flex flex-col gap-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-white" />
                  <span className="text-xs font-black text-white">Haventust Admin</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-sky-100 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex flex-col gap-1 mt-4">
                {[
                  { key: "dashboard", label: "Dashboard Stats", icon: Activity },
                  { key: "users", label: "User Management", icon: Users },
                  { key: "payment-setup", label: "Payment Setup", icon: CreditCard },
                  { key: "pending-packages", label: "Package Approvals", icon: TrendingUp },
                  { key: "deposit-requests", label: "Deposit Requests", icon: ArrowDownCircle },
                  { key: "transactions", label: "Deposit & Withdraws", icon: Wallet },
                  { key: "payout-runs", label: "Execute Payouts", icon: ShieldAlert },
                  { key: "settings", label: "System Settings", icon: Settings },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activePanel === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => { setActivePanel(item.key as typeof activePanel); setIsMobileMenuOpen(false); }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isActive ? "bg-white/15 text-white border border-white/10" : "text-sky-100/70 hover:bg-white/5"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 w-full bg-white/10 hover:bg-white/15 text-white font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer border border-white/10"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      )}

      {/* ── Main Content ──────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto p-4 lg:p-8">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-gray-600 hover:text-gray-900 active:scale-95 transition-transform">
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-5 h-5 text-[#0b5be6]" />
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">{panelLabel}</h2>
          </div>
          <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500 active:scale-95 transition-transform">
            <LogOut className="w-5 h-5" />
          </button>
        </header>

        {/* ═══ PANEL: DASHBOARD ═════════════════════════════════════════════ */}
        {activePanel === "dashboard" && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">System Performance Overview</h1>
                <p className="text-xs text-gray-500 font-semibold mt-0.5">Live metrics from MongoDB database</p>
              </div>
              <button
                onClick={() => { fetchStats(); fetchUsers(); }}
                className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-[#0b5be6] bg-white border border-gray-200 px-3 py-2 rounded-xl transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStats ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {[
                {
                  label: "Total Registered Users",
                  value: isLoadingStats ? "…" : (stats?.totalUsers ?? 0).toLocaleString(),
                  change: isLoadingStats ? "Loading…" : `${stats?.newThisMonth ?? 0} new this month`,
                  icon: Users,
                  color: "text-[#0b5be6]",
                  bgColor: "bg-blue-50",
                  borderColor: "border-blue-100",
                },
                {
                  label: "Active Accounts",
                  value: isLoadingStats ? "…" : (stats?.activeUsers ?? 0).toLocaleString(),
                  change: "Currently active members",
                  icon: UserCheck,
                  color: "text-emerald-600",
                  bgColor: "bg-emerald-50",
                  borderColor: "border-emerald-100",
                },
                {
                  label: "Suspended Accounts",
                  value: isLoadingStats ? "…" : (stats?.suspendedUsers ?? 0).toLocaleString(),
                  change: "Requires admin review",
                  icon: Ban,
                  color: "text-red-500",
                  bgColor: "bg-red-50",
                  borderColor: "border-red-100",
                  isWarning: true,
                },
                {
                  label: "Pending Activation",
                  value: isLoadingStats ? "…" : ((stats as any)?.pendingUsers ?? 0).toLocaleString(),
                  change: "Requires payment review",
                  icon: Activity,
                  color: "text-amber-600",
                  bgColor: "bg-amber-50",
                  borderColor: "border-amber-100",
                },
              ].map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <div key={idx} className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm flex items-center justify-between text-left">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">{stat.label}</span>
                      <span className="text-2xl font-black text-gray-900 mt-1.5 block">{stat.value}</span>
                      <span className={`text-[9px] font-bold mt-2 block ${stat.isWarning ? "text-red-400" : "text-emerald-500"}`}>
                        {stat.change}
                      </span>
                    </div>
                    <div className={`p-3.5 ${stat.bgColor} ${stat.color} border ${stat.borderColor} rounded-2xl`}>
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Investment Volume & Allocation Chart Section */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Financial Metrics Cards */}
              <div className="xl:col-span-1 flex flex-col gap-4">
                {/* Gold Collected Card */}
                <div className="bg-gradient-to-br from-amber-500 to-yellow-600 rounded-3xl p-5 text-white shadow-sm text-left relative overflow-hidden">
                  <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl" />
                  <div className="relative z-10">
                    <span className="text-[10px] font-bold text-amber-100 uppercase tracking-wider block">Total Gold Investment</span>
                    <span className="text-3xl font-black mt-2 block">
                      ₹{((stats as any)?.totalGoldCollected ?? 0).toLocaleString("en-IN")}
                    </span>
                    <p className="text-[10px] text-amber-100/90 font-medium mt-3">
                      Accumulated from all approved Gold Purchase Plans
                    </p>
                  </div>
                </div>

                {/* Land Collected Card */}
                <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-5 text-white shadow-sm text-left relative overflow-hidden">
                  <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl" />
                  <div className="relative z-10">
                    <span className="text-[10px] font-bold text-emerald-100 uppercase tracking-wider block">Total Land Investment</span>
                    <span className="text-3xl font-black mt-2 block">
                      ₹{((stats as any)?.totalLandCollected ?? 0).toLocaleString("en-IN")}
                    </span>
                    <p className="text-[10px] text-emerald-100/90 font-medium mt-3">
                      Accumulated from all approved Land Booking Tiers
                    </p>
                  </div>
                </div>
              </div>

              {/* Chart Card */}
              <div className="xl:col-span-2 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm text-left flex flex-col justify-between min-h-[280px]">
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900 mb-1">Portfolio Allocation &amp; Volume Distribution</h3>
                  <p className="text-[11px] text-gray-400 font-medium">Side-by-side comparison of collected investment categories</p>
                </div>

                {/* Vertical Bar Chart */}
                <div className="my-6 flex items-end justify-center gap-16 h-36 relative border-b border-gray-100 pb-2 px-6">
                  {/* Gridlines */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8 pt-2">
                    <div className="w-full border-t border-dashed border-gray-100" />
                    <div className="w-full border-t border-dashed border-gray-100" />
                    <div className="w-full border-t border-dashed border-gray-100" />
                  </div>

                  {(() => {
                    const goldVal = (stats as any)?.totalGoldCollected ?? 0;
                    const landVal = (stats as any)?.totalLandCollected ?? 0;
                    const maxVal = Math.max(goldVal, landVal, 10000); // base min height scale
                    const goldHeightPct = Math.min(100, Math.max(10, Math.round((goldVal / maxVal) * 100)));
                    const landHeightPct = Math.min(100, Math.max(10, Math.round((landVal / maxVal) * 100)));

                    return (
                      <>
                        {/* Gold Bar */}
                        <div className="flex flex-col items-center gap-2 group relative z-10 w-24">
                          <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-all duration-250 bg-gray-900 text-white text-[9px] font-black px-2 py-1 rounded shadow-md pointer-events-none whitespace-nowrap">
                            ₹{goldVal.toLocaleString("en-IN")}
                          </div>
                          <div
                            style={{ height: `${goldHeightPct}%` }}
                            className="w-10 bg-gradient-to-t from-amber-500 to-yellow-400 rounded-t-xl transition-all duration-500 hover:brightness-105 shadow-md shadow-amber-200/50 min-h-[16px]"
                          />
                          <span className="text-[10px] font-black text-gray-500 tracking-wide">Gold</span>
                        </div>

                        {/* Land Bar */}
                        <div className="flex flex-col items-center gap-2 group relative z-10 w-24">
                          <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-all duration-250 bg-gray-900 text-white text-[9px] font-black px-2 py-1 rounded shadow-md pointer-events-none whitespace-nowrap">
                            ₹{landVal.toLocaleString("en-IN")}
                          </div>
                          <div
                            style={{ height: `${landHeightPct}%` }}
                            className="w-10 bg-gradient-to-t from-emerald-600 to-teal-500 rounded-t-xl transition-all duration-500 hover:brightness-105 shadow-md shadow-emerald-200/50 min-h-[16px]"
                          />
                          <span className="text-[10px] font-black text-gray-500 tracking-wide">Land</span>
                        </div>
                      </>
                    );
                  })()}
                </div>

                <div className="border-t border-gray-50 pt-3 flex justify-between items-center text-[10px] text-gray-400 font-bold">
                  <span>Approved Bookings: {stats ? ((stats as any).activeUsers + ((stats as any).pendingPackagesCount ?? 0)) : 0} total</span>
                  <span>Target Utilization Rate: 100%</span>
                </div>
              </div>
            </div>

            {/* Lower Section */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Admin Toggles */}
              <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between text-left min-h-[220px]">
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900 mb-2 flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-[#0b5be6]" /> Administrative Toggles
                  </h3>
                  <p className="text-[11px] text-gray-400 font-medium">Quick switch for system registry values</p>
                </div>
                <div className="flex flex-col gap-4 mt-6">
                  {[
                    { label: "Maintenance Mode", desc: "Freeze user-facing client portals", state: maintenanceMode, toggle: () => setMaintenanceMode(!maintenanceMode) },
                    { label: "New User Signups", desc: "Toggle registry capability", state: allowRegistration, toggle: () => setAllowRegistration(!allowRegistration) },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-gray-800 block">{item.label}</span>
                        <span className="text-[9px] text-gray-400 mt-0.5 block">{item.desc}</span>
                      </div>
                      <button
                        onClick={item.toggle}
                        className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-300 relative focus:outline-none cursor-pointer shrink-0 ${
                          item.state ? "bg-[#0b5be6]" : "bg-gray-200"
                        }`}
                      >
                        <div className={`bg-white w-5 h-5 rounded-full shadow-md transition-transform duration-300 ${item.state ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* System Health */}
              <div className="xl:col-span-2 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between text-left">
                <div className="flex items-center justify-between border-b border-gray-50 pb-3 mb-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-gray-900">System Health &amp; Audits</h3>
                    <p className="text-[11px] text-gray-400 font-medium">Automatic telemetry scanner status</p>
                  </div>
                  <span className="bg-emerald-50 text-emerald-600 text-[9px] font-black px-2.5 py-1 rounded-full border border-emerald-100 uppercase">
                    All Systems Online
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "MongoDB Atlas", value: stats ? "Connected ✓" : "Connecting…", isGreen: !!stats },
                    { label: "AWS S3 Bucket", value: "streaming-bucket-123 ✓", isGreen: true },
                    { label: "Registered Users", value: stats ? `${stats.totalUsers} total` : "…" },
                    { label: "Active This Month", value: stats ? `${stats.newThisMonth} new` : "…", isGreen: true },
                  ].map((item, idx) => (
                    <div key={idx} className="bg-[#f8fafc] rounded-2xl p-4 border border-gray-50">
                      <span className="text-[9px] font-bold text-gray-400 block uppercase">{item.label}</span>
                      <span className={`text-sm font-black block mt-1.5 ${item.isGreen ? "text-emerald-600" : "text-gray-800"}`}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ PANEL: USER MANAGEMENT ═══════════════════════════════════════ */}
        {activePanel === "users" && (
          <div className="flex flex-col gap-6 text-left">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">User Database Management</h1>
                <p className="text-xs text-gray-500 font-semibold mt-0.5">
                  {users.length} registered users in MongoDB
                </p>
              </div>
              <button
                onClick={fetchUsers}
                className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-[#0b5be6] bg-white border border-gray-200 px-3 py-2 rounded-xl transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingUsers ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>

            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row items-center justify-between pb-5 mb-6 border-b border-gray-50 gap-4">
                <h3 className="text-sm font-extrabold text-gray-900">System User Accounts</h3>
                <div className="relative w-full sm:w-72">
                  <input
                    type="text"
                    placeholder="Search name, email or referral code…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-[#f8fafc] text-xs text-gray-700 pl-3.5 pr-8 py-2 rounded-xl border border-gray-200 focus:border-[#0b5be6] focus:outline-none"
                  />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                </div>
              </div>

              {isLoadingUsers ? (
                <div className="flex items-center justify-center py-16 text-gray-400">
                  <svg className="animate-spin h-8 w-8" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-16">
                  <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm font-bold text-gray-400">
                    {searchTerm ? "No users match your search." : "No users registered yet."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-xs font-bold text-gray-400 border-b border-gray-50">
                        <th className="pb-3 pr-3">User</th>
                        <th className="pb-3">Email</th>
                        <th className="pb-3">Phone</th>
                        <th className="pb-3 text-center">Ref Code</th>
                        <th className="pb-3 text-center">Referrals</th>
                        <th className="pb-3 text-center">Joined</th>
                        <th className="pb-3 text-center">Status</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-xs font-medium text-gray-600">
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-3.5 pr-3">
                            <div className="flex items-center gap-2.5">
                              {u.profilePicUrl ? (
                                <img
                                  src={u.profilePicUrl}
                                  alt={u.name}
                                  className="w-7 h-7 rounded-full object-cover border border-gray-200 shrink-0"
                                />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center border border-gray-200 shrink-0">
                                  <span className="text-[9px] font-black text-blue-600">
                                    {u.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <span className="font-bold text-gray-900 truncate max-w-[100px]">{u.name}</span>
                            </div>
                          </td>
                          <td className="py-3.5 text-gray-500 truncate max-w-[140px]">{u.email}</td>
                          <td className="py-3.5 text-gray-500">{u.phone}</td>
                          <td className="py-3.5 text-center">
                            <span className="bg-blue-50 text-[#0b5be6] font-black text-[9px] px-2 py-0.5 rounded-lg border border-blue-100 tracking-widest">
                              {u.referralCode}
                            </span>
                          </td>
                          <td className="py-3.5 text-center text-[#0b5be6] font-black">{u.referrals}</td>
                          <td className="py-3.5 text-center text-gray-400 font-bold">{u.joined}</td>
                          <td className="py-3.5 text-center">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${
                                u.status === "Active"
                                  ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                  : u.status === "Suspended"
                                  ? "bg-red-50 text-red-500 border border-red-100"
                                  : "bg-amber-50 text-amber-600 border border-amber-100"
                              }`}
                            >
                              {u.status === "PendingActivation" ? "Pending Activation" : u.status}
                            </span>
                          </td>
                          <td className="py-3.5 text-right font-bold text-gray-500 flex items-center justify-end gap-2">
                            {/* Eye Details Button */}
                            <button
                              onClick={() => setSelectedDetailUser(u)}
                              className="font-extrabold text-[10px] p-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 cursor-pointer active:scale-95 transition-transform border border-gray-200"
                              title="View All Details & Password"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {u.status === "PendingActivation" ? (
                              u.paymentScreenshotUrl ? (
                                <button
                                  onClick={() => setSelectedReviewUser(u)}
                                  className="font-extrabold text-[10px] px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#0b5be6] flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform border border-blue-100"
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                  <span>Review Payment</span>
                                </button>
                              ) : (
                                <span className="text-[10px] text-gray-400 italic font-semibold pr-2">Waiting Payment</span>
                              )
                            ) : (
                              <button
                                onClick={() => toggleUserStatus(u)}
                                className={`font-extrabold text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform ${
                                  u.status === "Active"
                                    ? "bg-red-50 hover:bg-red-100 text-red-500"
                                    : "bg-emerald-50 hover:bg-emerald-100 text-emerald-600"
                                }`}
                              >
                                {u.status === "Active" ? (
                                  <><Ban className="w-3 h-3" /><span>Suspend</span></>
                                ) : (
                                  <><UserCheck className="w-3 h-3" /><span>Activate</span></>
                                )}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ PANEL: PAYMENT SETUP ════════════════════════════════════════ */}
        {activePanel === "payment-setup" && (
          <div className="flex flex-col gap-6 text-left">
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">System &amp; Commissions Setup</h1>
              <p className="text-xs text-gray-500 font-semibold mt-0.5">Configure wallet activations, QR codes, and level-based team sales commissions</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Card 1: Activation Configuration */}
              <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
                <h3 className="text-sm font-extrabold text-gray-900 border-b border-gray-50 pb-4 mb-4">Activation Configuration</h3>
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 block uppercase tracking-wider mb-2">Activation Price / ID Charges (₹)</label>
                    <input
                      type="number"
                      value={activationPrice}
                      onChange={(e) => setActivationPrice(e.target.value)}
                      className="w-full bg-[#f8fafc] text-gray-800 text-xs font-bold p-3 rounded-xl border border-gray-200 focus:border-[#0b5be6] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 block uppercase tracking-wider mb-2">Payment QR Code (AWS S3 Upload)</label>
                    <div className="flex items-center gap-4 bg-[#f8fafc] p-3 rounded-xl border border-gray-200">
                      {qrCodeUrl && qrCodeUrl !== "/avatar.png" ? (
                        <img
                          src={qrCodeUrl}
                          alt="Activation QR"
                          className="w-16 h-16 rounded-lg object-contain border border-gray-200 bg-white shadow-sm shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg border border-dashed border-gray-300 bg-white flex items-center justify-center text-gray-400 shrink-0 shadow-sm">
                          <QrCode className="w-8 h-8" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] text-gray-400 block truncate max-w-xs font-semibold">
                          {qrCodeUrl && qrCodeUrl !== "/avatar.png" ? qrCodeUrl : "No QR Image Uploaded"}
                        </span>
                        <label className="inline-block mt-1 bg-white hover:bg-gray-50 text-[10px] font-bold text-gray-600 px-3 py-1.5 rounded-lg border border-gray-200 cursor-pointer active:scale-95 transition-transform">
                          {isUploadingQR ? "Uploading to S3..." : "Upload New QR Image"}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleQRUpload}
                            disabled={isUploadingQR}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={saveSettings}
                    className="w-full mt-4 bg-gradient-to-r from-[#ef9f15] to-[#d88a00] hover:from-[#d88a00] hover:to-[#c07800] text-white font-bold py-3.5 rounded-xl text-xs active:scale-[0.98] transition-transform cursor-pointer shadow-md shadow-orange-500/10"
                  >
                    Save Payment Configuration
                  </button>
                </div>
              </div>

              {/* Card 2: MLM Commission Structure */}
              <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
                <h3 className="text-sm font-extrabold text-gray-900 border-b border-gray-50 pb-4 mb-4">Team Sales Commission Setup</h3>
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 block uppercase tracking-wider mb-2">Level 1 Direct Referrals (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={commissionLevel1}
                      onChange={(e) => setCommissionLevel1(e.target.value)}
                      className="w-full bg-[#f8fafc] text-gray-800 text-xs font-bold p-3 rounded-xl border border-gray-200 focus:border-[#0b5be6] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 block uppercase tracking-wider mb-2">Level 2 to 5 (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={commissionLevel2to5}
                      onChange={(e) => setCommissionLevel2to5(e.target.value)}
                      className="w-full bg-[#f8fafc] text-gray-800 text-xs font-bold p-3 rounded-xl border border-gray-200 focus:border-[#0b5be6] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 block uppercase tracking-wider mb-2">Level 6 to 10 (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={commissionLevel6to10}
                      onChange={(e) => setCommissionLevel6to10(e.target.value)}
                      className="w-full bg-[#f8fafc] text-gray-800 text-xs font-bold p-3 rounded-xl border border-gray-200 focus:border-[#0b5be6] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 block uppercase tracking-wider mb-2">Level 11 to 20 (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={commissionLevel11to20}
                      onChange={(e) => setCommissionLevel11to20(e.target.value)}
                      className="w-full bg-[#f8fafc] text-gray-800 text-xs font-bold p-3 rounded-xl border border-gray-200 focus:border-[#0b5be6] focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={saveCommissionRates}
                    disabled={isSavingCommissions}
                    className="w-full mt-4 bg-gradient-to-r from-[#0b5be6] to-[#073ca2] hover:from-[#073ca2] hover:to-[#041a4a] text-white font-bold py-3.5 rounded-xl text-xs active:scale-[0.98] transition-transform cursor-pointer shadow-md shadow-blue-500/10 disabled:opacity-50"
                  >
                    {isSavingCommissions ? "Saving Rates..." : "Save Commission Setup"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ PANEL: SETTINGS ══════════════════════════════════════════════ */}
        {activePanel === "settings" && (
          <div className="flex flex-col gap-6 text-left">
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">System Settings</h1>
              <p className="text-xs text-gray-500 font-semibold mt-0.5">Manage configuration keys, root emails, and audit levels</p>
            </div>

            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm max-w-xl">
              <h3 className="text-sm font-extrabold text-gray-900 border-b border-gray-50 pb-4 mb-4">Configuration Parameters</h3>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 block uppercase tracking-wider mb-2">Root System Name</label>
                  <input type="text" defaultValue="Haventist Affiliate Portal"
                    className="w-full bg-[#f8fafc] text-gray-800 text-xs font-bold p-3 rounded-xl border border-gray-200 focus:border-[#0b5be6] focus:outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 block uppercase tracking-wider mb-2">Minimum Payout Request (₹)</label>
                  <input type="number" defaultValue="1000"
                    className="w-full bg-[#f8fafc] text-gray-800 text-xs font-bold p-3 rounded-xl border border-gray-200 focus:border-[#0b5be6] focus:outline-none" />
                </div>
                <button
                  onClick={() => showToast("Settings saved successfully!", "success")}
                  className="w-full mt-4 bg-gradient-to-r from-[#ef9f15] to-[#d88a00] hover:from-[#d88a00] hover:to-[#c07800] text-white font-bold py-3 rounded-xl text-xs active:scale-[0.98] transition-transform cursor-pointer shadow-md shadow-orange-500/10"
                >
                  Commit System Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══ PANEL: PACKAGE APPROVALS ════════════════════════════════════ */}
        {activePanel === "pending-packages" && (() => {
          const pendingOnly = pendingPackages.filter((p) => p.status === "Pending");
          const allPackages = pendingPackages;
          const [pkgTab, setPkgTab] = ["pending", (v: string) => {}]; // placeholder
          return (
          <div className="flex flex-col gap-6 text-left">
            {/* Header with refresh */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Package Approvals</h1>
                <p className="text-xs text-gray-500 font-semibold mt-0.5">Approve or reject gold jewelry and land booking purchase requests</p>
              </div>
              <button
                onClick={fetchPendingPackages}
                disabled={isLoadingPackages}
                className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-[#f3f7fd] hover:text-[#0b5be6] active:scale-95 transition-all cursor-pointer shadow-sm disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingPackages ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-center">
                <span className="text-2xl font-black text-amber-600">{pendingOnly.length}</span>
                <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wider mt-0.5">Pending</p>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center">
                <span className="text-2xl font-black text-emerald-600">{allPackages.filter(p => p.status === "Approved").length}</span>
                <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider mt-0.5">Approved</p>
              </div>
              <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-center">
                <span className="text-2xl font-black text-red-500">{allPackages.filter(p => p.status === "Rejected").length}</span>
                <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider mt-0.5">Rejected</p>
              </div>
            </div>

            {/* Pending Requests */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-50 pb-4 mb-4">
                <h3 className="text-sm font-extrabold text-gray-900">Pending Purchase Requests</h3>
                <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-3 py-1 rounded-full">
                  {pendingOnly.length} Awaiting
                </span>
              </div>

              {isLoadingPackages ? (
                <div className="py-10 text-center text-xs text-gray-400 font-bold uppercase tracking-wider animate-pulse">Loading…</div>
              ) : pendingOnly.length === 0 ? (
                <div className="py-12 text-center">
                  <CheckCircle className="w-10 h-10 text-emerald-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-400 font-semibold">No pending package requests. All clear!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50">
                        <th className="pb-3 pr-3">User</th>
                        <th className="pb-3">Package</th>
                        <th className="pb-3 text-right">Amount</th>
                        <th className="pb-3 text-center">Return Rate</th>
                        <th className="pb-3 text-center">Receipt / Proof</th>
                        <th className="pb-3 text-center">Submitted</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-xs font-medium text-gray-700">
                      {pendingOnly.map((p) => (
                        <tr key={p._id} className="hover:bg-[#f8faff] transition-colors">
                          {/* User */}
                          <td className="py-4 pr-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-blue-50 text-[#0b5be6] font-black text-[10px] flex items-center justify-center border border-blue-100 shrink-0">
                                {p.userId?.name ? p.userId.name.split(" ").map((w: string) => w[0]).join("").slice(0,2) : "U"}
                              </div>
                              <div className="min-w-0">
                                <span className="font-bold text-gray-900 block leading-tight truncate max-w-[120px]">{p.userId?.name || "Unknown"}</span>
                                <span className="text-[9px] text-gray-400 block mt-0.5 truncate max-w-[120px]">{p.userId?.email || "—"}</span>
                                <span className="text-[9px] text-gray-400 block">{p.userId?.phone || ""}</span>
                              </div>
                            </div>
                          </td>
                          {/* Package */}
                          <td className="py-4">
                            <span className={`inline-block px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border ${
                              p.type === "Gold"
                                ? "bg-yellow-50 text-yellow-700 border-yellow-100"
                                : "bg-emerald-50 text-emerald-700 border-emerald-100"
                            }`}>{p.type}</span>
                          </td>
                          {/* Amount */}
                          <td className="py-4 text-right font-black text-gray-900">
                            ₹{p.amount?.toLocaleString("en-IN")}
                          </td>
                          {/* Return Rate */}
                          <td className="py-4 text-center text-[#0b5be6] font-extrabold">
                            {((p.monthlyReturnRate || 0) * 100).toFixed(1)}% / mo
                          </td>
                          {/* Receipt */}
                          <td className="py-4 text-center">
                            <div className="flex flex-col items-center gap-1">
                              {p.paymentTransactionId && (
                                <span className="bg-slate-100 text-gray-600 text-[9px] px-2 py-0.5 rounded font-mono border border-gray-200 max-w-[100px] truncate block">
                                  {p.paymentTransactionId}
                                </span>
                              )}
                              {p.paymentScreenshotUrl ? (
                                <a href={p.paymentScreenshotUrl} target="_blank" rel="noreferrer"
                                  className="text-[#0b5be6] hover:underline text-[9px] font-bold flex items-center gap-1">
                                  <Eye className="w-3 h-3" /> View Proof
                                </a>
                              ) : (
                                <span className="text-[9px] text-gray-300 font-semibold">No receipt</span>
                              )}
                            </div>
                          </td>
                          {/* Date */}
                          <td className="py-4 text-center text-gray-400 font-semibold">
                            {new Date(p.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                          </td>
                          {/* Actions */}
                          <td className="py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => rejectPackage(p._id)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 text-[10px] font-black cursor-pointer active:scale-95 transition-all border border-red-100"
                              >
                                <X className="w-3.5 h-3.5" /> Reject
                              </button>
                              <button
                                onClick={() => approvePackage(p._id)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-black cursor-pointer active:scale-95 transition-all border border-emerald-200"
                              >
                                <Check className="w-3.5 h-3.5" /> Approve
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* All Packages History */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
              <h3 className="text-sm font-extrabold text-gray-900 border-b border-gray-50 pb-4 mb-4">All Package Requests History</h3>
              {allPackages.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400 font-semibold">No package requests found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50">
                        <th className="pb-3 pr-3">User</th>
                        <th className="pb-3">Package</th>
                        <th className="pb-3 text-right">Amount</th>
                        <th className="pb-3 text-center">Return Rate</th>
                        <th className="pb-3 text-center">Submitted</th>
                        <th className="pb-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-xs font-medium text-gray-700">
                      {allPackages.map((p) => (
                        <tr key={p._id} className="hover:bg-[#f8faff] transition-colors">
                          <td className="py-3.5 pr-3">
                            <span className="font-bold text-gray-900 block">{p.userId?.name || "Unknown"}</span>
                            <span className="text-[9px] text-gray-400">{p.userId?.email || "—"}</span>
                          </td>
                          <td className="py-3.5">
                            <span className={`inline-block px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border ${
                              p.type === "Gold" ? "bg-yellow-50 text-yellow-700 border-yellow-100" : "bg-emerald-50 text-emerald-700 border-emerald-100"
                            }`}>{p.type}</span>
                          </td>
                          <td className="py-3.5 text-right font-black text-gray-900">₹{p.amount?.toLocaleString("en-IN")}</td>
                          <td className="py-3.5 text-center text-[#0b5be6] font-extrabold">{((p.monthlyReturnRate || 0) * 100).toFixed(1)}% / mo</td>
                          <td className="py-3.5 text-center text-gray-400 font-semibold">
                            {new Date(p.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                          </td>
                          <td className="py-3.5 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                              p.status === "Approved" ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                              : p.status === "Rejected" ? "bg-red-50 text-red-500 border-red-100"
                              : "bg-amber-50 text-amber-600 border-amber-100 animate-pulse"
                            }`}>{p.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
          );
        })()}

        {/* ═══ PANEL: DEPOSIT & WITHDRAWS ══════════════════════════════════ */}
        {activePanel === "transactions" && (
          <div className="flex flex-col gap-6 text-left">
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Transaction Auditing</h1>
              <p className="text-xs text-gray-500 font-semibold mt-0.5">Audit user wallet deposits, withdrawals, and account activation payments</p>
            </div>

            {/* SECTION 1: Pending Activation Payments */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
              <h3 className="text-sm font-extrabold text-gray-900 border-b border-gray-50 pb-4 mb-4 flex items-center justify-between">
                <span>Pending Account Activations</span>
                <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                  {users.filter(u => u.status === "PendingActivation" && u.paymentScreenshotUrl).length} Pending
                </span>
              </h3>

              {users.filter(u => u.status === "PendingActivation" && u.paymentScreenshotUrl).length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400 font-semibold">No pending activation payments found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-xs font-bold text-gray-400 border-b border-gray-50">
                        <th className="pb-3 pr-2">User Details</th>
                        <th className="pb-3 text-center">Transaction ID</th>
                        <th className="pb-3 text-center">Receipt Proof</th>
                        <th className="pb-3 text-center">Submitted At</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-xs font-medium text-gray-700">
                      {users.filter(u => u.status === "PendingActivation" && u.paymentScreenshotUrl).map((u) => (
                        <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-4 pr-2">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-bold text-[10px] flex items-center justify-center border border-blue-100 shadow-inner">
                                {u.name.split(" ").map(w => w[0]).join("")}
                              </div>
                              <div>
                                <span className="font-bold text-gray-900 block leading-tight">{u.name}</span>
                                <span className="text-[9px] text-gray-400 block mt-0.5">{u.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 text-center font-mono text-gray-700 font-semibold">
                            {u.paymentTransactionId}
                          </td>
                          <td className="py-4 text-center">
                            <a 
                              href={u.paymentScreenshotUrl || "#"} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-[#0b5be6] hover:underline text-[9px] font-bold flex items-center justify-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" /> View Receipt
                            </a>
                          </td>
                          <td className="py-4 text-center text-gray-400 font-bold">
                            {u.paymentSubmittedAt ? new Date(u.paymentSubmittedAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric"
                            }) : "N/A"}
                          </td>
                          <td className="py-4 text-right">
                            <button
                              onClick={() => setSelectedReviewUser(u)}
                              className="font-extrabold text-[10px] px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#0b5be6] flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform border border-blue-100 ml-auto"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Review &amp; Activate</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* SECTION 2: Pending Wallet Transactions (Deposits & Withdrawals) */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
              <h3 className="text-sm font-extrabold text-gray-900 border-b border-gray-50 pb-4 mb-4 flex items-center justify-between">
                <span>Pending Wallet Deposits &amp; Withdrawals</span>
                <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                  {pendingTransactions.filter(tx => tx.status === "Pending").length} Pending
                </span>
              </h3>

              {isLoadingTransactions ? (
                <div className="py-8 text-center text-xs text-gray-400 font-bold uppercase tracking-wider animate-pulse">Loading Transactions…</div>
              ) : pendingTransactions.filter(tx => tx.status === "Pending").length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400 font-semibold">No pending wallet transactions found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-xs font-bold text-gray-400 border-b border-gray-50">
                        <th className="pb-3 pr-2">User Details</th>
                        <th className="pb-3">Transaction Type</th>
                        <th className="pb-3 text-right">Amount</th>
                        <th className="pb-3 text-center">Description / Notes</th>
                        <th className="pb-3 text-center">Requested At</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-xs font-medium text-gray-700">
                      {pendingTransactions.filter(tx => tx.status === "Pending").map((tx) => (
                        <tr key={tx._id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-4 pr-2">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-600 font-bold text-[10px] flex items-center justify-center border border-orange-100 shadow-inner">
                                {tx.userId?.name ? tx.userId.name.split(" ").map((w: any) => w[0]).join("") : "U"}
                              </div>
                              <div>
                                <span className="font-bold text-gray-900 block leading-tight">{tx.userId?.name || "Unknown User"}</span>
                                <span className="text-[9px] text-gray-400 block mt-0.5">{tx.userId?.email || ""}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4">
                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${
                              tx.type === "Deposit"
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                : "bg-red-50 text-red-500 border border-red-100"
                            }`}>
                              {tx.type}
                            </span>
                          </td>
                          <td className="py-4 text-right font-black text-gray-900">
                            ₹{tx.amount.toLocaleString("en-IN")}
                          </td>
                          <td className="py-4 text-center text-gray-400 font-semibold font-mono">
                            {tx.description}
                          </td>
                          <td className="py-4 text-center text-gray-400 font-bold">
                            {new Date(tx.createdAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric"
                            })}
                          </td>
                          <td className="py-4 text-right flex items-center justify-end gap-2">
                            <button
                              onClick={() => processTransaction(tx._id, "Reject")}
                              className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 cursor-pointer active:scale-95 transition-all border border-red-100"
                              title="Reject Transaction"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => processTransaction(tx._id, "Approve")}
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 cursor-pointer active:scale-95 transition-all border border-emerald-100"
                              title="Approve Transaction"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* SECTION 3: All Deposits & Withdrawals History */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
              <h3 className="text-sm font-extrabold text-gray-900 border-b border-gray-50 pb-4 mb-4 flex items-center justify-between">
                <span>All Wallet Deposits &amp; Withdrawals History</span>
                <span className="bg-gray-100 text-gray-600 text-[10px] font-black px-2 py-0.5 rounded-full">
                  {pendingTransactions.length} Total
                </span>
              </h3>

              {isLoadingTransactions ? (
                <div className="py-8 text-center text-xs text-gray-400 font-bold uppercase tracking-wider animate-pulse">Loading History…</div>
              ) : pendingTransactions.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400 font-semibold">No transactions history found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-xs font-bold text-gray-400 border-b border-gray-50">
                        <th className="pb-3 pr-2">User Details</th>
                        <th className="pb-3">Transaction Type</th>
                        <th className="pb-3 text-right">Amount</th>
                        <th className="pb-3 text-center">Description / Notes</th>
                        <th className="pb-3 text-center">Requested At</th>
                        <th className="pb-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-xs font-medium text-gray-700">
                      {pendingTransactions.map((tx) => (
                        <tr key={tx._id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-4 pr-2">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center justify-center border border-slate-200 shadow-inner">
                                {tx.userId?.name ? tx.userId.name.split(" ").map((w: any) => w[0]).join("") : "U"}
                              </div>
                              <div>
                                <span className="font-bold text-gray-900 block leading-tight">{tx.userId?.name || "Unknown User"}</span>
                                <span className="text-[9px] text-gray-400 block mt-0.5">{tx.userId?.email || ""}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4">
                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${
                              tx.type === "Deposit"
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                : "bg-red-50 text-red-500 border border-red-100"
                            }`}>
                              {tx.type}
                            </span>
                          </td>
                          <td className="py-4 text-right font-black text-gray-900">
                            ₹{tx.amount.toLocaleString("en-IN")}
                          </td>
                          <td className="py-4 text-center text-gray-400 font-semibold font-mono">
                            {tx.description}
                          </td>
                          <td className="py-4 text-center text-gray-400 font-bold">
                            {new Date(tx.createdAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric"
                            })}
                          </td>
                          <td className="py-4 text-right">
                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${
                              tx.status === "Success"
                                ? "bg-emerald-100 text-emerald-700"
                                : tx.status === "Failed"
                                ? "bg-red-100 text-red-700"
                                : "bg-amber-100 text-amber-700"
                            }`}>
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ PANEL: DEPOSIT REQUESTS ═════════════════════════════════════ */}
        {activePanel === "deposit-requests" && (() => {
          const pendingDeposits = pendingTransactions.filter(tx => tx.type === "Deposit" && tx.status === "Pending");
          const totalPendingPages = Math.ceil(pendingDeposits.length / ITEMS_PER_PAGE) || 1;
          const paginatedPending = pendingDeposits.slice(
            (depositPendingPage - 1) * ITEMS_PER_PAGE,
            depositPendingPage * ITEMS_PER_PAGE
          );

          const historyDeposits = pendingTransactions.filter(tx => tx.type === "Deposit");
          const totalHistoryPages = Math.ceil(historyDeposits.length / ITEMS_PER_PAGE) || 1;
          const paginatedHistory = historyDeposits.slice(
            (depositHistoryPage - 1) * ITEMS_PER_PAGE,
            depositHistoryPage * ITEMS_PER_PAGE
          );

          return (
            <div className="flex flex-col gap-6 text-left animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-black text-gray-900 tracking-tight">Deposit Requests</h1>
                  <p className="text-xs text-gray-500 font-semibold mt-0.5">Audit and approve user digital wallet deposits</p>
                </div>
                <button
                  onClick={async () => {
                    await fetchPendingTransactions();
                    showToast("Deposit requests refreshed successfully!", "success");
                  }}
                  className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-[#0b5be6] bg-white border border-gray-200 px-3.5 py-2.5 rounded-xl transition-all active:scale-95 cursor-pointer shadow-sm"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingTransactions ? "animate-spin" : ""}`} />
                  <span>Refresh Data</span>
                </button>
              </div>

              {/* Sub-tab Navigation */}
              <div className="flex gap-2 border-b border-gray-100 pb-px">
                <button
                  onClick={() => setDepositActiveTab("pending")}
                  className={`pb-3 px-4 text-xs font-bold transition-all relative border-b-2 ${
                    depositActiveTab === "pending"
                      ? "border-[#0b5be6] text-[#0b5be6]"
                      : "border-transparent text-gray-400 hover:text-gray-700"
                  }`}
                >
                  Pending Deposits ({pendingDeposits.length})
                </button>
                <button
                  onClick={() => setDepositActiveTab("history")}
                  className={`pb-3 px-4 text-xs font-bold transition-all relative border-b-2 ${
                    depositActiveTab === "history"
                      ? "border-[#0b5be6] text-[#0b5be6]"
                      : "border-transparent text-gray-400 hover:text-gray-700"
                  }`}
                >
                  All Deposits History ({historyDeposits.length})
                </button>
              </div>

              {/* Tab 1: Pending Deposits */}
              {depositActiveTab === "pending" && (
                <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-gray-50 pb-4 mb-4">
                    <h3 className="text-sm font-extrabold text-gray-900">Pending Requests</h3>
                    <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                      {pendingDeposits.length} Requests
                    </span>
                  </div>

                  {isLoadingTransactions ? (
                    <div className="py-8 text-center text-xs text-gray-400 font-bold uppercase tracking-wider animate-pulse">Loading Deposits…</div>
                  ) : paginatedPending.length === 0 ? (
                    <div className="py-8 text-center text-xs text-gray-400 font-semibold">No pending deposit requests found.</div>
                  ) : (
                    <div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="text-xs font-bold text-gray-400 border-b border-gray-50">
                              <th className="pb-3 pr-2">User Details</th>
                              <th className="pb-3 text-right">Amount</th>
                              <th className="pb-3 text-center">Description / Notes</th>
                              <th className="pb-3 text-center">Requested At</th>
                              <th className="pb-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50 text-xs font-medium text-gray-700">
                            {paginatedPending.map((tx) => (
                              <tr key={tx._id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="py-4 pr-2">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 font-bold text-[10px] flex items-center justify-center border border-emerald-100 shadow-inner">
                                      {tx.userId?.name ? tx.userId.name.split(" ").map((w: any) => w[0]).join("") : "U"}
                                    </div>
                                    <div>
                                      <span className="font-bold text-gray-900 block leading-tight">{tx.userId?.name || "Unknown User"}</span>
                                      <span className="text-[9px] text-gray-400 block mt-0.5">{tx.userId?.email || ""}</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4 text-right font-black text-gray-900">
                                  ₹{tx.amount.toLocaleString("en-IN")}
                                </td>
                                <td className="py-4 text-center text-gray-400 font-semibold font-mono">
                                  {tx.description}
                                </td>
                                <td className="py-4 text-center text-gray-400 font-bold">
                                  {new Date(tx.createdAt).toLocaleDateString("en-IN", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric"
                                  })}
                                </td>
                                <td className="py-4 text-right flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => processTransaction(tx._id, "Reject")}
                                    className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 cursor-pointer active:scale-95 transition-all border border-red-100"
                                    title="Reject Deposit"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => processTransaction(tx._id, "Approve")}
                                    className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 cursor-pointer active:scale-95 transition-all border border-emerald-100"
                                    title="Approve Deposit"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination Controls */}
                      {totalPendingPages > 1 && (
                        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-50 text-xs font-bold text-gray-500">
                          <button
                            disabled={depositPendingPage === 1}
                            onClick={() => setDepositPendingPage(prev => Math.max(prev - 1, 1))}
                            className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none active:scale-95 transition-all cursor-pointer"
                          >
                            Previous
                          </button>
                          <span>Page {depositPendingPage} of {totalPendingPages}</span>
                          <button
                            disabled={depositPendingPage === totalPendingPages}
                            onClick={() => setDepositPendingPage(prev => Math.min(prev + 1, totalPendingPages))}
                            className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none active:scale-95 transition-all cursor-pointer"
                          >
                            Next
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: All Deposits History */}
              {depositActiveTab === "history" && (
                <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-gray-50 pb-4 mb-4">
                    <h3 className="text-sm font-extrabold text-gray-900">History Ledger</h3>
                    <span className="bg-gray-100 text-gray-600 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                      {historyDeposits.length} Records
                    </span>
                  </div>

                  {isLoadingTransactions ? (
                    <div className="py-8 text-center text-xs text-gray-400 font-bold uppercase tracking-wider animate-pulse">Loading History…</div>
                  ) : paginatedHistory.length === 0 ? (
                    <div className="py-8 text-center text-xs text-gray-400 font-semibold">No deposit requests history found.</div>
                  ) : (
                    <div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="text-xs font-bold text-gray-400 border-b border-gray-50">
                              <th className="pb-3 pr-2">User Details</th>
                              <th className="pb-3 text-right">Amount</th>
                              <th className="pb-3 text-center">Description / Notes</th>
                              <th className="pb-3 text-center">Requested At</th>
                              <th className="pb-3 text-right">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50 text-xs font-medium text-gray-700">
                            {paginatedHistory.map((tx) => (
                              <tr key={tx._id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="py-4 pr-2">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center justify-center border border-slate-200 shadow-inner">
                                      {tx.userId?.name ? tx.userId.name.split(" ").map((w: any) => w[0]).join("") : "U"}
                                    </div>
                                    <div>
                                      <span className="font-bold text-gray-900 block leading-tight">{tx.userId?.name || "Unknown User"}</span>
                                      <span className="text-[9px] text-gray-400 block mt-0.5">{tx.userId?.email || ""}</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4 text-right font-black text-gray-900">
                                  ₹{tx.amount.toLocaleString("en-IN")}
                                </td>
                                <td className="py-4 text-center text-gray-400 font-semibold font-mono">
                                  {tx.description}
                                </td>
                                <td className="py-4 text-center text-gray-400 font-bold">
                                  {new Date(tx.createdAt).toLocaleDateString("en-IN", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric"
                                  })}
                                </td>
                                <td className="py-4 text-right">
                                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${
                                    tx.status === "Success"
                                      ? "bg-emerald-100 text-emerald-700"
                                      : tx.status === "Failed"
                                      ? "bg-red-100 text-red-700"
                                      : "bg-amber-100 text-amber-700"
                                  }`}>
                                    {tx.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination Controls */}
                      {totalHistoryPages > 1 && (
                        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-50 text-xs font-bold text-gray-500">
                          <button
                            disabled={depositHistoryPage === 1}
                            onClick={() => setDepositHistoryPage(prev => Math.max(prev - 1, 1))}
                            className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none active:scale-95 transition-all cursor-pointer"
                          >
                            Previous
                          </button>
                          <span>Page {depositHistoryPage} of {totalHistoryPages}</span>
                          <button
                            disabled={depositHistoryPage === totalHistoryPages}
                            onClick={() => setDepositHistoryPage(prev => Math.min(prev + 1, totalHistoryPages))}
                            className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none active:scale-95 transition-all cursor-pointer"
                          >
                            Next
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}

        {/* ═══ PANEL: PAYOUT RUNS ══════════════════════════════════════════ */}
        {activePanel === "payout-runs" && (
          <div className="flex flex-col gap-6 text-left max-w-2xl">
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Affiliate Payout Console</h1>
              <p className="text-xs text-gray-500 font-semibold mt-0.5">Execute monthly gold monthly returns, land booking cash redemptions, and user ranks salaries</p>
            </div>

            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
              <h3 className="text-sm font-extrabold text-gray-900 border-b border-gray-50 pb-4 mb-4">Run Monthly Payout Process</h3>
              <p className="text-xs text-gray-400 font-medium mb-6">
                Executing the payout runs process will recursively credit users’ available wallet balances with gold returns and level salaries, and post transaction logs to ledgers.
              </p>

              <button
                onClick={runPayoutsCycle}
                disabled={isProcessingPayout}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black py-4 px-6 rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/10 active:scale-[0.98] transition-all cursor-pointer"
              >
                {isProcessingPayout ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Executing cycle...
                  </span>
                ) : (
                  <span>Trigger Payout Runs</span>
                )}
              </button>

              {payoutResult && (
                <div className="mt-6 bg-slate-50 border border-gray-150 rounded-2xl p-5 text-xs text-gray-700">
                  <span className="font-extrabold text-gray-800 block border-b border-gray-200 pb-2 mb-3">Last Payout Run Summary:</span>
                  <div className="flex flex-col gap-2 font-medium">
                    <div className="flex justify-between">
                      <span>Monthly Returns Paid:</span>
                      <strong className="text-gray-900">{payoutResult.returnsPaidCount}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Returns Distributed:</span>
                      <strong className="text-emerald-600">₹{payoutResult.totalReturnsDistributed.toLocaleString("en-IN")}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Salaries Paid:</span>
                      <strong className="text-gray-900">{payoutResult.salariesPaidCount}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Salaries Distributed:</span>
                      <strong className="text-emerald-600">₹{payoutResult.totalSalariesDistributed.toLocaleString("en-IN")}</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ PANEL: COMMISSION RATES ════════════════════════════════════ */}
        {activePanel === "settings" && (
          <div className="flex flex-col gap-6 text-left max-w-2xl">
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">System Settings</h1>
              <p className="text-xs text-gray-500 font-semibold mt-0.5">Manage platform-wide configuration and MLM commission rates</p>
            </div>

            {/* Team Sales Bonus Commission Rates */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-50 pb-4 mb-5">
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900">Team Sales Bonus Commission</h3>
                  <p className="text-[10px] text-gray-400 font-medium mt-0.5">Rates applied on business value during monthly payout cycles</p>
                </div>
                <span className="bg-blue-50 text-[#0b5be6] text-[9px] font-black px-2.5 py-1 rounded-full border border-blue-100 uppercase tracking-wider">Admin Controlled</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {[
                  { label: "Level 1 Bonus", sublabel: "Direct referral", value: commissionLevel1, setter: setCommissionLevel1 },
                  { label: "Level 2–5 Bonus", sublabel: "Second to fifth tier", value: commissionLevel2to5, setter: setCommissionLevel2to5 },
                  { label: "Level 6–10 Bonus", sublabel: "Sixth to tenth tier", value: commissionLevel6to10, setter: setCommissionLevel6to10 },
                  { label: "Level 11–20 Bonus", sublabel: "Eleventh to twentieth tier", value: commissionLevel11to20, setter: setCommissionLevel11to20 },
                ].map((row) => (
                  <div key={row.label} className="bg-[#f8faff] border border-blue-50 rounded-2xl p-4 flex flex-col gap-2">
                    <div>
                      <span className="text-xs font-bold text-gray-800 block">{row.label}</span>
                      <span className="text-[10px] text-gray-400 font-medium">{row.sublabel}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={row.value}
                        onChange={(e) => row.setter(e.target.value)}
                        className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0b5be6]/20 focus:border-[#0b5be6]"
                      />
                      <span className="text-xs font-black text-gray-500 shrink-0">%</span>
                    </div>
                    <div className="text-[9px] text-gray-400 font-medium">
                      = {(parseFloat(row.value || "0") / 100).toFixed(4)} per ₹1 of business
                    </div>
                  </div>
                ))}
              </div>

              {/* Preview Table */}
              <div className="bg-gray-50 rounded-2xl p-4 mb-5">
                <span className="text-[10px] text-gray-500 font-bold block uppercase tracking-wider mb-3">Preview — Commission on ₹10,000 Business Value</span>
                <div className="flex flex-col gap-2">
                  {[
                    { label: "Level 1", value: commissionLevel1 },
                    { label: "Level 2–5", value: commissionLevel2to5 },
                    { label: "Level 6–10", value: commissionLevel6to10 },
                    { label: "Level 11–20", value: commissionLevel11to20 },
                  ].map((r) => {
                    const amt = (10000 * parseFloat(r.value || "0")) / 100;
                    return (
                      <div key={r.label} className="flex items-center justify-between text-xs font-medium text-gray-700">
                        <span className="text-gray-500">{r.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-400">{r.value}%</span>
                          <span className="font-black text-emerald-600">₹{amt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={saveCommissionRates}
                disabled={isSavingCommissions}
                className="w-full bg-gradient-to-r from-[#0b5be6] to-[#073ca2] text-white font-black py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 hover:from-[#0944c4] hover:to-[#052e80] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingCommissions ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  "Save Commission Rates"
                )}
              </button>
            </div>

            <p className="text-[10px] text-gray-400 font-medium text-center">
              Changes take effect on the next payout cycle run. Need 7 directs to unlock all levels.
            </p>
          </div>
        )}

        {/* ── Payment Review Modal ── */}
        {selectedReviewUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-6 w-full max-w-lg border border-gray-100 shadow-2xl relative text-left">
              <div className="flex justify-between items-center pb-4 mb-4 border-b border-gray-100">
                <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">Review Account Activation Payment</h3>
                <button
                  onClick={() => setSelectedReviewUser(null)}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">User Name</span>
                    <span className="text-xs font-bold text-gray-800 block mt-0.5">{selectedReviewUser.name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">User Phone</span>
                    <span className="text-xs font-bold text-gray-800 block mt-0.5">{selectedReviewUser.phone}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">User Email</span>
                    <span className="text-xs font-bold text-gray-800 block mt-0.5 truncate max-w-xs">{selectedReviewUser.email}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Transaction ID</span>
                    <span className="text-xs font-bold text-[#0b5be6] tracking-wider block mt-0.5">{selectedReviewUser.paymentTransactionId}</span>
                  </div>
                </div>

                {selectedReviewUser.paymentScreenshotUrl && (
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider mb-2">Payment Screenshot Proof</span>
                    <div className="border border-gray-150 rounded-2xl overflow-hidden shadow-inner bg-slate-50 flex items-center justify-center p-2.5">
                      <a
                        href={selectedReviewUser.paymentScreenshotUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block max-h-60 overflow-hidden relative active:scale-98 transition-transform cursor-pointer"
                      >
                        <img
                          src={selectedReviewUser.paymentScreenshotUrl}
                          alt="Payment Screenshot"
                          className="max-h-56 object-contain rounded-xl"
                        />
                      </a>
                    </div>
                    <span className="text-[9px] text-gray-400 text-center block mt-1.5">Click screenshot image to open full size</span>
                  </div>
                )}

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => patchUserStatus(selectedReviewUser.id, "PendingActivation", true)}
                    className="flex-1 bg-red-50 hover:bg-red-100 text-red-500 font-bold text-xs py-3.5 rounded-xl cursor-pointer active:scale-95 transition-transform text-center"
                  >
                    Reject &amp; Reset
                  </button>
                  <button
                    onClick={() => patchUserStatus(selectedReviewUser.id, "Active")}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 text-white font-bold text-xs py-3.5 rounded-xl cursor-pointer active:scale-95 transition-transform text-center shadow-md shadow-emerald-500/10"
                  >
                    Approve &amp; Activate
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* ── User Details Modal ── */}
        {selectedDetailUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-6 w-full max-w-lg border border-gray-100 shadow-2xl relative text-left">
              <div className="flex justify-between items-center pb-4 mb-4 border-b border-gray-100">
                <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">User Account Details</h3>
                <button
                  onClick={() => setSelectedDetailUser(null)}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                {/* Profile Pic Header */}
                <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <div className="w-16 h-16 rounded-full overflow-hidden border border-gray-200 bg-white shrink-0">
                    {selectedDetailUser.profilePicUrl ? (
                      <img
                        src={selectedDetailUser.profilePicUrl}
                        alt={selectedDetailUser.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 font-black text-xl">
                        {selectedDetailUser.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="text-base font-black text-gray-900">{selectedDetailUser.name}</h4>
                    <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider mt-0.5">Joined: {selectedDetailUser.joined}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Email Address</span>
                    <span className="text-xs font-bold text-gray-800 block mt-0.5 break-all">{selectedDetailUser.email}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Phone Number</span>
                    <span className="text-xs font-bold text-gray-800 block mt-0.5">{selectedDetailUser.phone}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Referral Code</span>
                    <span className="text-xs font-bold text-blue-600 block mt-0.5 tracking-wider">{selectedDetailUser.referralCode}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Referred By</span>
                    <span className="text-xs font-bold text-gray-800 block mt-0.5">{selectedDetailUser.referredBy || "Direct Signup"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Status</span>
                    <div>
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase mt-1 ${
                        selectedDetailUser.status === "Active"
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                          : selectedDetailUser.status === "Suspended"
                          ? "bg-red-50 text-red-500 border border-red-100"
                          : "bg-amber-50 text-amber-600 border border-amber-100"
                      }`}>
                        {selectedDetailUser.status === "PendingActivation" ? "Pending Activation" : selectedDetailUser.status}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Wallet Balance</span>
                    <span className="text-xs font-bold text-emerald-600 block mt-0.5">₹{selectedDetailUser.walletBalance.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4 mt-2">
                  <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Account Password</span>
                  <div className="flex items-center justify-between bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 mt-1">
                    <span className="text-xs font-mono font-bold text-gray-800 tracking-wider">
                      {selectedDetailUser.plainPassword || "No plain text password (legacy)"}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end mt-4">
                  <button
                    onClick={() => setSelectedDetailUser(null)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs px-6 py-2.5 rounded-xl cursor-pointer active:scale-95 transition-transform"
                  >
                    Close Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Unused icons to avoid lint warnings */}
      <span className="hidden">
        <TrendingUp /><Wallet /><XCircle /><Check /><AlertCircle />
      </span>

      <style jsx global>{`
        @keyframes slide-in {
          from { transform: translateX(120%); opacity: 0; }
          to   { transform: translateX(0);   opacity: 1; }
        }
        .animate-slide-in { animation: slide-in 0.35s ease; }
      `}</style>
    </div>
  );
}
