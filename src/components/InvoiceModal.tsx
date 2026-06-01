import React, { useEffect, useRef, useState } from "react";
import type { Booking, BookingDay } from "../types";

/* ------------------------------------------------------------------ */
/*  CONFIG / TYPES                                                     */
/* ------------------------------------------------------------------ */

interface InvoiceConfig {
  bankName: string;
  bankAccount: string;
  bankAccountName: string;
  contactPhone: string;
  contactEmail: string;
  signatureName: string;
  signatureTitle: string;
}

interface InvoiceModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_CONFIG: InvoiceConfig = {
  bankName: "Bank BCA",
  bankAccount: "0512688096",
  bankAccountName: "Brilliant Rizky Fortuna",
  contactPhone: "(+62) 812-4198-7783",
  contactEmail: "kreatiflogs@gmail.com",
  signatureName: "Dymas Herrnawan, S.I.Kom",
  signatureTitle: "Tim Krealogs",
};

/** Wordmark on the terracotta band. Swap for your asset path. */
const LOGO_URL = "/krealogs-logo-white.png";

const PALETTE = {
  terra: "#d05848",
  terraDeep: "#b3402c",
  ink: "#241f1c",
  inkSoft: "#6c625b",
  line: "rgba(36,31,28,.12)",
  lineStrong: "rgba(36,31,28,.28)",
  cream: "#f7f2ea",
  paper: "#fffdfa",
};

/* ------------------------------------------------------------------ */
/*  HELPERS                                                            */
/* ------------------------------------------------------------------ */

const rp = (n: number) => "Rp" + Math.round(n || 0).toLocaleString("id-ID");

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

function formatDateID(input: string | number | Date): string {
  const d = new Date(input);
  if (isNaN(d.getTime())) return String(input ?? "");
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(d);
}

function formatDateShort(input: string | number | Date | undefined): string {
  if (!input) return "";
  const d = new Date(input);
  if (isNaN(d.getTime())) return String(input);
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(d);
}

function invoiceNumber(b: Booking): string {
  const d = new Date(b.createdAt);
  const month = isNaN(d.getTime()) ? "I" : ROMAN[d.getMonth()];
  const year = isNaN(d.getTime()) ? new Date().getFullYear() : d.getFullYear();
  const seq = String(b.id).replace(/\D/g, "").padStart(3, "0") || String(b.id);
  return `${seq}/INV/CC/${month}/${year}`;
}

type Addon = { name: string; price?: number; qty?: number };

