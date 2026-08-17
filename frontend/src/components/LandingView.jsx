import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LandingView({ onNavigate, siteSettings, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMessage, setCouponMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [activeFaq, setActiveFaq] = useState(null);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);

  const basePrice = siteSettings?.coursePrice || 499;
  const discountPct = appliedCoupon?.discount_pct || 0;
  const price = discountPct > 0 ? Math.round(basePrice * (1 - discountPct / 100)) : basePrice;

  const heroTitle = siteSettings?.heroTitle || 'Master the Art of Landscape Architecture';
  const heroSubtitle = siteSettings?.heroSubtitle || 'Elevate your spatial vision from topographical grading to botanical scenography. Access industry-grade video masterclasses, CAD blueprints, and construction execution frameworks.';

  const rawPdfUrl = siteSettings?.curriculumPdfUrl || '/media/Landscape_Architecture_Syllabus_2026.pdf';
  // Use relative path so Vite proxy routes to backend without cross-origin iframe refusal
  const curriculumPdfUrl = rawPdfUrl.includes('localhost:8000')
    ? rawPdfUrl.replace(/^http:\/\/localhost:8000/, '')
    : rawPdfUrl;
  const curriculumPdfTitle = siteSettings?.curriculumPdfTitle || 'Landscape Architecture Masterclass Curriculum & Blueprint Guide 2026';
  const curriculumPdfSize = siteSettings?.curriculumPdfSize || '4.2 MB';

  const defaultModules = [
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

  // Dynamic course modules if published courses exist with modules
  const coursesFromBackend = siteSettings?.courses;
  const firstCourseModules = (coursesFromBackend && coursesFromBackend.length > 0 && coursesFromBackend[0].modules && coursesFromBackend[0].modules.length > 0)
    ? coursesFromBackend[0].modules.map((m, idx) => ({
        id: m.id || idx + 1,
        title: m.title,
        duration: "Comprehensive",
        lessonsCount: `${m.lessons?.length || 0} Lessons`,
        desc: "Structured architectural masterclass module.",
        lessons: (m.lessons || []).map(l => l.title)
      }))
    : defaultModules;

  const features = [
    {
      icon: "architecture",
      title: "Structured Video Masterclasses",
      desc: "In-depth architectural studio lessons and real-world construction site masterclasses."
    },
    {
      icon: "picture_as_pdf",
      title: "CAD & PDF Spec Blueprints",
      desc: "Downloadable structural cross-sections, CAD details, and material specification sheets."
    },
    {
      icon: "water_drop",
      title: "Hydro & Drainage Schematics",
      desc: "Sub-surface hydrological engineering calculations and retention basin schematics."
    },
    {
      icon: "construction",
      title: "Construction-Ready Toolkits",
      desc: "Full execution frameworks, material schedules, soil calculation formulas, and contractor briefing sheets."
    }
  ];

  const testimonials = siteSettings?.testimonials || [];

  const defaultFaqs = [
    {
      q: "Who is this Landscape Architecture Masterclass designed for?",
      a: "This masterclass is designed for practicing architects, landscape designers, civil engineers, and passionate property creators who want to master site grading, structural hardscape engineering, hydrological drainage, and high-end botanical curation."
    },
    {
      q: "How do I access the course and is access really lifetime?",
      a: "Yes! You get instant, 100% automated lifetime access immediately upon completing payment. Your email is your username and your phone number is your initial portal access password. There are zero subscriptions or recurring fees."
    },
    {
      q: "Are the structural CAD drawings and plant schedules downloadable?",
      a: "Yes, absolutely. All 25+ architectural blueprint packages, CAD details (.DWG & .PDF), retaining wall calculations, drainage cross-sections, and botanical palettes are fully downloadable for immediate use in AutoCAD, Revit, SketchUp, or Vectorworks."
    },
    {
      q: "Does this course provide government licensing or accredited certification?",
      a: "No. Landscape Mastery is a practical, field-tested executive masterclass and construction blueprint toolkit. It is built strictly for professional skill mastery, structural calculations, and field execution. It does not confer government licensing, academic degrees, or state board certifications."
    },
    {
      q: "Can I watch the video masterclasses on mobile or tablet?",
      a: "Yes. Our high-speed DRM cloud video player works seamlessly across all devices—desktops, laptops, iPads, tablets, and smartphones—with full playback speed controls and automatic progress resumption."
    },
    {
      q: "What if I have technical questions or need support during the course?",
      a: "Our dedicated architectural support team and instructors are available via email at contact@landscapemastery.com to answer your curriculum questions, provide software download guidance, and assist with any account queries."
    }
  ];

  const faqs = (siteSettings?.faqs && siteSettings.faqs.length > 0)
    ? siteSettings.faqs.map(f => ({ q: f.question, a: f.answer }))
    : defaultFaqs;

  // COUPON VALIDATION HANDLER
  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setCouponLoading(true);
    setCouponMessage(null);

    try {
      const res = await fetch('http://localhost:8000/api/checkout/coupon/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim().toUpperCase() })
      });

      const data = await res.json();
      setCouponLoading(false);

      if (res.ok && data.valid) {
        setAppliedCoupon(data);
        setCouponMessage({ type: 'success', text: `✓ Coupon ${data.code} applied! ${data.discount_pct}% discount applied.` });
      } else {
        setAppliedCoupon(null);
        setCouponMessage({ type: 'error', text: data.error || 'Invalid or expired coupon code.' });
      }
    } catch (err) {
      setCouponLoading(false);
      setCouponMessage({ type: 'error', text: 'Failed to validate coupon. Please try again.' });
    }
  };

  // CRITICAL PAYMENT FLOW (BUG-002, BUG-003): Strict Server-Side Verification
  const handlePayment = async (e) => {
    e.preventDefault();
    if (!email) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid email address to proceed.' });
      return;
    }

    setLoading(true);
    setStatusMessage(null);

    try {
      const response = await fetch('http://localhost:8000/api/checkout/session/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone })
      });

      if (!response.ok) {
        setLoading(false);
        setStatusMessage({ type: 'error', text: 'Unable to initialize checkout session. Please try again.' });
        return;
      }

      const data = await response.json();
      const razorpayKey = data.keyId || '';

      if (!window.Razorpay || !razorpayKey) {
        setLoading(false);
        setStatusMessage({
          type: 'error',
          text: 'Payment Gateway is currently in configuration mode. Please contact support at contact@landscapemastery.com.'
        });
        return;
      }

      const calculatedAmount = Math.round(price * 100);

      const options = {
        key: razorpayKey,
        amount: calculatedAmount,
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
        handler: async function (razorpayResponse) {
          try {
            setStatusMessage({ type: 'info', text: 'Verifying payment with secure server...' });
            const verifyRes = await fetch('http://localhost:8000/api/checkout/verify/', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: razorpayResponse.razorpay_order_id,
                razorpay_payment_id: razorpayResponse.razorpay_payment_id,
                razorpay_signature: razorpayResponse.razorpay_signature,
                email: email,
                phone: phone
              })
            });

            const verifyData = await verifyRes.json();
            setLoading(false);

            if (verifyRes.ok && verifyData.success && verifyData.token) {
              if (onLoginSuccess) {
                onLoginSuccess(verifyData);
              } else {
                onNavigate('v3');
              }
            } else {
              setStatusMessage({
                type: 'error',
                text: verifyData.error || 'Payment verification failed. Please contact support if amount was deducted.'
              });
            }
          } catch (verifyErr) {
            setLoading(false);
            setStatusMessage({
              type: 'error',
              text: 'Network error while verifying payment. Please refresh or contact support.'
            });
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            setStatusMessage({
              type: 'warning',
              text: 'Payment checkout was dismissed. Your account has not been charged.'
            });
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        setLoading(false);
        setStatusMessage({
          type: 'error',
          text: `Payment failed: ${resp.error.description || 'Transaction declined.'}`
        });
      });
      rzp.open();

    } catch (err) {
      console.error('Razorpay session error:', err);
      setLoading(false);
      setStatusMessage({
        type: 'error',
        text: 'Unable to connect to payment server. Please verify your connection.'
      });
    }
  };

  return (
    <div className="space-y-20 sm:space-y-28 pb-24 text-stone-900 overflow-hidden">
      {/* 1. LUXURY HERO SECTION (Full Viewport Masterpiece) */}
      <section className="relative min-h-[calc(100vh-76px)] flex flex-col justify-between items-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 pb-8">
        {/* Subtle Ambient Radial Glow & Architectural Lighting */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-gradient-to-tr from-emerald-500/15 via-teal-400/10 to-emerald-600/5 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Center Hero Content */}
        <div className="max-w-4xl mx-auto text-center space-y-5 sm:space-y-6 flex flex-col items-center my-auto">
          {/* Executive Tag Pill */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-md border border-emerald-800/15 py-1.5 px-4 rounded-full shadow-xs"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            <span className="text-[11px] font-bold text-emerald-950 uppercase tracking-widest">
              Executive Architectural Masterclass • 2026 Edition
            </span>
          </motion.div>

          {/* Master Headline */}
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="font-serif text-4xl sm:text-5.5xl lg:text-6xl font-bold tracking-tight text-emerald-950 leading-[1.12]"
          >
            Master the Art of <br className="hidden sm:inline" />
            <span className="italic font-normal bg-gradient-to-r from-emerald-950 via-emerald-800 to-teal-800 bg-clip-text text-transparent">
              Landscape Architecture
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-sm sm:text-base lg:text-lg text-stone-600 leading-relaxed max-w-2xl font-light"
          >
            {heroSubtitle}
          </motion.p>

          {/* Primary Action Button Group */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="flex flex-wrap justify-center items-center gap-4 pt-1"
          >
            <a 
              href="#enroll-card"
              className="bg-emerald-900 hover:bg-emerald-800 text-white font-semibold text-sm sm:text-base px-8 py-3.5 rounded-full shadow-xl shadow-emerald-950/25 transition-all flex items-center gap-2.5 cursor-pointer btn-shine"
            >
              <span>Enroll Now for ₹{price}</span>
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </a>
            <button 
              onClick={() => {
                const el = document.getElementById('course-curriculum');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-white/95 hover:bg-stone-100 text-stone-800 font-semibold text-sm sm:text-base px-7 py-3.5 rounded-full transition-all border border-stone-300 shadow-xs cursor-pointer flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg text-rose-700">picture_as_pdf</span>
              <span>Explore Full Syllabus (PDF)</span>
            </button>
          </motion.div>

          {/* Trust Guarantees Strip */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-wrap justify-center items-center gap-5 sm:gap-8 text-xs font-semibold text-stone-500 pt-1"
          >
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-emerald-700 text-base">verified</span>
              100% Lifetime Access
            </span>
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-emerald-700 text-base">lock</span>
              Secure &amp; DRM Encrypted
            </span>
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-emerald-700 text-base">architecture</span>
              Vector CAD Blueprints Included
            </span>
          </motion.div>
        </div>

        {/* Bottom Feature Pill Strip & Scroll Cue */}
        <div className="w-full flex flex-col items-center gap-3 pt-6">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="inline-flex flex-wrap justify-center items-center gap-3 sm:gap-6 bg-white/90 backdrop-blur-md border border-stone-200/90 py-2.5 px-6 rounded-full shadow-xs text-xs font-semibold text-stone-700"
          >
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-emerald-700">auto_stories</span>
              <span>4 Engineering Modules</span>
            </span>
            <span className="hidden sm:inline text-stone-300">•</span>
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-emerald-700">picture_as_pdf</span>
              <span>14 CAD Blueprints</span>
            </span>
            <span className="hidden sm:inline text-stone-300">•</span>
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-emerald-700">movie</span>
              <span>HD Video Masterclasses</span>
            </span>
            <span className="hidden sm:inline text-stone-300">•</span>
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-emerald-700">construction</span>
              <span>Field Construction Toolkits</span>
            </span>
          </motion.div>

          <button
            onClick={() => {
              const el = document.getElementById('features');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex items-center gap-1 text-[11px] font-semibold text-stone-400 hover:text-emerald-800 transition-colors cursor-pointer group mt-1"
          >
            <span>Scroll to explore framework</span>
            <span className="material-symbols-outlined text-sm animate-bounce group-hover:text-emerald-700">keyboard_arrow_down</span>
          </button>
        </div>
      </section>

      {/* 2. MASTERCLASS FRAMEWORK / FEATURES */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-800 bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-full">
            The Masterclass Advantage
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold text-emerald-950 tracking-tight">
            Architectural Precision from Site Topography to Botanical Scenography
          </h2>
          <p className="text-sm sm:text-base text-stone-600 max-w-xl mx-auto">
            A comprehensive, rigorous curriculum distilled from decades of award-winning exterior projects.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -6 }}
              className="bg-white p-7 rounded-3xl border border-stone-200/90 shadow-sm hover:shadow-xl hover:border-emerald-700/40 transition-all duration-300 space-y-4"
            >
              <div className="w-13 h-13 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center shadow-inner">
                <span className="material-symbols-outlined text-2xl">{f.icon}</span>
              </div>
              <h3 className="font-serif text-xl font-bold text-stone-900">{f.title}</h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 3. OFFICIAL CURRICULUM & SYLLABUS PDF DOCUMENT SHOWCASE */}
      <section id="course-curriculum" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-b from-stone-50 via-white to-stone-50 rounded-3xl border border-stone-200 p-6 sm:p-10 lg:p-12 space-y-8 shadow-sm">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-stone-200 pb-6">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full inline-block">
                Official Syllabus &amp; Blueprint Specifications
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-emerald-950 pt-2">
                Course Curriculum &amp; Field Blueprint Guide
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 max-w-2xl">
                Review the comprehensive syllabus document uploaded by our faculty, covering complete masterclass modules, vector CAD specs, and technical construction toolkits.
              </p>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs font-semibold text-emerald-900 bg-emerald-100/80 border border-emerald-300 px-3.5 py-1.5 rounded-full flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                <span>Verified Faculty Release (2026)</span>
              </span>
            </div>
          </div>

          {/* Editorial PDF Document Hero Card */}
          <div className="bg-stone-900 text-stone-100 rounded-3xl p-6 sm:p-8 lg:p-10 border border-emerald-500/20 shadow-xl relative overflow-hidden">
            {/* Ambient Green Glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
              {/* Left Details Column */}
              <div className="lg:col-span-7 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center flex-shrink-0 shadow-inner">
                    <span className="material-symbols-outlined text-2xl">picture_as_pdf</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 block">
                      Curriculum Document • {curriculumPdfSize}
                    </span>
                    <h3 className="font-serif text-xl sm:text-2xl font-bold text-white leading-tight">
                      {curriculumPdfTitle}
                    </h3>
                  </div>
                </div>

                {/* Key Syllabus Contents List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                  <div className="bg-stone-950/60 border border-stone-800 p-3.5 rounded-2xl space-y-1">
                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                      <span className="material-symbols-outlined text-sm">architecture</span>
                      <span>Vector CAD Blueprints</span>
                    </div>
                    <p className="text-[11px] text-stone-400">
                      14 construction detail prints, retaining wall specs &amp; elevation sheets (.DWG &amp; PDF).
                    </p>
                  </div>

                  <div className="bg-stone-950/60 border border-stone-800 p-3.5 rounded-2xl space-y-1">
                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                      <span className="material-symbols-outlined text-sm">terrain</span>
                      <span>Grading &amp; Soil Mechanics</span>
                    </div>
                    <p className="text-[11px] text-stone-400">
                      Cut/fill volume calculators, contour slope interpolation, and microclimate formulas.
                    </p>
                  </div>

                  <div className="bg-stone-950/60 border border-stone-800 p-3.5 rounded-2xl space-y-1">
                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                      <span className="material-symbols-outlined text-sm">forest</span>
                      <span>Botanical Plant Matrix</span>
                    </div>
                    <p className="text-[11px] text-stone-400">
                      150+ drought-tolerant species, canopy layering schedules, and root depth formulas.
                    </p>
                  </div>

                  <div className="bg-stone-950/60 border border-stone-800 p-3.5 rounded-2xl space-y-1">
                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                      <span className="material-symbols-outlined text-sm">lightbulb</span>
                      <span>Lighting &amp; Hydraulics</span>
                    </div>
                    <p className="text-[11px] text-stone-400">
                      Low-voltage luminaire photometrics, reflection pool circulation &amp; water engineering.
                    </p>
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="flex flex-wrap items-center gap-3.5 pt-2">
                  <a
                    href={curriculumPdfUrl}
                    download="Landscape_Architecture_Syllabus_2026.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-bold text-xs sm:text-sm px-6 py-3.5 rounded-xl transition-all shadow-lg flex items-center gap-2 cursor-pointer group"
                  >
                    <span className="material-symbols-outlined text-lg group-hover:-translate-y-0.5 transition-transform">download</span>
                    <span>Download Official Syllabus (PDF)</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => setPdfPreviewOpen(true)}
                    className="bg-stone-800/90 hover:bg-stone-700 text-stone-200 font-semibold text-xs sm:text-sm px-5 py-3.5 rounded-xl transition-all border border-stone-700 flex items-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg text-emerald-400">visibility</span>
                    <span>Preview Document in Browser</span>
                  </button>
                </div>
              </div>

              {/* Right Document Preview Graphic */}
              <div className="lg:col-span-5 flex justify-center">
                <div 
                  onClick={() => setPdfPreviewOpen(true)}
                  className="bg-stone-100 text-stone-900 rounded-2xl p-5 shadow-2xl border-4 border-stone-800 w-full max-w-sm cursor-pointer group hover:scale-[1.02] transition-all relative"
                >
                  <div className="flex justify-between items-center border-b border-stone-300 pb-3 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-rose-500" />
                      <div className="w-3 h-3 rounded-full bg-amber-500" />
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    </div>
                    <span className="text-[10px] font-mono text-stone-500 font-bold uppercase">SYLLABUS.PDF • 2026</span>
                  </div>

                  <div className="space-y-3 bg-white p-4 rounded-xl border border-stone-200">
                    <div className="border-b border-stone-100 pb-2">
                      <span className="text-[9px] font-bold text-emerald-800 uppercase tracking-widest block">LANDSCAPE MASTERY</span>
                      <h4 className="font-serif font-bold text-xs text-stone-900 leading-tight mt-0.5">
                        Architectural Masterclass &amp; Blueprint Guide
                      </h4>
                    </div>

                    <div className="space-y-1.5 text-[10px] text-stone-600">
                      <div className="flex justify-between py-1 border-b border-stone-100">
                        <span className="font-semibold text-stone-800">Module 1: Topography &amp; Grading</span>
                        <span className="font-mono text-stone-500">4 Lessons</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-stone-100">
                        <span className="font-semibold text-stone-800">Module 2: Masonry &amp; Hardscapes</span>
                        <span className="font-mono text-stone-500">3 Lessons</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-stone-100">
                        <span className="font-semibold text-stone-800">Module 3: Botanical Palettes</span>
                        <span className="font-mono text-stone-500">4 Lessons</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="font-semibold text-stone-800">Module 4: Lighting Scenography</span>
                        <span className="font-mono text-stone-500">3 Lessons</span>
                      </div>
                    </div>

                    <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-200 text-[10px] text-emerald-900 font-semibold flex items-center justify-between">
                      <span>Vector CAD Blueprints Included</span>
                      <span className="material-symbols-outlined text-xs">verified</span>
                    </div>
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-emerald-950/70 rounded-2xl flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs">
                    <span className="material-symbols-outlined text-3xl mb-1 text-emerald-300">fullscreen</span>
                    <span className="text-xs font-bold">Click to View Syllabus Document</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SYLLABUS PDF PREVIEW MODAL */}
      <AnimatePresence>
        {pdfPreviewOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-stone-900 border border-stone-700 rounded-3xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden shadow-2xl"
            >
              {/* Modal Header */}
              <div className="p-4 sm:px-6 bg-stone-950 border-b border-stone-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">{curriculumPdfTitle}</h3>
                    <span className="text-[10px] text-stone-400 font-mono">Official PDF Syllabus • {curriculumPdfSize}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={curriculumPdfUrl}
                    download="Landscape_Architecture_Syllabus_2026.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">download</span>
                    <span>Download PDF</span>
                  </a>
                  <button
                    onClick={() => setPdfPreviewOpen(false)}
                    className="text-stone-400 hover:text-white p-1.5 rounded-xl hover:bg-stone-800 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-xl">close</span>
                  </button>
                </div>
              </div>

              {/* Modal PDF Viewer */}
              <div className="flex-1 bg-stone-950 p-2 sm:p-3 flex flex-col min-h-0">
                <object
                  data={curriculumPdfUrl}
                  type="application/pdf"
                  className="w-full h-full rounded-2xl bg-white border border-stone-800"
                >
                  <iframe
                    src={curriculumPdfUrl}
                    title="Curriculum Syllabus PDF Preview"
                    className="w-full h-full rounded-2xl border border-stone-800 bg-white"
                  >
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center text-white space-y-4 bg-stone-900 rounded-2xl">
                      <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                        <span className="material-symbols-outlined text-3xl">picture_as_pdf</span>
                      </div>
                      <h4 className="font-bold text-lg text-white">{curriculumPdfTitle}</h4>
                      <p className="text-xs text-stone-400 max-w-md">
                        The PDF syllabus is ready for download or direct browser viewing.
                      </p>
                      <a
                        href={curriculumPdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-bold px-6 py-2.5 rounded-xl transition-all flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-sm">open_in_new</span>
                        <span>Open Document in Fullscreen</span>
                      </a>
                    </div>
                  </iframe>
                </object>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. ARCHITECTURAL TESTIMONIALS (Shown only if configured in Admin) */}
      {testimonials && testimonials.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              Practitioner Reviews
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-emerald-950">
              Architect Reviews &amp; Feedback
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.id} className="bg-white p-7 rounded-3xl border border-stone-200 shadow-sm flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex gap-1 text-amber-500">
                    {[...Array(t.rating || 5)].map((_, idx) => (
                      <span key={idx} className="material-symbols-outlined text-sm">star</span>
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-stone-700 leading-relaxed italic">
                    "{t.content}"
                  </p>
                </div>
                <div className="pt-3 border-t border-stone-100">
                  <div className="font-bold text-xs sm:text-sm text-stone-900">{t.student_name}</div>
                  <div className="text-[11px] text-stone-500">{t.student_title || 'Architect'}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. PRICING & INSTANT ENROLLMENT CARD */}
      <section id="enroll-card" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-[#063327] via-[#022119] to-[#01140f] text-white rounded-3xl p-6 sm:p-10 lg:p-12 shadow-[0_24px_70px_-12px_rgba(2,44,33,0.5)] border border-emerald-500/25 relative overflow-hidden">
          {/* Subtle Ambient Radial Lighting */}
          <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
            {/* Left Value Column */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 bg-emerald-900/80 text-emerald-200 text-[11px] font-bold px-3.5 py-1.5 rounded-full uppercase tracking-widest border border-emerald-600/40 shadow-inner">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Executive Architectural Access • 2026 Pass</span>
              </div>

              <div className="space-y-2">
                <h2 className="font-serif text-3xl sm:text-4xl lg:text-4.5xl font-bold text-white leading-[1.18] tracking-tight">
                  Unlock Complete <br />
                  <span className="italic font-normal text-emerald-300">Masterclass Access</span>
                </h2>
                <p className="text-xs sm:text-sm text-emerald-100/80 font-light leading-relaxed max-w-md">
                  Comprehensive spatial design, CAD execution schematics, and botanical curation tailored for practitioners.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3 text-xs sm:text-sm text-emerald-50">
                  <span className="material-symbols-outlined text-emerald-400 text-lg flex-shrink-0 mt-0.5">verified</span>
                  <div>
                    <strong className="text-white font-semibold">Structured Video Masterclasses:</strong>
                    <span className="text-emerald-200/80 block text-xs">High-definition DRM video modules covering grading, masonry, drainage &amp; lighting.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-xs sm:text-sm text-emerald-50">
                  <span className="material-symbols-outlined text-emerald-400 text-lg flex-shrink-0 mt-0.5">architecture</span>
                  <div>
                    <strong className="text-white font-semibold">Downloadable CAD Blueprints:</strong>
                    <span className="text-emerald-200/80 block text-xs">AutoCAD DWG &amp; PDF structural cross-sections and spec sheets.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-xs sm:text-sm text-emerald-50">
                  <span className="material-symbols-outlined text-emerald-400 text-lg flex-shrink-0 mt-0.5">construction</span>
                  <div>
                    <strong className="text-white font-semibold">Practical Field Toolkits:</strong>
                    <span className="text-emerald-200/80 block text-xs">Soil mechanics formulas, retaining wall calculations &amp; contractor specification guides.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-xs sm:text-sm text-emerald-50">
                  <span className="material-symbols-outlined text-emerald-400 text-lg flex-shrink-0 mt-0.5">all_inclusive</span>
                  <div>
                    <strong className="text-white font-semibold">100% Lifetime Access:</strong>
                    <span className="text-emerald-200/80 block text-xs">Zero recurring fees. Access all future curriculum expansions.</span>
                  </div>
                </div>
              </div>

              {/* Price Display */}
              <div className="pt-4 border-t border-emerald-800/80 flex flex-wrap items-baseline gap-3.5">
                <span className="text-4xl sm:text-5xl font-bold font-serif text-white tracking-tight">₹{price}</span>
                {discountPct > 0 ? (
                  <span className="text-lg line-through text-emerald-400/60 font-sans">₹{basePrice}</span>
                ) : null}
                <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">One-Time Investment • Lifetime Access</span>
                
                {discountPct > 0 && (
                  <span className="inline-block text-[11px] font-bold bg-emerald-400 text-emerald-950 px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                    {discountPct}% Discount Applied
                  </span>
                )}
              </div>
            </div>

            {/* Right Form Card */}
            <div className="lg:col-span-5 bg-white text-stone-900 p-6 sm:p-8 rounded-3xl shadow-2xl border border-stone-100 space-y-4">
              <div className="flex justify-between items-start pb-2 border-b border-stone-100">
                <div>
                  <h3 className="font-serif text-xl font-bold text-stone-900">Instant Enrollment</h3>
                  <p className="text-[11px] text-stone-500 mt-0.5">Instant automated portal activation.</p>
                </div>
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-1 rounded-md border border-emerald-200">
                  <span className="material-symbols-outlined text-xs">lock</span>
                  256-Bit SSL
                </span>
              </div>

              {statusMessage && (
                <div className={`p-3.5 rounded-xl text-xs font-semibold ${
                  statusMessage.type === 'error' ? 'bg-rose-50 border border-rose-200 text-rose-800' :
                  statusMessage.type === 'warning' ? 'bg-amber-50 border border-amber-200 text-amber-900' :
                  'bg-emerald-50 border border-emerald-200 text-emerald-900'
                }`}>
                  {statusMessage.text}
                </div>
              )}

              <form onSubmit={handlePayment} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Email Address <span className="text-emerald-700">*</span>
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-sm">mail</span>
                    <input
                      type="email"
                      required
                      placeholder="architect@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-emerald-700 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Phone Number <span className="text-stone-400 font-normal text-[10px] lowercase">(login password)</span>
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-sm">phone_iphone</span>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-emerald-700 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Coupon Code Input */}
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Have a Coupon Code?
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-sm">local_offer</span>
                      <input
                        type="text"
                        placeholder="e.g. ARCHITECT20"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-3 py-2 text-xs font-mono font-bold text-stone-900 focus:outline-none focus:border-emerald-700 focus:bg-white uppercase"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !couponCode.trim()}
                      className="bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold px-4 py-2 rounded-xl transition-all border border-stone-300 cursor-pointer disabled:opacity-50 flex items-center justify-center min-w-[65px]"
                    >
                      {couponLoading ? '...' : 'Apply'}
                    </button>
                  </div>
                  {couponMessage && (
                    <div className={`mt-1.5 text-[11px] font-semibold ${couponMessage.type === 'success' ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {couponMessage.text}
                    </div>
                  )}
                </div>

                {/* Submit Checkout Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-emerald-900 to-emerald-950 hover:from-emerald-800 hover:to-emerald-900 text-white font-semibold text-xs sm:text-sm py-3.5 rounded-xl shadow-lg shadow-emerald-950/25 transition-all flex items-center justify-center gap-2 cursor-pointer mt-3 btn-shine"
                >
                  <span className="material-symbols-outlined text-base">lock</span>
                  <span>{loading ? 'Connecting Payment Gateway...' : `Proceed to Secure Payment • ₹${price}`}</span>
                </button>
              </form>

              {/* Payment Security / Trust Footer */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-center gap-3 text-[10px] text-stone-400 font-semibold uppercase tracking-wider">
                <span>Razorpay Verified</span>
                <span>•</span>
                <span>UPI &amp; Cards</span>
                <span>•</span>
                <span>Instant Access</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FREQUENTLY ASKED QUESTIONS */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-800 bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-full">
            Assistance &amp; Curriculum Details
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-emerald-950">Frequently Asked Questions</h2>
          <p className="text-xs sm:text-sm text-stone-600 max-w-lg mx-auto">
            Everything you need to know about course access, downloadable blueprints, practical toolkits, and learning resources.
          </p>
        </div>

        <div className="space-y-3.5">
          {faqs.map((f, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div 
                key={idx} 
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isOpen 
                    ? 'bg-emerald-50/30 border-emerald-700/40 shadow-md ring-1 ring-emerald-700/20' 
                    : 'bg-white border-stone-200/90 shadow-xs hover:border-stone-300'
                }`}
              >
                <button
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  className="w-full text-left p-5 sm:p-6 font-semibold text-xs sm:text-sm text-stone-900 flex justify-between items-center gap-4 hover:bg-stone-50/60 transition-colors cursor-pointer"
                >
                  <span className="font-serif font-bold sm:text-base text-emerald-950 flex items-center gap-3">
                    <span className="w-7 h-7 rounded-xl bg-emerald-100/70 text-emerald-900 border border-emerald-200 text-xs font-mono flex items-center justify-center flex-shrink-0">
                      0{idx + 1}
                    </span>
                    {f.q}
                  </span>
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-200 flex-shrink-0 ${
                    isOpen ? 'bg-emerald-800 text-white rotate-180' : 'bg-stone-100 text-stone-600'
                  }`}>
                    <span className="material-symbols-outlined text-sm">
                      {isOpen ? 'expand_less' : 'expand_more'}
                    </span>
                  </span>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      className="px-5 sm:px-6 pb-6 text-xs sm:text-sm text-stone-600 leading-relaxed border-t border-emerald-200/40 pt-4"
                    >
                      {f.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Support Callout Box */}
        <div className="mt-10 p-6 rounded-2xl bg-white border border-stone-200 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-xl">contact_support</span>
            </div>
            <div>
              <div className="font-bold text-xs sm:text-sm text-stone-900">Have a specific architectural or licensing question?</div>
              <div className="text-[11px] text-stone-500">Our instructors are ready to assist you.</div>
            </div>
          </div>
          <a
            href="mailto:contact@landscapemastery.com"
            className="bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs px-5 py-2.5 rounded-xl transition-all border border-stone-300 flex-shrink-0"
          >
            Contact Support
          </a>
        </div>
      </section>
    </div>
  );
}
