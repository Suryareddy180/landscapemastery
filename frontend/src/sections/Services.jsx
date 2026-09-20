import React, { useState, useEffect } from "react";
import * as Icons from "lucide-react";
import { motion } from "framer-motion";
import Reveal, { WordReveal } from "../components/Reveal";
import { SERVICES as FALLBACK_SERVICES } from "../lib/data";
import api from "../lib/api";

export default function Services() {
  const [active, setActive] = useState(0);
  const [services, setServices] = useState(FALLBACK_SERVICES);
  
  useEffect(() => {
    api.get("/api/services").then((res) => {
      if (res.services && res.services.length > 0) {
        setServices(res.services);
      }
    }).catch(console.error);
  }, []);

  return (
    <section id="services" className="relative py-24 sm:py-32 scroll-mt-24 overflow-hidden">
      <div className="blob w-[500px] h-[500px] top-20 right-[-160px]" style={{ background: "var(--accent2)", opacity: 0.25 }} />
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-14">
          <div>
            <div className="label text-accent mb-5">// What We Do</div>
            <h2 className="display-lg max-w-2xl">
              <WordReveal text="Eight disciplines," /><br />
              <WordReveal className="text-gradient" text="one obsessive standard." delay={0.15} />
            </h2>
          </div>
          <p className="text-muted max-w-sm">
            Hover or tap a panel to expand. Every engagement is engineered end-to-end by senior specialists.
          </p>
        </div>

        {/* Desktop expanding panels */}
        <div className="hidden lg:flex gap-4 h-[480px]" data-testid="services-panels">
          {services.map((s, i) => {
            const Icon = Icons[s.icon] || Icons.Circle;
            const isActive = active === i;
            return (
              <motion.div
                key={s.id}
                onMouseEnter={() => setActive(i)}
                onClick={() => setActive(i)}
                data-testid={`service-panel-${s.id}`}
                className="relative rounded-3xl overflow-hidden cursor-pointer glass group border border-white/10"
                animate={{ flex: isActive ? 5.5 : 1 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* Photography Background */}
                <div
                  className="absolute inset-0 transition-all duration-700 bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${s.image})`,
                    transform: isActive ? "scale(1.06)" : "scale(1.0)",
                    filter: isActive ? "brightness(0.48) contrast(1.1)" : "brightness(0.18) grayscale(70%)",
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050A14] via-[#050A14]/80 to-transparent opacity-90" />
                <div
                  className="absolute inset-0 opacity-0 transition-opacity duration-500"
                  style={{ opacity: isActive ? 1 : 0, background: "radial-gradient(120% 120% at 0% 100%, var(--accent-glow), transparent 60%)" }}
                />

                <div className="relative z-10 h-full p-7 flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div className={`h-12 w-12 grid place-items-center rounded-2xl transition-all duration-300 ${isActive ? "bg-accent text-white shadow-lg shadow-accent/20 scale-110" : "glass text-white/80"}`}>
                      <Icon size={22} />
                    </div>
                    <span className="font-mono text-xs font-bold text-white/60 bg-black/40 px-2.5 py-1 rounded-full backdrop-blur-md">0{i + 1}</span>
                  </div>

                  {!isActive && (
                    <div className="font-display font-bold text-lg text-white/90 tracking-wide [writing-mode:vertical-rl] rotate-180 self-center flex-1 flex items-center justify-center">
                      {s.title}
                    </div>
                  )}

                  <motion.div
                    animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 15 }}
                    transition={{ duration: 0.35, delay: isActive ? 0.15 : 0 }}
                    className="max-w-xl text-white"
                  >
                    <h3 className="display-md font-display font-extrabold text-white tracking-tight">{s.title}</h3>
                    <p className="text-white/80 mt-3 text-base leading-relaxed">{s.desc}</p>
                    
                    <div className="flex flex-wrap gap-2 mt-5">
                      {(s.tags || []).map((t) => (
                        <span key={t} className="rounded-full bg-accent/20 text-accent-light text-white font-medium border border-accent/40 px-3.5 py-1 label text-[10px] backdrop-blur-md">
                          {t}
                        </span>
                      ))}
                    </div>

                    <div className="mt-6 flex items-center gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="inline-flex items-center gap-2 rounded-full bg-accent text-white px-5 py-2.5 text-xs font-semibold hover:bg-accent/90 transition-colors shadow-md"
                      >
                        Inquire Service <Icons.ArrowUpRight size={14} />
                      </button>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Mobile / tablet cards */}
        <div className="grid sm:grid-cols-2 gap-5 lg:hidden">
          {services.map((s, i) => {
            const Icon = Icons[s.icon] || Icons.Circle;
            return (
              <Reveal key={s.id} delay={i * 0.05}>
                <div className="glass rounded-3xl overflow-hidden h-full flex flex-col border border-white/10 relative group" data-testid={`service-card-${s.id}`}>
                  <div className="relative h-44 overflow-hidden">
                    <img
                      src={s.image}
                      alt={s.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-75"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A1122] via-transparent to-black/30" />
                    <div className="absolute top-4 left-4 h-11 w-11 grid place-items-center rounded-2xl bg-accent text-white shadow-md">
                      <Icon size={20} />
                    </div>
                    <span className="absolute top-4 right-4 font-mono text-xs font-bold text-white bg-black/50 px-2.5 py-1 rounded-full backdrop-blur-md">0{i + 1}</span>
                  </div>
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-display font-bold text-xl">{s.title}</h3>
                      <p className="text-muted mt-2 leading-relaxed text-sm">{s.desc}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-5">
                      {(s.tags || []).map((t) => (
                        <span key={t} className="rounded-full bg-accent/15 text-accent border border-accent/30 px-2.5 py-1 label text-[9px] font-semibold">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