/** addonDetails may arrive as array | string | object — normalise it. */
function toAddons(raw: unknown): Addon[] {
  if (!raw) return [];
  let parsed: Addon[] = [];
  if (Array.isArray(raw)) {
    parsed = raw.map((x: any) => {
      if (typeof x === "string") {
        return { name: x, price: 0, qty: 1 };
      }
      return {
        name: x?.name ?? x?.detail ?? x?.title ?? "",
        price: x?.price ?? x?.amount ?? 0,
        qty: x?.qty ?? x?.quantity ?? 1
      };
    }).filter((a) => a.name);
  } else if (typeof raw === "string") {
    parsed = raw
      .split(/\r?\n|,|;/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((name) => ({ name, price: 0, qty: 1 }));
  } else if (typeof raw === "object") {
    const o = raw as any;
    parsed = o.name ? [{ name: o.name, price: o.price ?? o.amount ?? 0, qty: o.qty ?? o.quantity ?? 1 }] : [];
  }

  return parsed.map((addon) => {
    let name = addon.name;
    let price = addon.price || 0;
    let qty = addon.qty || 1;

    const match = name.match(/[\s(×x]+(\d+)\)?$/);
    if (match) {
      const parsedQty = parseInt(match[1], 10);
      if (!isNaN(parsedQty) && parsedQty > 0) {
        qty = parsedQty;
        name = name.replace(/[\s(×x]+\d+\)?$/, "").trim();
        price = Math.round(price / qty);
      }
    }
    return { name, price, qty };
  });
}

interface Row {
  name: string;
  price: number;
  qty: number;
  meta: string[];
}

/* ------------------------------------------------------------------ */
/*  INLINE STYLE OBJECTS                                               */
/* ------------------------------------------------------------------ */

const S: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 1000,
    background: "rgba(20,16,14,.55)",
    backdropFilter: "blur(2px)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    overflow: "auto",
    padding: "32px 16px",
    fontFamily: '"Hanken Grotesk", system-ui, sans-serif',
  },
  toolbar: {
    width: 794,
    maxWidth: "100%",
    display: "flex",
    justifyContent: "center",
    gap: 10,
    marginTop: 6,
    marginBottom: 6,
  },
  btn: {
    border: "none",
    cursor: "pointer",
    fontFamily: '"Hanken Grotesk", system-ui, sans-serif',
    fontWeight: 700,
    fontSize: 13,
    letterSpacing: ".02em",
    padding: "11px 22px",
    borderRadius: 8,
  },
  btnPrint: { background: PALETTE.terra, color: "#fff" },
  btnClose: { background: "rgba(255,255,255,.16)", color: "#fff" },

  root: {
    width: 794,
    minHeight: 1123,
    maxWidth: "100%",
    background: PALETTE.paper,
    color: PALETTE.ink,
    position: "relative",
    display: "flex",
    flexDirection: "column",
    fontFamily: '"Hanken Grotesk", system-ui, sans-serif',
    fontSize: 13,
    lineHeight: 1.5,
    overflow: "visible",
    boxShadow: "0 24px 70px rgba(0,0,0,.35)",
  },

  /* band */
  band: { background: PALETTE.terra, color: "#fff", padding: "30px 48px 24px" },
  bandTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  logo: { width: 140, height: "auto", display: "block" },
  tag: {
    marginTop: 8,
    fontSize: 8.5,
    letterSpacing: ".26em",
    textTransform: "uppercase",
    fontWeight: 600,
    color: "rgba(255,255,255,.82)",
  },
  word: {
    fontFamily: '"Space Grotesk", sans-serif',
    fontWeight: 700,
    fontSize: 26,
    letterSpacing: ".02em",
    lineHeight: 1,
    textAlign: "right",
  },
  bandMeta: { display: "flex", gap: 36, justifyContent: "flex-end", marginTop: 12 },
  bm: { textAlign: "right" },
  bmK: {
    fontSize: 7.5,
    letterSpacing: ".2em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,.7)",
    fontWeight: 700,
    marginBottom: 2,
  },
  bmV: { fontSize: 11, fontWeight: 600, color: "#fff", whiteSpace: "nowrap" },

  /* body */
  body: { padding: "24px 48px 0", display: "flex", flexDirection: "column", flex: 1 },
  parties: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 },
  card: { border: `1px solid ${PALETTE.line}`, borderRadius: 8, padding: "12px 16px" },
  cardDark: { background: PALETTE.cream, border: "1px solid transparent", borderRadius: 8, padding: "12px 16px" },
  plabel: {
    fontSize: 8.5,
    letterSpacing: ".2em",
    textTransform: "uppercase",
    color: PALETTE.terra,
    fontWeight: 700,
    marginBottom: 6,
  },
  pname: { fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, fontSize: 15, marginBottom: 4 },
  pline: { fontSize: 11, color: PALETTE.inkSoft },

  thead: {
    display: "grid",
    gridTemplateColumns: "1fr 48px 100px 100px",
    gap: 8,
    background: PALETTE.ink,
    color: "#fff",
    padding: "8px 14px",
    borderRadius: "4px 4px 0 0",
  },
  th: { fontSize: 8.5, letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 700, color: "rgba(255,255,255,.78)" },
  thR: { textAlign: "right" },
  thC: { textAlign: "center" },
  row: {
    display: "grid",
    gridTemplateColumns: "1fr 48px 100px 100px",
    gap: 8,
    padding: "10px 14px",
    borderBottom: `1px solid ${PALETTE.line}`,
    alignItems: "start",
  },
  iname: { fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600, fontSize: 12, marginBottom: 3 },
  imeta: { fontSize: 10, color: PALETTE.inkSoft, lineHeight: 1.4 },
  cell: { fontSize: 11 },
  cellR: { textAlign: "right" },
  cellC: { textAlign: "center" },
  cellB: { fontWeight: 700 },

  totals: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: 14, gap: 24 },

  voucher: {
    position: "relative",
    display: "inline-flex",
    alignItems: "stretch",
    borderRadius: 10,
    overflow: "hidden",
    background: "rgba(208,88,72,.09)",
  },
  voucherStub: {
    width: 64,
    flex: "none",
    background: PALETTE.terra,
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  voucherPct: { fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, fontSize: 20, lineHeight: 1 },
  voucherOff: { fontSize: 8, letterSpacing: ".22em", fontWeight: 700, opacity: 0.9 },
  voucherBody: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: 5,
    padding: "13px 18px 13px 19px",
  },
  voucherTag: { fontSize: 8, letterSpacing: ".18em", textTransform: "uppercase", color: PALETTE.terra, fontWeight: 700 },
  voucherCode: {
    fontFamily: '"Space Mono", monospace',
    fontWeight: 700,
    fontSize: 15,
    letterSpacing: ".1em",
    color: PALETTE.terraDeep,
  },
  voucherNote: { fontSize: 10.5, color: PALETTE.inkSoft, whiteSpace: "nowrap" },

  totalsInner: { width: 280, position: "relative" },
  stampLunas: {
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%) rotate(-12deg)",
    height: 140,
    opacity: 0.85,
    pointerEvents: "none",
    zIndex: 10,
  },
  trow: { display: "flex", justifyContent: "space-between", padding: "5px 2px", fontSize: 11.5, color: PALETTE.inkSoft },
  trowV: { color: PALETTE.ink, fontWeight: 600 },
  trowDisc: { color: PALETTE.terra, fontWeight: 600 },
  tbox: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
    background: PALETTE.terra,
    color: "#fff",
    padding: "2px 16px",
    borderRadius: 4,
  },
  tboxK: { fontSize: 9, letterSpacing: ".2em", textTransform: "uppercase", fontWeight: 700 },
  tboxV: { fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, fontSize: 14, textAlign: "right" },

  dp: { marginTop: 8, display: "flex", flexDirection: "column", gap: 5 },
  dpDue: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    background: "rgba(208,88,72,.09)",
    borderRadius: 4,
    padding: "7px 12px",
  },
  dpLbl: { fontSize: 9, letterSpacing: ".04em", textTransform: "uppercase", fontWeight: 700, color: PALETTE.terraDeep },
  dpAmt: { fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, fontSize: 13, color: PALETTE.terraDeep },
  dpRest: { display: "flex", justifyContent: "space-between", padding: "0 12px", fontSize: 11, color: PALETTE.inkSoft, whiteSpace: "nowrap" },
  dpRestV: { fontWeight: 600, color: PALETTE.ink },

  foot: { marginTop: 30, display: "grid", gridTemplateColumns: "1fr auto", gap: 30, alignItems: "end", padding: "20px 0 28px" },
  pay: { borderLeft: `3px solid ${PALETTE.terra}`, paddingLeft: 14 },
  payLabel: { fontSize: 7.5, letterSpacing: ".2em", textTransform: "uppercase", color: PALETTE.terra, fontWeight: 700, marginBottom: 7 },
  payGrid: { display: "grid", gridTemplateColumns: "auto 1fr", gap: "3px 14px", fontSize: 11 },
  payK: { color: PALETTE.inkSoft, whiteSpace: "nowrap" },
  payVPlain: { fontWeight: 600 },
  payVMono: { fontWeight: 600, fontFamily: '"Space Mono", monospace' },
  sign: { textAlign: "center", minWidth: 240 },
  signInner: { position: "relative", display: "inline-block" },
  signContent: { position: "relative", zIndex: 2 },
  stampImg: { position: "absolute", left: 0, top: "50%", transform: "translateY(-50%) translateX(-33%) rotate(-20deg)", height: 110, opacity: 0.25, pointerEvents: "none", zIndex: 1 },
  signImg: { height: 125, marginBottom: -48, objectFit: "contain", opacity: 0.85, display: "block", marginLeft: "auto", marginRight: "auto" },
  signName: { fontFamily: '"Hanken Grotesk", sans-serif', fontSize: 13, fontWeight: 400, marginBottom: 4, whiteSpace: "nowrap" },
  signRule: { width: "100%", height: 1, background: PALETTE.lineStrong, margin: "0 auto 6px" },
  signRole: { fontSize: 8.5, letterSpacing: ".14em", textTransform: "uppercase", color: PALETTE.inkSoft, fontWeight: 600 },
};

