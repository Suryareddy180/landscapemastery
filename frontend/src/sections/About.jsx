import React, { useState, useEffect } from "react";
import * as Icons from "lucide-react";
import { Target, Eye, CheckCircle2, Linkedin, Twitter, Mail, Crown, User } from "lucide-react";
import Reveal, { WordReveal } from "../components/Reveal";
import { MISSION, VISION, MISSION_PILLARS, CORE_VALUES, CEO_PROFILE } from "../lib/data";
import { BASE_URL } from "../lib/api";

const BACKEND = BASE_URL;

const getPhotoSrc = (url) => {
  if (!url) return CEO_PROFILE.photo_url;
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
  if (url.startsWith("/")) return url;
  return `${BACKEND}${url.startsWith("/") ? "" : "/"}${url}`;
};

export default function About() {
  const [leaders, setLeaders] = useState([CEO_PROFILE]);

  useEffect(() => {
    fetch(`${BACKEND}/api/leaders`)
      .then((r) => r.json())
      .then((data) => {
        if (data.leaders && data.leaders.length > 0) {
          setLeaders(data.leaders);
        }
      })
      .catch(() => {});
  }, []);

  const ceo = leaders.length > 0 ? leaders[0] : CEO_PROFILE;
  const photoSrc = ceo ? getPhotoSrc(ceo.photo_url || ceo.photo) : CEO_PROFILE.photo_url;

  return (
    <section id="about" className="relative py-24 sm:py-32 scroll-mt-24">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          <div className="lg:col-span-5 lg:sticky lg:top-28">
            <div className="label text-accent mb-5" data-testid="about-eyebrow">{"// About 3CAPSTECH"}</div>
            <h2 className="display-lg">
              <WordReveal text="Engineering digital solutions" /> <br className="hidden sm:block" />
              <WordReveal className="text-gradient" text="that drive growth." delay={0.2} />
            </h2>
            <p className="mt-6 text-muted text-lg leading-relaxed">
              3CAPSTECH Software Private Limited is a technology-driven IT services and software engineering company.
              We architect and build secure, scalable, and modern digital applications that solve complex business challenges and drive sustainable growth.
            </p>

            <div className="mt-10 grid sm:grid-cols-2 gap-4">
              {CORE_VALUES.slice(0, 4).map((v, i) => {
                const Icon = Icons[v.icon] || Icons.Circle;
                return (
                  <Reveal key={v.title} delay={i * 0.08}>
                    <div className="glass rounded-2xl p-5 h-full hover:-translate-y-1 transition-transform border border-line" data-testid={`value-${v.title.toLowerCase()}`}>
                      <Icon className="text-accent mb-3" size={22} />
                      <div className="font-display font-bold text-lg text-text-primary">{v.title}</div>
                      <div className="text-xs text-muted mt-1 leading-relaxed">{v.desc}</div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <Reveal>
              <div className="glass rounded-3xl p-8 relative overflow-hidden border border-line" data-testid="about-vision">
                <div className="blob w-56 h-56 -top-16 -right-10" style={{ background: "var(--accent)", opacity: 0.2 }} />
                <div className="relative flex items-start gap-4">
                  <div className="h-12 w-12 shrink-0 grid place-items-center rounded-2xl bg-accent text-white shadow-md">
                    <Eye size={22} />
                  </div>
                  <div>
                    <div className="label text-accent font-semibold">Our Vision</div>
                    <p className="mt-2 text-xl sm:text-2xl font-display font-bold leading-snug text-text-primary">{VISION}</p>
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <div className="glass rounded-3xl p-8 relative overflow-hidden border border-line" data-testid="about-mission">
                <div className="blob w-56 h-56 -bottom-20 -left-10" style={{ background: "var(--accent2)", opacity: 0.2 }} />
                <div className="relative flex items-start gap-4">
                  <div className="h-12 w-12 shrink-0 grid place-items-center rounded-2xl glass text-accent border border-line">
                    <Target size={22} />
                  </div>
                  <div>
                    <div className="label text-muted">Our Mission</div>
                    <p className="mt-2 text-base text-muted leading-relaxed font-normal">{MISSION}</p>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* ── CEO / Leader Card (inline) ── */}
            {ceo && (
              <Reveal delay={0.14}>
                <div
                  className="glass rounded-3xl relative overflow-hidden border border-line group hover:-translate-y-1 transition-all duration-500 shadow-xl"
                  data-testid="about-ceo"
                >
                  <div className="blob w-48 h-48 -top-12 -right-12 opacity-0 group-hover:opacity-100 transition-opacity duration-700" style={{ background: "var(--accent-glow)", filter: "blur(60px)" }} />

                  <div className="flex flex-col sm:flex-row relative">
                    {/* Photo */}
                    <div className="sm:w-56 shrink-0 relative overflow-hidden bg-slate-900/60 flex items-center justify-center min-h-[260px] sm:min-h-0">
                      <img
                        src={photoSrc}
                        alt={`${ceo.name} — ${ceo.title}`}
                        className="w-full h-full min-h-[260px] sm:min-h-[280px] object-cover object-[center_12%] group-hover:scale-105 transition-transform duration-700"
                        loading="eager"
                      />
                      {/* Gradient blend */}
                      <div className="absolute inset-0 sm:hidden bg-gradient-to-t from-[var(--bg)] via-transparent to-transparent opacity-80" />
                      <div className="absolute inset-0 hidden sm:block bg-gradient-to-r from-transparent via-transparent to-[var(--bg)] opacity-30" />
                    </div>

                    {/* Content */}
                    <div className="p-6 sm:p-8 flex-1 flex flex-col justify-center relative">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.7rem] font-semibold text-accent border border-accent/25 bg-accent/10 w-fit mb-3">
                        <Crown size={13} className="text-accent" />
                        <span>{ceo.title}</span>
                      </div>
                      <h4 className="font-display font-black text-2xl text-text-primary tracking-tight">{ceo.name}</h4>
                      <p className="mt-3 text-sm text-muted leading-relaxed font-normal">{ceo.bio}</p>

                      {/* Social & Contact links */}
                      {(ceo.email || ceo.linkedin || ceo.twitter) && (
                        <div className="mt-5 flex flex-wrap items-center gap-3">
                          {ceo.email && (
                            <a
                              href={`mailto:${ceo.email}`}
                              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl glass border border-line/60 text-xs text-muted hover:text-accent hover:border-accent/40 transition-all font-medium"
                              aria-label={`Email ${ceo.name}`}
                            >
                              <Mail size={13} className="text-accent" />
                              <span>{ceo.email}</span>
                            </a>
                          )}
                          {ceo.linkedin && (
                            <a
                              href={ceo.linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="h-8 w-8 grid place-items-center rounded-xl glass border border-line/60 text-muted hover:text-accent hover:border-accent/40 transition-colors"
                              aria-label={`${ceo.name} LinkedIn`}
                            >
                              <Linkedin size={14} />
                            </a>
                          )}
                          {ceo.twitter && (
                            <a
                              href={ceo.twitter}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="h-8 w-8 grid place-items-center rounded-xl glass border border-line/60 text-muted hover:text-accent hover:border-accent/40 transition-colors"
                              aria-label={`${ceo.name} Twitter`}
                            >
                              <Twitter size={14} />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Reveal>
            )}

            <div className="glass rounded-3xl p-8 border border-line">
              <h3 className="font-display font-bold text-xl mb-6 text-text-primary">Mission Execution Pillars</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {MISSION_PILLARS.map((p, i) => (
                  <Reveal key={p.title} delay={0.1 + i * 0.05}>
                    <div className="flex items-start gap-3 p-3.5 rounded-2xl glass border border-line/50 hover:border-accent/30 transition-colors">
                      <CheckCircle2 size={18} className="text-accent shrink-0 mt-0.5" />
                      <div>
                        <div className="font-display font-bold text-sm text-text-primary">{p.title}</div>
                        <div className="text-xs text-muted mt-0.5">{p.desc}</div>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
