import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { Lock, User, ArrowRight } from "lucide-react";
import api from "../lib/api";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const token = localStorage.getItem("admin_token");
  if (token) {
    return <Navigate to="/admin" replace />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/api/admin/login", { username, password });
      if (res.access) {
        localStorage.setItem("admin_token", res.access);
        navigate("/admin");
      } else {
        setError("Invalid response from server.");
      }
    } catch (err) {
      setError("Invalid username or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4">
      <div className="blob w-[500px] h-[500px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ background: "var(--accent)", opacity: 0.15 }} />
      
      <div className="glass rounded-3xl p-8 sm:p-12 w-full max-w-md relative z-10 border border-white/10 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold mb-2">Admin Portal</h1>
          <p className="text-muted">Enter your credentials to access the dashboard.</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Username</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User size={18} className="text-muted" />
              </div>
              <input
                type="text"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock size={18} className="text-muted" />
              </div>
              <input
                type="password"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent hover:bg-accent-light text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 mt-4"
          >
            {loading ? "Authenticating..." : "Login to Dashboard"}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
}
