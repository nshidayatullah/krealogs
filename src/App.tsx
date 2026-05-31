import { useState, useEffect, useCallback } from "react";
import CustomerPage from "./components/CustomerPage";
import AdminPage from "./components/AdminPage";
import AdminLogin from "./components/AdminLogin";
import InvoiceModal from "./components/InvoiceModal";
import { Booking } from "./types";
import { Users, Sliders, LogOut } from "lucide-react";
import brandLogo from "./assets/images/krealogs_logo_1780149664590.png";

export default function App() {
  const [currentView, setCurrentView] = useState<"customer" | "admin">("customer");
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  const [selectedInvoiceBooking, setSelectedInvoiceBooking] = useState<Booking | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  const checkAuth = useCallback(async () => {
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
    checkAuth();
  }, [checkAuth]);

  const handleOpenInvoice = (booking: Booking) => {
    setSelectedInvoiceBooking(booking);
    setIsInvoiceOpen(true);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setIsAdminAuthenticated(false);
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

          <div className="flex items-center space-x-3.5">
            <div className="flex items-center bg-zinc-100 p-1 rounded-xl border border-zinc-200">
              <button
                onClick={() => setCurrentView("customer")}
                className={`flex items-center space-x-1.5 px-3 py-2 sm:px-4 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  currentView === "customer"
                    ? "bg-amber-500 text-black shadow-md shadow-amber-500/10"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Halaman Customer</span>
              </button>
              
              <button
                onClick={() => setCurrentView("admin")}
                className={`flex items-center space-x-1.5 px-3 py-2 sm:px-4 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  currentView === "admin"
                    ? "bg-amber-500 text-black shadow-md shadow-amber-500/10"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Panel Admin</span>
              </button>
            </div>

            {currentView === "admin" && isAdminAuthenticated && (
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1.5 px-3 py-2 sm:px-4 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-550/25 text-rose-600 hover:text-rose-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                title="Keluar / Logout Admin"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Logout</span>
              </button>
            )}
          </div>

        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {currentView === "customer" ? (
          <CustomerPage onOpenInvoice={handleOpenInvoice} />
        ) : authLoading ? (
          <div className="flex items-center justify-center py-20 text-zinc-500 text-xs font-mono">
            Memeriksa sesi...
          </div>
        ) : isAdminAuthenticated ? (
          <AdminPage onOpenInvoice={handleOpenInvoice} />
        ) : (
          <AdminLogin onLoginSuccess={() => { setIsAdminAuthenticated(true); checkAuth(); }} />
        )}
      </main>

      <footer className="border-t border-zinc-200 py-6 text-center text-xs text-zinc-450 no-print bg-zinc-50/50">
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

    </div>
  );
}
