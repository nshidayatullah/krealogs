import React from "react";
import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import type { Booking, BookingDay } from "../types";

const BASE_URL = typeof window !== "undefined" ? window.location.origin : "";

const PALETTE = {
  terra: "#CC5946",
  ink: "#241f1c",
  inkSoft: "#6c625b",
  line: "#e0d8ce",
  cream: "#f7f2ea",
  paper: "#fffdfa",
  white: "#ffffff",
};

const rp = (n: number) => "Rp" + Math.round(n || 0).toLocaleString("id-ID");

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

function formatDateShort(input: string | number | Date | undefined): string {
  if (!input) return "";
  const d = new Date(input);
  if (isNaN(d.getTime())) return String(input);
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "long", year: "numeric" }).format(d);
}

function formatDateID(input: string | number | Date): string {
  const d = new Date(input);
  if (isNaN(d.getTime())) return String(input ?? "");
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
  }).format(d);
}

function invoiceNumber(b: Booking): string {
  const d = new Date(b.createdAt);
  const month = isNaN(d.getTime()) ? "V" : ROMAN[d.getMonth()];
  const year = isNaN(d.getTime()) ? "2026" : String(d.getFullYear());
  const seq = String(b.id).replace(/\D/g, "").slice(-3).padStart(3, "0");
  return `${seq}/INV/CC/${month}/${year}`;
}

type Addon = { name: string; price?: number; qty?: number };

