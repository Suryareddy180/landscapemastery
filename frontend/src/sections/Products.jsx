import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../lib/api";
import { PRODUCTS as FALLBACK_PRODUCTS } from "../lib/data";
import {
  Sparkles,
  ArrowRight,
  ArrowUpRight,
  Lock,
  Layers,
  Video,
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

export default function Products() {
  const [products, setProducts] = useState(FALLBACK_PRODUCTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/api/products")
      .then((res) => {
        if (res && res.products && res.products.length > 0) {
          // Defensive filter: Only keep Landscape Mastery and eliminate dummy entries
          const filtered = res.products.filter(
            (p) =>
              p.product_id === "landscape-mastery" ||
              p.id === "landscape-mastery" ||
              (p.title && p.title.toLowerCase().includes("landscape"))
          );
          if (filtered.length > 0) {
            setProducts(filtered);
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const featured =
    products.find(
      (p) =>
        p.product_id === "landscape-mastery" ||
        p.id === "landscape-mastery" ||
        (p.title && p.title.toLowerCase().includes("landscape"))
    ) || FALLBACK_PRODUCTS[0];

  return (
    <section id="products" className="relative py-24 sm:py-32 bg-[var(--bg)] overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute -top-40 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-40 left-0 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[160px] pointer-events-none" />

      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-14 sm:mb-18">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold font-mono tracking-wider uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            FLAGSHIP PRODUCT SPOTLIGHT
          </div>
          <h2 className="display-md max-w-3xl mx-auto">
            Our Premier In-House Platform: <span className="text-gradient">Landscape Mastery</span>
          </h2>
          <p className="text-muted mt-5 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
            Architected and engineered end-to-end by 3CAPSTECH — an advanced architectural edtech suite uniting spatial planning blueprinting, secure DRM video streaming, and professional landscape education.
          </p>
        </div>

        {/* Flagship Product Showcase Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
          className="relative rounded-3xl glass border border-emerald-500/30 bg-gradient-to-br from-slate-900/90 via-slate-950/95 to-slate-900/90 shadow-[0_20px_60px_-15px_rgba(16,185,129,0.18)] p-6 sm:p-10 lg:p-12 overflow-hidden"
        >
          {/* Subtle decorative grid overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.12),transparent_70%)] pointer-events-none" />

          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
            {/* Left Column: Product Branding & Features */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              {/* Logo & Headline Lockup */}
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-white p-2.5 shadow-xl shadow-emerald-500/20 ring-2 ring-emerald-500/40 flex items-center justify-center shrink-0">
                  <img
                    src="/lm_logo.png"
                    alt="Landscape Mastery Emblem"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono tracking-wider uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      FLAGSHIP PLATFORM
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white/5 text-slate-300 border border-white/10">
                      Live Architectural LMS
                    </span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-white tracking-tight">
                    {featured.title}
                  </h3>
                </div>
              </div>

              {/* Tagline / Subtitle */}
              <p className="text-emerald-400 font-medium text-sm sm:text-base mb-3">
                Architectural Masterclass & Spatial Learning Management System
              </p>

              {/* Main Description */}
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-8">
                {featured.desc ||
                  "A comprehensive learning and knowledge platform engineered by 3CAPSTECH, dedicated to professional landscape architecture, spatial planning, botanical selection, and practical environmental design."}
              </p>

              {/* 4 Feature Highlight Cards (2x2 Grid) */}
              <div className="grid sm:grid-cols-2 gap-3.5 mb-8">
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-emerald-500/40 hover:bg-emerald-500/[0.04] transition-all">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400">
                      <Layers size={16} />
                    </div>
                    <h4 className="font-semibold text-white text-sm">Spatial Blueprints</h4>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Architectural zoning, grading contours, hardscaping, and site engineering frameworks.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-emerald-500/40 hover:bg-emerald-500/[0.04] transition-all">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400">
                      <Video size={16} />
                    </div>
                    <h4 className="font-semibold text-white text-sm">DRM Video Portal</h4>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Encrypted high-definition streaming masterclass with real-time student playback tracking.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-emerald-500/40 hover:bg-emerald-500/[0.04] transition-all">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400">
                      <GraduationCap size={16} />
                    </div>
                    <h4 className="font-semibold text-white text-sm">Botanical Palettes</h4>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Curated botanical catalogs, climate micro-zone analysis, and soil compatibility matrices.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-emerald-500/40 hover:bg-emerald-500/[0.04] transition-all">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400">
                      <ShieldCheck size={16} />
                    </div>
                    <h4 className="font-semibold text-white text-sm">Role-Based Student Hub</h4>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Enterprise student authentication, administrative controls, and verified certifications.
                  </p>
                </div>
              </div>

              {/* Call to Actions */}
              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <Link
                  to="/landscapemastery"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold text-sm sm:text-base shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <span>Explore Masterclass Platform</span>
                  <ArrowRight size={18} />
                </Link>

                <Link
                  to="/landscapemastery/login"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium text-sm sm:text-base border border-white/10 hover:border-emerald-500/40 transition-all"
                >
                  <Lock size={15} className="text-emerald-400" />
                  <span>Student Login</span>
                </Link>

                <Link
                  to="/landscapemastery#courses"
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-slate-400 hover:text-emerald-400 font-medium transition-colors px-2 py-2"
                >
                  <span>View Curriculum</span>
                  <ArrowUpRight size={14} />
                </Link>
              </div>
            </div>

            {/* Right Column: Visual Mockup Showcase Window */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl border border-emerald-500/30 bg-slate-950/80 shadow-2xl overflow-hidden group">
                {/* Browser-style Window Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-white/10 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-black/50 border border-white/5 font-mono text-[11px] text-slate-300">
                    <Lock size={10} className="text-emerald-400" />
                    <span>3capstech.com/landscapemastery</span>
                  </div>
                  <span className="w-8" />
                </div>

                {/* Visual Preview Graphic */}
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-900">
                  <img
                    src="/course_thumb_landscape.jpg"
                    alt="Landscape Mastery Platform Interface"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                  {/* Floating Live Badge */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold font-mono flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      LIVE LMS PORTAL
                    </span>
                  </div>

                  {/* Bottom Preview Bar */}
                  <div className="absolute bottom-3 left-3 right-3 p-3 rounded-xl bg-slate-900/90 backdrop-blur-md border border-white/10 flex items-center justify-between">
                    <div>
                      <div className="text-white font-semibold text-xs">Full Video Curriculum</div>
                      <div className="text-[11px] text-slate-400">Architectural modules & blueprints</div>
                    </div>
                    <Link
                      to="/landscapemastery"
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 border border-emerald-500/40 text-xs font-semibold transition-all flex items-center gap-1"
                    >
                      Launch <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>

                {/* Technical Architecture Specs Strip */}
                <div className="grid grid-cols-3 divide-x divide-white/10 bg-slate-900/80 border-t border-white/10 text-center py-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">Engineered By</div>
                    <div className="text-xs font-bold text-emerald-400 mt-0.5">3CAPSTECH</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">Tech Stack</div>
                    <div className="text-xs font-bold text-white mt-0.5">Django + React</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">Security</div>
                    <div className="text-xs font-bold text-white mt-0.5">DRM & JWT</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* In-House Solutions Banner */}
        <div className="mt-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.02] border border-white/5 text-xs text-slate-400 flex-wrap justify-center">
            <Sparkles size={14} className="text-emerald-400 shrink-0" />
            <span>Looking to engineer a custom SaaS or digital learning platform for your business?</span>
            <a href="/#contact" className="text-emerald-400 font-medium hover:underline inline-flex items-center gap-1">
              Consult 3CAPSTECH <ArrowRight size={12} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
