import React, { useState } from "react";
import { Lock, User, LogIn, AlertCircle } from "lucide-react";
import brandLogo from "../assets/images/krealogs_logo_1780149664590.png";

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

export default function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Username dan password wajib diisi");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onLoginSuccess();
      } else {
        setError(data.error || "Kombinasi Username dan Password tidak cocok.");
        setIsLoading(false);
      }
    } catch {
      setError("Terjadi kesalahan koneksi ke server");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src={brandLogo} alt="Krealogs" className="h-8 mx-auto mb-6 object-contain" referrerPolicy="no-referrer" />
          <h1 className="text-xl font-semibold text-zinc-900">Admin</h1>
          <p className="text-sm text-zinc-500 mt-1">Masuk ke panel manajemen</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                disabled={isLoading}
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-lg focus:outline-none text-sm text-zinc-900 placeholder-zinc-400"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="password"
                disabled={isLoading}
                placeholder="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-lg focus:outline-none text-sm text-zinc-900 placeholder-zinc-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg text-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:bg-zinc-300 disabled:text-zinc-500"
          >
            {isLoading ? "Memproses..." : (
              <>
                <LogIn className="w-4 h-4" />
                Masuk
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
