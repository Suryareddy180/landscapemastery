import React, { useState } from "react";
import { motion } from "framer-motion";
import { Mail, MapPin, Phone, Send, Check, MessageCircle, Calendar } from "lucide-react";
import { WordReveal } from "../components/Reveal";
import MagneticButton from "../components/MagneticButton";
import { CONTACT_INFO, WHATSAPP, MAPS_EMBED } from "../lib/data";
import api from "../lib/api";

const INTERESTS = ["Custom Software", "Enterprise Solutions", "AI & Automation", "Cloud & DevOps", "IT Consulting"];

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", company: "", interest: "Custom Software", message: "" });
  const [status, setStatus] = useState("idle");
  const [resp, setResp] = useState("");

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const r = await api.post("/api/contact", form);
      setResp(r.message || "Message sent!");
      setStatus("success");
      setForm({ name: "", email: "", company: "", interest: "Custom Software", message: "" });
    } catch (err) {
      setResp("Something went wrong. Please check your details.");
      setStatus("error");
    }
  };

  return (
    <section id="contact" className="relative py-24 sm:py-32 scroll-mt-24 overflow-hidden">
      <div className="blob w-[500px] h-[500px] top-0 left-[-160px]" style={{ background: "var(--accent2)", opacity: 0.22 }} />
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
          <div>
            <div className="label text-accent mb-5">{"// Let's Talk"}</div>
            <h2 className="display-lg">
              <WordReveal text="Start something" /><br />
              <WordReveal className="text-gradient" text="worth remembering." delay={0.15} />
            </h2>
            <p className="mt-6 text-muted text-lg leading-relaxed max-w-md">
              Whether you're architecting an enterprise platform or scaling a cloud solution, we'd love to hear from you.
            </p>

            <div className="mt-8 space-y-4">
              <a
                href={`mailto:${CONTACT_INFO.email}`}
                className="flex items-center gap-3 text-muted hover:text-accent transition-colors group"
                data-testid="contact-email-link"
              >
                <span className="h-10 w-10 grid place-items-center rounded-full glass text-accent group-hover:scale-105 transition-transform"><Mail size={17} /></span>
                <span className="text-sm font-medium">{CONTACT_INFO.email}</span>
              </a>

              <a
                href={`tel:${CONTACT_INFO.phoneRaw}`}
                className="flex items-center gap-3 text-muted hover:text-accent transition-colors group"
                data-testid="contact-phone-link"
              >
                <span className="h-10 w-10 grid place-items-center rounded-full glass text-accent group-hover:scale-105 transition-transform"><Phone size={17} /></span>
                <span className="text-sm font-medium">{CONTACT_INFO.phone}</span>
              </a>

              <div className="flex items-start gap-3 text-muted">
                <span className="h-10 w-10 shrink-0 grid place-items-center rounded-full glass text-accent mt-0.5"><MapPin size={17} /></span>
                <span className="text-sm leading-relaxed">{CONTACT_INFO.address}</span>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <a href={WHATSAPP} target="_blank" rel="noreferrer" data-testid="contact-whatsapp" className="inline-flex items-center gap-2 rounded-full glass px-5 py-3 text-sm hover:text-accent transition-colors">
                <MessageCircle size={16} /> WhatsApp
              </a>
              <a href={WHATSAPP} target="_blank" rel="noreferrer" data-testid="contact-book" className="inline-flex items-center gap-2 rounded-full glass px-5 py-3 text-sm hover:text-accent transition-colors">
                <Calendar size={16} /> Book a Meeting
              </a>
            </div>

            <div className="mt-8 rounded-3xl overflow-hidden glass p-1.5">
              <iframe
                title="3CAPSTECH location"
                src={MAPS_EMBED}
                className="w-full h-56 rounded-2xl grayscale contrast-125 opacity-90"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>

          <div className="glass rounded-3xl p-7 sm:p-9">
            {status === "success" ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-full flex flex-col items-center justify-center text-center py-16"
                data-testid="contact-success"
              >
                <div className="h-16 w-16 rounded-full bg-accent text-white grid place-items-center mb-6">
                  <Check size={30} />
                </div>
                <div className="display-md font-display font-bold">Message received</div>
                <p className="text-muted mt-3 max-w-xs">{resp}</p>
                <button onClick={() => setStatus("idle")} className="mt-6 rounded-full glass px-6 py-3 text-sm hover:text-accent transition-colors">
                  Send another
                </button>
              </motion.div>
            ) : (
              <form onSubmit={submit} className="space-y-5" data-testid="contact-form">
                <div className="grid sm:grid-cols-2 gap-5">
                  <Field label="Name" value={form.name} onChange={set("name")} required testid="contact-name" />
                  <Field label="Email" type="email" value={form.email} onChange={set("email")} required testid="contact-email" />
                </div>
                <Field label="Company" value={form.company} onChange={set("company")} testid="contact-company" />

                <div>
                  <div className="label text-muted mb-2">Interested in</div>
                  <div className="flex flex-wrap gap-2" data-testid="contact-interests">
                    {INTERESTS.map((it) => (
                      <button
                        type="button"
                        key={it}
                        onClick={() => setForm({ ...form, interest: it })}
                        className={`rounded-full px-4 py-2 text-sm transition-colors border ${form.interest === it ? "bg-accent text-white border-accent" : "glass border-line hover:text-accent"}`}
                      >
                        {it}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="label text-muted mb-2">Message</div>
                  <textarea
                    value={form.message}
                    onChange={set("message")}
                    required
                    rows={4}
                    data-testid="contact-message"
                    placeholder="Tell us about your project or goals..."
                    className="w-full rounded-2xl glass px-4 py-3 outline-none focus:border-accent transition-colors resize-none text-ink placeholder:text-muted"
                  />
                </div>

                {status === "error" && <div className="text-sm text-red-400" data-testid="contact-error">{resp}</div>}

                <MagneticButton
                  type="submit"
                  disabled={status === "loading"}
                  data-testid="contact-submit"
                  className="group w-full inline-flex items-center justify-center gap-2 rounded-full bg-[var(--text-primary)] text-[var(--bg)] px-7 py-4 font-medium disabled:opacity-60"
                >
                  {status === "loading" ? "Sending..." : "Send Message"}
                  <Send size={16} className="group-hover:translate-x-1 transition-transform" />
                </MagneticButton>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({ label, type = "text", value, onChange, required, testid }) {
  return (
    <label className="block">
      <div className="label text-muted mb-2">{label}{required && <span className="text-accent"> *</span>}</div>
      <input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        data-testid={testid}
        className="w-full rounded-2xl glass px-4 py-3 outline-none focus:border-accent transition-colors text-ink"
      />
    </label>
  );
}
