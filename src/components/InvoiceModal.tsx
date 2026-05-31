import React from "react";
import { Booking } from "../types";
import { X, Printer, CheckCircle } from "lucide-react";
import { formatEventDate } from "../utils/dateFormatter";

const brandLogo = "/src/assets/images/krealogs_logo_1780149664590.png";

interface InvoiceModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function InvoiceModal({ booking, isOpen, onClose }: InvoiceModalProps) {
  if (!isOpen || !booking) return null;

  const handlePrint = () => {
    window.print();
  };

  // Convert event dates & items to solid rows matching the template
  const tableItems: {
    description: React.ReactNode;
    qty: number;
    price: number | string;
    discount: number | string;
  }[] = [];

  const mainEventTypeLabel = booking.eventType === "wedding"
    ? `Pernikahan (Wedding - ${booking.weddingType || "Pernikahan"})`
    : "Komersial (Event)";

  if (booking.days && booking.days.length > 0) {
    booking.days.forEach((day, dIdx) => {
      // Main day package
      tableItems.push({
        description: (
          <div className="space-y-0.5 text-[11px] leading-tight text-zinc-900 font-sans">
            <span className="font-bold font-sans">Paket: {day.packageName}</span>
            <div>Acara: {mainEventTypeLabel} (Hari #{dIdx + 1})</div>
            <div>Tanggal: {formatEventDate(day.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
            <div>Tempat: {booking.venueLocation || "Lokasi Ditentukan"}</div>
          </div>
        ),
        qty: 1,
        price: day.packagePrice,
        discount: 0
      });

      // Day addons
      if (day.addonDetails && day.addonDetails.length > 0) {
        day.addonDetails.forEach((a) => {
          const qtyMatch = a.name.match(/\(x(\d+)\)/);
          const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;
          const cleanName = a.name.replace(/\s*\(x\d+\)/, "");

          tableItems.push({
            description: (
              <div className="text-[11px] font-sans text-zinc-800 font-medium">
                Add ons: {cleanName} (Hari #{dIdx + 1})
              </div>
            ),
            qty,
            price: a.price,
            discount: 0
          });
        });
      }
    });
  } else {
    // Fallback/Legacy Single-Day structure
    tableItems.push({
      description: (
        <div className="space-y-0.5 text-[11px] leading-tight text-zinc-900 font-sans">
          <span className="font-bold font-sans">Paket: {booking.packageName}</span>
          <div>Acara: {mainEventTypeLabel}</div>
          <div>Tanggal: {formatEventDate(booking.eventDate, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
          <div>Tempat: {booking.venueLocation || "Lokasi Ditetermined"}</div>
        </div>
      ),
      qty: 1,
      price: booking.packagePrice,
      discount: 0
    });

    if (booking.addonDetails && booking.addonDetails.length > 0) {
      booking.addonDetails.forEach((a) => {
        const qtyMatch = a.name.match(/\(x(\d+)\)/);
        const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;
        const cleanName = a.name.replace(/\s*\(x\d+\)/, "");

        tableItems.push({
          description: (
            <div className="text-[11px] font-sans text-zinc-800 font-medium">
              Add ons: {cleanName}
            </div>
          ),
          qty,
          price: a.price,
          discount: 0
        });
      });
    }
  }

  // Calculate Subtotal and Total
  const subtotal = booking.totalPrice;
  const total = booking.totalPrice;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md no-print">
      <div className="relative w-full max-w-4xl overflow-hidden bg-zinc-950 rounded-2xl shadow-2xl border border-zinc-850 flex flex-col max-h-[95vh]">
        
        {/* Header toolbar for web preview - No print */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-900 bg-zinc-950 text-white no-print">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 text-xs font-mono font-bold rounded bg-zinc-900 text-zinc-300 border border-zinc-800">
              {booking.id}
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              {booking.status === "paid" ? "Kwitansi Resmi Krealogs" : "Invoice Resmi Krealogs"}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center px-4 py-2 text-xs font-black text-black bg-amber-500 hover:bg-amber-400 rounded-xl transition cursor-pointer select-none"
            >
              <Printer className="w-3.5 h-3.5 mr-2 stroke-[2.5]" />
              CETAK / SIMPAN PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Printable Sheet */}
        <div className="flex-1 overflow-y-auto p-4 md:p-10 bg-zinc-900 flex justify-center">
          <div
            id="printable-invoice"
            className="w-full max-w-[210mm] min-h-[297mm] bg-white p-8 md:p-12 text-black font-sans relative flex flex-col justify-between shadow-2xl border border-zinc-300"
            style={{ boxSizing: "border-box" }}
          >
            {/* Ink Stamp Overlay ("LUNAS" watermark in center/right of table) */}
            {booking.status === "paid" ? (
              <div 
                className="absolute top-[49%] left-[62%] -translate-x-1/2 -translate-y-1/2 rotate-[-14deg] z-0 pointer-events-none select-none opacity-35 scale-105"
                title="LUNAS WATERMARK"
              >
                {/* Vintage Circular Rounded Rect Stamp */}
                <div className="border-4 border-double border-emerald-600/85 text-emerald-650 px-6 py-2 rounded-2xl flex flex-col items-center bg-white/40 shadow-sm">
                  <span className="text-[10px] font-mono font-black tracking-[0.2em] opacity-80 leading-none">KREALOGS</span>
                  <span className="text-3xl font-extrabold tracking-widest leading-normal filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.1)] py-0.5">LUNAS</span>
                  <div className="w-full h-px bg-emerald-600/50 mb-1"></div>
                  <span className="text-[9px] font-mono font-bold tracking-wider leading-none">ESTD 2025</span>
                </div>
              </div>
            ) : booking.status === "dp_paid" ? (
              <div 
                className="absolute top-[49%] left-[62%] -translate-x-1/2 -translate-y-1/2 rotate-[-14deg] z-0 pointer-events-none select-none opacity-35 scale-105"
                title="DP TERBAYAR WATERMARK"
              >
                <div className="border-4 border-double border-amber-600/85 text-amber-650 px-5 py-2.5 rounded-2xl flex flex-col items-center bg-white/45 shadow-sm">
                  <span className="text-[9px] font-mono font-black tracking-widest opacity-85 leading-none">KREALOGS</span>
                  <span className="text-xl font-black tracking-wide leading-normal py-0.5 uppercase">DP TERBAYAR</span>
                  <div className="w-full h-px bg-amber-600/50 mb-1"></div>
                  <span className="text-[8px] font-mono font-bold tracking-wider leading-none">BOOKING CONFIRMED</span>
                </div>
              </div>
            ) : null}

            {/* Content Top */}
            <div className="space-y-6 relative z-10">
              {/* Header: Logo and Brand Slogan */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200 pb-5">
                {/* Brand Logo Standalone */}
                <div className="flex items-center select-none">
                  <img
                    src={brandLogo}
                    alt="Krealogs Logo"
                    className="h-10 w-auto object-contain shrink-0"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Right Header Side: Meta labels and values */}
                <div className="text-left sm:text-right space-y-1 sm:max-w-xs">
                  <h2 className="text-xs font-black font-sans text-neutral-900 uppercase tracking-wide leading-tight">
                    {booking.status === "paid" ? "KWITANSI PELUNASAN RESMI KREALOGS" : "INVOICE PEMESANAN JASA KREALOGS"}
                  </h2>
                  
                  {/* Specific black-bordered header meta data grid */}
                  <div className="mt-2 inline-block w-full sm:w-64 border border-zinc-950 text-xs font-sans">
                    <div className="flex border-b border-zinc-950">
                      <div className="w-24 bg-zinc-100 font-bold p-1.5 border-r border-zinc-950 uppercase text-[10px] tracking-wider shrink-0 text-left">
                        {booking.status === "paid" ? "KWITANSI NO" : "INVOICE NO"}
                      </div>
                      <div className="p-1.5 font-mono font-bold text-zinc-900 text-left truncate flex-1">
                        056/{booking.status === "paid" ? "KWT" : "INV"}/CC/{booking.id.toUpperCase()}/{new Date(booking.createdAt).getFullYear()}
                      </div>
                    </div>
                    <div className="flex">
                      <div className="w-24 bg-zinc-100 font-bold p-1.5 border-r border-zinc-950 uppercase text-[10px] tracking-wider shrink-0 text-left">
                        TANGGAL
                      </div>
                      <div className="p-1.5 font-medium text-zinc-900 text-left flex-1 text-[11px]">
                        {new Date(booking.createdAt).toLocaleDateString("id-ID", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric"
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* UNTUK & DARI Details Section Grid */}
              <div className="grid grid-cols-2 gap-x-8 text-xs font-sans pb-3">
                {/* UNTUK Address block */}
                <div className="space-y-1">
                  <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest font-sans mb-1.5">
                    UNTUK:
                  </h3>
                  <p className="text-sm font-extrabold text-neutral-950 leading-tight">
                    {booking.customerName}
                  </p>
                  <p className="text-zinc-650 font-mono text-[11px]">
                    {booking.customerPhone || "(+62) 852 4886 9686"}
                  </p>
                  <p className="text-zinc-600">
                    {booking.customerCity || "Banjarmasin"}
                  </p>
                </div>

                {/* DARI Brand address block */}
                <div className="space-y-1 pl-4 border-l border-zinc-100">
                  <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest font-sans mb-1.5">
                    DARI:
                  </h3>
                  <p className="text-sm font-extrabold text-neutral-950 leading-tight">
                    Krealogs
                  </p>
                  <p className="text-zinc-600">
                    Banjarmasin, Indonesia
                  </p>
                  <p className="text-zinc-650 font-mono text-[11px]">
                    (+62) 812 4198 7783
                  </p>
                  <p className="text-zinc-500 font-mono text-[11px]">
                    kreatiflogs@gmail.com
                  </p>
                </div>
              </div>

              {/* Ledger Table Section */}
              <div className="pt-2">
                <table className="w-full border border-zinc-950 border-collapse text-xs font-sans">
                  <thead>
                    <tr className="bg-[#C00000] text-white font-bold text-[11px] uppercase border-b border-zinc-950">
                      <th className="border-r border-zinc-950 p-2.5 text-left font-black tracking-widest w-[50%]">
                        DESKRIPSI
                      </th>
                      <th className="border-r border-zinc-950 p-2.5 text-center font-black tracking-widest w-[10%]">
                        QTY
                      </th>
                      <th className="border-r border-zinc-950 p-2.5 text-right font-black tracking-widest w-[25%]">
                        TOTAL
                      </th>
                      <th className="p-2.5 text-center font-black tracking-widest w-[15%]">
                        DISKON
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableItems.map((item, index) => {
                      const isLastRow = index === tableItems.length - 1;
                      return (
                        <tr 
                          key={index} 
                          className="border-b border-zinc-950/70"
                          style={{ borderBottomWidth: isLastRow ? "1px" : "1px" }}
                        >
                          {/* DESCRIPTION CELL */}
                          <td className="border-r border-zinc-950 p-2.5 align-top min-h-6">
                            {item.description}
                          </td>

                          {/* QTY CELL */}
                          <td className="border-r border-zinc-950 p-2.5 text-center align-top font-mono font-medium text-neutral-900">
                            {item.qty}
                          </td>

                          {/* TOTAL CELL */}
                          <td className="border-r border-zinc-950 p-2.5 text-right align-top font-mono font-medium text-neutral-900">
                            {typeof item.price === "number" 
                              ? `Rp ${item.price.toLocaleString("id-ID")}` 
                              : item.price}
                          </td>

                          {/* DISCOUNT CELL */}
                          <td className="p-2.5 text-center align-top font-mono font-medium text-neutral-600">
                            {item.discount}
                          </td>
                        </tr>
                      );
                    })}

                    {/* Yellow Shaded Subtotal Row */}
                    <tr>
                      <td 
                        colSpan={3} 
                        className="border-r border-b border-zinc-950 p-2.5 text-right font-black uppercase text-[10px] tracking-widest bg-[#FFC000] text-neutral-950"
                      >
                        SUBTOTAL
                      </td>
                      <td 
                        className="p-2.5 text-right font-bold font-mono text-[11px] bg-[#FFC000] text-neutral-950"
                      >
                        Rp {subtotal.toLocaleString("id-ID")}
                      </td>
                    </tr>

                    {/* Pink Shaded Lain-Lain Row */}
                    <tr>
                      <td 
                        colSpan={3} 
                        className="border-r border-b border-zinc-950 p-2.5 text-right font-black uppercase text-[10px] tracking-widest bg-[#FCE4D6] text-neutral-950"
                      >
                        LAIN-LAIN
                      </td>
                      <td 
                        className="p-2.5 text-right font-bold font-mono text-[11px] bg-[#FCE4D6] text-neutral-950"
                      >
                        -
                      </td>
                    </tr>

                    {/* Orange Shaded TOTAL Row */}
                    <tr>
                      <td 
                        colSpan={3} 
                        className="border-r border-zinc-950 p-2.5 text-right font-black uppercase text-[11px] tracking-wider bg-[#F47B20] text-white"
                      >
                        TOTAL
                      </td>
                      <td 
                        className="p-2.5 text-right font-black font-mono text-xs bg-[#F47B20] text-white"
                      >
                        Rp {total.toLocaleString("id-ID")}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-10 mt-6 border-t border-zinc-150 relative z-10">
              {/* Payment Details */}
              <div className="space-y-1.5 text-xs text-zinc-900 text-left">
                <p className="font-bold text-neutral-950">Metode Pembayaran:</p>
                <div className="space-y-0.5 leading-relaxed text-[11px] text-zinc-800">
                  <p>Transfer ke:</p>
                  <p className="font-extrabold text-neutral-950 text-xs">Bank BCA</p>
                  <p className="font-mono bg-zinc-100 border border-zinc-200 rounded px-1.5 py-0.5 inline-block text-[11px] text-neutral-900 font-bold my-0.5">
                    No. Rek: 0512688096
                  </p>
                  <p>a.n <span className="font-semibold text-neutral-950">Brilliant Rizky Fortuna</span></p>
                </div>

                {/* Sisa pembayaran notice for booking deposits */}
                {booking.amountPaid < booking.totalPrice && (
                  <div className="mt-4 p-2.5 bg-rose-50 border border-rose-200/50 rounded-xl text-[10px] space-y-1">
                    <p className="font-bold text-rose-800 uppercase tracking-wider">CATATAN BIAYA DEPOSIT (DP):</p>
                    <div className="grid grid-cols-2 gap-x-2 text-zinc-600 font-mono">
                      <span>DP Terbayar:</span>
                      <span className="text-right text-emerald-600 font-bold">Rp {booking.amountPaid.toLocaleString("id-ID")}</span>
                      <span>Sisa Pelunasan:</span>
                      <span className="text-right text-rose-600 font-bold">Rp {booking.remainingPayment.toLocaleString("id-ID")}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Purple Administrative Brand Seal and Signature Section */}
              <div className="flex flex-col items-end justify-center relative pr-4 min-h-36">
                
                {/* Purplish Circular Watermark Seal Badge */}
                <div className="absolute right-12 top-1 w-24 h-24 rounded-full border border-indigo-400/20 bg-indigo-50/10 flex items-center justify-center opacity-30 select-none pointer-events-none">
                  <div className="w-20 h-20 rounded-full border border-dashed border-indigo-500/20 flex flex-col items-center justify-center">
                    <span className="text-[6px] font-mono tracking-widest text-indigo-750 font-black">ESTD 2025</span>
                    <span className="text-lg font-black text-indigo-800">K</span>
                    <span className="text-[6px] font-mono tracking-widest text-indigo-750 font-black">KREALOGS</span>
                  </div>
                </div>

                {/* SVG Administrative signature Overlay */}
                <div className="relative z-10 w-28 h-12 opacity-80 mb-1 select-none pointer-events-none">
                  <svg viewBox="0 0 100 40" className="w-full h-full text-indigo-800">
                    {/* Retro signature pen path design */}
                    <path
                      d="M 10 30 Q 30 5, 25 35 T 50 15 T 70 32 T 90 20 Q 95 18, 85 24 L 75 25"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 15 22 Q 45 4, 65 30 T 95 12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeDasharray="1,2"
                    />
                  </svg>
                </div>

                {/* Seal signature title */}
                <p className="text-xs font-black text-neutral-900 border-b border-zinc-950 w-48 text-center pb-0.5 relative z-10 font-sans">
                  Dymas Herrnawan, S.I.Kom
                </p>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider text-center w-48 mt-0.5 relative z-10 font-sans">
                  Tim Krealogs
                </p>
              </div>
            </div>

            {/* Very Bottom disclaimer text info */}
            <div className="mt-6 pt-4 border-t border-zinc-200 text-center">
              <span className="text-[9px] text-zinc-400 uppercase tracking-widest block mb-0.5">Dokumen Sah Komputerisasi • Krealogs Creatives 2026</span>
              <span className="text-[8px] text-zinc-400 block max-w-lg mx-auto leading-normal">
                Harap simpan salinan invoice ini sebagai bukti pemesanan penugasan resmi tim videografer. Semua syarat & ketentuan berlaku sebagaimana didaftarkan via platform Krealogs.com.
              </span>
            </div>
            
          </div>
        </div>

      </div>

      <style>{`
        @media print {
          /* Hide main web app layouts completely during print */
          header, 
          footer, 
          main,
          .no-print,
          #root > header,
          #root > main,
          #root > footer {
            display: none !important;
          }

          /* Force browser page margins and set pure white backgrounds */
          @page {
            margin: 10mm;
            size: auto;
          }
          
          body, html {
            background-color: #ffffff !important;
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Reset absolute/fixed positioning of the modal overlay so only sheet prints */
          .fixed.inset-0 {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            background: #ffffff !important;
            background-color: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            display: block !important;
            overflow: visible !important;
          }

          /* Reset inner modal content card to print naturally as a page block */
          .fixed.inset-0 > div {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: none !important;
            max-height: none !important;
            height: auto !important;
            background: #ffffff !important;
            background-color: #ffffff !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            display: block !important;
            overflow: visible !important;
          }

          #printable-invoice {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: none !important;
            min-height: 0 !important;
            height: auto !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            background: #ffffff !important;
            background-color: #ffffff !important;
          }
        }
      `}</style>
    </div>
  );
}

