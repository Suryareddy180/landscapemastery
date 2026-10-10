import React, { useState } from "react";
import { motion } from "framer-motion";
import * as Icons from "lucide-react";
import {
  Code2,
  Cloud,
  Sparkles,
  Smartphone,
  Building2,
  Palette,
  Database,
  Compass,
} from "lucide-react";
import { WordReveal } from "../components/Reveal";

const ICON_MAP = {
  Code2,
  Cloud,
  Sparkles,
  Smartphone,
  Building2,
  Palette,
  Database,
  Compass,
};

const CAPABILITIES = [
  // Inner Ring (r: 130px, 4 items spaced evenly by 90°)
  { id: "software", label: "Software Engineering", icon: "Code2", ring: 0, angle: 0 },
  { id: "cloud", label: "Cloud VPS", icon: "Cloud", ring: 0, angle: 90 },
  { id: "ai", label: "AI Solutions", icon: "Sparkles", ring: 0, angle: 180 },
  { id: "mobile", label: "Mobile Apps", icon: "Smartphone", ring: 0, angle: 270 },

  // Outer Ring (r: 215px, 4 items staggered by 45° offset)
  { id: "erp", label: "Enterprise ERP", icon: "Building2", ring: 1, angle: 45 },
  { id: "uiux", label: "UI / UX Design", icon: "Palette", ring: 1, angle: 135 },
  { id: "db", label: "Database Architecture", icon: "Database", ring: 1, angle: 225 },
  { id: "consulting", label: "IT Consulting", icon: "Compass", ring: 1, angle: 315 },
];