function toAddons(raw: unknown): Addon[] {
  if (!raw) return [];
  let parsed: Addon[] = [];
  if (Array.isArray(raw)) {
    parsed = raw.map((x: any) => {
      if (typeof x === "string") return { name: x, price: 0, qty: 1 };
      return { name: x?.name ?? x?.detail ?? x?.title ?? "", price: x?.price ?? x?.amount ?? 0, qty: x?.qty ?? x?.quantity ?? 1 };
    }).filter((a: Addon) => a.name);
  } else if (typeof raw === "string") {
    parsed = raw.split(/\r?\n|,|;/).map((s) => s.trim()).filter(Boolean).map((name) => ({ name, price: 0, qty: 1 }));
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

interface Row { name: string; price: number; qty: number; meta: string[]; }

interface InvoicePDFProps {
  booking: Booking;
  config: {
    bankName: string;
    bankAccount: string;
    bankAccountName: string;
    contactPhone: string;
    contactEmail: string;
    signatureName: string;
    signatureTitle: string;
  };
}

const styles = StyleSheet.create({
  page: {
    padding: 0,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: PALETTE.ink,
    backgroundColor: PALETTE.paper,
  },
  /* ---- Band ---- */
  band: {
    backgroundColor: PALETTE.terra,
    paddingTop: 24,
    paddingBottom: 16,
    paddingHorizontal: 40,
  },
  bandTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  bandLeft: { flex: 1 },
  logo: { width: 115, height: 22, objectFit: "contain" },
  tag: {
    fontSize: 7,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.78)",
    marginTop: 6,
    fontFamily: "Helvetica-Bold",
  },
  word: {
    fontFamily: "Helvetica-Bold",
    fontSize: 24,
    color: PALETTE.white,
    letterSpacing: 1,
    textAlign: "right",
  },
  bandMeta: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 28,
    marginTop: 14,
  },
  bm: { alignItems: "flex-end" },
  bmK: { fontSize: 6, letterSpacing: 1.5, textTransform: "uppercase", color: "rgba(255,255,255,0.68)", fontFamily: "Helvetica-Bold", marginBottom: 1 },
  bmV: { fontSize: 9, color: PALETTE.white, fontFamily: "Helvetica-Bold" },

  /* ---- Body ---- */
  body: { paddingHorizontal: 40, paddingTop: 16, flex: 1 },

  /* ---- Parties ---- */
  parties: { flexDirection: "row", gap: 14, marginBottom: 14 },
  card: { flex: 1, border: `1pt solid ${PALETTE.line}`, borderRadius: 6, padding: 10 },
  cardDark: { flex: 1, backgroundColor: PALETTE.cream, borderRadius: 6, padding: 10 },
  plabel: { fontSize: 7, letterSpacing: 1.5, textTransform: "uppercase", color: PALETTE.terra, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  pname: { fontFamily: "Helvetica-Bold", fontSize: 12, marginBottom: 3, color: PALETTE.ink },
  pline: { fontSize: 8, color: PALETTE.inkSoft },

  /* ---- Table ---- */
  thead: {
    flexDirection: "row",
    backgroundColor: PALETTE.ink,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 3,
  },
  thName: { flex: 1, fontSize: 7, letterSpacing: 1, textTransform: "uppercase", fontFamily: "Helvetica-Bold", color: "rgba(255,255,255,0.78)" },
  thQty: { width: 38, fontSize: 7, letterSpacing: 1, textTransform: "uppercase", fontFamily: "Helvetica-Bold", color: "rgba(255,255,255,0.78)", textAlign: "center" },
  thPrice: { width: 72, fontSize: 7, letterSpacing: 1, textTransform: "uppercase", fontFamily: "Helvetica-Bold", color: "rgba(255,255,255,0.78)", textAlign: "right" },
  thTotal: { width: 72, fontSize: 7, letterSpacing: 1, textTransform: "uppercase", fontFamily: "Helvetica-Bold", color: "rgba(255,255,255,0.78)", textAlign: "right" },
  row: {
    flexDirection: "row",
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderBottom: `0.5pt solid ${PALETTE.line}`,
    alignItems: "flex-start",
  },
  rowOdd: { backgroundColor: "#fbf7f1" },
  colName: { flex: 1 },
  iname: { fontFamily: "Helvetica-Bold", fontSize: 9, color: PALETTE.ink, marginBottom: 2 },
  imeta: { fontSize: 7.5, color: PALETTE.inkSoft, lineHeight: 1.3 },
  colQty: { width: 38, textAlign: "center", fontSize: 8.5 },
  colPrice: { width: 72, textAlign: "right", fontSize: 8.5 },
  colTotal: { width: 72, textAlign: "right", fontSize: 8.5, fontFamily: "Helvetica-Bold" },

  /* ---- Totals ---- */
  totalsRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 14 },
  totalsBox: { width: 200 },
  trow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3, paddingHorizontal: 2, fontSize: 9, color: PALETTE.inkSoft },
  trowV: { color: PALETTE.ink, fontFamily: "Helvetica-Bold" },
  trowDisc: { color: PALETTE.terra, fontFamily: "Helvetica-Bold" },
  tbox: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginTop: 4, backgroundColor: PALETTE.terra, paddingVertical: 5, paddingHorizontal: 12, borderRadius: 3,
  },
  tboxK: { fontSize: 7, letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "Helvetica-Bold", color: PALETTE.white },
  tboxV: { fontFamily: "Helvetica-Bold", fontSize: 12, color: PALETTE.white },

  /* ---- Stamp Lunas ---- */
  stampLunasWrap: { position: "absolute", right: 30, top: 390, transform: "rotate(-12deg)", opacity: 0.85 },
  stampLunasImg: { width: 120, height: 100, objectFit: "contain" },

  /* ---- Voucher ---- */
  voucherRow: { flexDirection: "row", marginTop: 14, marginBottom: 12 },
  voucher: {
    flexDirection: "row", borderRadius: 8, overflow: "hidden",
    border: `1pt solid ${PALETTE.terra}`, alignSelf: "flex-start",
  },
  voucherStub: {
    width: 48, backgroundColor: PALETTE.terra,
    alignItems: "center", justifyContent: "center", paddingVertical: 10, paddingHorizontal: 6,
  },
  voucherPct: { fontFamily: "Helvetica-Bold", fontSize: 16, color: PALETTE.white },
  voucherOff: { fontSize: 6, letterSpacing: 1.5, fontFamily: "Helvetica-Bold", color: "rgba(255,255,255,0.8)" },
  voucherBody: { paddingVertical: 8, paddingHorizontal: 14, justifyContent: "center" },
  voucherTag: { fontSize: 6, letterSpacing: 1.2, textTransform: "uppercase", color: PALETTE.terra, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  voucherCode: { fontFamily: "Courier-Bold", fontSize: 12, letterSpacing: 0.5, color: PALETTE.terra },
  voucherNote: { fontSize: 8, color: PALETTE.inkSoft, marginTop: 6 },

  /* ---- DP ---- */
  dpSection: { marginTop: 8 },
  dpDue: {
    flexDirection: "row", justifyContent: "space-between",
    backgroundColor: "rgba(208,88,72,0.08)", borderRadius: 3, paddingVertical: 5, paddingHorizontal: 10,
  },
  dpLbl: { fontSize: 7, letterSpacing: 1, textTransform: "uppercase", fontFamily: "Helvetica-Bold", color: PALETTE.terra },
  dpAmt: { fontFamily: "Helvetica-Bold", fontSize: 10, color: PALETTE.terra },
  dpRest: { flexDirection: "row", justifyContent: "space-between", paddingTop: 4, paddingHorizontal: 10, fontSize: 8.5, color: PALETTE.inkSoft },
  dpRestV: { fontFamily: "Helvetica-Bold", color: PALETTE.ink },

  /* ---- Footer ---- */
  foot: { flexDirection: "row", marginTop: 24, paddingBottom: 0, gap: 24 },
  pay: { flex: 1, borderLeft: `3pt solid ${PALETTE.terra}`, paddingLeft: 12 },
  payLabel: { fontSize: 6, letterSpacing: 1.5, textTransform: "uppercase", color: PALETTE.terra, fontFamily: "Helvetica-Bold", marginBottom: 6 },
  payGrid: { gap: 2 },
  payRow: { flexDirection: "row", gap: 8, fontSize: 8.5, marginBottom: 1 },
  payK: { width: 56, color: PALETTE.inkSoft },
  payV: { fontFamily: "Helvetica-Bold", flex: 1 },

  /* ---- Signature ---- */
  sign: { width: 170, alignItems: "center" },
  signImg: { width: 100, height: 80, objectFit: "contain", marginBottom: -40 },
  signName: { fontSize: 10, color: PALETTE.ink, textAlign: "center", marginTop: 40 },
  signRule: { width: "100%", borderBottom: `0.5pt solid ${PALETTE.ink}`, marginBottom: 4 },
  signRole: { fontSize: 7, letterSpacing: 1, textTransform: "uppercase", color: PALETTE.inkSoft, textAlign: "center", fontFamily: "Helvetica-Bold" },
  stampImgWrap: { position: "absolute", opacity: 0.22 },
  stampImg: { width: 90, height: 80, objectFit: "contain" },

  /* ---- Watermark / Stamp text ---- */
  watermarkRow: { flexDirection: "row", justifyContent: "center", marginBottom: 8 },
  watermark: {
    fontSize: 14, fontFamily: "Helvetica-Bold", letterSpacing: 3,
    color: "rgba(36,31,28,0.06)", textTransform: "uppercase",
  },
  watermarkRejected: {
    fontSize: 14, fontFamily: "Helvetica-Bold", letterSpacing: 3,
    color: "rgba(180,40,40,0.12)", textTransform: "uppercase",
  },

  /* ---- Page number ---- */
  pageNum: { fontSize: 7, color: PALETTE.inkSoft, textAlign: "center", marginTop: 8 },
});

