import React, { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";
import * as Icons from "lucide-react";
import { WordReveal } from "../components/Reveal";
import { STATS, WHY_CHOOSE_US } from "../lib/data";

function Counter({ value, suffix }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let raf;
    const start = performance.now();
    const dur = 1600;
    const tick = (t) => {
      const p = Math.min((t - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.floor(eased * value));
      if (p < 1) raf = requestAnimationFrame(tick);
      else setN(value);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);

  return (
    <span ref={ref}>
      {n.toLocaleString()}
      {suffix}
    </span>
  );
}

export default function WhyChooseUs() {
  return (
    <section id="why" className="relative py-20 sm:py-28 scroll-mt-24">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="label text-accent mb-3 font-semibold">// Why Choose 3CAPSTECH</div>
          <h2 className="display-lg my-2">
            <WordReveal text="Engineering excellence," />{" "}
            <WordReveal className="text-gradient" text="proven impact." delay={0.12} />
          </h2>
          <p className="mt-4 text-muted text-base sm:text-lg leading-relaxed">
            We combine strategic IT consulting, modern software engineering, and relentless support to deliver measurable business results.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10" data-testid="why-counters">
          {STATS.map((s) => (
            <div key={s.label} className="glass rounded-3xl p-7 text-center hover:-translate-y-1 transition-transform border border-line">
              <div className="display-md font-display font-black text-gradient">
                <Counter value={s.value} suffix={s.suffix} />
              </div>
              <div className="label text-muted mt-2 text-[10px] font-medium">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {WHY_CHOOSE_US.map((r, i) => {
            const Icon = Icons[r.icon] || Icons.CheckCircle2;
            return (
              <div key={r.title} className="glass rounded-3xl p-7 hover:border-accent/40 transition-colors group border border-line" data-testid={`why-reason-${i}`}>
                <div className="h-12 w-12 grid place-items-center rounded-2xl glass text-accent group-hover:bg-accent group-hover:text-white transition-all duration-300 mb-5 border border-line">
                  <Icon size={22} />
                </div>
                <div className="font-display font-bold text-lg text-text-primary">{r.title}</div>
                <p className="text-muted text-sm mt-2 leading-relaxed">{r.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
