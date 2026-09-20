import React from "react";
import { CheckCircle } from "lucide-react";
import Reveal from "../components/Reveal";
import { DEVELOPMENT_PROCESS } from "../lib/data";

export default function DevelopmentProcess() {
  return (
    <section id="process" className="relative py-28 overflow-hidden bg-surface/30 border-y border-line/60">
      <div className="relative mx-auto max-w-[1400px] px-4 sm:px-6">
        <div className="max-w-2xl mb-16">
          <div className="label text-accent mb-4">// Structured Execution</div>
          <h2 className="display-lg">
            Our end-to-end <span className="text-gradient">development process.</span>
          </h2>
          <p className="mt-4 text-muted text-lg leading-relaxed">
            A battle-tested software engineering lifecycle designed to ensure transparency, exceptional quality, and on-time delivery.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {DEVELOPMENT_PROCESS.map((proc, idx) => (
            <Reveal key={proc.step} delay={idx * 0.06}>
              <div className="relative glass rounded-3xl p-7 h-full border border-line hover:border-accent/40 transition-all duration-300 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-mono text-3xl font-black text-accent/80">
                      {proc.step}
                    </span>
                    <span className="h-8 w-8 rounded-full glass border border-line grid place-items-center text-accent">
                      <CheckCircle size={15} />
                    </span>
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
          ))}
        </div>
      </div>
    </section>
  );
}
