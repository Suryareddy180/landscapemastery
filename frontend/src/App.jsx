import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useSearchParams, useLocation } from 'react-router-dom';
import { BASE_URL } from './lib/api.js';

// Landscape Mastery Core Components (loaded immediately for instant first-contentful-paint)
import Header from './components/Header.jsx';
import LandingView from './components/LandingView.jsx';
import LoginView from './components/LoginView.jsx';
import Footer from './components/Footer.jsx';

// Lazy-loaded Views for production performance optimization
const DashboardView = lazy(() => import('./components/DashboardView.jsx'));
const AdminView = lazy(() => import('./components/AdminView.jsx'));
const CompanyHome = lazy(() => import('./pages/CompanyHome.jsx'));
const AdminLayout = lazy(() => import('./admin/AdminLayout.jsx'));
const AdminLogin = lazy(() => import('./admin/AdminLogin.jsx'));
const AdminDashboard = lazy(() => import('./admin/AdminDashboard.jsx'));

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

  const getEffectiveView = () => {
    if (location.pathname.endsWith('/admin') || location.pathname === '/admin' || initialView === 'admin') {
      return 'admin';
    }
    if (location.pathname.endsWith('/login') || location.pathname === '/login' || initialView === 'v2') {
      return 'v2';
    }
    const viewParam = searchParams.get('view');
    if (viewParam && ['v1', 'v2', 'v3', 'admin'].includes(viewParam)) {
      return viewParam;
    }
    return initialView;
  };

  const [activeView, setActiveView] = useState(getEffectiveView);

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

    // Check if explicit view query parameter was provided
    const viewParam = searchParams.get('view');
    if (viewParam && ['v1', 'v2', 'v3', 'admin'].includes(viewParam)) {
      setActiveView(viewParam);
      return;
    }

    // Auto-restore view if token and user exist
    if (token && user) {
      if (ADMIN_ROLES.includes(user.role)) {
        setActiveView('admin');
      } else if (user.role === 'STUDENT' && user.paid) {
        setActiveView('v3');
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

  const handleLogout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('lm_auth_token');
    localStorage.removeItem('admin_token');
    localStorage.removeItem('lm_auth_user');
    setActiveView('v1');
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen font-body-md overflow-x-hidden relative">
      {/* Landing Page (Screen 1) */}
      {activeView === 'v1' && (
        <div className="view-section active">
          <Header activeView={activeView} onNavigate={setActiveView} logoSize={siteSettings.logoSize} logoUrl={siteSettings.logoUrl} user={user} onLogout={handleLogout} />
          <LandingView onNavigate={setActiveView} siteSettings={siteSettings} onLoginSuccess={handleLoginSuccess} />
          <Footer />
        </div>
      )}

      {/* Login Portal (Screen 2) */}
      {activeView === 'v2' && (
        <div className="view-section active min-h-screen flex flex-col">
          <Header activeView={activeView} onNavigate={setActiveView} logoSize={siteSettings.logoSize} logoUrl={siteSettings.logoUrl} user={user} onLogout={handleLogout} />
          <LoginView onNavigate={setActiveView} onLoginSuccess={handleLoginSuccess} logoUrl={siteSettings.logoUrl} />
        </div>
      )}

      {/* Student Video Portal (Screen 3) */}
      {activeView === 'v3' && (
        <Suspense fallback={<ViewLoader />}>
          <div className="view-section active h-screen flex overflow-hidden bg-surface">
            <DashboardView onNavigate={setActiveView} token={token} user={user} onLogout={handleLogout} logoUrl={siteSettings.logoUrl} />
          </div>
        </Suspense>
      )}

      {/* Admin Operations Panel */}
      {activeView === 'admin' && (
        <Suspense fallback={<ViewLoader />}>
          <div className="view-section active h-screen flex flex-col bg-stone-50 overflow-hidden">
            {(!token || !user || !ADMIN_ROLES.includes(user?.role)) ? (
              <div className="min-h-screen flex flex-col overflow-y-auto bg-gradient-to-b from-[#FAF9F5] via-[#F4F3ED] to-[#ECEAE3]">
                <Header activeView={activeView} onNavigate={setActiveView} logoSize={siteSettings.logoSize} logoUrl={siteSettings.logoUrl} user={user} onLogout={handleLogout} />
                <LoginView onNavigate={setActiveView} onLoginSuccess={handleLoginSuccess} logoUrl={siteSettings.logoUrl} isAdminPortal={true} />
              </div>
            ) : (
              <AdminView user={user} onNavigate={setActiveView} token={token} onLogout={handleLogout} onSettingsUpdated={fetchSiteSettings} />
            )}
          </div>
        </Suspense>
      )}
    </div>
  );
}

export default function App() {
  const location = useLocation();

  useEffect(() => {
    const isLandscape =
      location.pathname.startsWith('/landscapemastery') ||
      location.pathname === '/login' ||
      location.pathname === '/portal' ||
      location.pathname === '/dashboard' ||
      location.pathname === '/courses' ||
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

        {/* Product: Landscape Mastery Architectural Masterclass & LMS (Photo 2) */}
        <Route path="/landscapemastery" element={<LandscapeApp key="lm-v1" initialView="v1" />} />
        <Route path="/landscapemastery/login" element={<LandscapeApp key="lm-v2" initialView="v2" />} />
        <Route path="/landscapemastery/portal" element={<LandscapeApp key="lm-v3" initialView="v3" />} />
        <Route path="/landscapemastery/dashboard" element={<LandscapeApp key="lm-v3-dash" initialView="v3" />} />
        <Route path="/landscapemastery/admin" element={<LandscapeApp key="lm-admin" initialView="admin" />} />

        {/* Shortcuts for Landscape Mastery */}
        <Route path="/login" element={<LandscapeApp key="short-v2" initialView="v2" />} />
        <Route path="/portal" element={<LandscapeApp key="short-v3" initialView="v3" />} />
        <Route path="/dashboard" element={<LandscapeApp key="short-v3-dash" initialView="v3" />} />
        <Route path="/portal/admin" element={<LandscapeApp key="short-admin1" initialView="admin" />} />
        <Route path="/portal-admin" element={<LandscapeApp key="short-admin2" initialView="admin" />} />
        <Route path="/courses" element={<Navigate to="/landscapemastery#courses" replace />} />

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
