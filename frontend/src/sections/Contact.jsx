import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  MapPin,
  Phone,
  Send,
  Check,
  MessageCircle,
  Calendar,
  Navigation,
  ExternalLink,
  Copy,
  CheckCircle2,
  User,
  Building2,
  Sparkles,
  Code2,
  Cloud,
  Compass,
  MessageSquare,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { WordReveal } from "../components/Reveal";
import MagneticButton from "../components/MagneticButton";
import { CONTACT_INFO, WHATSAPP, MAPS_EMBED, MAPS_URL, MAPS_DIRECTIONS_URL } from "../lib/data";
import api from "../lib/api";

const SERVICES_OPTIONS = [
  { id: "Custom Software", label: "Custom Software", icon: Code2 },
  { id: "Enterprise Solutions", label: "Enterprise Solutions", icon: Building2 },
  { id: "AI & Automation", label: "AI & Automation", icon: Sparkles },
  { id: "Cloud & DevOps", label: "Cloud & DevOps", icon: Cloud },
  { id: "IT Consulting", label: "IT Consulting", icon: Compass },
];

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    interest: "Custom Software",
    message: "",
  });
  const [status, setStatus] = useState("idle");
  const [resp, setResp] = useState("");
  const [copiedAddress, setCopiedAddress] = useState(false);

  const handleCopyAddress = (e) => {
    e.preventDefault();
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(CONTACT_INFO.address);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  const set = (k) => (e) => setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    setResp("");

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        company: form.company?.trim() || "",
        interest: form.interest,
        message: form.phone
          ? `[Phone / WhatsApp: ${form.phone.trim()}]\n\n${form.message.trim()}`
          : form.message.trim(),
      };

      const r = await api.post("/api/contact", payload);
      setResp(r.message || "Thank you! Your project inquiry has been received.");
      setStatus("success");
    } catch (err) {
      setResp(
        err.response?.data?.error ||
          "Unable to send message right now. Please verify your details or message us directly on WhatsApp."
      );
      setStatus("error");
    }
  };

  const handleReset = () => {
    setForm({
      name: "",
      email: "",
      phone: "",
      company: "",
      interest: "Custom Software",
      message: "",
    });
    setStatus("idle");
  };

  return (
    <section id="contact" className="relative py-24 sm:py-32 scroll-mt-24 overflow-hidden">
      <div className="blob w-[500px] h-[500px] top-0 left-[-160px] pointer-events-none" style={{ background: "var(--accent2)", opacity: 0.18 }} />
      <div className="blob w-[450px] h-[450px] bottom-0 right-[-140px] pointer-events-none" style={{ background: "var(--accent)", opacity: 0.15 }} />

      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-stretch">
          {/* Left Column: Contact details & Location Map */}
          <div className="flex flex-col justify-between h-full">
            <div>
              <div className="inline-flex items-center gap-2 label text-accent mb-4 font-semibold px-3 py-1.5 rounded-full glass border border-line">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse shadow-[0_0_8px_#11A831]" />
                // Let's Connect
              </div>
              <h2 className="display-lg">
                <WordReveal text="Start something" /><br />
                <WordReveal className="text-gradient" text="worth remembering." delay={0.15} />
              </h2>
              <p className="mt-6 text-muted text-base sm:text-lg leading-relaxed max-w-md">
                Whether you're architecting an enterprise software ecosystem or scaling modern cloud infrastructure, our engineering leadership is ready to partner with you.
              </p>

              <div className="mt-8 space-y-4">
                <a
                  href={`mailto:${CONTACT_INFO.email}`}
                  className="flex items-center gap-3.5 text-muted hover:text-accent transition-colors group cursor-pointer"
                  data-testid="contact-email-link"
                >
                  <span className="h-11 w-11 grid place-items-center rounded-2xl glass text-accent group-hover:bg-accent group-hover:text-white transition-all shadow-sm border border-line">
                    <Mail size={18} />
                  </span>
                  <div>
                    <span className="text-xs font-mono text-muted block uppercase tracking-wider">Email Inquiry</span>
                    <span className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors">{CONTACT_INFO.email}</span>
                  </div>
                </a>

                <a
                  href={`tel:${CONTACT_INFO.phoneRaw}`}
                  className="flex items-center gap-3.5 text-muted hover:text-accent transition-colors group cursor-pointer"
                  data-testid="contact-phone-link"
                >
                  <span className="h-11 w-11 grid place-items-center rounded-2xl glass text-accent group-hover:bg-accent group-hover:text-white transition-all shadow-sm border border-line">
                    <Phone size={18} />
                  </span>
                  <div>
                    <span className="text-xs font-mono text-muted block uppercase tracking-wider">Direct Hotline</span>
                    <span className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors">{CONTACT_INFO.phone}</span>
                  </div>
                </a>

                <a
                  href={MAPS_URL}
                  target="_blank"
                  rel="noreferrer"
                  data-testid="contact-address-link"
                  className="flex items-start gap-3.5 text-muted hover:text-accent transition-colors group cursor-pointer"
                  title="Open office location in Google Maps"
                >
                  <span className="h-11 w-11 shrink-0 grid place-items-center rounded-2xl glass text-accent group-hover:bg-accent group-hover:text-white transition-all shadow-sm border border-line mt-0.5">
                    <MapPin size={18} />
                  </span>
                  <div>
                    <span className="text-xs font-mono text-muted block uppercase tracking-wider">Corporate Headquarters</span>
                    <span className="text-sm leading-relaxed block text-text-primary group-hover:text-accent transition-colors font-medium">
                      {CONTACT_INFO.address}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-accent mt-1.5 font-mono">
                      <span>Open location in Google Maps</span>
                      <ExternalLink size={12} />
                    </span>
                  </div>
                </a>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href={WHATSAPP}
                  target="_blank"
                  rel="noreferrer"
                  data-testid="contact-whatsapp"
                  className="inline-flex items-center gap-2 rounded-2xl glass px-5 py-3 text-sm font-medium text-text-primary hover:border-emerald-500/50 hover:text-emerald-400 transition-all border border-line shadow-sm"
                >
                  <MessageCircle size={16} className="text-emerald-400" />
                  <span>Chat on WhatsApp</span>
                </a>
                <a
                  href={WHATSAPP}
                  target="_blank"
                  rel="noreferrer"
                  data-testid="contact-book"
                  className="inline-flex items-center gap-2 rounded-2xl glass px-5 py-3 text-sm font-medium text-text-primary hover:border-accent hover:text-accent transition-all border border-line shadow-sm"
                >
                  <Calendar size={16} className="text-accent" />
                  <span>Schedule a Call</span>
                </a>
              </div>
            </div>

            {/* Interactive Office Location Map */}
            <div className="mt-8 rounded-3xl overflow-hidden glass p-3 border border-line relative group shadow-lg">
              <div className="flex items-center justify-between px-1 mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]" />
                  <span className="font-mono text-xs font-semibold text-text-primary">
                    3CAPSTECH Office Location
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyAddress}
                    type="button"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono glass border border-line hover:border-accent text-muted hover:text-ink transition-colors cursor-pointer"
                    title="Copy full address"
                  >
                    {copiedAddress ? (
                      <>
                        <CheckCircle2 size={12} className="text-accent" />
                        <span className="text-accent">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span>Copy</span>
                      </>
                    )}
                  </button>

                  <a
                    href={MAPS_DIRECTIONS_URL}
                    target="_blank"
                    rel="noreferrer"
                    data-testid="contact-directions-btn"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-accent text-white hover:bg-emerald-600 transition-all shadow-sm cursor-pointer"
                  >
                    <Navigation size={12} />
                    <span>Get Directions</span>
                  </a>
                </div>
              </div>

              <div className="relative rounded-2xl overflow-hidden h-60 border border-line/60">
                <iframe
                  title="3CAPSTECH corporate office location"
                  src={MAPS_EMBED}
                  className="w-full h-full border-0 contrast-105 opacity-95"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />

                <a
                  href={MAPS_URL}
                  target="_blank"
                  rel="noreferrer"
                  data-testid="contact-map-overlay"
                  className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-950/85 hover:bg-accent text-white text-xs font-medium transition-all backdrop-blur-md border border-white/10 shadow-lg cursor-pointer"
                >
                  <span>Open in Google Maps</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </div>

          {/* Right Column: Redesigned Enterprise Inquiry Form */}
          <div className="glass rounded-3xl p-7 sm:p-9 border border-line relative overflow-hidden shadow-2xl flex flex-col justify-between h-full">
            {/* Ambient Corner Accent */}
            <div className="blob w-56 h-56 -top-20 -right-20 pointer-events-none" style={{ background: "var(--accent)", opacity: 0.16 }} />

            {/* Form Header */}
            <div className="relative z-10 mb-6">
              <div className="inline-flex items-center gap-2 label text-accent text-[11px] font-semibold px-3 py-1 rounded-full glass border border-line mb-2">
                <Sparkles size={12} className="text-accent" />
                <span>Direct Inquiry</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-display font-bold text-text-primary">
                Send us a message
              </h3>
              <p className="text-muted text-xs sm:text-sm mt-1.5 leading-relaxed">
                Tell us about your project goals. Our senior technical architects evaluate inquiries and reply within 24 hours.
              </p>
            </div>

            <AnimatePresence mode="wait">
              {status === "success" ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="py-10 text-center flex-1 flex flex-col items-center justify-center relative z-10"
                  data-testid="contact-success"
                >
                  <div className="h-16 w-16 rounded-3xl bg-accent/20 border border-accent/40 text-accent grid place-items-center mb-5 shadow-[0_0_30px_rgba(17,168,49,0.3)]">
                    <CheckCircle2 size={32} />
                  </div>
                  <h4 className="text-2xl font-display font-bold text-text-primary mb-2">
                    Inquiry Received
                  </h4>
                  <p className="text-muted text-sm max-w-sm mx-auto leading-relaxed mb-6">
                    {resp}
                  </p>

                  <div className="glass rounded-2xl p-4 w-full max-w-sm mb-6 border border-line text-left space-y-1.5 text-xs font-mono text-muted">
                    <div className="flex justify-between">
                      <span className="opacity-70">Focus:</span>
                      <span className="text-accent font-semibold">{form.interest}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-70">Client:</span>
                      <span className="text-text-primary font-semibold">{form.name}</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                    <a
                      href={WHATSAPP}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-3 px-4 rounded-xl bg-accent text-white font-semibold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <MessageCircle size={14} />
                      <span>Instant WhatsApp</span>
                    </a>
                    <button
                      onClick={handleReset}
                      className="flex-1 py-3 px-4 rounded-xl glass border border-line hover:border-accent text-text-primary font-semibold text-xs transition-colors cursor-pointer"
                    >
                      Send Another
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={submit}
                  className="space-y-4 relative z-10 flex-1 flex flex-col justify-between"
                  data-testid="contact-form"
                >
                  <div className="space-y-4">
                    {/* Row 1: Name & Email */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <InputField
                        label="Name"
                        type="text"
                        icon={User}
                        value={form.name}
                        onChange={set("name")}
                        required
                        placeholder="Alex Morgan"
                        testid="contact-name"
                      />
                      <InputField
                        label="Email"
                        type="email"
                        icon={Mail}
                        value={form.email}
                        onChange={set("email")}
                        required
                        placeholder="alex@company.com"
                        testid="contact-email"
                      />
                    </div>

                    {/* Row 2: Company & Phone */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <InputField
                        label="Company"
                        type="text"
                        icon={Building2}
                        value={form.company}
                        onChange={set("company")}
                        placeholder="Company or Organization"
                        testid="contact-company"
                      />
                      <InputField
                        label="Phone / WhatsApp"
                        type="tel"
                        icon={Phone}
                        value={form.phone}
                        onChange={set("phone")}
                        placeholder="+91 98765 43210"
                        testid="contact-phone-input"
                      />
                    </div>

                    {/* Service / Discipline Selector */}
                    <div>
                      <label className="block text-[11px] font-mono tracking-wider uppercase text-muted mb-2 font-semibold">
                        Interested In <span className="text-accent">*</span>
                      </label>
                      <div className="flex flex-wrap gap-2" data-testid="contact-interests">
                        {SERVICES_OPTIONS.map((item) => {
                          const Icon = item.icon;
                          const isSelected = form.interest === item.id;
                          return (
                            <button
                              type="button"
                              key={item.id}
                              onClick={() => setForm((prev) => ({ ...prev, interest: item.id }))}
                              className={`group rounded-xl px-3.5 py-2 text-xs font-medium transition-all duration-200 border flex items-center gap-2 cursor-pointer ${
                                isSelected
                                  ? "bg-accent/20 border-accent text-accent shadow-[0_0_16px_rgba(17,168,49,0.3)] font-semibold"
                                  : "bg-[#060D1A]/70 border-white/10 text-slate-300 hover:text-white hover:border-accent/40 hover:bg-white/5"
                              }`}
                            >
                              <Icon size={14} className={isSelected ? "text-accent" : "text-muted group-hover:text-accent transition-colors"} />
                              <span>{item.label}</span>
                              {isSelected && (
                                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Message Field */}
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[11px] font-mono tracking-wider uppercase text-muted font-semibold flex items-center gap-1.5">
                          <MessageSquare size={13} className="text-accent" />
                          <span>Message</span>
                          <span className="text-accent">*</span>
                        </label>
                        <span className="text-[10px] font-mono text-muted/60">{form.message.length}/4000</span>
                      </div>
                      <div className="relative rounded-2xl bg-[#060D1A]/70 border border-white/10 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 transition-all flex flex-col">
                        <textarea
                          value={form.message}
                          onChange={set("message")}
                          required
                          rows={4}
                          maxLength={4000}
                          data-testid="contact-message"
                          placeholder="Tell us about your project or goals..."
                          className="w-full bg-transparent px-4 py-3 outline-none resize-none text-sm text-text-primary placeholder:text-muted/50 font-sans leading-relaxed min-h-[110px]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Error Notification */}
                  {status === "error" && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 p-3 text-xs flex items-center gap-2 font-mono"
                      data-testid="contact-error"
                    >
                      <AlertCircle size={15} className="shrink-0" />
                      <span>{resp}</span>
                    </motion.div>
                  )}

                  {/* Submit Action Button */}
                  <button
                    type="submit"
                    disabled={status === "loading"}
                    data-testid="contact-submit"
                    className="w-full rounded-2xl py-3.5 px-6 font-semibold text-sm text-white transition-all duration-300 shadow-[0_0_24px_rgba(17,168,49,0.35)] hover:shadow-[0_0_36px_rgba(17,168,49,0.55)] hover:scale-[1.008] active:scale-[0.992] bg-gradient-to-r from-[#11A831] via-[#0549B1] to-[#11A831] bg-[length:200%_auto] hover:bg-right cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed group mt-2"
                  >
                    {status === "loading" ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Sending Message...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Message</span>
                        <Send size={15} className="transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

function InputField({ label, type = "text", icon: Icon, value, onChange, required, placeholder, testid }) {
  return (
    <div>
      <label className="block text-[11px] font-mono tracking-wider uppercase text-muted mb-1.5 font-semibold">
        {label}
        {required && <span className="text-accent"> *</span>}
      </label>
      <div className="relative rounded-2xl bg-[#060D1A]/70 border border-white/10 hover:border-white/20 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 transition-all flex items-center">
        {Icon && (
          <span className="pl-3.5 text-muted shrink-0 pointer-events-none">
            <Icon size={16} />
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          data-testid={testid}
          className="w-full bg-transparent pl-2.5 pr-3.5 py-3 outline-none text-sm text-text-primary placeholder:text-muted/50 font-sans"
        />
      </div>
    </div>
  );
}
