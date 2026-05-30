import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  LogIn, 
  AlertCircle, 
  KeyRound, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck
} from "lucide-react";
const brandLogo = "/src/assets/images/krealogs_logo_1780149664590.png";

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

export default function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [shake, setShake] = useState(false);

  // Default credentials for easier evaluation/usage
  const DEFAULT_USER = "admin";
  const DEFAULT_PASS = "admin123";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setShake(false);

    if (!username.trim() || !password.trim()) {
      setError("Username dan password wajib diisi");
      triggerShake();
      return;
    }

    setIsLoading(true);

    // Simulate authenticating for realistic premium response
    setTimeout(() => {
      if (username.toLowerCase() === DEFAULT_USER && password === DEFAULT_PASS) {
        setIsSuccess(true);
        setTimeout(() => {
          setIsLoading(false);
          // Save session in local storage for persistence
          localStorage.setItem("kreasi_admin_logged_in", "true");
          onLoginSuccess();
        }, 1000);
      } else {
        setIsLoading(false);
        setError("Kombinasi Username dan Password Anda tidak cocok.");
        triggerShake();
      }
    }, 1200);
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleAutofill = () => {
    setUsername(DEFAULT_USER);
    setPassword(DEFAULT_PASS);
    setError("");
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center py-6 px-4">
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full filter blur-3xl opacity-40 select-none pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-zinc-900/40 rounded-full filter blur-3xl opacity-40 select-none pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md bg-[#0c0c0e] border border-zinc-850 rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden"
      >
        {/* Subtle top amber border highlight */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-linear-to-r from-amber-600 via-amber-500 to-amber-400"></div>

        <div className="space-y-6 text-center">
          {/* Logo container */}
          <div className="mx-auto h-10 flex items-center justify-center select-none">
            {isSuccess ? (
              <ShieldCheck className="w-7 h-7 text-emerald-600 animate-pulse" />
            ) : (
              <img
                src={brandLogo}
                alt="Krealogs Logo"
                className="h-full w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            )}
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-light tracking-tight text-white font-sans">
              Admin <span className="italic font-serif text-amber-500 font-normal">Login Portal</span>
            </h2>
            <p className="text-xs text-zinc-400">
              Silakan masukkan kredensial untuk mengakses panel manajemen Krealogs.com.
            </p>
          </div>
        </div>

        {/* Shake-able login form */}
        <motion.form 
          animate={shake ? { x: [-10, 10, -10, 10, -5, 5, 0] } : {}}
          transition={{ duration: 0.5 }}
          onSubmit={handleLogin} 
          className="mt-8 space-y-5"
        >
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="p-3 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl text-xs flex items-center gap-2 font-sans"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {isSuccess && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs flex items-center gap-2 font-sans"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Otorisasi berhasil! Membuka gerbang admin...</span>
            </motion.div>
          )}

          {/* Username Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-405 text-zinc-400 block font-mono uppercase tracking-wider">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                id="login-username"
                type="text"
                disabled={isLoading || isSuccess}
                placeholder="cth: admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 rounded-xl focus:outline-none transition text-xs text-white placeholder-zinc-650"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-zinc-400 block font-mono uppercase tracking-wider">
                Materi Sandi / Password
              </label>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                disabled={isLoading || isSuccess}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-11 py-3 bg-zinc-950 border border-zinc-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 rounded-xl focus:outline-none transition text-xs text-white placeholder-zinc-650"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-zinc-300 transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember state / action links */}
          <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1">
            <label className="flex items-center space-x-2 cursor-pointer select-none">
              <input 
                type="checkbox" 
                defaultChecked 
                className="rounded bg-zinc-950 border-zinc-800 text-amber-500 focus:ring-amber-500/30 h-3.5 w-3.5"
              />
              <span>Ingat Sesi Perangkat</span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || isSuccess}
            className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-xl text-xs uppercase tracking-wider transition-transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:bg-zinc-800 disabled:text-zinc-500"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin -ml-1 mr-1 h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Otorisasi Server...
              </span>
            ) : (
              <>
                <span>Masuk Panel Admin</span>
                <LogIn className="w-4 h-4" />
              </>
            )}
          </button>
        </motion.form>

        {/* Demo Credentials quick access hint block */}
        <div className="mt-8 pt-6 border-t border-zinc-900/80 space-y-3.5">
          <div className="flex items-center gap-2 text-zinc-400 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="font-semibold text-[11px] uppercase tracking-wider text-zinc-450 font-mono">Petunjuk Akses Evaluasi</span>
          </div>

          <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">CREDENTIALS DEMO</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-zinc-350">
                <span>User: <strong className="text-amber-400 font-mono">admin</strong></span>
                <span className="text-zinc-700">•</span>
                <span>Pass: <strong className="text-amber-400 font-mono">admin123</strong></span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleAutofill}
              className="text-[10px] px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-500/40 text-amber-500 rounded-lg font-bold uppercase tracking-wider transition cursor-pointer shrink-0 self-start sm:self-center"
            >
              Instan Isi
            </button>
          </div>
        </div>

      </motion.div>
    </div>
  );
}
