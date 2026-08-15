import React from 'react';
import { motion } from 'framer-motion';

export default function Header({ activeView, onNavigate, logoSize = 48, user }) {
  const scrollToSection = (id) => {
    if (activeView !== 'v1') {
      onNavigate('v1');
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-full top-0 sticky bg-white/95 backdrop-blur-xl border-b border-stone-200/90 z-50 shadow-[0_4px_25px_-4px_rgba(6,78,59,0.08)]"
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center px-4 sm:px-6 lg:px-8 py-3.5">
        {/* Brand Logo & Title */}
        <motion.button 
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => onNavigate('v1')} 
          className="flex items-center gap-3.5 group focus:outline-none cursor-pointer text-left"
        >
          <div className="relative rounded-full shadow-md overflow-hidden flex items-center justify-center ring-2 ring-emerald-800/20 ring-offset-2 ring-offset-white bg-stone-50 transition-all duration-300 group-hover:ring-emerald-700">
            <img 
              src="/lm_logo.png" 
              alt="Landscape Mastery Logo" 
              style={{ height: `${Math.max(logoSize || 46, 44)}px`, width: `${Math.max(logoSize || 46, 44)}px` }}
              className="object-contain rounded-full transition-transform duration-300 group-hover:scale-105"
            />
          </div>

          <div>
            <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-emerald-950 block leading-none">
              Landscape Mastery
            </span>
            <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-widest mt-1 block">
              Architectural Masterclass
            </span>
          </div>
        </motion.button>

        {/* Central Navigation Anchor Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-stone-600">
          <button 
            onClick={() => scrollToSection('course-curriculum')}
            className="hover:text-emerald-800 transition-colors cursor-pointer py-1"
          >
            Curriculum
          </button>
          <button 
            onClick={() => scrollToSection('features')}
            className="hover:text-emerald-800 transition-colors cursor-pointer py-1"
          >
            Masterclass Framework
          </button>
          <button 
            onClick={() => scrollToSection('enroll-card')}
            className="hover:text-emerald-800 transition-colors cursor-pointer py-1"
          >
            Pricing &amp; Access
          </button>
        </nav>

        {/* Header Right Action */}
        <div className="flex items-center gap-3">
          <motion.button 
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className={`font-semibold text-xs sm:text-sm px-5 py-2.5 rounded-full transition-all flex items-center gap-2 cursor-pointer shadow-sm ${
              activeView === 'v2'
                ? 'bg-stone-100 text-stone-800 border border-stone-300 hover:bg-stone-200'
                : 'bg-emerald-900 hover:bg-emerald-800 text-white shadow-emerald-950/20'
            }`}
            onClick={() => onNavigate(activeView === 'v2' ? 'v1' : 'v2')}
          >
            <span className="material-symbols-outlined text-sm">
              {activeView === 'v2' ? 'arrow_back' : 'lock'}
            </span>
            {activeView === 'v2' ? 'Back Home' : 'Login'}
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
}
