import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import {
  Sparkles,
  QrCode,
  ArrowRight,
  Share2,
  Check,
  Copy,
  Download,
  ShieldCheck,
  Clock,
  Layers,
  GraduationCap,
  ExternalLink,
  ChevronRight,
  BookOpen,
  Award,
  Zap,
  CheckCircle2,
  Info
} from 'lucide-react';
import { BASE_URL } from '../lib/api.js';

export default function PromoCourseView({ onNavigate, siteSettings }) {
  const { courseSlug } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedWhatsapp, setCopiedWhatsapp] = useState(false);
  const [qrTapped, setQrTapped] = useState(false);

  // Fallback slug if accessed via root or empty
  const activeSlug = courseSlug || 'lanscape-lens';

  useEffect(() => {
    fetchCoursePromo();
  }, [activeSlug]);

  const fetchCoursePromo = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Try dedicated promotional endpoint
      const res = await fetch(`${BASE_URL}/api/public/courses/${activeSlug}/promo/`);
      if (res.ok) {
        const data = await res.json();
        setCourse(data);
        setLoading(false);
        return;
      }

      // 2. Fallback to public course detail endpoint
      const detailRes = await fetch(`${BASE_URL}/api/public/courses/${activeSlug}/`);
      if (detailRes.ok) {
        const detailData = await detailRes.json();
        const promoData = {
          ...detailData,
          promo_url: `https://3capstech.com/promo/${detailData.slug}`,
          enroll_url: `https://3capstech.com/courses/${detailData.slug}`,
          qr_image_url: `${BASE_URL}/api/public/courses/${detailData.slug}/qr.png`,
          greeting: {
            badge: 'Official Executive Invitation • 2026 Edition',
            salutation: 'Welcome, Visionary Architect & Designer!',
            headline: `You are invited to master ${detailData.title}`,
            subtext: 'Elevate your spatial vision with our industry-leading architectural masterclass. Scan the VIP pass below or tap directly to claim your reserved lifetime access.'
          },
          share_templates: {
            whatsapp: `🌿 Master the Art of Landscape Architecture with *${detailData.title}*!\n\nExclusive masterclass pass with lifetime access for only ₹${parseInt(detailData.price)}.\n\n✨ Tap here or scan the QR pass to claim your spot:\nhttps://3capstech.com/promo/${detailData.slug}`,
            twitter: `Elevate your architectural vision with ${detailData.title}. Claim lifetime access for ₹${parseInt(detailData.price)}: https://3capstech.com/promo/${detailData.slug} #LandscapeArchitecture #ArchitectureDesign #Masterclass`,
            linkedin: `Excited to share the ${detailData.title} Masterclass by Landscape Mastery Studio. Comprehensive modules covering botanical zoning, spatial planning, and CAD details: https://3capstech.com/promo/${detailData.slug}`,
            instagram_caption: `✨ Elevate your architectural standards with ${detailData.title}.\n\nComprehensive video modules, botanical zoning frameworks, and downloadable CAD construction details.\n\n👉 Tap link in bio or visit: 3capstech.com/promo/${detailData.slug}\n\n#landscapearchitecture #architecturedesign #cad #landscapeplan #architecturestudent`
          }
        };
        setCourse(promoData);
        setLoading(false);
        return;
      }

      // 3. Fallback to list search
      const listRes = await fetch(`${BASE_URL}/api/public/courses/`);
      if (listRes.ok) {
        const listData = await listRes.json();
        const match = (listData.courses || []).find(
          c => c.slug === activeSlug || c.title.toLowerCase().replace(/\s+/g, '-').includes(activeSlug)
        );
        if (match) {
          setCourse({
            ...match,
            promo_url: `https://3capstech.com/promo/${match.slug}`,
            enroll_url: `https://3capstech.com/courses/${match.slug}`,
            qr_image_url: `${BASE_URL}/api/public/courses/${match.slug}/qr.png`,
            greeting: {
              badge: 'Official Executive Invitation • 2026 Edition',
              salutation: 'Welcome, Visionary Architect & Designer!',
              headline: `You are invited to master ${match.title}`,
              subtext: 'Scan the VIP pass below or tap directly to claim your reserved lifetime access.'
            }
          });
          setLoading(false);
          return;
        }
      }

      setError('Course invitation not found or currently unavailable.');
    } catch (err) {
      console.error('Error loading course promo:', err);
      setError('Unable to load course invitation. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleRedirectToEnroll = () => {
    setQrTapped(true);
    setTimeout(() => {
      const targetSlug = course?.slug || activeSlug;
      if (onNavigate) {
        onNavigate('enroll', course);
      } else {
        navigate(`/courses/${targetSlug}`);
      }
    }, 280);
  };

  const enrollTargetUrl = `https://3capstech.com/courses/${course?.slug || activeSlug}`;
  const promoPageUrl = `https://3capstech.com/promo/${course?.slug || activeSlug}`;

  const copyToClipboard = (text, type = 'link') => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      if (type === 'link') {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2400);
      } else {
        setCopiedWhatsapp(true);
        setTimeout(() => setCopiedWhatsapp(false), 2400);
      }
    }
  };

  const handleShareWhatsApp = () => {
    const text = course?.share_templates?.whatsapp ||
      `🌿 Master the Art of Landscape Architecture with *${course?.title || 'Landscape Mastery'}*!\n\nExclusive masterclass pass with lifetime access for only ₹${course?.price || 299}.\n\n✨ Tap here or scan the QR pass to claim your spot:\n${promoPageUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShareTwitter = () => {
    const text = course?.share_templates?.twitter ||
      `Elevate your architectural vision with ${course?.title || 'Landscape Mastery'}. Claim lifetime access: ${promoPageUrl} #LandscapeArchitecture #ArchitectureDesign #Masterclass`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShareLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(promoPageUrl)}`, '_blank');
  };

  const handleDownloadQR = () => {
    const directQr = `${BASE_URL}/api/public/courses/${course?.slug || activeSlug}/qr.png`;
    const link = document.createElement('a');
    link.href = directQr;
    link.download = `LandscapeMastery_QR_${course?.slug || 'pass'}.png`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#021f1d] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(16,185,129,0.15),transparent_70%)] pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl border-2 border-emerald-500/30 border-t-emerald-400 animate-spin flex items-center justify-center shadow-2xl shadow-emerald-500/20">
            <span className="material-symbols-outlined text-emerald-400 text-xl">qr_code_2</span>
          </div>
          <p className="text-xs uppercase tracking-widest font-mono text-emerald-300/80 animate-pulse">
            Generating VIP Invitation Pass...
          </p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] text-stone-900 flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-stone-200/90 shadow-xl text-center space-y-5">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">error_outline</span>
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold tracking-tight text-stone-900">Invitation Not Found</h2>
            <p className="text-xs text-stone-500 leading-relaxed">
              {error || 'This course promotional pass may have expired or was deactivated.'}
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              to="/courses"
              className="w-full py-3 px-4 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-white font-semibold text-xs transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <span>Explore Course Catalog</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/"
              className="w-full py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs transition-all"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const rawPrice = course.price || 499;
  const rawDiscount = course.discount_price || rawPrice;
  const displayPrice = parseInt(rawDiscount);
  const displayOriginal = parseInt(rawPrice);
  const hasSavings = displayPrice < displayOriginal;

  return (
    <div className="min-h-screen bg-[#031B19] text-stone-100 selection:bg-emerald-500 selection:text-white font-sans relative overflow-x-hidden">
      {/* Ambient Lighting Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-gradient-to-b from-emerald-500/18 via-teal-500/10 to-transparent blur-3xl pointer-events-none -z-0" />
      <div className="absolute top-[35%] -right-40 w-[500px] h-[500px] bg-amber-500/8 rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="absolute bottom-10 -left-40 w-[500px] h-[500px] bg-emerald-600/8 rounded-full blur-3xl pointer-events-none -z-0" />

      {/* Top Brand Navigation Bar */}
      <header className="relative z-20 border-b border-emerald-900/40 bg-[#031B19]/80 backdrop-blur-md sticky top-0 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-900 to-teal-800 border border-emerald-700/40 flex items-center justify-center shadow-md shadow-emerald-950/40 group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-amber-300 text-lg">spa</span>
          </div>
          <div>
            <span className="text-sm font-bold tracking-tight text-white block group-hover:text-emerald-300 transition-colors">
              Landscape Mastery
            </span>
            <span className="text-[9px] uppercase tracking-widest font-mono text-emerald-400 block -mt-0.5">
              Architectural Masterclass
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleRedirectToEnroll()}
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-950/40 cursor-pointer active:scale-98"
          >
            <span>Direct Enroll</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <Link
            to="/login"
            className="px-3.5 py-1.5 rounded-xl border border-emerald-800/60 hover:border-emerald-600 text-stone-300 hover:text-white text-xs font-medium transition-all"
          >
            Student Portal
          </Link>
        </div>
      </header>

      {/* Main Promotional Container */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-14 space-y-8">
        
        {/* Dynamic Attention-Grabbing Greeting Header */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-semibold shadow-lg shadow-emerald-950/50 backdrop-blur-md"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{course.greeting?.badge || 'OFFICIAL VIP INVITATION PASS • 2026 EDITION'}</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-3"
          >
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-serif font-bold text-white tracking-tight leading-tight max-w-2xl mx-auto">
              Welcome, Visionary Architect &amp; Designer
            </h1>
            <p className="text-sm sm:text-base text-emerald-100/80 max-w-xl mx-auto font-light leading-relaxed">
              You have been granted an exclusive invitation to master{' '}
              <strong className="text-amber-300 font-semibold">{course.title}</strong>.
              Scan the VIP pass or tap directly to claim your reserved spot.
            </p>
          </motion.div>
        </div>

        {/* Centerpiece: The High-Impact Golden QR Pass Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="relative max-w-lg mx-auto"
        >
          {/* Subtle Outer Glow & Guilloche Accent */}
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/30 via-amber-400/20 to-teal-500/30 rounded-[32px] blur-xl opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt pointer-events-none" />

          <div className="relative bg-gradient-to-b from-[#082b27] via-[#05221f] to-[#031917] border-2 border-emerald-500/30 rounded-[30px] p-6 sm:p-8 shadow-2xl shadow-black/80 space-y-6 backdrop-blur-xl">
            
            {/* VIP Pass Header Row */}
            <div className="flex items-center justify-between border-b border-emerald-900/60 pb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-400 text-xl">token</span>
                <div>
                  <span className="text-[11px] font-mono tracking-widest text-emerald-300/90 uppercase font-bold block">
                    Exclusive Pass
                  </span>
                  <span className="text-[10px] text-stone-400 font-mono block">
                    Pass ID: LM-{course.id ? String(course.id).padStart(4, '0') : 'VIP'}-{course.slug?.toUpperCase() || 'PASS'}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-mono tracking-wider px-2.5 py-1 rounded-md bg-emerald-900/60 border border-emerald-600/40 text-emerald-300 font-bold">
                  {course.status === 'PUBLISHED' ? 'Verified Active' : 'Special Invite'}
                </span>
              </div>
            </div>

            {/* Course Title & Investment Tag */}
            <div className="text-center space-y-1.5">
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-tight leading-snug">
                {course.title}
              </h2>
              <div className="flex items-center justify-center gap-2 pt-0.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-amber-300 font-mono">
                  ₹{displayPrice}
                </span>
                {hasSavings && (
                  <span className="text-sm font-mono text-stone-400 line-through">
                    ₹{displayOriginal}
                  </span>
                )}
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300 bg-emerald-950/80 border border-emerald-600/40 px-2 py-0.5 rounded-md font-semibold">
                  Lifetime Access
                </span>
              </div>
            </div>

            {/* The QR Code (CLICKABLE & SCAN-READY) */}
            <div className="flex flex-col items-center justify-center pt-1">
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleRedirectToEnroll}
                title="Tap or Scan to open Course Enrollment"
                className={`group relative p-5 sm:p-6 bg-white rounded-2xl shadow-xl shadow-black/40 border-4 border-amber-400/40 cursor-pointer transition-all ${
                  qrTapped ? 'ring-4 ring-emerald-400 ring-offset-4 ring-offset-[#05221f]' : ''
                }`}
              >
                {/* Visual "TAP TO ENROLL" Hover Overlay for Desktop / Touch */}
                <div className="absolute inset-0 bg-emerald-950/90 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4 text-center z-10">
                  <span className="material-symbols-outlined text-amber-300 text-3xl animate-bounce">
                    touch_app
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    Tap to Open Enrollment
                  </span>
                  <span className="text-[10px] text-emerald-300 font-mono">
                    Direct Checkout • ₹{displayPrice}
                  </span>
                </div>

                {/* Branded QR Code */}
                <QRCodeSVG
                  value={enrollTargetUrl}
                  size={200}
                  level="H"
                  bgColor="#FFFFFF"
                  fgColor="#064E3B"
                  includeMargin={false}
                  imageSettings={{
                    src: '/lm_logo.png',
                    x: undefined,
                    y: undefined,
                    height: 38,
                    width: 38,
                    excavate: true
                  }}
                  className="rounded-lg"
                />

                {/* Corner Guilloche Brackets */}
                <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-amber-600 pointer-events-none" />
                <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-amber-600 pointer-events-none" />
                <div className="absolute bottom-2 left-2 w-3 h-2 border-b-2 border-l-2 border-amber-600 pointer-events-none" />
                <div className="absolute bottom-2 right-2 w-3 h-2 border-b-2 border-r-2 border-amber-600 pointer-events-none" />
              </motion.div>

              {/* QR Interactive Hint Pill */}
              <div className="mt-3.5 flex items-center gap-2 text-[11px] font-mono text-emerald-300/90 bg-emerald-950/80 border border-emerald-800/70 px-3.5 py-1 rounded-full">
                <span className="material-symbols-outlined text-sm text-amber-300 animate-pulse">
                  qr_code_scanner
                </span>
                <span>Scan with phone camera or tap card directly</span>
              </div>
            </div>

            {/* Primary Mobile-Friendly Action Button */}
            <div className="space-y-2.5 pt-2">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleRedirectToEnroll}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm tracking-wide transition-all shadow-xl shadow-emerald-950/60 border border-emerald-400/40 flex items-center justify-center gap-2.5 cursor-pointer group active:scale-98"
              >
                <span className="material-symbols-outlined text-amber-300 text-xl group-hover:translate-x-0.5 transition-transform">
                  verified
                </span>
                <span>Claim Your Spot Now • ₹{displayPrice}</span>
                <ArrowRight className="w-4 h-4 text-emerald-200 group-hover:translate-x-1 transition-transform" />
              </motion.button>

              <div className="flex items-center justify-center gap-4 text-[10px] text-stone-400 font-mono">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  Razorpay Secured
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" />
                  Instant Activation
                </span>
                <span>•</span>
                <span>Zero Recurring Fees</span>
              </div>
            </div>

          </div>
        </motion.div>

        {/* Course Highlights & Curriculum Snapshot */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-gradient-to-b from-[#062622]/70 to-[#031a17]/90 border border-emerald-900/50 rounded-2xl p-6 sm:p-7 space-y-5 backdrop-blur-md"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-emerald-900/50 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                Masterclass Deliverables &amp; Specifications
              </h3>
              <p className="text-xs text-stone-400 mt-0.5">
                Engineered for practicing architects, landscape designers, and civil site planners.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-950 border border-emerald-700/40 text-emerald-300 text-xs font-mono font-bold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {course.duration_hrs || '45 mins'}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-950 border border-emerald-700/40 text-emerald-300 text-xs font-mono font-bold flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                {course.module_count || 1} Modules
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-950 border border-emerald-700/40 text-emerald-300 text-xs font-mono font-bold flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5" />
                {course.level || 'All Levels'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs text-stone-300">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-950/40 border border-emerald-900/40">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-semibold">Botanical Growth Zoning &amp; Sun Exposure</strong>
                <p className="text-stone-400 text-[11px] mt-0.5">Species placement, drought-tolerant micro-climates, and root depth frameworks.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-950/40 border border-emerald-900/40">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-semibold">AutoCAD Drafting &amp; DWG Blueprints</strong>
                <p className="text-stone-400 text-[11px] mt-0.5">Downloadable construction-ready CAD layers, sections, and elevation details.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-950/40 border border-emerald-900/40">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-semibold">Site Contour Grading &amp; Stone Masonry</strong>
                <p className="text-stone-400 text-[11px] mt-0.5">Terraced slope retention, natural stone detailing, and water drainage calculations.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-950/40 border border-emerald-900/40">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-semibold">Automated Lifetime Portal Access</strong>
                <p className="text-stone-400 text-[11px] mt-0.5">DRM-encrypted HD video stream on mobile, tablet, and workstation.</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Social Sharing & Promotion Hub (Pass it Forward) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-gradient-to-r from-emerald-950/60 via-[#072d28]/70 to-emerald-950/60 border border-emerald-800/40 rounded-2xl p-6 sm:p-7 space-y-4"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Share2 className="w-4 h-4 text-amber-300" />
                Share this Promotional Invitation with Your Team
              </h3>
              <p className="text-xs text-stone-400 mt-0.5">
                Invite friends, fellow architecture students, and studio colleagues.
              </p>
            </div>

            <button
              onClick={handleDownloadQR}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-900/80 hover:bg-emerald-800 border border-emerald-700/50 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-amber-300" />
              <span>Download QR Pass (PNG)</span>
            </button>
          </div>

          {/* Social Action Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            {/* WhatsApp */}
            <button
              onClick={handleShareWhatsApp}
              className="p-3 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base text-[#25D366]">chat</span>
              <span>WhatsApp</span>
            </button>

            {/* X / Twitter */}
            <button
              onClick={handleShareTwitter}
              className="p-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="font-bold text-sm">𝕏</span>
              <span>Twitter / X</span>
            </button>

            {/* LinkedIn */}
            <button
              onClick={handleShareLinkedIn}
              className="p-3 rounded-xl bg-[#0A66C2]/15 hover:bg-[#0A66C2]/25 border border-[#0A66C2]/30 text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base text-[#0A66C2]">hub</span>
              <span>LinkedIn</span>
            </button>

            {/* Copy Link */}
            <button
              onClick={() => copyToClipboard(promoPageUrl, 'link')}
              className="p-3 rounded-xl bg-emerald-900/50 hover:bg-emerald-900/80 border border-emerald-700/50 text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-stone-300" />
                  <span>Copy Promo Link</span>
                </>
              )}
            </button>
          </div>

          {/* Promo URL Box */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-emerald-900/60 text-xs font-mono text-emerald-300 overflow-x-auto">
            <span className="truncate mr-2">{promoPageUrl}</span>
            <button
              onClick={() => copyToClipboard(promoPageUrl, 'link')}
              className="text-stone-400 hover:text-white transition-colors cursor-pointer flex-shrink-0"
              title="Copy to clipboard"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-emerald-950/60 bg-[#021514] py-8 text-center text-xs text-stone-500 space-y-2">
        <p>© 2026 Landscape Mastery Architectural Masterclass. Secure &amp; DRM Encrypted.</p>
        <div className="flex items-center justify-center gap-4 text-[11px] text-stone-400">
          <Link to="/courses" className="hover:text-emerald-300 transition-colors">Courses</Link>
          <span>•</span>
          <Link to={`/courses/${course.slug || activeSlug}`} className="hover:text-emerald-300 transition-colors">Enrollment Portal</Link>
          <span>•</span>
          <Link to="/login" className="hover:text-emerald-300 transition-colors">Student Login</Link>
          <span>•</span>
          <Link to="/" className="hover:text-emerald-300 transition-colors">3CAPSTECH Corporate</Link>
        </div>
      </footer>
    </div>
  );
}
