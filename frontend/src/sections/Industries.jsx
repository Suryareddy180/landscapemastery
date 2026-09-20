import React, { useState, useEffect } from "react";
import {
  HeartPulse,
  GraduationCap,
  ShoppingBag,
  Factory,
  Truck,
  Hotel,
  Landmark,
  Building,
  ShoppingCart,
  Shield,
  Briefcase,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import Reveal from "../components/Reveal";
import { INDUSTRIES_SERVED, ENTERPRISE_SOLUTIONS } from "../lib/data";
import api from "../lib/api";

const ICON_MAP = {
  HeartPulse,
  GraduationCap,
  ShoppingBag,
  Factory,
  Truck,
  Hotel,
  Landmark,
  Building,
  ShoppingCart,
  Shield,
  Briefcase,
};

export default function Industries() {
  const [activeTab, setActiveTab] = useState("solutions");
  const [solutions, setSolutions] = useState(ENTERPRISE_SOLUTIONS);

  useEffect(() => {
    api.get("/api/solutions")
      .then((res) => {
        if (res.solutions && res.solutions.length > 0) {
          setSolutions(res.solutions);
        }
      })
      .catch(console.error);
  }, []);

  return (
    <section id="solutions" className="relative py-28 overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-40" />
      <div
        className="blob w-[500px] h-[500px] top-1/3 left-[-150px]"
        style={{ background: "var(--accent)", opacity: 0.2 }}
      />

      <div className="relative mx-auto max-w-[1400px] px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <div className="label text-accent mb-4">{"// Domain Expertise & Software Solutions"}</div>
            <h2 className="display-lg">
              Industry-tailored systems & <span className="text-gradient">ready-to-deploy platforms.</span>
            </h2>
            <p className="mt-4 text-muted text-lg leading-relaxed">
              From specialized enterprise software modules to end-to-end digital solutions across 11 core market sectors.
            </p>
          </div>

          <div className="flex rounded-full glass p-1.5 border border-line shrink-0">
            <button
              onClick={() => setActiveTab("solutions")}
              className={`rounded-full px-6 py-2.5 text-sm font-medium transition-all ${
                activeTab === "solutions"
                  ? "bg-accent text-white shadow-md"
                  : "text-muted hover:text-ink"
              }`}
            >
              Enterprise Solutions
            </button>
            <button
              onClick={() => setActiveTab("industries")}
              className={`rounded-full px-6 py-2.5 text-sm font-medium transition-all ${
                activeTab === "industries"
                  ? "bg-accent text-white shadow-md"
                  : "text-muted hover:text-ink"
              }`}
            >
              Industries Served
            </button>
          </div>
        </div>

        {activeTab === "solutions" ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {solutions.map((sol, idx) => (
              <Reveal key={sol.id || sol.name} delay={idx * 0.05}>
                <div className="group glass rounded-3xl p-7 h-full border border-line hover:border-accent/40 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 text-accent px-3 py-1 label text-[10px] mb-4 font-semibold">
                      {sol.category}
                    </div>
                    <h3 className="font-display font-bold text-xl mb-2 text-text-primary group-hover:text-accent transition-colors">
                      {sol.name}
                    </h3>
                    <p className="text-muted text-sm leading-relaxed mb-6">
                      {sol.desc}
                    </p>
                  </div>
                  <div className="pt-4 border-t border-line/60 flex items-center justify-between text-xs text-muted font-medium">
                    <span className="flex items-center gap-1.5 text-accent">
                      <CheckCircle2 size={14} /> Production Ready
                    </span>
                    <button
                      onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
                      className="group-hover:translate-x-1 transition-transform flex items-center gap-1 text-ink font-semibold"
                    >
                      Inquire <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {INDUSTRIES_SERVED.map((ind, idx) => {
              const Icon = ICON_MAP[ind.icon] || Briefcase;
              return (
                <Reveal key={ind.id} delay={idx * 0.04}>
                  <div className="glass rounded-3xl p-6 h-full border border-line hover:border-accent/30 transition-all duration-300">
                    <div className="h-12 w-12 rounded-2xl glass border border-line grid place-items-center text-accent mb-4">
                      <Icon size={22} />
                    </div>
                    <h3 className="font-display font-bold text-lg mb-2 text-text-primary">
                      {ind.title}
                    </h3>
                    <p className="text-muted text-xs leading-relaxed">
                      {ind.desc}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