/* ------------------------------------------------------------------ */
/*  SCOPED CSS (pseudo-elements, striping, watermark, fonts, print)    */
/* ------------------------------------------------------------------ */

const SCOPED_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700;800&family=Instrument+Serif:ital@0;1&family=Space+Grotesk:wght@500;600;700&family=Space+Mono:wght@400;700&display=swap');
.inv-root, .inv-root * { box-sizing: border-box; }
.inv-num { font-variant-numeric: tabular-nums; font-feature-settings: "tnum" 1; }
.inv-row:nth-child(odd) { background: #fbf7f1; }
.inv-voucher {
  --stub: 64px; --notch: 8px;
  -webkit-mask:
    radial-gradient(circle var(--notch) at var(--stub) 0, #0000 98%, #000) 0 0/100% 51% no-repeat,
    radial-gradient(circle var(--notch) at var(--stub) 100%, #0000 98%, #000) 0 100%/100% 51% no-repeat;
  mask:
    radial-gradient(circle var(--notch) at var(--stub) 0, #0000 98%, #000) 0 0/100% 51% no-repeat,
    radial-gradient(circle var(--notch) at var(--stub) 100%, #0000 98%, #000) 0 100%/100% 51% no-repeat;
}
.inv-voucher-body::before {
  content: ""; position: absolute; left: 0; top: 9px; bottom: 9px;
  border-left: 1.5px dashed rgba(208,88,72,.55);
}
.inv-watermark {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  pointer-events: none; z-index: 5;
}
.inv-watermark span {
  font-family: "Space Grotesk", sans-serif; font-weight: 700; font-size: 132px; letter-spacing: .08em;
  color: rgba(208,88,72,.10); border: 6px solid rgba(208,88,72,.15);
  padding: 18px 46px; border-radius: 18px; transform: rotate(-18deg); text-transform: uppercase;
  white-space: nowrap;
}
.inv-stamp-full { position: absolute; top: 50%; left: 55%; transform: translate(-50%, calc(-50% + 100px)) rotate(-15deg); height: 200px; opacity: 0.15; pointer-events: none; z-index: 5; }

@media print {
  @page { size: A4; margin: 0mm !important; }
  html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; min-height: auto !important; }
  body > * { display: none !important; }
  .inv-root, .inv-root * { display: revert !important; visibility: visible !important; }
  .inv-overlay, .inv-toolbar { display: none !important; }
  .inv-root { box-shadow: none !important; width: 794px !important; min-height: 1123px !important; max-width: 794px !important; page-break-after: always; transform: none !important; margin: 0 auto !important; position: static !important; overflow: visible !important; }
  .inv-root:last-child { page-break-after: auto; }
  .inv-root, .inv-root * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
@media screen and (min-width: 821px) and (max-height: 900px) {
  .inv-root { transform-origin: top center; transform: scale(0.25); margin-bottom: -420px !important; }
  .inv-root + .inv-root { margin-top: -420px !important; }
}
@media screen and (max-width: 820px) {
  .inv-root { transform-origin: top center; transform: scale(0.55); width: 100% !important; min-height: auto !important; margin-bottom: -40px !important; }
  .inv-root + .inv-root { margin-top: 2px !important; }
}
@media screen and (max-width: 500px) {
  .inv-root { transform-origin: top center; transform: scale(0.42); margin-bottom: -40px !important; }
  .inv-root + .inv-root { margin-top: 2px !important; }
}
@media screen and (max-width: 820px) {
  .inv-overlay { padding: 4px !important; justify-content: flex-start !important; }
  .inv-toolbar { width: 100% !important; flex-wrap: wrap; justify-content: center; padding: 8px 4px !important; position: sticky !important; top: 0; z-index: 10; order: 0 !important; }
  .inv-root { transform-origin: top center; transform: scale(0.55); width: 100% !important; min-height: auto !important; margin-bottom: -40px !important; order: 1 !important; }
  .inv-root + .inv-root { margin-top: 2px !important; }
}
@media screen and (min-width: 821px) and (max-height: 900px) {
  .inv-root { transform-origin: top center; transform: scale(0.25); margin-bottom: -420px !important; }
  .inv-root + .inv-root { margin-top: -420px !important; }
}
@media screen and (max-width: 500px) {
  .inv-root { transform: scale(0.42); margin-bottom: -40px !important; }
  .inv-root + .inv-root { margin-top: 2px !important; }
}
@media screen and (min-width: 821px) and (max-height: 900px) {
  .inv-root { transform-origin: top center; transform: scale(0.25); margin-bottom: -420px !important; }
  .inv-root + .inv-root { margin-top: -420px !important; }
}
@media screen and (max-width: 500px) {
  .inv-root { transform: scale(0.42); margin-bottom: -40px !important; }
  .inv-root + .inv-root { margin-top: 2px !important; }
}
@media screen and (min-width: 821px) and (max-height: 900px) {
  .inv-root { transform-origin: top center; transform: scale(0.25); margin-bottom: -420px !important; }
  .inv-root + .inv-root { margin-top: -420px !important; }
}
@media screen and (max-width: 500px) {
  .inv-root { transform: scale(0.42); margin-bottom: -40px !important; }
  .inv-root + .inv-root { margin-top: 2px !important; }
}
`;

/* ------------------------------------------------------------------ */
/*  COMPONENT                                                          */
/* ------------------------------------------------------------------ */

export default function InvoiceModal({ booking, isOpen, onClose }: InvoiceModalProps) {
  const [config, setConfig] = useState<InvoiceConfig>(DEFAULT_CONFIG);
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    let alive = true;
    fetch("/api/invoice-config")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data: Partial<InvoiceConfig>) => {
        if (alive && data) setConfig((prev) => ({ ...prev, ...data }));
      })
      .catch(() => {
        /* keep DEFAULT_CONFIG on failure */
      });
    return () => {
      alive = false;
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen || !booking) return null;

  /* ----- derive view model ----- */
  const approvalStatus = booking.approvalStatus || "pending";
  const paymentStatus = booking.paymentStatus || "unpaid";
  const watermark = paymentStatus === "paid" ? "LUNAS" : paymentStatus === "dp_paid" ? "DP TERBAYAR" : approvalStatus === "rejected" ? "DITOLAK" : approvalStatus === "pending" ? "PENDING" : "";
  const docTitle = `Invoice ${invoiceNumber(booking)}${watermark ? " — " + watermark : ""}`;

  const bookingMeta = (): string[] =>
    [[booking.eventType, booking.weddingType].filter(Boolean).join(" · "), booking.eventDate ? "Tanggal — " + formatDateShort(booking.eventDate) : "", booking.venueLocation ? "Tempat — " + booking.venueLocation : ""].filter(
      Boolean,
    ) as string[];

  const dayMeta = (d: BookingDay & Record<string, any>): string[] =>
    [
      [booking.eventType, booking.weddingType].filter(Boolean).join(" · "),
      d.eventDate ? "Tanggal — " + formatDateShort(d.eventDate) : booking.eventDate ? "Tanggal — " + formatDateShort(booking.eventDate) : "",
      d.venueLocation ? "Tempat — " + d.venueLocation : booking.venueLocation ? "Tempat — " + booking.venueLocation : "",
    ].filter(Boolean) as string[];

  const days = booking.days && booking.days.length ? booking.days : null;

  const rows: Row[] = [];
  if (days) {
    days.forEach((d, i) => {
      rows.push({
        name: days.length > 1 ? `Hari ${i + 1} — ${d.packageName}` : d.packageName,
        price: d.packagePrice || 0,
        qty: 1,
        meta: dayMeta(d as BookingDay & Record<string, any>),
      });
      Object.entries(toAddons((d as any).addonDetails).reduce((acc: Record<string, { price: number; qty: number }>, a) => {
        const k = a.name;
        if (!acc[k]) acc[k] = { price: a.price || 0, qty: 0 };
        acc[k].qty += a.qty || 1;
        return acc;
      }, {})).forEach(([name, { price, qty }]) => rows.push({ name: `Add on: ${name}`, price, qty, meta: [] }));
    });
  } else {
    rows.push({
      name: booking.packageName,
      price: booking.packagePrice || 0,
      qty: 1,
      meta: bookingMeta(),
    });
    Object.entries(toAddons((booking as any).addonDetails).reduce((acc: Record<string, { price: number; qty: number }>, a) => {
      const k = a.name;
      if (!acc[k]) acc[k] = { price: a.price || 0, qty: 0 };
      acc[k].qty += a.qty || 1;
      return acc;
    }, {})).forEach(([name, { price, qty }]) => rows.push({ name: `Add on: ${name}`, price, qty, meta: [] }));
  }

  const lineSum = rows.reduce((s, r) => s + r.qty * r.price, 0);
  const discount = booking.discountAmount || 0;
  const total = typeof booking.totalPrice === "number" ? booking.totalPrice : lineSum - discount;
  const subtotal = total + discount;
  const amountPaid = booking.amountPaid || 0;
  const remaining = typeof booking.remainingPayment === "number" ? booking.remainingPayment : Math.max(total - amountPaid, 0);
  const dpPct = total > 0 ? Math.round((amountPaid / total) * 100) : 0;
  const showDP = remaining > 0 && amountPaid > 0;
  const showVoucher = !!booking.couponCode;

  // Multi-page: max ~14 rows per page before overflow
  const ROWS_PER_PAGE = 14;
  const pageRows: Row[][] = [];
  for (let i = 0; i < rows.length; i += ROWS_PER_PAGE) {
    pageRows.push(rows.slice(i, i + ROWS_PER_PAGE));
  }
  const isMultiPage = pageRows.length > 1;

  function renderPage(pageIndex: number, pageRowsSlice: Row[], isLastPage: boolean) {
    return (
      <div className="inv-root" style={{ ...S.root, marginTop: pageIndex > 0 ? 24 : 0 }} key={pageIndex}>
        {approvalStatus === "pending" && (
          <div
            style={{
              position: "absolute",
              top: "40%",
              left: "50%",
              transform: "translate(-50%, -50%) rotate(-30deg)",
              fontSize: 48,
              fontWeight: 900,
              color: "rgba(36,31,28,0.06)",
              letterSpacing: 8,
              pointerEvents: "none",
              whiteSpace: "nowrap",
            }}
          >
            PENDING
          </div>
        )}
        {approvalStatus === "rejected" && (
          <div
            style={{
              position: "absolute",
              top: "40%",
              left: "50%",
              transform: "translate(-50%, -50%) rotate(-30deg)",
              fontSize: 48,
              fontWeight: 900,
              color: "rgba(180,40,40,0.12)",
              letterSpacing: 8,
              pointerEvents: "none",
              whiteSpace: "nowrap",
            }}
          >
            DITOLAK
          </div>
        )}
        {paymentStatus === "dp_paid" && (
          <div
            style={{
              position: "absolute",
              top: "40%",
              left: "50%",
              transform: "translate(-50%, -50%) rotate(-30deg)",
              fontSize: 48,
              fontWeight: 900,
              color: "rgba(36,31,28,0.06)",
              letterSpacing: 8,
              pointerEvents: "none",
              whiteSpace: "nowrap",
            }}
          >
            DP TERBAYAR
          </div>
        )}

        {/* band */}
        <div style={{ ...S.band, paddingBottom: isLastPage ? 24 : 18 }}>
          <div style={S.bandTop}>
            <div>
              <img style={S.logo} src={LOGO_URL} alt="Krealogs" />
              <div style={S.tag}>Wedding &amp; Event Content Creator</div>
            </div>
            <div style={S.word}>INVOICE</div>
          </div>
          <div style={S.bandMeta}>
            <div style={S.bm}>
              <div style={S.bmK}>Invoice No.</div>
              <div className="inv-num" style={S.bmV}>
                {invoiceNumber(booking)}
              </div>
            </div>
            <div style={S.bm}>
              <div style={S.bmK}>Tanggal</div>
              <div style={S.bmV}>{formatDateID(booking.createdAt)}</div>
            </div>
            {isMultiPage && (
              <div style={S.bm}>
                <div style={S.bmK}>Halaman</div>
                <div style={S.bmV}>
                  {pageIndex + 1} / {pageRows.length}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* body */}
        <div style={{ ...S.body, paddingTop: isLastPage ? 24 : 18 }}>
          {pageIndex === 0 && (
            <div style={S.parties}>
              <div style={S.cardDark}>
                <div style={S.plabel}>Ditagihkan Kepada</div>
                <div style={S.pname}>{booking.customerName}</div>
                {booking.customerPhone && <div style={S.pline}>{booking.customerPhone}</div>}
                {booking.customerCity && <div style={S.pline}>{booking.customerCity}</div>}
              </div>
              <div style={S.card}>
                <div style={S.plabel}>Dari</div>
                <div style={S.pname}>Krealogs</div>
                <div style={S.pline}>Banjarmasin, Indonesia</div>
                {config.contactPhone && <div style={S.pline}>{config.contactPhone}</div>}
                {config.contactEmail && <div style={S.pline}>{config.contactEmail}</div>}
              </div>
            </div>
          )}

          {/* table */}
          <div>
            <div style={S.thead}>
              <div style={S.th}>Deskripsi</div>
              <div style={{ ...S.th, ...S.thC }}>Qty</div>
              <div style={{ ...S.th, ...S.thR }}>Harga</div>
              <div style={{ ...S.th, ...S.thR }}>Jumlah</div>
            </div>
            {pageRowsSlice.map((r, i) => (
              <div className="inv-row" style={S.row} key={i}>
                <div>
                  <div style={S.iname}>{r.name}</div>
                  {r.meta.length > 0 && (
                    <div style={S.imeta}>
                      {r.meta.map((m, j) => (
                        <div key={j}>{m}</div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="inv-num" style={{ ...S.cell, ...S.cellC }}>
                  {r.qty}
                </div>
                <div className="inv-num" style={{ ...S.cell, ...S.cellR }}>
                  {rp(r.price)}
                </div>
                <div className="inv-num" style={{ ...S.cell, ...S.cellR, ...S.cellB }}>
                  {rp(r.qty * r.price)}
                </div>
              </div>
            ))}
          </div>

          {isLastPage && (
            <>
              {/* totals */}
              <div style={S.totals}>
                {showVoucher ? (
                  <div className="inv-voucher" style={S.voucher}>
                    <div style={S.voucherStub}>
                      {discount > 0 && subtotal > 0 ? <span style={S.voucherPct}>{Math.round((discount / subtotal) * 100)}%</span> : <span style={{ ...S.voucherPct, fontSize: 13 }}>PROMO</span>}
                      <span style={S.voucherOff}>OFF</span>
                    </div>
                    <div className="inv-voucher-body" style={S.voucherBody}>
                      <span style={S.voucherTag}>Kode Voucher</span>
                      <span style={S.voucherCode}>{booking.couponCode}</span>
                      <span style={S.voucherNote}>Diskon diterapkan</span>
                    </div>
                  </div>
                ) : (
                  <div />
                )}
                <div style={S.totalsInner}>
                  {paymentStatus === "paid" && <img src="/Stempel Lunas.png" alt="Lunas" style={S.stampLunas} />}
                  <div style={S.trow}>
                    <span>Subtotal</span>
                    <span className="inv-num" style={S.trowV}>
                      {rp(subtotal)}
                    </span>
                  </div>
                  {discount > 0 && (
                    <div style={S.trow}>
                      <span>Diskon{booking.couponCode ? ` · ${booking.couponCode}` : ""}</span>
                      <span className="inv-num" style={S.trowDisc}>
                        &minus;{rp(discount)}
                      </span>
                    </div>
                  )}
                  <div style={S.tbox}>
                    <span style={S.tboxK}>Total</span>
                    <span className="inv-num" style={S.tboxV}>
                      {rp(total)}
                    </span>
                  </div>
                  {showDP && (
                    <div style={S.dp}>
                      <div style={S.dpDue}>
                        <span style={S.dpLbl}>DP Terbayar ({dpPct}%)</span>
                        <span className="inv-num" style={S.dpAmt}>
                          {rp(amountPaid)}
                        </span>
                      </div>
                      <div style={S.dpRest}>
                        <span>Sisa Pelunasan</span>
                        <span className="inv-num" style={S.dpRestV}>
                          {rp(remaining)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* footer */}
              <div style={S.foot}>
                <div style={S.pay}>
                  <div style={S.payLabel}>Metode Pembayaran</div>
                  <div style={S.payGrid}>
                    <span style={S.payK}>Bank</span>
                    <span style={S.payVPlain}>{config.bankName}</span>
                    <span style={S.payK}>No. Rekening</span>
                    <span className="inv-num" style={S.payVMono}>
                      {config.bankAccount}
                    </span>
                    <span style={S.payK}>Atas Nama</span>
                    <span style={S.payVPlain}>{config.bankAccountName}</span>
                  </div>
                </div>
                <div style={S.sign}>
                  <div style={S.signInner}>
                    <img src="/Stempel Krealogs.png" alt="Stempel" style={S.stampImg} />
                    <div style={S.signContent}>
                      <img src="/Tandatangan.png" alt="Tanda tangan" style={S.signImg} />
                      <div style={S.signName}>{config.signatureName}</div>
                      <div style={S.signRule} />
                      <div style={S.signRole}>{config.signatureTitle}</div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  /* ----- print without new tab ----- */
  const handlePrint = () => {
    const node = invoiceRef.current;
    if (!node) return;
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    iframe.style.opacity = "0";
    iframe.style.pointerEvents = "none";
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (!doc) { document.body.removeChild(iframe); return; }
    doc.open();
    doc.write(
      `<!DOCTYPE html><html lang="id"><head><meta charset="utf-8" />` +
        `<title>${docTitle}</title><style>${SCOPED_CSS}\n` +
        `body{margin:0;padding:0;background:#fff;display:flex;flex-direction:column;align-items:center;}` +
        `*{visibility:visible}` +
        `</style>` +
        `</head><body>${node.outerHTML}</body></html>`,
    );
    doc.close();
    const trigger = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => { if (document.body.contains(iframe)) document.body.removeChild(iframe); }, 500);
    };
    const fonts = (doc as any).fonts;
    if (fonts && fonts.ready) {
      fonts.ready.then(() => setTimeout(trigger, 250)).catch(() => setTimeout(trigger, 600));
    } else {
      iframe.onload = () => setTimeout(trigger, 400);
      setTimeout(trigger, 800);
    }
  };

  return (
    <div style={S.overlay} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <style>{SCOPED_CSS}</style>

      <div style={S.toolbar}>
        <button type="button" style={{ ...S.btn, ...S.btnPrint }} onClick={handlePrint}>
          Unduh PDF
        </button>
        <button type="button" style={{ ...S.btn, ...S.btnClose }} onClick={onClose}>
          Tutup
        </button>
      </div>

      {/* ===== INVOICE (Multi-page) ===== */}
      <div ref={invoiceRef}>{pageRows.map((pageSlice, i) => renderPage(i, pageSlice, i === pageRows.length - 1))}</div>
    </div>
  );
}
