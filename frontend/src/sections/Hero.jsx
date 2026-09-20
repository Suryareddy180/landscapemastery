import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Play, Sparkles, ChevronDown, CheckCircle2 } from "lucide-react";
import ParticleField from "../components/ParticleField";
import MagneticButton from "../components/MagneticButton";
import { HERO_CHALLENGES } from "../lib/data";

const line = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
};
const word = {
  hidden: { y: "115%" },
  show: { y: 0, transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] } },
};

export default function Hero() {
  const [activeChallenge, setActiveChallenge] = useState(0);
  const current = HERO_CHALLENGES[activeChallenge] || HERO_CHALLENGES[0];

  return (
    <section className="relative min-h-[100svh] flex items-center overflow-hidden pt-28 pb-16">
      <div className="absolute inset-0 grid-bg opacity-50" />
      <div className="absolute inset-0 opacity-80">
        <ParticleField density={55} />
      </div>
      <div className="blob w-[580px] h-[580px] -top-36 -right-24 animate-floaty" style={{ background: "var(--accent)", opacity: 0.25 }} />
      <div className="blob w-[480px] h-[480px] bottom-0 left-[-140px]" style={{ background: "var(--accent2)", opacity: 0.25 }} />

      <div className="relative z-10 mx-auto max-w-[1400px] px-4 sm:px-6 w-full">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
          <div>
            <h1 className="display-xl tracking-tight">
              <motion.span variants={line} initial="hidden" animate="show" className="block">
                {["BUILD.", "SCALE.", "INNOVATE."].map((w, i) => (
                  <span key={w} className="block overflow-hidden py-1">
                    <motion.span
                      variants={word}
                      className={`inline-block ${i === 1 ? "text-gradient" : ""}`}
                    >
                      {w}
                    </motion.span>
                  </span>
                ))}
              </motion.span>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="mt-8 max-w-2xl text-lg sm:text-xl text-muted leading-relaxed font-normal"
              data-testid="hero-subtitle"
            >
              Engineering intelligent, enterprise-grade software solutions that solve
              complex challenges and drive sustainable digital transformation.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.05 }}
              className="mt-10 flex flex-wrap items-center gap-4"
            >
              <MagneticButton
                onClick={() => document.getElementById("services")?.scrollIntoView({ behavior: "smooth" })}
                data-testid="hero-cta-solutions"
                className="group relative inline-flex items-center gap-2.5 rounded-full bg-[var(--text-primary)] text-[var(--bg)] px-8 py-4 font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Explore Solutions
                <ArrowRight size={18} className="group-hover:translate-x-1.5 transition-transform duration-300" />
              </MagneticButton>
              
              <MagneticButton
                onClick={() => document.getElementById("solutions")?.scrollIntoView({ behavior: "smooth" })}
                data-testid="hero-cta-enterprise"
                className="inline-flex items-center gap-2.5 rounded-full glass px-8 py-4 font-semibold hover:text-accent hover:border-accent/40 transition-all duration-300"
              >
                Enterprise Platforms
              </MagneticButton>

              <button
                onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
                data-testid="hero-cta-consult"
                className="inline-flex items-center gap-2.5 px-5 py-4 font-medium text-muted hover:text-text-primary transition-colors"
              >
                <span className="h-10 w-10 grid place-items-center rounded-full glass border border-line text-accent"><Play size={14} fill="currentColor" /></span>
                Book Consultation
              </button>
            </motion.div>
          </div>

          {/* Interactive Audience Problem-Solution Guide Photo Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative rounded-3xl overflow-hidden glass p-2 border border-white/10 shadow-2xl group"
          >
            <div className="relative rounded-2xl overflow-hidden h-[460px] sm:h-[500px]">
              <AnimatePresence mode="wait">
                <motion.img
                  key={current.id}
                  src={current.image}
                  alt={current.badge}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6 }}
                  className="w-full h-full object-cover brightness-[0.75]"
                />
              </AnimatePresence>

              <div className="absolute inset-0 bg-gradient-to-t from-[#0A1122] via-[#0A1122]/50 to-transparent" />
              
              {/* Interactive Problem Selector Tabs */}
              <div className="absolute top-4 left-4 right-4 flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 z-20">
                {HERO_CHALLENGES.map((item, idx) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveChallenge(idx)}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-mono font-bold uppercase transition-all backdrop-blur-md shrink-0 border ${
                      activeChallenge === idx
                        ? "bg-[#11A831] text-white border-[#11A831] shadow-lg shadow-[#11A831]/30"
                        : "bg-white/90 text-slate-800 border-slate-200/90 shadow-md hover:bg-white dark:bg-black/50 dark:text-white/70 dark:border-white/10 dark:hover:bg-black/70 dark:hover:text-white"
                    }`}
                  >
                    {item.badge}
                  </button>
                ))}
              </div>

              {/* Bottom Interactive Audience Problem & Solution Card */}
              <div className="absolute bottom-5 left-5 right-5 p-5 rounded-2xl glass bg-white/90 backdrop-blur-xl border border-white/80 shadow-2xl text-slate-900 dark:bg-black/60 dark:backdrop-blur-xl dark:border-white/10 dark:text-white z-20">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#11A831] uppercase tracking-wider mb-1.5">
                  <Sparkles size={14} className="animate-pulse" />
                  <span>DO YOU HAVE THIS CHALLENGE?</span>
                </div>
                <div className="font-display font-semibold text-base text-slate-800 dark:text-white/90 italic">
                  "{current.problem}"
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200/80 dark:border-white/10 flex items-start gap-2.5">
                  <CheckCircle2 size={18} className="text-[#11A831] shrink-0 mt-0.5" />
                  <div className="font-display font-bold text-sm text-slate-900 dark:text-white leading-snug">
                    {current.solution}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <button
                    onClick={() => document.getElementById("services")?.scrollIntoView({ behavior: "smooth" })}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-[#11A831] hover:text-[#0549B1] dark:hover:text-white transition-colors"
                  >
                    Scroll To Explore All Solutions <ChevronDown size={14} className="animate-bounce" />
                  </button>
                  <span className="text-[10px] font-mono text-slate-500 dark:text-white/40">Tap tab to switch</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
