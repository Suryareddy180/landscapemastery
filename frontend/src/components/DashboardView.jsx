import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DashboardView({ onNavigate }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeModule, setActiveModule] = useState(1);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(28); // percentage

  const modules = [
    { id: 1, title: "The Foundation of Space", duration: "45 mins", completed: true },
    { id: 2, title: "Hardscape & Earthwork Layouts", duration: "38 mins", completed: false },
    { id: 3, title: "Botanical Lighting & Shading", duration: "52 mins", completed: false },
    { id: 4, title: "Water Features & Modern Hydro-Design", duration: "41 mins", completed: false },
  ];

  return (
    <React.Fragment>
      {/* Sidebar: Glassmorphic Navigation Panel */}
      <aside className="w-80 h-full glass-panel flex flex-col pt-6 hidden md:flex flex-shrink-0 z-20 bg-white border-r border-stone-200 shadow-sm">
        <div className="px-6 mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-stone-50 border border-emerald-800/15 shadow-sm overflow-hidden flex items-center justify-center">
            <img 
              src="/lm_logo.png" 
              alt="Landscape Mastery Logo" 
              className="w-full h-full object-contain rounded-full"
            />
          </div>
          <div>
            <div className="font-serif text-base font-bold text-emerald-950">Master Architect</div>
            <div className="text-xs text-stone-500 flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span className="font-semibold text-emerald-800">Tier: Lifetime Access</span>
            </div>
          </div>
        </div>

        <div className="px-4 mb-3">
          <span className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider font-semibold px-2">
            Course Curriculum
          </span>
        </div>

        <nav className="flex flex-col gap-1.5 px-3 flex-grow overflow-y-auto">
          {modules.map((mod) => (
            <motion.button
              key={mod.id}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveModule(mod.id)}
              className={`w-full text-left rounded-xl px-4 py-3.5 transition-all flex items-start gap-3 cursor-pointer ${
                activeModule === mod.id
                  ? 'bg-primary-container text-on-primary shadow-md'
                  : 'text-on-surface-variant hover:bg-surface-container-high/60'
              }`}
            >
              <span className="material-symbols-outlined text-xl mt-0.5">
                {mod.completed ? 'check_circle' : activeModule === mod.id ? 'play_circle' : 'lock'}
              </span>
              <div className="flex-1 min-w-0">
                <div className={`font-body-md text-sm font-semibold truncate ${activeModule === mod.id ? 'text-white' : 'text-on-surface'}`}>
                  Module {mod.id}: {mod.title}
                </div>
                <div className={`font-label-sm text-xs mt-0.5 ${activeModule === mod.id ? 'text-on-primary-container' : 'text-on-surface-variant'}`}>
                  {mod.duration}
                </div>
              </div>
            </motion.button>
          ))}
        </nav>

        <div className="p-4 mb-4 border-t border-outline-variant/20">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate('v1')} 
            className="w-full text-on-surface-variant hover:bg-surface-container-high rounded-xl px-4 py-3 flex items-center gap-3 font-body-md text-body-md transition-colors text-left cursor-pointer"
          >
            <span className="material-symbols-outlined">logout</span>
            Exit Learning Portal
          </motion.button>
        </div>
      </aside>

      {/* Main Area: Distraction-Free Cinematic Learning Environment */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto min-w-0 bg-stone-50">
        {/* Executive Desktop & Mobile Top Bar */}
        <header className="w-full bg-white/95 backdrop-blur-md border-b border-stone-200 sticky top-0 z-30 flex justify-between items-center px-6 py-3.5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="font-bold text-xs text-stone-700 hidden sm:inline">The Landscape Mastery</span>
            <span className="text-stone-300 hidden sm:inline">/</span>
            <span className="bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-bold px-2.5 py-1 rounded-lg">
              Module {activeModule}: {modules.find(m => m.id === activeModule)?.title}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 bg-stone-100 px-3 py-1.5 rounded-xl border border-stone-200 text-xs text-stone-600 font-medium">
              <span className="material-symbols-outlined text-emerald-700 text-sm">verified_user</span>
              <span>DRM Active • Verified Stream</span>
            </div>

            <button
              onClick={() => onNavigate('v1')}
              className="bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold px-3.5 py-1.5 rounded-xl border border-stone-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Exit Portal
            </button>
          </div>
        </header>

        <div className="p-margin-mobile md:p-margin-desktop max-w-6xl mx-auto w-full flex-1 flex flex-col justify-center">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-6 flex justify-between items-end"
          >
            <div>
              <span className="bg-primary-container/10 border border-primary-container/20 text-primary-container font-label-sm text-label-sm px-3 py-1 rounded-full uppercase tracking-wider mb-2 inline-block font-semibold">
                Module {activeModule}
              </span>
              <h2 className="font-headline-lg text-3xl md:text-4xl text-on-surface font-semibold">
                {modules.find(m => m.id === activeModule)?.title}
              </h2>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs font-label-sm text-outline uppercase tracking-widest bg-surface-container-low px-3 py-1.5 rounded-lg border border-outline-variant/30">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Anti-Piracy DRM Active
            </div>
          </motion.div>

          {/* Large Cinematic Video Player */}
          <div className="w-full aspect-video bg-inverse-surface rounded-2xl overflow-hidden relative shadow-2xl group border border-surface-container-highest">
            {/* Security Overlay: Faint anti-piracy watermark pattern diagonally across video */}
            <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center overflow-hidden">
              <div className="watermark text-white/10 font-bold select-none text-center">
                LICENSED TO: ARCHITECT@EXAMPLE.COM <br />
                ID: LM-98420-AP • NON-TRANSFERABLE
              </div>
            </div>

            {/* Play Overlay Button */}
            <AnimatePresence>
              {!isPlaying && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-20"
                >
                  <motion.button 
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    onClick={() => setIsPlaying(true)}
                    className="w-24 h-24 rounded-full bg-surface-container-lowest/90 backdrop-blur-md flex items-center justify-center text-primary-container shadow-2xl border border-white/80 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-5xl ml-1" style={{ fontVariationSettings: "'FILL' 1" }}>
                      play_arrow
                    </span>
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Video Background Showcase */}
            <img 
              className="w-full h-full object-cover mix-blend-overlay opacity-60 transition-transform duration-700" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuClX9hWt0Mv1yYgVXYdtS7NjZoS9txXRlFDgeCVAqAAek2s0QErdVdxO2CVtmVZNhIzh1Z51Py_s-6FLvSLIx9ynOFKNdK3jkT2g8Elm2H8lSuHjWQgeQAII0l9U1O0WkA1_Sv7Z9uVogJZw7NilfPBiA-C1pzArayl_R4UQz6BZ490j6cMhi-rfYKFxJD79ZMsBcgXZuQqTLJpskvvp5Mv1QJtrpWcx9OcfTImFB9cBkZtdubqmE8D9Q" 
              alt="Course lesson video backdrop"
            />

            {/* Minimalist Player Control Bar */}
            <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col gap-3 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30">
              {/* Interactive Timeline Bar */}
              <div 
                className="w-full h-1.5 bg-white/20 hover:h-2.5 rounded-full cursor-pointer relative transition-all"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const newPercent = Math.round((clickX / rect.width) * 100);
                  setProgress(Math.max(0, Math.min(100, newPercent)));
                }}
              >
                <div 
                  className="absolute top-0 left-0 h-full bg-primary-fixed rounded-full transition-all" 
                  style={{ width: `${progress}%` }} 
                />
                <div 
                  className="absolute top-1/2 w-4 h-4 bg-white rounded-full transform -translate-y-1/2 -translate-x-1/2 shadow-lg scale-0 group-hover:scale-100 transition-transform" 
                  style={{ left: `${progress}%` }}
                />
              </div>

              {/* Controls Row */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="hover:text-primary-fixed transition-colors focus:outline-none cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-2xl">
                      {isPlaying ? 'pause' : 'play_arrow'}
                    </span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setIsMuted(!isMuted)}
                      className="hover:text-primary-fixed transition-colors focus:outline-none cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-xl">
                        {isMuted || volume === 0 ? 'volume_off' : 'volume_up'}
                      </span>
                    </button>
                    <input 
                      type="range" 
                      min="0" 
                      max="1" 
                      step="0.05"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => {
                        setVolume(parseFloat(e.target.value));
                        if (isMuted) setIsMuted(false);
                      }}
                      className="w-20 accent-primary-fixed h-1 bg-white/30 rounded-lg cursor-pointer"
                    />
                  </div>

                  <span className="font-label-sm text-xs tracking-wider text-white/80">
                    12:45 / 45:20
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-label-sm text-white/60 uppercase tracking-widest hidden sm:inline-block">
                    1080p HD • Encrypted
                  </span>
                  <button 
                    className="hover:text-primary-fixed transition-colors focus:outline-none cursor-pointer"
                    title="Fullscreen Toggle"
                  >
                    <span className="material-symbols-outlined text-xl">fullscreen</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bento Cards Row */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-gutter">
            <div className="glass-card p-card-padding rounded-2xl border border-white/80 shadow-lg">
              <h3 className="font-headline-md text-headline-md text-on-surface mb-3 font-semibold">Lesson Overview</h3>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                Understanding the spatial relationship between hardscape and softscape is paramount. Observe how retaining walls direct flow and establish natural sightlines.
              </p>
            </div>
            <div className="glass-card p-card-padding rounded-2xl border border-white/80 shadow-lg">
              <h3 className="font-headline-md text-headline-md text-on-surface mb-3 font-semibold">Next Up</h3>
              <div 
                onClick={() => setActiveModule(2)}
                className="flex items-center gap-4 p-3 hover:bg-surface-container-low/80 rounded-xl transition-all cursor-pointer border border-transparent hover:border-outline-variant/30"
              >
                <div className="w-20 h-14 bg-surface-container-highest rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
                  <img 
                    className="w-full h-full object-cover" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAkHh5sUpmvjRYMpkFMhtyBR9EE6FU82O0L0UODTBdTlCwDBa2AUV0RVMEaTzLHhFFj2Z5_STlN6smO2Fwst_KSYQaSWamY7tWZYxV1GDMZ_CiFgIQwuEH3h3CahBDMse8C5hhxTClhr9YCf79M7d2b84dDFy9HUk9haIZ_YGi1CtDUr64DvWRfiHH1pnzj9gMe8T-gYywZ7JfKSfhL2H9LobNMi4Koq_ocvap9UvcgByWwvuyfrS6ayQ" 
                    alt="Module 2 thumbnail"
                  />
                </div>
                <div>
                  <div className="font-body-md text-body-md font-semibold text-on-surface">Module 2: Hardscape &amp; Earthwork</div>
                  <div className="font-label-sm text-xs text-on-surface-variant mt-0.5">38 mins • Up Next</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </React.Fragment>
  );
}
