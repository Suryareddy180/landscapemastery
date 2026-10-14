import React, { useState, useEffect, useRef } from 'react';

/**
 * Validates that the embed URL strictly matches allowed VEED domains and embed path
 * to prevent arbitrary third-party iframe injection.
 */
export const isValidVeedEmbedUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const isVeedHost = host === 'www.veed.io' || host === 'veed.io';
    const isEmbedPath = parsed.pathname.startsWith('/embed/');
    return isVeedHost && isEmbedPath;
  } catch {
    return false;
  }
};

/**
 * Strips sharing options, watermark links, and titles from VEED embed URLs
 * to secure proprietary course content and remove third-party branding tags.
 */
export const sanitizeVeedEmbedUrl = (url) => {
  if (!url || typeof url !== 'string') return url;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if ((host === 'www.veed.io' || host === 'veed.io') && parsed.pathname.startsWith('/embed/')) {
      parsed.searchParams.set('watermark', '0');
      parsed.searchParams.set('sharing', '0');
      parsed.searchParams.set('title', '0');
      if (!parsed.searchParams.has('color') || !parsed.searchParams.get('color')) {
        parsed.searchParams.set('color', '10b981');
      }
      return parsed.toString();
    }
    return url;
  } catch {
    return url;
  }
};

export default function CourseVideoPlayer({
  playbackData,
  isLoading = false,
  error = null,
  onRetry = null,
  onPurchaseClick = null,
  onVideoComplete = null,
  isCompleted = false,
  className = ''
}) {
  const containerRef = useRef(null);
  const videoElementRef = useRef(null);
  const maxTimeWatchedRef = useRef(0);
  const completionReportedRef = useRef(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [loadTimedOut, setLoadTimedOut] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Reset tracking state whenever active video/lesson changes
  useEffect(() => {
    setIframeLoaded(false);
    setLoadTimedOut(false);
    maxTimeWatchedRef.current = 0;
    completionReportedRef.current = false;

    // Timeout fallback: if VEED iframe doesn't fire onLoad within 15 seconds, don't keep spinner forever
    const timer = setTimeout(() => {
      setLoadTimedOut(true);
    }, 15000);

    return () => clearTimeout(timer);
  }, [playbackData?.lesson_id, playbackData?.embed_url, playbackData?.video_id]);

  // Listen for iframe completion events (e.g., VEED or embedded HTML5 video players)
  useEffect(() => {
    const handleMessage = (e) => {
      try {
        let msg = e.data;
        if (typeof msg === 'string') {
          try { msg = JSON.parse(msg); } catch { /* ignore non-JSON */ }
        }
        if (!msg) return;

        const eventName = (msg.event || msg.type || msg.action || msg.status || '').toString().toLowerCase();
        if (['ended', 'complete', 'finish', 'video_ended', 'completed'].includes(eventName)) {
          if (!completionReportedRef.current) {
            completionReportedRef.current = true;
            onVideoComplete?.(playbackData?.lesson_id);
          }
        }

        // Time updates from player
        if (msg.currentTime !== undefined && msg.duration !== undefined) {
          const curr = Number(msg.currentTime);
          const dur = Number(msg.duration);
          if (dur > 0 && (curr >= dur * 0.95 || curr >= dur - 2)) {
            if (!completionReportedRef.current) {
              completionReportedRef.current = true;
              onVideoComplete?.(playbackData?.lesson_id);
            }
          }
        }
      } catch {
        // safe ignore
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [playbackData?.lesson_id, onVideoComplete]);

  // Direct video element handlers (disallow skipping forward)
  const handleVideoTimeUpdate = (e) => {
    const video = e.target;
    if (!video) return;

    if (video.currentTime > maxTimeWatchedRef.current) {
      maxTimeWatchedRef.current = video.currentTime;
    }

    if (video.duration && video.duration > 0) {
      if (video.currentTime >= video.duration * 0.95 || video.currentTime >= video.duration - 2) {
        if (!completionReportedRef.current) {
          completionReportedRef.current = true;
          onVideoComplete?.(playbackData?.lesson_id);
        }
      }
    }
  };

  const handleVideoSeeking = (e) => {
    const video = e.target;
    if (!video) return;
    // Disallow seeking forward past the furthest point watched
    if (video.currentTime > maxTimeWatchedRef.current + 1.5) {
      video.currentTime = maxTimeWatchedRef.current;
    }
  };

  const handleVideoEnded = () => {
    if (!completionReportedRef.current) {
      completionReportedRef.current = true;
      onVideoComplete?.(playbackData?.lesson_id);
    }
  };

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const rawEmbedUrl = playbackData?.embed_url || '';
  const isVeed = (playbackData?.video_provider || 'veed').toLowerCase() === 'veed';
  const embedUrl = isVeed ? sanitizeVeedEmbedUrl(rawEmbedUrl) : rawEmbedUrl;
  const isApprovedUrl = isValidVeedEmbedUrl(embedUrl);
  const isFreePreview = !!playbackData?.is_free_preview;
  const watermarkText = playbackData?.watermark || '';

  return (
    <div
      ref={containerRef}
      className={`relative w-full aspect-video bg-stone-950 rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl border border-stone-800 flex items-center justify-center select-none group ${className}`}
    >
      {/* 1. LOADING STATE */}
      {isLoading && (
        <div className="absolute inset-0 bg-stone-950/90 backdrop-blur-xs flex flex-col items-center justify-center z-30 p-6">
          <div className="w-12 h-12 border-3 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4" />
          <span className="text-xs uppercase tracking-widest font-mono text-stone-300 font-semibold">
            Authorizing Secure Video Stream...
          </span>
          <span className="text-[11px] text-stone-500 mt-1">Verifying enrollment credentials with server</span>
        </div>
      )}

      {/* 2. ERROR / LOCKED / UNAUTHORIZED STATE */}
      {!isLoading && error && (
        <div className="absolute inset-0 bg-gradient-to-b from-stone-950/95 via-stone-900/95 to-black/95 flex flex-col items-center justify-center z-30 p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4 text-amber-400">
            <span className="material-symbols-outlined text-3xl">
              {error.locked || error.requires_auth ? 'lock' : 'error'}
            </span>
          </div>

          <h3 className="text-base md:text-lg font-bold text-white mb-2">
            {error.locked ? 'Premium Lesson Locked' : 'Playback Unavailable'}
          </h3>

          <p className="text-xs md:text-sm text-stone-400 max-w-md mb-6 leading-relaxed">
            {error.error || (typeof error === 'string' ? error : 'Access restricted. Please verify your course enrollment.')}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {error.locked && onPurchaseClick && (
              <button
                type="button"
                onClick={onPurchaseClick}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">shopping_cart</span>
                <span>Unlock Full Course</span>
              </button>
            )}

            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold px-4 py-2.5 rounded-xl border border-stone-700 transition-all cursor-pointer"
              >
                Retry Playback
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. INVALID / UNAPPROVED URL STATE */}
      {!isLoading && !error && embedUrl && isVeed && !isApprovedUrl && (
        <div className="absolute inset-0 bg-stone-950 flex flex-col items-center justify-center z-25 p-6 text-center">
          <span className="material-symbols-outlined text-rose-500 text-4xl mb-3">gpp_maybe</span>
          <h4 className="text-sm font-bold text-white mb-1">Untrusted Video Source Blocked</h4>
          <p className="text-xs text-stone-400 max-w-md">
            For security reasons, videos must be hosted directly on <b>veed.io</b>. Arbitrary third-party links and unverified embed paths are blocked.
          </p>
        </div>
      )}

      {/* 4. NO VIDEO SOURCE CONFIGURED */}
      {!isLoading && !error && !embedUrl && (
        <div className="flex flex-col items-center justify-center p-8 text-center text-stone-500">
          <span className="material-symbols-outlined text-4xl text-stone-600 mb-2">smart_display</span>
          <span className="text-xs font-semibold text-stone-400">No video reference attached to this lesson</span>
          <span className="text-[11px] text-stone-600 mt-1">Super Admin can attach a VEED embed code in Course Builder</span>
        </div>
      )}

      {/* 5. VEED IFRAME STREAM PLAYER */}
      {!error && embedUrl && isApprovedUrl && (
        <>
          {/* Iframe Loading Spinner until loaded */}
          {!iframeLoaded && !loadTimedOut && (
            <div className="absolute inset-0 bg-stone-950 flex flex-col items-center justify-center z-15">
              <div className="w-10 h-10 border-3 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-3" />
              <span className="text-xs text-stone-400 font-mono">Loading VEED Video Player...</span>
            </div>
          )}

          <iframe
            key={embedUrl}
            src={embedUrl}
            title={playbackData?.title || 'Lesson Video Player'}
            className="w-full h-full border-0 absolute inset-0 z-10"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            onLoad={() => setIframeLoaded(true)}
          />

          {/* Dynamic Anti-Piracy Watermark Overlay (deterrence against screen capture) */}
          {watermarkText && (
            <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center overflow-hidden">
              <div className="text-white/8 font-mono font-bold select-none text-center transform -rotate-12 tracking-widest text-[10px] md:text-xs">
                {watermarkText}
                <br />
                LICENSED STREAM • NON-TRANSFERABLE
              </div>
            </div>
          )}

          {/* Top Controls Bar: Free Preview Badge & Fullscreen */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {isFreePreview ? (
              <span className="bg-emerald-500/90 backdrop-blur-xs text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md pointer-events-auto flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">visibility</span>
                <span>Free Preview</span>
              </span>
            ) : <span />}

            <button
              type="button"
              onClick={toggleFullscreen}
              className="bg-black/60 hover:bg-black/90 backdrop-blur-xs text-stone-200 hover:text-white p-2 rounded-xl transition-all shadow-md pointer-events-auto cursor-pointer flex items-center justify-center"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              <span className="material-symbols-outlined text-sm">
                {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
              </span>
            </button>
          </div>
        </>
      )}

      {/* 6. DIRECT FILE / MEDIA ASSET FALLBACK (BACKWARD COMPATIBILITY) */}
      {!error && embedUrl && !isVeed && !isApprovedUrl && (
        <video
          ref={videoElementRef}
          src={embedUrl}
          controls
          onTimeUpdate={handleVideoTimeUpdate}
          onSeeking={handleVideoSeeking}
          onEnded={handleVideoEnded}
          className="w-full h-full object-contain"
          controlsList="nodownload noplaybackrate"
          disablePictureInPicture
        />
      )}

    </div>
  );
}
