import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MagneticButton from './MagneticButton.jsx';

export default function LandingView({ onNavigate, siteSettings }) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);
  const [activeTab, setActiveTab] = useState('curriculum');

  const price = siteSettings?.coursePrice || 499;
  const heroTitle = siteSettings?.heroTitle || 'Master the Art of Landscape Architecture';
  const heroSubtitle = siteSettings?.heroSubtitle || 'Elevate your architectural vision. Access industry-leading video modules, spatial planning frameworks, and achieve complete mastery in creating serene, high-end environments.';

  const modules = [
    {
      id: 1,
      title: "Module 1: Spatial Planning & Site Topography",
      duration: "3 hrs 15 mins",
      lessonsCount: "4 Lessons",
      desc: "Master environmental grading, contour analysis, elevation transitions, and microclimate orientation.",
      lessons: [
        "1.1 Site Analysis & Geological Contour Mapping (45m)",
        "1.2 Soil Mechanics & Earthwork Cut/Fill Optimization (52m)",
        "1.3 Sunlight Path & Wind Flow Microclimates (48m)",
        "1.4 Master Blueprint Layout Workshop (50m)"
      ]
    },
    {
      id: 2,
      title: "Module 2: Hardscape Geometries & Stonework Masonry",
      duration: "2 hrs 50 mins",
      lessonsCount: "3 Lessons",
      desc: "Engineered retaining walls, permeable pavers, luxury outdoor kitchen integration, and structural hardscapes.",
      lessons: [
        "2.1 Stone Selection & Thermal Expansion Buffers (58m)",
        "2.2 Cantilevered Terraces & Retaining Wall Engineering (64m)",
        "2.3 Exterior Hardscape Spec Sheets & PDF Blueprints (48m)"
      ]
    },
    {
      id: 3,
      title: "Module 3: Planting Ecology & Mediterranean Palettes",
      duration: "3 hrs 30 mins",
      lessonsCount: "4 Lessons",
      desc: "Drought-tolerant botanical selection, layered canopy design, root depth strategies, and year-round bloom schedules.",
      lessons: [
        "3.1 Native Flora & Biophilic Zoning Principles (55m)",
        "3.2 Canopy Layering: Overstory, Understory & Groundcover (49m)",
        "3.3 Water-Wise Drip & Sub-Surface Irrigation Schematics (56m)",
        "3.4 Specimen Tree Sourcing & Focal Point Anchors (50m)"
      ]
    },
    {
      id: 4,
      title: "Module 4: High-End Lighting & Water Scenography",
      duration: "2 hrs 40 mins",
      lessonsCount: "3 Lessons",
      desc: "Low-voltage architectural illumination, ambient grazing, reflection pools, and modern hydro-design.",
      lessons: [
        "4.1 Nocturnal Lighting Levels: Grazing, Silhouetting & Path Optics (54m)",
        "4.2 Hydro-Engineering: Reflection Basins & Infinity Weirs (56m)",
        "4.3 Smart Automation & Ambient Scene Preset Controls (50m)"
      ]
    }
  ];

  const features = [
    {
      icon: "architecture",
      title: "Executive Video Masterclasses",
      desc: "12.5+ hours of 4K cinematic studio and real-world construction site masterclasses."
    },
    {
      icon: "picture_as_pdf",
      title: "CAD & PDF Spec Blueprints",
      desc: "Downloadable structural cross-sections, CAD details, and material specification sheets."
    },
    {
      icon: "water_drop",
      title: "Hydro & Drainage Schematics",
      desc: "Sub-surface hydrological engineering equations and retention basin calculators."
    },
    {
      icon: "workspace_premium",
      title: "Official Certification",
      desc: "Accredited Landscape Mastery Certificate of Completion upon finishing the curriculum."
    }
  ];

  const faqs = [
    {
      q: "Who is this masterclass designed for?",
      a: "This course is tailored for practicing architects, landscape designers, civil engineers, and passionate property creators who want to master spatial planning, structural hardscape engineering, and high-end botanical curation."
    },
    {
      q: "How do I access the course after payment?",
      a: "Instant automated access is provided immediately after payment. Your email is your username and your phone number is your secure access password. You will also receive an instant confirmation email via our Hostinger SMTP dispatcher."
    },
    {
      q: "Is there a time limit to complete the course?",
      a: "No. You receive lifetime access to all current video modules, downloadable PDF blueprints, spec sheets, and future curriculum updates."
    },
    {
      q: "Can I download the materials for offline reference?",
      a: "All PDF blueprints, CAD details, and material specification sheets are 100% downloadable. Video masterclasses are streamed in protected 4K HDR via our high-speed DRM cloud player."
    }
  ];

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/checkout/session/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone })
      });

      const data = await response.json();
      const razorpayKey = data.keyId || '';

      if (window.Razorpay && razorpayKey) {
        const options = {
          key: razorpayKey,
          amount: data.amount || 49900,
          currency: 'INR',
          name: 'Landscape Mastery',
          description: 'Executive Architecture Masterclass - Lifetime Access',
          image: '/lm_logo.png',
          prefill: {
            email: email,
            contact: phone || ''
          },
          theme: {
            color: '#064e3b',
          },
          handler: function (response) {
            setLoading(false);
            onNavigate('v3');
          },
          modal: {
            ondismiss: function () {
              setLoading(false);
              onNavigate('v3');
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        setLoading(false);
        onNavigate('v3');
      }
    } catch (err) {
      console.error('Razorpay session error:', err);
      setLoading(false);
      onNavigate('v3');
    }
  };

  return (
    <div className="space-y-20 pb-24 font-body-md text-stone-900">
      {/* 1. HERO SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 md:pt-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Hero Left Content */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 space-y-6"
          >
            <div className="flex flex-wrap items-center gap-3">
              <span className="bg-emerald-100 text-emerald-900 border border-emerald-300/80 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Executive Architecture Curriculum
              </span>
              <span className="bg-stone-100 text-stone-700 border border-stone-300 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                Lifetime Access
              </span>
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-emerald-950 leading-[1.15]">
              {heroTitle}
            </h1>

            <p className="text-base sm:text-lg text-stone-600 max-w-xl leading-relaxed">
              {heroSubtitle}
            </p>

            {/* Quick Metrics Banner */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-stone-200/80 max-w-lg">
              <div>
                <div className="font-serif text-2xl font-bold text-emerald-950">12.5+ hrs</div>
                <div className="text-xs text-stone-500 font-medium">4K Video Masterclasses</div>
              </div>
              <div>
                <div className="font-serif text-2xl font-bold text-emerald-950">14 PDFs</div>
                <div className="text-xs text-stone-500 font-medium">CAD Spec Blueprints</div>
              </div>
              <div>
                <div className="font-serif text-2xl font-bold text-emerald-950">4.9 ★</div>
                <div className="text-xs text-stone-500 font-medium">Over 120+ Architects</div>
              </div>
            </div>
          </motion.div>

          {/* Hero Right: Glassmorphic Checkout Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            id="enroll-card"
            className="lg:col-span-5"
          >
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-2xl relative overflow-hidden">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-stone-900">Enroll Today</h2>
                  <p className="text-xs text-stone-500 mt-0.5">Instant access to all modules &amp; blueprints.</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-stone-400 line-through block">₹14,999</span>
                  <span className="font-serif text-2xl font-bold text-emerald-900">₹{price}</span>
                </div>
              </div>

              <form onSubmit={handlePayment} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="architect@example.com"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-900 placeholder-stone-400 focus:bg-white focus:border-emerald-700 focus:outline-none transition-all"
                  />
                  <span className="text-[11px] text-stone-400 mt-1 block">Your email will serve as your permanent username.</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Phone Number <span className="text-stone-400">(Access Password)</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-900 placeholder-stone-400 focus:bg-white focus:border-emerald-700 focus:outline-none transition-all"
                  />
                </div>

                <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-700 text-base">verified</span>
                    <span className="font-semibold text-emerald-950">Lifetime Access Included</span>
                  </div>
                  <span className="font-bold text-emerald-900">₹{price} One-Time</span>
                </div>

                <MagneticButton 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-900 hover:bg-emerald-800 text-white font-semibold py-4 rounded-2xl text-sm flex justify-center items-center gap-2 shadow-lg shadow-emerald-950/20 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">lock</span>
                  {loading ? 'Securing Payment...' : 'Pay & Unlock Immediate Access'}
                </MagneticButton>
              </form>

              {/* Security Badges */}
              <div className="mt-6 pt-4 border-t border-stone-100 flex justify-between items-center text-[11px] text-stone-500 font-medium">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-emerald-700">shield</span>
                  256-Bit SSL Secured
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-emerald-700">bolt</span>
                  Instant Activation
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. HERO FEATURE SHOWCASE */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-emerald-950">
            A Masterclass Built For Visionaries
          </h2>
          <p className="text-sm text-stone-600 mt-2">
            Every module combines rigorous structural science with high-end aesthetic philosophy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-sm hover:shadow-md transition-shadow space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-800 shadow-sm">
                <span className="material-symbols-outlined text-2xl">{f.icon}</span>
              </div>
              <h3 className="font-serif text-lg font-bold text-stone-900">{f.title}</h3>
              <p className="text-xs text-stone-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. INTERACTIVE CURRICULUM BREAKDOWN */}
      <section id="course-curriculum" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-stone-50 rounded-3xl p-8 md:p-12 border border-stone-200/80 shadow-sm space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-stone-200 pb-6">
            <div>
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest block mb-1">Detailed Syllabus</span>
              <h2 className="font-serif text-3xl font-bold text-emerald-950">Curriculum &amp; Masterclass Modules</h2>
            </div>
            <button 
              onClick={() => {
                const el = document.getElementById('enroll-card');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-semibold px-5 py-2.5 rounded-full transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <span>Enroll Now</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {modules.map((mod) => (
              <div key={mod.id} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-stone-900">{mod.title}</h3>
                    <p className="text-xs text-stone-500 mt-1">{mod.desc}</p>
                  </div>
                  <span className="bg-emerald-50 text-emerald-900 border border-emerald-200 text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap">
                    {mod.duration}
                  </span>
                </div>

                <div className="space-y-2 pt-2 border-t border-stone-100">
                  {mod.lessons.map((les, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-stone-700">
                      <span className="material-symbols-outlined text-emerald-700 text-sm">play_circle</span>
                      <span>{les}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. FREQUENTLY ASKED QUESTIONS */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-emerald-950">Frequently Asked Questions</h2>
          <p className="text-sm text-stone-600">Everything you need to know about the masterclass and platform access.</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div 
                key={idx} 
                className="bg-white rounded-2xl border border-stone-200/90 shadow-sm overflow-hidden transition-all"
              >
                <button
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex justify-between items-center gap-4 font-semibold text-sm text-stone-900 cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <span className={`material-symbols-outlined text-emerald-700 text-xl transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                    keyboard_arrow_down
                  </span>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-5 pb-5 text-xs text-stone-600 leading-relaxed border-t border-stone-100 pt-3"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. FINAL CALL TO ACTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-emerald-950 to-teal-950 text-white rounded-3xl p-8 sm:p-14 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <span className="text-xs uppercase font-bold text-emerald-400 tracking-widest">Architectural Excellence</span>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold max-w-2xl mx-auto leading-tight">
            Elevate Your Landscape Vision Today
          </h2>
          <p className="text-sm sm:text-base text-emerald-200/80 max-w-xl mx-auto">
            Join visionary architects worldwide and gain immediate lifetime access to the entire video masterclass library.
          </p>

          <div className="pt-2">
            <button
              onClick={() => {
                const el = document.getElementById('enroll-card');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-white text-emerald-950 hover:bg-stone-100 font-bold text-sm px-8 py-4 rounded-full shadow-lg transition-transform hover:scale-105 cursor-pointer inline-flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">lock</span>
              Unlock Complete Masterclass (₹{price})
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
