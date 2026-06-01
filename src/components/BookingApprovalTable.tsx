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
  const [sortKey, setSortKey] = useState<"date" | "name" | "package" | "addons" | "price" | "status">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const PER_PAGE = 15;

  const toggleSort = (key: "date" | "name" | "package" | "addons" | "price" | "status") => {
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
    if (sortKey === "date") return dir * (new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
    if (sortKey === "name") return dir * a.customerName.localeCompare(b.customerName);
    if (sortKey === "package") return dir * a.packageName.localeCompare(b.packageName);
    if (sortKey === "addons") return dir * ((a.addonDetails?.length || 0) - (b.addonDetails?.length || 0));
    if (sortKey === "price") return dir * (a.totalPrice - b.totalPrice);
    if (sortKey === "status") return dir * a.approvalStatus.localeCompare(b.approvalStatus);
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
      <div className="flex flex-wrap items-center gap-2 justify-end">
        <div className="relative flex items-center gap-1">
          <svg className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input type="text" placeholder="Cari nama / WA..." value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setPage(1); }} className="w-36 pl-7 pr-2 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-[11px] text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 transition" />
          {searchQuery && <button onClick={clearSearch} title="Hapus pencarian" className="text-zinc-500 hover:text-zinc-300 transition cursor-pointer"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>}
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="py-16 text-center text-zinc-500 text-xs border border-dashed border-zinc-850 rounded-2xl">Tidak ditemukan pesanan.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-850 text-[10px] font-sans uppercase text-zinc-500 bg-black/20">
                <th className="py-2 px-2 rounded-l cursor-pointer select-none hover:text-white transition" onClick={() => toggleSort("name")}>
                  Klien {sortKey === "name" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                </th>
                <th className="py-2 px-2 cursor-pointer select-none hover:text-white transition" onClick={() => toggleSort("date")}>
                  Acara {sortKey === "date" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                </th>
                <th className="py-2 px-2 cursor-pointer select-none hover:text-white transition" onClick={() => toggleSort("package")}>
                  Paket {sortKey === "package" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                </th>
                <th className="py-2 px-2 cursor-pointer select-none hover:text-white transition" onClick={() => toggleSort("addons")}>
                  Add-Ons {sortKey === "addons" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                </th>
                <th className="py-2 px-2 text-right cursor-pointer select-none hover:text-white transition" onClick={() => toggleSort("price")}>
                  Biaya {sortKey === "price" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                </th>
                <th className="py-2 px-2 text-center cursor-pointer select-none hover:text-white transition" onClick={() => toggleSort("status")}>
                  Status {sortKey === "status" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                </th>
                <th className="py-2 px-2 text-center rounded-r">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {paginated.map(b => b && (
                <tr key={b.id} className="hover:bg-zinc-900/10 transition">
                  <td className="py-1 px-2 leading-3.25">
                    <span className="font-sans text-[9px] bg-zinc-900 border border-zinc-800 font-bold px-1 py-0.5 rounded text-zinc-350 block w-fit mb-0.5">{b.id}</span>
                    <div className="text-white font-bold text-[10px]">{b.customerName}</div>
                    <div className="text-zinc-400 text-[9px]">{b.customerPhone}</div>
                    <div className="text-zinc-500 text-[9px]">{b.customerCity}</div>
                  </td>
                  <td className="py-1 px-2 leading-3.25">
                    <span className="text-[9px] font-bold text-zinc-300 capitalize bg-zinc-900 border border-zinc-800 px-1 py-0.5 rounded block w-fit font-sans mb-0.5">{b.eventType === "wedding" ? `Wedding${b.weddingType ? " ("+b.weddingType+")" : ""}` : "Event"}</span>
                    <div className="text-zinc-200 text-[10px]">{formatEventDate(b.eventDate, { year: "numeric", month: "short", day: "numeric" })}</div>
                    <div className="text-zinc-450 text-[9px] truncate max-w-35">{b.venueLocation}</div>
                  </td>
                  <td className="py-1 px-2 leading-3.25"><span className="text-white text-[10px]">{b.packageName}</span></td>
                  <td className="py-1 px-2 leading-3.25">
                    {b.addonDetails && b.addonDetails.length > 0 ? (
                      <div>{Object.entries(b.addonDetails.reduce((acc: Record<string, number>, a) => { acc[a.name] = (acc[a.name] || 0) + 1; return acc; }, {})).map(([name, qty]) => <div key={name} className="text-[9px] text-zinc-400 font-sans leading-3.25">+ {name}{(qty as number) > 1 ? ` ×${qty}` : ""}</div>)}</div>
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
                          <button onClick={() => handleApproval(b.id, "approved")} className="w-full py-1 px-2 bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 rounded-lg text-[9px] font-bold uppercase cursor-pointer flex items-center justify-center gap-1"><Check className="w-3 h-3" /><span>Setujui</span></button>
                          <button onClick={() => handleApproval(b.id, "rejected")} className="w-full py-1 px-2 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 rounded-lg text-[9px] font-bold uppercase cursor-pointer flex items-center justify-center gap-1"><X className="w-3 h-3" /><span>Tolak</span></button>
                        </>
                      )}
                      {b.approvalStatus === "approved" && (
                        <button onClick={() => onOpenInvoice(b)} className="w-full py-1 px-2 bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 rounded-lg text-[9px] font-bold uppercase cursor-pointer flex items-center justify-center gap-1"><FileText className="w-3 h-3" /><span>Detail</span></button>
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
