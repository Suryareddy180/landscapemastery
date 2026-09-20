import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Sun, Moon, ArrowRight, Sparkles, Phone, Mail } from "lucide-react";
import { NAV } from "../lib/data";
import { useTheme } from "../context/ThemeContext";
import MagneticButton from "./MagneticButton";

function Logo({ testId = "brand-logo" }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex items-center py-1">
        <img
          src="/logo.png"
          alt="3CapsTech — We Design Future Technology"
          data-testid={testId}
          className="h-9 sm:h-10 w-auto object-contain dark:brightness-125 dark:contrast-110 drop-shadow-[0_0_12px_rgba(17,168,49,0.25)] transition-transform duration-300 hover:scale-105"
        />
      </div>
      <div className="hidden xl:flex items-center">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
          ENTERPRISE
        </span>
      </div>
    </div>
  );
}

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      data-testid="theme-toggle"
      aria-label="Toggle theme"
      className="relative h-10 w-10 grid place-items-center rounded-full bg-white/60 dark:bg-white/[0.06] border border-slate-200/90 dark:border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/10 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all duration-300 shadow-sm backdrop-blur-md"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.25 }}
        >
          {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY;
      setScrolled(scrollPos > 20);

      // Only perform section detection on company page
      if (location.pathname !== "/company") {
        setActiveSection("");
        return;
      }

      if (scrollPos < 250) {
        setActiveSection("home");
        return;
      }

      const sections = NAV.filter((n) => n.to.includes("#")).map((n) => n.to.split("#")[1]);
      let current = "home";
      for (const id of sections) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 240) {
            current = id;
          }
        }
      }
      setActiveSection(current);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location.pathname]);

  const go = (to) => {
    setOpen(false);
    if (to === "/") {
      navigate("/");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (to === "/company") {
      if (location.pathname !== "/company") {
        navigate("/company");
        setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 100);
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      setActiveSection("home");
      return;
    }

    if (to.includes("#")) {
      const parts = to.split("#");
      const targetPath = parts[0] || "/company";
      const id = parts[1];
      setActiveSection(id);
      if (location.pathname !== targetPath) {
        navigate(targetPath + "#" + id);
        setTimeout(() => {
          document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
        }, 350);
      } else {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      navigate(to);
      window.scrollTo({ top: 0 });
    }
  };

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-[900] transition-all duration-300 backdrop-blur-2xl ${
          scrolled
            ? "h-16 bg-white/95 dark:bg-[#050A14]/95 border-b border-slate-200/90 dark:border-white/10 shadow-[0_10px_35px_rgba(0,0,0,0.5)]"
            : "h-[74px] bg-white/85 dark:bg-[#050A14]/85 border-b border-slate-200/60 dark:border-white/[0.08] shadow-[0_4px_25px_rgba(0,0,0,0.25)]"
        }`}
      >
        {/* Bottom subtle radiant accent border line */}
        <div className="absolute bottom-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent opacity-80" />

        <div className="mx-auto max-w-[1400px] h-full px-4 sm:px-6 flex items-center justify-between">
          {/* Brand Logo */}
          <button onClick={() => go("/company")} data-testid="nav-home-logo" className="cursor-pointer text-left focus:outline-none">
            <Logo />
          </button>

          {/* Central Navigation Dock */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100/70 dark:bg-white/[0.04] p-1.5 rounded-full border border-slate-200/70 dark:border-white/10 shadow-inner backdrop-blur-md">
            {NAV.map((n) => {
              const isLinkActive =
                n.to === "/company"
                  ? location.pathname === "/company" && activeSection === "home"
                  : n.to === "/"
                  ? location.pathname === "/"
                  : n.to.includes("#")
                  ? location.pathname === "/company" && activeSection === n.to.split("#")[1]
                  : location.pathname === n.to;

              return (
                <button
                  key={n.label}
                  onClick={() => go(n.to)}
                  data-testid={`nav-link-${n.label.toLowerCase()}`}
                  className={`relative px-3.5 py-1.5 text-[13.5px] font-semibold tracking-wide transition-all duration-200 rounded-full flex items-center gap-1.5 focus:outline-none ${
                    isLinkActive
                      ? "text-emerald-700 dark:text-emerald-300 bg-white dark:bg-emerald-500/20 shadow-[0_2px_10px_rgba(0,0,0,0.08)] dark:shadow-[0_0_15px_rgba(17,168,49,0.25)] border border-emerald-500/30"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/[0.08]"
                  }`}
                >
                  {isLinkActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981] animate-pulse" />
                  )}
                  {n.label}
                </button>
              );
            })}
          </nav>

          {/* Right Action Cluster */}
          <div className="flex items-center gap-3">
            <ThemeToggle />

            <MagneticButton
              onClick={() => go("/#contact")}
              data-testid="nav-cta-consult"
              className="hidden sm:inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-all duration-300 shadow-[0_0_20px_rgba(17,168,49,0.35)] hover:shadow-[0_0_28px_rgba(17,168,49,0.55)] hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-[#11A831] via-[#0549B1] to-[#11A831] bg-[length:200%_auto] hover:bg-right"
            >
              <Sparkles size={14} className="text-emerald-200 animate-pulse" />
              <span>Book Consultation</span>
              <ArrowRight size={14} className="opacity-90 transition-transform group-hover:translate-x-1" />
            </MagneticButton>

            <button
              className="lg:hidden h-10 w-10 grid place-items-center rounded-full bg-white/70 dark:bg-white/[0.08] border border-slate-200 dark:border-white/15 text-slate-800 dark:text-slate-100 hover:text-emerald-500 transition-colors focus:outline-none"
              onClick={() => setOpen(true)}
              data-testid="nav-mobile-open"
              aria-label="Open menu"
            >
              <Menu size={19} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Slide-Out Drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[1000] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-black/75 backdrop-blur-md"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 280, damping: 30 }}
              className="absolute right-0 top-0 h-full w-[85%] max-w-sm bg-[#060D1A] border-l border-white/15 p-6 flex flex-col justify-between shadow-2xl overflow-y-auto"
              data-testid="nav-mobile-panel"
            >
              <div>
                <div className="flex items-center justify-between pb-5 border-b border-white/10 mb-6">
                  <Logo testId="brand-logo-mobile" />
                  <button
                    onClick={() => setOpen(false)}
                    data-testid="nav-mobile-close"
                    className="h-10 w-10 grid place-items-center rounded-full bg-white/5 border border-white/10 text-slate-200 hover:text-white"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 mb-3 px-2">
                  Navigation
                </div>

                <nav className="flex flex-col gap-1.5">
                  {NAV.map((n, i) => {
                    const isLinkActive =
                      n.to === "/company"
                        ? location.pathname === "/company" && activeSection === "home"
                        : n.to === "/"
                        ? location.pathname === "/"
                        : n.to.includes("#")
                        ? location.pathname === "/company" && activeSection === n.to.split("#")[1]
                        : location.pathname === n.to;
                    return (
                      <motion.button
                        key={n.label}
                        initial={{ opacity: 0, x: 25 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 + i * 0.04 }}
                        onClick={() => go(n.to)}
                        data-testid={`nav-mobile-link-${n.label.toLowerCase()}`}
                        className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-left text-base font-semibold transition-all ${
                          isLinkActive
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-[0_0_15px_rgba(17,168,49,0.2)]"
                            : "text-slate-300 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <span className="font-mono text-xs text-slate-500">0{i + 1}</span>
                          <span>{n.label}</span>
                        </span>
                        {isLinkActive && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
                        )}
                      </motion.button>
                    );
                  })}
                </nav>
              </div>

              <div className="pt-6 border-t border-white/10 space-y-4">
                <div className="space-y-2 text-xs font-mono text-slate-400">
                  <a
                    href="mailto:md.3capstech@gmail.com"
                    className="flex items-center gap-2 hover:text-emerald-400 transition-colors"
                  >
                    <Mail size={14} className="text-emerald-400" />
                    md.3capstech@gmail.com
                  </a>
                  <a
                    href="tel:+919440999908"
                    className="flex items-center gap-2 hover:text-emerald-400 transition-colors"
                  >
                    <Phone size={14} className="text-emerald-400" />
                    +91 94409 99908
                  </a>
                </div>

                <button
                  onClick={() => go("/company#contact")}
                  className="w-full rounded-full bg-gradient-to-r from-[#11A831] via-[#0549B1] to-[#11A831] text-white px-6 py-3.5 font-semibold text-center flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(17,168,49,0.35)]"
                >
                  <Sparkles size={16} className="text-emerald-200" />
                  <span>Book Consultation</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

