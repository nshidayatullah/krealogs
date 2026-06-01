import { useState, useEffect, useCallback } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import CustomerPage from "./components/CustomerPage";
import AdminLogin from "./components/AdminLogin";
import AdminApproval from "./components/AdminApproval";
import AdminPayment from "./components/AdminPayment";
import AdminPackages from "./components/AdminPackages";
import AdminAddons from "./components/AdminAddons";
import AdminCoupons from "./components/AdminCoupons";
import AdminDashboard from "./components/AdminDashboard";
import AdminRecap from "./components/AdminRecap";
import InvoiceModal from "./components/InvoiceModal";
import Toast from "./components/Toast";
import { Booking } from "./types";
import { LogOut } from "lucide-react";


function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [selectedInvoiceBooking, setSelectedInvoiceBooking] = useState<Booking | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  const checkAuth = useCallback(async () => {
    setAuthLoading(true);
    try {
      const res = await fetch("/api/auth/check");
      const data = await res.json();
      setIsAdminAuthenticated(data.authenticated === true);
    } catch {
      setIsAdminAuthenticated(false);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdminRoute) checkAuth();
    else setAuthLoading(false);
  }, [isAdminRoute, checkAuth]);

  useEffect(() => {
    if (!authLoading && isAdminRoute && !isAdminAuthenticated && location.pathname !== "/admin/login") {
      navigate("/admin/login", { replace: true });
    }
  }, [authLoading, isAdminRoute, isAdminAuthenticated, navigate, location.pathname]);

  const handleOpenInvoice = (booking: Booking) => {
    setSelectedInvoiceBooking(booking);
    setIsInvoiceOpen(true);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setIsAdminAuthenticated(false);
    navigate("/admin/login", { replace: true });
  };

  const handleLoginSuccess = () => {
    setIsAdminAuthenticated(true);
    navigate("/admin", { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col justify-between font-sans bg-[#fcfcfd] text-[#09090b]">
      
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-zinc-200 no-print">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          
          <div className="flex items-center gap-3 select-none">
            {isAdminRoute && isAdminAuthenticated && (
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden p-2 bg-zinc-100 hover:bg-zinc-200 rounded-xl text-zinc-600 transition cursor-pointer"
                aria-label="Buka menu"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
            )}
            <img
              src="/krealogs_logo.png"
              alt="Krealogs Logo"
              className="h-8 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="flex items-center">
            {isAdminRoute && isAdminAuthenticated && (
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            )}
          </div>

        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <Routes>
          <Route path="/" element={<CustomerPage onOpenInvoice={handleOpenInvoice} />} />
          <Route path="/admin/login" element={
            authLoading ? (
              <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div></div>
            ) : isAdminAuthenticated ? (
              <Navigate to="/admin/approval" replace />
            ) : (
              <AdminLogin onLoginSuccess={handleLoginSuccess} />
            )
          } />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={
            authLoading ? (
              <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div></div>
            ) : isAdminAuthenticated ? (
              <AdminDashboard onOpenInvoice={handleOpenInvoice} mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen} />
            ) : (
              <Navigate to="/admin/login" replace />
            )
          } />
          <Route path="/admin/approval" element={
            authLoading ? (
              <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div></div>
            ) : isAdminAuthenticated ? (
              <AdminApproval onOpenInvoice={handleOpenInvoice} mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen} />
            ) : (
              <Navigate to="/admin/login" replace />
            )
          } />
          <Route path="/admin/payment" element={
            authLoading ? (
              <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div></div>
            ) : isAdminAuthenticated ? (
              <AdminPayment onOpenInvoice={handleOpenInvoice} mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen} />
            ) : (
              <Navigate to="/admin/login" replace />
            )
          } />
          <Route path="/admin/packages" element={
            authLoading ? (
              <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div></div>
            ) : isAdminAuthenticated ? (
              <AdminPackages onOpenInvoice={handleOpenInvoice} mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen} />
            ) : (
              <Navigate to="/admin/login" replace />
            )
          } />
          <Route path="/admin/addons" element={
            authLoading ? (
              <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div></div>
            ) : isAdminAuthenticated ? (
              <AdminAddons onOpenInvoice={handleOpenInvoice} mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen} />
            ) : (
              <Navigate to="/admin/login" replace />
            )
          } />
          <Route path="/admin/coupons" element={
            authLoading ? (
              <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div></div>
            ) : isAdminAuthenticated ? (
              <AdminCoupons onOpenInvoice={handleOpenInvoice} mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen} />
            ) : (
              <Navigate to="/admin/login" replace />
            )
          } />
          <Route path="/admin/recap" element={
            authLoading ? (
              <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div></div>
            ) : isAdminAuthenticated ? (
              <AdminRecap onOpenInvoice={handleOpenInvoice} mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen} />
            ) : (
              <Navigate to="/admin/login" replace />
            )
          } />
        </Routes>
      </main>

      <footer className="border-t border-zinc-200 py-6 text-center text-xs text-zinc-400 no-print">
        <p>© 2026 Krealogs.com Videography. Semua Hak Cipta Dilindungi Undang-Undang.</p>
      </footer>

      <InvoiceModal
        booking={selectedInvoiceBooking}
        isOpen={isInvoiceOpen}
        onClose={() => {
          setIsInvoiceOpen(false);
          setSelectedInvoiceBooking(null);
        }}
      />

      <Toast
        message={toast?.message || ""}
        type={toast?.type || "success"}
        visible={!!toast}
        onClose={() => setToast(null)}
      />

    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
