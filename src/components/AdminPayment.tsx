import React from "react";
import { Booking } from "../types";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Package, Addon, Coupon } from "../types";
import AdminLayout from "./AdminLayout";
import BookingPaymentTable from "./BookingPaymentTable";
import Toast from "./Toast";
import { motion, AnimatePresence } from "motion/react";
import { AlertCircle, Check } from "lucide-react";

interface Props {
  onOpenInvoice: (booking: Booking) => void;
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;
}

export default function AdminPayment({ onOpenInvoice, mobileSidebarOpen, setMobileSidebarOpen }: Props) {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [csrfToken, setCsrfToken] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = (msg: string, type: "success" | "error") => { setToast({ message: msg, type }); setTimeout(() => setToast(null), 3000); };

  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void }>({
    isOpen: false, title: "", message: "", onConfirm: () => {}
  });

  useEffect(() => {
    fetch("/api/auth/csrf").then(r => r.json()).then(d => setCsrfToken(d.csrfToken)).catch(() => {});
    fetch("/api/db").then(r => r.ok ? r.json() : Promise.reject()).then(d => { setBookings(d.bookings || []); setPackages(d.packages || []); setAddons(d.addons || []); setCoupons(d.coupons || []); }).catch(() => navigate("/admin/login"));
  }, [navigate]);

  return (
    <><AdminLayout bookings={bookings} packagesCount={packages.length} addonsCount={addons.length} couponsCount={coupons.length} mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen}>
      <div className="space-y-6 animate-fade-in">
        <div className="border-b border-zinc-900 pb-4">
          <h2 className="text-xl font-bold text-white">Konfirmasi Pembayaran</h2>
          <p className="text-xs text-zinc-400 mt-1">Catat pembayaran DP atau pelunasan dari kustomer.</p>
        </div>
        <BookingPaymentTable bookings={bookings} csrfToken={csrfToken} onOpenInvoice={onOpenInvoice} showToast={showToast} setBookings={setBookings} setConfirmModal={setConfirmModal} />
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 50, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border text-xs font-sans font-bold ${toast.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800"}`}>
            {toast.type === "success" ? <Check className="w-4 h-4 text-emerald-600 shrink-0 stroke-[2.5]" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden">
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-600 shrink-0"><AlertCircle className="w-6 h-6" /></div>
                  <h3 className="text-sm font-bold text-zinc-900">{confirmModal.title}</h3>
                </div>
                <p className="text-xs text-zinc-500 leading-normal">{confirmModal.message}</p>
              </div>
              <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-200 flex justify-end gap-2">
                <button onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} className="px-4 py-2 border border-zinc-200 text-zinc-700 hover:bg-zinc-100 rounded-xl text-xs font-bold transition cursor-pointer">Batal</button>
                <button onClick={confirmModal.onConfirm} className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-xs font-bold transition cursor-pointer">Konfirmasi</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AdminLayout>
      <Toast message={toast?.message || ""} type={toast?.type || "success"} visible={!!toast} onClose={() => setToast(null)} />
    </>
  );
}
