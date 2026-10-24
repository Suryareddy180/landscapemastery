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
  const [qrSize, setQrSize] = useState(170);

  useEffect(() => {
    const handleResize = () => {
      setQrSize(window.innerWidth < 640 ? 170 : 200);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fallback slug if accessed via root or empty (rectified 'landscape-lens')
  const activeSlug = (courseSlug === 'lanscape-lens' ? 'landscape-lens' : courseSlug) || 'landscape-lens';

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
          promo_url: `https://3capstech.com/landscapemastery/promo/${detailData.slug}`,
          enroll_url: `https://3capstech.com/courses/${detailData.slug}`,
          qr_image_url: `${BASE_URL}/api/public/courses/${detailData.slug}/qr.png`,
          greeting: {
            badge: 'Special Course Invitation',
            salutation: "Welcome! You're Invited",
            headline: `Get Full Access to ${detailData.title}`,
            subtext: `We are excited to share this course with you! Scan the QR code or tap the card below to enroll in ${detailData.title} and get lifetime access.`
          },
          share_templates: {
            whatsapp: `🌿 Start learning with *${detailData.title}*!\n\nGet complete lifetime access for only ₹${parseInt(detailData.price)}.\n\n✨ Tap here or scan the QR pass to join:\nhttps://3capstech.com/landscapemastery/promo/${detailData.slug}`,
            twitter: `Join ${detailData.title} by Landscape Mastery (a product of 3CAPSTECH). Lifetime access for ₹${parseInt(detailData.price)}: https://3capstech.com/landscapemastery/promo/${detailData.slug} #LandscapeMastery #3CAPSTECH`,
            linkedin: `Excited to share the ${detailData.title} course by Landscape Mastery (a product of 3CAPSTECH): https://3capstech.com/landscapemastery/promo/${detailData.slug}`,
            instagram_caption: `✨ Join ${detailData.title} by Landscape Mastery (a product of 3CAPSTECH).\n\n👉 Tap link in bio or visit: 3capstech.com/landscapemastery/promo/${detailData.slug}`
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
        const courses = listData.courses || [];
        const match = courses.find(
          c => c.slug === activeSlug ||
               (activeSlug === 'landscape-lens' && (c.slug === 'lanscape-lens' || (c.title && c.title.toLowerCase().includes('landscape')))) ||
               (c.title && c.title.toLowerCase().replace(/\s+/g, '-').includes(activeSlug))
        ) || (activeSlug === 'landscape-lens' ? courses[0] : null);

        if (match) {
          setCourse({
            ...match,
            promo_url: `https://3capstech.com/landscapemastery/promo/${match.slug}`,
            enroll_url: `https://3capstech.com/courses/${match.slug}`,
            qr_image_url: `${BASE_URL}/api/public/courses/${match.slug}/qr.png`,
            greeting: {
              badge: 'Special Course Invitation',
              salutation: "Welcome! You're Invited",
              headline: `Get Full Access to ${match.title}`,
              subtext: 'Scan the QR code or tap the card below to claim your spot and get lifetime access.'
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
  const promoPageUrl = course?.promo_url || `https://3capstech.com/landscapemastery/promo/${course?.slug || activeSlug}`;

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
      `🌿 Start learning with *${course?.title || 'Landscape Mastery'}*!\n\nExclusive course access with lifetime validity for only ₹${displayPrice}${hasSavings ? ` (Regular ₹${displayOriginal} • ${discountPct}% OFF)` : ''}.\n\n✨ Tap here or scan the QR pass to join:\n${promoPageUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShareTwitter = () => {
    const text = course?.share_templates?.twitter ||
      `Join ${course?.title || 'Landscape Mastery'} (a product of 3CAPSTECH). Lifetime access: ${promoPageUrl} #LandscapeMastery #3CAPSTECH`;
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

  const isStrikeOffOn = course.is_strike_off_enabled !== false;
  // Strike ₹499 to display the special promotional price of ₹299 (40% OFF) to grab user attention
  const isBase499 = Number(course.price) === 499 || Number(course.discount_price) === 499 || (!course.price && !course.original_price);
  const rawOriginal = isStrikeOffOn ? (course.original_price || course.strike_price || (isBase499 ? 499 : null)) : null;
  const displayOriginal = rawOriginal ? parseInt(rawOriginal) : null;
  const displayPrice = isBase499 && (!course.original_price || Number(course.original_price) <= 499) 
    ? 299 
    : parseInt(course.price || course.discount_price || 299);
  const hasSavings = Boolean(isStrikeOffOn && displayOriginal && displayOriginal > displayPrice);
  const discountPct = isStrikeOffOn ? (course.discount_pct || (hasSavings ? Math.round(((displayOriginal - displayPrice) / displayOriginal) * 100) : 0)) : 0;

  return (
    <div className="min-h-screen bg-[#031B19] text-stone-100 selection:bg-emerald-500 selection:text-white font-sans relative overflow-x-hidden">
      {/* Ambient Lighting Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-gradient-to-b from-emerald-500/18 via-teal-500/10 to-transparent blur-3xl pointer-events-none -z-0" />
      <div className="absolute top-[35%] -right-40 w-[500px] h-[500px] bg-amber-500/8 rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="absolute bottom-10 -left-40 w-[500px] h-[500px] bg-emerald-600/8 rounded-full blur-3xl pointer-events-none -z-0" />

      {/* Top Brand Navigation Bar */}
      <header className="relative z-20 border-b border-emerald-900/40 bg-[#031B19]/80 backdrop-blur-md sticky top-0 px-3 sm:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-2">
        <Link to="/landscapemastery" className="flex items-center gap-2 sm:gap-3 group shrink-0 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/10 border border-emerald-700/40 p-1 flex items-center justify-center shadow-md shadow-emerald-950/40 group-hover:scale-105 transition-transform shrink-0">
            <img src="/lm_logo.png" alt="Landscape Mastery" className="w-full h-full object-contain" />
          </div>
          <div className="min-w-0">
            <span className="text-xs sm:text-base font-bold tracking-tight text-white block group-hover:text-emerald-300 transition-colors leading-tight truncate">
              Landscape Mastery
            </span>
            <span className="text-[8px] sm:text-[9px] uppercase tracking-wider font-mono text-emerald-400 block -mt-0.5 leading-tight truncate">
              Online Learning Platform
            </span>
          </div>
        </Link>

        {/* Top Right: 3CAPSTECH Parent Company Logo */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">

          {/* 3CAPSTECH Corporate Logo at Top Right Corner */}
          <a
            href="/"
            title="3CAPSTECH - Parent Company"
            className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-emerald-500/25 hover:border-emerald-500/50 transition-all group shrink-0"
          >
            <img
              src="/logo.png"
              alt="3CAPSTECH"
              className="h-5 sm:h-7 w-auto max-w-[80px] sm:max-w-none object-contain brightness-110 drop-shadow-[0_0_8px_rgba(17,168,49,0.3)] transition-transform group-hover:scale-105"
            />
            <div className="flex flex-col text-left leading-none">
              <span className="text-[7px] sm:text-[8px] uppercase tracking-wider text-emerald-400 font-mono font-bold leading-tight">
                Product of
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-white tracking-tight leading-tight group-hover:text-emerald-300 transition-colors">
                3CAPSTECH
              </span>
            </div>
          </a>
        </div>
      </header>

      {/* Main Promotional Container */}
      <main className="relative z-10 max-w-4xl mx-auto px-3.5 sm:px-6 py-6 sm:py-12 space-y-6 sm:space-y-8">
        
        {/* Friendly Non-Technical Greeting Header */}
        <div className="text-center space-y-3 sm:space-y-4">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 text-[11px] sm:text-xs font-mono font-semibold shadow-lg shadow-emerald-950/50 backdrop-blur-md"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{course.greeting?.badge || 'Special Course Invitation'}</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-2 sm:space-y-3"
          >
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-serif font-bold text-white tracking-tight leading-tight max-w-2xl mx-auto px-2">
              {course.greeting?.salutation || "Welcome! You're Invited to Join"}
            </h1>
            <p className="text-xs sm:text-base text-emerald-100/90 max-w-xl mx-auto font-light leading-relaxed px-2">
              {course.greeting?.subtext || (
                <>
                  Scan the QR code or tap the pass below to claim your spot in{' '}
                  <strong className="text-amber-300 font-semibold">{course.title}</strong>{' '}
                  with instant lifetime access.
                </>
              )}
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
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/30 via-amber-400/20 to-teal-500/30 rounded-[28px] sm:rounded-[32px] blur-xl opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt pointer-events-none" />

          <div className="relative bg-gradient-to-b from-[#082b27] via-[#05221f] to-[#031917] border-2 border-emerald-500/30 rounded-[24px] sm:rounded-[30px] p-4 sm:p-8 shadow-2xl shadow-black/80 space-y-4 sm:space-y-6 backdrop-blur-xl">
            
            {/* Course Pass Header Row */}
            <div className="flex items-center justify-between border-b border-emerald-900/60 pb-3 sm:pb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-400 text-lg sm:text-xl">token</span>
                <div>
                  <span className="text-[10px] sm:text-[11px] font-mono tracking-widest text-emerald-300/90 uppercase font-bold block">
                    Official Course Pass
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-stone-400 font-mono block">
                    Access Pass: LM-{course.id ? String(course.id).padStart(4, '0') : '001'}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[9px] sm:text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md bg-emerald-900/60 border border-emerald-600/40 text-emerald-300 font-bold">
                  {course.status === 'PUBLISHED' ? 'Verified Active' : 'Special Invite'}
                </span>
              </div>
            </div>

            {/* Course Title & Investment Tag */}
            <div className="text-center space-y-1.5">
              <h2 className="text-lg sm:text-2xl font-serif font-bold text-white tracking-tight leading-snug">
                {course.title}
              </h2>
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 pt-0.5">
                {hasSavings && (
                  <span className="text-base sm:text-xl font-mono text-stone-400 line-through decoration-rose-500 decoration-2 font-medium">
                    ₹{displayOriginal}
                  </span>
                )}
                <span className="text-2xl sm:text-4xl font-extrabold text-amber-300 font-mono tracking-tight drop-shadow-sm">
                  ₹{displayPrice}
                </span>
                <span className="text-[9px] sm:text-[10px] font-mono uppercase tracking-wider text-emerald-300 bg-emerald-950/80 border border-emerald-600/40 px-2 py-0.5 rounded-md font-semibold">
                  Lifetime Access
                </span>
                {discountPct > 0 && (
                  <span className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-emerald-950 bg-gradient-to-r from-amber-400 to-amber-300 px-2.5 py-0.5 rounded-md font-extrabold shadow-sm">
                    {discountPct}% OFF
                  </span>
                )}
              </div>
            </div>

            {/* The QR Code (CLICKABLE & SCAN-READY) */}
            <div className="flex flex-col items-center justify-center pt-0.5">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleRedirectToEnroll}
                title="Tap to open Course Enrollment"
                className={`group relative p-3.5 sm:p-6 bg-white rounded-2xl shadow-xl shadow-black/40 border-3 sm:border-4 border-amber-400/40 cursor-pointer transition-all ${
                  qrTapped ? 'ring-4 ring-emerald-400 ring-offset-4 ring-offset-[#05221f]' : ''
                }`}
              >
                {/* Visual "TAP TO ENROLL" Hover Overlay for Desktop */}
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
                  size={qrSize}
                  level="H"
                  bgColor="#FFFFFF"
                  fgColor="#064E3B"
                  includeMargin={false}
                  imageSettings={{
                    src: '/lm_logo.png',
                    x: undefined,
                    y: undefined,
                    height: qrSize < 180 ? 32 : 38,
                    width: qrSize < 180 ? 32 : 38,
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
              <button
                type="button"
                onClick={handleRedirectToEnroll}
                className="mt-3 flex items-center gap-1.5 text-[10px] sm:text-[11px] font-mono text-emerald-300/95 bg-emerald-950/90 border border-emerald-700/60 px-3 py-1 rounded-full shadow-sm text-center hover:bg-emerald-900 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm text-amber-300 animate-pulse">
                  touch_app
                </span>
                <span>Tap pass or button below to enroll</span>
              </button>
            </div>

            {/* Primary Mobile-Friendly Action Button */}
            <div className="space-y-2.5 pt-1">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleRedirectToEnroll}
                className="w-full py-3.5 sm:py-4 px-4 sm:px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm tracking-wide transition-all shadow-xl shadow-emerald-950/60 border border-emerald-400/40 flex items-center justify-center gap-2 cursor-pointer group active:scale-98"
              >
                <span className="material-symbols-outlined text-amber-300 text-lg sm:text-xl group-hover:translate-x-0.5 transition-transform">
                  verified
                </span>
                <span>Claim Your Spot Now • ₹{displayPrice}</span>
                <ArrowRight className="w-4 h-4 text-emerald-200 group-hover:translate-x-1 transition-transform" />
              </motion.button>

              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-[9px] sm:text-[10px] text-stone-400 font-mono">
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

        {/* Social Sharing & Promotion Hub (Pass it Forward) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-gradient-to-r from-emerald-950/60 via-[#072d28]/70 to-emerald-950/60 border border-emerald-800/40 rounded-2xl p-4 sm:p-7 space-y-3.5 sm:space-y-4"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                <Share2 className="w-4 h-4 text-amber-300 shrink-0" />
                <span>Share Invitation Pass with Your Team</span>
              </h3>
              <p className="text-[11px] sm:text-xs text-stone-400 mt-0.5">
                Invite friends, fellow architecture students, and studio colleagues.
              </p>
            </div>

            <button
              onClick={handleDownloadQR}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-xl bg-emerald-900/80 hover:bg-emerald-800 border border-emerald-700/50 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-amber-300" />
              <span>Download QR Pass (PNG)</span>
            </button>
          </div>

          {/* Social Action Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            {/* WhatsApp */}
            <button
              onClick={handleShareWhatsApp}
              className="p-2.5 sm:p-3 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base text-[#25D366]">chat</span>
              <span>WhatsApp</span>
            </button>

            {/* X / Twitter */}
            <button
              onClick={handleShareTwitter}
              className="p-2.5 sm:p-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span className="font-bold text-sm">𝕏</span>
              <span>Twitter / X</span>
            </button>

            {/* LinkedIn */}
            <button
              onClick={handleShareLinkedIn}
              className="p-2.5 sm:p-3 rounded-xl bg-[#0A66C2]/15 hover:bg-[#0A66C2]/25 border border-[#0A66C2]/30 text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base text-[#0A66C2]">hub</span>
              <span>LinkedIn</span>
            </button>

            {/* Copy Link */}
            <button
              onClick={() => copyToClipboard(promoPageUrl, 'link')}
              className="p-2.5 sm:p-3 rounded-xl bg-emerald-900/50 hover:bg-emerald-900/80 border border-emerald-700/50 text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-stone-300" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>

          {/* Promo URL Box */}
          <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-black/40 border border-emerald-900/60 text-[11px] sm:text-xs font-mono text-emerald-300 overflow-x-auto gap-2">
            <span className="truncate">{promoPageUrl}</span>
            <button
              onClick={() => copyToClipboard(promoPageUrl, 'link')}
              className="text-stone-400 hover:text-white transition-colors cursor-pointer shrink-0 p-1"
              title="Copy to clipboard"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-emerald-950/60 bg-[#021514] py-6 sm:py-8 px-4 text-center text-xs text-stone-500 space-y-2">
        <p>© 2026 Landscape Mastery Architectural Masterclass. Secure &amp; DRM Encrypted.</p>
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-[10px] sm:text-[11px] text-stone-400">
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
