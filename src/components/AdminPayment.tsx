import React from "react";
import { Booking } from "../types";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Package, Addon, Coupon } from "../types";
import AdminLayout from "./AdminLayout";
import BookingPaymentTable from "./BookingPaymentTable";

interface Props {
  onOpenInvoice: (booking: Booking) => void;
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;
}

export default function AdminPayment({ onOpenInvoice, mobileSidebarOpen, setMobileSidebarOpen }: Props) {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [csrfToken, setCsrfToken] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = (msg: string, type: "success" | "error") => { setToast({ message: msg, type }); setTimeout(() => setToast(null), 3000); };

  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void }>({
    isOpen: false, title: "", message: "", onConfirm: () => {}
  });

  useEffect(() => {
    fetch("/api/auth/csrf").then(r => r.json()).then(d => setCsrfToken(d.csrfToken)).catch(() => {});
    fetch("/api/db").then(r => r.ok ? r.json() : Promise.reject()).then(d => { setBookings(d.bookings || []); setPackages(d.packages || []); setAddons(d.addons || []); setCoupons(d.coupons || []); }).catch(() => navigate("/admin/login"));
  }, [navigate]);

  return (
    <AdminLayout bookings={bookings} packagesCount={packages.length} addonsCount={addons.length} couponsCount={coupons.length} mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen}>
      <div className="space-y-6 animate-fade-in">
        <div className="border-b border-zinc-900 pb-4">
          <h2 className="text-xl font-bold text-white">Konfirmasi Pembayaran</h2>
          <p className="text-xs text-zinc-400 mt-1">Catat pembayaran DP atau pelunasan dari kustomer.</p>
        </div>
        <BookingPaymentTable bookings={bookings} csrfToken={csrfToken} onOpenInvoice={onOpenInvoice} showToast={showToast} setBookings={setBookings} setConfirmModal={setConfirmModal} />
      </div>
    </AdminLayout>
  );
}
