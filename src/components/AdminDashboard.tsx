import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Booking, Package as PkgType, Addon, Coupon } from "../types";
import AdminLayout from "./AdminLayout";
import { LineChart, BarChart, DonutChart, StackedBar, ComboChart } from "./AdminCharts";
import { Coins, TrendingUp, Check, CreditCard, Users, Package, ShoppingCart, CalendarDays, Percent, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface Props {
  onOpenInvoice: (booking: Booking) => void;
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;
}

function StatCard({ label, value, icon, trend, trendUp, color }: { label: string; value: string; icon: React.ReactNode; trend?: string; trendUp?: boolean; color?: string }) {
  return (
    <div className="bg-[#0c0c0e] p-4 rounded-2xl border border-zinc-850 shadow-lg">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide block font-sans">{label}</span>
          <p className={`text-2xl font-sans font-bold mt-0.5 ${color || "text-white"}`}>{value}</p>
          {trend && (
            <div className={`flex items-center gap-1 mt-1 ${trendUp ? "text-emerald-500" : "text-rose-500"}`}>
              {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              <span className="text-[10px] font-bold font-sans">{trend}</span>
            </div>
          )}
        </div>
        <div className="p-2 bg-white/5 rounded-xl">{icon}</div>
      </div>
    </div>
  );
}

function ChartCard({ title, icon, subtitle, children, className }: { title: string; icon: React.ReactNode; subtitle?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`p-5 bg-[#0c0c0e] rounded-2xl border border-zinc-850 ${className || ""}`}>
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wide font-sans flex items-center gap-2">{icon} {title}</h3>
      </div>
      {subtitle && <p className="text-[10px] text-zinc-600 mb-3">{subtitle}</p>}
      {children}
    </div>
  );
}

export default function AdminDashboard({ onOpenInvoice, mobileSidebarOpen, setMobileSidebarOpen }: Props) {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [packages, setPackages] = useState<PkgType[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  useEffect(() => {
    fetch("/api/auth/csrf").then(r => r.json()).catch(() => {});
    fetch("/api/db").then(r => r.ok ? r.json() : Promise.reject()).then(d => { setBookings(d.bookings || []); setPackages(d.packages || []); setAddons(d.addons || []); setCoupons(d.coupons || []); }).catch(() => navigate("/admin/login"));
  }, [navigate]);

  const approved = useMemo(() => bookings.filter(b => b.approvalStatus === "approved"), [bookings]);
  const pending = useMemo(() => bookings.filter(b => b.approvalStatus === "pending"), [bookings]);
  const rejected = useMemo(() => bookings.filter(b => b.approvalStatus === "rejected"), [bookings]);
  const paid = useMemo(() => approved.filter(b => b.paymentStatus === "paid"), [approved]);
  const dpPaid = useMemo(() => approved.filter(b => b.paymentStatus === "dp_paid"), [approved]);
  const unpaid = useMemo(() => approved.filter(b => b.paymentStatus === "unpaid"), [approved]);
  const fullPaymentBookings = useMemo(() => bookings.filter(b => b.paymentMethod === "full"), [bookings]);
  const dpBookings = useMemo(() => bookings.filter(b => b.paymentMethod === "dp_50" || b.paymentMethod === "dp_custom"), [bookings]);

  const approvedRevenue = useMemo(() => approved.reduce((s, b) => s + b.totalPrice, 0), [approved]);
  const collectedDP = useMemo(() => approved.reduce((s, b) => s + b.amountPaid, 0), [approved]);
  const remainingReceivables = useMemo(() => approved.reduce((s, b) => s + b.remainingPayment, 0), [approved]);
  const avgBookingValue = useMemo(() => bookings.length > 0 ? Math.round(bookings.reduce((s, b) => s + b.totalPrice, 0) / bookings.length) : 0, [bookings]);

  const revenueByMonth = useMemo(() => {
    const map: Record<string, number> = {};
    approved.forEach(b => { if (b.approvedAt) { const m = b.approvedAt.substring(0, 7); map[m] = (map[m] || 0) + b.totalPrice; } });
    return Object.entries(map).sort().map(([label, value]) => ({ label, value }));
  }, [approved]);

  const comboMonthly = useMemo(() => {
    const map: Record<string, { count: number; revenue: number }> = {};
    bookings.forEach(b => {
      if (b.createdAt) {
        const m = b.createdAt.substring(0, 7);
        if (!map[m]) map[m] = { count: 0, revenue: 0 };
        map[m].count++;
        if (b.approvalStatus === "approved") map[m].revenue += b.totalPrice;
      }
    });
    return Object.entries(map).sort().map(([label, d]) => ({ label, count: d.count, revenue: d.revenue }));
  }, [bookings]);

  const stackedApproval = useMemo(() => {
    const map: Record<string, { pending: number; approved: number; rejected: number }> = {};
    bookings.forEach(b => {
      if (b.createdAt) {
        const m = b.createdAt.substring(0, 7);
        if (!map[m]) map[m] = { pending: 0, approved: 0, rejected: 0 };
        if (b.approvalStatus === "pending") map[m].pending++;
        else if (b.approvalStatus === "approved") map[m].approved++;
        else if (b.approvalStatus === "rejected") map[m].rejected++;
      }
    });
    return Object.entries(map).sort().map(([label, d]) => ({ label, ...d }));
  }, [bookings]);

  const packageRevenue = useMemo(() => {
    const map: Record<string, number> = {};
    approved.forEach(b => { map[b.packageName] = (map[b.packageName] || 0) + b.totalPrice; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }));
  }, [approved]);

  const paymentDonut = useMemo(() => [
    { label: "Lunas", value: paid.length, color: "#10b981" },
    { label: "DP Paid", value: dpPaid.length, color: "#34d399" },
    { label: "Belum Bayar", value: unpaid.length, color: "#6b7280" },
  ], [paid, dpPaid, unpaid]);

  const eventTypeData = useMemo(() => {
    const map: Record<string, number> = {};
    bookings.forEach(b => {
      const t = b.eventType === "wedding" ? (b.weddingType ? `Wedding - ${b.weddingType}` : "Wedding") : "Event";
      map[t] = (map[t] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }));
  }, [bookings]);

  const cityData = useMemo(() => {
    const map: Record<string, number> = {};
    bookings.forEach(b => { const c = b.customerCity || "Unknown"; map[c] = (map[c] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }));
  }, [bookings]);

  const addonData = useMemo(() => {
    const map: Record<string, number> = {};
    bookings.forEach(b => b.addonDetails?.forEach(a => { map[a.name] = (map[a.name] || 0) + 1; }));
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }));
  }, [bookings]);

  const couponUsage = useMemo(() => bookings.filter(b => b.couponCode).length, [bookings]);
  const totalDiscount = useMemo(() => bookings.reduce((s, b) => s + (b.discountAmount || 0), 0), [bookings]);
  const multiDay = useMemo(() => bookings.filter(b => b.days && b.days.length > 1).length, [bookings]);
  const approvalRate = useMemo(() => {
    const total = approved.length + rejected.length;
    return total > 0 ? Math.round((approved.length / total) * 100) : 0;
  }, [approved, rejected]);

  const revenueTrend = useMemo(() => {
    if (revenueByMonth.length < 2) return null;
    const last = revenueByMonth[revenueByMonth.length - 1].value;
    const prev = revenueByMonth[revenueByMonth.length - 2].value;
    if (prev === 0) return null;
    return { pct: Math.round(((last - prev) / prev) * 100), up: last >= prev };
  }, [revenueByMonth]);

  return (
    <AdminLayout bookings={bookings} packagesCount={packages.length} addonsCount={addons.length} couponsCount={coupons.length} mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen}>
      <div className="space-y-6 text-zinc-150">

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Total Booking" value={String(bookings.length)} icon={<CalendarDays className="w-4 h-4 text-zinc-400" />} color="text-white" />
          <StatCard label="Review Pending" value={String(pending.length)} icon={<TrendingUp className="w-4 h-4 text-amber-400" />} color="text-amber-500" />
          <StatCard label="Approved Orders" value={String(approved.length)} icon={<Check className="w-4 h-4 text-emerald-400" />} color="text-emerald-400" />
          <StatCard label="Approval Rate" value={`${approvalRate}%`} icon={<Percent className="w-4 h-4 text-violet-400" />} color="text-violet-400" />
        </div>

        {/* Revenue Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <StatCard
            label="Approved Revenue"
            value={`Rp ${approvedRevenue.toLocaleString("id-ID")}`}
            icon={<Coins className="w-4 h-4 text-emerald-400" />}
            trend={revenueTrend ? `${revenueTrend.pct > 0 ? "+" : ""}${revenueTrend.pct}% dari bulan lalu` : undefined}
            trendUp={revenueTrend?.up}
          />
          <StatCard
            label="DP Terkumpul"
            value={`Rp ${collectedDP.toLocaleString("id-ID")}`}
            icon={<CreditCard className="w-4 h-4 text-zinc-400" />}
          />
          <StatCard
            label="Sisa Piutang"
            value={`Rp ${remainingReceivables.toLocaleString("id-ID")}`}
            icon={<Coins className="w-4 h-4 text-amber-400" />}
            color="text-amber-500"
          />
        </div>

        {/* Row: Revenue Trend + Funnel */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <ChartCard title="Revenue per Bulan" icon={<TrendingUp className="w-3.5 h-3.5 text-emerald-400" />} subtitle="Total pendapatan dari booking yang telah disetujui" className="lg:col-span-3">
            <LineChart data={revenueByMonth} formatValue={v => v >= 1000000 ? `Rp${(v / 1000000).toFixed(1)}jt` : `Rp${(v / 1000).toFixed(0)}rb`} />
          </ChartCard>
          <ChartCard title="Approval per Bulan" icon={<TrendingUp className="w-3.5 h-3.5 text-emerald-400" />} subtitle="Distribusi status approval booking per bulan" className="lg:col-span-2">
            <StackedBar data={stackedApproval} keys={["pending", "approved", "rejected"]} colors={["#f59e0b", "#10b981", "#6b7280"]} />
          </ChartCard>
        </div>

        {/* Row: Combo + Payment Donut */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <ChartCard title="Booking & Revenue Trend" icon={<CalendarDays className="w-3.5 h-3.5 text-emerald-400" />} subtitle="Jumlah booking (bar) vs total revenue (line)" className="lg:col-span-3">
            <ComboChart data={comboMonthly} />
          </ChartCard>
          <ChartCard title="Status Pembayaran" icon={<CreditCard className="w-3.5 h-3.5 text-sky-400" />} subtitle={`${paid.length + dpPaid.length} dari ${approved.length} sudah membayar`} className="lg:col-span-2">
            <DonutChart data={paymentDonut} />
          </ChartCard>
        </div>

        {/* Row: Revenue by Package + Event Type */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard title="Revenue per Paket" icon={<Package className="w-3.5 h-3.5 text-amber-400" />} subtitle="Paket dengan kontribusi pendapatan tertinggi">
            <BarChart data={packageRevenue} color="#10b981" formatValue={v => `Rp ${(v / 1000000).toFixed(1)}jt`} />
          </ChartCard>
          <ChartCard title="Distribusi Tipe Acara" icon={<ShoppingCart className="w-3.5 h-3.5 text-violet-400" />} subtitle="Perbandingan jumlah booking per jenis acara">
            <BarChart data={eventTypeData} color="#0ea5e9" />
          </ChartCard>
        </div>

        {/* Row: Cities + Addons + Ringkasan */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <ChartCard title="Kota Customer" icon={<Users className="w-3.5 h-3.5 text-cyan-400" />} subtitle="Sebaran geografis pelanggan">
            <BarChart data={cityData} color="#22c55e" horizontal maxBars={6} height={200} />
          </ChartCard>
          <ChartCard title="Add-On Terpopuler" icon={<ShoppingCart className="w-3.5 h-3.5 text-rose-400" />} subtitle="Layanan tambahan paling sering dipilih">
            <BarChart data={addonData} color="#14b8a6" horizontal maxBars={6} height={200} />
          </ChartCard>
          <ChartCard title="Ringkasan Lainnya" icon={<Percent className="w-3.5 h-3.5 text-zinc-400" />} subtitle="Metrik tambahan">
            <div className="space-y-2.5 text-xs">
              {[
                ["Rata-rata Booking Value", `Rp ${avgBookingValue.toLocaleString("id-ID")}`, "text-emerald-400"],
                ["Multi-day Booking", String(multiDay), "text-white"],
                ["Booking Pakai Kupon", String(couponUsage), "text-white"],
                ["Total Diskon", `Rp ${totalDiscount.toLocaleString("id-ID")}`, "text-rose-400"],
                ["Kupon Aktif", `${coupons.filter(c => c.isActive).length} / ${coupons.length}`, "text-emerald-400"],
                ["Full Payment", String(fullPaymentBookings.length), "text-white"],
                ["DP Payment", String(dpBookings.length), "text-white"],
              ].map(([label, value, color], i) => (
                <div key={label} className={`flex items-center justify-between ${i > 0 ? "" : ""}`}>
                  <span className="text-zinc-400">{label}</span>
                  <span className={`font-bold font-sans ${color}`}>{value}</span>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>

      </div>
    </AdminLayout>
  );
}
