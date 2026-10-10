import React, { useState } from "react";
import * as Icons from "lucide-react";
import { CheckCircle2, ArrowRight, Sparkles, Shield, Clock, Workflow } from "lucide-react";
import Reveal, { WordReveal } from "../components/Reveal";
import MagneticButton from "../components/MagneticButton";
import { DEVELOPMENT_PROCESS } from "../lib/data";

const ICON_MAP = {
  FileSearch: Icons.FileSearch || Icons.Search,
  Layers: Icons.Layers,
  Palette: Icons.Palette,
  Code2: Icons.Code2,
  ShieldCheck: Icons.ShieldCheck,
  Rocket: Icons.Rocket,
  LifeBuoy: Icons.LifeBuoy,
  TrendingUp: Icons.TrendingUp,
};

export default function DevelopmentProcess() {
  const [activeStep, setActiveStep] = useState(null);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="process" className="relative py-24 sm:py-32 scroll-mt-24 overflow-hidden">
      {/* Background Grids & Ambient Glow Blobs */}
      <div className="absolute inset-0 grid-bg opacity-35 pointer-events-none" />
      <div
        className="blob w-[520px] h-[520px] top-1/4 -left-48 pointer-events-none"
        style={{ background: "var(--accent)", opacity: 0.16 }}
      />
      <div
        className="blob w-[520px] h-[520px] bottom-1/4 -right-48 pointer-events-none"
        style={{ background: "var(--accent2)", opacity: 0.16 }}
      />

      {/* Hairline Edge Separators */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-line to-transparent opacity-60" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-line to-transparent opacity-60" />

      <div className="relative mx-auto max-w-[1400px] px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-14">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 label text-accent mb-4 font-semibold px-3 py-1.5 rounded-full glass border border-line">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse shadow-[0_0_8px_#11A831]" />
              // Structured Execution
            </div>
            <h2 className="display-lg">
              <WordReveal text="Our end-to-end" /><br className="hidden sm:inline" />{" "}
              <WordReveal className="text-gradient" text="development process." delay={0.15} />
            </h2>
            <p className="mt-4 text-muted text-base sm:text-lg leading-relaxed">
              A battle-tested software engineering lifecycle designed to ensure transparency, exceptional code quality, and on-time delivery across every sprint.
            </p>
          </div>

          {/* Lifecycle Highlights */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 self-start lg:self-end">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass border border-line text-xs font-mono text-muted">
              <Clock size={13} className="text-accent" />
              Agile 2-Week Sprints
            </span>
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass border border-line text-xs font-mono text-muted">
              <Shield size={13} className="text-accent" />
              Zero-Downtime Launch
            </span>
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass border border-line text-xs font-mono text-muted">
              <Workflow size={13} className="text-accent" />
              24/7 SLA Guarantee
            </span>
          </div>
        </div>

        {/* Desktop Pipeline Roadmap Indicator */}
        <div className="hidden xl:block mb-10 glass rounded-2xl p-4 border border-line/80 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[1000px] gap-2">
            {DEVELOPMENT_PROCESS.map((proc, i) => {
              const isHovered = activeStep === proc.step;
              return (
                <React.Fragment key={proc.step}>
                  <div
                    onMouseEnter={() => setActiveStep(proc.step)}
                    onMouseLeave={() => setActiveStep(null)}
                    className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      isHovered ? "bg-accent/15 text-accent border border-accent/40" : "text-muted hover:text-ink"
                    }`}
                  >
                    <span className="font-mono text-xs font-bold text-accent">{proc.step}</span>
                    <span className="text-xs font-medium whitespace-nowrap">{proc.title}</span>
                  </div>
                  {i < DEVELOPMENT_PROCESS.length - 1 && (
                    <div className="h-0.5 flex-1 bg-gradient-to-r from-accent/20 via-line to-accent/20 opacity-50 mx-1" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* 8-Step Symmetrical 4x2 Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {DEVELOPMENT_PROCESS.map((proc, idx) => {
            const Icon = ICON_MAP[proc.icon] || Icons.CheckCircle2;
            const isHighlighted = activeStep === proc.step;

            return (
              <Reveal key={proc.step} delay={idx * 0.05}>
                <div
                  onMouseEnter={() => setActiveStep(proc.step)}
                  onMouseLeave={() => setActiveStep(null)}
                  className={`group relative glass rounded-3xl p-7 h-full border transition-all duration-300 flex flex-col justify-between hover:-translate-y-1.5 overflow-hidden ${
                    isHighlighted
                      ? "border-accent shadow-[0_16px_40px_-12px_rgba(17,168,49,0.25)]"
                      : "border-line hover:border-accent/40 hover:shadow-[0_16px_40px_-12px_rgba(17,168,49,0.18)]"
                  }`}
                  data-testid={`process-card-${proc.step}`}
                >
                  {/* Subtle radial ambient hover glow */}
                  <div className="absolute -top-12 -right-12 w-28 h-28 bg-accent/15 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                  <div>
                    {/* Header: Step Number & Phase Badge + Icon */}
                    <div className="flex items-start justify-between gap-4 mb-5">
                      <div>
                        <span className="font-mono text-3xl sm:text-4xl font-black text-accent/80 group-hover:text-accent transition-colors block leading-none">
                          {proc.step}
                        </span>
                        <span className="font-mono text-[10px] tracking-wider uppercase text-muted group-hover:text-accent transition-colors block mt-2 font-medium">
                          {proc.phase}
                        </span>
                      </div>
                      <div className="h-11 w-11 rounded-2xl glass border border-line grid place-items-center text-accent group-hover:bg-accent group-hover:text-white group-hover:border-accent group-hover:scale-105 transition-all duration-300 shadow-sm shrink-0">
                        <Icon size={20} />
                      </div>
                    </div>

                    {/* Step Title & Description */}
                    <h3 className="font-display font-bold text-xl mb-2.5 text-text-primary group-hover:text-ink transition-colors">
                      {proc.title}
                    </h3>
                    <p className="text-muted text-sm leading-relaxed mb-6">
                      {proc.desc}
                    </p>
                  </div>

                  {/* Deliverable Tags & Milestone Footer */}
                  <div>
                    <div className="pt-4 border-t border-line/60 flex flex-wrap gap-1.5 mb-4">
                      {proc.tags &&
                        proc.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[11px] font-mono px-2.5 py-0.5 rounded-lg glass border border-line/60 text-muted group-hover:border-accent/30 group-hover:text-ink transition-colors"
                          >
                            {tag}
                          </span>
                        ))}
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-muted/80 pt-3 border-t border-line/30">
                      <span className="flex items-center gap-1.5 text-accent font-medium">
                        <CheckCircle2 size={13} className="text-accent" />
                        Milestone Verified
                      </span>
                      <span className="opacity-70">Phase {proc.step}/08</span>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* Enterprise Lifecycle Assurance Banner */}
        <div className="mt-14 glass rounded-3xl p-8 sm:p-10 border border-line relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8">
          <div
            className="blob w-64 h-64 -top-20 -right-16 pointer-events-none"
            style={{ background: "var(--accent)", opacity: 0.2 }}
          />

          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 label text-accent text-[11px] mb-3 font-semibold">
              <Sparkles size={13} />
              Enterprise Delivery Standards
            </div>
            <h3 className="text-2xl sm:text-3xl font-display font-bold text-text-primary mb-3">
              Ready to engineer your custom digital solution?
            </h3>
            <p className="text-muted text-sm sm:text-base leading-relaxed">
              From initial requirement discovery through continuous cloud evolution, our senior engineering squad guarantees milestone transparency and code craftsmanship at every step.
            </p>

            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-xs font-mono text-muted">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-accent" /> Strict NDA Protection
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-accent" /> 100% Code Ownership
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-accent" /> Continuous Sprint Demos
              </span>
            </div>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row gap-3 w-full lg:w-auto shrink-0">
            <MagneticButton
              onClick={() => scrollToSection("contact")}
              className="py-3.5 px-6 rounded-2xl bg-accent text-white font-semibold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-accent/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Schedule Architecture Call</span>
              <ArrowRight size={16} />
            </MagneticButton>
            <button
              onClick={() => scrollToSection("services")}
              className="py-3.5 px-6 rounded-2xl glass border border-line text-sm font-semibold text-text-primary hover:border-accent/40 transition-colors flex items-center justify-center cursor-pointer"
            >
              Explore Services
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
