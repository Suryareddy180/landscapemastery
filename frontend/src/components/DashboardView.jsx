import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DashboardView({ onNavigate, token, user, onLogout, logoUrl }) {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [activeModuleId, setActiveModuleId] = useState(null);
  const [activeAsset, setActiveAsset] = useState(null);
  const [streamData, setStreamData] = useState(null);
  const [streamLoading, setStreamLoading] = useState(false);
  const [streamError, setStreamError] = useState(null);

  const isAdmin = user && ['SUPER_ADMIN', 'CONTENT_MANAGER', 'SUPPORT_ADMIN', 'ADMIN'].includes(user.role);

  // Video Player State
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const playerContainerRef = useRef(null);
  const lastProgressSaveRef = useRef(0);

  useEffect(() => {
    fetchCourseData();
  }, []);

  const fetchCourseData = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/public/settings/');
      if (res.ok) {
        const data = await res.json();
        if (data.courses && data.courses.length > 0) {
          setCourses(data.courses);
          const firstC = data.courses[0];
          setSelectedCourse(firstC);
          if (firstC.modules && firstC.modules.length > 0) {
            const firstM = firstC.modules[0];
            setActiveModuleId(firstM.id);
            if (firstM.lessons && firstM.lessons.length > 0 && firstM.lessons[0].assets && firstM.lessons[0].assets.length > 0) {
              selectAsset(firstM.lessons[0].assets[0]);
            }
          }
        }
      }
    } catch (e) {
      console.error('Failed to load courses:', e);
    }
  };

  const selectAsset = async (asset) => {
    setActiveAsset(asset);
    setStreamLoading(true);
    setStreamError(null);
    setIsPlaying(false);

    try {
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const res = await fetch(`http://localhost:8000/api/video/stream/${asset.id}/`, { headers });
      
      if (res.ok) {
        const sData = await res.json();
        // Resolve stream URL
        const playRes = await fetch(sData.streamUrl);
        if (playRes.ok) {
          const mediaInfo = await playRes.json();
          setStreamData({
            ...sData,
            videoUrl: mediaInfo.url,
            title: mediaInfo.title,
            watermarkText: sData.watermark || `LICENSED TO: ${user?.email?.toUpperCase() || 'STUDENT'} • ID: LM-${user?.id || 'AUTH'}`
          });

          // Fetch saved progress (BUG-009 / TC-VID-005)
          if (token) {
            const progRes = await fetch(`http://localhost:8000/api/video/progress/${asset.id}/`, { headers });
            if (progRes.ok) {
              const pData = await progRes.json();
              if (pData.last_position_sec && videoRef.current) {
                videoRef.current.currentTime = pData.last_position_sec;
                setCurrentTime(pData.last_position_sec);
              }
            }
          }
        } else {
          setStreamError('Failed to initialize playback session.');
        }
      } else {
        const errData = await res.json();
        setStreamError(errData.error || 'Access restricted. Please verify your enrollment.');
      }
    } catch (err) {
      setStreamError('Unable to connect to streaming server.');
    } finally {
      setStreamLoading(false);
    }
  };

  // Video Event Handlers & Heartbeat (BUG-009)
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    setCurrentTime(current);

    // Save progress every 10 seconds
    if (Math.abs(current - lastProgressSaveRef.current) > 10 && activeAsset && token) {
      lastProgressSaveRef.current = current;
      saveProgress(current, false);
    }
  };

  const saveProgress = async (posSec, completed = false) => {
    if (!activeAsset || !token) return;
    try {
      await fetch('http://localhost:8000/api/video/progress/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          asset_id: activeAsset.id,
          last_position_sec: Math.floor(posSec),
          watched_sec: Math.floor(posSec),
          completed: completed
        })
      });
    } catch (e) {
      // Background save error
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      saveProgress(videoRef.current.currentTime, false);
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e) => {
    if (!videoRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newTime = pos * duration;
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const dynamicWatermark = user?.email
    ? `ENROLLED STUDENT: ${user.email.toUpperCase()} • ID: LM-${user.id || 'AUTH'}`
    : 'ENROLLED STUDENT: ARCHITECT • ENCRYPTED DRM STREAM';

  return (
    <div className="flex w-full h-full bg-stone-100 text-stone-900 overflow-hidden font-body-md">
      {/* SIDEBAR CURRICULUM NAVIGATION */}
      <aside className="w-80 h-full bg-white border-r border-stone-200 flex flex-col flex-shrink-0 z-20 shadow-xs">
        {/* Brand & User Status */}
        <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white border border-stone-200 p-1 shadow-xs overflow-hidden flex items-center justify-center">
              <img 
                src={(logoUrl && (logoUrl.startsWith('/media/') ? `http://localhost:8000${logoUrl}` : logoUrl)) || '/lm_logo.png'} 
                alt="Logo" 
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/lm_logo.png'; }}
                className="w-full h-full object-contain" 
              />
            </div>
            <div>
              <div className="font-serif text-sm font-bold text-stone-900">Landscape Mastery</div>
              <div className={`text-[11px] font-semibold flex items-center gap-1.5 ${
                isAdmin ? 'text-amber-700' : 'text-emerald-700'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  isAdmin ? 'bg-amber-600 animate-pulse' : 'bg-emerald-600 animate-pulse'
                }`} />
                {isAdmin ? 'Admin Preview Mode' : 'Lifetime Enrollee'}
              </div>
            </div>
          </div>
        </div>

        {/* User Identity Chip */}
        <div className="px-5 py-2.5 bg-stone-50 border-b border-stone-200 flex items-center justify-between text-xs text-stone-600">
          <span className="truncate max-w-[170px] font-medium">{user?.email || 'Student Portal'}</span>
          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
            isAdmin 
              ? 'bg-amber-100 text-amber-800 border border-amber-300' 
              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
          }`}>
            {isAdmin ? 'ADMIN PREVIEW' : 'PAID'}
          </span>
        </div>

        {/* Modules & Lessons Accordion */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {selectedCourse?.modules && selectedCourse.modules.length > 0 ? (
            selectedCourse.modules.map((mod) => (
              <div key={mod.id} className="space-y-1">
                <button
                  onClick={() => setActiveModuleId(activeModuleId === mod.id ? null : mod.id)}
                  className="w-full text-left font-semibold text-xs text-stone-800 hover:text-emerald-900 flex justify-between items-center py-2 px-2.5 rounded-xl hover:bg-stone-100 transition-colors"
                >
                  <span className="truncate">{mod.title}</span>
                  <span className="material-symbols-outlined text-sm text-stone-400">
                    {activeModuleId === mod.id ? 'expand_less' : 'expand_more'}
                  </span>
                </button>

                {activeModuleId === mod.id && (
                  <div className="space-y-1 pl-2.5 border-l-2 border-emerald-700/30 ml-2">
                    {mod.lessons && mod.lessons.map((les) => (
                      <div key={les.id} className="space-y-1">
                        <div className="text-[11px] font-bold text-stone-500 px-2 py-1">{les.title}</div>
                        {les.assets && les.assets.map((asset) => (
                          <button
                            key={asset.id}
                            onClick={() => selectAsset(asset)}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center gap-2.5 transition-all cursor-pointer ${
                              activeAsset?.id === asset.id
                                ? 'bg-emerald-800 text-white font-semibold shadow-xs'
                                : 'text-stone-700 hover:bg-stone-100 hover:text-stone-950'
                            }`}
                          >
                            <span className={`material-symbols-outlined text-base ${
                              activeAsset?.id === asset.id ? 'text-white' : 'text-emerald-700'
                            }`}>
                              {asset.asset_type === 'pdf' ? 'picture_as_pdf' : 'play_circle'}
                            </span>
                            <span className="truncate flex-1">{asset.title}</span>
                            <span className={`text-[10px] ${
                              activeAsset?.id === asset.id ? 'text-emerald-100' : 'text-stone-400'
                            }`}>{asset.duration}</span>
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-10 px-4 text-stone-500 text-xs">
              <span className="material-symbols-outlined text-3xl text-stone-400 mb-2 block">auto_stories</span>
              No curriculum modules published yet. Use the Admin Course Builder to create modules and upload masterclasses.
            </div>
          )}
        </div>

        {/* Exit & Logout Footer */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 space-y-1.5">
          {isAdmin && (
            <button
              onClick={() => onNavigate('admin')}
              className="w-full bg-emerald-800 hover:bg-emerald-900 text-white px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-xs mb-1"
            >
              <span className="material-symbols-outlined text-base text-emerald-200">admin_panel_settings</span>
              <span>← Return to Admin Panel</span>
            </button>
          )}

          <button
            onClick={() => onNavigate('v1')}
            className="w-full text-stone-700 hover:text-stone-950 hover:bg-stone-200/70 px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm text-stone-500">home</span>
            <span>Return to Landing Page</span>
          </button>
          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full text-rose-700 hover:text-rose-800 hover:bg-rose-50 px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm text-rose-500">logout</span>
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </aside>

      {/* MAIN CINEMATIC PLAYER VIEW */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto bg-stone-50">
        {/* Top Header */}
        <header className="bg-white/95 backdrop-blur-md border-b border-stone-200 px-6 py-3.5 flex justify-between items-center z-10 sticky top-0 shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              {activeAsset?.asset_type === 'pdf' ? 'PDF Document' : 'Masterclass Stream'}
            </span>
            <span className="text-stone-400">/</span>
            <h1 className="text-xs sm:text-sm font-bold text-stone-900 truncate max-w-md">
              {activeAsset?.title || 'Select a Masterclass Lesson'}
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            {isAdmin && (
              <button
                onClick={() => onNavigate('admin')}
                className="bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs mr-2"
              >
                <span className="material-symbols-outlined text-sm text-emerald-700">admin_panel_settings</span>
                <span>Back to Admin Panel</span>
              </button>
            )}

            <span className="text-[10px] bg-emerald-50 text-emerald-900 border border-emerald-200 px-2.5 py-1 rounded-full font-bold uppercase flex items-center gap-1">
              <span className="material-symbols-outlined text-xs text-emerald-700">lock</span>
              <span>DRM Encrypted Stream</span>
            </span>
          </div>
        </header>

        {/* Video Player Container */}
        <div className="p-4 sm:p-8 max-w-5xl mx-auto w-full flex-1 flex flex-col justify-center space-y-6">
          <div 
            ref={playerContainerRef}
            className="w-full aspect-video bg-black rounded-3xl overflow-hidden relative shadow-2xl border border-stone-300 group"
          >
            {streamLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-30">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-semibold text-stone-300">Generating Secure DRM Stream...</span>
                </div>
              </div>
            )}

            {streamError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-30 p-6">
                <div className="text-center space-y-3 max-w-md">
                  <span className="material-symbols-outlined text-4xl text-rose-500">lock</span>
                  <h3 className="font-bold text-sm text-white">Stream Access Restricted</h3>
                  <p className="text-xs text-stone-400">{streamError}</p>
                </div>
              </div>
            )}

            {/* Dynamic Anti-Piracy Watermark Overlay */}
            <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center overflow-hidden">
              <div className="text-white/10 font-bold select-none text-center transform -rotate-12 tracking-widest text-xs sm:text-sm">
                {dynamicWatermark} <br />
                NON-TRANSFERABLE • ENCRYPTED SESSION
              </div>
            </div>

            {/* Genuine HTML5 Video Element */}
            {streamData?.videoUrl ? (
              <video
                ref={videoRef}
                src={streamData.videoUrl}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={() => {
                  if (videoRef.current) {
                    setDuration(videoRef.current.duration);
                    videoRef.current.volume = volume;
                  }
                }}
                onEnded={() => {
                  setIsPlaying(false);
                  saveProgress(duration, true);
                }}
                className="w-full h-full object-contain cursor-pointer"
                onClick={togglePlay}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-stone-900 text-stone-400 text-xs">
                Select an asset from the curriculum on the left.
              </div>
            )}

            {/* Custom Video Control Bar */}
            {streamData?.videoUrl && (
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30 flex flex-col gap-2.5">
                {/* Progress Bar */}
                <div 
                  onClick={handleSeek}
                  className="w-full h-1.5 hover:h-2 bg-white/20 rounded-full cursor-pointer relative transition-all"
                >
                  <div 
                    className="h-full bg-emerald-500 rounded-full relative" 
                    style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-xs text-white">
                  <div className="flex items-center gap-3">
                    <button onClick={togglePlay} className="hover:text-emerald-400 transition-colors cursor-pointer">
                      <span className="material-symbols-outlined text-2xl">
                        {isPlaying ? 'pause' : 'play_arrow'}
                      </span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button onClick={() => {
                        if (videoRef.current) {
                          videoRef.current.muted = !isMuted;
                          setIsMuted(!isMuted);
                        }
                      }} className="cursor-pointer">
                        <span className="material-symbols-outlined text-lg">
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
                          const v = parseFloat(e.target.value);
                          setVolume(v);
                          if (videoRef.current) {
                            videoRef.current.volume = v;
                            videoRef.current.muted = false;
                            setIsMuted(false);
                          }
                        }}
                        className="w-16 accent-emerald-500 h-1 bg-white/30 rounded cursor-pointer"
                      />
                    </div>

                    <span className="text-[11px] text-stone-300 font-mono">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Playback Speed Switcher */}
                    <select
                      value={playbackSpeed}
                      onChange={(e) => {
                        const spd = parseFloat(e.target.value);
                        setPlaybackSpeed(spd);
                        if (videoRef.current) videoRef.current.playbackRate = spd;
                      }}
                      className="bg-black/60 border border-stone-700 text-stone-200 text-[10px] rounded px-1.5 py-0.5 cursor-pointer"
                    >
                      <option value="0.75">0.75x</option>
                      <option value="1">1.0x</option>
                      <option value="1.25">1.25x</option>
                      <option value="1.5">1.5x</option>
                      <option value="2">2.0x</option>
                    </select>

                    <button onClick={toggleFullscreen} className="hover:text-emerald-400 transition-colors cursor-pointer">
                      <span className="material-symbols-outlined text-xl">
                        {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Lesson Overview & Blueprint Downloads Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white p-6 rounded-3xl border border-stone-200/90 shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                <span className="material-symbols-outlined text-base">architecture</span>
                <span>Spatial Framework &amp; Notes</span>
              </div>
              <h3 className="font-serif text-base font-bold text-stone-900">
                {activeAsset?.title || 'Masterclass Overview'}
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Master complete spatial transitions, microclimate orientation, topographical grading, and architectural execution.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-stone-200/90 shadow-xs space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                  <span className="material-symbols-outlined text-base">folder_zip</span>
                  <span>CAD Blueprints &amp; Toolkits</span>
                </div>
                <h3 className="font-serif text-base font-bold text-stone-900 mt-1">
                  Resource &amp; Material Specifications
                </h3>
                <p className="text-xs text-stone-600">
                  Download structural vector prints, DWG details, and elevation cross-sections.
                </p>
              </div>
              <div>
                <a
                  href="/media/Landscape_Architecture_Syllabus_2026.pdf"
                  download="Landscape_Architecture_Syllabus_2026.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs px-4 py-2.5 rounded-xl inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  <span>Download Blueprint Package (PDF)</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
