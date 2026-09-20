import React from "react";
import { Navigate, Outlet, Link, useNavigate } from "react-router-dom";
import { LogOut, Globe, Shield, ExternalLink } from "lucide-react";

export default function AdminLayout() {
  const token = localStorage.getItem("admin_token");
  const navigate = useNavigate();

  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen bg-[#050A14] text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Top Admin Header Bar */}
      <header className="sticky top-0 z-50 bg-[#060D1A]/95 border-b border-white/10 backdrop-blur-xl h-16 px-4 sm:px-8 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <Link to="/admin" className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="3CAPSTECH"
              className="h-8 w-auto object-contain brightness-125 drop-shadow-[0_0_8px_rgba(17,168,49,0.3)]"
            />
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_#10b981]" />
              ADMIN CONSOLE
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/company"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-all"
          >
            <Globe size={13} className="text-emerald-400" />
            <span className="hidden md:inline">Company Site</span>
            <ExternalLink size={11} className="opacity-60" />
          </Link>

          <Link
            to="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-all"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="hidden md:inline">Landscape Mastery</span>
            <ExternalLink size={11} className="opacity-60" />
          </Link>

          <Link
            to="/?view=admin"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs font-semibold text-emerald-300 hover:text-white transition-all"
          >
            <Shield size={13} className="text-emerald-400" />
            <span className="hidden sm:inline">LM Admin</span>
          </Link>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs font-mono text-slate-300">
            <Shield size={13} className="text-emerald-400" />
            <span>Administrator</span>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 text-xs font-semibold transition-all"
            title="Log out of admin"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-8 max-w-[1600px] w-full mx-auto">
        <Outlet />
      </main>
    </div>
  );
}

