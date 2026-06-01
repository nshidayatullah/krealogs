import React, { useState, useEffect } from "react";
import { Package, Addon, Booking, SpreadsheetConfig, Coupon } from "../types";
import { 
  FileText, 
  Trash2, 
  Edit, 
  Plus, 
  Check, 
  X, 
  Database, 
  AlertCircle,
  Copy,
  ExternalLink,
  RefreshCw,
  Sliders,
  DollarSign,
  Package as PkgIcon, 
  PlusCircle, 
  Calendar,
  Layers,
  ArrowRight,
  FileSpreadsheet,
  Download,
  TrendingUp,
  Coins,
  Ticket
} from "lucide-react";
import { exportBookingsToCSV, exportPackagesToCSV, exportAddonsToCSV } from "../utils/excelExport";
import { formatEventDate } from "../utils/dateFormatter";
import { motion, AnimatePresence } from "motion/react";

interface AdminPageProps {
  onOpenInvoice: (booking: Booking) => void;
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;
}

export default function AdminPage({ onOpenInvoice, mobileSidebarOpen, setMobileSidebarOpen }: AdminPageProps) {
  // DB States
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [dbLoading, setDbLoading] = useState(true);
  const [csrfToken, setCsrfToken] = useState("");

  useEffect(() => {
    fetch("/api/auth/csrf").then(r => r.json()).then(d => setCsrfToken(d.csrfToken)).catch(() => {});
  }, []);

  // Active Tab
  const [activeTab, setActiveTab] = useState<"bookings" | "packages" | "addons" | "recap" | "coupons">("bookings");

  // Filters
  const [approvalFilter, setApprovalFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [paymentFilter, setPaymentFilter] = useState<"all" | "unpaid" | "dp_paid" | "paid">("all");

  // Package Form Modal State
  const [isPkgModalOpen, setIsPkgModalOpen] = useState(false);
  const [pkgEditId, setPkgEditId] = useState<string | null>(null);
  const [pkgName, setPkgName] = useState("");
  const [pkgDesc, setPkgDesc] = useState("");
  const [pkgPrice, setPkgPrice] = useState(0);
  const [pkgType, setPkgType] = useState<"event" | "wedding" | "both">("wedding");
  const [pkgCategory, setPkgCategory] = useState<"signature" | "regular">("regular");
  const [pkgFetStr, setPkgFetStr] = useState(""); // newline separated

  // Addon Form Modal State
  const [isAddonModalOpen, setIsAddonModalOpen] = useState(false);
  const [addonEditId, setAddonEditId] = useState<string | null>(null);
  const [addonName, setAddonName] = useState("");
  const [addonDesc, setAddonDesc] = useState("");
  const [addonPrice, setAddonPrice] = useState(0);

  // Coupon Form Modal State
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [couponEditCode, setCouponEditCode] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponPercent, setCouponPercent] = useState(10);
  const [couponExpiry, setCouponExpiry] = useState("");
  const [couponActive, setCouponActive] = useState(true);

  // Premium Toast and Confirmation states
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {}
  });

  // Load Data
  const loadData = () => {
    setDbLoading(true);
    fetch("/api/db")
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => {
        setBookings(data.bookings || []);
        setPackages(data.packages || []);
        setAddons(data.addons || []);
        setCoupons(data.coupons || []);
        setDbLoading(false);
      })
      .catch((err) => {
        if (err.message !== "Unauthorized") {
          console.error("Error loading admin db:", err);
        }
        setDbLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApproval = (id: string, approvalStatus: "approved" | "rejected") => {
    const isApprove = approvalStatus === "approved";
    const isReject = approvalStatus === "rejected";

    setConfirmModal({
      isOpen: true,
      title: isApprove ? "Setujui Pemesanan" : "Tolak Pemesanan",
      message: isApprove
        ? "Apakah Anda yakin ingin menyetujui jadwal & kru pesanan ini? Tindakan ini akan menerbitkan Invoice Resmi Belum Bayar yang dapat diakses kustomer."
        : "Apakah Anda yakin ingin menolak pemesanan ini? Kustomer tidak akan dapat mengakses dokumen apa pun.",
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          const response = await fetch(`/api/bookings/${id}/approval`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
            body: JSON.stringify({ approvalStatus })
          });
          const result = await response.json();
          if (response.ok && result.success) {
            setBookings(bookings.map((b) => (b.id === id ? result.booking : b)));
            showToast(isApprove ? "Pemesanan berhasil disetujui!" : "Pemesanan berhasil ditolak!", "success");
          } else {
            showToast(result.error || "Gagal mengubah status", "error");
          }
        } catch (err) {
          console.error("Approval error:", err);
          showToast("Terjadi kesalahan koneksi", "error");
        }
      }
    });
  };

  const handlePayment = (id: string, paymentStatus: "dp_paid" | "paid") => {
    const isPaid = paymentStatus === "paid";
    const isDPPaid = paymentStatus === "dp_paid";

    setConfirmModal({
      isOpen: true,
      title: isPaid ? "Konfirmasi Lunas Diterima" : "Konfirmasi DP Diterima",
      message: isPaid
        ? "Apakah Anda yakin telah menerima pelunasan pembayaran dari kustomer? Status akan diperbarui menjadi Paid dan Kwitansi Resmi berstempel LUNAS akan terbit."
        : "Apakah Anda yakin telah menerima pembayaran DP dari kustomer? Status akan diperbarui menjadi DP Paid dan Invoice berstempel DP TERBAYAR akan terbit.",
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          const response = await fetch(`/api/bookings/${id}/payment`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
            body: JSON.stringify({ paymentStatus })
          });
          const result = await response.json();
          if (response.ok && result.success) {
            setBookings(bookings.map((b) => (b.id === id ? result.booking : b)));
            showToast(isPaid ? "Pelunasan berhasil dikonfirmasi!" : "Pembayaran DP berhasil dikonfirmasi!", "success");
          } else {
            showToast(result.error || "Gagal mengubah status", "error");
          }
        } catch (err) {
          console.error("Payment error:", err);
          showToast("Terjadi kesalahan koneksi", "error");
        }
      }
    });
  };

  // CRUD PACKAGES
  const handleOpenPkgModal = (p: Package | null) => {
    if (p) {
      setPkgEditId(p.id);
      setPkgName(p.name);
      setPkgDesc(p.description);
      setPkgPrice(p.price);
      setPkgType(p.type);
      setPkgCategory(p.category || "regular");
      setPkgFetStr(p.features ? p.features.join("\n") : "");
    } else {
      setPkgEditId(null);
      setPkgName("");
      setPkgDesc("");
      setPkgPrice(1500000);
      setPkgType("wedding");
      setPkgCategory("regular");
      setPkgFetStr("- 1 Videographer\n- Video highlight 2 menit\n- Link Google Drive");
    }
    setIsPkgModalOpen(true);
  };

  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkgName || pkgPrice < 0) return;

    const feats = pkgFetStr.split("\n").map(f => f.trim()).filter(f => f.length > 0);
    const pkgPayload = {
      id: pkgEditId || `pkg-${Date.now()}`,
      name: pkgName,
      description: pkgDesc,
      price: Number(pkgPrice),
      type: pkgType,
      category: pkgCategory,
      features: feats
    };

    try {
      let url = "/api/packages";
      let method = "POST";
      if (pkgEditId) {
        url = `/api/packages/${pkgEditId}`;
        method = "PUT";
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
        body: JSON.stringify(pkgPayload)
      });

      if (response.ok) {
        setIsPkgModalOpen(false);
        loadData();
      } else {
        alert("Gagal menyimpan Paket");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePackage = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Hapus Paket Utama",
      message: "Apakah Anda yakin ingin menghapus paket ini? Tindakan ini bersifat permanen dan tidak dapat dibatalkan.",
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          const response = await fetch(`/api/packages/${id}`, { method: "DELETE", headers: { "x-csrf-token": csrfToken } });
          if (response.ok) {
            loadData();
            showToast("Paket berhasil dihapus!", "success");
          } else {
            showToast("Gagal menghapus paket", "error");
          }
        } catch (err) {
          console.error(err);
          showToast("Terjadi kesalahan koneksi", "error");
        }
      }
    });
  };

  // CRUD ADDONS
  const handleOpenAddonModal = (a: Addon | null) => {
    if (a) {
      setAddonEditId(a.id);
      setAddonName(a.name);
      setAddonDesc(a.description);
      setAddonPrice(a.price);
    } else {
      setAddonEditId(null);
      setAddonName("");
      setAddonDesc("");
      setAddonPrice(500000);
    }
    setIsAddonModalOpen(true);
  };

  const handleSaveAddon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addonName || addonPrice < 0) return;

    const addonPayload = {
      id: addonEditId || `add-${Date.now()}`,
      name: addonName,
      description: addonDesc,
      price: Number(addonPrice)
    };

    try {
      let url = "/api/addons";
      let method = "POST";
      if (addonEditId) {
        url = `/api/addons/${addonEditId}`;
        method = "PUT";
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
        body: JSON.stringify(addonPayload)
      });

      if (response.ok) {
        setIsAddonModalOpen(false);
        loadData();
      } else {
        alert("Gagal menyimpan Add-On");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAddon = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Hapus Add-On Layanan",
      message: "Apakah Anda yakin ingin menghapus add-on ini? Tindakan ini bersifat permanen dan tidak dapat dibatalkan.",
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          const response = await fetch(`/api/addons/${id}`, { method: "DELETE", headers: { "x-csrf-token": csrfToken } });
          if (response.ok) {
            loadData();
            showToast("Add-on berhasil dihapus!", "success");
          } else {
            showToast("Gagal menghapus add-on", "error");
          }
        } catch (err) {
          console.error(err);
          showToast("Terjadi kesalahan koneksi", "error");
        }
      }
    });
  };

  // CRUD COUPONS
  const handleOpenCouponModal = (c: Coupon | null) => {
    if (c) {
      setCouponEditCode(c.code);
      setCouponCode(c.code);
      setCouponPercent(c.discountPercent);
      const dateVal = c.validUntil ? new Date(c.validUntil).toISOString().split("T")[0] : "";
      setCouponExpiry(dateVal);
      setCouponActive(c.isActive);
    } else {
      setCouponEditCode(null);
      setCouponCode("");
      setCouponPercent(10);
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 7);
      setCouponExpiry(defaultDate.toISOString().split("T")[0]);
      setCouponActive(true);
    }
    setIsCouponModalOpen(true);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim() || couponPercent <= 0 || couponPercent > 100 || !couponExpiry) {
      showToast("Mohon isi seluruh data kupon dengan valid", "error");
      return;
    }

    const parsedDate = new Date(couponExpiry);
    if (isNaN(parsedDate.getTime())) {
      showToast("Format tanggal kedaluwarsa tidak valid", "error");
      return;
    }

    const couponPayload = {
      code: couponCode.trim().toUpperCase(),
      discountPercent: Number(couponPercent),
      validUntil: parsedDate.toISOString(),
      isActive: couponActive
    };

    try {
      let url = "/api/coupons";
      let method = "POST";
      if (couponEditCode) {
        url = `/api/coupons/${couponEditCode}`;
        method = "PUT";
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
        body: JSON.stringify(couponPayload)
      });

      if (response.ok) {
        setIsCouponModalOpen(false);
        loadData();
        showToast(couponEditCode ? "Kupon berhasil diperbarui!" : "Kupon berhasil dibuat!", "success");
      } else {
        let errorMsg = "Gagal menyimpan Kupon";
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
        } catch (_) {}
        showToast(errorMsg, "error");
      }
    } catch (err) {
      console.error("Save coupon error:", err);
      showToast("Terjadi kesalahan koneksi saat menghubungi server", "error");
    }
  };

  const handleDeleteCoupon = (code: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Hapus Kupon Diskon",
      message: `Apakah Anda yakin ingin menghapus kupon ${code}? Tindakan ini bersifat permanen dan tidak dapat dibatalkan.`,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          const response = await fetch(`/api/coupons/${code}`, { method: "DELETE", headers: { "x-csrf-token": csrfToken } });
          if (response.ok) {
            loadData();
            showToast("Kupon berhasil dihapus!", "success");
          } else {
            showToast("Gagal menghapus kupon", "error");
          }
        } catch (err) {
          console.error(err);
          showToast("Terjadi kesalahan koneksi", "error");
        }
      }
    });
  };

  // Search
  // Search
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  const filtered = bookings.filter((b) => {
    if (approvalFilter !== "all" && b.approvalStatus !== approvalFilter) return false;
    if (paymentFilter !== "all" && b.paymentStatus !== paymentFilter) return false;
    return true;
  });

  const searched = filtered.filter((b) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    return b.customerName.toLowerCase().includes(q) || b.customerPhone.replace(/[^0-9+]/g, "").includes(q.replace(/[^0-9+]/g, ""));
  });

  const activeList = searched;
  const totalPages = Math.ceil(activeList.length / ITEMS_PER_PAGE);
  const paginatedBookings = activeList.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [approvalFilter, paymentFilter, searchQuery]);

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
            <button onClick={() => { setActiveTab("bookings"); setCurrentPage(1); setMobileSidebarOpen(false); }} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-left transition cursor-pointer ${activeTab === "bookings" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "text-zinc-400 hover:text-white hover:bg-zinc-900"}`}>
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span className="flex-1">Pemesanan</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${activeTab === "bookings" ? "bg-amber-500 text-black" : "bg-zinc-800 text-zinc-400"}`}>{bookings.length}</span>
            </button>
            <div className="border-t border-zinc-900 my-1" />
            <button onClick={() => { setActiveTab("packages"); setMobileSidebarOpen(false); }} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-left transition cursor-pointer ${activeTab === "packages" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "text-zinc-400 hover:text-white hover:bg-zinc-900"}`}>
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
              <span className="flex-1">Paket</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${activeTab === "packages" ? "bg-amber-500 text-black" : "bg-zinc-800 text-zinc-400"}`}>{packages.length}</span>
            </button>
            <button onClick={() => { setActiveTab("addons"); setMobileSidebarOpen(false); }} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-left transition cursor-pointer ${activeTab === "addons" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "text-zinc-400 hover:text-white hover:bg-zinc-900"}`}>
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              <span className="flex-1">Add-Ons</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${activeTab === "addons" ? "bg-amber-500 text-black" : "bg-zinc-800 text-zinc-400"}`}>{addons.length}</span>
            </button>
            <button onClick={() => { setActiveTab("coupons"); setMobileSidebarOpen(false); }} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-left transition cursor-pointer ${activeTab === "coupons" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "text-zinc-400 hover:text-white hover:bg-zinc-900"}`}>
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
              <span className="flex-1">Kupon</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${activeTab === "coupons" ? "bg-amber-500 text-black" : "bg-zinc-800 text-zinc-400"}`}>{coupons.length}</span>
            </button>
            <div className="border-t border-zinc-900 my-1" />
            <button onClick={() => { setActiveTab("recap"); setMobileSidebarOpen(false); }} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-left transition cursor-pointer ${activeTab === "recap" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "text-zinc-400 hover:text-white hover:bg-zinc-900"}`}>
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <span className="flex-1">Rekap & Ekspor</span>
            </button>
          </aside>
        </div>
      )}

      <div className="flex gap-6 items-start">

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-56 shrink-0 bg-[#0c0c0e] rounded-2xl border border-zinc-850 shadow-lg p-3 space-y-1 sticky top-6">
        <div className="px-3 py-2.5 border-b border-zinc-900 mb-1">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-sans">Menu Admin</span>
        </div>
        
        <button onClick={() => { setActiveTab("bookings"); setCurrentPage(1); }} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-left transition cursor-pointer ${activeTab === "bookings" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "text-zinc-400 hover:text-white hover:bg-zinc-900"}`}>
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span className="flex-1">Pemesanan</span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${activeTab === "bookings" ? "bg-amber-500 text-black" : "bg-zinc-800 text-zinc-400"}`}>{bookings.filter(b => b.approvalStatus === "pending").length}</span>
        </button>

        <div className="border-t border-zinc-900 my-1" />

        <button onClick={() => setActiveTab("packages")} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-left transition cursor-pointer ${activeTab === "packages" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "text-zinc-400 hover:text-white hover:bg-zinc-900"}`}>
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
          <span className="flex-1">Paket</span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${activeTab === "packages" ? "bg-amber-500 text-black" : "bg-zinc-800 text-zinc-400"}`}>{packages.length}</span>
        </button>

        <button onClick={() => setActiveTab("addons")} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-left transition cursor-pointer ${activeTab === "addons" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "text-zinc-400 hover:text-white hover:bg-zinc-900"}`}>
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          <span className="flex-1">Add-Ons</span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${activeTab === "addons" ? "bg-amber-500 text-black" : "bg-zinc-800 text-zinc-400"}`}>{addons.length}</span>
        </button>

        <button onClick={() => setActiveTab("coupons")} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-left transition cursor-pointer ${activeTab === "coupons" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "text-zinc-400 hover:text-white hover:bg-zinc-900"}`}>
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
          <span className="flex-1">Kupon</span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${activeTab === "coupons" ? "bg-amber-500 text-black" : "bg-zinc-800 text-zinc-400"}`}>{coupons.length}</span>
        </button>

        <div className="border-t border-zinc-900 my-1" />

        <button onClick={() => setActiveTab("recap")} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-left transition cursor-pointer ${activeTab === "recap" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "text-zinc-400 hover:text-white hover:bg-zinc-900"}`}>
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          <span className="flex-1">Rekap & Ekspor</span>
        </button>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0 space-y-6">

      {/* Upper Status Cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#0c0c0e] p-4 rounded-2xl border border-zinc-850 shadow-lg">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide block font-sans">TOTAL BOOKING</span>
          <p className="text-2xl font-sans font-bold text-white mt-1">{bookings.length}</p>
        </div>
        <div className="bg-[#0c0c0e] p-4 rounded-2xl border border-zinc-850 shadow-lg">
          <span className="text-[10px] font-bold text-amber-500/80 uppercase tracking-wide block font-sans">REVIEW PENDING</span>
          <p className="text-2xl font-sans font-bold text-amber-500 mt-1">{bookings.filter((b) => b.approvalStatus === "pending").length}</p>
        </div>
        <div className="bg-[#0c0c0e] p-4 rounded-2xl border border-zinc-850 shadow-lg">
          <span className="text-[10px] font-bold text-emerald-500/80 uppercase tracking-wide block font-sans">APPROVED ORDERS</span>
          <p className="text-2xl font-sans font-bold text-emerald-400 mt-1">{bookings.filter((b) => b.approvalStatus === "approved").length}</p>
        </div>
        <div className="bg-[#0c0c0e] p-4 rounded-2xl border border-zinc-850 shadow-lg">
          <span className="text-[10px] font-bold text-emerald-500/80 uppercase tracking-wide block font-sans">EST. REVENUE</span>
          <p className="text-lg font-sans font-bold text-[#f3f4f6] mt-1" title="Total nilai kontrak pesanan disetujui">Rp {bookings.filter((b) => b.approvalStatus === "approved").reduce((sum, b) => sum + b.totalPrice, 0).toLocaleString("id-ID")}</p>
        </div>
      </section>

      {dbLoading ? (
        <div className="py-20 text-center text-zinc-500 text-xs font-sans">Mengakses data administratif...</div>
      ) : (
        <div className="bg-[#0c0c0e] rounded-3xl border border-zinc-850 shadow-2xl p-4 md:p-8">
          
          {/* TAB 1: BOOKINGS */}
          {activeTab === "bookings" && (
            <div className="space-y-6 animate-fade-in">
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-900 pb-5">
                <div>
                  <h2 className="text-xl font-bold text-white">Pemesanan</h2>
                  <p className="text-xs text-zinc-400 mt-1">Kelola persetujuan dan pembayaran pesanan.</p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input type="text" placeholder="Cari nama / WA..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-36 pl-8 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-[11px] text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 transition" />
                    {searchQuery && <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition cursor-pointer"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>}
                  </div>
                </div>
              </div>

              {/* Filter row */}
              <div className="flex flex-wrap items-center gap-3 pb-2">
                <div className="flex items-center space-x-1 border border-zinc-800 bg-zinc-950 p-1 rounded-xl overflow-x-auto max-w-full whitespace-nowrap no-scrollbar">
                  <span className="text-[10px] text-zinc-500 font-bold px-2 uppercase tracking-wider">Approval</span>
                  {["all", "pending", "approved", "rejected"].map((filter) => (
                    <button key={filter} onClick={() => { setApprovalFilter(filter as any); setCurrentPage(1); }} className={`px-2.5 py-1 rounded-lg text-[10px] capitalize font-bold cursor-pointer transition shrink-0 ${approvalFilter === filter ? "bg-zinc-800 text-white shadow-md" : "text-zinc-400 hover:text-white"}`}>
                      {filter === "all" ? "Semua" : filter === "pending" ? "Pending" : filter === "approved" ? "Approved" : "Ditolak"}
                    </button>
                  ))}
                </div>
                <div className="flex items-center space-x-1 border border-zinc-800 bg-zinc-950 p-1 rounded-xl overflow-x-auto max-w-full whitespace-nowrap no-scrollbar">
                  <span className="text-[10px] text-zinc-500 font-bold px-2 uppercase tracking-wider">Payment</span>
                  {["all", "unpaid", "dp_paid", "paid"].map((filter) => (
                    <button key={filter} onClick={() => { setPaymentFilter(filter as any); setCurrentPage(1); }} className={`px-2.5 py-1 rounded-lg text-[10px] capitalize font-bold cursor-pointer transition shrink-0 ${paymentFilter === filter ? "bg-zinc-800 text-white shadow-md" : "text-zinc-400 hover:text-white"}`}>
                      {filter === "all" ? "Semua" : filter === "unpaid" ? "Blm Bayar" : filter === "dp_paid" ? "DP Paid" : "Lunas"}
                    </button>
                  ))}
                </div>
              </div>

              {filtered.length === 0 ? (
                <div className="py-16 text-center text-zinc-500 text-xs border border-dashed border-zinc-850 rounded-2xl">
                  Tidak ditemukan pesanan.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-zinc-850 text-[10px] font-sans uppercase text-zinc-500 bg-black/20">
                        <th className="py-2 px-2 rounded-l">Klien</th>
                        <th className="py-2 px-2">Acara</th>
                        <th className="py-2 px-2">Paket</th>
                        <th className="py-2 px-2">Add-Ons</th>
                        <th className="py-2 px-2 text-right">Biaya</th>
                        <th className="py-2 px-2 text-center">Status</th>
                        <th className="py-2 px-2 text-center rounded-r">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900">
                      {paginatedBookings.map((b) => ( b && (
                        <tr key={b.id} className="hover:bg-zinc-900/10 transition">
                          <td className="py-1 px-2 leading-[13px]">
                            <span className="font-sans text-[9px] bg-zinc-900 border border-zinc-800 font-bold px-1 py-0.5 rounded text-zinc-350 block w-fit mb-0.5">{b.id}</span>
                            <div className="text-white font-bold text-[10px]">{b.customerName}</div>
                            <div className="text-zinc-400 text-[9px]">{b.customerPhone}</div>
                            <div className="text-zinc-500 text-[9px]">{b.customerCity}</div>
                          </td>
                          <td className="py-1 px-2 leading-[13px]">
                            <span className="text-[9px] font-bold text-zinc-300 capitalize bg-zinc-900 border border-zinc-800 px-1 py-0.5 rounded block w-fit font-sans mb-0.5">{b.eventType === "wedding" ? `Wedding${b.weddingType ? " ("+b.weddingType+")" : ""}` : "Event"}</span>
                            <div className="text-zinc-200 text-[10px]">{formatEventDate(b.eventDate, { year: "numeric", month: "short", day: "numeric" })}</div>
                            <div className="text-zinc-450 text-[9px] truncate max-w-[140px]">{b.venueLocation}</div>
                          </td>
                          <td className="py-1 px-2 leading-[13px]">
                            <span className="text-white text-[10px]">{b.packageName}</span>
                          </td>
                          <td className="py-1 px-2 leading-[13px]">
                            <div className="flex flex-wrap gap-x-1">
                              {b.days && b.days.length > 1 && (
                                <span className="text-[9px] text-zinc-500 font-sans">{b.days.length} hari</span>
                              )}
                            </div>
                            {b.addonDetails && b.addonDetails.length > 0 ? (
                              <div>{b.addonDetails.reduce((acc: Record<string, number>, a) => {
                                const key = a.name;
                                acc[key] = (acc[key] || 0) + 1;
                                return acc;
                              }, {} as Record<string, number>) && Object.entries(
                                b.addonDetails.reduce((acc: Record<string, number>, a) => {
                                  acc[a.name] = (acc[a.name] || 0) + 1;
                                  return acc;
                                 }, {} as Record<string, number>)
                               ).map(([name, qty]) => (
                                 <div key={name} className="text-[9px] text-zinc-400 font-sans leading-[13px]">+ {name}{(qty as number) > 1 ? ` ×${qty}` : ""}</div>
                               ))}</div>
                            ) : (
                              <span className="text-[9px] text-zinc-600 font-sans">—</span>
                            )}
                          </td>
                          <td className="py-1 px-2 text-right leading-[13px]">
                            <span className="font-sans text-amber-400 text-[10px]">Rp {b.totalPrice.toLocaleString("id-ID")}</span>
                          </td>
                          <td className="py-1 px-2 text-center">
                            {b.approvalStatus === "rejected" ? (
                              <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase">DITOLAK</span>
                            ) : b.approvalStatus === "pending" ? (
                              <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 uppercase animate-pulse">PENDING</span>
                            ) : (
                              <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-emerald-600 text-white uppercase">DISETUJUI</span>
                            )}
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap">
                            <div className="flex flex-col gap-1.5">
                              {b.approvalStatus === "pending" && (
                                <>
                                  <button onClick={() => handleApproval(b.id, "approved")} className="w-full py-1.5 px-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-bold text-[11px] uppercase transition cursor-pointer flex items-center justify-center gap-1.5"><Check className="w-3 h-3" /><span>Setujui</span></button>
                                  <button onClick={() => handleApproval(b.id, "rejected")} className="w-full py-1.5 px-2.5 bg-rose-700 hover:bg-rose-600 text-white rounded-lg font-bold text-[11px] uppercase transition cursor-pointer flex items-center justify-center gap-1.5"><X className="w-3 h-3" /><span>Tolak</span></button>
                                </>
                              )}
                              {b.approvalStatus === "approved" && (
                                <button onClick={() => onOpenInvoice(b)} className="w-full py-1.5 px-2.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-70 transition text-zinc-300 rounded-lg font-bold text-[11px] uppercase cursor-pointer flex items-center justify-center gap-1.5"><FileText className="w-3.5 h-3.5 text-zinc-400" /><span>Detail</span></button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )))}
                    </tbody>
                  </table>
                </div>
              )}

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4 border-t border-zinc-900 mt-4">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer">Prev</button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button key={page} onClick={() => setCurrentPage(page)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${currentPage === page ? "bg-amber-500 text-black" : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:bg-zinc-800"}`}>{page}</button>
                  ))}
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer">Next</button>
                  <span className="text-xs text-zinc-500 ml-2">{activeList.length} total</span>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: PACKAGES CRUD */}
          {activeTab === "packages" && (
            <div className="space-y-6 animate-fade-in">
              
              <div className="flex justify-between items-center border-b border-zinc-900 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Kelola Paket Utama</h2>
                  <p className="text-xs text-zinc-400 mt-1">Daftar paket utama cinematografi yang disuguhkan pelanggan.</p>
                </div>

                <button
                  onClick={() => handleOpenPkgModal(null)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-xl flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Paket</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {packages.map((p) => (
                  <div key={p.id} className="p-5 rounded-2xl border border-zinc-800 bg-zinc-950/40 space-y-4 flex flex-col justify-between hover:border-zinc-700 transition">
                    <div className="space-y-2">
                      <div className="flex justify-end items-start w-full">
                        <div className="flex space-x-1.5">
                          <span className="text-xs font-bold uppercase tracking-wide bg-zinc-900 text-amber-500 border border-zinc-800 px-2.5 py-0.5 rounded">
                            {p.category === "signature" ? "Signature" : "Regular"}
                          </span>
                          {p.type !== "both" && (
                            <span className="text-xs font-bold uppercase tracking-wide bg-zinc-900 text-amber-500 border border-zinc-800 px-2.5 py-0.5 rounded">
                              {p.type === "wedding" ? "Wedding" : "Event"}
                            </span>
                          )}
                        </div>
                      </div>
                      <h4 className="text-base font-bold text-white">{p.name}</h4>
                      <p className="text-xs text-zinc-400 leading-normal">{p.description}</p>
                      
                      <div className="pt-2">
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wide block font-sans">FITUR UTAMA</span>
                        <ul className="mt-1.5 space-y-1 text-zinc-300 text-xs">
                          {p.features && p.features.map((f, i) => (
                            <li key={i} className="flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5 text-amber-500" />
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-zinc-900 flex justify-between items-center">
                      <div>
                        <span className="text-xs font-medium text-zinc-500 block uppercase font-sans">DIPUBLISH DENGAN HARGA</span>
                        <span className="text-base font-sans font-bold text-amber-400">
                          Rp {p.price.toLocaleString("id-ID")}
                        </span>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleOpenPkgModal(p)}
                          className="p-2 text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition cursor-pointer"
                          title="Ubah Paket"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeletePackage(p.id)}
                          className="p-2 text-rose-450 hover:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg transition cursor-pointer"
                          title="Hapus Paket"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* TAB 3: ADDONS CRUD */}
          {activeTab === "addons" && (
            <div className="space-y-6 animate-fade-in">
              
              <div className="flex justify-between items-center border-b border-zinc-900 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Kelola Add-Ons Layanan</h2>
                  <p className="text-xs text-zinc-400 mt-1">Layanan kustom opsional pendukung rekaman video.</p>
                </div>

                <button
                  onClick={() => handleOpenAddonModal(null)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-xl flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Add-On</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {addons.map((a) => (
                  <div key={a.id} className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/45 flex flex-col justify-between space-y-4 hover:border-zinc-700 transition">
                    <div className="space-y-1.5">
                      <span className="text-xs font-sans font-bold text-zinc-500">{a.id}</span>
                      <h4 className="text-sm font-bold text-white block">{a.name}</h4>
                      <p className="text-xs text-zinc-400 leading-normal">{a.description}</p>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-zinc-900">
                      <span className="text-xs font-sans font-bold text-amber-400">
                        Rp {a.price.toLocaleString("id-ID")}
                      </span>

                      <div className="flex space-x-1.5">
                        <button
                          onClick={() => handleOpenAddonModal(a)}
                          className="p-1.5 text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 rounded-md border border-zinc-800 transition cursor-pointer"
                          title="Ubah Add-On"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteAddon(a.id)}
                          className="p-1.5 text-rose-450 hover:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-md transition cursor-pointer"
                          title="Hapus Add-On"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* TAB 4: RECAP & EXCEL EXPORT PANEL */}
          {activeTab === "recap" && (
            <div className="space-y-8 animate-fade-in text-zinc-150">
              
              <div className="border-b border-zinc-900 pb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
                  <FileSpreadsheet className="w-5.5 h-5.5 text-emerald-400" />
                  Rekap Data & Ekspor Excel (Krealogs.com)
                </h2>
                <p className="text-xs text-zinc-400 mt-1">Unduh rekapitulasi lengkap data administrasi langsung dalam format Excel-friendly CSV dengan UTF-8 BOM untuk presisi pemuatan data.</p>
              </div>

              {/* Stat Sub-bar in Recap tab */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 bg-zinc-950 rounded-2xl border border-zinc-900 flex justify-between items-center">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wide font-sans">APPROVED REVENUE</span>
                    <p className="text-xl font-bold text-emerald-400 font-sans">
                      Rp {bookings.filter(b => b.approvalStatus === "approved").reduce((sum, b) => sum + b.totalPrice, 0).toLocaleString("id-ID")}
                    </p>
                  </div>
                  <div className="p-2 bg-emerald-500/10 rounded-xl">
                    <Coins className="w-4 h-4 text-emerald-400" />
                  </div>
                </div>

                <div className="p-5 bg-zinc-950 rounded-2xl border border-zinc-900 flex justify-between items-center">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wide font-sans">DP TERKUMPUL</span>
                    <p className="text-xl font-bold text-white font-sans">
                      Rp {bookings.filter(b => b.approvalStatus === "approved").reduce((sum, b) => sum + b.amountPaid, 0).toLocaleString("id-ID")}
                    </p>
                  </div>
                  <div className="p-2 bg-zinc-905 rounded-xl border border-zinc-850">
                    <Check className="w-4 h-4 text-zinc-450" />
                  </div>
                </div>

                <div className="p-5 bg-zinc-950 rounded-2xl border border-zinc-900 flex justify-between items-center">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wide font-sans">SISA PIUTANG</span>
                    <p className="text-xl font-bold text-amber-500 font-sans">
                      Rp {bookings.filter(b => b.approvalStatus === "approved").reduce((sum, b) => sum + b.remainingPayment, 0).toLocaleString("id-ID")}
                    </p>
                  </div>
                  <div className="p-2 bg-amber-500/10 rounded-xl">
                    <TrendingUp className="w-4 h-4 text-amber-400" />
                  </div>
                </div>
              </div>

              {/* Grid of Exporters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
                
                {/* Bookings Exporter */}
                <div className="p-5 bg-zinc-950 rounded-2xl border border-zinc-850 flex flex-col justify-between hover:border-emerald-500/20 transition h-52">
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 px-2 py-0.5 rounded font-sans block w-fit">PRIMARY DATA</span>
                    <h3 className="text-sm font-bold text-white">Ekspor Rekap Booking</h3>
                    <p className="text-xs text-zinc-450 leading-normal">Unduh seluruh riwayat pendaftaran kontrak kustomer, domisili, paket pilihan, status pembayaran, serta tanggal approval.</p>
                  </div>
                  <button
                    onClick={() => exportBookingsToCSV(bookings)}
                    className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Unduh Rekap Booking (.csv)</span>
                  </button>
                </div>

                {/* Packages Exporter */}
                <div className="p-5 bg-zinc-950 rounded-2xl border border-zinc-850 flex flex-col justify-between hover:border-emerald-500/20 transition h-52">
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-zinc-450 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded font-sans block w-fit">CATALOG DATA</span>
                    <h3 className="text-sm font-bold text-white">Ekspor Katalog Paket</h3>
                    <p className="text-xs text-zinc-450 leading-normal">Unduh daftar katalog paket videografi aktif yang tersaji pada menu customer untuk kebutuhan penyesuaian penawaran offline.</p>
                  </div>
                  <button
                    onClick={() => exportPackagesToCSV(packages)}
                    className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 bg-zinc-900 border border-zinc-800 hover:border-amber-500 text-zinc-100 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-zinc-450" />
                    <span>Unduh Katalog Paket (.csv)</span>
                  </button>
                </div>

                {/* Addons Exporter */}
                <div className="p-5 bg-zinc-950 rounded-2xl border border-zinc-850 flex flex-col justify-between hover:border-emerald-500/20 transition h-52">
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-zinc-450 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded font-sans block w-fit">UPSELL DATA</span>
                    <h3 className="text-sm font-bold text-white">Ekspor Katalog Add-On</h3>
                    <p className="text-xs text-zinc-450 leading-normal">Unduh daftar item tambahan atau add-ons beserta harganya sebagai instrumen audit penjualan pelengkap pengerjaan klip.</p>
                  </div>
                  <button
                    onClick={() => exportAddonsToCSV(addons)}
                    className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 bg-zinc-900 border border-zinc-800 hover:border-amber-500 text-zinc-100 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-zinc-450" />
                    <span>Unduh Katalog Add-On (.csv)</span>
                  </button>
                </div>

              </div>

              {/* Data Preview Table */}
              <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-900 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wide block font-sans">Daftar Preview Data Terkini</h4>
                    <span className="text-xs text-zinc-500 mt-0.5 block">Menampilkan maksimal 5 bookings terbaru untuk memvalidasi isi berkas sebelum dilanjutkan penarikan ekspor.</span>
                  </div>
                  <span className="text-xs font-bold font-sans text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/10">
                    {bookings.length} Rekor Total
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-900 text-zinc-500 font-bold">
                        <th className="py-2.5">ID BOOKING</th>
                        <th className="py-2.5">NAMA KUSTOMER</th>
                        <th className="py-2.5">JENIS ACARA</th>
                        <th className="py-2.5">TANGGAL ACARA</th>
                        <th className="py-2.5">PAKET</th>
                        <th className="py-2.5 text-right">TOTAL BIAYA</th>
                        <th className="py-2.5 text-center">STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900 text-zinc-350">
                      {bookings.slice(0, 5).map((b) => (
                        <tr key={b.id} className="hover:bg-zinc-900/30 transition">
                          <td className="py-3 font-sans font-medium text-white">{b.id}</td>
                          <td className="py-3 font-medium">{b.customerName}</td>
                          <td className="py-3 capitalize">
                            {b.eventType === "wedding" ? `Wedding (${b.weddingType || "Pernikahan"})` : b.eventType}
                          </td>
                          <td className="py-3">{new Date(b.eventDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</td>
                          <td className="py-3 font-medium truncate max-w-[120px]" title={b.packageName}>{b.packageName}</td>
                          <td className="py-3 text-right font-sans font-bold text-white">Rp {b.totalPrice.toLocaleString("id-ID")}</td>
                          <td className="py-3 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold font-sans ${
                              b.approvalStatus === "rejected" ? "bg-rose-500/10 text-rose-400 border border-rose-500/10" :
                              b.approvalStatus === "pending" ? "bg-zinc-500/10 text-zinc-400 border border-zinc-500/10" :
                              b.paymentStatus === "paid" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/10" :
                              b.paymentStatus === "dp_paid" ? "bg-blue-500/10 text-blue-400 border border-blue-500/10" :
                              "bg-amber-500/10 text-amber-400 border border-amber-500/10"
                            }`}>
                              {b.approvalStatus === "rejected" ? "DITOLAK" : b.approvalStatus === "pending" ? "PENDING" : b.paymentStatus === "paid" ? "LUNAS" : b.paymentStatus === "dp_paid" ? "DP PAID" : "APPROVED"}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {bookings.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-zinc-550 font-sans">Belum ada pemesanan masuk untuk diekspor.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 5: COUPONS PANEL */}
          {activeTab === "coupons" && (
            <div className="space-y-6 animate-fade-in text-zinc-150">
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-900 pb-5">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Ticket className="w-5 h-5 text-amber-500" />
                    Kelola Kupon Diskon
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1">
                    Buat kode kupon promosi, tetapkan persentase potongan harga, dan batas waktu kedaluwarsa kupon.
                  </p>
                </div>
                
                <button
                  onClick={() => handleOpenCouponModal(null)}
                  className="flex items-center gap-1.5 py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Buat Kupon Baru</span>
                </button>
              </div>

              {/* Coupons List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {coupons.map((c) => {
                  const isExpired = new Date(c.validUntil) < new Date();
                  return (
                    <div
                      key={c.code}
                      className={`p-5 bg-zinc-950 rounded-2xl border transition hover:border-zinc-800 ${
                        !c.isActive 
                          ? "border-zinc-900 opacity-60" 
                          : isExpired 
                          ? "border-rose-950" 
                          : "border-zinc-850"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-zinc-500 font-sans tracking-wide block uppercase">DISCOUNT CODE</span>
                          <span className="text-base font-bold text-white font-sans tracking-wide bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                            {c.code}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {isExpired ? (
                            <span className="text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded">
                              EXPIRED
                            </span>
                          ) : c.isActive ? (
                            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                              ACTIVE
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-zinc-400 bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded">
                              INACTIVE
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-zinc-900 space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Persentase Diskon:</span>
                          <span className="font-bold text-amber-400 font-sans">{c.discountPercent}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Berlaku Hingga:</span>
                          <span className="font-medium text-zinc-300 font-sans">
                            {formatEventDate(c.validUntil, { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </div>
                      </div>

                      <div className="mt-5 flex justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenCouponModal(c)}
                          className="p-1.5 text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-md transition cursor-pointer"
                          title="Edit Kupon"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCoupon(c.code)}
                          className="p-1.5 text-rose-450 hover:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-md transition cursor-pointer"
                          title="Hapus Kupon"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {coupons.length === 0 && (
                  <div className="col-span-full py-12 text-center text-zinc-500 text-xs font-sans">
                    Belum ada kupon diskon yang dibuat. Klik tombol di kanan atas untuk membuat kupon pertama Anda!
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      )}

      {/* PACKAGE REGISTER MODAL */}
      {isPkgModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-lg bg-[#0c0c0e] rounded-2xl shadow-2xl border border-zinc-800 overflow-hidden animate-scale-up">
            <div className="px-6 py-4 bg-zinc-950 border-b border-zinc-900 flex justify-between items-center">
              <h3 className="text-sm font-bold text-white">{pkgEditId ? "Ubah Detail Paket" : "Buat Paket Baru"}</h3>
              <button onClick={() => setIsPkgModalOpen(false)} className="p-1 text-zinc-500 hover:text-white rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSavePackage} className="p-6 space-y-4 text-xs text-zinc-200">
              <div className="space-y-1.5">
                <label className="font-medium text-zinc-400">Nama Paket Videography</label>
                <input
                  type="text"
                  required
                  placeholder="cth: Wedding Cinematic Gold"
                  value={pkgName}
                  onChange={(e) => setPkgName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-950 rounded-xl border border-zinc-800 focus:border-amber-500 text-white focus:outline-none transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-zinc-400">Deskripsi Ringkas Paket</label>
                <textarea
                  placeholder="cth: Paket premium cinematografi dilengkapi editing klip highlight..."
                  value={pkgDesc}
                  onChange={(e) => setPkgDesc(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-950 rounded-xl border border-zinc-800 focus:border-amber-500 text-white focus:outline-none transition resize-none h-16"
                />
              </div>

              <div className="grid grid-cols-3 gap-3 font-sans focus:outline-none">
                <div className="space-y-1.5">
                  <label className="font-medium text-zinc-400">Tipe / Kategori Acara</label>
                  <select
                    value={pkgType}
                    onChange={(e) => setPkgType(e.target.value as any)}
                    className="w-full px-2 py-2.5 bg-zinc-950 rounded-xl border border-zinc-850 text-white text-xs font-medium focus:outline-none"
                  >
                    <option value="wedding">Wedding (Pernikahan)</option>
                    <option value="event">Event (Gathering/Komersial)</option>
                    <option value="both">Wedding & Event</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-medium text-zinc-400">Tampilan Paket</label>
                  <select
                    value={pkgCategory}
                    onChange={(e) => setPkgCategory(e.target.value as any)}
                    className="w-full px-2 py-2.5 bg-zinc-950 rounded-xl border border-zinc-850 text-white text-xs font-medium focus:outline-none"
                  >
                    <option value="regular">Regular</option>
                    <option value="signature">Signature</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-medium text-zinc-400">Harga (IDR)</label>
                  <input
                    type="number"
                    required
                    value={pkgPrice}
                    onChange={(e) => setPkgPrice(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-zinc-950 rounded-xl border border-zinc-800 focus:border-amber-500 text-white focus:outline-none transition font-sans font-bold text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center mb-0.5">
                  <label className="font-medium text-zinc-400">Daftar Fitur (Satu per baris)</label>
                  <span className="text-xs text-zinc-500">Gunakan baris baru untuk memisahkan fitur</span>
                </div>
                <textarea
                  placeholder="- 2 Videographer Berpengalaman&#10;- Video Cinematic Highlight 3-5 Menit&#10;- Link Google Drive Selamanya"
                  value={pkgFetStr}
                  onChange={(e) => setPkgFetStr(e.target.value)}
                  className="w-full p-4 bg-zinc-950 rounded-xl border border-zinc-800 focus:border-amber-500 text-white font-sans text-xs h-28 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-900">
                <button
                  type="button"
                  onClick={() => setIsPkgModalOpen(false)}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-xl font-bold cursor-pointer transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-xl font-bold cursor-pointer transition"
                >
                  Simpan Paket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADDON REGISTER MODAL */}
      {isAddonModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-sm bg-[#0c0c0e] rounded-2xl shadow-2xl border border-zinc-800 overflow-hidden animate-scale-up">
            <div className="px-6 py-4 bg-zinc-950 border-b border-zinc-900 flex justify-between items-center">
              <h3 className="text-sm font-bold text-white">{addonEditId ? "Ubah Add-On" : "Tambah Add-On Baru"}</h3>
              <button onClick={() => setIsAddonModalOpen(false)} className="p-1 text-zinc-500 hover:text-white rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveAddon} className="p-6 space-y-4 text-xs text-zinc-300">
              <div className="space-y-1.5">
                <label className="font-medium text-zinc-400">Nama Add-On</label>
                <input
                  type="text"
                  required
                  placeholder="cth: Drone Shoot Resolusi 4K"
                  value={addonName}
                  onChange={(e) => setAddonName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-950 rounded-xl border border-zinc-800 focus:border-amber-500 text-white focus:outline-none transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-zinc-400">Deskripsi Pendek Add-On</label>
                <textarea
                  placeholder="cth: Klip udara sinematik tambahan selama acara..."
                  value={addonDesc}
                  onChange={(e) => setAddonDesc(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-950 rounded-xl border border-zinc-800 focus:border-amber-500 text-white focus:outline-none transition resize-none h-20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-zinc-400">Harga Jasa Add-On (IDR)</label>
                <input
                  type="number"
                  required
                  value={addonPrice}
                  onChange={(e) => setAddonPrice(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-zinc-950 rounded-xl border border-zinc-800 focus:border-amber-500 text-white focus:outline-none transition font-sans font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-900">
                <button
                  type="button"
                  onClick={() => setIsAddonModalOpen(false)}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-350 rounded-xl font-bold cursor-pointer transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-xl font-bold cursor-pointer transition"
                >
                  Simpan Add-On
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COUPON REGISTER MODAL */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-sm bg-[#0c0c0e] rounded-2xl shadow-2xl border border-zinc-800 overflow-hidden animate-scale-up">
            <div className="px-6 py-4 bg-zinc-950 border-b border-zinc-900 flex justify-between items-center">
              <h3 className="text-sm font-bold text-white">{couponEditCode ? "Ubah Detail Kupon" : "Buat Kupon Diskon Baru"}</h3>
              <button onClick={() => setIsCouponModalOpen(false)} className="p-1 text-zinc-500 hover:text-white rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveCoupon} className="p-6 space-y-4 text-xs text-zinc-300">
              <div className="space-y-1.5">
                <label className="font-medium text-zinc-400">Kode Kupon</label>
                <input
                  type="text"
                  required
                  disabled={!!couponEditCode}
                  placeholder="cth: KREALOVE10"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2.5 bg-zinc-950 rounded-xl border border-zinc-800 focus:border-amber-500 text-white focus:outline-none transition uppercase font-sans font-bold disabled:opacity-50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-zinc-400">Persentase Diskon (%)</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="100"
                  placeholder="10"
                  value={couponPercent}
                  onChange={(e) => setCouponPercent(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-zinc-950 rounded-xl border border-zinc-800 focus:border-amber-500 text-white focus:outline-none transition font-sans font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-zinc-400">Berlaku Hingga Tanggal</label>
                <input
                  type="date"
                  required
                  value={couponExpiry}
                  onChange={(e) => setCouponExpiry(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-950 rounded-xl border border-zinc-800 focus:border-amber-500 text-white focus:outline-none transition font-sans font-bold"
                />
              </div>

              <div className="flex items-center gap-2 py-2">
                <input
                  type="checkbox"
                  id="coupon-active-checkbox"
                  checked={couponActive}
                  onChange={(e) => setCouponActive(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded bg-zinc-950 border border-zinc-800 cursor-pointer"
                />
                <label htmlFor="coupon-active-checkbox" className="font-medium text-zinc-300 cursor-pointer select-none">
                  Kupon Aktif & Dapat Digunakan
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-900">
                <button
                  type="button"
                  onClick={() => setIsCouponModalOpen(false)}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-350 rounded-xl font-bold cursor-pointer transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-xl font-bold cursor-pointer transition"
                >
                  {couponEditCode ? "Simpan Perubahan" : "Buat Kupon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Premium Toast Notification (Sonner Style) */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border text-xs font-sans font-bold ${
              toast.type === "success"
                ? "bg-emerald-50 border-emerald-250 text-emerald-800"
                : "bg-rose-50 border-rose-250 text-rose-800"
            }`}
          >
            {toast.type === "success" ? (
              <Check className="w-4 h-4 text-emerald-600 shrink-0 stroke-[2.5]" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Confirmation Modal */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-600 shrink-0">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-zinc-900">{confirmModal.title}</h3>
                </div>
                <p className="text-xs text-zinc-550 leading-normal">
                  {confirmModal.message}
                </p>
              </div>
              <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-150 flex justify-end gap-2">
                <button
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 border border-zinc-250 text-zinc-700 hover:bg-zinc-100 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={confirmModal.onConfirm}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Konfirmasi
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

        </div>{/* end flex-1 */}
      </div>{/* end flex desktop */}
    </div>
  );
}
