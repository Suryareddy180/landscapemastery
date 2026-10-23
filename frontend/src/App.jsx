import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { BASE_URL } from './lib/api.js';

// Landscape Mastery Core Components (loaded immediately for instant first-contentful-paint)
import Header from './components/Header.jsx';
import LandingView from './components/LandingView.jsx';
import LoginView from './components/LoginView.jsx';
import EnrollView from './components/EnrollView.jsx';
import Footer from './components/Footer.jsx';
import ProfileModal from './components/ProfileModal.jsx';

// Lazy-loaded Views for production performance optimization
const DashboardView = lazy(() => import('./components/DashboardView.jsx'));
const AdminView = lazy(() => import('./components/AdminView.jsx'));
const CompanyHome = lazy(() => import('./pages/CompanyHome.jsx'));
const AdminLayout = lazy(() => import('./admin/AdminLayout.jsx'));
const AdminLogin = lazy(() => import('./admin/AdminLogin.jsx'));
const AdminDashboard = lazy(() => import('./admin/AdminDashboard.jsx'));
const PromoCourseView = lazy(() => import('./components/PromoCourseView.jsx'));

export const ADMIN_ROLES = ['SUPER_ADMIN', 'CONTENT_MANAGER', 'SUPPORT_ADMIN', 'ADMIN'];

const ViewLoader = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 p-12">
    <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
    <span className="text-xs uppercase tracking-widest text-stone-400 font-mono">Loading Interface...</span>
  </div>
);

