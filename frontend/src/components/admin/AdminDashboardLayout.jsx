import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BASE_URL } from '../../lib/api.js';

export default function AdminDashboardLayout({ 
  user, 
  activeSection, 
  setActiveSection, 
  onNavigate,
  children,
  siteSettings,
  onLogout,
  onOpenProfile
}) {
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const navItems = [
    { id: 'overview', label: 'Dashboard Overview', icon: 'dashboard', badge: null },
    { id: 'courses', label: 'Course Builder', icon: 'auto_stories', badge: 'Builder' },
    { id: 'library', label: 'Content & Media Library', icon: 'folder_open', badge: null },
    { id: 'students', label: 'Student Roster', icon: 'group', badge: null },
    { id: 'users', label: 'User & Staff Governance', icon: 'admin_panel_settings', badge: 'Access' },
    { id: 'payments', label: 'Payments & Orders', icon: 'payments', badge: 'Live' },
    { id: 'cms', label: 'Landing CMS & Logo', icon: 'web', badge: 'CMS' },
    { id: 'coupons', label: 'Coupons & Offers', icon: 'local_offer', badge: null },
    { id: 'testimonials', label: 'Testimonials & FAQs', icon: 'chat_bubble_outline', badge: null },
    { id: 'community', label: 'Community Management', icon: 'forum', badge: 'Mod' },
    { id: '3caps', label: '3CAPSTECH Configuration', icon: 'domain', badge: '3CAPS' },
    { id: 'audit', label: 'Security Audit Logs', icon: 'security', badge: 'Logs' },
    { id: 'settings', label: 'System Settings', icon: 'settings', badge: null }
  ];

  const currentNav = navItems.find(i => i.id === activeSection) || navItems[0];

  return (
    <div className="h-screen bg-stone-100/70 text-stone-800 flex overflow-hidden font-body-md">
      {/* SIDEBAR NAVIGATION (Executive Luxury Architecture Theme) */}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-72 lg:w-76 bg-white border-r border-stone-200 shadow-sm flex flex-col justify-between transition-transform duration-300 ${
        mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="flex flex-col h-full overflow-hidden">
          {/* Brand Header */}
          <div className="p-5 border-b border-stone-200/90 flex items-center justify-between bg-gradient-to-b from-stone-50/50 to-white">
            <button 
              onClick={() => onNavigate('v1')}
              className="flex items-center gap-3 text-left focus:outline-none group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-stone-50 border border-emerald-900/15 shadow-sm overflow-hidden flex items-center justify-center transition-all group-hover:scale-105 group-hover:shadow-md p-0.5">
                <img 
                  src={(siteSettings?.logoUrl && (siteSettings.logoUrl.startsWith('/media/') ? `${BASE_URL}${siteSettings.logoUrl}` : siteSettings.logoUrl)) || '/lm_logo.png'} 
                  alt="Logo" 
                  onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/lm_logo.png'; }}
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>
              <div className="min-w-0">
                <span className="font-bold text-sm tracking-tight text-stone-900 block leading-tight truncate">Landscape Mastery</span>
                <span className="text-[9.5px] uppercase font-bold text-emerald-800 tracking-wider flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  Admin Operations
                </span>
              </div>
            </button>
            <button 
              onClick={() => setMobileSidebarOpen(false)}
              className="md:hidden text-stone-400 hover:text-stone-700 p-1 rounded-lg hover:bg-stone-100 transition-colors"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          {/* User Account Info Bar */}
          <div className="px-5 py-3.5 bg-gradient-to-r from-stone-50/90 via-stone-50/40 to-emerald-50/20 border-b border-stone-200/80 flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-900 to-teal-800 text-white font-bold flex items-center justify-center text-xs shadow-sm shadow-emerald-950/20 border border-emerald-700/30">
                {user?.email?.charAt(0).toUpperCase() || 'A'}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
            </div>
            <div className="overflow-hidden flex-1 min-w-0">
              <span className="text-xs font-bold text-stone-900 block truncate" title={user?.email}>{user?.email || 'admin@landscapemastery.com'}</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[9px] font-mono font-bold text-emerald-900 bg-emerald-100/70 border border-emerald-300/80 px-2 py-0.5 rounded-md inline-block uppercase tracking-wider truncate max-w-full">
                  {user?.role === 'SUPER_ADMIN' ? 'Super Admin' : (user?.role || 'Admin')}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1 overflow-y-auto flex-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-stone-200 [&::-webkit-scrollbar-thumb]:rounded-full">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-900 text-white shadow-sm shadow-emerald-950/20 font-semibold'
                      : 'text-stone-600 hover:bg-stone-100/80 hover:text-stone-950'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`material-symbols-outlined text-[19px] flex-shrink-0 ${isActive ? 'text-white' : 'text-emerald-700'}`}>
                      {item.icon}
                    </span>
                    <span className="truncate whitespace-nowrap">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-md uppercase tracking-wider flex-shrink-0 ml-2 ${
                      isActive 
                        ? 'bg-white/20 text-white' 
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Footer Actions */}
          <div className="p-3.5 border-t border-stone-200/80 bg-stone-50/70 space-y-1.5">
            <div className="grid grid-cols-2 gap-1.5 mb-1">
              <button
                type="button"
                onClick={() => onNavigate('v3')}
                className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-[11px] font-semibold text-stone-700 bg-white hover:bg-stone-100 border border-stone-200/90 shadow-2xs transition-all cursor-pointer truncate"
                title="Open Student Portal View"
              >
                <span className="material-symbols-outlined text-sm text-stone-500">school</span>
                <span className="truncate">Portal View</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('v1')}
                className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-[11px] font-semibold text-stone-700 bg-white hover:bg-stone-100 border border-stone-200/90 shadow-2xs transition-all cursor-pointer truncate"
                title="View Live Website Landing Page"
              >
                <span className="material-symbols-outlined text-sm text-stone-500">public</span>
                <span className="truncate">Live Site</span>
              </button>
            </div>

            <a
              href="/admin"
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-stone-700 bg-white hover:bg-emerald-50 hover:text-emerald-950 hover:border-emerald-200 border border-stone-200/90 shadow-2xs transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="material-symbols-outlined text-base text-emerald-700">hub</span>
                <span className="truncate">3CAPSTECH Console</span>
              </div>
              <span className="material-symbols-outlined text-sm text-stone-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-transform flex-shrink-0">
                arrow_forward
              </span>
            </a>

            <button
              type="button"
              onClick={() => {
                if (onLogout) {
                  onLogout('/landscapemastery');
                } else if (onNavigate) {
                  onNavigate('v1');
                }
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:text-rose-700 hover:bg-rose-50/80 border border-transparent hover:border-rose-200/80 transition-all cursor-pointer"
              title="Securely log out and exit admin panel"
            >
              <span className="material-symbols-outlined text-base text-stone-400 hover:text-rose-600">logout</span>
              <span>Logout &amp; Exit</span>
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto h-full bg-stone-100/70">
        {/* ENHANCED EXECUTIVE TOP NAVBAR */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-stone-200 px-6 py-4 flex justify-between items-center gap-4 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-4 min-w-0">
            <button 
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden text-stone-600 hover:text-stone-900 p-1.5 rounded-lg border border-stone-200"
            >
              <span className="material-symbols-outlined text-xl">menu</span>
            </button>
            
            {/* Breadcrumb & Section Name */}
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <span className="text-stone-400 font-medium">Admin</span>
              <span className="text-stone-300">/</span>
              <span className="font-bold text-stone-800 flex items-center gap-1.5 bg-stone-100 px-2.5 py-1 rounded-lg border border-stone-200/60">
                <span className="material-symbols-outlined text-base text-emerald-700">{currentNav.icon}</span>
                {currentNav.label}
              </span>
            </div>

            <div className="relative hidden lg:block w-64 ml-2">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">search</span>
              <input
                type="text"
                placeholder="Search..."
                className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-9 pr-4 py-1.5 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Quick Add Menu Dropdown */}
            <div className="relative">
              <button
                onClick={() => setQuickAddOpen(!quickAddOpen)}
                className="bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm shadow-emerald-950/20 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Quick Add
              </button>

              <AnimatePresence>
                {quickAddOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute right-0 mt-2 w-56 bg-white border border-stone-200 rounded-2xl shadow-xl p-1.5 z-50 space-y-1"
                  >
                    <button
                      onClick={() => { setActiveSection('courses'); setQuickAddOpen(false); }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 hover:text-stone-900 rounded-xl flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm text-emerald-700">auto_stories</span>
                      New Course
                    </button>
                    <button
                      onClick={() => { setActiveSection('library'); setQuickAddOpen(false); }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 hover:text-stone-900 rounded-xl flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm text-teal-700">video_call</span>
                      Upload Video Masterclass
                    </button>
                    <button
                      onClick={() => { setActiveSection('library'); setQuickAddOpen(false); }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 hover:text-stone-900 rounded-xl flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm text-amber-700">picture_as_pdf</span>
                      Upload PDF Blueprint
                    </button>
                    <button
                      onClick={() => { setActiveSection('coupons'); setQuickAddOpen(false); }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 hover:text-stone-900 rounded-xl flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm text-indigo-700">local_offer</span>
                      Create Coupon Code
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Platform Status Indicator */}
            <div className="hidden sm:flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
              <div className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">Live &amp; Synced</span>
            </div>

            {/* My Profile Action Button */}
            {onOpenProfile && (
              <button
                type="button"
                onClick={onOpenProfile}
                className="bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-semibold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 border border-stone-200 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm text-emerald-800">account_circle</span>
                <span>My Profile</span>
              </button>
            )}

            {/* Logout Action Button */}
            <button
              type="button"
              onClick={() => {
                if (onLogout) {
                  onLogout('/landscapemastery');
                } else if (onNavigate) {
                  onNavigate('v1');
                }
              }}
              className="bg-stone-100 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 text-stone-700 text-xs font-semibold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 border border-stone-200 cursor-pointer shadow-2xs"
              title="Sign out of Admin Operations"
            >
              <span className="material-symbols-outlined text-sm">logout</span>
              Logout
            </button>
          </div>
        </header>

        {/* BODY AREA */}
        <main className="p-6 md:p-8 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
