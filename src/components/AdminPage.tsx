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
}

export default function AdminPage({ onOpenInvoice }: AdminPageProps) {
  // DB States
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [dbLoading, setDbLoading] = useState(true);

  // Active Tab
  const [activeTab, setActiveTab] = useState<"bookings" | "packages" | "addons" | "recap" | "coupons">("bookings");

  // Filter Bookings
  const [bookingFilter, setBookingFilter] = useState<"all" | "pending" | "approved" | "dp_paid" | "paid" | "rejected">("all");

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

  // Accept / Reject Actions
  const handleBookingStatus = (id: string, status: "approved" | "rejected" | "dp_paid" | "paid") => {
    const isApprove = status === "approved";
    const isPaid = status === "paid";
    const isDPPaid = status === "dp_paid";
    const isReject = status === "rejected";

    let title = "";
    let message = "";
    if (isApprove) {
      title = "Setujui Pemesanan";
      message = "Apakah Anda yakin ingin menyetujui jadwal & kru pesanan ini? Tindakan ini akan menerbitkan Invoice Resmi Belum Bayar yang dapat diakses kustomer.";
    } else if (isReject) {
      title = "Tolak Pemesanan";
      message = "Apakah Anda yakin ingin menolak pemesanan ini? Kustomer tidak akan dapat mengakses dokumen apa pun.";
    } else if (isDPPaid) {
      title = "Konfirmasi DP Diterima";
      message = "Apakah Anda yakin telah menerima pembayaran DP dari kustomer? Status akan diperbarui menjadi DP Paid dan Invoice berstempel DP TERBAYAR akan terbit.";
    } else if (isPaid) {
      title = "Konfirmasi Lunas Diterima";
      message = "Apakah Anda yakin telah menerima pelunasan pembayaran dari kustomer? Status akan diperbarui menjadi Paid dan Kwitansi Resmi berstempel LUNAS akan terbit.";
    }

    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          const response = await fetch(`/api/bookings/${id}/status`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ status })
          });
          const result = await response.json();
          if (response.ok && result.success) {
            setBookings(bookings.map((b) => (b.id === id ? { ...b, status, approvedAt: status === "approved" ? new Date().toISOString() : b.approvedAt } : b)));
            showToast(
              isPaid
                ? "Pelunasan berhasil dikonfirmasi!"
                : isDPPaid
                  ? "Pembayaran DP berhasil dikonfirmasi!"
                  : isApprove
                    ? "Pemesanan berhasil disetujui!"
                    : "Pemesanan berhasil ditolak!",
              "success"
            );
          } else {
            showToast(result.error || "Gagal mengubah status pesanan", "error");
          }
        } catch (err) {
          console.error("Booking edit status error:", err);
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
        headers: { "Content-Type": "application/json" },
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
          const response = await fetch(`/api/packages/${id}`, { method: "DELETE" });
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
        headers: { "Content-Type": "application/json" },
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
          const response = await fetch(`/api/addons/${id}`, { method: "DELETE" });
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
        headers: { "Content-Type": "application/json" },
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
          const response = await fetch(`/api/coupons/${code}`, { method: "DELETE" });
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

  // Excel & CSV recap exporting hooks are loaded directly from utils/excelExport.ts

  const filteredBookings = bookings.filter((b) => {
    if (bookingFilter === "all") return true;
    return b.status === bookingFilter;
  });

  return (
    <div className="space-y-8 text-zinc-150">
      
      {/* Upper Status Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="bg-[#0c0c0e] p-5 rounded-2xl border border-zinc-850 shadow-lg">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">TOTAL BOOKING</span>
          <p className="text-3xl font-mono font-extrabold text-white mt-1.5">{bookings.length}</p>
        </div>

        <div className="bg-[#0c0c0e] p-5 rounded-2xl border border-zinc-850 shadow-lg">
          <span className="text-[10px] font-bold text-brand-500/80 uppercase tracking-widest block font-mono">REVIEW PENDING</span>
          <p className="text-3xl font-mono font-extrabold text-brand-500 mt-1.5">
            {bookings.filter((b) => b.status === "pending").length}
          </p>
        </div>

        <div className="bg-[#0c0c0e] p-5 rounded-2xl border border-zinc-850 shadow-lg">
          <span className="text-[10px] font-bold text-emerald-500/80 uppercase tracking-widest block font-mono">APPROVED ORDERS</span>
          <p className="text-3xl font-mono font-extrabold text-emerald-400 mt-1.5">
            {bookings.filter((b) => ["approved", "dp_paid", "paid"].includes(b.status)).length}
          </p>
        </div>

        <div className="bg-[#0c0c0e] p-5 rounded-2xl border border-zinc-850 shadow-lg flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-emerald-500/80 uppercase tracking-widest block font-mono">ESTIMASI REVENUE</span>
            <p className="text-2xl font-mono font-extrabold text-[#f3f4f6]" title="Total nilai kontrak pesanan disetujui">
              Rp {bookings
                .filter((b) => ["approved", "dp_paid", "paid"].includes(b.status))
                .reduce((sum, b) => sum + b.totalPrice, 0)
                .toLocaleString("id-ID")}
            </p>
          </div>
          <div className="p-2.5 bg-emerald-500/10 rounded-xl">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
        </div>
      </section>

      {/* Admin Tab Handles */}
      <section className="bg-zinc-950 p-1.5 border border-zinc-850 rounded-2xl shadow-inner flex flex-wrap gap-1 mb-6">
        <button
          onClick={() => setActiveTab("bookings")}
          className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl text-xs font-bold text-center cursor-pointer transition ${
            activeTab === "bookings" ? "bg-brand-500 text-black shadow-lg" : "text-zinc-400 hover:text-white"
          }`}
        >
          Pemesanan Masuk ({bookings.length})
        </button>
        <button
          onClick={() => setActiveTab("packages")}
          className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl text-xs font-bold text-center cursor-pointer transition ${
            activeTab === "packages" ? "bg-brand-500 text-black shadow-lg" : "text-zinc-400 hover:text-white"
          }`}
        >
          Kelola Paket ({packages.length})
        </button>
        <button
          onClick={() => setActiveTab("addons")}
          className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl text-xs font-bold text-center cursor-pointer transition ${
            activeTab === "addons" ? "bg-brand-500 text-black shadow-lg" : "text-zinc-400 hover:text-white"
          }`}
        >
          Kelola Add-Ons ({addons.length})
        </button>
        <button
          onClick={() => setActiveTab("coupons")}
          className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl text-xs font-bold text-center cursor-pointer transition ${
            activeTab === "coupons" ? "bg-brand-500 text-black shadow-lg" : "text-zinc-400 hover:text-white"
          }`}
        >
          Kupon Diskon ({coupons.length})
        </button>
        <button
          onClick={() => setActiveTab("recap")}
          className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl text-xs font-bold text-center cursor-pointer transition ${
            activeTab === "recap" ? "bg-emerald-600 text-white shadow-lg" : "text-zinc-400 hover:text-white"
          }`}
        >
          Rekap & Ekspor Excel
        </button>
      </section>

      {dbLoading ? (
        <div className="py-20 text-center text-zinc-500 text-xs font-mono">Mengakses data administratif...</div>
      ) : (
        <div className="bg-[#0c0c0e] rounded-3xl border border-zinc-850 shadow-2xl p-4 md:p-8">
          
          {/* TAB 1: BOOKING CONTROLS */}
          {activeTab === "bookings" && (
            <div className="space-y-6 animate-fade-in">
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-900 pb-5">
                <div>
                  <h2 className="text-xl font-bold text-white">Kelola Pemesanan Jasa</h2>
                  <p className="text-xs text-zinc-400 mt-1">Lakukan konfirmasi atau penolakan serta periksa nota kustomer.</p>
                </div>

                <div className="flex items-center space-x-1 border border-zinc-800 bg-zinc-950 p-1 rounded-xl overflow-x-auto max-w-full whitespace-nowrap no-scrollbar">
                  {["all", "pending", "approved", "dp_paid", "paid", "rejected"].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setBookingFilter(filter as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs capitalize font-bold cursor-pointer transition shrink-0 ${
                        bookingFilter === filter 
                          ? "bg-zinc-800 text-white shadow-md" 
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      {filter === "all"
                        ? "Semua"
                        : filter === "pending"
                          ? "Menunggu"
                          : filter === "approved"
                            ? "Approved"
                            : filter === "dp_paid"
                              ? "DP Paid"
                              : filter === "paid"
                                ? "Lunas"
                                : "Ditolak"}
                    </button>
                  ))}
                </div>
              </div>

              {filteredBookings.length === 0 ? (
                <div className="py-16 text-center text-zinc-500 text-xs border border-dashed border-zinc-850 rounded-2xl">
                  Tidak ditemukan pesanan dengan status: <strong className="text-brand-500">{bookingFilter.toUpperCase()}</strong>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-zinc-850 text-[10px] font-mono uppercase text-zinc-500 bg-black/20">
                        <th className="py-3 px-4 rounded-l">Klien / Kontak</th>
                        <th className="py-3 px-4">Rincian Acara</th>
                        <th className="py-3 px-4">Layanan / Paket</th>
                        <th className="py-3 px-4 text-right">Biaya Pembayaran</th>
                        <th className="py-3 px-4 text-center">Status</th>
                        <th className="py-3 px-4 text-center rounded-r">Kelola & Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900">
                      {filteredBookings.map((b) => ( b && (
                        <tr key={b.id} className="hover:bg-zinc-900/10 transition">
                          <td className="py-4 px-4 space-y-1">
                            <span className="font-mono text-[10px] bg-zinc-900 border border-zinc-800 font-bold px-2 py-0.5 rounded text-zinc-350 block w-fit">
                              {b.id}
                            </span>
                            <span className="font-bold text-white block mt-1.5">{b.customerName}</span>
                            <span className="text-zinc-400 block font-mono">{b.customerPhone}</span>
                            <span className="text-[10px] text-zinc-500 block">{b.customerCity}</span>
                          </td>
                          <td className="py-4 px-4 space-y-1">
                            <span className="text-[10px] font-bold text-zinc-300 capitalize bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded block w-fit font-mono">
                              {b.eventType === "wedding" ? `Wedding (${b.weddingType || "Pernikahan"})` : "Event"}
                            </span>
                            <span className="text-zinc-200 block font-light">
                              {formatEventDate(b.eventDate, {
                                year: "numeric",
                                month: "short",
                                day: "numeric"
                              })}
                            </span>
                            <span className="text-[11px] text-zinc-450 block leading-tight truncate max-w-[200px]">{b.venueLocation}</span>
                          </td>
                          <td className="py-4 px-4 space-y-1.5">
                            <span className="font-semibold text-white block">{b.packageName}</span>
                            {b.addonDetails && b.addonDetails.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {b.addonDetails.map((a) => (
                                  <span key={a.id} className="text-[9px] bg-zinc-900 text-zinc-400 border border-zinc-850 px-1.5 py-0.5 rounded font-mono">
                                    +{a.name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4 text-right space-y-1">
                            <span className="font-mono font-medium text-brand-400 block">
                              Rp {b.totalPrice.toLocaleString("id-ID")}
                            </span>
                            <span className="text-[10px] text-emerald-400 block">
                              Masuk: Rp {b.amountPaid.toLocaleString("id-ID")} ({b.amountPaid < b.totalPrice ? `DP ${Math.round((b.amountPaid / b.totalPrice) * 100)}%` : "Lunas"})
                            </span>
                            {b.amountPaid < b.totalPrice && (
                              <span className="text-[10px] text-zinc-400 block">
                                Sisa tagihan: Rp {b.remainingPayment.toLocaleString("id-ID")}
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-center">
                            {b.status === "paid" ? (
                              <span className="px-2 py-0.5 text-[9px] font-black rounded bg-emerald-500 text-white uppercase tracking-widest">
                                LUNAS (RECEIPT)
                              </span>
                            ) : b.status === "dp_paid" ? (
                              <span className="px-2 py-0.5 text-[9px] font-black rounded bg-blue-600 text-white uppercase tracking-widest">
                                DP PAID (INVOICE)
                              </span>
                            ) : b.status === "approved" ? (
                              <span className="px-2 py-0.5 text-[9px] font-black rounded bg-brand-500 text-black uppercase tracking-widest">
                                INVOICE (UNPAID)
                              </span>
                            ) : b.status === "rejected" ? (
                              <span className="px-2 py-0.5 text-[9px] font-black rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase tracking-widest">
                                REJECTED
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 text-[9px] font-black rounded bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 uppercase tracking-widest">
                                PENDING
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap">
                            <div className="flex items-center justify-center gap-2">
                              {b.status === "pending" && (
                                <>
                                  <button
                                    onClick={() => handleBookingStatus(b.id, "approved")}
                                    className="p-1 px-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded font-bold text-[10px] uppercase transition cursor-pointer flex items-center space-x-1"
                                    title="Setujui Booking"
                                  >
                                    <Check className="w-3 h-3" />
                                    <span>Setujui</span>
                                  </button>
                                  <button
                                    onClick={() => handleBookingStatus(b.id, "rejected")}
                                    className="p-1 px-2.5 bg-rose-700 hover:bg-rose-600 text-white rounded font-bold text-[10px] uppercase transition cursor-pointer flex items-center space-x-1"
                                    title="Tolak Booking"
                                  >
                                    <X className="w-3 h-3" />
                                    <span>Tolak</span>
                                  </button>
                                </>
                              )}

                              {b.status === "approved" && (
                                <>
                                  <button
                                    onClick={() => handleBookingStatus(b.id, "dp_paid")}
                                    className="p-1 px-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold text-[10px] uppercase transition cursor-pointer flex items-center space-x-1"
                                    title="Konfirmasi Pembayaran DP"
                                  >
                                    <Check className="w-3 h-3" />
                                    <span>Terima DP</span>
                                  </button>
                                  <button
                                    onClick={() => handleBookingStatus(b.id, "paid")}
                                    className="p-1 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-[10px] uppercase transition cursor-pointer flex items-center space-x-1"
                                    title="Konfirmasi Pembayaran Lunas"
                                  >
                                    <Check className="w-3 h-3" />
                                    <span>Terima Lunas</span>
                                  </button>
                                </>
                              )}

                              {b.status === "dp_paid" && (
                                <button
                                  onClick={() => handleBookingStatus(b.id, "paid")}
                                  className="p-1 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-[10px] uppercase transition cursor-pointer flex items-center space-x-1"
                                  title="Konfirmasi Pelunasan"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Konfirmasi Lunas</span>
                                </button>
                              )}

                              <button
                                onClick={() => onOpenInvoice(b)}
                                className="p-1 px-2.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-70 transition text-zinc-300 rounded font-bold text-[10px] uppercase cursor-pointer flex items-center space-x-1"
                                title="Lihat Invoice Pemesanan"
                              >
                                <FileText className="w-3.5 h-3.5 text-zinc-400" />
                                <span>Detail</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      )))}
                    </tbody>
                  </table>
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
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-400 text-black text-xs font-extrabold rounded-xl flex items-center space-x-1.5 transition cursor-pointer"
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
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-zinc-900 text-brand-500 border border-zinc-800 px-2.5 py-0.5 rounded">
                            {p.category === "signature" ? "Signature" : "Regular"}
                          </span>
                          {p.type !== "both" && (
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-zinc-900 text-brand-500 border border-zinc-800 px-2.5 py-0.5 rounded">
                              {p.type === "wedding" ? "Wedding" : "Event"}
                            </span>
                          )}
                        </div>
                      </div>
                      <h4 className="text-base font-bold text-white">{p.name}</h4>
                      <p className="text-xs text-zinc-400 leading-normal">{p.description}</p>
                      
                      <div className="pt-2">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">FITUR UTAMA</span>
                        <ul className="mt-1.5 space-y-1 text-zinc-300 text-xs">
                          {p.features && p.features.map((f, i) => (
                            <li key={i} className="flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5 text-brand-500" />
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-zinc-900 flex justify-between items-center">
                      <div>
                        <span className="text-[9px] font-semibold text-zinc-500 block uppercase font-mono">DIPUBLISH DENGAN HARGA</span>
                        <span className="text-base font-mono font-bold text-brand-400">
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
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-400 text-black text-xs font-extrabold rounded-xl flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Add-On</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {addons.map((a) => (
                  <div key={a.id} className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/45 flex flex-col justify-between space-y-4 hover:border-zinc-700 transition">
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-mono font-bold text-zinc-500">{a.id}</span>
                      <h4 className="text-sm font-bold text-white block">{a.name}</h4>
                      <p className="text-xs text-zinc-400 leading-normal">{a.description}</p>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-zinc-900">
                      <span className="text-xs font-mono font-bold text-brand-400">
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
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono">APPROVED REVENUE</span>
                    <p className="text-xl font-bold text-emerald-400 font-mono">
                      Rp {bookings.filter(b => b.status === "approved").reduce((sum, b) => sum + b.totalPrice, 0).toLocaleString("id-ID")}
                    </p>
                  </div>
                  <div className="p-2 bg-emerald-500/10 rounded-xl">
                    <Coins className="w-4 h-4 text-emerald-400" />
                  </div>
                </div>

                <div className="p-5 bg-zinc-950 rounded-2xl border border-zinc-900 flex justify-between items-center">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono">DP TERKUMPUL</span>
                    <p className="text-xl font-bold text-white font-mono">
                      Rp {bookings.filter(b => b.status === "approved").reduce((sum, b) => sum + b.amountPaid, 0).toLocaleString("id-ID")}
                    </p>
                  </div>
                  <div className="p-2 bg-zinc-905 rounded-xl border border-zinc-850">
                    <Check className="w-4 h-4 text-zinc-450" />
                  </div>
                </div>

                <div className="p-5 bg-zinc-950 rounded-2xl border border-zinc-900 flex justify-between items-center">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono">SISA PIUTANG</span>
                    <p className="text-xl font-bold text-brand-500 font-mono">
                      Rp {bookings.filter(b => b.status === "approved").reduce((sum, b) => sum + b.remainingPayment, 0).toLocaleString("id-ID")}
                    </p>
                  </div>
                  <div className="p-2 bg-brand-500/10 rounded-xl">
                    <TrendingUp className="w-4 h-4 text-brand-400" />
                  </div>
                </div>
              </div>

              {/* Grid of Exporters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
                
                {/* Bookings Exporter */}
                <div className="p-5 bg-zinc-950 rounded-2xl border border-zinc-850 flex flex-col justify-between hover:border-emerald-500/20 transition h-52">
                  <div className="space-y-2">
                    <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 px-2 py-0.5 rounded font-mono block w-fit">PRIMARY DATA</span>
                    <h3 className="text-sm font-bold text-white">Ekspor Rekap Booking</h3>
                    <p className="text-[11px] text-zinc-450 leading-normal">Unduh seluruh riwayat pendaftaran kontrak kustomer, domisili, paket pilihan, status pembayaran, serta tanggal approval.</p>
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
                    <span className="text-[9px] font-bold text-zinc-450 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded font-mono block w-fit">CATALOG DATA</span>
                    <h3 className="text-sm font-bold text-white">Ekspor Katalog Paket</h3>
                    <p className="text-[11px] text-zinc-450 leading-normal">Unduh daftar katalog paket videografi aktif yang tersaji pada menu customer untuk kebutuhan penyesuaian penawaran offline.</p>
                  </div>
                  <button
                    onClick={() => exportPackagesToCSV(packages)}
                    className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 bg-zinc-900 border border-zinc-800 hover:border-brand-500 text-zinc-100 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-zinc-450" />
                    <span>Unduh Katalog Paket (.csv)</span>
                  </button>
                </div>

                {/* Addons Exporter */}
                <div className="p-5 bg-zinc-950 rounded-2xl border border-zinc-850 flex flex-col justify-between hover:border-emerald-500/20 transition h-52">
                  <div className="space-y-2">
                    <span className="text-[9px] font-bold text-zinc-450 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded font-mono block w-fit">UPSELL DATA</span>
                    <h3 className="text-sm font-bold text-white">Ekspor Katalog Add-On</h3>
                    <p className="text-[11px] text-zinc-450 leading-normal">Unduh daftar item tambahan atau add-ons beserta harganya sebagai instrumen audit penjualan pelengkap pengerjaan klip.</p>
                  </div>
                  <button
                    onClick={() => exportAddonsToCSV(addons)}
                    className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 bg-zinc-900 border border-zinc-800 hover:border-brand-500 text-zinc-100 rounded-xl text-xs font-bold transition cursor-pointer"
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
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider block font-mono">Daftar Preview Data Terkini</h4>
                    <span className="text-[10px] text-zinc-500 mt-0.5 block">Menampilkan maksimal 5 bookings terbaru untuk memvalidasi isi berkas sebelum dilanjutkan penarikan ekspor.</span>
                  </div>
                  <span className="text-[9px] font-bold font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/10">
                    {bookings.length} Rekor Total
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-[11px] text-left border-collapse">
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
                          <td className="py-3 font-mono font-medium text-white">{b.id}</td>
                          <td className="py-3 font-semibold">{b.customerName}</td>
                          <td className="py-3 capitalize">
                            {b.eventType === "wedding" ? `Wedding (${b.weddingType || "Pernikahan"})` : b.eventType}
                          </td>
                          <td className="py-3">{new Date(b.eventDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</td>
                          <td className="py-3 font-medium truncate max-w-[120px]" title={b.packageName}>{b.packageName}</td>
                          <td className="py-3 text-right font-mono font-bold text-white">Rp {b.totalPrice.toLocaleString("id-ID")}</td>
                          <td className="py-3 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold font-mono ${
                              b.status === "paid" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/10" :
                              b.status === "dp_paid" ? "bg-blue-500/10 text-blue-400 border border-blue-500/10" :
                              b.status === "approved" ? "bg-brand-500/10 text-brand-400 border border-brand-500/10" :
                              b.status === "rejected" ? "bg-rose-500/10 text-rose-400 border border-rose-500/10" :
                              "bg-zinc-500/10 text-zinc-400 border border-zinc-500/10"
                            }`}>
                              {b.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {bookings.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-zinc-550 font-mono">Belum ada pemesanan masuk untuk diekspor.</td>
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
                    <Ticket className="w-5 h-5 text-brand-500" />
                    Kelola Kupon Diskon
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1">
                    Buat kode kupon promosi, tetapkan persentase potongan harga, dan batas waktu kedaluwarsa kupon.
                  </p>
                </div>
                
                <button
                  onClick={() => handleOpenCouponModal(null)}
                  className="flex items-center gap-1.5 py-2.5 px-4 bg-brand-500 hover:bg-brand-400 text-black font-bold rounded-xl text-xs transition cursor-pointer"
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
                          <span className="text-[9px] font-bold text-zinc-500 font-mono tracking-widest block uppercase">DISCOUNT CODE</span>
                          <span className="text-base font-extrabold text-white font-mono tracking-wide bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                            {c.code}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {isExpired ? (
                            <span className="text-[9px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded">
                              EXPIRED
                            </span>
                          ) : c.isActive ? (
                            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                              ACTIVE
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold text-zinc-400 bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded">
                              INACTIVE
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-zinc-900 space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Persentase Diskon:</span>
                          <span className="font-bold text-brand-400 font-mono">{c.discountPercent}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Berlaku Hingga:</span>
                          <span className="font-medium text-zinc-300 font-mono">
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
                  <div className="col-span-full py-12 text-center text-zinc-500 text-xs font-mono">
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
                <label className="font-semibold text-zinc-400">Nama Paket Videography</label>
                <input
                  type="text"
                  required
                  placeholder="cth: Wedding Cinematic Gold"
                  value={pkgName}
                  onChange={(e) => setPkgName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-950 rounded-xl border border-zinc-800 focus:border-brand-500 text-white focus:outline-none transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-zinc-400">Deskripsi Ringkas Paket</label>
                <textarea
                  placeholder="cth: Paket premium cinematografi dilengkapi editing klip highlight..."
                  value={pkgDesc}
                  onChange={(e) => setPkgDesc(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-950 rounded-xl border border-zinc-800 focus:border-brand-500 text-white focus:outline-none transition resize-none h-16"
                />
              </div>

              <div className="grid grid-cols-3 gap-3 font-sans focus:outline-none">
                <div className="space-y-1.5">
                  <label className="font-semibold text-zinc-400">Tipe / Kategori Acara</label>
                  <select
                    value={pkgType}
                    onChange={(e) => setPkgType(e.target.value as any)}
                    className="w-full px-2 py-2.5 bg-zinc-950 rounded-xl border border-zinc-850 text-white text-[11px] font-medium focus:outline-none"
                  >
                    <option value="wedding">Wedding (Pernikahan)</option>
                    <option value="event">Event (Gathering/Komersial)</option>
                    <option value="both">Wedding & Event</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-zinc-400">Tampilan Paket</label>
                  <select
                    value={pkgCategory}
                    onChange={(e) => setPkgCategory(e.target.value as any)}
                    className="w-full px-2 py-2.5 bg-zinc-950 rounded-xl border border-zinc-850 text-white text-[11px] font-medium focus:outline-none"
                  >
                    <option value="regular">Regular</option>
                    <option value="signature">Signature</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-zinc-400">Harga (IDR)</label>
                  <input
                    type="number"
                    required
                    value={pkgPrice}
                    onChange={(e) => setPkgPrice(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-zinc-950 rounded-xl border border-zinc-800 focus:border-brand-500 text-white focus:outline-none transition font-mono font-bold text-[11px]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center mb-0.5">
                  <label className="font-semibold text-zinc-400">Daftar Fitur (Satu per baris)</label>
                  <span className="text-[10px] text-zinc-500">Gunakan baris baru untuk memisahkan fitur</span>
                </div>
                <textarea
                  placeholder="- 2 Videographer Berpengalaman&#10;- Video Cinematic Highlight 3-5 Menit&#10;- Link Google Drive Selamanya"
                  value={pkgFetStr}
                  onChange={(e) => setPkgFetStr(e.target.value)}
                  className="w-full p-4 bg-zinc-950 rounded-xl border border-zinc-800 focus:border-brand-500 text-white font-mono text-[11px] h-28 focus:outline-none"
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
                  className="px-5 py-2 bg-brand-500 hover:bg-brand-400 text-black rounded-xl font-bold cursor-pointer transition"
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
                <label className="font-semibold text-zinc-400">Nama Add-On</label>
                <input
                  type="text"
                  required
                  placeholder="cth: Drone Shoot Resolusi 4K"
                  value={addonName}
                  onChange={(e) => setAddonName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-950 rounded-xl border border-zinc-800 focus:border-brand-500 text-white focus:outline-none transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-zinc-400">Deskripsi Pendek Add-On</label>
                <textarea
                  placeholder="cth: Klip udara sinematik tambahan selama acara..."
                  value={addonDesc}
                  onChange={(e) => setAddonDesc(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-950 rounded-xl border border-zinc-800 focus:border-brand-500 text-white focus:outline-none transition resize-none h-20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-zinc-400">Harga Jasa Add-On (IDR)</label>
                <input
                  type="number"
                  required
                  value={addonPrice}
                  onChange={(e) => setAddonPrice(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-zinc-950 rounded-xl border border-zinc-800 focus:border-brand-500 text-white focus:outline-none transition font-mono font-bold"
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
                  className="px-5 py-2 bg-brand-500 hover:bg-brand-400 text-black rounded-xl font-bold cursor-pointer transition"
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
                <label className="font-semibold text-zinc-400">Kode Kupon</label>
                <input
                  type="text"
                  required
                  disabled={!!couponEditCode}
                  placeholder="cth: KREALOVE10"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2.5 bg-zinc-950 rounded-xl border border-zinc-800 focus:border-brand-500 text-white focus:outline-none transition uppercase font-mono font-bold disabled:opacity-50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-zinc-400">Persentase Diskon (%)</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="100"
                  placeholder="10"
                  value={couponPercent}
                  onChange={(e) => setCouponPercent(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-zinc-950 rounded-xl border border-zinc-800 focus:border-brand-500 text-white focus:outline-none transition font-mono font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-zinc-400">Berlaku Hingga Tanggal</label>
                <input
                  type="date"
                  required
                  value={couponExpiry}
                  onChange={(e) => setCouponExpiry(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-950 rounded-xl border border-zinc-800 focus:border-brand-500 text-white focus:outline-none transition font-mono font-bold"
                />
              </div>

              <div className="flex items-center gap-2 py-2">
                <input
                  type="checkbox"
                  id="coupon-active-checkbox"
                  checked={couponActive}
                  onChange={(e) => setCouponActive(e.target.checked)}
                  className="w-4 h-4 accent-brand-500 rounded bg-zinc-950 border border-zinc-800 cursor-pointer"
                />
                <label htmlFor="coupon-active-checkbox" className="font-semibold text-zinc-300 cursor-pointer select-none">
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
                  className="px-5 py-2 bg-brand-500 hover:bg-brand-400 text-black rounded-xl font-bold cursor-pointer transition"
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
                  <div className="p-2.5 bg-brand-500/10 rounded-xl text-brand-600 shrink-0">
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
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-400 text-black rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Konfirmasi
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
