import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Booking } from "../types";

interface Props {
  bookings: Booking[];
  packagesCount: number;
  addonsCount: number;
  couponsCount: number;
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;
  children: React.ReactNode;
}

export default function AdminLayout({ bookings, packagesCount, addonsCount, couponsCount, mobileSidebarOpen, setMobileSidebarOpen, children }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const menu = [
    { path: "/admin/dashboard", label: "Dashboard", color: "emerald" },
    { path: "/admin/approval", label: "Persetujuan", badge: bookings.filter(b => b.approvalStatus === "pending").length, color: "amber" },
    { path: "/admin/payment", label: "Pembayaran", badge: bookings.filter(b => b.approvalStatus === "approved" && b.paymentStatus !== "unpaid").length, color: "emerald" },
    { type: "divider" as const },
    { path: "/admin/packages", label: "Paket", badge: packagesCount, color: "amber" },
    { path: "/admin/addons", label: "Add-Ons", badge: addonsCount, color: "amber" },
    { path: "/admin/coupons", label: "Kupon", badge: couponsCount, color: "amber" },
    { type: "divider" as const },
    { path: "/admin/recap", label: "Rekap & Ekspor", color: "emerald" },
  ] as const;

  const nav = (path: string) => {
    navigate(path);
    setMobileSidebarOpen(false);
  };

  const isActive = (path: string) => currentPath === path;

  return (
    <div className="text-zinc-150">
      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-[#0c0c0e] border-r border-zinc-850 shadow-2xl p-4 space-y-1 overflow-y-auto">
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-zinc-900 mb-2">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-sans">Menu Admin</span>
              <button onClick={() => setMobileSidebarOpen(false)} className="p-1 text-zinc-400 hover:text-white transition cursor-pointer">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {menu.map((m: any, i) =>
              m.type === "divider" ? <div key={i} className="border-t border-zinc-900 my-1" /> : (
                <button key={m.path} onClick={() => nav(m.path)} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-left transition cursor-pointer ${isActive(m.path) ? (m.color === "emerald" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20") : "text-zinc-400 hover:text-white hover:bg-white/5"}`}>
                  <span className="flex-1">{m.label}</span>
                  {m.badge !== undefined && <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${isActive(m.path) ? (m.color === "emerald" ? "bg-emerald-600 text-white" : "bg-amber-500 text-black") : "bg-zinc-800 text-zinc-400"}`}>{m.badge}</span>}
                </button>
              )
            )}
          </aside>
        </div>
      )}

      <div className="flex gap-6 items-start">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-56 shrink-0 bg-[#0c0c0e] rounded-2xl border border-zinc-850 shadow-lg p-3 space-y-1 sticky top-6">
          <div className="px-3 py-2.5 border-b border-zinc-900 mb-1">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-sans">Menu Admin</span>
          </div>
          {menu.map((m: any, i) =>
            m.type === "divider" ? <div key={i} className="border-t border-zinc-900 my-1" /> : (
              <button key={m.path} onClick={() => nav(m.path)} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-left transition cursor-pointer ${isActive(m.path) ? (m.color === "emerald" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20") : "text-zinc-400 hover:text-white hover:bg-white/5"}`}>
                <span className="flex-1">{m.label}</span>
                {m.badge !== undefined && <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${isActive(m.path) ? (m.color === "emerald" ? "bg-emerald-600 text-white" : "bg-amber-500 text-black") : "bg-zinc-800 text-zinc-400"}`}>{m.badge}</span>}
              </button>
            )
          )}
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0 space-y-6">
          {children}
        </div>
      </div>
    </div>
  );
}
