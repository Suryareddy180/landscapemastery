import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CourseCatalog from './CourseCatalog.jsx';
import { BASE_URL } from '../lib/api.js';

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

  // Multi-course state
  const [catalogCourses, setCatalogCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState([]);

  // Fetch course catalog on mount
  useEffect(() => {
    fetchCatalog();
  }, []);

  const fetchCatalog = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/public/courses/`);
      if (res.ok) {
        const data = await res.json();
        setCatalogCourses(data.courses || []);
      }
    } catch (e) {
      // Silently fall back — catalog will be empty
    }
  };

  const handleSelectCourse = (course) => {
    setSelectedCourse(course);
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponMessage(null);
    setStatusMessage(null);
    // Scroll to enrollment form
    setTimeout(() => {
      const el = document.getElementById('enroll-card');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const basePrice = selectedCourse ? (selectedCourse.discount_price || selectedCourse.price) : (siteSettings?.coursePrice || 499);
  const discountPct = appliedCoupon?.discount_pct || 0;
  const price = discountPct > 0 ? Math.round(basePrice * (1 - discountPct / 100)) : basePrice;
  const lowestCoursePrice = catalogCourses.length > 0 ? Math.min(...catalogCourses.map(c => c.discount_price || c.price)) : basePrice;

  const heroTitle = siteSettings?.heroTitle || 'Master the Art of Landscape Architecture';
  const heroSubtitle = siteSettings?.heroSubtitle || 'Elevate your spatial vision from topographical grading to botanical scenography. Access industry-grade video masterclasses, CAD blueprints, and construction execution frameworks.';

  const rawPdfUrl = siteSettings?.curriculumPdfUrl || '/media/Landscape_Architecture_Syllabus_2026.pdf';
  // Use relative path so Vite proxy routes to backend without cross-origin iframe refusal
  const curriculumPdfUrl = rawPdfUrl.startsWith('http') ? rawPdfUrl : rawPdfUrl;
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
      const res = await fetch(`${BASE_URL}/api/checkout/coupon/`, {
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
      const response = await fetch(`${BASE_URL}/api/checkout/session/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone, course_id: selectedCourse?.id || null })
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
        description: selectedCourse ? `${selectedCourse.title} - Lifetime Access` : 'Executive Architecture Masterclass - Lifetime Access',
        image: '/lm_logo.png',
        notes: {
          course_id: selectedCourse?.id || '',
          course_title: selectedCourse?.title || 'Landscape Mastery'
        },
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
            const verifyRes = await fetch(`${BASE_URL}/api/checkout/verify/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: razorpayResponse.razorpay_order_id,
                razorpay_payment_id: razorpayResponse.razorpay_payment_id,
                razorpay_signature: razorpayResponse.razorpay_signature,
                email: email,
                phone: phone,
                course_id: selectedCourse?.id || null
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
      {/* 1. LUXURY EDITORIAL HERO SECTION */}
      <section className="relative min-h-[calc(100vh-80px)] flex flex-col justify-center items-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16 overflow-hidden">
        {/* Subtle Architectural Drafting Grid Canvas */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-40 -z-10"
          style={{
            backgroundImage: "radial-gradient(rgba(6, 78, 59, 0.12) 1px, transparent 1px)",
            backgroundSize: "28px 28px"
          }}
        />

        {/* Ambient Organic Atmospheric Glows */}
        <div className="absolute top-1/4 -right-24 w-[550px] h-[550px] bg-gradient-to-br from-emerald-400/15 via-teal-500/10 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute bottom-10 -left-24 w-[450px] h-[450px] bg-gradient-to-tr from-amber-500/10 via-emerald-600/5 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

        {/* 12-Column Editorial Master Layout */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center my-auto">
          {/* Left Column: Editorial Value & Masterclass Call-To-Action (7 Cols) */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-7 text-left">
            {/* Executive Badge Pill */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2.5 bg-white/95 backdrop-blur-md border border-emerald-900/15 py-1.5 px-4 rounded-full shadow-sm"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse shadow-[0_0_8px_#059669]" />
              <span className="text-[11px] font-bold text-emerald-950 uppercase tracking-widest font-sans">
                Executive Architectural Masterclass • 2026 Edition
              </span>
            </motion.div>

            {/* Master Headline */}
            <motion.h1 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-emerald-950 leading-[1.12]"
            >
              Master the Art of <br />
              <span className="italic font-normal bg-gradient-to-r from-emerald-900 via-emerald-700 to-teal-800 bg-clip-text text-transparent">
                Landscape Architecture
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-base sm:text-lg text-stone-600 leading-relaxed font-light max-w-xl"
            >
              {heroSubtitle}
            </motion.p>

            {/* Masterclass Architectural Pillars */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.12 }}
              className="flex flex-wrap items-center gap-2 pt-0.5"
            >
              {['Maintenance & Positioning of Plants', 'Details of Landscape', 'Role of Softwares in Landscape', 'Hands-on Experience'].map((pillar, i) => (
                <span 
                  key={i} 
                  className="text-[11px] font-medium font-sans px-2.5 py-1 rounded-md bg-emerald-950/5 text-emerald-900 border border-emerald-900/10"
                >
                  {pillar}
                </span>
              ))}
            </motion.div>

            {/* Primary Action Button Group */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="flex flex-wrap items-center gap-3.5 sm:gap-4 pt-1"
            >
              <a 
                href="#course-catalog"
                className="bg-emerald-900 hover:bg-emerald-800 text-white font-semibold text-sm sm:text-base px-8 py-4 rounded-full shadow-xl shadow-emerald-950/25 hover:shadow-emerald-900/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2.5 cursor-pointer btn-shine"
              >
                <span>Explore Course Library</span>
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </a>

              <button
                onClick={() => onNavigate('v2')}
                className="inline-flex items-center gap-2 px-6 py-4 rounded-full bg-white hover:bg-stone-50 text-stone-800 font-semibold text-sm sm:text-base border border-stone-200/90 hover:border-emerald-700/40 shadow-sm hover:shadow transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-emerald-800 text-base">lock</span>
                <span>Student Portal</span>
              </button>
            </motion.div>

          </div>

          {/* Right Column: Architectural Visual Mockup Window (5 Cols) */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="lg:col-span-5 relative group"
          >
            {/* Ambient Back Glow */}
            <div className="absolute -inset-3 bg-gradient-to-tr from-emerald-600/20 via-teal-500/15 to-transparent rounded-[36px] blur-2xl group-hover:blur-3xl transition-all duration-500 opacity-80 -z-10" />

            {/* Luxury Mockup Device Window Frame */}
            <div className="relative rounded-3xl bg-white/95 p-3.5 sm:p-4 border border-stone-200/90 shadow-[0_24px_70px_-15px_rgba(6,78,59,0.18)] overflow-hidden">
              {/* Browser-style Top Bar */}
              <div className="flex items-center justify-between pb-3 px-2 border-b border-stone-100 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                </div>
                <div className="flex items-center gap-1 text-[11px] font-mono text-stone-500 bg-stone-100/80 px-3 py-0.5 rounded-md border border-stone-200/60">
                  <span className="material-symbols-outlined text-xs text-emerald-700">lock</span>
                  <span>landscapemastery.3capstech.com</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                  4K HDR
                </span>
              </div>

              {/* Visual Preview Graphic */}
              <div className="relative aspect-[16/11] rounded-2xl overflow-hidden mt-3 shadow-inner bg-stone-950 group/img">
                <img
                  src="/course_thumb_landscape.jpg"
                  alt="Landscape Architectural Masterclass"
                  className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/25 to-transparent" />

                {/* Floating Live Masterclass Tag */}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold flex items-center gap-1.5 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    LMS Curriculum Portal
                  </span>
                </div>

                {/* Preview Overlay Floating Player Bar */}
                <div className="absolute bottom-3 left-3 right-3 p-3.5 rounded-xl bg-white/95 backdrop-blur-md border border-stone-200/90 shadow-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-900 text-white flex items-center justify-center shadow-sm">
                      <span className="material-symbols-outlined text-lg">play_arrow</span>
                    </div>
                    <div>
                      <div className="text-stone-900 font-bold text-xs">Architectural Masterclass</div>
                      <div className="text-[11px] text-stone-500">Grading, hardscape, spatial & planting modules</div>
                    </div>
                  </div>
                  <a
                    href="#course-catalog"
                    className="text-xs font-bold text-emerald-900 hover:text-emerald-700 underline flex items-center gap-0.5"
                  >
                    View <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </a>
                </div>
              </div>

              {/* Specs Strip */}
              <div className="grid grid-cols-3 divide-x divide-stone-100 text-center py-3 mt-1 text-[11px]">
                <div>
                  <span className="block text-stone-400 font-mono text-[10px]">VIDEO FORMAT</span>
                  <strong className="text-stone-800 font-semibold">HD Masterclass</strong>
                </div>
                <div>
                  <span className="block text-stone-400 font-mono text-[10px]">CURRICULUM</span>
                  <strong className="text-stone-800 font-semibold">CAD & Spatial</strong>
                </div>
                <div>
                  <span className="block text-stone-400 font-mono text-[10px]">ACCESS</span>
                  <strong className="text-emerald-800 font-bold">Lifetime Portal</strong>
                </div>
              </div>
            </div>

            {/* Decorative Floating Blueprint Badge */}
            <div className="hidden sm:flex absolute -bottom-4 -left-4 bg-white p-3 rounded-2xl shadow-xl border border-stone-200/80 items-center gap-2.5 z-20">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-200/80">
                <span className="material-symbols-outlined text-base">architecture</span>
              </div>
              <div>
                <div className="text-xs font-bold text-stone-900">Spatial Planning</div>
                <div className="text-[10px] text-stone-500">Architect-grade precision</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Scroll Cue */}
        <div className="w-full flex justify-center pt-8">
          <button
            onClick={() => {
              const el = document.getElementById('course-catalog');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex items-center gap-1.5 text-xs font-semibold text-stone-400 hover:text-emerald-800 transition-colors cursor-pointer group"
          >
            <span>Scroll to explore courses</span>
            <span className="material-symbols-outlined text-base animate-bounce group-hover:text-emerald-700">keyboard_arrow_down</span>
          </button>
        </div>
      </section>

      {/* 3. ARCHITECTURAL TESTIMONIALS (Shown only if configured in Admin) */}
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

      {/* 4.5. COURSE CATALOG */}
      <CourseCatalog courses={catalogCourses} onSelectCourse={handleSelectCourse} enrolledCourseIds={enrolledCourseIds} />

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
                <span>{selectedCourse ? selectedCourse.title : 'Executive Architectural Access • 2026 Pass'}</span>
              </div>

              <div className="space-y-2">
                <h2 className="font-serif text-3xl sm:text-4xl lg:text-4.5xl font-bold text-white leading-[1.18] tracking-tight">
                  {selectedCourse ? (
                    <>{selectedCourse.title.split(' ').slice(0, 3).join(' ')} <br />
                    <span className="italic font-normal text-emerald-300">{selectedCourse.title.split(' ').slice(3).join(' ') || 'Masterclass'}</span></>
                  ) : (
                    <>Unlock Complete <br />
                    <span className="italic font-normal text-emerald-300">Masterclass Access</span></>
                  )}
                </h2>
                <p className="text-xs sm:text-sm text-emerald-100/80 font-light leading-relaxed max-w-md">
                  {selectedCourse?.short_desc || 'Comprehensive spatial design, CAD execution schematics, and botanical curation tailored for practitioners.'}
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
                {(discountPct > 0 || (selectedCourse && selectedCourse.discount_price < selectedCourse.price)) ? (
                  <span className="text-lg line-through text-emerald-400/60 font-sans">₹{selectedCourse ? selectedCourse.price : basePrice}</span>
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
                  <h3 className="font-serif text-xl font-bold text-stone-900">
                    {selectedCourse ? 'Enroll in Course' : 'Instant Enrollment'}
                  </h3>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    {selectedCourse ? selectedCourse.title : 'Select a course above or enroll directly.'}
                  </p>
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

                {/* Course Selection Prompt (if no course selected) */}
                {!selectedCourse && catalogCourses.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">info</span>
                    <span>Please <a href="#course-catalog" className="underline font-bold">select a course</a> above to enroll.</span>
                  </div>
                )}

                {/* Submit Checkout Button */}
                <button
                  type="submit"
                  disabled={loading || (!selectedCourse && catalogCourses.length > 0)}
                  className="w-full bg-gradient-to-r from-emerald-900 to-emerald-950 hover:from-emerald-800 hover:to-emerald-900 text-white font-semibold text-xs sm:text-sm py-3.5 rounded-xl shadow-lg shadow-emerald-950/25 transition-all flex items-center justify-center gap-2 cursor-pointer mt-3 btn-shine disabled:opacity-60 disabled:cursor-not-allowed"
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