function LandscapeApp({ initialView = 'v1' }) {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const getEffectiveView = () => {
    if (location.pathname.endsWith('/admin') || location.pathname === '/admin' || initialView === 'admin') {
      return 'admin';
    }
    if (location.pathname.endsWith('/login') || location.pathname === '/login' || initialView === 'v2') {
      return 'v2';
    }
    const pathParts = location.pathname.split('/').filter(Boolean);
    const hasSpecificCourse = (pathParts[0] === 'courses' && pathParts.length > 1) ||
                              (pathParts[0] === 'landscapemastery' && pathParts[1] === 'courses' && pathParts.length > 2);
    if (location.pathname.includes('/enroll') || hasSpecificCourse || initialView === 'enroll') {
      return 'enroll';
    }
    const viewParam = searchParams.get('view');
    if (viewParam && ['v1', 'v2', 'v3', 'admin', 'enroll'].includes(viewParam)) {
      return viewParam;
    }
    return initialView;
  };

  const [activeView, setActiveView] = useState(getEffectiveView);
  const [selectedEnrollCourse, setSelectedEnrollCourse] = useState(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const [token, setToken] = useState(() => localStorage.getItem('lm_auth_token') || '');
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('lm_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [siteSettings, setSiteSettings] = useState({
    logoSize: 48,
    heroTitle: 'Master the Art of Landscape Architecture',
    heroSubtitle: 'Elevate your architectural vision. Access industry-leading video modules, spatial planning frameworks, and achieve complete mastery.',
    coursePrice: 499,
    logoUrl: '/lm_logo.png'
  });

  useEffect(() => {
    document.title = activeView === 'admin'
      ? "Landscape Mastery | Administrator Console"
      : activeView === 'enroll'
      ? "Landscape Mastery | Course Enrollment & Checkout"
      : "Landscape Mastery | Architectural Masterclass";
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
    fetchSiteSettings();

    // Priority 1: Admin direct route
    if (location.pathname.endsWith('/admin') || location.pathname === '/admin' || initialView === 'admin') {
      setActiveView('admin');
      return;
    }

    // Priority 2: Student Login route
    if (location.pathname.endsWith('/login') || location.pathname === '/login' || initialView === 'v2') {
      setActiveView('v2');
      return;
    }

    // Priority 2.5: Enrollment Standalone Page & Specific Course URLs
    const pathParts = location.pathname.split('/').filter(Boolean);
    const hasSpecificCourse = (pathParts[0] === 'courses' && pathParts.length > 1) ||
                              (pathParts[0] === 'landscapemastery' && pathParts[1] === 'courses' && pathParts.length > 2);
    if (location.pathname.includes('/enroll') || hasSpecificCourse || initialView === 'enroll') {
      setActiveView('enroll');
      return;
    }

    // Check if explicit view query parameter was provided
    const viewParam = searchParams.get('view');
    if (viewParam && ['v1', 'v2', 'v3', 'admin', 'enroll'].includes(viewParam)) {
      setActiveView(viewParam);
      return;
    }

    // Priority 3: Profile route
    if (location.pathname.endsWith('/profile') || location.pathname === '/profile' || initialView === 'profile') {
      setProfileModalOpen(true);
    }

    // Auto-restore view if token and user exist
    if (token && user) {
      if (ADMIN_ROLES.includes(user.role)) {
        if (location.pathname.endsWith('/admin') || location.pathname.endsWith('/login')) {
          setActiveView('admin');
        }
      } else if (user.role === 'STUDENT' && user.paid) {
        if (location.pathname.endsWith('/portal') || location.pathname.endsWith('/dashboard') || location.pathname.endsWith('/login')) {
          setActiveView('v3');
        }
      }
    }
  }, [location.pathname, initialView, searchParams]);

  const fetchSiteSettings = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/public/settings/`);
      if (res.ok) {
        const data = await res.json();
        setSiteSettings(data);
      }
    } catch (e) {
      // Silently fall back to default settings
    }
  };

  const handleLoginSuccess = (data) => {
    if (data.token) {
      setToken(data.token);
      localStorage.setItem('lm_auth_token', data.token);
      if (data.user && ADMIN_ROLES.includes(data.user.role)) {
        localStorage.setItem('admin_token', data.token);
      }
    }
    if (data.user) {
      setUser(data.user);
      localStorage.setItem('lm_auth_user', JSON.stringify(data.user));

      // Centralized Role-Based Routing (BUG-005, BUG-006)
      if (ADMIN_ROLES.includes(data.user.role)) {
        setActiveView('admin');
        return;
      } else if (data.user.role === 'STUDENT') {
        if (data.user.paid) {
          setActiveView('v3');
        } else {
          setActiveView('v1');
        }
        return;
      }
    }
    setActiveView('v1');
  };

  const handleNavigate = (view, payload = null) => {
    if (view === 'enroll') {
      if (payload) {
        setSelectedEnrollCourse(payload);
      }
      setActiveView('enroll');
      if (navigate && location.pathname !== '/landscapemastery/enroll' && location.pathname !== '/enroll') {
        navigate('/landscapemastery/enroll');
      }
      return;
    }
    if (view === 'v1') {
      setActiveView('v1');
      if (navigate && (location.pathname.endsWith('/admin') || location.pathname.endsWith('/login') || location.pathname.includes('/portal'))) {
        navigate('/landscapemastery');
      }
      return;
    }
    if (view === 'admin') {
      setActiveView('admin');
      if (navigate && !location.pathname.endsWith('/admin')) {
        navigate('/landscapemastery/admin');
      }
      return;
    }
    if (view === 'v3') {
      setActiveView('v3');
      if (navigate && !location.pathname.endsWith('/portal') && !location.pathname.endsWith('/dashboard')) {
        navigate('/landscapemastery/portal');
      }
      return;
    }
    setActiveView(view);
  };

  const handleLogout = (exitDestination = '/landscapemastery') => {
    const destination = typeof exitDestination === 'string' ? exitDestination : '/landscapemastery';
    setToken('');
    setUser(null);
    localStorage.removeItem('lm_auth_token');
    localStorage.removeItem('admin_token');
    localStorage.removeItem('lm_auth_user');
    sessionStorage.clear();
    setActiveView('v1');
    if (navigate) {
      navigate(destination, { replace: true });
    }
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen font-body-md overflow-x-hidden relative">
      {/* Landing Page (Screen 1) */}
      {activeView === 'v1' && (
        <div className="view-section active">
          <Header activeView={activeView} onNavigate={handleNavigate} logoSize={siteSettings.logoSize} logoUrl={siteSettings.logoUrl} user={user} onLogout={handleLogout} onOpenProfile={() => setProfileModalOpen(true)} />
          <LandingView onNavigate={handleNavigate} siteSettings={siteSettings} onLoginSuccess={handleLoginSuccess} />
          <Footer />
        </div>
      )}

      {/* Standalone Course Enrollment Page */}
      {activeView === 'enroll' && (
        <div className="view-section active min-h-screen flex flex-col bg-[#FAF9F5]">
          <Header activeView={activeView} onNavigate={handleNavigate} logoSize={siteSettings.logoSize} logoUrl={siteSettings.logoUrl} user={user} onLogout={handleLogout} onOpenProfile={() => setProfileModalOpen(true)} />
          <main className="flex-1">
            <EnrollView onNavigate={handleNavigate} siteSettings={siteSettings} onLoginSuccess={handleLoginSuccess} initialCourse={selectedEnrollCourse} />
          </main>
          <Footer />
        </div>
      )}

      {/* Login Portal (Screen 2) */}
      {activeView === 'v2' && (
        <div className="view-section active min-h-screen flex flex-col">
          <Header activeView={activeView} onNavigate={handleNavigate} logoSize={siteSettings.logoSize} logoUrl={siteSettings.logoUrl} user={user} onLogout={handleLogout} onOpenProfile={() => setProfileModalOpen(true)} />
          <LoginView onNavigate={handleNavigate} onLoginSuccess={handleLoginSuccess} logoUrl={siteSettings.logoUrl} />
        </div>
      )}

      {/* Student Video Portal (Screen 3) */}
      {activeView === 'v3' && (
        <Suspense fallback={<ViewLoader />}>
          <div className="view-section active h-screen flex overflow-hidden bg-surface">
            <DashboardView onNavigate={handleNavigate} token={token} user={user} onLogout={handleLogout} logoUrl={siteSettings.logoUrl} onOpenProfile={() => setProfileModalOpen(true)} />
          </div>
        </Suspense>
      )}

      {/* Admin Operations Panel */}
      {activeView === 'admin' && (
        <Suspense fallback={<ViewLoader />}>
          <div className="view-section active h-screen flex flex-col bg-stone-50 overflow-hidden">
            {(!token || !user || !ADMIN_ROLES.includes(user?.role)) ? (
              <div className="min-h-screen flex flex-col overflow-y-auto bg-gradient-to-b from-[#FAF9F5] via-[#F4F3ED] to-[#ECEAE3]">
                <Header activeView={activeView} onNavigate={handleNavigate} logoSize={siteSettings.logoSize} logoUrl={siteSettings.logoUrl} user={user} onLogout={handleLogout} onOpenProfile={() => setProfileModalOpen(true)} />
                <LoginView onNavigate={handleNavigate} onLoginSuccess={handleLoginSuccess} logoUrl={siteSettings.logoUrl} isAdminPortal={true} />
              </div>
            ) : (
              <AdminView user={user} onNavigate={handleNavigate} token={token} onLogout={handleLogout} onSettingsUpdated={fetchSiteSettings} onOpenProfile={() => setProfileModalOpen(true)} />
            )}
          </div>
        </Suspense>
      )}

      {/* Universal Profile Management Modal */}
      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        token={token}
        user={user}
        onUserUpdated={(updatedUser) => {
          setUser(updatedUser);
          localStorage.setItem('lm_auth_user', JSON.stringify(updatedUser));
        }}
        onLogout={handleLogout}
      />
    </div>
  );
}

export default function App() {
  const location = useLocation();

  useEffect(() => {
    const isLandscape =
      location.pathname.startsWith('/landscapemastery') ||
      location.pathname.startsWith('/enroll') ||
      location.pathname.startsWith('/courses') ||
      location.pathname.startsWith('/promo') ||
      location.pathname === '/login' ||
      location.pathname === '/portal' ||
      location.pathname === '/dashboard' ||
      location.pathname === '/profile' ||
      location.pathname === '/portal-admin' ||
      location.pathname === '/portal/admin';

    if (isLandscape) {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
  }, [location.pathname]);

  return (
    <Suspense fallback={<ViewLoader />}>
      <Routes>
        {/* Master Destination: 3CAPSTECH Corporate Platform (Photo 1) */}
        <Route path="/" element={<CompanyHome />} />
        <Route path="/company" element={<CompanyHome />} />

        {/* Individual Course Promotional & VIP QR Pass Pages */}
        <Route path="/promo/:courseSlug" element={<PromoCourseView />} />
        <Route path="/promo" element={<PromoCourseView />} />
        <Route path="/courses/:courseSlug/promo" element={<PromoCourseView />} />
        <Route path="/landscapemastery/promo/:courseSlug" element={<PromoCourseView />} />
        <Route path="/landscapemastery/courses/:courseSlug/promo" element={<PromoCourseView />} />

        {/* Product: Landscape Mastery Architectural Masterclass & LMS (Photo 2) */}
        <Route path="/landscapemastery" element={<LandscapeApp key="lm-v1" initialView="v1" />} />
        <Route path="/landscapemastery/enroll" element={<LandscapeApp key="lm-enroll" initialView="enroll" />} />
        <Route path="/landscapemastery/enroll/:courseId" element={<LandscapeApp key="lm-enroll-id" initialView="enroll" />} />
        <Route path="/landscapemastery/courses" element={<LandscapeApp key="lm-courses" initialView="v1" />} />
        <Route path="/landscapemastery/courses/:courseId" element={<LandscapeApp key="lm-course-id" initialView="enroll" />} />
        <Route path="/landscapemastery/courses/:courseId/enroll" element={<LandscapeApp key="lm-course-enroll" initialView="enroll" />} />
        <Route path="/landscapemastery/login" element={<LandscapeApp key="lm-v2" initialView="v2" />} />
        <Route path="/landscapemastery/portal" element={<LandscapeApp key="lm-v3" initialView="v3" />} />
        <Route path="/landscapemastery/dashboard" element={<LandscapeApp key="lm-v3-dash" initialView="v3" />} />
        <Route path="/landscapemastery/admin" element={<LandscapeApp key="lm-admin" initialView="admin" />} />
        <Route path="/landscapemastery/profile" element={<LandscapeApp key="lm-profile" initialView="profile" />} />

        {/* Direct Shortcuts for Landscape Mastery & Enrollment (Photo 2) */}
        <Route path="/enroll" element={<LandscapeApp key="short-enroll" initialView="enroll" />} />
        <Route path="/enroll/:courseId" element={<LandscapeApp key="short-enroll-id" initialView="enroll" />} />
        <Route path="/courses" element={<LandscapeApp key="short-courses" initialView="v1" />} />
        <Route path="/courses/:courseId" element={<LandscapeApp key="short-course-id" initialView="enroll" />} />
        <Route path="/courses/:courseId/enroll" element={<LandscapeApp key="short-course-enroll" initialView="enroll" />} />
        <Route path="/login" element={<LandscapeApp key="short-v2" initialView="v2" />} />
        <Route path="/portal" element={<LandscapeApp key="short-v3" initialView="v3" />} />
        <Route path="/dashboard" element={<LandscapeApp key="short-v3-dash" initialView="v3" />} />
        <Route path="/profile" element={<LandscapeApp key="short-profile" initialView="profile" />} />
        <Route path="/portal/admin" element={<LandscapeApp key="short-admin1" initialView="admin" />} />
        <Route path="/portal-admin" element={<LandscapeApp key="short-admin2" initialView="admin" />} />

        {/* Convenience Direct Aliases for 3CAPSTECH corporate sections */}
        <Route path="/services" element={<Navigate to="/#services" replace />} />
        <Route path="/about" element={<Navigate to="/#about" replace />} />
        <Route path="/solutions" element={<Navigate to="/#solutions" replace />} />
        <Route path="/products" element={<Navigate to="/#products" replace />} />
        <Route path="/process" element={<Navigate to="/#process" replace />} />
        <Route path="/why" element={<Navigate to="/#why" replace />} />
        <Route path="/contact" element={<Navigate to="/#contact" replace />} />

        {/* 3CAPSTECH Admin Console & Login */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
        </Route>
        <Route path="/company/admin" element={<Navigate to="/admin" replace />} />

        {/* Fallback Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
