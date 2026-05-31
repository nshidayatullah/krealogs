import React, { useState, useEffect } from "react";
import { Package, Addon, Booking } from "../types";
import { User, Phone, MapPin, Calendar, FileText, Search, Check, AlertCircle, Camera, Sparkles, DollarSign, CheckCircle, HelpCircle, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { formatEventDate } from "../utils/dateFormatter";
const brandLogo = "/src/assets/images/krealogs_logo_1780149664590.png";

interface CustomerPageProps {
  onOpenInvoice: (booking: Booking) => void;
}

export default function CustomerPage({ onOpenInvoice }: CustomerPageProps) {
  // DB States
  const [packages, setPackages] = useState<Package[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [dbLoading, setDbLoading] = useState(true);

  // Form States
  const [namaLengkap, setNamaLengkap] = useState("");
  const [noWhatsapp, setNoWhatsapp] = useState("");
  const [domisili, setDomisili] = useState("");
  const [keperluan, setKeperluan] = useState<"event" | "wedding">("wedding");
  const [weddingType, setWeddingType] = useState<string>("Akad & Resepsi (Sameday)");
  const [lokasiVenue, setLokasiVenue] = useState("");

  // Multi-day Booking States
  const [bookingDays, setBookingDays] = useState<
    {
      id: string;
      date: string;
      packageId: string;
      addons: { id: string; quantity: number }[];
    }[]
  >([{ id: "day-1", date: "", packageId: "", addons: [] }]);
  const [pkgSlideIndexes, setPkgSlideIndexes] = useState<Record<string, number>>({});
  const [pkgCategoryTabs, setPkgCategoryTabs] = useState<Record<string, "signature" | "regular">>({});

  const [paymentMethod, setPaymentMethod] = useState<"full" | "dp_custom">("full");

  // Dynamic DP Settings
  const [dpPercentage, setDpPercentage] = useState<number>(50);
  const [customDpAmount, setCustomDpAmount] = useState<string>("");
  const [isCustomDpActive, setIsCustomDpActive] = useState<boolean>(false);

  // Status & Feedback States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<Booking | null>(null);
  const [submitError, setSubmitError] = useState("");

  // Search States
  const [searchWhatsapp, setSearchWhatsapp] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Booking[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Refresh data on mount
  useEffect(() => {
    fetch("/api/db")
      .then((res) => res.json())
      .then((data) => {
        setPackages(data.packages || []);
        setAddons(data.addons || []);
        const matchPkgs = (data.packages || []).filter((p: Package) => p.type === keperluan || p.type === "both");
        if (matchPkgs.length > 0) {
          setBookingDays([{ id: "day-1", date: "", packageId: matchPkgs[0].id, addons: [] }]);
        }
        setDbLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching db in customer:", err);
        setDbLoading(false);
      });
  }, []);

  // Update selected package when keperluan changes to keep it valid
  useEffect(() => {
    const matchPkgs = packages.filter((p) => p.type === keperluan || p.type === "both");
    if (matchPkgs.length > 0) {
      setBookingDays((prev) =>
        prev.map((bd) => {
          const exists = matchPkgs.some((p) => p.id === bd.packageId);
          if (!exists) {
            return { ...bd, packageId: matchPkgs[0].id };
          }
          return bd;
        }),
      );
    }
  }, [keperluan, packages]);

  // Derived Multi-day Calculations
  const firstDayPackageId = bookingDays[0]?.packageId || "";
  const firstDayPkg = packages.find((p) => p.id === firstDayPackageId);
  const packagePrice = firstDayPkg ? firstDayPkg.price : 0;
  const selectedPackageId = firstDayPackageId;
  const selectedPackage = firstDayPkg;

  // Selected addons: list of all serialized representation (addonId:quantity) across all booking days
  const selectedAddons = bookingDays.reduce<string[]>((acc, d) => {
    d.addons.forEach((a) => {
      const serialized = `${a.id}:${a.quantity}`;
      if (!acc.includes(serialized)) acc.push(serialized);
    });
    return acc;
  }, []);

  const chosenAddonsDetail = bookingDays.reduce<{ id: string; name: string; price: number }[]>((acc, d) => {
    d.addons.forEach((a) => {
      const addonMeta = addons.find((add) => add.id === a.id);
      if (addonMeta) {
        const existing = acc.find(item => item.id === a.id);
        if (existing) {
          existing.price += addonMeta.price * a.quantity;
        } else {
          acc.push({
            id: a.id,
            name: a.id,
            price: addonMeta.price * a.quantity
          });
        }
      }
    });
    return acc;
  }, []).map(item => {
    const addonMeta = addons.find(add => add.id === item.id);
    const originalPrice = addonMeta ? addonMeta.price : 0;
    const totalQty = originalPrice > 0 ? Math.round(item.price / originalPrice) : 1;
    return {
      id: item.id,
      name: totalQty > 1 ? `${addonMeta?.name} (x${totalQty})` : (addonMeta?.name || ""),
      price: item.price
    };
  });

  // Total price: sum of package prices and addon prices on each day
  const totalPrice = bookingDays.reduce((sum, bd) => {
    const pkg = packages.find((p) => p.id === bd.packageId);
    const pPrice = pkg ? pkg.price : 0;
    const aPriceSum = bd.addons.reduce((s, a) => {
      const addonMeta = addons.find((add) => add.id === a.id);
      return s + (addonMeta ? addonMeta.price * a.quantity : 0);
    }, 0);
    return sum + pPrice + aPriceSum;
  }, 0);

  const minDpAmount = Math.round(totalPrice * 0.5);

  let amountPaid = totalPrice;
  if (paymentMethod !== "full") {
    if (isCustomDpActive) {
      const parsedAmount = parseInt(customDpAmount.replace(/[^0-9]/g, ""), 10) || 0;
      amountPaid = parsedAmount;
    } else {
      amountPaid = Math.round(totalPrice * (dpPercentage / 100));
    }
  }

  const remainingPayment = Math.max(0, totalPrice - amountPaid);

  // Keep custom DP string in sync when total price / selection mode changes
  useEffect(() => {
    if (paymentMethod !== "full") {
      if (!isCustomDpActive) {
        const calculated = Math.round(totalPrice * (dpPercentage / 100));
        setCustomDpAmount(calculated.toString());
      }
    } else {
      setCustomDpAmount("");
      setIsCustomDpActive(false);
      setDpPercentage(50);
    }
  }, [totalPrice, dpPercentage, paymentMethod, isCustomDpActive]);

  // Derived comma-separated representation of multiple days dates
  const tanggalAcara = bookingDays
    .map((bd) => bd.date)
    .filter(Boolean)
    .join(", ");

  // Multi-day helper functions
  const addBookingDay = () => {
    const matchPkgs = packages.filter((p) => p.type === keperluan || p.type === "both");
    const firstPkgId = matchPkgs.length > 0 ? matchPkgs[0].id : "";
    setBookingDays([
      ...bookingDays,
      {
        id: `day-${Date.now()}-${Math.floor(Math.random() * 1050)}`,
        date: "",
        packageId: firstPkgId,
        addons: [],
      },
    ]);
  };

  const removeBookingDay = (id: string) => {
    if (bookingDays.length <= 1) return;
    setBookingDays(bookingDays.filter((bd) => bd.id !== id));
  };

  const updateBookingDay = (id: string, updates: Partial<(typeof bookingDays)[0]>) => {
    setBookingDays((prev) => prev.map((bd) => (bd.id === id ? { ...bd, ...updates } : bd)));
  };

  const toggleAddonForDay = (dayId: string, addonId: string) => {
    setBookingDays((prev) =>
      prev.map((bd) => {
        if (bd.id === dayId) {
          const existing = bd.addons.find((a) => a.id === addonId);
          const newAddons = existing
            ? bd.addons.filter((a) => a.id !== addonId)
            : [...bd.addons, { id: addonId, quantity: 1 }];
          return { ...bd, addons: newAddons };
        }
        return bd;
      }),
    );
  };

  const updateAddonQtyForDay = (dayId: string, addonId: string, delta: number) => {
    setBookingDays((prev) =>
      prev.map((bd) => {
        if (bd.id === dayId) {
          const newAddons = bd.addons
            .map((a) => {
              if (a.id === addonId) {
                const newQty = a.quantity + delta;
                return { ...a, quantity: newQty };
              }
              return a;
            })
            .filter((a) => a.quantity > 0);
          return { ...bd, addons: newAddons };
        }
        return bd;
      }),
    );
  };

  // Submit Booking
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitSuccess(null);

    // Ensure all days have defined dates
    const hasEmptyDates = bookingDays.some((bd) => !bd.date);
    if (hasEmptyDates) {
      setSubmitError("Mohon pilih tanggal untuk semua hari acara.");
      return;
    }

    // Ensure all date selections are unique
    const uniqueDates = bookingDays.map((bd) => bd.date).filter(Boolean);
    const hasDuplicateDates = uniqueDates.some((date, index) => uniqueDates.indexOf(date) !== index);
    if (hasDuplicateDates) {
      setSubmitError("Setiap tanggal acara harus unik. Anda tidak boleh memilih lebih dari satu paket pada tanggal yang sama.");
      return;
    }

    if (!namaLengkap || !noWhatsapp || !domisili || !keperluan || !lokasiVenue || !selectedPackageId) {
      setSubmitError("Mohon isi seluruh data formulir pendaftaran.");
      return;
    }

    if (paymentMethod !== "full") {
      const parsedAmount = isCustomDpActive ? parseInt(customDpAmount.replace(/[^0-9]/g, ""), 10) || 0 : Math.round(totalPrice * (dpPercentage / 100));

      if (parsedAmount < minDpAmount) {
        setSubmitError(`Nominal pembayaran DP minimal adalah 50% dari total biaya (Rp ${minDpAmount.toLocaleString("id-ID")}).`);
        return;
      }
      if (parsedAmount > totalPrice) {
        setSubmitError(`Nominal pembayaran DP tidak boleh melebihi total biaya (Rp ${totalPrice.toLocaleString("id-ID")}).`);
        return;
      }
    }

    setIsSubmitting(true);

    const bookingPayload = {
      customerName: namaLengkap,
      customerPhone: noWhatsapp,
      customerCity: domisili,
      eventType: keperluan,
      weddingType: keperluan === "wedding" ? weddingType : undefined,
      eventDate: tanggalAcara,
      venueLocation: lokasiVenue,
      packageId: selectedPackageId,
      packageName: selectedPackage ? selectedPackage.name : "",
      packagePrice: packagePrice,
      addons: selectedAddons,
      addonDetails: chosenAddonsDetail,
      days: bookingDays.map((bd) => {
        const pkg = packages.find((p) => p.id === bd.packageId);
        const dayAddonDetails = bd.addons.map((a) => {
          const addonMeta = addons.find((add) => add.id === a.id);
          return {
            id: a.id,
            name: a.quantity > 1 ? `${addonMeta?.name} (x${a.quantity})` : (addonMeta?.name || ""),
            price: (addonMeta?.price || 0) * a.quantity,
          };
        });
        return {
          date: bd.date,
          packageId: bd.packageId,
          packageName: pkg ? pkg.name : "",
          packagePrice: pkg ? pkg.price : 0,
          addons: bd.addons.map((a) => `${a.id}:${a.quantity}`),
          addonDetails: dayAddonDetails,
        };
      }),
      paymentMethod,
      totalPrice,
      amountPaid,
      remainingPayment,
    };

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingPayload),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Gagal membuat pemesanan");
      }

      setSubmitSuccess(result.booking);
      // Reset form
      setNamaLengkap("");
      setNoWhatsapp("");
      setDomisili("");
      setLokasiVenue("");
      setWeddingType("Akad & Resepsi (Sameday)");
      setPaymentMethod("full");
      setDpPercentage(50);
      setCustomDpAmount("");
      setIsCustomDpActive(false);

      const matchPkgs = packages.filter((p) => p.type === keperluan || p.type === "both");
      const firstPkgId = matchPkgs.length > 0 ? matchPkgs[0].id : "";
      setBookingDays([{ id: `day-${Date.now()}`, date: "", packageId: firstPkgId, addons: [] }]);

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setSubmitError(err.message || "Koneksi ke server gagal");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Search Booking
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchWhatsapp.trim()) return;

    setSearchLoading(true);
    setHasSearched(true);
    try {
      const response = await fetch(`/api/bookings/search?whatsapp=${encodeURIComponent(searchWhatsapp)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error("Search error:", err);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 uppercase tracking-widest">Lunas (Kwitansi)</span>;
      case "approved":
        return <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded bg-amber-500/10 text-amber-650 border border-amber-500/20 uppercase tracking-widest">Invoice (Belum Bayar)</span>;
      case "dp_paid":
        return <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded bg-amber-500/20 text-amber-700 border border-amber-550/30 uppercase tracking-widest">Invoice (DP Terbayar)</span>;
      case "rejected":
        return <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded bg-rose-500/10 text-rose-600 border border-rose-500/20 uppercase tracking-widest">Ditolak</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded bg-zinc-500/10 text-zinc-500 border border-zinc-500/20 uppercase tracking-widest animate-pulse">Menunggu Review Jadwal</span>;
    }
  };

  return (
    <div className="space-y-12">
      {/* Hero Section of Elegant Dark */}
      <section className="relative text-left py-16 px-8 md:px-12 rounded-3xl overflow-hidden bg-linear-to-br from-zinc-900 to-black border border-zinc-800 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full filter blur-3xl opacity-60"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-zinc-900/40 rounded-full filter blur-3xl opacity-60"></div>

        <div className="relative max-w-2xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-zinc-950/80 text-amber-450 font-mono text-[10px] rounded-full border border-zinc-850 tracking-wider uppercase">
            <span>KREALOGS.COM CINEMATOGRAPHY</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-light tracking-tight text-white leading-tight">
            Ready to <span className="italic font-serif text-amber-500">capture?</span>
          </h1>
          <p className="text-sm md:text-base text-zinc-400 leading-relaxed font-light">Fill in your event details below to initiate a premium, cinematic production request designed for modern requirements.</p>
        </div>
      </section>

      {/* Success Banner */}
      {submitSuccess && (
        <div className="p-6 md:p-8 bg-zinc-950/70 rounded-2xl border border-emerald-500/20 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 animate-fade-in">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 rounded-xl shrink-0 mt-0.5">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Registrasi Pemesanan Anda Berhasil Dikirim!</h3>
              <p className="text-xs text-zinc-400 mt-1">Data sedang dalam proses tinjauan admin. Anda dapat menggunakan nomor WhatsApp Anda untuk memantau status secara langsung di kolom bawah.</p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                <span className="font-mono text-zinc-300 bg-zinc-900 px-2 py-1 rounded border border-zinc-800">ID: {submitSuccess.id}</span>
                <span className="text-zinc-400">
                  Total Biaya: <strong className="text-amber-500 font-mono">Rp {submitSuccess.totalPrice.toLocaleString("id-ID")}</strong>
                </span>
              </div>
            </div>
          </div>
          <div className="shrink-0 w-full md:w-auto">
            <span className="inline-flex items-center px-4 py-2.5 text-xs font-mono font-bold rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20 uppercase tracking-wider animate-pulse">Menunggu Review Admin</span>
          </div>
        </div>
      )}

      {/* Search status - Cek Status Pemesanan */}
      <section className="bg-zinc-950/30 rounded-3xl p-6 md:p-8 border border-zinc-800 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-amber-500" />
            Cek Status Pemesanan Anda
          </h2>
          <p className="text-xs text-zinc-500 mt-1">Gunakan nomor ponsel kustomer untuk mengunduh invoice resmi yang disetujui serta melacak progres.</p>
        </div>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Masukkan nomor WhatsApp terdaftar (contoh: 08123456789)"
              value={searchWhatsapp}
              onChange={(e) => setSearchWhatsapp(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl focus:outline-none transition text-xs text-white placeholder-zinc-500 font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={searchLoading}
            className="px-6 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-bold rounded-xl text-xs uppercase tracking-wider transition cursor-pointer disabled:bg-zinc-800 disabled:text-zinc-600"
          >
            {searchLoading ? "Mencari..." : "Cek Status"}
          </button>
        </form>

        {/* Search Results Display */}
        {hasSearched && (
          <div className="pt-4 border-t border-zinc-900 space-y-4">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Hasil Pencarian</h3>

            {searchResults.length === 0 ? (
              <div className="p-6 text-center text-zinc-400 text-xs border border-dashed border-zinc-800 rounded-xl bg-zinc-950/20">
                <AlertCircle className="w-5 h-5 mx-auto text-zinc-600 mb-2" />
                Nomor WhatsApp tidak cocok dengan pesanan terdaftar. Pastikan nomor sudah benar.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {searchResults.map((b) => (
                  <div key={b.id} className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/40 hover:border-zinc-700 transition flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-white bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">{b.id}</span>
                        {getStatusBadge(b.status)}
                      </div>
                      <div>
                        <p className="text-xs text-white font-medium">{b.customerName}</p>
                        <p className="text-[10px] text-zinc-400 font-mono">
                          {b.customerPhone} ({b.customerCity})
                        </p>
                      </div>
                      <p className="text-[11px] text-zinc-500">
                        {b.packageName} • {formatEventDate(b.eventDate, { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        Total Tagihan: <span className="text-amber-500 font-mono font-bold">Rp {b.totalPrice.toLocaleString("id-ID")}</span>
                      </p>
                    </div>

                    <div className="flex flex-col items-end justify-between h-full gap-4">
                      {b.status === "paid" ? (
                        <button
                          onClick={() => onOpenInvoice(b)}
                          className="px-3 py-2 bg-emerald-600 hover:bg-emerald-555 text-white text-[10px] font-bold uppercase rounded-lg transition tracking-wide cursor-pointer flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Kwitansi Pelunasan
                        </button>
                      ) : b.status === "approved" || b.status === "dp_paid" ? (
                        <button onClick={() => onOpenInvoice(b)} className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-black text-[10px] font-bold uppercase rounded-lg transition tracking-wide cursor-pointer flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5" />
                          Invoice Resmi
                        </button>
                      ) : b.status === "rejected" ? (
                        <span className="text-[10px] text-rose-600 font-medium italic">Ditolak</span>
                      ) : (
                        <span className="text-[10px] text-zinc-500 font-medium italic flex items-center gap-1 animate-pulse">
                          <HelpCircle className="w-3.5 h-3.5 text-zinc-450" />
                          Pending Review
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Booking Form + Calculator Section */}
      <section className="bg-[#0c0c0e] rounded-3xl border border-zinc-800 shadow-xl overflow-hidden">
        {/* Banner Form */}
        <div className="bg-zinc-950 p-6 md:p-8 border-b border-zinc-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Isi Formulir & Rancang Biaya</h2>
            <p className="text-xs text-zinc-400 mt-1">Isi rincian acara Anda untuk mengonfirmasi ketersediaan videografer.</p>
          </div>
        </div>

        {dbLoading ? (
          <div className="p-12 text-center text-zinc-500 text-xs font-mono">Menyiapkan pipeline database...</div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 md:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Form Input Columns (Left/Middle) */}
              <div className="lg:col-span-7 space-y-8">
                {/* 1. Registrasi Identitas */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-amber-500 text-black font-mono font-bold flex items-center justify-center text-[10px]">A</span>
                    Identitas Pelanggan (Registrasi)
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.55">
                      <label className="text-xs font-semibold text-zinc-400 block">Nama Lengkap</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                          type="text"
                          required
                          placeholder="cth: Aditya Pratama"
                          value={namaLengkap}
                          onChange={(e) => setNamaLengkap(e.target.value)}
                          className="w-full pl-9 pr-4 py-2.5 bg-zinc-900/75 border border-zinc-800 focus:border-amber-500 rounded-xl focus:outline-none transition text-xs text-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-400 block">Nomor WhatsApp Aktif</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                          type="tel"
                          required
                          placeholder="cth: 0812XXXXXXXX"
                          value={noWhatsapp}
                          onChange={(e) => setNoWhatsapp(e.target.value)}
                          className="w-full pl-9 pr-4 py-2.5 bg-zinc-900/75 border border-zinc-800 focus:border-amber-500 rounded-xl focus:outline-none transition text-xs text-white font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400 block">Domisili / Kota Saat Ini</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input
                        type="text"
                        required
                        placeholder="cth: Banjarmasin"
                        value={domisili}
                        onChange={(e) => setDomisili(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-zinc-900/75 border border-zinc-800 focus:border-amber-500 rounded-xl focus:outline-none transition text-xs text-white"
                      />
                    </div>
                  </div>
                </div>{" "}
                {/* 2. Detail Penjadwalan */}
                <div className="space-y-4 pt-4 border-t border-zinc-900">
                  <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-amber-500 text-black font-mono font-bold flex items-center justify-center text-[10px]">B</span>
                    Detail Pemesanan Acara
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-400 block">Jenis / Keperluan Acara</label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => setKeperluan("wedding")}
                          className={`py-3 px-4 rounded-xl text-xs font-bold border transition text-center cursor-pointer ${
                            keperluan === "wedding" ? "bg-amber-500 border-amber-500 text-black shadow-md shadow-amber-500/10" : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white"
                          }`}
                        >
                          Pernikahan (Wedding)
                        </button>
                        <button
                          type="button"
                          onClick={() => setKeperluan("event")}
                          className={`py-3 px-4 rounded-xl text-xs font-bold border transition text-center cursor-pointer ${
                            keperluan === "event" ? "bg-amber-500 border-amber-500 text-black shadow-md shadow-amber-500/10" : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white"
                          }`}
                        >
                          Komersial (Event)
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-400 block">Lokasi Venue / Gedung</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                          type="text"
                          required
                          placeholder="cth: Gedung Sultan Suriansyah"
                          value={lokasiVenue}
                          onChange={(e) => setLokasiVenue(e.target.value)}
                          className="w-full pl-9 pr-4 py-2.5 bg-zinc-900/75 border border-zinc-800 focus:border-amber-500 rounded-xl focus:outline-none transition text-xs text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {keperluan === "wedding" && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden space-y-2 pt-2">
                        <label className="text-[11px] font-bold text-zinc-400 block uppercase tracking-wider">Pilihan Rangkaian Acara Pernikahan (Wedding)</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {["Lamaran", "Akad", "Resepsi", "Akad & Resepsi (Sameday)"].map((type) => {
                            const isSelected = weddingType === type;
                            return (
                              <button
                                key={type}
                                type="button"
                                onClick={() => setWeddingType(type)}
                                className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition text-center cursor-pointer select-none ${
                                  isSelected ? "bg-amber-500 border-amber-500 text-black shadow-md shadow-amber-500/10" : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white"
                                }`}
                              >
                                {type}
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                {/* 3. Rancang Jadwal Acara (Bisa Multi-Hari) */}
                <div className="space-y-6 pt-4 border-t border-zinc-900">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-amber-500 text-black font-mono font-bold flex items-center justify-center text-[10px]">C</span>
                      Jadwal Acara (Bisa Multi-Hari)
                    </h3>
                  </div>

                  <div className="space-y-6">
                    {bookingDays.map((bd, idx) => {
                      const dayPackages = packages.filter((p) => p.type === keperluan || p.type === "both");

                      const isSignaturePkg = (id: string) => ["pkg-grand-legacy", "pkg-visual-legacy", "pkg-golden-memoir", "pkg-intimate-moments"].includes(id);

                      const selectedPkg = packages.find((p) => p.id === bd.packageId);
                      const activeTab = pkgCategoryTabs[bd.id] || (selectedPkg && isSignaturePkg(selectedPkg.id) ? "signature" : "regular");

                      const filteredPkgs = dayPackages.filter((p) => {
                        const isSig = isSignaturePkg(p.id);
                        return activeTab === "signature" ? isSig : !isSig;
                      });

                      return (
                        <div key={bd.id} className="relative p-5 rounded-2xl bg-zinc-950/40 border border-zinc-850 space-y-5 hover:border-zinc-700 transition">
                          {/* Day Header with Delete Button */}
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] bg-zinc-900 border border-zinc-800 font-mono font-bold px-2.5 py-1 rounded text-amber-400 tracking-wider">ACARA HARI #{idx + 1}</span>
                            {bookingDays.length > 1 && (
                              <button type="button" onClick={() => removeBookingDay(bd.id)} className="text-[10px] font-bold text-rose-450 hover:text-rose-405 hover:underline cursor-pointer">
                                Hapus Hari Ini
                              </button>
                            )}
                          </div>

                          {/* Tanggal Acara & Grid Section */}
                          <div className="space-y-5">
                            {/* Tanggal Acara */}
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-bold text-zinc-400 block uppercase tracking-wider">Tanggal Hari #{idx + 1}</label>
                              <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                <input
                                  type="date"
                                  required
                                  value={bd.date}
                                  onChange={(e) => updateBookingDay(bd.id, { date: e.target.value })}
                                  className="w-full pl-9 pr-4 py-2.5 bg-zinc-905 border border-zinc-800 focus:border-amber-500 rounded-xl focus:outline-none transition text-xs text-white"
                                />
                              </div>
                              {bd.date && bookingDays.some((other) => other.id !== bd.id && other.date === bd.date) && (
                                <p className="text-[10px] text-rose-450 mt-1.5 font-sans leading-normal">⚠️ Tanggal ini sudah dipilih di hari lain. Satu tanggal hanya boleh memesan satu paket.</p>
                              )}
                            </div>

                            {/* Grid Pilihan Paket */}
                            <div className="space-y-4 pt-1.5">
                              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                                <label className="text-[11px] font-bold text-zinc-400 block uppercase tracking-wider">Pilih Paket Hari #{idx + 1}</label>

                                {/* Segmented Tab Kategori */}
                                <div className="flex border border-zinc-850 bg-zinc-950 p-1 rounded-xl w-full sm:w-auto max-w-[320px] sm:min-w-[240px]">
                                  <button
                                    type="button"
                                    onClick={() => setPkgCategoryTabs((prev) => ({ ...prev, [bd.id]: "signature" }))}
                                    className={`flex-1 py-1.5 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer ${
                                      activeTab === "signature" ? "bg-amber-500 text-black shadow-md" : "text-zinc-400 hover:text-white"
                                    }`}
                                  >
                                    <span>Signature</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setPkgCategoryTabs((prev) => ({ ...prev, [bd.id]: "regular" }))}
                                    className={`flex-1 py-1.5 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer ${
                                      activeTab === "regular" ? "bg-amber-500 text-black shadow-md" : "text-zinc-400 hover:text-white"
                                    }`}
                                  >
                                    <span>Regular</span>
                                  </button>
                                </div>
                              </div>

                              {/* Interactive Package Cards Grid */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {filteredPkgs.length > 0 ? (
                                  filteredPkgs.map((pkg) => {
                                    const isPkgSelected = bd.packageId === pkg.id;
                                    return (
                                      <div
                                        key={pkg.id}
                                        onClick={() => updateBookingDay(bd.id, { packageId: pkg.id })}
                                        className={`p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between cursor-pointer relative group ${
                                          isPkgSelected
                                            ? activeTab === "signature"
                                              ? "bg-zinc-950 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.08)] ring-1 ring-amber-500"
                                              : "bg-zinc-950 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.08)] ring-1 ring-amber-500"
                                            : "bg-zinc-900/30 border-zinc-850 hover:border-zinc-700/80 hover:bg-zinc-900/50"
                                        }`}
                                      >
                                        <div className="space-y-4">
                                          {/* Card Header */}
                                          <div className="flex justify-between items-start gap-2 w-full">
                                            <div className="space-y-1 flex-1">
                                              <h4 className="text-[13px] font-bold text-white tracking-tight flex items-center gap-1.5 flex-wrap">
                                                {pkg.name}
                                                {isPkgSelected && <span className="text-[8px] font-black bg-amber-500 text-black px-1.5 py-0.5 rounded-full uppercase tracking-widest">★ TERPILIH</span>}
                                              </h4>
                                              <p className="text-[10px] text-zinc-400 leading-normal line-clamp-2">{pkg.description}</p>
                                            </div>
                                            <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${isPkgSelected ? "bg-amber-500 border-amber-500 text-black" : "border-zinc-800 group-hover:border-zinc-650"}`}>
                                              {isPkgSelected && <Check className="w-2.5 h-2.5 stroke-3" />}
                                            </span>
                                          </div>

                                          {/* Features Bullet List */}
                                          <div className="space-y-2 pt-1 border-t border-zinc-900/60">
                                            <span className="text-[8px] text-zinc-500 uppercase tracking-widest block font-extrabold font-mono">Benefit Utama:</span>
                                            <ul className="space-y-1.5 text-[11px] text-zinc-300">
                                              {pkg.features?.map((feat, fidx) => (
                                                <li key={fidx} className="flex items-start gap-1.5">
                                                  <Check className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                                  <span className="leading-tight text-zinc-300 text-[10px]">{feat}</span>
                                                </li>
                                              ))}
                                            </ul>
                                          </div>
                                        </div>

                                        {/* Select Indicator Bar */}
                                        <div className="mt-4 pt-3.5 border-t border-zinc-900/60 flex items-center justify-between">
                                          <span className="text-[8px] text-zinc-500 uppercase tracking-wider block font-mono">{isPkgSelected ? "✓ Aktif Dipilih" : " Klik untuk memilih"}</span>
                                          <div className="text-right whitespace-nowrap">
                                            <span className="text-[11px] sm:text-[13px] font-extrabold text-amber-500 font-mono tracking-tight">Rp {pkg.price.toLocaleString("id-ID")}</span>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })
                                ) : (
                                  <div className="p-4 text-center text-zinc-500 text-xs font-mono col-span-2">Tidak ada paket tersedia untuk kategori ini.</div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Add-ons for this specific day */}
                          <div className="space-y-2 pt-2 border-t border-zinc-900/40">
                            <label className="text-[11px] font-bold text-zinc-400 block uppercase tracking-wider">Add-ons Tambahan Hari #{idx + 1} (Opsional)</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {addons.map((a) => {
                                const addonSelected = bd.addons.find((add) => add.id === a.id);
                                const isSelected = !!addonSelected;
                                const quantity = addonSelected ? addonSelected.quantity : 0;
                                return (
                                  <div
                                    key={a.id}
                                    onClick={() => toggleAddonForDay(bd.id, a.id)}
                                    className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer min-h-[105px] relative select-none ${
                                      isSelected ? "border-amber-500 bg-amber-500/5 shadow-sm" : "border-zinc-200 bg-white hover:border-zinc-350"
                                    }`}
                                  >
                                    {/* Upper Content: Checkbox & Texts */}
                                    <div className="flex items-start gap-3 w-full">
                                      {/* Left Checkbox */}
                                      <div
                                        className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 mt-0.5 transition-colors ${
                                          isSelected ? "bg-amber-500 border-amber-500 text-black" : "bg-white border-zinc-300 text-transparent"
                                        }`}
                                      >
                                        <Check className="w-2.5 h-2.5 stroke-3" />
                                      </div>

                                      {/* Middle/Right text content */}
                                      <div className="flex-1 min-w-0 pb-8">
                                        <span className="text-xs font-bold text-zinc-900 block leading-tight">{a.name}</span>
                                        <span className="text-[10px] text-zinc-500 block mt-1 leading-normal">{a.description}</span>
                                      </div>
                                    </div>

                                    {/* Absolute Bottom Left Qty Counter */}
                                    {isSelected && (
                                      <div className="absolute bottom-3 left-[42px] flex items-center space-x-1.5 bg-white p-0.5 rounded-lg border border-zinc-200 shadow-sm z-10" onClick={(e) => e.stopPropagation()}>
                                        <button
                                          type="button"
                                          onClick={() => updateAddonQtyForDay(bd.id, a.id, -1)}
                                          className="w-5 h-5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-900 flex items-center justify-center font-extrabold text-[10px] cursor-pointer transition"
                                        >
                                          -
                                        </button>
                                        <span className="text-[10px] font-mono font-bold text-zinc-900 px-1 min-w-[14px] text-center select-none">
                                          {quantity}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => updateAddonQtyForDay(bd.id, a.id, 1)}
                                          className="w-5 h-5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-900 flex items-center justify-center font-extrabold text-[10px] cursor-pointer transition"
                                        >
                                          +
                                        </button>
                                      </div>
                                    )}

                                    {/* Absolute Bottom Right Price */}
                                    <div className="absolute bottom-3.5 right-3 text-right">
                                      <span className="text-[11px] font-mono font-bold text-amber-600">
                                        +Rp {(a.price * (quantity || 1)).toLocaleString("id-ID")}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={addBookingDay}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-xs font-extrabold transition cursor-pointer font-sans uppercase tracking-wider shadow-md"
                    >
                      + Tambah Hari
                    </button>
                  </div>
                </div>
              </div>

              {/* Calculator Summary Card (Right for desktop) */}
              <div className="lg:col-span-5 lg:sticky lg:top-6 bg-zinc-900/40 text-zinc-100 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl border border-zinc-850 bg-linear-to-br from-zinc-900 to-black">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    Rincian Pembiayaan
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Penghitungan transparan secara otomatis.</p>
                </div>

                {/* Multi-day Price Breakdown */}
                <div className="space-y-4 border-b border-zinc-800 pb-4">
                  <span className="text-zinc-500 block text-[11px] font-mono uppercase tracking-wider">Metrik Hari Acara ({bookingDays.length}):</span>
                  {bookingDays.map((bd, index) => {
                    const pkg = packages.find((p) => p.id === bd.packageId);
                    const dayAddonsPaid = bd.addons.map((a) => {
                      const addonMeta = addons.find((add) => add.id === a.id);
                      return {
                        id: a.id,
                        name: a.quantity > 1 ? `${addonMeta?.name} (x${a.quantity})` : (addonMeta?.name || ""),
                        price: (addonMeta?.price || 0) * a.quantity,
                      };
                    }).filter((item) => item.price > 0);
                    const daySubtotal = (pkg ? pkg.price : 0) + dayAddonsPaid.reduce((s, a) => s + a.price, 0);

                    return (
                      <div key={bd.id} className="p-3.5 rounded-xl bg-black/40 border border-zinc-900 text-xs text-zinc-300 space-y-1.5 hover:border-zinc-805 transition-colors">
                        <div className="flex justify-between items-center font-bold text-zinc-200">
                          <span>
                            Hari #{index + 1}: {bd.date ? formatEventDate(bd.date, { day: "numeric", month: "short", year: "numeric" }) : <span className="text-rose-500 font-normal">Isi Tanggal..</span>}
                          </span>
                          <span className="font-mono text-amber-500 text-xs">Rp {daySubtotal.toLocaleString("id-ID")}</span>
                        </div>
                        <div className="text-[11px] text-zinc-500 flex justify-between gap-4">
                          <span className="truncate text-zinc-400">Paket: {pkg ? pkg.name : "Belum dipilih"}</span>
                          <span className="font-mono shrink-0">Rp {pkg ? pkg.price.toLocaleString("id-ID") : 0}</span>
                        </div>
                        {dayAddonsPaid.length > 0 && (
                          <div className="text-[10px] text-zinc-500 pl-2 space-y-0.5 border-l border-zinc-850">
                            {dayAddonsPaid.map((a, aIdx) => (
                              <div key={`${a.id}-${aIdx}`} className="flex justify-between text-zinc-500 font-normal">
                                <span className="truncate max-w-[150px]">• {a.name}</span>
                                <span className="font-mono shrink-0">+Rp {a.price.toLocaleString("id-ID")}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* 5. Payment System selection */}
                <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-amber-500" />
                      Sistem Pembayaran
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-black/50 p-1 rounded-xl border border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("full")}
                      className={`py-2 px-3 rounded-lg text-[11px] font-bold text-center cursor-pointer transition ${paymentMethod === "full" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-white"}`}
                    >
                      Bayar Lunas
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("dp_custom")}
                      className={`py-2 px-3 rounded-lg text-[11px] font-bold text-center cursor-pointer transition ${paymentMethod === "dp_custom" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-white"}`}
                    >
                      Bayar DP (Min. 50%)
                    </button>
                  </div>

                  <p className="text-[10px] text-zinc-500 leading-normal">
                    {paymentMethod === "dp_custom"
                      ? "Silakan tentukan nominal DP di bawah (minimum 50%). Pelunasan dari sisa tagihan wajib disetorkan paling lambat 3 hari sebelum acara."
                      : "Selesaikan transaksi lunas seutuhnya tanpa memikirkan rincian tagihan sisa di kemudian hari."}
                  </p>

                  {paymentMethod === "dp_custom" && (
                    <div className="space-y-3 bg-zinc-950/60 p-4 rounded-2xl border border-zinc-850 text-zinc-300">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="font-semibold text-zinc-400">Atur Persentase DP:</span>
                        <span className="font-mono text-amber-400 font-bold bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">{isCustomDpActive ? "Kustom" : `${dpPercentage}%`}</span>
                      </div>

                      {/* Presets Grid */}
                      <div className="grid grid-cols-5 gap-1.5">
                        {[50, 60, 70, 80, 90].map((pct) => {
                          const isActive = !isCustomDpActive && dpPercentage === pct;
                          return (
                            <button
                              key={pct}
                              type="button"
                              onClick={() => {
                                setDpPercentage(pct);
                                setIsCustomDpActive(false);
                              }}
                              className={`py-1.5 rounded-lg text-[10px] font-mono font-bold text-center border cursor-pointer transition ${
                                isActive ? "bg-amber-500/10 border-amber-500 text-amber-400 font-semibold" : "bg-zinc-900/40 border-zinc-800/80 text-zinc-400 hover:text-white"
                              }`}
                            >
                              {pct}%
                            </button>
                          );
                        })}
                      </div>

                      {/* Slider Input */}
                      <div className="space-y-1">
                        <input
                          type="range"
                          min="50"
                          max="95"
                          step="5"
                          value={isCustomDpActive ? 50 : dpPercentage}
                          onChange={(e) => {
                            setDpPercentage(Number(e.target.value));
                            setIsCustomDpActive(false);
                          }}
                          className="w-full accent-amber-500 cursor-pointer h-1 bg-zinc-800 rounded-lg appearance-none"
                        />
                        <div className="flex justify-between text-[9px] text-zinc-500 font-mono">
                          <span>Min 50%</span>
                          <span>Max 95%</span>
                        </div>
                      </div>

                      {/* Custom Rupiah Input Field */}
                      <div className="space-y-1.5 pt-2 border-t border-zinc-900">
                        <div className="flex justify-between items-center text-[11px]">
                          <label className="text-zinc-400 font-medium font-sans">Atau Masukkan Nominal (Rp):</label>
                          {isCustomDpActive && (
                            <button
                              type="button"
                              onClick={() => {
                                setIsCustomDpActive(false);
                                setDpPercentage(50);
                              }}
                              className="text-[9px] text-amber-500 font-bold hover:underline cursor-pointer"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          placeholder={`Minimal Rp ${minDpAmount.toLocaleString("id-ID")}`}
                          value={customDpAmount ? "Rp " + (parseInt(customDpAmount.replace(/[^0-9]/g, ""), 10) || 0).toLocaleString("id-ID") : ""}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/[^0-9]/g, "");
                            setCustomDpAmount(digits);
                            setIsCustomDpActive(true);
                          }}
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 focus:border-amber-500 focus:outline-none text-white rounded-lg font-mono text-xs text-right"
                        />

                        {/* Real-time Warning message under typing */}
                        {isCustomDpActive &&
                          (() => {
                            const parsedVal = parseInt(customDpAmount, 10) || 0;
                            if (parsedVal < minDpAmount) {
                              return (
                                <p className="text-[10px] text-rose-400 mt-1 flex items-center gap-1 font-sans leading-normal">
                                  <span>⚠️ Nominal di bawah batas 50% (Min: Rp {minDpAmount.toLocaleString("id-ID")})</span>
                                </p>
                              );
                            }
                            if (parsedVal > totalPrice) {
                              return (
                                <p className="text-[10px] text-rose-400 mt-1 flex items-center gap-1 font-sans leading-normal">
                                  <span>⚠️ Melebihi total harga (Maks: Rp {totalPrice.toLocaleString("id-ID")})</span>
                                </p>
                              );
                            }
                            return (
                              <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1 font-sans leading-normal">
                                <span>✅ Porsi DP valid: {Math.round((parsedVal / totalPrice) * 100)}% dari total biaya</span>
                              </p>
                            );
                          })()}
                      </div>
                    </div>
                  )}
                </div>

                {/* Math Calculations Display */}
                <div className="pt-4 border-t border-zinc-800 space-y-3 text-xs">
                  <div className="flex justify-between text-zinc-400">
                    <span>Total Harga Gabungan:</span>
                    <span className="font-mono text-base font-bold text-zinc-200">Rp {totalPrice.toLocaleString("id-ID")}</span>
                  </div>

                  <div className="flex justify-between text-zinc-200 border-t border-zinc-800/80 pt-3">
                    <span className="font-semibold text-amber-400 text-xs">Wajib Dibayar Sekarang:</span>
                    <span className="font-mono text-xl font-black text-amber-400">Rp {amountPaid.toLocaleString("id-ID")}</span>
                  </div>

                  {paymentMethod !== "full" && (
                    <div className="flex justify-between text-zinc-500 pt-1">
                      <span>Sisa Tagihan Pelunasan:</span>
                      <span className="font-mono text-zinc-300 font-medium">Rp {remainingPayment.toLocaleString("id-ID")}</span>
                    </div>
                  )}
                </div>

                {/* Submit button */}
                <div className="pt-2">
                  {submitError && (
                    <div className="p-3 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[11px] rounded-xl mb-3 flex items-center gap-2 font-mono">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-xl text-xs uppercase tracking-wider transition-transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:bg-zinc-800 disabled:text-zinc-650"
                  >
                    {isSubmitting ? "Memproses Data..." : "KONFIRMASI PEMESANAN"}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
