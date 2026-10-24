import React from 'react';
import { motion } from 'framer-motion';
import { BASE_URL } from '../lib/api.js';

const defaultThumbnails = [
  '/course_thumb_landscape.jpg',
  '/course_thumb_hardscape.jpg',
  '/course_thumb_botanical.jpg'
];

const levelIcons = {
  'All Levels': 'school',
  'Beginner': 'trending_up',
  'Intermediate': 'architecture',
  'Advanced': 'engineering'
};

export default function CourseCatalog({ courses, onSelectCourse, onNavigate, enrolledCourseIds = [] }) {
  if (!courses || courses.length === 0) return null;

  return (
    <section id="course-catalog" className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14 space-y-2.5 sm:space-y-3">
        <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full inline-block">
          Professional Course Library
        </span>
        <h2 className="font-serif text-2xl xs:text-3xl sm:text-5xl font-bold text-emerald-950 tracking-tight break-words px-1">
          Choose Your <span className="italic font-normal bg-gradient-to-r from-emerald-950 via-emerald-800 to-teal-800 bg-clip-text text-transparent">Masterclass</span>
        </h2>
        <p className="text-xs sm:text-base text-stone-600 max-w-xl mx-auto px-1">
          Each course is a self-contained, comprehensive program with lifetime access. Select a course to begin your journey.
        </p>
      </div>

      <div className={`grid gap-5 sm:gap-8 ${courses.length === 1 ? 'grid-cols-1 max-w-lg mx-auto' : courses.length === 2 ? 'grid-cols-1 sm:grid-cols-2 max-w-4xl mx-auto' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
        {courses.map((course, idx) => {
          const isEnrolled = enrolledCourseIds.includes(course.id);
          const rawThumb = course.thumbnail || defaultThumbnails[idx % defaultThumbnails.length];
          const thumbnail = rawThumb.startsWith('/media/') ? `${BASE_URL}${rawThumb}` : rawThumb;
          const displayPrice = course.price != null ? course.price : (course.discount_price || 299);
          const isStrikeOffOn = course.is_strike_off_enabled !== false;
          const originalPrice = isStrikeOffOn ? (course.original_price || course.strike_price || (course.discount_price && course.discount_price < course.price ? course.price : null)) : null;
          const hasDiscount = Boolean(isStrikeOffOn && (course.has_discount ?? (originalPrice && Number(originalPrice) > Number(displayPrice))));

          return (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              whileHover={{ y: -8 }}
              className="group bg-white rounded-2xl sm:rounded-3xl border border-stone-200/90 shadow-sm hover:shadow-2xl hover:border-emerald-700/30 transition-all duration-300 overflow-hidden flex flex-col"
            >
              {/* Course Thumbnail */}
              <div className="relative h-44 sm:h-48 overflow-hidden">
                <img
                  src={thumbnail}
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = defaultThumbnails[0]; }}
                />
                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/60 via-transparent to-transparent" />
                
                {/* Level / Locked Badge */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                  <div className="inline-flex items-center gap-1.5 bg-white/90 backdrop-blur-md text-stone-800 text-[10px] font-bold px-2.5 py-1 rounded-full border border-stone-200/80 shadow-xs">
                    <span className="material-symbols-outlined text-xs text-emerald-700">{levelIcons[course.level] || 'school'}</span>
                    <span>{course.level}</span>
                  </div>
                  {course.is_locked && (
                    <div className="inline-flex items-center gap-1 bg-amber-500/95 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-xs">
                      <span className="material-symbols-outlined text-xs">lock</span>
                      <span>In Editing</span>
                    </div>
                  )}
                </div>

                {/* Enrolled Badge */}
                {isEnrolled && (
                  <div className="absolute top-3 right-3 inline-flex items-center gap-1 bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg">
                    <span className="material-symbols-outlined text-xs">check_circle</span>
                    <span>Enrolled</span>
                  </div>
                )}

                {/* Price Badge */}
                <div className="absolute bottom-3 right-3">
                  <div className="bg-white/95 backdrop-blur-md rounded-xl px-2.5 sm:px-3 py-1 sm:py-1.5 shadow-lg border border-stone-200/80">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-base sm:text-lg font-bold font-serif text-emerald-950">₹{displayPrice}</span>
                      {hasDiscount && originalPrice && (
                        <span className="text-xs line-through text-stone-400">₹{originalPrice}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Course Details */}
              <div className="flex flex-col flex-1 p-4 xs:p-5 sm:p-6 space-y-3.5 sm:space-y-4">
                <div className="space-y-1.5 sm:space-y-2 flex-1">
                  <h3 className="font-serif text-base sm:text-lg font-bold text-stone-900 leading-snug group-hover:text-emerald-900 transition-colors break-words">
                    {course.title}
                  </h3>
                  <p className="text-xs text-stone-600 leading-relaxed line-clamp-2">
                    {course.short_desc || 'Comprehensive professional masterclass with lifetime access.'}
                  </p>
                </div>

                {/* Course Meta Stats */}
                <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-[10.5px] sm:text-[11px] font-semibold text-stone-500 pt-2 border-t border-stone-100">
                  <span className="flex items-center gap-1 shrink-0">
                    <span className="material-symbols-outlined text-sm text-emerald-700">auto_stories</span>
                    {course.module_count || 0} Modules
                  </span>
                  <span className="flex items-center gap-1 shrink-0">
                    <span className="material-symbols-outlined text-sm text-emerald-700">play_circle</span>
                    {course.lesson_count || 0} Lessons
                  </span>
                  <span className="flex items-center gap-1 shrink-0">
                    <span className="material-symbols-outlined text-sm text-emerald-700">schedule</span>
                    {course.duration_hrs || '45 mins'}
                  </span>
                </div>

                {/* CTA Button */}
                {isEnrolled ? (
                  <button
                    type="button"
                    onClick={() => onNavigate ? onNavigate('v3') : window.location.assign('/landscapemastery/portal')}
                    className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs py-3 rounded-xl border border-emerald-200 flex items-center justify-center gap-2 cursor-pointer transition-all shadow-2xs text-center"
                  >
                    <span className="material-symbols-outlined text-base text-emerald-700 shrink-0">check_circle</span>
                    <span className="truncate">Already Enrolled — Access Course</span>
                  </button>
                ) : (
                  <button
                    onClick={() => onSelectCourse(course)}
                    className="w-full bg-gradient-to-r from-emerald-900 to-emerald-950 hover:from-emerald-800 hover:to-emerald-900 text-white font-semibold text-xs py-3 rounded-xl shadow-lg shadow-emerald-950/20 transition-all flex items-center justify-center gap-2 cursor-pointer btn-shine text-center"
                  >
                    <span className="material-symbols-outlined text-base shrink-0">lock</span>
                    <span>Enroll Now • ₹{displayPrice}</span>
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
