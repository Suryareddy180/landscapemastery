import React from "react";
import { WordReveal } from "../components/Reveal";
import { TECH } from "../lib/data";

export default function TechOrbit() {
  const rings = [
    { r: 130, items: TECH.slice(0, 5), dur: "38s" },
    { r: 220, items: TECH.slice(4, 9), dur: "54s", reverse: true },
  ];

  return (
    <section className="relative py-24 sm:py-32 overflow-hidden">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="label text-accent mb-5">// Capabilities</div>
            <h2 className="display-lg">
              <WordReveal text="Built to move at" /><br />
              <WordReveal className="text-gradient" text="the speed of ideas." delay={0.15} />
            </h2>
            <p className="mt-6 text-muted text-lg leading-relaxed max-w-md">
              From intelligent automation and resilient cloud to refined design and
              data — our capabilities span the entire product lifecycle, so you ship
              faster with confidence.
            </p>
            <div className="mt-8 flex flex-wrap gap-2.5" data-testid="tech-chips">
              {TECH.map((t) => (
                <span key={t} className="glass rounded-full px-4 py-2 font-mono text-sm hover:text-accent hover:-translate-y-0.5 transition-all cursor-default">
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="relative grid place-items-center h-[460px] sm:h-[520px]" data-testid="tech-orbit">
            <div className="absolute h-[460px] w-[460px] rounded-full border border-line" />
            <div className="absolute h-[280px] w-[280px] rounded-full border border-line" />
            <div className="blob w-[300px] h-[300px]" style={{ background: "var(--accent)", opacity: 0.28 }} />

            <div className="relative z-10 h-24 w-28 rounded-3xl glass grid place-items-center glow-accent p-2">
              <img
                src="/logo.png"
                alt="3CapsTech Logo"
                className="h-10 sm:h-12 w-auto object-contain dark:[filter:drop-shadow(0_0_1px_rgba(255,255,255,0.9))_drop-shadow(0_0_10px_rgba(255,255,255,0.25))]"
              />
            </div>

            {rings.map((ring, ri) => (
              <div
                key={ri}
                className="absolute animate-spinslow"
                style={{ width: ring.r * 2, height: ring.r * 2, animationDuration: ring.dur, animationDirection: ring.reverse ? "reverse" : "normal" }}
              >
                {ring.items.map((item, i) => {
                  const angle = (i / ring.items.length) * Math.PI * 2;
                  const x = Math.cos(angle) * ring.r;
                  const y = Math.sin(angle) * ring.r;
                  return (
                    <div
                      key={item + i}
                      className="absolute glass rounded-full px-3 py-1.5 font-mono text-xs whitespace-nowrap"
                      style={{
                        left: "50%",
                        top: "50%",
                        transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                        animation: `spinslow ${ring.dur} linear infinite ${ring.reverse ? "" : "reverse"}`,
                      }}
                    >
                      {item}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
