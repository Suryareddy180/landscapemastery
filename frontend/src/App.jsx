import React, { useState, useEffect } from 'react';
import Header from './components/Header.jsx';
import LandingView from './components/LandingView.jsx';
import LoginView from './components/LoginView.jsx';
import DashboardView from './components/DashboardView.jsx';
import AdminView from './components/AdminView.jsx';
import Footer from './components/Footer.jsx';

export const ADMIN_ROLES = ['SUPER_ADMIN', 'CONTENT_MANAGER', 'SUPPORT_ADMIN', 'ADMIN'];

export default function App() {
  const [activeView, setActiveView] = useState('v1');
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
    fetchSiteSettings();
    // Auto-restore view if token exists
    if (token && user) {
      if (ADMIN_ROLES.includes(user.role)) {
        setActiveView('admin');
      } else if (user.role === 'STUDENT' && user.paid) {
        setActiveView('v3');
      }
    }
  }, []);

  const fetchSiteSettings = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/public/settings/');
      if (res.ok) {
        const data = await res.json();
        setSiteSettings(data);
      }
    } catch (e) {
      console.log('Public settings loaded with fallback configuration');
    }
  };

  const handleLoginSuccess = (data) => {
    if (data.token) {
      setToken(data.token);
      localStorage.setItem('lm_auth_token', data.token);
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
        <div className="view-section active h-screen flex overflow-hidden bg-surface">
          <DashboardView onNavigate={setActiveView} token={token} user={user} onLogout={handleLogout} logoUrl={siteSettings.logoUrl} />
        </div>
      )}

      {/* Admin Operations Panel */}
      {activeView === 'admin' && (
        <div className="view-section active h-screen flex flex-col bg-stone-50 overflow-hidden">
          <AdminView user={user} onNavigate={setActiveView} token={token} onLogout={handleLogout} onSettingsUpdated={fetchSiteSettings} />
        </div>
      )}
    </div>
  );
}
