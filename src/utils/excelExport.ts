import * as XLSX from "xlsx";
import { Booking, Package, Addon } from "../types";
import { formatEventDate } from "./dateFormatter";

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", fileName);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportBookingsToXLSX(bookings: Booking[]) {
  const data = bookings.map((b) => ({
    "ID Booking": b.id,
    "Tanggal Booking Masuk": new Date(b.createdAt).toLocaleDateString("id-ID", {
      year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
    }),
    "Nama Kustomer": b.customerName,
    "Nomor WhatsApp": b.customerPhone,
    "Kota / Domisili": b.customerCity,
    "Jenis Acara": b.eventType === "wedding" ? `Wedding (${b.weddingType || "Pernikahan"})` : "Event (Gathering/Komersial)",
    "Tanggal Pelaksanaan Acara": formatEventDate(b.eventDate, { year: "numeric", month: "long", day: "numeric" }),
    "Alamat Lengkap Venue": b.venueLocation,
    "Paket Utama": b.packageName,
    "Harga Paket Utama (IDR)": b.packagePrice,
    "Add-ons Tambahan": b.addonDetails?.length
      ? b.addonDetails.map((a: any) => `${a.name} (+Rp ${a.price.toLocaleString("id-ID")})`).join("; ")
      : "Tidak ada",
    "Metode Pembayaran": b.amountPaid < b.totalPrice
      ? `Sistem DP (${Math.round((b.amountPaid / b.totalPrice) * 100)}%)`
      : "Pembayaran Lunas (100%)",
    "Total Nilai Kontrak (IDR)": b.totalPrice,
    "Nominal Terbayar (IDR)": b.amountPaid,
    "Sisa Tagihan Pelunasan (IDR)": b.remainingPayment,
    Kupon: b.couponCode || "-",
    "Status Pesanan": b.approvalStatus === "rejected" ? "DITOLAK" : b.approvalStatus === "pending" ? "PENDING" : b.paymentStatus === "paid" ? "LUNAS" : b.paymentStatus === "dp_paid" ? "DP PAID" : "APPROVED",
    "Tanggal Disetujui": b.approvedAt
      ? new Date(b.approvedAt).toLocaleDateString("id-ID", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
      : "-",
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Rekap Booking");

  const colWidths = Object.keys(data[0] || {}).map(() => ({ wch: 25 }));
  ws["!cols"] = colWidths;

  const blob = new Blob([XLSX.write(wb, { bookType: "xlsx", type: "array" })], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  downloadBlob(blob, `Rekap_Booking_Krealogs_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportPackagesToXLSX(packages: Package[]) {
  const data = packages.map((p) => ({
    "ID Paket": p.id,
    "Nama Paket": p.name,
    "Tipe Acara": p.type === "wedding" ? "Wedding Only" : p.type === "event" ? "Event Only" : "Wedding & Event",
    "Harga Paket (IDR)": p.price,
    "Deskripsi Singkat": p.description,
    "Fitur-fitur Layanan": p.features?.join("; ") || "",
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Paket");
  ws["!cols"] = Object.keys(data[0] || {}).map(() => ({ wch: 30 }));

  const blob = new Blob([XLSX.write(wb, { bookType: "xlsx", type: "array" })], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  downloadBlob(blob, `Daftar_Paket_Krealogs_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportAddonsToXLSX(addons: Addon[]) {
  const data = addons.map((a) => ({
    "ID Add-On": a.id,
    "Nama Add-On": a.name,
    "Harga Add-On (IDR)": a.price,
    "Deskripsi Tambahan": a.description || "",
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Add-Ons");
  ws["!cols"] = Object.keys(data[0] || {}).map(() => ({ wch: 30 }));

  const blob = new Blob([XLSX.write(wb, { bookType: "xlsx", type: "array" })], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  downloadBlob(blob, `Daftar_Addons_Krealogs_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
