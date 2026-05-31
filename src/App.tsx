import { useState, useEffect, useCallback } from "react";
import CustomerPage from "./components/CustomerPage";
import AdminPage from "./components/AdminPage";
import AdminLogin from "./components/AdminLogin";
import InvoiceModal from "./components/InvoiceModal";
import { Booking } from "./types";
import { LogOut } from "lucide-react";
import brandLogo from "./assets/images/krealogs_logo_1780149664590.png";

export default function App() {
  const [currentView, setCurrentView] = useState<"customer" | "admin">("customer");
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

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
    const path = window.location.pathname;
    if (path === "/admin/login" || path === "/admin") {
      setCurrentView("admin");
      checkAuth();
    }
  }, [checkAuth]);

  const navigate = (path: string) => {
    window.history.pushState(null, "", path);
    if (path.startsWith("/admin")) {
      setCurrentView("admin");
      checkAuth();
    } else {
      setCurrentView("customer");
    }
  };

  const handleOpenInvoice = (booking: Booking) => {
    setSelectedInvoiceBooking(booking);
    setIsInvoiceOpen(true);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setIsAdminAuthenticated(false);
    navigate("/");
  };

  const handleLoginSuccess = () => {
    setIsAdminAuthenticated(true);
    navigate("/admin");
  };

  return (
    <div className="min-h-screen flex flex-col justify-between font-sans bg-[#fcfcfd] text-[#09090b]">
      
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-zinc-200 no-print">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          
          <div className="flex items-center select-none">
            <img
              src={brandLogo}
              alt="Krealogs Logo"
              className="h-8 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="flex items-center">
            {currentView === "admin" && isAdminAuthenticated && (
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-550/25 text-rose-600 hover:text-rose-700 transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            )}
          </div>

        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {currentView === "customer" ? (
          <CustomerPage onOpenInvoice={handleOpenInvoice} />
        ) : authLoading ? (
          <div className="flex items-center justify-center py-20 text-zinc-500 text-xs font-mono">Memeriksa sesi...</div>
        ) : isAdminAuthenticated ? (
          <AdminPage onOpenInvoice={handleOpenInvoice} />
        ) : (
          <AdminLogin onLoginSuccess={handleLoginSuccess} />
        )}
      </main>

      <footer className="border-t border-zinc-200 py-6 text-center text-xs text-zinc-450 no-print bg-zinc-50/50">
        <p>© 2026 Krealogs.com Videography. Semua Hak Cipta Dilindungi Undang-Undang.</p>
        <p className="mt-2">
          <a
            href="/admin/login"
            onClick={(e) => { e.preventDefault(); navigate("/admin/login"); }}
            className="text-zinc-400 hover:text-zinc-700 transition-colors"
          >Admin</a>
        </p>
      </footer>

      <InvoiceModal
        booking={selectedInvoiceBooking}
        isOpen={isInvoiceOpen}
        onClose={() => {
          setIsInvoiceOpen(false);
          setSelectedInvoiceBooking(null);
        }}
      />

    </div>
  );
}
