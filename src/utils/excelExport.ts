import { Booking, Package, Addon } from "../types";
import { formatEventDate } from "./dateFormatter";

/**
 * Utility to download generated files natively in the browser
 */
function downloadBlob(content: string, fileName: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", fileName);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Exports all bookings to an Excel-friendly UTF-8 CSV with BOM
 */
export function exportBookingsToCSV(bookings: Booking[]) {
  const headers = [
    "ID Booking",
    "Tanggal Booking Masuk",
    "Nama Kustomer",
    "Nomor WhatsApp",
    "Kota / Domisili",
    "Jenis Acara",
    "Tanggal Pelaksanaan Acara",
    "Alamat Lengkap Venue",
    "Paket Utama",
    "Harga Paket Utama (IDR)",
    "Add-ons Tambahan",
    "Metode Pembayaran",
    "Total Nilai Kontrak (IDR)",
    "Nominal Terbayar (IDR)",
    "Sisa Tagihan Pelunasan (IDR)",
    "Status Pesanan",
    "Tanggal Disetujui"
  ];

  const csvRows = [headers.join(",")];

  bookings.forEach((b) => {
    const addonsStr = b.addonDetails && b.addonDetails.length > 0
      ? b.addonDetails.map((a) => `${a.name} (+Rp ${a.price.toLocaleString("id-ID")})`).join("; ")
      : "Tidak ada";

    const formattedEventDate = formatEventDate(b.eventDate, {
      year: "numeric",
      month: "long",
      day: "numeric"
    });

    const formattedCreatedDate = new Date(b.createdAt).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });

    const formattedApprovedDate = b.approvedAt
      ? new Date(b.approvedAt).toLocaleDateString("id-ID", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit"
        })
      : "-";

    const row = [
      b.id,
      formattedCreatedDate,
      b.customerName,
      b.customerPhone,
      b.customerCity,
      b.eventType === "wedding" ? `Wedding (${b.weddingType || "Pernikahan"})` : "Event (Gathering/Komersial)",
      formattedEventDate,
      b.venueLocation,
      b.packageName,
      b.packagePrice,
      addonsStr,
      b.amountPaid < b.totalPrice ? `Sistem DP (${Math.round((b.amountPaid / b.totalPrice) * 100)}%)` : "Pembayaran Lunas (100%)",
      b.totalPrice,
      b.amountPaid,
      b.remainingPayment,
      b.status.toUpperCase(),
      formattedApprovedDate
    ];

    // Escape cells and wrap in quotes
    const escapedRow = row.map((val) => {
      const stringVal = String(val === null || val === undefined ? "" : val);
      // Double quotes are escaped by doubling them in CSV
      return `"${stringVal.replace(/"/g, '""')}"`;
    });

    csvRows.push(escapedRow.join(","));
  });

  // Prefixed with \uFEFF UTF-8 BOM so Microsoft Excel reads special characters (such as Rp symbol, dates) without encoding glitches
  const csvContent = "\uFEFF" + csvRows.join("\r\n");
  const fileName = `Rekap_Booking_Krealogs_${new Date().toISOString().slice(0, 10)}.csv`;
  downloadBlob(csvContent, fileName, "text/csv;charset=utf-8;");
}

/**
 * Exports currently published packages to an Excel-friendly UTF-8 CSV with BOM
 */
export function exportPackagesToCSV(packages: Package[]) {
  const headers = [
    "ID Paket",
    "Nama Paket",
    "Tipe Acara",
    "Harga Paket (IDR)",
    "Deskripsi Singkat",
    "Fitur-fitur Layanan"
  ];

  const csvRows = [headers.join(",")];

  packages.forEach((p) => {
    const featuresStr = p.features ? p.features.join("; ") : "";
    const roType = p.type === "wedding" ? "Wedding Only" : p.type === "event" ? "Event Only" : "Wedding & Event";
    
    const row = [
      p.id,
      p.name,
      roType,
      p.price,
      p.description,
      featuresStr
    ];

    const escapedRow = row.map((val) => {
      const stringVal = String(val === null || val === undefined ? "" : val);
      return `"${stringVal.replace(/"/g, '""')}"`;
    });

    csvRows.push(escapedRow.join(","));
  });

  const csvContent = "\uFEFF" + csvRows.join("\r\n");
  const fileName = `Daftar_Paket_Krealogs_${new Date().toISOString().slice(0, 10)}.csv`;
  downloadBlob(csvContent, fileName, "text/csv;charset=utf-8;");
}

/**
 * Exports currently published add-ons to an Excel-friendly UTF-8 CSV with BOM
 */
export function exportAddonsToCSV(addons: Addon[]) {
  const headers = [
    "ID Add-On",
    "Nama Add-On",
    "Harga Add-On (IDR)",
    "Deskripsi Tambahan"
  ];

  const csvRows = [headers.join(",")];

  addons.forEach((a) => {
    const row = [
      a.id,
      a.name,
      a.price,
      a.description
    ];

    const escapedRow = row.map((val) => {
      const stringVal = String(val === null || val === undefined ? "" : val);
      return `"${stringVal.replace(/"/g, '""')}"`;
    });

    csvRows.push(escapedRow.join(","));
  });

  const csvContent = "\uFEFF" + csvRows.join("\r\n");
  const fileName = `Daftar_Addons_Krealogs_${new Date().toISOString().slice(0, 10)}.csv`;
  downloadBlob(csvContent, fileName, "text/csv;charset=utf-8;");
}
