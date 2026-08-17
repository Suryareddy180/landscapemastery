import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Header({ activeView, onNavigate, logoSize = 48, logoUrl = '/lm_logo.png', user, onLogout }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    if (activeView !== 'v1') {
      onNavigate('v1');
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 120);
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const isAdmin = user && ['SUPER_ADMIN', 'CONTENT_MANAGER', 'SUPPORT_ADMIN', 'ADMIN'].includes(user.role);

  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-full top-0 sticky bg-white/85 backdrop-blur-xl border-b border-stone-200/80 z-50 shadow-[0_4px_30px_-4px_rgba(6,78,59,0.06)]"
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center px-4 sm:px-6 lg:px-8 py-3">
        {/* Brand Logo & Editorial Title */}
        <motion.button 
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => onNavigate('v1')} 
          className="flex items-center gap-3.5 group focus:outline-none cursor-pointer text-left"
        >
          <div className="relative rounded-2xl shadow-sm overflow-hidden flex items-center justify-center p-1.5 ring-1 ring-emerald-900/15 bg-stone-50 transition-all duration-300 group-hover:ring-emerald-700/50 group-hover:shadow-md">
            <img 
              src={(logoUrl && (logoUrl.startsWith('/media/') ? `http://localhost:8000${logoUrl}` : logoUrl)) || '/lm_logo.png'} 
              alt="Landscape Mastery Logo" 
              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/lm_logo.png'; }}
              style={{ height: `${Math.max(logoSize || 46, 42)}px`, width: `${Math.max(logoSize || 46, 42)}px` }}
              className="object-contain transition-transform duration-300 group-hover:scale-105 rounded-xl"
            />
          </div>

          <div>
            <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-emerald-950 block leading-tight">
              Landscape Mastery
            </span>
            <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-[0.2em] block font-sans">
              Architectural Masterclass
            </span>
          </div>
        </motion.button>

        {/* Central Navigation Anchor Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-2 bg-stone-100/80 border border-stone-200/70 p-1.5 rounded-full shadow-inner">
          <button 
            onClick={() => scrollToSection('course-curriculum')}
            className="text-stone-700 hover:text-emerald-950 hover:bg-white text-xs font-semibold px-4 py-1.5 rounded-full transition-all duration-200 cursor-pointer shadow-none hover:shadow-sm"
          >
            Curriculum
          </button>
          <button 
            onClick={() => scrollToSection('features')}
            className="text-stone-700 hover:text-emerald-950 hover:bg-white text-xs font-semibold px-4 py-1.5 rounded-full transition-all duration-200 cursor-pointer shadow-none hover:shadow-sm"
          >
            Framework
          </button>
          <button 
            onClick={() => scrollToSection('enroll-card')}
            className="text-stone-700 hover:text-emerald-950 hover:bg-white text-xs font-semibold px-4 py-1.5 rounded-full transition-all duration-200 cursor-pointer shadow-none hover:shadow-sm"
          >
            Pricing &amp; Access
          </button>
        </nav>

        {/* Header Right Action & Mobile Toggle */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => onNavigate(isAdmin ? 'admin' : 'v3')}
                className="bg-emerald-900 hover:bg-emerald-800 text-white font-semibold text-xs px-4 py-2 rounded-full transition-all flex items-center gap-1.5 shadow-md shadow-emerald-950/20 cursor-pointer btn-shine"
              >
                <span className="material-symbols-outlined text-sm">{isAdmin ? 'admin_panel_settings' : 'play_circle'}</span>
                <span>{isAdmin ? 'Admin Console' : 'My Course Portal'}</span>
              </button>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold px-3.5 py-2 rounded-full transition-colors cursor-pointer border border-stone-200"
                >
                  Logout
                </button>
              )}
            </div>
          ) : (
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`font-semibold text-xs sm:text-sm px-5 py-2.5 rounded-full transition-all hidden sm:flex items-center gap-2 cursor-pointer shadow-md ${
                activeView === 'v2'
                  ? 'bg-stone-100 text-stone-800 border border-stone-300 hover:bg-stone-200'
                  : 'bg-emerald-900 hover:bg-emerald-800 text-white shadow-emerald-950/25 btn-shine'
              }`}
              onClick={() => onNavigate(activeView === 'v2' ? 'v1' : 'v2')}
            >
              <span className="material-symbols-outlined text-sm">
                {activeView === 'v2' ? 'arrow_back' : 'lock'}
              </span>
              <span>{activeView === 'v2' ? 'Back to Landing' : 'Student / Admin Login'}</span>
            </motion.button>
          )}

          {/* Mobile Hamburger Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2.5 rounded-xl text-stone-700 hover:bg-stone-100 focus:outline-none border border-stone-200 cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            <span className="material-symbols-outlined text-2xl">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Responsive Mobile Drawer Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-white border-b border-stone-200 px-6 py-5 shadow-xl space-y-4"
          >
            <nav className="flex flex-col gap-2 text-sm font-semibold text-stone-700">
              <button 
                onClick={() => scrollToSection('course-curriculum')}
                className="text-left py-2.5 px-3.5 rounded-xl hover:bg-stone-50 hover:text-emerald-900 flex items-center justify-between transition-colors"
              >
                <span>Curriculum</span>
                <span className="material-symbols-outlined text-sm text-stone-400">chevron_right</span>
              </button>
              <button 
                onClick={() => scrollToSection('features')}
                className="text-left py-2.5 px-3.5 rounded-xl hover:bg-stone-50 hover:text-emerald-900 flex items-center justify-between transition-colors"
              >
                <span>Masterclass Framework</span>
                <span className="material-symbols-outlined text-sm text-stone-400">chevron_right</span>
              </button>
              <button 
                onClick={() => scrollToSection('enroll-card')}
                className="text-left py-2.5 px-3.5 rounded-xl hover:bg-stone-50 hover:text-emerald-900 flex items-center justify-between transition-colors"
              >
                <span>Pricing &amp; Access</span>
                <span className="material-symbols-outlined text-sm text-stone-400">chevron_right</span>
              </button>
            </nav>

            <div className="pt-3 border-t border-stone-100 flex flex-col gap-2">
              {user ? (
                <>
                  <button
                    onClick={() => { setMobileMenuOpen(false); onNavigate(isAdmin ? 'admin' : 'v3'); }}
                    className="w-full bg-emerald-900 text-white font-semibold text-xs py-3 rounded-xl flex items-center justify-center gap-2 shadow-md cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">{isAdmin ? 'admin_panel_settings' : 'play_circle'}</span>
                    <span>{isAdmin ? 'Open Admin Console' : 'Access Course Portal'}</span>
                  </button>
                  {onLogout && (
                    <button
                      onClick={() => { setMobileMenuOpen(false); onLogout(); }}
                      className="w-full bg-stone-100 text-stone-700 font-semibold text-xs py-2.5 rounded-xl hover:bg-stone-200 cursor-pointer border border-stone-200"
                    >
                      Logout
                    </button>
                  )}
                </>
              ) : (
                <button
                  onClick={() => { setMobileMenuOpen(false); onNavigate(activeView === 'v2' ? 'v1' : 'v2'); }}
                  className="w-full bg-emerald-900 text-white font-semibold text-xs py-3 rounded-xl flex items-center justify-center gap-2 shadow-md cursor-pointer btn-shine"
                >
                  <span className="material-symbols-outlined text-sm">lock</span>
                  <span>{activeView === 'v2' ? 'Back to Landing' : 'Student / Admin Login'}</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
