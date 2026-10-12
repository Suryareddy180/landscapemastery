import React, { useState, useEffect } from 'react';
import { BASE_URL } from '../lib/api.js';
import CourseVideoPlayer from './CourseVideoPlayer.jsx';

export default function DashboardView({ onNavigate, token, user, onLogout, logoUrl }) {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [activeModuleId, setActiveModuleId] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [playbackData, setPlaybackData] = useState(null);
  const [playbackLoading, setPlaybackLoading] = useState(false);
  const [playbackError, setPlaybackError] = useState(null);
  const [completedLessonIds, setCompletedLessonIds] = useState(new Set());
  const [enrolledCourseIds, setEnrolledCourseIds] = useState([]);

  const isAdmin = user && ['SUPER_ADMIN', 'CONTENT_MANAGER', 'SUPPORT_ADMIN', 'ADMIN'].includes(user.role);

  useEffect(() => {
    fetchCourseData();
  }, [token]);

  const fetchCourseData = async () => {
    try {
      // 1. Fetch student enrolled course IDs
      let enrolledIds = [];
      if (token && !isAdmin) {
        try {
          const enrollRes = await fetch(`${BASE_URL}/api/my/enrollments/`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (enrollRes.ok) {
            const enrollData = await enrollRes.json();
            enrolledIds = (enrollData.enrollments || []).map(e => e.id);
            setEnrolledCourseIds(enrolledIds);
          }
        } catch (e) {
          // fallback
        }
      }

      // 2. Fetch all published courses with modules & lessons
      const res = await fetch(`${BASE_URL}/api/public/settings/`);
      if (res.ok) {
        const data = await res.json();
        if (data.courses && data.courses.length > 0) {
          let visibleCourses = data.courses;
          if (!isAdmin && enrolledIds.length > 0) {
            // Priority to enrolled courses, but keep all if user has paid access
            const enrolledOnly = data.courses.filter(c => enrolledIds.includes(c.id));
            if (enrolledOnly.length > 0) {
              visibleCourses = enrolledOnly;
            }
          }

          setCourses(visibleCourses);
          const firstCourse = visibleCourses[0];
          setSelectedCourse(firstCourse);

          if (firstCourse.modules && firstCourse.modules.length > 0) {
            const firstMod = firstCourse.modules[0];
            setActiveModuleId(firstMod.id);
            if (firstMod.lessons && firstMod.lessons.length > 0) {
              selectLesson(firstMod.lessons[0], firstCourse);
            }
          }
        }
      }
    } catch (e) {
      console.error('Failed to load courses:', e);
    }
  };

  const selectLesson = async (lesson, courseOverride = null) => {
    const course = courseOverride || selectedCourse;
    if (!lesson || !course) return;

    setActiveLesson(lesson);
    setPlaybackLoading(true);
    setPlaybackError(null);
    setPlaybackData(null);

    try {
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const res = await fetch(`${BASE_URL}/api/courses/${course.id}/lessons/${lesson.id}/playback/`, {
        headers
      });
      const data = await res.json();

      if (res.ok) {
        setPlaybackData(data);
      } else {
        setPlaybackError(data);
      }
    } catch (err) {
      setPlaybackError({ error: 'Unable to connect to streaming server. Please try again.' });
    } finally {
      setPlaybackLoading(false);
    }
  };

  const handleToggleComplete = async () => {
    if (!activeLesson || !token) return;
    const isCompleted = completedLessonIds.has(activeLesson.id);

    try {
      const res = await fetch(`${BASE_URL}/api/lesson/complete/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          lesson_id: activeLesson.id,
          completed: !isCompleted
        })
      });

      if (res.ok) {
        setCompletedLessonIds(prev => {
          const next = new Set(prev);
          if (isCompleted) next.delete(activeLesson.id);
          else next.add(activeLesson.id);
          return next;
        });
      }
    } catch (e) {
      console.error('Failed to update lesson completion status:', e);
    }
  };

  // Linear lesson navigation
  const allLessons = selectedCourse?.modules?.flatMap(m => m.lessons || []) || [];
  const currentLessonIndex = allLessons.findIndex(l => l.id === activeLesson?.id);
  const prevLesson = currentLessonIndex > 0 ? allLessons[currentLessonIndex - 1] : null;
  const nextLesson = currentLessonIndex >= 0 && currentLessonIndex < allLessons.length - 1 ? allLessons[currentLessonIndex + 1] : null;

  const isUserEnrolledInCurrentCourse = isAdmin || user?.paid || (selectedCourse && enrolledCourseIds.includes(selectedCourse.id));

  return (
    <div className="flex w-full h-full bg-stone-100 text-stone-900 overflow-hidden font-body-md">
      {/* SIDEBAR CURRICULUM NAVIGATION */}
      <aside className="w-80 h-full bg-white border-r border-stone-200 flex flex-col flex-shrink-0 z-20 shadow-xs">
        {/* Brand & Portal Header */}
        <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-white border border-stone-200 p-1 shadow-xs overflow-hidden flex items-center justify-center">
              <img
                src={(logoUrl && (logoUrl.startsWith('/media/') ? `${BASE_URL}${logoUrl}` : logoUrl)) || '/lm_logo.png'}
                alt="Logo"
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/lm_logo.png'; }}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="font-serif text-xs font-bold text-stone-900">Landscape Mastery</div>
              <div className={`text-[10px] font-semibold flex items-center gap-1.5 ${
                isAdmin ? 'text-amber-700' : 'text-emerald-700'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  isAdmin ? 'bg-amber-600 animate-pulse' : 'bg-emerald-600 animate-pulse'
                }`} />
                {isAdmin ? 'Super Admin Mode' : isUserEnrolledInCurrentCourse ? 'Enrolled Student' : 'Free Preview Mode'}
              </div>
            </div>
          </div>
        </div>

        {/* User Identity Chip */}
        <div className="px-4 py-2 bg-stone-50 border-b border-stone-200 flex items-center justify-between text-xs text-stone-600">
          <span className="truncate max-w-[170px] font-medium">{user?.email || 'Guest Explorer'}</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            isAdmin
              ? 'bg-amber-100 text-amber-800 border border-amber-300'
              : isUserEnrolledInCurrentCourse
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              : 'bg-stone-200 text-stone-700'
          }`}>
            {isAdmin ? 'ADMIN' : isUserEnrolledInCurrentCourse ? 'PAID' : 'EXPLORE'}
          </span>
        </div>

        {/* Course Switcher */}
        {courses.length > 1 ? (
          <div className="p-3 mx-3 mt-3 bg-stone-50 rounded-xl border border-stone-200/90 space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center justify-between">
              <span>Current Course</span>
              <span className="text-stone-400 font-normal">{courses.length} courses</span>
            </label>
            <div className="flex items-center gap-2">
              <div className="w-10 h-8 rounded-lg overflow-hidden bg-stone-800 flex-shrink-0 border border-stone-200 shadow-2xs">
                <img
                  src={(selectedCourse?.thumbnail && (selectedCourse.thumbnail.startsWith('/media/') ? `${BASE_URL}${selectedCourse.thumbnail}` : selectedCourse.thumbnail)) || '/course_thumb_landscape.jpg'}
                  alt=""
                  onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/course_thumb_landscape.jpg'; }}
                  className="w-full h-full object-cover"
                />
              </div>
              <select
                value={selectedCourse?.id || ''}
                onChange={(e) => {
                  const target = courses.find(c => String(c.id) === e.target.value);
                  if (target) {
                    setSelectedCourse(target);
                    if (target.modules && target.modules.length > 0) {
                      setActiveModuleId(target.modules[0].id);
                      if (target.modules[0].lessons && target.modules[0].lessons.length > 0) {
                        selectLesson(target.modules[0].lessons[0], target);
                      }
                    }
                  }
                }}
                className="flex-1 bg-white border border-stone-300 rounded-lg text-xs font-semibold text-stone-800 px-2 py-1.5 focus:outline-none focus:border-emerald-600 truncate"
              >
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
          </div>
        ) : selectedCourse ? (
          <div className="p-3 mx-3 mt-3 bg-stone-50 rounded-xl border border-stone-200/90 flex items-center gap-2.5">
            <div className="w-12 h-9 rounded-lg overflow-hidden bg-stone-800 flex-shrink-0 border border-stone-200 shadow-2xs">
              <img
                src={(selectedCourse.thumbnail && (selectedCourse.thumbnail.startsWith('/media/') ? `${BASE_URL}${selectedCourse.thumbnail}` : selectedCourse.thumbnail)) || '/course_thumb_landscape.jpg'}
                alt=""
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/course_thumb_landscape.jpg'; }}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">Course Curriculum</span>
              <span className="font-bold text-xs text-stone-900 truncate block">{selectedCourse.title}</span>
            </div>
          </div>
        ) : null}

        {/* Curriculum Modules & Lessons Accordion */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {selectedCourse?.modules && selectedCourse.modules.length > 0 ? (
            selectedCourse.modules.map((mod) => (
              <div key={mod.id} className="space-y-1">
                <button
                  type="button"
                  onClick={() => setActiveModuleId(activeModuleId === mod.id ? null : mod.id)}
                  className="w-full text-left font-bold text-xs text-stone-800 hover:text-emerald-900 flex justify-between items-center py-2 px-2.5 rounded-xl hover:bg-stone-100 transition-colors"
                >
                  <span className="truncate">{mod.title}</span>
                  <span className="material-symbols-outlined text-sm text-stone-400">
                    {activeModuleId === mod.id ? 'expand_less' : 'expand_more'}
                  </span>
                </button>

                {activeModuleId === mod.id && (
                  <div className="space-y-1 pl-2 border-l-2 border-emerald-700/30 ml-2">
                    {mod.lessons && mod.lessons.map((les) => {
                      const isSelected = activeLesson?.id === les.id;
                      const isCompleted = completedLessonIds.has(les.id);
                      const isLocked = !isUserEnrolledInCurrentCourse && !les.is_free_preview;

                      return (
                        <div key={les.id} className="space-y-1">
                          <button
                            type="button"
                            onClick={() => selectLesson(les)}
                            className={`w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-800 text-white font-semibold shadow-xs'
                                : 'text-stone-700 hover:bg-stone-100 hover:text-stone-950'
                            }`}
                          >
                            {/* Icon: Completed / Locked / Play */}
                            <span className={`material-symbols-outlined text-sm flex-shrink-0 ${
                              isSelected
                                ? 'text-white'
                                : isCompleted
                                ? 'text-emerald-600'
                                : isLocked
                                ? 'text-amber-500'
                                : 'text-emerald-700'
                            }`}>
                              {isCompleted
                                ? 'check_circle'
                                : isLocked
                                ? 'lock'
                                : 'play_circle'}
                            </span>

                            {/* Title */}
                            <span className="truncate flex-1 font-medium">{les.title}</span>

                            {/* Free Preview Pill */}
                            {les.is_free_preview && (
                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase ${
                                isSelected ? 'bg-emerald-700 text-emerald-100' : 'bg-blue-100 text-blue-800'
                              }`}>
                                Preview
                              </span>
                            )}

                            {/* Duration */}
                            {les.duration && (
                              <span className={`text-[10px] flex-shrink-0 ${
                                isSelected ? 'text-emerald-100' : 'text-stone-400'
                              }`}>
                                {les.duration}
                              </span>
                            )}
                          </button>

                          {/* Secondary attached files (e.g. PDF Blueprints) */}
                          {les.assets && les.assets.filter(a => a.asset_type === 'pdf').map(asset => (
                            <a
                              key={asset.id}
                              href={asset.url || '/media/Landscape_Architecture_Syllabus_2026.pdf'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full text-left pl-6 pr-2 py-1 text-[11px] text-stone-500 hover:text-emerald-800 flex items-center gap-1.5 transition-colors"
                            >
                              <span className="material-symbols-outlined text-xs text-rose-500">picture_as_pdf</span>
                              <span className="truncate flex-1">{asset.title}</span>
                            </a>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-10 px-4 text-stone-500 text-xs">
              <span className="material-symbols-outlined text-3xl text-stone-400 mb-2 block">auto_stories</span>
              No curriculum modules published yet for this course.
            </div>
          )}
        </div>

        {/* Exit & Sign Out Footer */}
        <div className="p-3 border-t border-stone-200 bg-stone-50 space-y-1">
          {isAdmin && (
            <button
              type="button"
              onClick={() => onNavigate('admin')}
              className="w-full bg-emerald-800 hover:bg-emerald-900 text-white px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-xs mb-1"
            >
              <span className="material-symbols-outlined text-base text-emerald-200">admin_panel_settings</span>
              <span>← Return to Admin Panel</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onNavigate('v1')}
            className="w-full text-stone-700 hover:text-stone-950 hover:bg-stone-200/70 px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm text-stone-500">home</span>
            <span>Return to Landing Page</span>
          </button>

          {onLogout && (
            <button
              type="button"
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
              {playbackData?.is_free_preview ? 'Free Preview' : 'Curriculum Masterclass'}
            </span>
            <span className="text-stone-400">/</span>
            <h1 className="text-xs sm:text-sm font-bold text-stone-900 truncate max-w-md">
              {activeLesson?.title || 'Select a Masterclass Lesson'}
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            {isAdmin && (
              <button
                type="button"
                onClick={() => onNavigate('admin')}
                className="bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs mr-2"
              >
                <span className="material-symbols-outlined text-sm text-emerald-700">admin_panel_settings</span>
                <span>Admin Console</span>
              </button>
            )}

            <span className="text-[10px] bg-emerald-50 text-emerald-900 border border-emerald-200 px-2.5 py-1 rounded-full font-bold uppercase flex items-center gap-1">
              <span className="material-symbols-outlined text-xs text-emerald-700">lock</span>
              <span>VEED Secure Player</span>
            </span>
          </div>
        </header>

        {/* Video Player & Curriculum Content Area */}
        <div className="p-4 sm:p-8 max-w-5xl mx-auto w-full flex-1 flex flex-col justify-start space-y-6">
          {/* Reusable React Video Player Component */}
          <CourseVideoPlayer
            playbackData={playbackData}
            isLoading={playbackLoading}
            error={playbackError}
            onRetry={() => selectLesson(activeLesson)}
            onPurchaseClick={() => onNavigate('v1')}
          />

          {/* Navigation Controls & Lesson Status Bar */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {/* Previous Lesson Button */}
              <button
                type="button"
                disabled={!prevLesson}
                onClick={() => prevLesson && selectLesson(prevLesson)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold border border-stone-200 text-stone-700 hover:bg-stone-100 disabled:opacity-40 disabled:hover:bg-transparent flex items-center gap-1 cursor-pointer transition-all"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                <span>Previous Lesson</span>
              </button>

              {/* Next Lesson Button */}
              <button
                type="button"
                disabled={!nextLesson}
                onClick={() => nextLesson && selectLesson(nextLesson)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold border border-stone-200 text-stone-700 hover:bg-stone-100 disabled:opacity-40 disabled:hover:bg-transparent flex items-center gap-1 cursor-pointer transition-all"
              >
                <span>Next Lesson</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>

            {/* Mark as Completed Toggle */}
            {activeLesson && token && (
              <button
                type="button"
                onClick={handleToggleComplete}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer ${
                  completedLessonIds.has(activeLesson.id)
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : 'bg-emerald-800 hover:bg-emerald-900 text-white'
                }`}
              >
                <span className="material-symbols-outlined text-base">
                  {completedLessonIds.has(activeLesson.id) ? 'check_circle' : 'radio_button_unchecked'}
                </span>
                <span>
                  {completedLessonIds.has(activeLesson.id) ? 'Lesson Completed' : 'Mark as Completed'}
                </span>
              </button>
            )}
          </div>

          {/* Lesson Overview & Blueprint Downloads Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white p-6 rounded-3xl border border-stone-200/90 shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                <span className="material-symbols-outlined text-base">architecture</span>
                <span>Architectural Framework &amp; Synopsis</span>
              </div>
              <h3 className="font-serif text-base font-bold text-stone-900">
                {activeLesson?.title || 'Masterclass Overview'}
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed whitespace-pre-line">
                {activeLesson?.description ||
                  'Master spatial topography, topographical grading, site ecology, and vegetative integration across architectural masterclass modules.'}
              </p>
              {activeLesson?.duration && (
                <div className="text-[11px] text-stone-400 font-mono pt-1">
                  Duration: {activeLesson.duration}
                </div>
              )}
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
                  Download structural vector prints, DWG blueprints, and grading cross-sections.
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
