import React, { useState, useEffect } from 'react';
import { BASE_URL } from '../lib/api.js';
import CourseVideoPlayer from './CourseVideoPlayer.jsx';

export default function DashboardView({ onNavigate, token, user, onLogout, logoUrl }) {
  // Navigation State: null = Photo 1 (Active Courses), Object = Photo 2 (Course Learning Workspace)
  const [selectedCourse, setSelectedCourse] = useState(null);

  // Photo 1 States (Active / Archived Courses List)
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'archived'
  const [searchQuery, setSearchQuery] = useState('');
  const [coursesData, setCoursesData] = useState({ active: [], archived: [] });
  const [loading, setLoading] = useState(true);

  // Photo 2 States (Curriculum & Video Player)
  const [curriculum, setCurriculum] = useState(null);
  const [activeModuleId, setActiveModuleId] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [playbackData, setPlaybackData] = useState(null);
  const [playbackLoading, setPlaybackLoading] = useState(false);
  const [playbackError, setPlaybackError] = useState(null);
  const [completedLessonIds, setCompletedLessonIds] = useState(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const isAdmin = user && ['SUPER_ADMIN', 'CONTENT_MANAGER', 'SUPPORT_ADMIN', 'ADMIN'].includes(user.role);

  useEffect(() => {
    fetchEnrolledCourses();
  }, [token]);

  // --- Fetch Enrolled Courses for Photo 1 ---
  const fetchEnrolledCourses = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/my/enrollments/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        // Fallback to enrollments array if active/archived are not segregated
        const activeList = data.active || data.enrollments || [];
        const archivedList = data.archived || [];
        setCoursesData({ active: activeList, archived: archivedList });
      } else {
        // Fallback: load public courses if student has not bought yet or guest
        const pubRes = await fetch(`${BASE_URL}/api/public/courses/`);
        if (pubRes.ok) {
          const pubData = await pubRes.json();
          const mapped = (pubData.courses || []).map((c) => ({
            ...c,
            instructor_name: c.instructor_name || '',
            progress_percent: 0,
            status: 'ACTIVE'
          }));
          setCoursesData({ active: mapped, archived: [] });
        }
      }
    } catch (err) {
      console.error('Error fetching enrolled courses:', err);
    } finally {
      setLoading(false);
    }
  };

  // --- Select Course: Transition from Photo 1 to Photo 2 ---
  const handleOpenCourse = async (course) => {
    setSelectedCourse(course);
    setPlaybackLoading(true);
    setPlaybackError(null);
    setPlaybackData(null);

    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${BASE_URL}/api/courses/${course.id}/curriculum/`, {
        headers
      });

      if (res.ok) {
        const data = await res.json();
        setCurriculum(data);

        // Extract completed lessons from curriculum
        const completedIds = new Set();
        data.modules?.forEach((m) => {
          m.lessons?.forEach((l) => {
            if (l.is_completed) completedIds.add(l.id);
          });
        });
        setCompletedLessonIds(completedIds);

        // Auto-select first module and first lesson
        if (data.modules && data.modules.length > 0) {
          const firstMod = data.modules[0];
          setActiveModuleId(firstMod.id);
          const firstLesson = firstMod.lessons?.[0];
          if (firstLesson) {
            handleSelectLesson(firstLesson, course.id);
          }
        }
      } else {
        setPlaybackError({ error: 'Unable to load course modules. Please contact support.' });
      }
    } catch (err) {
      console.error('Error loading course curriculum:', err);
      setPlaybackError({ error: 'Network error loading curriculum.' });
    } finally {
      setPlaybackLoading(false);
    }
  };

  // --- Select Lesson in Photo 2 ---
  const handleSelectLesson = async (lesson, courseIdOverride = null) => {
    const courseId = courseIdOverride || selectedCourse?.id;
    if (!lesson || !courseId) return;

    setActiveLesson(lesson);
    setPlaybackLoading(true);
    setPlaybackError(null);
    setPlaybackData(null);

    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${BASE_URL}/api/courses/${courseId}/lessons/${lesson.id}/playback/`, {
        headers
      });
      const data = await res.json();

      if (res.ok) {
        setPlaybackData(data);
      } else {
        setPlaybackError(data);
      }
    } catch (err) {
      console.error('Error fetching lesson playback:', err);
      setPlaybackError({ error: 'Unable to load video stream. Please try again.' });
    } finally {
      setPlaybackLoading(false);
    }
  };

  // --- Toggle Lesson Completion (Updates checkmark & live recalculates %) ---
  const handleToggleComplete = async (lessonId) => {
    if (!token) return;
    const isCompleted = completedLessonIds.has(lessonId);

    try {
      const res = await fetch(`${BASE_URL}/api/lesson/complete/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ lesson_id: lessonId, completed: !isCompleted })
      });

      if (res.ok) {
        setCompletedLessonIds((prev) => {
          const updated = new Set(prev);
          if (isCompleted) updated.delete(lessonId);
          else updated.add(lessonId);
          return updated;
        });

        // Also update the enrolled course card progress percentage in state
        if (selectedCourse && allLessons.length > 0) {
          const newCompletedCount = isCompleted
            ? Math.max(0, completedLessonIds.size - 1)
            : completedLessonIds.size + 1;
          const newPct = Math.round((newCompletedCount / allLessons.length) * 100);
          setSelectedCourse((prev) => (prev ? { ...prev, progress_percent: newPct } : null));
          setCoursesData((prev) => ({
            ...prev,
            active: (prev.active || []).map((c) =>
              c.id === selectedCourse.id ? { ...c, progress_percent: newPct } : c
            )
          }));
        }
      }
    } catch (e) {
      console.error('Failed to toggle completion:', e);
    }
  };

  // Linear Navigation (Previous / Next Lessons)
  const allLessons = curriculum?.modules?.flatMap((m) => m.lessons || []) || [];
  const currentIndex = allLessons.findIndex((l) => l.id === activeLesson?.id);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  // Filter courses for Photo 1 based on active tab and search query
  const currentTabCourses = coursesData[activeTab] || [];
  const filteredCourses = currentTabCourses.filter((c) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      (c.title && c.title.toLowerCase().includes(query)) ||
      (c.instructor_name && c.instructor_name.toLowerCase().includes(query)) ||
      (c.short_desc && c.short_desc.toLowerCase().includes(query))
    );
  });

  // Calculate live completion percentage for Photo 2
  const liveCompletedPercent = allLessons.length > 0
    ? Math.round((completedLessonIds.size / allLessons.length) * 100)
    : selectedCourse?.progress_percent || 0;

  return (
    <div className="flex w-full h-screen bg-[#F8F9FA] overflow-hidden text-stone-900 font-sans select-none">

      {/* ============================================================== */}
      {/* 1. PERSISTENT LEFT APP RAIL (Matching Photo 1)                 */}
      {/* ============================================================== */}
      <aside className="w-16 h-full bg-white border-r border-stone-200 flex flex-col items-center justify-between py-4 flex-shrink-0 z-30 shadow-2xs">
        <div className="flex flex-col items-center gap-5 w-full">
          {/* LMS Brand Logo */}
          <button
            onClick={() => setSelectedCourse(null)}
            title="My Courses Dashboard"
            className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center p-1 hover:opacity-85 transition-opacity"
          >
            <img
              src={logoUrl || '/lm_logo.png'}
              alt="Logo"
              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/lm_logo.png'; }}
              className="w-full h-full object-contain"
            />
          </button>

          {/* Book / My Courses (Active in Photo 1) */}
          <button
            onClick={() => setSelectedCourse(null)}
            title="Active Courses"
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              !selectedCourse
                ? 'bg-blue-50 text-blue-600 font-bold shadow-2xs'
                : 'text-stone-400 hover:text-stone-700 hover:bg-stone-50'
            }`}
          >
            <span className="material-symbols-outlined text-xl">menu_book</span>
          </button>

          {/* Practice / Quizzes Icon */}
          <button
            title="Practice & Assignments"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-50 transition-colors"
          >
            <span className="material-symbols-outlined text-xl">shuffle</span>
          </button>

          {/* Bookmarks Icon */}
          <button
            title="Saved Notes & Bookmarks"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-50 transition-colors"
          >
            <span className="material-symbols-outlined text-xl">bookmark_border</span>
          </button>

          {/* Community Chat Icon */}
          <button
            title="Course Community"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-50 transition-colors"
          >
            <span className="material-symbols-outlined text-xl">chat_bubble_outline</span>
          </button>
        </div>

        {/* Bottom Actions: Storefront & User Profile */}
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={() => onNavigate('v1')}
            title="Browse All Courses"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-50 transition-colors"
          >
            <span className="material-symbols-outlined text-xl">storefront</span>
          </button>

          {/* Student Profile Avatar */}
          <button
            onClick={onLogout}
            title={`${user?.email || 'Student'} (Click to Logout)`}
            className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shadow-xs hover:ring-2 hover:ring-emerald-400 transition-all"
          >
            {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'S'}
          </button>
        </div>
      </aside>

      {/* ============================================================== */}
      {/* 2. DYNAMIC WORKSPACE (PHOTO 1 vs PHOTO 2)                      */}
      {/* ============================================================== */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">

        {/* ------------------------------------------------------------ */}
        {/* VIEW 1: ACTIVE COURSES DASHBOARD (PHOTO 1)                   */}
        {/* ------------------------------------------------------------ */}
        {!selectedCourse ? (
          <div className="flex-1 flex flex-col h-full overflow-y-auto px-6 md:px-12 py-8 bg-[#FAFAFA] relative">
            
            {/* Header: Active Courses */}
            <h1 className="text-2xl font-bold text-stone-900 mb-6 tracking-tight">Active Courses</h1>

            {/* Filter Tabs: Active | Archived */}
            <div className="flex items-center gap-8 border-b border-stone-200 mb-6">
              <button
                onClick={() => setActiveTab('active')}
                className={`pb-3 font-semibold text-sm transition-all relative ${
                  activeTab === 'active' ? 'text-stone-900 font-bold' : 'text-stone-400 hover:text-stone-600'
                }`}
              >
                Active
                {activeTab === 'active' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-full" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('archived')}
                className={`pb-3 font-semibold text-sm transition-all relative ${
                  activeTab === 'archived' ? 'text-stone-900 font-bold' : 'text-stone-400 hover:text-stone-600'
                }`}
              >
                Archived
                {activeTab === 'archived' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-full" />
                )}
              </button>
            </div>

            {/* Search Input Bar */}
            <div className="relative mb-8 max-w-4xl">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for a chapter, course or package"
                className="w-full bg-white border border-stone-200 rounded-lg px-4 py-3 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-amber-500 pr-12 shadow-2xs"
              />
              <span className="material-symbols-outlined absolute right-4 top-3.5 text-stone-400 pointer-events-none">
                search
              </span>
            </div>

            {/* Enrolled Courses Grid */}
            {loading ? (
              <div className="flex items-center gap-3 py-12 text-stone-400 font-medium">
                <div className="w-5 h-5 border-2 border-stone-300 border-t-amber-500 rounded-full animate-spin" />
                <span>Loading your courses...</span>
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center max-w-md mx-auto my-8">
                <span className="material-symbols-outlined text-5xl text-stone-300 mb-3 block">school</span>
                <h3 className="font-bold text-stone-800 mb-1">No courses found</h3>
                <p className="text-xs text-stone-500 mb-6">
                  {searchQuery ? 'Try adjusting your search terms.' : 'Explore available courses to start learning.'}
                </p>
                <button
                  onClick={() => onNavigate('v1')}
                  className="px-5 py-2.5 rounded-lg bg-stone-900 text-white font-semibold text-xs hover:bg-black transition-colors"
                >
                  Browse Course Catalog
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl pb-16">
                {filteredCourses.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => handleOpenCourse(c)}
                    className="bg-white border border-stone-200/90 rounded-xl overflow-hidden hover:shadow-xl hover:border-stone-300 transition-all cursor-pointer flex flex-col group"
                  >
                    {/* Course Banner Thumbnail (16:9 ratio) */}
                    <div className="relative w-full aspect-video bg-stone-900 overflow-hidden">
                      <img
                        src={c.thumbnail}
                        alt={c.title}
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/course_thumb_landscape.jpg'; }}
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                      />
                    </div>

                    {/* Course Content Info */}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div className="mb-4">
                        <h3 className="font-bold text-sm text-stone-900 line-clamp-2 group-hover:text-amber-700 transition-colors">
                          {c.title}
                        </h3>
                      </div>

                      {/* Progress Bar */}
                      <div>
                        <div className="w-full bg-stone-100 rounded-full h-2 mb-2 overflow-hidden">
                          <div
                            className="bg-amber-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.max(0, c.progress_percent || 0))}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-semibold">
                          <span className="text-amber-600 font-bold">
                            {c.progress_percent || 0}% completed
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Floating Support & Chat Widgets (Matching Photo 1) */}
            <div className="fixed bottom-6 right-6 flex items-center gap-3 z-50">
              <a
                href="https://wa.me/919999999999"
                target="_blank"
                rel="noreferrer"
                title="WhatsApp Support"
                className="w-12 h-12 rounded-full bg-[#25D366] hover:bg-[#1EBE5D] text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105"
              >
                <span className="material-symbols-outlined text-2xl">call</span>
              </a>
              <button
                title="Live Chat Support"
                className="w-13 h-13 rounded-full bg-[#0052CC] hover:bg-[#0047B3] text-white flex items-center justify-center shadow-xl transition-transform hover:scale-105"
              >
                <span className="material-symbols-outlined text-2xl">chat</span>
              </button>
            </div>
          </div>
        ) : (

        /* ------------------------------------------------------------ */
        /* VIEW 2: COURSE LEARNING WORKSPACE (PHOTO 2)                  */
        /* ------------------------------------------------------------ */
          <div className="flex-1 flex flex-col h-full overflow-hidden">

            {/* Top Learning Navigation Bar */}
            <div className="h-14 border-b border-stone-200 px-4 flex items-center justify-between bg-white flex-shrink-0 z-20">
              <div className="flex items-center gap-3 min-w-0">
                {/* Back Arrow to Photo 1 */}
                <button
                  onClick={() => setSelectedCourse(null)}
                  title="Back to Active Courses"
                  className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-stone-100 text-stone-700 transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">arrow_back</span>
                </button>

                {/* Left Drawer Toggle (Hamburger Icon) */}
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  title="Toggle Curriculum Sidebar"
                  className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-stone-100 text-amber-600 transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">menu</span>
                </button>

                {/* Course Title Header */}
                <h2 className="font-bold text-sm text-stone-900 truncate max-w-sm md:max-w-xl">
                  {selectedCourse.title}
                </h2>
              </div>

              {/* Prev / Next Buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  disabled={!prevLesson}
                  onClick={() => prevLesson && handleSelectLesson(prevLesson)}
                  className="px-3 py-1.5 rounded-md border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">chevron_left</span>
                  <span>Previous</span>
                </button>
                <button
                  disabled={!nextLesson}
                  onClick={() => nextLesson && handleSelectLesson(nextLesson)}
                  className="px-4 py-1.5 rounded-md bg-stone-900 hover:bg-black text-white text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 transition-colors shadow-2xs"
                >
                  <span>Next</span>
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
            </div>

            {/* Main Stage & Curriculum Split View */}
            <div className="flex-1 flex overflow-hidden">

              {/* Left Curriculum Sidebar (Collapsible Drawer) */}
              {sidebarOpen && (
                <aside className="w-80 md:w-88 h-full border-r border-stone-200 bg-white flex flex-col flex-shrink-0 overflow-hidden z-10 animate-in slide-in-from-left duration-200">
                  
                  {/* Progress Header */}
                  <div className="p-4 border-b border-stone-100 bg-[#FAFAFA]">
                    <div className="w-full bg-stone-200 rounded-full h-1.5 mb-2 overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${liveCompletedPercent}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-stone-800">
                      {liveCompletedPercent}% completed in {selectedCourse.duration_hrs || '48h 39m'}
                    </span>
                  </div>

                  {/* Course Discussions Link */}
                  <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between text-xs font-semibold text-blue-600 hover:bg-blue-50/50 cursor-pointer transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">forum</span>
                      <span>Course Discussions</span>
                    </div>
                    <span className="material-symbols-outlined text-xs text-stone-400">open_in_new</span>
                  </div>

                  {/* Curriculum Modules & Lessons Accordion */}
                  <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {curriculum?.modules?.map((mod) => (
                      <div key={mod.id} className="rounded-lg overflow-hidden">
                        
                        {/* Module Accordion Header */}
                        <button
                          onClick={() => setActiveModuleId(activeModuleId === mod.id ? null : mod.id)}
                          className="w-full px-3 py-2.5 text-left font-bold text-xs text-stone-800 flex items-center justify-between hover:bg-stone-50 transition-colors"
                        >
                          <span className="truncate pr-2">{mod.title}</span>
                          <span className="material-symbols-outlined text-base text-stone-400 flex-shrink-0">
                            {activeModuleId === mod.id ? 'expand_less' : 'expand_more'}
                          </span>
                        </button>

                        {/* Lessons in Module */}
                        {activeModuleId === mod.id && (
                          <div className="space-y-0.5 pb-2 pl-1">
                            {mod.lessons?.map((les) => {
                              const isSelected = activeLesson?.id === les.id;
                              const isCompleted = completedLessonIds.has(les.id);

                              return (
                                <div
                                  key={les.id}
                                  onClick={() => handleSelectLesson(les)}
                                  className={`px-3 py-2.5 text-xs flex items-center justify-between cursor-pointer rounded-md transition-all ${
                                    isSelected
                                      ? 'bg-stone-100 font-bold text-stone-900 border-l-3 border-stone-900 shadow-2xs'
                                      : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                    {/* Completion Check Badge */}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleComplete(les.id);
                                      }}
                                      title={isCompleted ? 'Mark Incomplete' : 'Mark Completed'}
                                      className="flex-shrink-0 text-stone-400 hover:text-emerald-600 transition-colors"
                                    >
                                      <span
                                        className={`material-symbols-outlined text-base ${
                                          isCompleted ? 'text-emerald-500 font-bold' : 'text-stone-300'
                                        }`}
                                      >
                                        {isCompleted ? 'check_circle' : 'radio_button_unchecked'}
                                      </span>
                                    </button>

                                    {/* Lesson Title */}
                                    <span className="truncate flex-1">{les.title}</span>
                                  </div>

                                  {/* Duration Badge */}
                                  {les.duration && (
                                    <span className="text-[10px] text-stone-400 ml-2 flex-shrink-0 font-mono">
                                      {les.duration}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </aside>
              )}

              {/* Center Main Content Stage (Video Player) */}
              <main className="flex-1 bg-stone-950 flex flex-col items-center justify-center relative p-4 overflow-hidden">
                <CourseVideoPlayer
                  playbackData={playbackData}
                  isLoading={playbackLoading}
                  error={playbackError}
                  className="w-full h-full max-h-[88vh] rounded-xl shadow-2xl"
                />
              </main>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