export default function InvoicePDFDocument({ booking, config }: InvoicePDFProps) {
  const bookingMeta = (): string[] =>
    [[booking.eventType, booking.weddingType].filter(Boolean).join(" · "),
     booking.eventDate ? "Tanggal — " + formatDateShort(booking.eventDate) : "",
     booking.venueLocation ? "Tempat — " + booking.venueLocation : ""].filter(Boolean) as string[];

  const dayMeta = (d: BookingDay & Record<string, any>): string[] =>
    [[booking.eventType, booking.weddingType].filter(Boolean).join(" · "),
      d.eventDate ? "Tanggal — " + formatDateShort(d.eventDate)
        : booking.eventDate ? "Tanggal — " + formatDateShort(booking.eventDate) : "",
      d.venueLocation ? "Tempat — " + d.venueLocation
        : booking.venueLocation ? "Tempat — " + booking.venueLocation : "",
    ].filter(Boolean) as string[];

  const days = booking.days && booking.days.length ? booking.days : null;

  const rows: Row[] = [];
  if (days) {
    days.forEach((d, i) => {
      rows.push({
        name: days.length > 1 ? `Hari ${i + 1} — ${d.packageName}` : d.packageName,
        price: d.packagePrice || 0, qty: 1,
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
    rows.push({ name: booking.packageName, price: booking.packagePrice || 0, qty: 1, meta: bookingMeta() });
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
  const paymentStatus = booking.paymentStatus || "unpaid";
  const approvalStatus = booking.approvalStatus || "pending";

  const ROWS_PER_PAGE = 14;
  const pageRows: Row[][] = [];
  for (let i = 0; i < rows.length; i += ROWS_PER_PAGE) {
    pageRows.push(rows.slice(i, i + ROWS_PER_PAGE));
  }
  const isMultiPage = pageRows.length > 1;

  const invNum = invoiceNumber(booking);

  return (
    <Document title={`Invoice ${invNum}`}>
      {pageRows.map((pageSlice, pageIdx) => {
        const isFirstPage = pageIdx === 0;
        const isLastPage = pageIdx === pageRows.length - 1;
        return (
          <Page key={pageIdx} size="A4" style={styles.page}>
            {/* HEADER BAND */}
            <View style={[styles.band, { paddingBottom: isLastPage ? 20 : 14 }]}>
              <View style={styles.bandTop}>
                <View style={styles.bandLeft}>
                  <Image style={styles.logo} src={`${BASE_URL}/krealogs-logo-white.png`} />
                  <Text style={styles.tag}>Wedding & Event Content Creator</Text>
                </View>
                <Text style={styles.word}>INVOICE</Text>
              </View>
              <View style={styles.bandMeta}>
                <View style={styles.bm}>
                  <Text style={styles.bmK}>Invoice No.</Text>
                  <Text style={styles.bmV}>{invNum}</Text>
                </View>
                <View style={styles.bm}>
                  <Text style={styles.bmK}>Tanggal</Text>
                  <Text style={styles.bmV}>{formatDateID(booking.createdAt)}</Text>
                </View>
                {isMultiPage && (
                  <View style={styles.bm}>
                    <Text style={styles.bmK}>Halaman</Text>
                    <Text style={styles.bmV}>{pageIdx + 1} / {pageRows.length}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* BODY */}
            <View style={[styles.body, { paddingTop: isLastPage ? 20 : 14 }]}>
              {/* Watermark */}
              {approvalStatus === "pending" && isFirstPage && (
                <View style={styles.watermarkRow}><Text style={styles.watermark}>PENDING</Text></View>
              )}
              {approvalStatus === "rejected" && isFirstPage && (
                <View style={styles.watermarkRow}><Text style={styles.watermarkRejected}>DITOLAK</Text></View>
              )}
              {paymentStatus === "dp_paid" && isFirstPage && (
                <View style={styles.watermarkRow}><Text style={styles.watermark}>DP TERBAYAR</Text></View>
              )}

              {/* Party Cards (first page only) */}
              {isFirstPage && (
                <View style={styles.parties}>
                  <View style={styles.cardDark}>
                    <Text style={styles.plabel}>Ditagihkan Kepada</Text>
                    <Text style={styles.pname}>{booking.customerName}</Text>
                    {booking.customerPhone ? <Text style={styles.pline}>{booking.customerPhone}</Text> : null}
                    {booking.customerCity ? <Text style={styles.pline}>{booking.customerCity}</Text> : null}
                  </View>
                  <View style={styles.card}>
                    <Text style={styles.plabel}>Dari</Text>
                    <Text style={styles.pname}>Krealogs</Text>
                    <Text style={styles.pline}>Banjarmasin, Indonesia</Text>
                    {config.contactPhone ? <Text style={styles.pline}>{config.contactPhone}</Text> : null}
                    {config.contactEmail ? <Text style={styles.pline}>{config.contactEmail}</Text> : null}
                  </View>
                </View>
              )}

              {/* Table */}
              <View style={styles.thead}>
                <Text style={styles.thName}>Deskripsi</Text>
                <Text style={styles.thQty}>Qty</Text>
                <Text style={styles.thPrice}>Harga</Text>
                <Text style={styles.thTotal}>Jumlah</Text>
              </View>
              {pageSlice.map((r, i) => (
                <View style={[styles.row, i % 2 === 1 ? styles.rowOdd : {}]} key={i}>
                  <View style={styles.colName}>
                    <Text style={styles.iname}>{r.name}</Text>
                    {r.meta.length > 0 && (
                      <View style={styles.imeta}>
                        {r.meta.map((m, j) => <Text key={j}>{m}</Text>)}
                      </View>
                    )}
                  </View>
                  <Text style={styles.colQty}>{r.qty}</Text>
                  <Text style={styles.colPrice}>{rp(r.price)}</Text>
                  <Text style={styles.colTotal}>{rp(r.qty * r.price)}</Text>
                </View>
              ))}

              {/* Totals, Voucher, DP, Footer (last page only) */}
              {isLastPage && (
                <>
                  {/* Voucher + Totals row */}
                  <View style={{ flexDirection: "row", marginTop: 14, justifyContent: "space-between" }}>
                    {showVoucher ? (
                      <View style={styles.voucher}>
                        <View style={styles.voucherStub}>
                          {discount > 0 && subtotal > 0 ? (
                            <Text style={styles.voucherPct}>{Math.round((discount / subtotal) * 100)}%</Text>
                          ) : (
                            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 10, color: PALETTE.white }}>PROMO</Text>
                          )}
                          <Text style={styles.voucherOff}>OFF</Text>
                        </View>
                        <View style={styles.voucherBody}>
                          <Text style={styles.voucherTag}>Kode Voucher</Text>
                          <Text style={styles.voucherCode}>{booking.couponCode}</Text>
                          <Text style={styles.voucherNote}>Diskon diterapkan</Text>
                        </View>
                      </View>
                    ) : <View />}

                    <View style={styles.totalsBox}>
                      {/* LUNAS stamp */}
                      {paymentStatus === "paid" && (
                        <View style={styles.stampLunasWrap}>
                          <Image style={styles.stampLunasImg} src={`${BASE_URL}/Stempel Lunas.png`} />
                        </View>
                      )}
                      <View style={styles.trow}>
                        <Text>Subtotal</Text>
                        <Text style={styles.trowV}>{rp(subtotal)}</Text>
                      </View>
                      {discount > 0 && (
                        <View style={styles.trow}>
                          <Text>Diskon{booking.couponCode ? ` · ${booking.couponCode}` : ""}</Text>
                          <Text style={styles.trowDisc}>−{rp(discount)}</Text>
                        </View>
                      )}
                      <View style={styles.tbox}>
                        <Text style={styles.tboxK}>Total</Text>
                        <Text style={styles.tboxV}>{rp(total)}</Text>
                      </View>
                      {showDP && (
                        <View style={styles.dpSection}>
                          <View style={styles.dpDue}>
                            <Text style={styles.dpLbl}>DP Terbayar ({dpPct}%)</Text>
                            <Text style={styles.dpAmt}>{rp(amountPaid)}</Text>
                          </View>
                          <View style={styles.dpRest}>
                            <Text>Sisa Pelunasan</Text>
                            <Text style={styles.dpRestV}>{rp(remaining)}</Text>
                          </View>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Footer */}
                  <View style={styles.foot}>
                    <View style={styles.pay}>
                      <Text style={styles.payLabel}>Metode Pembayaran</Text>
                      <View style={styles.payGrid}>
                        <View style={styles.payRow}>
                          <Text style={styles.payK}>Bank</Text>
                          <Text style={styles.payV}>{config.bankName}</Text>
                        </View>
                        <View style={styles.payRow}>
                          <Text style={styles.payK}>No. Rekening</Text>
                          <Text style={[styles.payV, { fontFamily: "Courier-Bold" }]}>{config.bankAccount}</Text>
                        </View>
                        <View style={styles.payRow}>
                          <Text style={styles.payK}>Atas Nama</Text>
                          <Text style={styles.payV}>{config.bankAccountName}</Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.sign}>
                      <Image style={styles.signImg} src={`${BASE_URL}/Tandatangan.png`} />
                      <Text style={styles.signName}>{config.signatureName}</Text>
                      <View style={styles.signRule} />
                      <Text style={styles.signRole}>{config.signatureTitle}</Text>
                    </View>
                  </View>
                </>
              )}
            </View>
          </Page>
        );
      })}
    </Document>
  );
}