export default function TechOrbit() {
  const [activeCap, setActiveCap] = useState(null);

  const innerItems = CAPABILITIES.filter((c) => c.ring === 0);
  const outerItems = CAPABILITIES.filter((c) => c.ring === 1);

  return (
    <section className="relative py-24 sm:py-32 overflow-hidden">
      {/* Ambient background glow */}
      <div className="blob w-[500px] h-[500px] top-1/4 right-[-140px] pointer-events-none" style={{ background: "var(--accent)", opacity: 0.16 }} />

      <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column: Heading, description, and capability chips */}
          <div>
            <div className="inline-flex items-center gap-2 label text-accent mb-4 font-semibold px-3 py-1.5 rounded-full glass border border-line">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse shadow-[0_0_8px_#11A831]" />
              // Capabilities &amp; Tech Stack
            </div>
            <h2 className="display-lg">
              <WordReveal text="Built to move at" /><br />
              <WordReveal className="text-gradient" text="the speed of ideas." delay={0.15} />
            </h2>
            <p className="mt-6 text-muted text-base sm:text-lg leading-relaxed max-w-lg">
              From intelligent automation and resilient cloud infrastructure to refined design systems and data engineering — our capabilities span the entire product lifecycle, so you ship faster with confidence.
            </p>

            <div className="mt-8 flex flex-wrap gap-2.5" data-testid="tech-chips">
              {CAPABILITIES.map((c) => {
                const Icon = ICON_MAP[c.icon] || Code2;
                const isSelected = activeCap === c.id;
                return (
                  <button
                    key={c.id}
                    onMouseEnter={() => setActiveCap(c.id)}
                    onMouseLeave={() => setActiveCap(null)}
                    className={`glass rounded-full px-4 py-2 font-mono text-xs sm:text-sm flex items-center gap-2 border transition-all cursor-pointer ${
                      isSelected
                        ? "border-accent text-accent bg-accent/15 shadow-[0_0_15px_rgba(17,168,49,0.25)] -translate-y-0.5"
                        : "border-line text-muted hover:text-ink hover:border-accent/40 hover:-translate-y-0.5"
                    }`}
                  >
                    <Icon size={14} className={isSelected ? "text-accent" : "text-muted"} />
                    <span>{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Planetary Orbit Visualization */}
          <div className="relative grid place-items-center h-[480px] sm:h-[540px] w-full" data-testid="tech-orbit">
            {/* Concentric Orbital Tracks */}
            <div className="absolute h-[430px] w-[430px] rounded-full border border-line/60 pointer-events-none" />
            <div className="absolute h-[260px] w-[260px] rounded-full border border-line/50 pointer-events-none" />
            <div className="absolute h-[160px] w-[160px] rounded-full border border-emerald-500/20 pointer-events-none" />
            <div className="blob w-[280px] h-[280px] pointer-events-none" style={{ background: "var(--accent)", opacity: 0.22 }} />

            {/* Central 3CapsTech Core */}
            <div className="relative z-20 h-24 w-28 rounded-3xl glass grid place-items-center shadow-[0_0_40px_rgba(17,168,49,0.25)] border border-emerald-500/30 p-2.5">
              <img
                src="/logo.png"
                alt="3CapsTech Logo"
                className="h-10 sm:h-11 w-auto object-contain dark:[filter:drop-shadow(0_0_1px_rgba(255,255,255,0.9))_drop-shadow(0_0_8px_rgba(17,168,49,0.35))]"
              />
            </div>

            {/* Inner Orbit (Clockwise revolution, 38s duration) */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              animate={{ rotate: 360 }}
              transition={{ duration: 38, repeat: Infinity, ease: "linear" }}
            >
              {innerItems.map((item) => {
                const Icon = ICON_MAP[item.icon] || Code2;
                const rad = (item.angle * Math.PI) / 180;
                const radius = 130;
                const x = Math.cos(rad) * radius;
                const y = Math.sin(rad) * radius;
                const isSelected = activeCap === item.id;

                return (
                  <div
                    key={item.id}
                    className="absolute pointer-events-auto"
                    style={{
                      left: `calc(50% + ${x}px)`,
                      top: `calc(50% + ${y}px)`,
                      transform: "translate(-50%, -50%)",
                    }}
                    onMouseEnter={() => setActiveCap(item.id)}
                    onMouseLeave={() => setActiveCap(null)}
                  >
                    {/* Counter-rotation to keep node 100% upright and level */}
                    <motion.div
                      animate={{ rotate: -360 }}
                      transition={{ duration: 38, repeat: Infinity, ease: "linear" }}
                    >
                      <div
                        className={`glass rounded-2xl px-3.5 py-1.5 flex items-center gap-2 border transition-all duration-300 shadow-md ${
                          isSelected
                            ? "border-accent bg-accent/20 text-accent shadow-[0_0_18px_rgba(17,168,49,0.35)] scale-110"
                            : "border-line hover:border-accent/50 text-slate-200 hover:scale-105"
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
                        <Icon size={14} className="text-accent shrink-0" />
                        <span className="font-mono text-xs font-semibold whitespace-nowrap">{item.label}</span>
                      </div>
                    </motion.div>
                  </div>
                );
              })}
            </motion.div>

            {/* Outer Orbit (Counter-clockwise revolution, 52s duration) */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              animate={{ rotate: -360 }}
              transition={{ duration: 52, repeat: Infinity, ease: "linear" }}
            >
              {outerItems.map((item) => {
                const Icon = ICON_MAP[item.icon] || Code2;
                const rad = (item.angle * Math.PI) / 180;
                const radius = 215;
                const x = Math.cos(rad) * radius;
                const y = Math.sin(rad) * radius;
                const isSelected = activeCap === item.id;

                return (
                  <div
                    key={item.id}
                    className="absolute pointer-events-auto"
                    style={{
                      left: `calc(50% + ${x}px)`,
                      top: `calc(50% + ${y}px)`,
                      transform: "translate(-50%, -50%)",
                    }}
                    onMouseEnter={() => setActiveCap(item.id)}
                    onMouseLeave={() => setActiveCap(null)}
                  >
                    {/* Counter-rotation to keep node 100% upright and level */}
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 52, repeat: Infinity, ease: "linear" }}
                    >
                      <div
                        className={`glass rounded-2xl px-3.5 py-1.5 flex items-center gap-2 border transition-all duration-300 shadow-md ${
                          isSelected
                            ? "border-accent bg-accent/20 text-accent shadow-[0_0_18px_rgba(17,168,49,0.35)] scale-110"
                            : "border-line hover:border-accent/50 text-slate-200 hover:scale-105"
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_6px_#60a5fa]" />
                        <Icon size={14} className="text-accent2 shrink-0" />
                        <span className="font-mono text-xs font-semibold whitespace-nowrap">{item.label}</span>
                      </div>
                    </motion.div>
                  </div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
