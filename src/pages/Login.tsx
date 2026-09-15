import { useState } from "react";
import { login, type AuthUser } from "../services/apiService";

interface LoginProps {
  onLogin: (user: AuthUser) => void;
  onBack: () => void;
}

export default function Login({ onLogin, onBack }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    try {
      const user = await login(email, password);
      onLogin(user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
      setLoading(false);
    }
  };

  return (
    <div className="sc-auth min-h-full bg-slate-50 flex flex-col">
      {/* Top bar */}
      <div className="px-8 py-5 flex items-center gap-4 border-b border-slate-200 bg-white">
        <button onClick={onBack} className="text-slate-400 hover:text-slate-700 transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#0F172A] flex items-center justify-center">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="font-semibold text-slate-900 text-sm">Smart Cash</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-1">Sign in</h2>
            <p className="text-slate-500 text-sm">Shared cash management</p>
          </div>

          {/* Login form */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@smartcash.id"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-red-700 text-xs">
                  <svg className="shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
              >
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </form>
          </div>

          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2.5">
            <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Akun Demo</div>
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-400">Admin</span>
                <span className="font-mono bg-white border border-slate-200 rounded px-2 py-0.5">azka@student.ac.id</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-400">Member</span>
                <span className="font-mono bg-white border border-slate-200 rounded px-2 py-0.5">ahmad@student.ac.id</span>
              </div>
              <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-200 mt-1">
                <span className="text-slate-400">Password member</span>
                <span className="font-mono bg-white border border-slate-200 rounded px-2 py-0.5">demo1234</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
