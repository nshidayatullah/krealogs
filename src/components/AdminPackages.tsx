import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Booking, Package as PkgType, Addon, Coupon } from "../types";
import AdminLayout from "./AdminLayout";
import { Plus, Edit, Trash2, Check, X, AlertCircle, Package as PkgIcon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Props {
  onOpenInvoice: (booking: Booking) => void;
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;
}

export default function AdminPackages({ onOpenInvoice, mobileSidebarOpen, setMobileSidebarOpen }: Props) {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [packages, setPackages] = useState<PkgType[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [csrfToken, setCsrfToken] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = (msg: string, type: "success" | "error") => { setToast({ message: msg, type }); setTimeout(() => setToast(null), 3000); };

  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void }>({
    isOpen: false, title: "", message: "", onConfirm: () => {}
  });

  const load = () => fetch("/api/db").then(r => r.ok ? r.json() : Promise.reject()).then(d => { setBookings(d.bookings || []); setPackages(d.packages || []); setAddons(d.addons || []); setCoupons(d.coupons || []); }).catch(() => navigate("/admin/login"));

  useEffect(() => {
    fetch("/api/auth/csrf").then(r => r.json()).then(d => setCsrfToken(d.csrfToken)).catch(() => {});
    load();
  }, [navigate]);

  // Package form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [pkgName, setPkgName] = useState("");
  const [pkgDesc, setPkgDesc] = useState("");
  const [pkgPrice, setPkgPrice] = useState(0);
  const [pkgType, setPkgType] = useState<"event" | "wedding" | "both">("wedding");
  const [pkgCategory, setPkgCategory] = useState<"signature" | "regular">("regular");
  const [pkgFetStr, setPkgFetStr] = useState("");

  const openPkg = (p: PkgType | null) => {
    if (p) { setEditId(p.id); setPkgName(p.name); setPkgDesc(p.description); setPkgPrice(p.price); setPkgType(p.type); setPkgCategory(p.category || "regular"); setPkgFetStr(p.features ? p.features.join("\n") : ""); }
    else { setEditId(null); setPkgName(""); setPkgDesc(""); setPkgPrice(1500000); setPkgType("wedding"); setPkgCategory("regular"); setPkgFetStr("- 1 Videographer\n- Video highlight 2 menit\n- Link Google Drive"); }
    setIsModalOpen(true);
  };

  const savePkg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkgName || pkgPrice < 0) return;
    const feats = pkgFetStr.split("\n").map(f => f.trim()).filter(Boolean);
    const payload = { id: editId || `pkg-${Date.now()}`, name: pkgName, description: pkgDesc, price: Number(pkgPrice), type: pkgType, category: pkgCategory, features: feats };
    try {
      const r = await fetch(editId ? `/api/packages/${editId}` : "/api/packages", { method: editId ? "PUT" : "POST", headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken }, body: JSON.stringify(payload) });
      if (r.ok) { setIsModalOpen(false); load(); } else alert("Gagal");
    } catch {}
  };

  const deletePkg = (id: string) => {
    setConfirmModal({ isOpen: true, title: "Hapus Paket", message: "Yakin ingin menghapus paket ini?", onConfirm: async () => {
      setConfirmModal({ isOpen: false, title: "", message: "", onConfirm: () => {} });
      try { const r = await fetch(`/api/packages/${id}`, { method: "DELETE", headers: { "x-csrf-token": csrfToken } }); if (r.ok) { load(); showToast("Paket dihapus!", "success"); } else showToast("Gagal hapus", "error"); } catch { showToast("Koneksi error", "error"); }
    }});
  };

  return (
    <AdminLayout bookings={bookings} packagesCount={packages.length} addonsCount={addons.length} couponsCount={coupons.length} mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center border-b border-zinc-900 pb-4">
          <div><h2 className="text-xl font-bold text-white">Kelola Paket Utama</h2><p className="text-xs text-zinc-400 mt-1">Daftar paket utama cinematografi yang disuguhkan pelanggan.</p></div>
          <button onClick={() => openPkg(null)} className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-xl flex items-center space-x-1.5 transition cursor-pointer"><Plus className="w-4 h-4" /><span>Tambah Paket</span></button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {packages.map(p => (
            <div key={p.id} className="p-5 rounded-2xl border border-zinc-800 bg-zinc-950/40 space-y-4 flex flex-col justify-between hover:border-zinc-700 transition">
              <div className="space-y-2">
                <div className="flex justify-end items-start w-full">
                  <div className="flex space-x-1.5">
                    <span className="text-xs font-bold uppercase tracking-wide bg-zinc-900 text-amber-500 border border-zinc-800 px-2.5 py-0.5 rounded">{p.category === "signature" ? "Signature" : "Regular"}</span>
                    {p.type !== "both" && <span className="text-xs font-bold uppercase tracking-wide bg-zinc-900 text-amber-500 border border-zinc-800 px-2.5 py-0.5 rounded">{p.type === "wedding" ? "Wedding" : "Event"}</span>}
                  </div>
                </div>
                <h4 className="text-base font-bold text-white">{p.name}</h4>
                <p className="text-xs text-zinc-400 leading-normal">{p.description}</p>
                <div className="pt-2">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-wide block font-sans">FITUR UTAMA</span>
                  <ul className="mt-1.5 space-y-1 text-zinc-300 text-xs">
                    {p.features?.map((f, i) => <li key={i} className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-amber-500" /><span>{f}</span></li>)}
                  </ul>
                </div>
              </div>
              <div className="pt-4 border-t border-zinc-900 flex justify-between items-center">
                <div><span className="text-xs font-medium text-zinc-500 block uppercase font-sans">HARGA</span><span className="text-base font-sans font-bold text-amber-400">Rp {p.price.toLocaleString("id-ID")}</span></div>
                <div className="flex space-x-2">
                  <button onClick={() => openPkg(p)} className="p-2 text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition cursor-pointer"><Edit className="w-3.5 h-3.5" /></button>
                  <button onClick={() => deletePkg(p.id)} className="p-2 text-rose-450 hover:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg transition cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden">
            <form onSubmit={savePkg} className="p-6 space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-zinc-200">
                <div className="p-2 bg-amber-500/10 rounded-xl text-amber-600"><PkgIcon className="w-5 h-5" /></div>
                <h3 className="text-sm font-bold text-zinc-900">{editId ? "Ubah Paket" : "Buat Paket Baru"}</h3>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700">Nama Paket</label>
                <input value={pkgName} onChange={e => setPkgName(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-zinc-300 focus:border-amber-500 focus:outline-none text-xs" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700">Tipe</label>
                  <select value={pkgType} onChange={e => setPkgType(e.target.value as any)} className="w-full px-4 py-2 rounded-xl border border-zinc-300 focus:border-amber-500 focus:outline-none text-xs">
                    <option value="wedding">Wedding</option><option value="event">Event</option><option value="both">Wedding & Event</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700">Kategori</label>
                  <select value={pkgCategory} onChange={e => setPkgCategory(e.target.value as any)} className="w-full px-4 py-2 rounded-xl border border-zinc-300 focus:border-amber-500 focus:outline-none text-xs">
                    <option value="regular">Regular</option><option value="signature">Signature</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700">Deskripsi</label>
                <textarea value={pkgDesc} onChange={e => setPkgDesc(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-zinc-300 focus:border-amber-500 focus:outline-none text-xs resize-none h-20" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700">Harga (IDR)</label>
                <input type="number" value={pkgPrice} onChange={e => setPkgPrice(Number(e.target.value))} className="w-full px-4 py-2 rounded-xl border border-zinc-300 focus:border-amber-500 focus:outline-none text-xs" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700">Fitur (pisahkan dengan baris baru)</label>
                <textarea value={pkgFetStr} onChange={e => setPkgFetStr(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-zinc-300 focus:border-amber-500 focus:outline-none text-xs resize-none h-24" />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold cursor-pointer transition">Batal</button>
                <button type="submit" className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-xs font-bold cursor-pointer transition">{editId ? "Simpan" : "Buat Paket"}</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AdminLayout>
  );
}
