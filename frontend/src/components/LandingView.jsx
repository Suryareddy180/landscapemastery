import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, AlertCircle, ShieldCheck, Mail, Lock, Phone, User,
  GraduationCap, Building2, Home, ArrowRight, X, RefreshCw
} from 'lucide-react';
import CourseCatalog from './CourseCatalog.jsx';
import { BASE_URL } from '../lib/api.js';

export default function LandingView({ onNavigate, siteSettings, onLoginSuccess }) {
  // Learner & Billing Details
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [accountType, setAccountType] = useState('STUDENT'); // STUDENT | EMPLOYEE | HOUSEHOLD

  // Student-specific fields
  const [qualification, setQualification] = useState('B.Arch');
  const [branch, setBranch] = useState('Landscape Architecture');
  const [collegeName, setCollegeName] = useState('');
  const [passoutYear, setPassoutYear] = useState('2025');
  const [studentStatus, setStudentStatus] = useState('Still Studying');

  // Employee-specific fields
  const [companyName, setCompanyName] = useState('');
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');

  // Household-specific fields
  const [householdName, setHouseholdName] = useState('');
  const [residentialAddress, setResidentialAddress] = useState('');
  const [memberCount, setMemberCount] = useState(2);

  // Payment Result Modal State
  const [paymentResult, setPaymentResult] = useState(null);

  // Checkout and discount state
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

  // CRITICAL PAYMENT FLOW: Strict Server-Side Verification & Automated Account Provisioning
  const handlePayment = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    // Frontend Validations
    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    if (!cleanName) {
      setStatusMessage({ type: 'error', text: 'Please enter your Full Name for certificate generation & account setup.' });
      return;
    }
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid email address where account credentials will be sent.' });
      return;
    }
    if (!cleanPhone || cleanPhone.length < 8) {
      setStatusMessage({ type: 'error', text: 'Please provide a valid mobile number with country code (e.g. +91 9876543210).' });
      return;
    }

    // Role-specific validations
    if (accountType === 'STUDENT' && !collegeName.trim()) {
      setStatusMessage({ type: 'error', text: 'Please provide your College / Institute Name.' });
      return;
    }
    if (accountType === 'EMPLOYEE' && (!companyName.trim() || !designation.trim())) {
      setStatusMessage({ type: 'error', text: 'Please provide both your Organization / Company and Designation.' });
      return;
    }
    if (accountType === 'HOUSEHOLD' && !householdName.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter your Household Name or Primary Contact.' });
      return;
    }

    setLoading(true);
    setStatusMessage(null);

    const learnerPayload = {
      full_name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      account_type: accountType,
      course_id: selectedCourse?.id || null,
      coupon_code: couponCode.trim(),
      // Student details
      qualification: qualification.trim(),
      branch: branch.trim(),
      college_name: collegeName.trim(),
      passout_year: passoutYear,
      student_status: studentStatus,
      // Employee details
      company_name: companyName.trim(),
      department: department.trim(),
      designation: designation.trim(),
      // Household details
      household_name: householdName.trim(),
      residential_address: residentialAddress.trim(),
      member_count: memberCount
    };

    try {
      const response = await fetch(`${BASE_URL}/api/checkout/session/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(learnerPayload)
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        setLoading(false);
        setStatusMessage({ type: 'error', text: errData.error || 'Unable to initialize checkout session. Please check details.' });
        return;
      }

      const data = await response.json();
      const razorpayKey = data.keyId || '';

      if (!window.Razorpay || !razorpayKey) {
        setLoading(false);
        setStatusMessage({
          type: 'error',
          text: 'Payment Gateway is in configuration mode. Please contact support at contact@landscapemastery.com.'
        });
        return;
      }

      const calculatedAmount = Math.round(price * 100);

      const options = {
        key: razorpayKey,
        amount: calculatedAmount,
        currency: 'INR',
        order_id: data.orderId,
        name: 'Landscape Mastery',
        description: selectedCourse ? `${selectedCourse.title} - Lifetime Access` : 'Executive Architecture Masterclass',
        image: '/lm_logo.png',
        notes: {
          course_id: selectedCourse?.id || '',
          course_title: selectedCourse?.title || 'Landscape Mastery',
          account_type: accountType,
          full_name: cleanName
        },
        prefill: {
          name: cleanName,
          email: cleanEmail,
          contact: cleanPhone
        },
        theme: {
          color: '#064e3b',
        },
        handler: async function (razorpayResponse) {
          try {
            setStatusMessage({ type: 'info', text: 'Authoritatively verifying payment & provisioning credentials...' });
            const verifyRes = await fetch(`${BASE_URL}/api/checkout/verify/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: razorpayResponse.razorpay_order_id,
                razorpay_payment_id: razorpayResponse.razorpay_payment_id,
                razorpay_signature: razorpayResponse.razorpay_signature,
                email: cleanEmail,
                full_name: cleanName,
                phone: cleanPhone,
                account_type: accountType,
                course_id: selectedCourse?.id || null,
                checkout_metadata: learnerPayload
              })
            });

            const verifyData = await verifyRes.json();
            setLoading(false);

            if (verifyRes.ok && verifyData.success) {
              setPaymentResult({
                type: 'success',
                orderId: verifyData.order_id,
                paymentId: verifyData.payment_id,
                courseTitle: verifyData.course_title,
                email: cleanEmail,
                isNewUser: verifyData.is_new_user,
                emailSent: verifyData.email_sent,
                authData: verifyData
              });
            } else {
              setPaymentResult({
                type: 'failed',
                orderId: razorpayResponse.razorpay_order_id,
                message: verifyData.error || 'Payment signature verification failed. Please contact support if your account was charged.',
                canRetry: true
              });
            }
          } catch (verifyErr) {
            setLoading(false);
            setPaymentResult({
              type: 'failed',
              orderId: razorpayResponse.razorpay_order_id,
              message: 'Network error while verifying payment. Please refresh or contact support.',
              canRetry: true
            });
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            setStatusMessage({
              type: 'warning',
              text: 'Checkout interface dismissed. Your account has not been charged.'
            });
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        setLoading(false);
        setPaymentResult({
          type: 'failed',
          orderId: resp.error?.metadata?.order_id || '',
          message: resp.error?.description || 'Payment was declined by your bank or payment provider.',
          canRetry: true
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
      <section className="relative min-h-[calc(100vh-72px)] flex flex-col justify-center items-center max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 overflow-hidden">
        {/* Subtle Architectural Drafting Grid Canvas */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-30 -z-10"
          style={{
            backgroundImage: "radial-gradient(rgba(6, 78, 59, 0.12) 1px, transparent 1px)",
            backgroundSize: "28px 28px"
          }}
        />

        {/* Ambient Organic Atmospheric Glows */}
        <div className="absolute top-1/4 -right-24 w-[450px] h-[450px] bg-gradient-to-br from-emerald-400/10 via-teal-500/5 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute bottom-6 -left-24 w-[400px] h-[400px] bg-gradient-to-tr from-amber-500/10 via-emerald-600/5 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Executive Typographic Editorial Master Layout */}
        <div className="w-full max-w-5xl mx-auto text-center space-y-3.5 sm:space-y-4.5 lg:space-y-5 my-auto">
          {/* Executive Badge Pill */}
          <motion.div 
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 bg-white/95 backdrop-blur-md border border-emerald-900/15 py-1 px-3.5 rounded-full shadow-xs"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse shadow-[0_0_8px_#059669]" />
            <span className="text-[10px] sm:text-[10.5px] font-bold text-emerald-950 uppercase tracking-[0.16em] font-sans">
              Executive Architectural Masterclass • 2026 Edition
            </span>
          </motion.div>

          {/* Master Headline */}
          <motion.h1 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.05 }}
            className="font-serif text-3xl sm:text-4xl lg:text-[2.85rem] xl:text-[3.2rem] font-bold tracking-tight text-emerald-950 leading-[1.12] max-w-3xl mx-auto"
          >
            Master the Art of <br />
            <span className="italic font-normal bg-gradient-to-r from-emerald-900 via-emerald-700 to-teal-800 bg-clip-text text-transparent">
              Landscape Architecture
            </span>
          </motion.h1>

          {/* Subtitle / Architectural Manifesto */}
          <motion.p 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="text-xs sm:text-[14px] text-stone-600 leading-relaxed font-light max-w-2xl mx-auto"
          >
            {heroSubtitle}
          </motion.p>

          {/* Primary Action Button Group */}
          <motion.div 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.15 }}
            className="flex flex-wrap items-center justify-center gap-3 pt-0.5"
          >
            <a 
              href="#course-catalog"
              className="bg-emerald-900 hover:bg-emerald-800 text-white font-semibold text-xs sm:text-sm px-6 py-2.5 rounded-full shadow-md shadow-emerald-950/20 hover:shadow-emerald-900/35 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer btn-shine"
            >
              <span>Explore Course Library</span>
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </a>

            <button
              onClick={() => onNavigate('v2')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-stone-50 text-stone-800 font-semibold text-xs sm:text-sm border border-stone-200/90 hover:border-emerald-700/40 shadow-xs hover:shadow-sm transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-emerald-800 text-base">lock</span>
              <span>Student Portal</span>
            </button>
          </motion.div>

          {/* 4-Column Architectural Syllabus Framework Deck */}
          <motion.div 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.2 }}
            className="pt-1.5 sm:pt-2.5 max-w-5xl mx-auto w-full"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-left">
              {/* Pillar 01 */}
              <div className="p-3 sm:p-3.5 rounded-xl bg-white/95 backdrop-blur-xs border border-stone-200/90 shadow-xs hover:shadow-md hover:border-emerald-700/40 transition-all group flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono font-bold text-emerald-700 tracking-wider">01</span>
                  <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-100 group-hover:bg-emerald-900 group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-xs">potted_plant</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs sm:text-[12.5px] font-bold text-stone-900 leading-snug">
                    Maintenance &amp; Positioning of Plants
                  </div>
                  <div className="text-[10.5px] text-stone-500 font-light mt-0.5 leading-snug">
                    Botanical growth zoning &amp; sun exposure
                  </div>
                </div>
              </div>

              {/* Pillar 02 */}
              <div className="p-3 sm:p-3.5 rounded-xl bg-white/95 backdrop-blur-xs border border-stone-200/90 shadow-xs hover:shadow-md hover:border-emerald-700/40 transition-all group flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono font-bold text-emerald-700 tracking-wider">02</span>
                  <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-100 group-hover:bg-emerald-900 group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-xs">architecture</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs sm:text-[12.5px] font-bold text-stone-900 leading-snug">
                    Details of Landscape
                  </div>
                  <div className="text-[10.5px] text-stone-500 font-light mt-0.5 leading-snug">
                    Site contour grading &amp; stone masonry
                  </div>
                </div>
              </div>

              {/* Pillar 03 */}
              <div className="p-3 sm:p-3.5 rounded-xl bg-white/95 backdrop-blur-xs border border-stone-200/90 shadow-xs hover:shadow-md hover:border-emerald-700/40 transition-all group flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono font-bold text-emerald-700 tracking-wider">03</span>
                  <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-100 group-hover:bg-emerald-900 group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-xs">devices</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs sm:text-[12.5px] font-bold text-stone-900 leading-snug">
                    Role of Softwares in Landscape
                  </div>
                  <div className="text-[10.5px] text-stone-500 font-light mt-0.5 leading-snug">
                    AutoCAD drafting &amp; 3D spatial models
                  </div>
                </div>
              </div>

              {/* Pillar 04 */}
              <div className="p-3 sm:p-3.5 rounded-xl bg-white/95 backdrop-blur-xs border border-stone-200/90 shadow-xs hover:shadow-md hover:border-emerald-700/40 transition-all group flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono font-bold text-emerald-700 tracking-wider">04</span>
                  <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-100 group-hover:bg-emerald-900 group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-xs">handyman</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs sm:text-[12.5px] font-bold text-stone-900 leading-snug">
                    Hands-on Experience
                  </div>
                  <div className="text-[10.5px] text-stone-500 font-light mt-0.5 leading-snug">
                    Field calculations &amp; execution blueprints
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Architectural Specifications Ribbon */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45, delay: 0.25 }}
            className="pt-2 max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-y-1 gap-x-4 text-[10px] sm:text-[10.5px] font-mono text-stone-500 uppercase tracking-wider border-t border-stone-200/60"
          >
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              HD Video Modules
            </span>
            <span className="text-stone-300">•</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              CAD &amp; DWG Details
            </span>
            <span className="text-stone-300">•</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              Spatial Planning Frameworks
            </span>
            <span className="text-stone-300">•</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              Automated Lifetime Access
            </span>
          </motion.div>
        </div>

        {/* Scroll Cue */}
        <div className="w-full flex justify-center pt-2 pb-1">
          <button
            onClick={() => {
              const el = document.getElementById('course-catalog');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex items-center gap-1 text-[10.5px] font-medium text-stone-400 hover:text-emerald-800 transition-colors cursor-pointer group"
          >
            <span>Explore Course Catalog</span>
            <span className="material-symbols-outlined text-sm animate-bounce group-hover:text-emerald-700">keyboard_arrow_down</span>
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

      {/* 5. PRICING & ENHANCED ENROLLMENT CARD */}
      <section id="enroll-card" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-[#063327] via-[#022119] to-[#01140f] text-white rounded-3xl p-6 sm:p-10 shadow-[0_24px_70px_-12px_rgba(2,44,33,0.5)] border border-emerald-500/25 relative overflow-hidden">
          {/* Subtle Ambient Radial Lighting */}
          <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Section Header with Live Course & Investment Details */}
          <div className="relative z-10 text-center max-w-2xl mx-auto mb-8 space-y-3">
            <div className="inline-flex items-center gap-2 bg-emerald-900/80 text-emerald-200 text-[11px] font-bold px-3.5 py-1.5 rounded-full uppercase tracking-widest border border-emerald-600/40 shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{selectedCourse ? selectedCourse.title : 'Executive Architectural Access'}</span>
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white tracking-tight">
              {selectedCourse ? `Enroll in ${selectedCourse.title}` : 'Instant Course Enrollment'}
            </h2>

            <p className="text-xs sm:text-sm text-emerald-100/80 font-light leading-relaxed">
              Complete your registration below. Upon verified payment, your learner portal account is created automatically and credentials are sent to your email.
            </p>

            {/* Live Pricing Ribbon */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <div className="inline-flex items-baseline gap-2 bg-emerald-950/80 border border-emerald-500/30 px-5 py-2 rounded-2xl shadow-inner">
                <span className="text-3xl sm:text-4xl font-bold font-serif text-white tracking-tight">₹{price}</span>
                {(discountPct > 0 || (selectedCourse && selectedCourse.discount_price < selectedCourse.price)) ? (
                  <span className="text-sm line-through text-emerald-400/60 font-sans">
                    ₹{selectedCourse ? selectedCourse.price : basePrice}
                  </span>
                ) : null}
                <span className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider ml-1">
                  • Lifetime Access
                </span>
                {discountPct > 0 && (
                  <span className="text-[10px] font-bold bg-emerald-400 text-emerald-950 px-2 py-0.5 rounded-full uppercase tracking-wider ml-1 shadow-sm">
                    {discountPct}% OFF
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Enhanced Executive Form Card */}
          <div className="relative z-10 bg-white text-stone-900 p-6 sm:p-10 rounded-3xl shadow-2xl border border-stone-100 space-y-6">
            <div className="flex flex-wrap justify-between items-center pb-4 border-b border-stone-100 gap-2">
              <div>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">
                  {selectedCourse ? 'Enrollment Details' : 'Learner Registration'}
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  {selectedCourse ? selectedCourse.title : 'Select a course or enroll directly.'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-[11px] font-bold px-2.5 py-1 rounded-md border border-emerald-200">
                  <span className="material-symbols-outlined text-xs">lock</span>
                  256-Bit SSL
                </span>
                <span className="inline-flex items-center gap-1 bg-stone-100 text-stone-700 text-[11px] font-bold px-2.5 py-1 rounded-md border border-stone-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  Auto-Account
                </span>
              </div>
            </div>

            {statusMessage && (
              <div className={`p-4 rounded-xl text-xs sm:text-sm font-semibold ${
                statusMessage.type === 'error' ? 'bg-rose-50 border border-rose-200 text-rose-800' :
                statusMessage.type === 'warning' ? 'bg-amber-50 border border-amber-200 text-amber-900' :
                'bg-emerald-50 border border-emerald-200 text-emerald-900'
              }`}>
                {statusMessage.text}
              </div>
            )}

            <form onSubmit={handlePayment} className="space-y-6">
              {/* Optional Course Selector if catalog courses available */}
              {catalogCourses.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Course Selection <span className="text-emerald-700">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={selectedCourse?.id || ''}
                      onChange={(e) => {
                        const found = catalogCourses.find(c => c.id === Number(e.target.value));
                        if (found) handleSelectCourse(found);
                      }}
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-3 text-xs sm:text-sm font-semibold text-stone-900 focus:outline-none focus:border-emerald-700 focus:bg-white transition-all cursor-pointer"
                    >
                      <option value="" disabled>-- Select a Course from Catalog --</option>
                      {catalogCourses.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.title} — ₹{c.discount_price || c.price}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* 1. Account Type Selector */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                  1. Learner Classification <span className="text-emerald-700">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'STUDENT', label: 'Student', sub: 'University / College', icon: GraduationCap },
                    { id: 'EMPLOYEE', label: 'Employee', sub: 'Corporate / Firm', icon: Building2 },
                    { id: 'HOUSEHOLD', label: 'Household', sub: 'Family / Individual', icon: Home }
                  ].map((item) => {
                    const Icon = item.icon;
                    const isSelected = accountType === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setAccountType(item.id)}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                          isSelected
                            ? 'bg-gradient-to-br from-emerald-950 to-emerald-900 text-white border-emerald-900 shadow-md ring-2 ring-emerald-500/30'
                            : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100 hover:border-stone-300'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <Icon className={`w-5 h-5 ${isSelected ? 'text-emerald-300' : 'text-stone-500'}`} />
                          {isSelected && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
                        </div>
                        <div>
                          <div className={`text-xs sm:text-sm font-bold ${isSelected ? 'text-white' : 'text-stone-900'}`}>
                            {item.label}
                          </div>
                          <div className={`text-[11px] ${isSelected ? 'text-emerald-200/80' : 'text-stone-400'}`}>
                            {item.sub}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Personal & Contact Information */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                  2. Personal &amp; Contact Information <span className="text-emerald-700">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {/* Full Name */}
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Full Name <span className="text-emerald-700">*</span>
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">person</span>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Surya Prakash Reddy"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-emerald-700 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  {/* Email Address */}
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Email Address <span className="text-emerald-700">*</span>
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">mail</span>
                      <input
                        type="email"
                        required
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-emerald-700 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  {/* Mobile Number */}
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Mobile Number <span className="text-emerald-700">*</span>
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">phone_iphone</span>
                      <input
                        type="tel"
                        required
                        placeholder="+91 98765 43210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-emerald-700 focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                </div>
                <span className="text-[10.5px] text-stone-400 mt-1 block">
                  Access credentials and order invoices will be delivered to this email and mobile number.
                </span>
              </div>

              {/* 3. Role-Specific Profile Details */}
              {/* Conditional Fields: STUDENT */}
              {accountType === 'STUDENT' && (
                <div className="p-4 sm:p-5 bg-stone-50/90 rounded-2xl border border-stone-200/90 space-y-3.5">
                  <div className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-emerald-700" />
                    <span>3. Student Academic Profile</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">Qualification</label>
                      <select
                        value={qualification}
                        onChange={(e) => setQualification(e.target.value)}
                        className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-emerald-700 cursor-pointer"
                      >
                        <option value="B.Arch">B.Arch</option>
                        <option value="B.Tech">B.Tech</option>
                        <option value="B.Des">B.Des</option>
                        <option value="B.Sc">B.Sc</option>
                        <option value="M.Arch">M.Arch</option>
                        <option value="M.Tech">M.Tech</option>
                        <option value="Diploma">Diploma</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">Passout Year</label>
                      <select
                        value={passoutYear}
                        onChange={(e) => setPassoutYear(e.target.value)}
                        className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-emerald-700 cursor-pointer"
                      >
                        <option value="2027">2027</option>
                        <option value="2026">2026</option>
                        <option value="2025">2025</option>
                        <option value="2024">2024</option>
                        <option value="2023">2023</option>
                        <option value="Earlier">Earlier</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">Branch / Dept</label>
                      <input
                        type="text"
                        placeholder="e.g. Architecture / Civil"
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                        className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-emerald-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">Current Status</label>
                      <select
                        value={studentStatus}
                        onChange={(e) => setStudentStatus(e.target.value)}
                        className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-emerald-700 cursor-pointer"
                      >
                        <option value="Still Studying">Still Studying</option>
                        <option value="Internship">Internship</option>
                        <option value="Freelancer">Freelancer</option>
                        <option value="Employed">Employed</option>
                        <option value="Seeking Opportunities">Seeking Opportunities</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      College / University Name <span className="text-emerald-700">*</span>
                    </label>
                    <input
                      type="text"
                      required={accountType === 'STUDENT'}
                      placeholder="e.g. School of Planning and Architecture"
                      value={collegeName}
                      onChange={(e) => setCollegeName(e.target.value)}
                      className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-emerald-700"
                    />
                  </div>
                </div>
              )}

              {/* Conditional Fields: EMPLOYEE */}
              {accountType === 'EMPLOYEE' && (
                <div className="p-4 sm:p-5 bg-stone-50/90 rounded-2xl border border-stone-200/90 space-y-3.5">
                  <div className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-700" />
                    <span>3. Corporate / Employment Details</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                        Company / Organization <span className="text-emerald-700">*</span>
                      </label>
                      <input
                        type="text"
                        required={accountType === 'EMPLOYEE'}
                        placeholder="e.g. 3CAPSTECH / Studio Landscape"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-emerald-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">Department</label>
                      <input
                        type="text"
                        placeholder="e.g. Planning &amp; Infrastructure"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-emerald-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                        Designation <span className="text-emerald-700">*</span>
                      </label>
                      <input
                        type="text"
                        required={accountType === 'EMPLOYEE'}
                        placeholder="e.g. Senior Architect"
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-emerald-700"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Conditional Fields: HOUSEHOLD */}
              {accountType === 'HOUSEHOLD' && (
                <div className="p-4 sm:p-5 bg-stone-50/90 rounded-2xl border border-stone-200/90 space-y-3.5">
                  <div className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-2">
                    <Home className="w-4 h-4 text-emerald-700" />
                    <span>3. Household Learner Details</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                        Household Name / Contact <span className="text-emerald-700">*</span>
                      </label>
                      <input
                        type="text"
                        required={accountType === 'HOUSEHOLD'}
                        placeholder="e.g. Reddy Family / Primary Contact"
                        value={householdName}
                        onChange={(e) => setHouseholdName(e.target.value)}
                        className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-emerald-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">Residential Address</label>
                      <input
                        type="text"
                        placeholder="e.g. Jubilee Hills, Hyderabad"
                        value={residentialAddress}
                        onChange={(e) => setResidentialAddress(e.target.value)}
                        className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-emerald-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">Family Learners</label>
                      <select
                        value={memberCount}
                        onChange={(e) => setMemberCount(Number(e.target.value))}
                        className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-emerald-700 cursor-pointer"
                      >
                        <option value={1}>1 Learner</option>
                        <option value={2}>2 Learners</option>
                        <option value={3}>3 Learners</option>
                        <option value={4}>4+ Learners</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. Privilege Coupon Code & Order Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start pt-2">
                {/* Coupon Code Input */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Have a Privilege Coupon?
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">local_offer</span>
                      <input
                        type="text"
                        placeholder="e.g. ARCHITECT20"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-3 py-2.5 text-xs font-mono font-bold text-stone-900 focus:outline-none focus:border-emerald-700 focus:bg-white uppercase"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !couponCode.trim()}
                      className="bg-emerald-900 hover:bg-emerald-950 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-all border border-emerald-800 cursor-pointer disabled:opacity-50 flex items-center justify-center min-w-[75px]"
                    >
                      {couponLoading ? '...' : 'Apply'}
                    </button>
                  </div>
                  {couponMessage && (
                    <div className={`mt-1.5 text-xs font-semibold ${couponMessage.type === 'success' ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {couponMessage.text}
                    </div>
                  )}
                </div>

                {/* Investment Summary Box */}
                <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/90 space-y-2">
                  <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                    Investment Breakdown
                  </div>
                  <div className="flex justify-between text-xs text-stone-600">
                    <span>Base Course Price</span>
                    <span className="font-semibold">₹{selectedCourse ? selectedCourse.price : basePrice}</span>
                  </div>
                  {discountPct > 0 && (
                    <div className="flex justify-between text-xs text-emerald-700 font-semibold">
                      <span>Privilege Coupon Discount ({discountPct}%)</span>
                      <span>-₹{Math.round(basePrice * (discountPct / 100))}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-stone-200 flex justify-between items-baseline">
                    <span className="text-xs font-bold text-stone-900 uppercase">Total Payable</span>
                    <span className="text-xl font-bold font-serif text-emerald-950">₹{price}</span>
                  </div>
                </div>
              </div>

              {/* Prompt if no course selected and catalog exists */}
              {!selectedCourse && catalogCourses.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-800 font-medium flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">info</span>
                  <span>Please select a course from the catalog dropdown above or the course section to continue.</span>
                </div>
              )}

              {/* Instant Automated Provisioning Notice */}
              <div className="p-4 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl text-xs text-emerald-900 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Instant Automated Account Provisioning:</strong> Your learner portal account is created automatically upon verified payment. Temporary access credentials and login instructions will be delivered immediately to <strong>{email || 'your email'}</strong>.
                </div>
              </div>

              {/* Submit / Proceed to Payment Button */}
              <button
                type="submit"
                disabled={loading || (!selectedCourse && catalogCourses.length > 0)}
                className="w-full bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-950 hover:from-emerald-800 hover:to-emerald-900 text-white font-semibold text-sm sm:text-base py-4 rounded-2xl shadow-xl shadow-emerald-950/25 transition-all flex items-center justify-center gap-2.5 cursor-pointer btn-shine disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-lg">lock</span>
                <span>{loading ? 'Initializing Secure Payment Gateway...' : `Proceed to Secure Payment • ₹${price}`}</span>
              </button>

              {/* Trust & Verification Badges */}
              <div className="pt-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] text-stone-500 font-semibold uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-emerald-700 text-sm">verified</span>
                  Razorpay Verified Gateway
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-emerald-700 text-sm">lock</span>
                  256-Bit SSL Encryption
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-emerald-700 text-sm">credit_card</span>
                  UPI, Cards &amp; NetBanking
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-emerald-700 text-sm">all_inclusive</span>
                  Zero Recurring Fees
                </span>
              </div>
            </form>
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

      {/* 7. POST-PAYMENT RESULT MODAL (SUCCESS / FAILURE WORKFLOW) */}
      <AnimatePresence>
        {paymentResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-stone-950/60 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6"
          >
            <motion.div
              initial={{ scale: 0.94, y: 16, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.94, y: 16, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-stone-200/90 overflow-hidden ring-1 ring-stone-900/5 text-stone-900 relative"
            >
              {paymentResult.type === 'success' ? (
                <div>
                  {/* Luxury Top Header Pattern */}
                  <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-900 text-white p-6 sm:p-7 relative overflow-hidden text-center">
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mb-3.5 shadow-inner">
                        <CheckCircle2 className="w-9 h-9 text-emerald-300" />
                      </div>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400/20 text-emerald-200 text-[10px] font-bold tracking-widest uppercase mb-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Payment Verified</span>
                      </div>
                      <h3 className="font-serif text-2xl font-bold tracking-tight">Payment Successful!</h3>
                      <p className="text-xs text-emerald-100/90 mt-1 max-w-xs">
                        Your masterclass enrollment is confirmed and your account is active.
                      </p>
                    </div>
                  </div>

                  {/* Body Details */}
                  <div className="p-6 sm:p-7 space-y-4">
                    {/* Order Reference Card */}
                    <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-4 text-xs space-y-2">
                      <div className="flex justify-between items-center py-1 border-b border-stone-200/60">
                        <span className="text-stone-500 font-medium">Enrolled Course:</span>
                        <span className="font-bold text-stone-900 text-right truncate max-w-[240px]">{paymentResult.courseTitle}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-stone-200/60">
                        <span className="text-stone-500 font-medium">Order Reference:</span>
                        <span className="font-mono font-bold text-stone-800 text-[11px]">{paymentResult.orderId}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-stone-200/60">
                        <span className="text-stone-500 font-medium">Payment ID:</span>
                        <span className="font-mono text-stone-600 text-[11px]">{paymentResult.paymentId}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-stone-500 font-medium">Registered Login ID:</span>
                        <span className="font-bold text-emerald-950">{paymentResult.email}</span>
                      </div>
                    </div>

                    {/* Prominent Access Instructions Banner */}
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-950 space-y-2">
                      <div className="flex items-start gap-2.5">
                        <Mail className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-bold block text-emerald-900">Account Access Instructions Dispatched</strong>
                          <span className="text-[11px] text-emerald-800 leading-relaxed block mt-0.5">
                            We have automatically provisioned your account. Your login credentials and first-time access instructions have been sent to <b>{paymentResult.email}</b>.
                          </span>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-emerald-200/60 flex items-center gap-2 text-[10px] text-emerald-700 font-medium">
                        <Lock className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>For your security, your temporary password is not displayed on this screen.</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 space-y-2">
                      <button
                        type="button"
                        onClick={() => {
                          const auth = paymentResult.authData;
                          setPaymentResult(null);
                          if (auth && onLoginSuccess) {
                            onLoginSuccess(auth);
                          } else {
                            onNavigate('v2');
                          }
                        }}
                        className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-emerald-950 via-emerald-800 to-teal-900 hover:from-emerald-900 hover:to-teal-800 text-white font-bold text-xs sm:text-sm tracking-wide shadow-lg shadow-emerald-950/20 hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>Proceed to Student Login</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>

                      <p className="text-[10px] text-center text-stone-400">
                        Need help? Contact support at <a href="mailto:contact@landscapemastery.com" className="underline hover:text-stone-700">contact@landscapemastery.com</a>
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Failed / Cancelled State */
                <div className="p-6 sm:p-7 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center">
                        <AlertCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-serif text-xl font-bold text-stone-900">Payment Not Completed</h3>
                        <p className="text-xs text-stone-500">The transaction was cancelled or declined.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPaymentResult(null)}
                      className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-4 bg-rose-50/70 border border-rose-200/80 rounded-2xl text-xs text-rose-900 leading-relaxed">
                    <strong>Transaction Notice:</strong> {paymentResult.message || 'Payment was declined by your bank or checkout was interrupted. Your account was not charged.'}
                  </div>

                  <p className="text-xs text-stone-600">
                    Your details have been preserved. You can retry payment with a different UPI app, credit/debit card, or net banking.
                  </p>

                  <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentResult(null);
                        handlePayment({ preventDefault: () => {} });
                      }}
                      className="flex-1 py-3 px-4 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retry Payment</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentResult(null)}
                      className="py-3 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs transition-all cursor-pointer"
                    >
                      Return to Checkout
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
