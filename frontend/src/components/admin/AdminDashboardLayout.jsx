import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminDashboardLayout({ 
  user, 
  activeSection, 
  setActiveSection, 
  onNavigate,
  children,
  siteSettings 
}) {
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const navItems = [
    { id: 'overview', label: 'Dashboard Overview', icon: 'dashboard', badge: null },
    { id: 'courses', label: 'Course Builder', icon: 'auto_stories', badge: 'Builder' },
    { id: 'library', label: 'Content & Media Library', icon: 'folder_open', badge: null },
    { id: 'students', label: 'Student Roster', icon: 'group', badge: null },
    { id: 'payments', label: 'Payments & Orders', icon: 'payments', badge: 'Live' },
    { id: 'cms', label: 'Landing CMS & Logo', icon: 'web', badge: 'CMS' },
    { id: 'coupons', label: 'Coupons & Offers', icon: 'local_offer', badge: null },
    { id: 'testimonials', label: 'Testimonials & FAQs', icon: 'chat_bubble_outline', badge: null },
    { id: 'audit', label: 'Security Audit Logs', icon: 'security', badge: 'Logs' },
    { id: 'settings', label: 'System Settings', icon: 'settings', badge: null }
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row overflow-hidden font-body-md">
      {/* SIDEBAR NAVIGATION (Desktop & Mobile) */}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-72 bg-slate-950/90 backdrop-blur-2xl border-r border-slate-800 flex flex-col justify-between transition-transform duration-300 ${
        mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div>
          {/* Brand Header */}
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 shadow-lg shadow-emerald-900/30">
                <img 
                  src={siteSettings?.logoUrl || '/lm_logo.png'} 
                  alt="Logo" 
                  style={{ height: `${Math.min(siteSettings?.logoSize || 36, 42)}px` }}
                  className="object-contain"
                />
              </div>
              <div>
                <span className="font-bold text-lg text-white block leading-tight">Landscape Mastery</span>
                <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">SaaS Admin Control</span>
              </div>
            </div>
            <button 
              onClick={() => setMobileSidebarOpen(false)}
              className="md:hidden text-slate-400 hover:text-white"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* User Role Badge */}
          <div className="px-6 py-4 bg-slate-900/60 border-b border-slate-800/60 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
              {user?.email?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="overflow-hidden">
              <span className="text-xs font-semibold text-slate-200 block truncate">{user?.email || 'admin@landscapemastery.com'}</span>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-950/60 px-2 py-0.5 rounded-full inline-block mt-0.5">
                {user?.role || 'SUPER_ADMIN'}
              </span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-220px)]">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveSection(item.id);
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                  activeSection === item.id
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-xl">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    activeSection === item.id ? 'bg-white/20 text-white' : 'bg-slate-800 text-emerald-400'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <button
            onClick={() => onNavigate('v3')}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-900 hover:text-white transition-all"
          >
            <span className="material-symbols-outlined text-lg">preview</span>
            Student Portal Preview
          </button>
          <button
            onClick={() => onNavigate('v1')}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/30 transition-all"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
            Exit Admin Portal
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto h-screen">
        {/* TOP NAVBAR */}
        <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800 px-6 py-4 flex justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden text-slate-400 hover:text-white p-2"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            
            <div className="relative hidden sm:block w-72">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
              <input
                type="text"
                placeholder="Search courses, students, media..."
                className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Add Menu Dropdown */}
            <div className="relative">
              <button
                onClick={() => setQuickAddOpen(!quickAddOpen)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Quick Add
              </button>

              <AnimatePresence>
                {quickAddOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 space-y-1"
                  >
                    <button
                      onClick={() => { setActiveSection('courses'); setQuickAddOpen(false); }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm text-emerald-400">auto_stories</span>
                      New Course
                    </button>
                    <button
                      onClick={() => { setActiveSection('library'); setQuickAddOpen(false); }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm text-teal-400">video_call</span>
                      Upload Short / Long Video
                    </button>
                    <button
                      onClick={() => { setActiveSection('library'); setQuickAddOpen(false); }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm text-amber-400">picture_as_pdf</span>
                      Upload PDF Blueprint
                    </button>
                    <button
                      onClick={() => { setActiveSection('coupons'); setQuickAddOpen(false); }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm text-indigo-400">local_offer</span>
                      Create Coupon Code
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Platform Status Indicator */}
            <div className="hidden lg:flex items-center gap-2 bg-emerald-950/60 border border-emerald-800/40 px-3 py-1.5 rounded-xl">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">Platform Live</span>
            </div>
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
