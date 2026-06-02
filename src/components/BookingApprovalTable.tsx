import React, { useState, useEffect } from "react";
import { Booking } from "../types";
import { formatEventDate } from "../utils/dateFormatter";
import { Check, X, FileText } from "lucide-react";

interface Props {
  bookings: Booking[];
  csrfToken: string;
  onOpenInvoice: (b: Booking) => void;
  showToast: (msg: string, type: "success" | "error") => void;
  setBookings: React.Dispatch<React.SetStateAction<Booking[]>>;
  setConfirmModal: (m: { isOpen: boolean; title: string; message: string; onConfirm: () => void }) => void;
}

export default function BookingApprovalTable({ bookings, csrfToken, onOpenInvoice, showToast, setBookings, setConfirmModal }: Props) {
  const [sortKey, setSortKey] = useState<"order" | "date" | "eventdate" | "name" | "package" | "addons" | "price" | "status" | "coupon">("order");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const PER_PAGE = 15;

  const toggleSort = (key: "order" | "date" | "eventdate" | "name" | "package" | "addons" | "price" | "status" | "coupon") => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const searched = bookings.filter(b => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    const nameMatch = b.customerName.toLowerCase().includes(q);
    const idMatch = b.id.toLowerCase().includes(q);
    const phoneQuery = q.replace(/[^0-9+]/g, "");
    const phoneMatch = phoneQuery ? b.customerPhone.replace(/[^0-9+]/g, "").includes(phoneQuery) : false;
    return nameMatch || idMatch || phoneMatch;
  });

  const clearSearch = () => {
    setSearchQuery("");
    setPage(1);
  };

  const sorted = [...searched].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    if (sortKey === "order") return dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    if (sortKey === "date") return dir * (new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
    if (sortKey === "eventdate") return dir * (new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
    if (sortKey === "name") return dir * a.customerName.localeCompare(b.customerName);
    if (sortKey === "package") return dir * a.packageName.localeCompare(b.packageName);
    if (sortKey === "addons") return dir * ((a.addonDetails?.length || 0) - (b.addonDetails?.length || 0));
    if (sortKey === "price") return dir * (a.totalPrice - b.totalPrice);
    if (sortKey === "status") return dir * a.approvalStatus.localeCompare(b.approvalStatus);
    if (sortKey === "coupon") return dir * (a.couponCode || "").localeCompare(b.couponCode || "");
    return 0;
  });

  const totalPages = Math.ceil(sorted.length / PER_PAGE);
  const paginated = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  useEffect(() => { setPage(1); }, [sortKey, sortDir, searchQuery]);

  const handleApproval = (id: string, approvalStatus: "approved" | "rejected") => {
    const isApprove = approvalStatus === "approved";
    setConfirmModal({
      isOpen: true,
      title: isApprove ? "Setujui Pemesanan" : "Tolak Pemesanan",
      message: isApprove
        ? "Apakah Anda yakin ingin menyetujui jadwal & kru pesanan ini?"
        : "Apakah Anda yakin ingin menolak pemesanan ini?",
      onConfirm: async () => {
        setConfirmModal({ isOpen: false, title: "", message: "", onConfirm: () => {} });
        try {
          const r = await fetch(`/api/bookings/${id}/approval`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
            body: JSON.stringify({ approvalStatus }),
          });
          const d = await r.json();
          if (r.ok && d.success) {
            setBookings((prev: Booking[]) => prev.map(b => b.id === id ? d.booking : b));
            showToast(isApprove ? "Disetujui!" : "Ditolak!", "success");
          } else showToast(d.error || "Gagal", "error");
        } catch { showToast("Koneksi error", "error"); }
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 justify-between bg-zinc-950/30 p-2.5 rounded-xl border border-zinc-900">
        <div className="relative flex items-center gap-1">
          <svg className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input type="text" placeholder="Cari nama / WA..." value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setPage(1); }} className="w-36 pl-7 pr-2 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-[11px] text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 transition" />
          {searchQuery && <button onClick={clearSearch} title="Hapus pencarian" className="text-zinc-500 hover:text-zinc-300 transition cursor-pointer"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-500 font-medium">Sortir:</span>
          <select 
            value={sortKey} 
            onChange={e => setSortKey(e.target.value as any)}
            className="bg-zinc-950 border border-zinc-800 rounded-lg text-[11px] text-zinc-300 py-1.5 px-2.5 focus:outline-none focus:border-amber-500/50 transition cursor-pointer"
          >
            <option value="order">Tanggal Order</option>
            <option value="name">Klien / Customer</option>
            <option value="date">Tanggal Acara</option>
            <option value="package">Paket</option>
            <option value="addons">Jumlah Add-Ons</option>
            <option value="coupon">Kupon Promo</option>
            <option value="price">Biaya Total</option>
            <option value="status">Status Persetujuan</option>
          </select>

          <button
            onClick={() => setSortDir(d => d === "asc" ? "desc" : "asc")}
            title={sortDir === "asc" ? "Urutan Naik (Ascending)" : "Urutan Turun (Descending)"}
            className="flex items-center justify-center p-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white hover:border-amber-500/50 transition cursor-pointer"
          >
            {sortDir === "asc" ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h9m5-1v12m0 0l-4-4m4 4l4-4" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="py-16 text-center text-zinc-500 text-xs border border-dashed border-zinc-850 rounded-2xl">Tidak ditemukan pesanan.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[750px]">
            <thead>
              <tr className="border-b border-zinc-850 text-[10px] font-sans uppercase text-zinc-500 bg-black/20">
                <th className="py-2 px-2 rounded-l">Tgl. Order</th>
                <th className="py-2 px-2">Klien</th>
                <th className="py-2 px-2">Acara</th>
                <th className="py-2 px-2">Tgl. Acara</th>
                <th className="py-2 px-2">Paket</th>
                <th className="py-2 px-2">Add-Ons</th>
                <th className="py-2 px-2">Kupon</th>
                <th className="py-2 px-2 text-right">Biaya</th>
                <th className="py-2 px-2 text-center">Status</th>
                <th className="py-2 px-2 text-center rounded-r">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {paginated.map(b => b && (
                <tr key={b.id} className="hover:bg-zinc-900/10 transition">
                  <td className="py-1 px-2 leading-3.25 align-top">
                    <div className="text-zinc-200 text-[10px] whitespace-nowrap">{formatEventDate(b.createdAt, { year: "numeric", month: "short", day: "numeric" })}</div>
                    <div className="text-zinc-500 text-[9px]">{b.createdAt ? new Date(b.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : ""}</div>
                  </td>
                  <td className="py-1 px-2 leading-3.25">
                    <span className="font-sans text-[9px] bg-zinc-900 border border-zinc-800 font-bold px-1 py-0.5 rounded text-zinc-350 block w-fit mb-0.5">{b.id}</span>
                    <div className="text-white font-bold text-[10px]">{b.customerName}</div>
                    <div className="text-zinc-400 text-[9px]">{b.customerPhone}</div>
                    <div className="text-zinc-500 text-[9px]">{b.customerCity}</div>
                  </td>
                  <td className="py-1 px-2 leading-3.25">
                    <span className="text-[9px] font-bold text-zinc-300 capitalize bg-zinc-900 border border-zinc-800 px-1 py-0.5 rounded block w-fit font-sans mb-0.5">{b.eventType === "wedding" ? `Wedding${b.weddingType ? " ("+b.weddingType+")" : ""}` : "Event"}</span>
                    <div className="text-zinc-450 text-[9px] truncate max-w-35">{b.venueLocation}</div>
                  </td>
                  <td className="py-1 px-2 leading-3.25 align-top">
                    <div className="text-zinc-200 text-[10px] whitespace-nowrap">{formatEventDate(b.eventDate, { year: "numeric", month: "short", day: "numeric" })}</div>
                  </td>
                  <td className="py-1 px-2 leading-3.25"><span className="text-white text-[10px]">{b.packageName}</span></td>
                  <td className="py-1 px-2 leading-3.25">
                    {b.addonDetails && b.addonDetails.length > 0 ? (
                      <div>{Object.entries(b.addonDetails.reduce((acc: Record<string, number>, a) => { acc[a.name] = (acc[a.name] || 0) + 1; return acc; }, {})).map(([name, qty]) => <div key={name} className="text-[9px] text-zinc-400 font-sans leading-3.25">+ {name}{(qty as number) > 1 ? ` ×${qty}` : ""}</div>)}</div>
                    ) : <span className="text-[9px] text-zinc-600 font-sans">—</span>}
                  </td>
                  <td className="py-1 px-2 leading-3.25">
                    {b.couponCode ? (
                      <div><span className="text-[9px] font-bold text-emerald-400 font-sans">{b.couponCode}</span></div>
                    ) : <span className="text-[9px] text-zinc-600 font-sans">—</span>}
                  </td>
                  <td className="py-1 px-2 text-right leading-3.25"><span className="font-sans text-amber-400 text-[10px]">Rp {b.totalPrice.toLocaleString("id-ID")}</span></td>
                  <td className="py-1 px-2 text-center">
                    {b.approvalStatus === "rejected" ? <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-red-50 text-red-600 border border-red-200 uppercase">DITOLAK</span>
                    : b.approvalStatus === "pending" ? <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-yellow-50 text-yellow-700 border border-yellow-200 uppercase animate-pulse">PENDING</span>
                    : <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-green-50 text-green-700 border border-green-200 uppercase">DISETUJUI</span>}
                  </td>
                  <td className="py-1 px-2 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      {b.approvalStatus === "pending" && (
                        <>
                          <button onClick={() => handleApproval(b.id, "approved")} className="w-full py-1.5 px-3 bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 rounded-lg text-[9px] font-bold uppercase cursor-pointer flex items-center justify-center gap-1 min-h-[32px]"><Check className="w-3 h-3" /><span>Setujui</span></button>
                          <button onClick={() => handleApproval(b.id, "rejected")} className="w-full py-1.5 px-3 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 rounded-lg text-[9px] font-bold uppercase cursor-pointer flex items-center justify-center gap-1 min-h-[32px]"><X className="w-3 h-3" /><span>Tolak</span></button>
                        </>
                      )}
                      {b.approvalStatus === "approved" && (
                        <button onClick={() => onOpenInvoice(b)} className="w-full py-1.5 px-3 bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 rounded-lg text-[9px] font-bold uppercase cursor-pointer flex items-center justify-center gap-1 min-h-[32px]"><FileText className="w-3 h-3" /><span>Detail</span></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-2.5 py-1 rounded text-[10px] font-bold bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 disabled:opacity-30 cursor-pointer transition">Prev</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => <button key={p} onClick={() => setPage(p)} className={`px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer transition ${page === p ? "bg-amber-500 text-black" : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:bg-zinc-800"}`}>{p}</button>)}
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-2.5 py-1 rounded text-[10px] font-bold bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 disabled:opacity-30 cursor-pointer transition">Next</button>
          <span className="text-[10px] text-zinc-500">{sorted.length} total</span>
        </div>
      )}
    </div>
  );
}
