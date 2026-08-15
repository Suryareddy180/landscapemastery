import React, { useState } from 'react';
import Header from './components/Header.jsx';
import LandingView from './components/LandingView.jsx';
import LoginView from './components/LoginView.jsx';
import DashboardView from './components/DashboardView.jsx';
import Footer from './components/Footer.jsx';

export default function App() {
  const [activeView, setActiveView] = useState('v1');

  return (
    <div className="bg-surface text-on-surface min-h-screen font-body-md overflow-x-hidden relative">
      {/* Main View Renderer */}
      {activeView === 'v1' && (
        <div className="view-section active">
          <Header activeView={activeView} onNavigate={setActiveView} />
          <LandingView onNavigate={setActiveView} />
          <Footer />
        </div>
      )}

      {activeView === 'v2' && (
        <div className="view-section active min-h-screen flex flex-col">
          <Header activeView={activeView} onNavigate={setActiveView} />
          <LoginView onNavigate={setActiveView} />
        </div>
      )}

      {activeView === 'v3' && (
        <div className="view-section active h-screen flex overflow-hidden bg-surface">
          <DashboardView onNavigate={setActiveView} />
        </div>
      )}
    </div>
  );
}
