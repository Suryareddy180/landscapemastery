import React from 'react';

export default function Footer() {
  return (
    <footer className="w-full py-12 border-t border-stone-200 bg-white text-stone-600 font-body-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <span className="text-xs font-semibold text-stone-500">
          © 2026 Landscape Mastery. All Rights Reserved. Secure &amp; DRM Encrypted.
        </span>
        <div className="flex gap-6 text-xs font-semibold">
          <a 
            href="#course-curriculum" 
            className="hover:text-emerald-800 transition-colors"
          >
            Curriculum
          </a>
          <a 
            href="#features" 
            className="hover:text-emerald-800 transition-colors"
          >
            Framework
          </a>
          <a 
            href="#enroll-card" 
            className="hover:text-emerald-800 transition-colors"
          >
            Enrollment
          </a>
          <a 
            href="mailto:contact@landscapemastery.com" 
            className="hover:text-emerald-800 transition-colors"
          >
            Support
          </a>
        </div>
      </div>
    </footer>
  );
}
