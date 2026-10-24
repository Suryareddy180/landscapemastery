import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CourseCatalog from './CourseCatalog.jsx';
import { BASE_URL } from '../lib/api.js';

export default function LandingView({ onNavigate, siteSettings, onLoginSuccess }) {
  const [activeFaq, setActiveFaq] = useState(null);
  const [catalogCourses, setCatalogCourses] = useState([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState([]);

  // Fetch course catalog on mount and load enrolled courses
  useEffect(() => {
    fetchCatalog();
    try {
      const saved = localStorage.getItem('lm_auth_user');
      if (saved) {
        const u = JSON.parse(saved);
        if (u.enrollments && Array.isArray(u.enrollments)) {
          setEnrolledCourseIds(u.enrollments.map(Number));
        }
      }
    } catch {
      // Ignore
    }
    if (window.location.pathname.endsWith('/courses')) {
      setTimeout(() => {
        const el = document.getElementById('course-catalog');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 350);
    }
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
    if (!course) return;
    try {
      const currentPath = window.location.pathname;
      const isLmPath = currentPath.startsWith('/landscapemastery');
      const targetBase = isLmPath ? '/landscapemastery/enroll' : '/enroll';
      const targetUrl = `${targetBase}?course=${course.id}`;
      if (currentPath + window.location.search !== targetUrl) {
        window.history.pushState({ courseId: course.id }, '', targetUrl);
      }
    } catch (e) {
      // Continue safely
    }

    if (onNavigate) {
      onNavigate('enroll', course);
    }
  };

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
      <CourseCatalog courses={catalogCourses} onSelectCourse={handleSelectCourse} onNavigate={onNavigate} enrolledCourseIds={enrolledCourseIds} />

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
