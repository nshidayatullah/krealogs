import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Booking, Package as PkgType, Addon, Coupon } from "../types";
import AdminLayout from "./AdminLayout";
import { FileSpreadsheet, Download, TrendingUp, Coins, Check } from "lucide-react";
import { exportBookingsToCSV, exportPackagesToCSV, exportAddonsToCSV } from "../utils/excelExport";
import { formatEventDate } from "../utils/dateFormatter";

interface Props {
  onOpenInvoice: (booking: Booking) => void;
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;
}

export default function AdminRecap({ onOpenInvoice, mobileSidebarOpen, setMobileSidebarOpen }: Props) {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [packages, setPackages] = useState<PkgType[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [csrfToken, setCsrfToken] = useState("");

  useEffect(() => {
    fetch("/api/auth/csrf").then(r => r.json()).then(d => setCsrfToken(d.csrfToken)).catch(() => {});
    fetch("/api/db").then(r => r.ok ? r.json() : Promise.reject()).then(d => { setBookings(d.bookings || []); setPackages(d.packages || []); setAddons(d.addons || []); setCoupons(d.coupons || []); }).catch(() => navigate("/admin/login"));
  }, [navigate]);

  const approved = bookings.filter(b => b.approvalStatus === "approved");
  const approvedRevenue = approved.reduce((s, b) => s + b.totalPrice, 0);
  const collectedDP = approved.reduce((s, b) => s + b.amountPaid, 0);
  const remainingReceivables = approved.reduce((s, b) => s + b.remainingPayment, 0);

  return (
    <AdminLayout bookings={bookings} packagesCount={packages.length} addonsCount={addons.length} couponsCount={coupons.length} mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen}>
      <div className="space-y-8 text-zinc-150">
        <div className="border-b border-zinc-900 pb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <FileSpreadsheet className="w-5.5 h-5.5 text-emerald-400" />
            Rekap Data & Ekspor Excel
          </h2>
          <p className="text-xs text-zinc-400 mt-1">Unduh rekapitulasi data administrasi dalam format CSV.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 bg-zinc-950 rounded-2xl border border-zinc-900 flex justify-between items-center">
            <div className="space-y-1">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wide font-sans">APPROVED REVENUE</span>
              <p className="text-xl font-bold text-emerald-400 font-sans">Rp {approvedRevenue.toLocaleString("id-ID")}</p>
            </div>
            <div className="p-2 bg-emerald-500/10 rounded-xl"><Coins className="w-4 h-4 text-emerald-400" /></div>
          </div>
          <div className="p-5 bg-zinc-950 rounded-2xl border border-zinc-900 flex justify-between items-center">
            <div className="space-y-1">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wide font-sans">DP TERKUMPUL</span>
              <p className="text-xl font-bold text-white font-sans">Rp {collectedDP.toLocaleString("id-ID")}</p>
            </div>
            <div className="p-2 bg-zinc-850 rounded-xl border border-zinc-800"><Check className="w-4 h-4 text-zinc-450" /></div>
          </div>
          <div className="p-5 bg-zinc-950 rounded-2xl border border-zinc-900 flex justify-between items-center">
            <div className="space-y-1">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wide font-sans">SISA PIUTANG</span>
              <p className="text-xl font-bold text-amber-500 font-sans">Rp {remainingReceivables.toLocaleString("id-ID")}</p>
            </div>
            <div className="p-2 bg-amber-500/10 rounded-xl"><TrendingUp className="w-4 h-4 text-amber-400" /></div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
          <div className="p-5 bg-zinc-950 rounded-2xl border border-zinc-850 flex flex-col justify-between hover:border-emerald-500/20 transition h-52">
            <div className="space-y-2">
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 px-2 py-0.5 rounded font-sans block w-fit">PRIMARY DATA</span>
              <h3 className="text-sm font-bold text-white">Ekspor Rekap Booking</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">Semua data pemesanan termasuk ID, nama, kontak, acara, paket, add-on, status, dan nominal pembayaran.</p>
            </div>
            <button onClick={() => exportBookingsToCSV(bookings)} className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"><Download className="w-4 h-4" /><span>Download CSV</span></button>
          </div>
          <div className="p-5 bg-zinc-950 rounded-2xl border border-zinc-850 flex flex-col justify-between hover:border-emerald-500/20 transition h-52">
            <div className="space-y-2">
              <span className="text-xs font-bold text-amber-400 bg-amber-500/5 border border-amber-500/10 px-2 py-0.5 rounded font-sans block w-fit">CATALOG</span>
              <h3 className="text-sm font-bold text-white">Ekspor Daftar Paket</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">Daftar paket utama cinematografi dengan fitur-fitur layanan dan harga masing-masing.</p>
            </div>
            <button onClick={() => exportPackagesToCSV(packages)} className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 bg-zinc-900 border border-zinc-800 hover:border-amber-500 text-zinc-100 rounded-xl text-xs font-bold transition cursor-pointer"><Download className="w-4 h-4" /><span>Download CSV</span></button>
          </div>
          <div className="p-5 bg-zinc-950 rounded-2xl border border-zinc-850 flex flex-col justify-between hover:border-emerald-500/20 transition h-52">
            <div className="space-y-2">
              <span className="text-xs font-bold text-amber-400 bg-amber-500/5 border border-amber-500/10 px-2 py-0.5 rounded font-sans block w-fit">CATALOG</span>
              <h3 className="text-sm font-bold text-white">Ekspor Daftar Add-Ons</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">Daftar layanan tambahan yang tersedia untuk kustomisasi paket.</p>
            </div>
            <button onClick={() => exportAddonsToCSV(addons)} className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 bg-zinc-900 border border-zinc-800 hover:border-amber-500 text-zinc-100 rounded-xl text-xs font-bold transition cursor-pointer"><Download className="w-4 h-4" /><span>Download CSV</span></button>
          </div>
        </div>

        <div className="bg-zinc-950 rounded-2xl border border-zinc-850 p-5">
          <h3 className="text-sm font-bold text-white mb-4">Preview Pemesanan Terbaru</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-900 text-zinc-500 font-bold">
                  <th className="py-2.5">ID</th>
                  <th className="py-2.5">Customer</th>
                  <th className="py-2.5">Acara</th>
                  <th className="py-2.5">Tanggal</th>
                  <th className="py-2.5">Paket</th>
                  <th className="py-2.5 text-right">Total</th>
                  <th className="py-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-zinc-350">
                {bookings.slice(0, 5).map(b => (
                  <tr key={b.id} className="hover:bg-zinc-900/30 transition">
                    <td className="py-3 font-sans font-medium text-white">{b.id}</td>
                    <td className="py-3 font-medium">{b.customerName}</td>
                    <td className="py-3 capitalize">{b.eventType === "wedding" ? `Wedding${b.weddingType ? " ("+b.weddingType+")" : ""}` : b.eventType}</td>
                    <td className="py-3">{formatEventDate(b.eventDate, { day: "numeric", month: "short", year: "numeric" })}</td>
                    <td className="py-3 font-medium truncate max-w-30" title={b.packageName}>{b.packageName}</td>
                    <td className="py-3 text-right font-sans font-bold text-white">Rp {b.totalPrice.toLocaleString("id-ID")}</td>
                    <td className="py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold font-sans ${b.approvalStatus === "rejected" ? "bg-red-50 text-red-600 border border-red-200" : b.approvalStatus === "pending" ? "bg-yellow-50 text-yellow-700 border border-yellow-200" : b.paymentStatus === "paid" ? "bg-green-50 text-green-700 border border-green-200" : b.paymentStatus === "dp_paid" ? "bg-sky-50 text-sky-700 border border-sky-200" : "bg-gray-50 text-gray-600 border border-gray-200"}`}>
                        {b.approvalStatus === "rejected" ? "DITOLAK" : b.approvalStatus === "pending" ? "PENDING" : b.paymentStatus === "paid" ? "LUNAS" : b.paymentStatus === "dp_paid" ? "DP PAID" : "APPROVED"}
                      </span>
                    </td>
                  </tr>
                ))}
                {bookings.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-zinc-500">Belum ada pemesanan.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
