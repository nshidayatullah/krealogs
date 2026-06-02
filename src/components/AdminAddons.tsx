import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Booking, Package as PkgType, Addon, Coupon } from "../types";
import AdminLayout from "./AdminLayout";
import { Plus, Edit, Trash2 } from "lucide-react";
import { motion } from "motion/react";

interface Props {
  onOpenInvoice: (booking: Booking) => void;
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;
}

export default function AdminAddons({ onOpenInvoice, mobileSidebarOpen, setMobileSidebarOpen }: Props) {
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
  const [editId, setEditId] = useState<string | null>(null);
  const [addonName, setAddonName] = useState("");
  const [addonDesc, setAddonDesc] = useState("");
  const [addonPrice, setAddonPrice] = useState(0);

  const openModal = (a: Addon | null) => {
    if (a) { setEditId(a.id); setAddonName(a.name); setAddonDesc(a.description); setAddonPrice(a.price); }
    else { setEditId(null); setAddonName(""); setAddonDesc(""); setAddonPrice(500000); }
    setIsModalOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addonName || addonPrice < 0) return;
    const payload = { id: editId || `add-${Date.now()}`, name: addonName, description: addonDesc, price: Number(addonPrice) };
    try {
      const r = await fetch(editId ? `/api/addons/${editId}` : "/api/addons", { method: editId ? "PUT" : "POST", headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken }, body: JSON.stringify(payload) });
      if (r.ok) { setIsModalOpen(false); load(); } else alert("Gagal");
    } catch {}
  };

  const deleteItem = (id: string) => {
    setConfirmModal({ isOpen: true, title: "Hapus Add-On", message: "Yakin?", onConfirm: async () => {
      setConfirmModal({ isOpen: false, title: "", message: "", onConfirm: () => {} });
      try { const r = await fetch(`/api/addons/${id}`, { method: "DELETE", headers: { "x-csrf-token": csrfToken } }); if (r.ok) { load(); showToast("Add-on dihapus!", "success"); } else showToast("Gagal", "error"); } catch { showToast("Koneksi error", "error"); }
    }});
  };

  return (
    <AdminLayout bookings={bookings} packagesCount={packages.length} addonsCount={addons.length} couponsCount={coupons.length} mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen}>
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3 justify-between items-center border-b border-zinc-900 pb-4">
          <div><h2 className="text-xl font-bold text-white">Kelola Add-Ons</h2><p className="text-xs text-zinc-400 mt-1">Layanan tambahan opsional.</p></div>
          <button onClick={() => openModal(null)} className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"><Plus className="w-4 h-4" /><span>Tambah</span></button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {addons.map(a => (
            <div key={a.id} className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/45 flex flex-col justify-between space-y-4 hover:border-zinc-700 transition">
              <div className="space-y-1.5">
                <span className="text-xs font-sans font-bold text-zinc-500">{a.id}</span>
                <h4 className="text-sm font-bold text-white">{a.name}</h4>
                <p className="text-xs text-zinc-400 leading-normal">{a.description}</p>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-zinc-900">
                <span className="text-xs font-sans font-bold text-amber-400">Rp {a.price.toLocaleString("id-ID")}</span>
                <div className="flex gap-1.5">
                  <button onClick={() => openModal(a)} className="p-1.5 text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 rounded-md border border-zinc-800 transition cursor-pointer"><Edit className="w-3.5 h-3.5" /></button>
                  <button onClick={() => deleteItem(a.id)} className="p-1.5 text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-md transition cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden">
            <form onSubmit={save} className="p-6 space-y-4">
              <h3 className="text-sm font-bold text-zinc-900">{editId ? "Ubah Add-On" : "Tambah Add-On"}</h3>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700">Nama</label>
                <input value={addonName} onChange={e => setAddonName(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-zinc-300 focus:border-amber-500 focus:outline-none text-xs" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700">Deskripsi</label>
                <textarea value={addonDesc} onChange={e => setAddonDesc(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-zinc-300 focus:border-amber-500 focus:outline-none text-xs resize-none h-20" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700">Harga (IDR)</label>
                <input type="number" value={addonPrice} onChange={e => setAddonPrice(Number(e.target.value))} className="w-full px-4 py-2 rounded-xl border border-zinc-300 focus:border-amber-500 focus:outline-none text-xs" required />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold cursor-pointer transition">Batal</button>
                <button type="submit" className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-xs font-bold cursor-pointer transition">{editId ? "Simpan" : "Tambah"}</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-zinc-200 p-6 space-y-4">
            <h3 className="text-sm font-bold text-zinc-900">{confirmModal.title}</h3>
            <p className="text-xs text-zinc-600">{confirmModal.message}</p>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold cursor-pointer transition">Batal</button>
              <button onClick={confirmModal.onConfirm} className="px-5 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold cursor-pointer transition">Hapus</button>
            </div>
          </motion.div>
        </div>
      )}
    </AdminLayout>
  );
}
