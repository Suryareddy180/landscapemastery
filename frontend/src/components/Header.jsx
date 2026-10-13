import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BASE_URL } from '../lib/api.js';

export default function Header({ activeView, onNavigate, logoSize = 48, logoUrl = '/lm_logo.png', user, onLogout, onOpenProfile }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
              src={(logoUrl && (logoUrl.startsWith('/media/') ? `${BASE_URL}${logoUrl}` : logoUrl)) || '/lm_logo.png'} 
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
            onClick={() => scrollToSection('course-catalog')}
            className="text-stone-700 hover:text-emerald-950 hover:bg-white text-xs font-semibold px-4 py-1.5 rounded-full transition-all duration-200 cursor-pointer shadow-none hover:shadow-sm"
          >
            Courses
          </button>
          <button 
            onClick={() => scrollToSection('enroll-card')}
            className="text-stone-700 hover:text-emerald-950 hover:bg-white text-xs font-semibold px-4 py-1.5 rounded-full transition-all duration-200 cursor-pointer shadow-none hover:shadow-sm"
          >
            Pricing &amp; Access
          </button>
          <Link 
            to="/"
            className="text-stone-700 hover:text-emerald-950 hover:bg-white text-xs font-semibold px-4 py-1.5 rounded-full transition-all duration-200 cursor-pointer shadow-none hover:shadow-sm"
          >
            3CAPSTECH
          </Link>
        </nav>

        {/* Header Right Action & Mobile Toggle */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="hidden sm:flex items-center gap-3">
              {/* User Profile Dropdown Pill */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full bg-stone-50 hover:bg-stone-100/90 border border-stone-200/90 shadow-2xs transition-all cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-900 text-white font-bold text-xs flex items-center justify-center overflow-hidden border border-emerald-700/40">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name || 'User'} className="w-full h-full object-cover" />
                    ) : (
                      <span>{(user.name || user.email || 'U')[0].toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-stone-800 group-hover:text-emerald-950 transition-colors leading-tight max-w-[120px] truncate">
                      {user.name || user.email.split('@')[0]}
                    </span>
                    <span className="text-[10px] text-stone-400 font-medium">
                      {user.role === 'STUDENT' ? 'Student' : (user.role === 'EMPLOYEE' ? 'Employee' : (user.role === 'HOUSEHOLD' ? 'Household' : 'Admin'))}
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-sm text-stone-400 group-hover:text-stone-600 transition-transform duration-200">
                    {profileDropdownOpen ? 'expand_less' : 'expand_more'}
                  </span>
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {profileDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-stone-200 py-2 z-50 overflow-hidden text-xs"
                    >
                      <div className="px-4 py-2 border-b border-stone-100">
                        <p className="font-bold text-stone-800 truncate">{user.name || 'User Account'}</p>
                        <p className="text-[11px] text-stone-400 truncate">{user.email}</p>
                      </div>

                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          if (onOpenProfile) onOpenProfile();
                        }}
                        className="w-full px-4 py-2.5 text-left text-stone-700 hover:bg-emerald-50 hover:text-emerald-950 flex items-center gap-2.5 font-semibold transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base text-emerald-800">account_circle</span>
                        <span>My Profile</span>
                      </button>

                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          if (onOpenProfile) onOpenProfile();
                        }}
                        className="w-full px-4 py-2.5 text-left text-stone-700 hover:bg-emerald-50 hover:text-emerald-950 flex items-center gap-2.5 font-semibold transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base text-stone-500">edit_note</span>
                        <span>Edit Profile</span>
                      </button>

                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          if (onOpenProfile) onOpenProfile();
                        }}
                        className="w-full px-4 py-2.5 text-left text-stone-700 hover:bg-emerald-50 hover:text-emerald-950 flex items-center gap-2.5 font-semibold transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base text-stone-500">lock_reset</span>
                        <span>Change Password</span>
                      </button>

                      <div className="border-t border-stone-100 my-1" />

                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          onNavigate(isAdmin ? 'admin' : 'v3');
                        }}
                        className="w-full px-4 py-2.5 text-left text-stone-700 hover:bg-stone-50 flex items-center gap-2.5 font-semibold transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base text-emerald-700">{isAdmin ? 'admin_panel_settings' : 'play_circle'}</span>
                        <span>{isAdmin ? 'Admin Operations' : 'Course Portal'}</span>
                      </button>

                      {onLogout && (
                        <button
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            onLogout();
                          }}
                          className="w-full px-4 py-2.5 text-left text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 font-semibold transition-colors cursor-pointer border-t border-stone-100"
                        >
                          <span className="material-symbols-outlined text-base text-rose-500">logout</span>
                          <span>Sign Out</span>
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Portal Quick Access Button */}
              <button
                onClick={() => onNavigate(isAdmin ? 'admin' : 'v3')}
                className="bg-emerald-900 hover:bg-emerald-800 text-white font-semibold text-xs px-4 py-2 rounded-full transition-all flex items-center gap-1.5 shadow-md shadow-emerald-950/20 cursor-pointer btn-shine"
              >
                <span className="material-symbols-outlined text-sm">{isAdmin ? 'admin_panel_settings' : 'play_circle'}</span>
                <span>{isAdmin ? 'Console' : 'Portal'}</span>
              </button>
            </div>
          ) : (
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`font-semibold text-xs sm:text-sm px-5 py-2.5 rounded-full transition-all hidden sm:flex items-center gap-2 cursor-pointer shadow-md ${
                ['v2', 'admin'].includes(activeView)
                  ? 'bg-stone-100 text-stone-800 border border-stone-300 hover:bg-stone-200'
                  : 'bg-emerald-900 hover:bg-emerald-800 text-white shadow-emerald-950/25 btn-shine'
              }`}
              onClick={() => onNavigate(['v2', 'admin'].includes(activeView) ? 'v1' : 'v2')}
            >
              <span className="material-symbols-outlined text-sm">
                {['v2', 'admin'].includes(activeView) ? 'arrow_back' : 'lock'}
              </span>
              <span>{['v2', 'admin'].includes(activeView) ? 'Back to Landing' : 'Student Login'}</span>
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
                onClick={() => scrollToSection('course-catalog')}
                className="text-left py-2.5 px-3.5 rounded-xl hover:bg-stone-50 hover:text-emerald-900 flex items-center justify-between transition-colors"
              >
                <span>Courses</span>
                <span className="material-symbols-outlined text-sm text-stone-400">chevron_right</span>
              </button>
              <button 
                onClick={() => scrollToSection('enroll-card')}
                className="text-left py-2.5 px-3.5 rounded-xl hover:bg-stone-50 hover:text-emerald-900 flex items-center justify-between transition-colors"
              >
                <span>Pricing &amp; Access</span>
                <span className="material-symbols-outlined text-sm text-stone-400">chevron_right</span>
              </button>
              <Link 
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="text-left py-2.5 px-3.5 rounded-xl hover:bg-stone-50 hover:text-emerald-900 flex items-center justify-between transition-colors text-stone-700 font-semibold"
              >
                <span>3CAPSTECH Company</span>
                <span className="material-symbols-outlined text-sm text-stone-400">chevron_right</span>
              </Link>
            </nav>

            <div className="pt-3 border-t border-stone-100 flex flex-col gap-2">
              {user ? (
                <>
                  <button
                    onClick={() => { setMobileMenuOpen(false); if (onOpenProfile) onOpenProfile(); }}
                    className="w-full bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs py-3 rounded-xl flex items-center justify-center gap-2 border border-stone-200 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm text-emerald-800">account_circle</span>
                    <span>My Profile &amp; Settings</span>
                  </button>
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
                      className="w-full bg-rose-50 text-rose-700 font-semibold text-xs py-2.5 rounded-xl hover:bg-rose-100 cursor-pointer border border-rose-200"
                    >
                      Logout
                    </button>
                  )}
                </>
              ) : (
                <button
                  onClick={() => { setMobileMenuOpen(false); onNavigate(['v2', 'admin'].includes(activeView) ? 'v1' : 'v2'); }}
                  className="w-full bg-emerald-900 text-white font-semibold text-xs py-3 rounded-xl flex items-center justify-center gap-2 shadow-md cursor-pointer btn-shine"
                >
                  <span className="material-symbols-outlined text-sm">
                    {['v2', 'admin'].includes(activeView) ? 'arrow_back' : 'lock'}
                  </span>
                  <span>{['v2', 'admin'].includes(activeView) ? 'Back to Landing' : 'Student Login'}</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
