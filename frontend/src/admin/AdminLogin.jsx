import React, { useState } from "react";
import { useNavigate, Navigate, Link } from "react-router-dom";
import { Lock, User, ArrowRight, Shield, CheckCircle, Eye, EyeOff, Sparkles } from "lucide-react";
import api, { BASE_URL } from "../lib/api";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const token = localStorage.getItem("admin_token");
  if (token) {
    return <Navigate to="/admin" replace />;
  }

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!username.trim() || !password) {
      setError("Please enter both email/username and password.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      // Send both username and email so it matches any backend schema
      const payload = {
        username: username.trim(),
        email: username.trim(),
        password: password,
      };

      const res = await api.post("/api/admin/login", payload);
      
      const authToken = res.access || res.token;
      if (authToken) {
        localStorage.setItem("admin_token", authToken);
        if (res.user) {
          localStorage.setItem("lm_auth_token", authToken);
          localStorage.setItem("lm_auth_user", JSON.stringify(res.user));
        }
        navigate("/admin");
      } else {
        setError(res.detail || res.error || "Invalid response received from authentication server.");
      }
    } catch (err) {
      console.error("Admin login error:", err);
      setError(err.message || err.data?.detail || "Invalid email/username or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-[#050A14] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden selection:bg-emerald-500 selection:text-white">
      {/* Ambient Radial Background Glows */}
      <div 
        className="absolute top-1/4 -left-20 w-[550px] h-[550px] rounded-full blur-[120px] pointer-events-none opacity-20"
        style={{ background: "radial-gradient(circle, #11A831 0%, transparent 70%)" }}
      />
      <div 
        className="absolute bottom-1/4 -right-20 w-[550px] h-[550px] rounded-full blur-[120px] pointer-events-none opacity-15"
        style={{ background: "radial-gradient(circle, #0549B1 0%, transparent 70%)" }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Back Link */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <span>← Back to 3CAPSTECH Website</span>
          </Link>
          <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400/90 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/25">
            Internal Console
          </span>
        </div>

        {/* Card Container */}
        <div className="bg-[#0B1528]/90 border border-white/10 rounded-3xl p-7 sm:p-10 shadow-2xl backdrop-blur-2xl">
          <div className="text-center mb-7">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-blue-500/10 border border-emerald-500/30 mb-4 shadow-[0_0_20px_rgba(17,168,49,0.25)]">
              <Shield size={28} className="text-emerald-400" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
              3CAPSTECH Super Admin
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1.5">
              Configure services, solutions, products, leads, and website settings.
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-3.5 rounded-xl mb-6 text-xs text-center flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Email or Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User size={16} className="text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  placeholder="admin@3capstech.com or admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock size={16} className="text-slate-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl py-3 pl-10 pr-11 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors focus:outline-none cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#11A831] to-[#0549B1] hover:brightness-110 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 mt-5 shadow-[0_0_20px_rgba(17,168,49,0.3)] cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Super Admin Console</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Production Security Footer Badge */}
          <div className="mt-7 pt-6 border-t border-white/10 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
              <Shield size={13} className="text-emerald-400" />
              <span>Multi-Factor Enterprise Authentication Active</span>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} 3CAPSTECH Enterprise Systems. Secure Internal Administration.
        </div>
      </div>
    </div>
  );
}
