import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Booking, Package as PkgType, Addon, Coupon } from "../types";
import AdminLayout from "./AdminLayout";
import { Plus, PlusCircle, Edit, Trash2, Ticket } from "lucide-react";
import { motion } from "motion/react";
import { formatEventDate } from "../utils/dateFormatter";

interface Props {
  onOpenInvoice: (booking: Booking) => void;
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;
}

export default function AdminCoupons({ onOpenInvoice, mobileSidebarOpen, setMobileSidebarOpen }: Props) {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [packages, setPackages] = useState<PkgType[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [csrfToken, setCsrfToken] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = (msg: string, type: "success" | "error") => { setToast({ message: msg, type }); setTimeout(() => setToast(null), 3000); };
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void }>({ isOpen: false, title: "", message: "", onConfirm: () => {} });

  const load = () => fetch("/api/db").then(r => r.ok ? r.json() : Promise.reject()).then(d => { setBookings(d.bookings || []); setPackages(d.packages || []); setAddons(d.addons || []); setCoupons(d.coupons || []); }).catch(() => navigate("/admin/login"));

  useEffect(() => { fetch("/api/auth/csrf").then(r => r.json()).then(d => setCsrfToken(d.csrfToken)).catch(() => {}); load(); }, [navigate]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editCode, setEditCode] = useState<string | null>(null);
  const [cCode, setCCode] = useState("");
  const [cPercent, setCPercent] = useState(10);
  const [cExpiry, setCExpiry] = useState("");
  const [cActive, setCActive] = useState(true);

  const openModal = (c: Coupon | null) => {
    if (c) { setEditCode(c.code); setCCode(c.code); setCPercent(c.discountPercent); setCExpiry(c.validUntil ? new Date(c.validUntil).toISOString().split("T")[0] : ""); setCActive(c.isActive); }
    else { setEditCode(null); setCCode(""); setCPercent(10); const d = new Date(); d.setDate(d.getDate() + 7); setCExpiry(d.toISOString().split("T")[0]); setCActive(true); }
    setIsModalOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cCode.trim() || cPercent <= 0 || cPercent > 100 || !cExpiry) { showToast("Lengkapi data", "error"); return; }
    const payload = { code: cCode.trim().toUpperCase(), discountPercent: Number(cPercent), validUntil: new Date(cExpiry).toISOString(), isActive: cActive };
    try {
      const url = editCode ? `/api/coupons/${editCode}` : "/api/coupons";
      const method = editCode ? "PUT" : "POST";
      const r = await fetch(url, { method, headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken }, body: JSON.stringify(payload) });
      if (r.ok) { setIsModalOpen(false); load(); showToast(editCode ? "Kupon diperbarui!" : "Kupon dibuat!", "success"); }
      else { const d = await r.json(); showToast(d.error || "Gagal", "error"); }
    } catch { showToast("Koneksi error", "error"); }
  };

  const deleteItem = (code: string) => {
    setConfirmModal({ isOpen: true, title: "Hapus Kupon", message: `Yakin hapus ${code}?`, onConfirm: async () => {
      setConfirmModal({ isOpen: false, title: "", message: "", onConfirm: () => {} });
      try { const r = await fetch(`/api/coupons/${code}`, { method: "DELETE", headers: { "x-csrf-token": csrfToken } }); if (r.ok) { load(); showToast("Kupon dihapus!", "success"); } else showToast("Gagal", "error"); } catch { showToast("Koneksi error", "error"); }
    }});
  };

  return (
    <AdminLayout bookings={bookings} packagesCount={packages.length} addonsCount={addons.length} couponsCount={coupons.length} mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen}>
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3 justify-between items-center border-b border-zinc-900 pb-4">
          <div><h2 className="text-xl font-bold text-white flex items-center gap-2"><Ticket className="w-5 h-5 text-amber-500" />Kupon Diskon</h2><p className="text-xs text-zinc-400 mt-1">Kelola kode promo dan diskon.</p></div>
          <button onClick={() => openModal(null)} className="flex items-center gap-1.5 py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-xs transition cursor-pointer"><PlusCircle className="w-4 h-4" /><span>Buat Kupon</span></button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.map(c => {
            const isExpired = new Date(c.validUntil) < new Date();
            return (
              <div key={c.code} className={`p-5 bg-zinc-950 rounded-2xl border transition hover:border-zinc-800 ${!c.isActive ? "border-zinc-900 opacity-60" : isExpired ? "border-rose-950" : "border-zinc-850"}`}>
                <div className="flex justify-between items-start">
                  <div className="space-y-1"><span className="text-xs font-bold text-zinc-500 font-sans tracking-wide block uppercase">KODE</span><span className="text-base font-bold text-white font-sans tracking-wide bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">{c.code}</span></div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${isExpired ? "text-rose-400 bg-rose-500/10 border border-rose-500/20" : c.isActive ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20" : "text-zinc-400 bg-zinc-800 border border-zinc-700"}`}>{isExpired ? "EXPIRED" : c.isActive ? "ACTIVE" : "INACTIVE"}</span>
                </div>
                <div className="mt-4 pt-3 border-t border-zinc-900 space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-zinc-500">Diskon:</span><span className="font-bold text-amber-400 font-sans">{c.discountPercent}%</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Berlaku:</span><span className="font-medium text-zinc-300 font-sans">{formatEventDate(c.validUntil, { day: "numeric", month: "short", year: "numeric" })}</span></div>
                </div>
                <div className="mt-5 flex justify-end gap-1.5">
                  <button onClick={() => openModal(c)} className="p-1.5 text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-md transition cursor-pointer"><Edit className="w-3.5 h-3.5" /></button>
                  <button onClick={() => deleteItem(c.code)} className="p-1.5 text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-md transition cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden">
            <form onSubmit={save} className="p-6 space-y-4">
              <h3 className="text-sm font-bold text-zinc-900">{editCode ? "Ubah Kupon" : "Buat Kupon"}</h3>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700">Kode</label>
                <input value={cCode} onChange={e => setCCode(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-zinc-300 focus:border-amber-500 focus:outline-none text-xs uppercase" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700">Diskon (%)</label>
                <input type="number" min={1} max={100} value={cPercent} onChange={e => setCPercent(Number(e.target.value))} className="w-full px-4 py-2 rounded-xl border border-zinc-300 focus:border-amber-500 focus:outline-none text-xs" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700">Berlaku Hingga</label>
                <input type="date" value={cExpiry} onChange={e => setCExpiry(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-zinc-300 focus:border-amber-500 focus:outline-none text-xs" required />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="cActive" checked={cActive} onChange={e => setCActive(e.target.checked)} className="rounded border-zinc-300" />
                <label htmlFor="cActive" className="text-xs font-bold text-zinc-700">Aktif</label>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold cursor-pointer transition">Batal</button>
                <button type="submit" className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-xs font-bold cursor-pointer transition">{editCode ? "Simpan" : "Buat"}</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AdminLayout>
  );
}
