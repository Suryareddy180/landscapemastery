import React from 'react';
import { motion } from 'framer-motion';

export default function Header({ activeView, onNavigate, logoSize = 48, user }) {
  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="w-full top-0 sticky bg-surface/85 backdrop-blur-xl border-b border-outline-variant/25 z-40 shadow-[0_4px_30px_rgba(6,78,59,0.04)]"
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center px-margin-mobile md:px-margin-desktop py-3.5">
        {/* Brand Logo & Title */}
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          onClick={() => onNavigate('v1')} 
          className="flex items-center gap-3.5 group focus:outline-none cursor-pointer"
        >
          <div className="relative rounded-full shadow-md overflow-hidden flex items-center justify-center border border-emerald-800/15 bg-stone-50 transition-transform duration-300 group-hover:scale-105">
            <img 
              src="/lm_logo.png" 
              alt="Landscape Mastery Logo" 
              style={{ height: `${logoSize || 46}px`, width: `${logoSize || 46}px` }}
              className="object-contain rounded-full transition-all duration-300"
            />
          </div>

          <span className="font-headline-md text-xl md:text-2xl font-bold tracking-tight text-primary bg-gradient-to-r from-primary via-primary-container to-surface-tint bg-clip-text text-transparent">
            Landscape Mastery
          </span>
        </motion.button>

        {/* Header Navigation Actions */}
        <div className="flex items-center gap-3">
          {activeView === 'admin' ? (
            <button
              onClick={() => onNavigate('v3')}
              className="font-body-md text-sm font-semibold px-4 py-2 rounded-xl bg-surface-container-high text-on-surface hover:bg-surface-container transition-all"
            >
              Student Portal
            </button>
          ) : (
            <button
              onClick={() => onNavigate('admin')}
              className="font-body-md text-xs font-semibold px-3 py-2 rounded-xl bg-emerald-950/10 text-emerald-900 border border-emerald-800/20 hover:bg-emerald-950/20 transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">admin_panel_settings</span>
              Admin Portal
            </button>
          )}

          <motion.button 
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={`font-body-md text-sm font-semibold focus:outline-none cursor-pointer px-5 py-2.5 rounded-xl transition-all shadow-sm ${
              activeView === 'v2'
                ? 'bg-primary-container text-on-primary shadow-primary-container/20'
                : 'btn-primary'
            }`}
            onClick={() => onNavigate(activeView === 'v2' ? 'v1' : 'v2')}
          >
            {activeView === 'v2' ? 'Back Home' : activeView === 'admin' ? 'Logout' : 'Login'}
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
}
