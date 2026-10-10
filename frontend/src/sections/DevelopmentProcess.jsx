import React from "react";
import * as Icons from "lucide-react";
import Reveal from "../components/Reveal";
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
  return (
    <section id="process" className="relative py-20 sm:py-28 scroll-mt-24">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
        <div className="max-w-2xl mb-14 sm:mb-16">
          <div className="label text-accent mb-4 font-semibold">// Structured Execution</div>
          <h2 className="display-lg">
            Our end-to-end <span className="text-gradient">development process.</span>
          </h2>
          <p className="mt-4 text-muted text-base sm:text-lg leading-relaxed">
            A battle-tested software engineering lifecycle designed to ensure transparency, exceptional quality, and on-time delivery.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {DEVELOPMENT_PROCESS.map((proc, idx) => {
            const Icon = ICON_MAP[proc.icon] || Icons.CheckCircle2;

            return (
              <Reveal key={proc.step} delay={idx * 0.05}>
                <div
                  className="glass rounded-3xl p-7 h-full border border-line hover:border-accent/40 transition-all duration-300 group hover:-translate-y-1 flex flex-col justify-between"
                  data-testid={`process-card-${proc.step}`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <span className="font-mono text-3xl font-black text-accent/80 group-hover:text-accent transition-colors">
                        {proc.step}
                      </span>
                      <div className="h-10 w-10 rounded-2xl glass border border-line grid place-items-center text-accent group-hover:bg-accent group-hover:text-white transition-all duration-300">
                        <Icon size={18} />
                      </div>
                    </div>
                    <h3 className="font-display font-bold text-xl mb-3 text-text-primary">
                      {proc.title}
                    </h3>
                    <p className="text-muted text-sm leading-relaxed">
                      {proc.desc}
                    </p>
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
