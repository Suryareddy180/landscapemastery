import React, { useState, useEffect } from 'react';
import Header from './components/Header.jsx';
import LandingView from './components/LandingView.jsx';
import LoginView from './components/LoginView.jsx';
import DashboardView from './components/DashboardView.jsx';
import AdminView from './components/AdminView.jsx';
import Footer from './components/Footer.jsx';

export default function App() {
  const [activeView, setActiveView] = useState('v1');
  const [token, setToken] = useState('');
  const [user, setUser] = useState(null);
  const [siteSettings, setSiteSettings] = useState({
    logoSize: 44,
    heroTitle: '',
    heroSubtitle: '',
    coursePrice: 499
  });

  useEffect(() => {
    fetchSiteSettings();
  }, []);

  const fetchSiteSettings = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/public/settings/');
      if (res.ok) {
        const data = await res.json();
        setSiteSettings(data);
      }
    } catch (e) {
      console.log('Public settings fetch fallback');
    }
  };

  const handleLoginSuccess = (data) => {
    if (data.token) {
      setToken(data.token);
    }
    if (data.user) {
      setUser(data.user);
      if (data.user.role === 'ADMIN') {
        setActiveView('admin');
        return;
      }
    }
    setActiveView('v3');
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen font-body-md overflow-x-hidden relative">
      {/* Landing Page (Screen 1) */}
      {activeView === 'v1' && (
        <div className="view-section active">
          <Header activeView={activeView} onNavigate={setActiveView} logoSize={siteSettings.logoSize} user={user} />
          <LandingView onNavigate={setActiveView} siteSettings={siteSettings} />
          <Footer />
        </div>
      )}

      {/* Login Portal (Screen 2) */}
      {activeView === 'v2' && (
        <div className="view-section active min-h-screen flex flex-col">
          <Header activeView={activeView} onNavigate={setActiveView} logoSize={siteSettings.logoSize} user={user} />
          <LoginView onNavigate={setActiveView} onLoginSuccess={handleLoginSuccess} />
        </div>
      )}

      {/* Student Video Portal (Screen 3) */}
      {activeView === 'v3' && (
        <div className="view-section active h-screen flex overflow-hidden bg-surface">
          <DashboardView onNavigate={setActiveView} token={token} user={user} />
        </div>
      )}

      {/* Admin Operations Panel */}
      {activeView === 'admin' && (
        <div className="view-section active h-screen flex flex-col bg-stone-50 overflow-hidden">
          <AdminView user={user} onNavigate={setActiveView} token={token} />
        </div>
      )}
    </div>
  );
}
