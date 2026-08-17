import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MagneticButton from './MagneticButton.jsx';

export default function LoginView({ onNavigate, onLoginSuccess, logoUrl }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedRole, setCopiedRole] = useState(null);
  const [activeTab, setActiveTab] = useState('demo'); // 'demo' | 'manual'

  // Password Recovery State
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [resetStep, setResetStep] = useState('request'); // 'request' | 'submit'
  const [resetMessage, setResetMessage] = useState(null);
  const [resetLoading, setResetLoading] = useState(false);

  // Executive Demo Personas for Higher Officials
  const DEMO_ROLES = [
    {
      id: 'super_admin',
      roleName: 'Super Admin',
      badge: 'SUPER_ADMIN',
      badgeColor: 'bg-emerald-900 text-emerald-100 border-emerald-700',
      icon: 'shield_person',
      name: 'Chief Architect & Director',
      email: 'admin@landscapemastery.com',
      password: 'Admin@Landscape2026!',
      desc: 'Full platform governance, live financial revenue analytics, course builder, CMS, and security audit logs.'
    },
    {
      id: 'content_manager',
      roleName: 'Content Manager',
      badge: 'CONTENT_MANAGER',
      badgeColor: 'bg-indigo-900 text-indigo-100 border-indigo-700',
      icon: 'video_library',
      name: 'Curriculum & Media Director',
      email: 'content@landscapemastery.com',
      password: 'Content@Mastery2026!',
      desc: 'Course curriculum builder, module/lesson authoring, video masterclasses, and PDF CAD asset library.'
    },
    {
      id: 'support_admin',
      roleName: 'Support Admin',
      badge: 'SUPPORT_ADMIN',
      badgeColor: 'bg-amber-900 text-amber-100 border-amber-700',
      icon: 'support_agent',
      name: 'Student Success Lead',
      email: 'support@landscapemastery.com',
      password: 'Support@Mastery2026!',
      desc: 'Student roster management, coupon code generation, FAQ moderation, and verified reviews management.'
    },
    {
      id: 'paid_student',
      roleName: 'Enrolled Paid Student',
      badge: 'PAID STUDENT (LIFETIME)',
      badgeColor: 'bg-teal-900 text-teal-100 border-teal-700',
      icon: 'school',
      name: 'Elena Rostova, AIA',
      email: 'student@landscapemastery.com',
      password: 'Student@Mastery2026!',
      desc: 'Direct access to the DRM video streaming player, 14 architectural masterclasses, and CAD/DWG blueprints.'
    },
    {
      id: 'prospective_lead',
      roleName: 'Prospective Student (Lead)',
      badge: 'UNPAID LEAD',
      badgeColor: 'bg-stone-800 text-stone-200 border-stone-600',
      icon: 'person_outline',
      name: 'Marcus Vance (Prospective)',
      email: 'lead@landscapemastery.com',
      password: 'Lead@Mastery2026!',
      desc: 'Demonstrates unpaid lead access restriction and redirection to the landing checkout gate.'
    }
  ];

  const executeAuth = async (loginEmail, loginPwd) => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('http://localhost:8000/api/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPwd })
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok && data.token) {
        if (onLoginSuccess) {
          onLoginSuccess(data);
        } else {
          onNavigate(['SUPER_ADMIN', 'CONTENT_MANAGER', 'SUPPORT_ADMIN', 'ADMIN'].includes(data.user?.role) ? 'admin' : 'v3');
        }
      } else {
        setError(data.error || 'Invalid email or password.');
      }
    } catch (err) {
      console.error('Authentication network error:', err);
      setLoading(false);
      setError('Unable to connect to authentication server. Please ensure backend is running at http://localhost:8000.');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) return;
    executeAuth(email, password);
  };

  const handleQuickLogin = (role) => {
    setEmail(role.email);
    setPassword(role.password);
    executeAuth(role.email, role.password);
  };

  const handleCopyCredentials = (role) => {
    navigator.clipboard.writeText(`Email: ${role.email}\nPassword: ${role.password}`);
    setCopiedRole(role.id);
    setTimeout(() => setCopiedRole(null), 2500);
  };

  const handleForgotPasswordRequest = async (e) => {
    e.preventDefault();
    if (!resetEmail) return;
    setResetLoading(true);
    setResetMessage(null);

    try {
      const res = await fetch('http://localhost:8000/api/auth/forgot-password/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail })
      });
      const data = await res.json();
      setResetLoading(false);
      setResetMessage({ type: 'success', text: data.message || 'If an account exists with this email, instructions have been sent.' });
      setResetStep('submit');
    } catch (err) {
      setResetLoading(false);
      setResetMessage({ type: 'error', text: 'Network error. Please try again later.' });
    }
  };

  const handlePasswordResetSubmit = async (e) => {
    e.preventDefault();
    if (!resetEmail || !newPassword) return;
    setResetLoading(true);
    setResetMessage(null);

    try {
      const res = await fetch('http://localhost:8000/api/auth/reset-password/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, new_password: newPassword, token: resetToken })
      });
      const data = await res.json();
      setResetLoading(false);

      if (res.ok) {
        setResetMessage({ type: 'success', text: 'Password successfully updated! You may now sign in.' });
        setTimeout(() => {
          setForgotModalOpen(false);
          setResetStep('request');
          setResetMessage(null);
        }, 2000);
      } else {
        setResetMessage({ type: 'error', text: data.error || 'Password reset failed.' });
      }
    } catch (err) {
      setResetLoading(false);
      setResetMessage({ type: 'error', text: 'Network error. Please try again later.' });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex-1 flex flex-col items-center justify-center bg-stone-900 text-stone-100 px-4 sm:px-6 lg:px-8 py-10 relative overflow-hidden"
    >
      {/* Ambient Lighting Accents */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-950/40 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl w-full z-10 space-y-8">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-2 rounded-2xl bg-stone-950 border border-stone-800 shadow-xl mb-2">
            <img 
              src={(logoUrl && (logoUrl.startsWith('/media/') ? `http://localhost:8000${logoUrl}` : logoUrl)) || '/lm_logo.png'} 
              alt="Logo" 
              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/lm_logo.png'; }}
              className="w-12 h-12 object-contain" 
            />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Landscape Mastery Executive Portal
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 max-w-md mx-auto">
            Authorized portal for enrolled paid students, course instructors, and platform administrators.
          </p>

          {/* Navigation Mode Switcher Tabs */}
          <div className="inline-flex p-1 bg-stone-950 border border-stone-800 rounded-full mt-3 shadow-inner">
            <button
              onClick={() => setActiveTab('demo')}
              className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'demo'
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-sm">badge</span>
              <span>Official Demo Roles (1-Click)</span>
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'manual'
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-sm">key</span>
              <span>Manual Sign In</span>
            </button>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-xl mx-auto p-3.5 bg-rose-950/80 border border-rose-800/80 text-rose-200 text-xs font-semibold rounded-2xl text-center shadow-lg"
          >
            {error}
          </motion.div>
        )}

        {/* TAB 1: EXECUTIVE DEMO ROLE SWITCHER (FOR HIGHER OFFICIALS) */}
        {activeTab === 'demo' && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <div className="flex flex-col sm:flex-row justify-between items-center bg-stone-950/80 border border-stone-800 p-3.5 rounded-2xl text-xs text-stone-300 gap-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400 text-base">info</span>
                <span>Select any official role card below to <b>autofill credentials and log in with 1 click</b>:</span>
              </div>
              <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-800">
                Official Presentation Mode
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {DEMO_ROLES.map((r) => (
                <div
                  key={r.id}
                  className="bg-stone-950/90 border border-stone-800 rounded-2xl p-5 shadow-xl hover:border-emerald-700/60 transition-all flex flex-col justify-between group relative overflow-hidden"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-stone-900 border border-stone-700 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                          <span className="material-symbols-outlined text-lg">{r.icon}</span>
                        </div>
                        <div>
                          <h3 className="font-serif text-sm font-bold text-white">{r.roleName}</h3>
                          <span className="text-[11px] text-stone-400 block">{r.name}</span>
                        </div>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border ${r.badgeColor}`}>
                        {r.badge}
                      </span>
                    </div>

                    <p className="text-[11px] text-stone-400 leading-relaxed min-h-[40px]">
                      {r.desc}
                    </p>

                    <div className="bg-stone-900/90 border border-stone-800/80 rounded-xl p-2.5 space-y-1 text-[11px] font-mono">
                      <div className="flex justify-between text-stone-300">
                        <span className="text-stone-500 font-sans">Email:</span>
                        <span className="font-medium truncate max-w-[170px]">{r.email}</span>
                      </div>
                      <div className="flex justify-between text-stone-300">
                        <span className="text-stone-500 font-sans">Password:</span>
                        <span className="text-emerald-400 font-medium">{r.password}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-800/80 flex items-center gap-2">
                    <button
                      onClick={() => handleQuickLogin(r)}
                      disabled={loading}
                      className="flex-1 bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs py-2 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-sm">login</span>
                      <span>{loading && email === r.email ? 'Signing In...' : `Sign In as ${r.roleName.split(' ')[0]}`}</span>
                    </button>

                    <button
                      onClick={() => handleCopyCredentials(r)}
                      title="Copy login details to clipboard"
                      className="p-2 bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-white border border-stone-700 rounded-xl transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">
                        {copiedRole === r.id ? 'check' : 'content_copy'}
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* TAB 2: MANUAL LOGIN CARD */}
        {activeTab === 'manual' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="max-w-md mx-auto w-full bg-stone-950/90 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6"
          >
            <div>
              <h2 className="font-serif text-xl font-bold text-white text-center">Account Sign In</h2>
              <p className="text-[11px] text-stone-400 text-center uppercase tracking-wider mt-1">
                Enter your registered credentials
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-stone-300 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-emerald-600 transition-colors" 
                  type="email"
                  placeholder="architect@example.com"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[11px] font-bold text-stone-300 uppercase tracking-wider">
                    Password / Access Code
                  </label>
                  <button
                    type="button"
                    onClick={() => { setForgotModalOpen(true); setResetEmail(email); }}
                    className="text-[11px] text-emerald-400 hover:underline font-semibold"
                  >
                    Forgot Password?
                  </button>
                </div>
                <input 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-emerald-600 transition-colors" 
                  type="password"
                  placeholder="••••••••••••"
                  required
                />
              </div>

              <div className="pt-2">
                <MagneticButton 
                  type="submit" 
                  className="w-full bg-emerald-800 hover:bg-emerald-700 text-white py-3 rounded-xl font-semibold text-xs cursor-pointer shadow-lg flex justify-center items-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">lock_open</span>
                  <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
                </MagneticButton>
              </div>
            </form>

            <div className="pt-4 border-t border-stone-800 text-center">
              <button
                onClick={() => onNavigate('v1')}
                className="text-xs text-stone-400 hover:text-white transition-colors"
              >
                ← Return to Public Course Landing Page
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Forgot Password Recovery Modal */}
      <AnimatePresence>
        {forgotModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-stone-950 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-stone-800 space-y-4 text-stone-100"
            >
              <div className="flex justify-between items-center">
                <h3 className="font-serif text-lg font-bold text-white">Account Recovery</h3>
                <button 
                  onClick={() => setForgotModalOpen(false)}
                  className="text-stone-400 hover:text-white"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {resetMessage && (
                <div className={`p-3 rounded-xl text-xs font-semibold ${
                  resetMessage.type === 'success' ? 'bg-emerald-950 border border-emerald-800 text-emerald-200' :
                  'bg-rose-950 border border-rose-800 text-rose-200'
                }`}>
                  {resetMessage.text}
                </div>
              )}

              {resetStep === 'request' ? (
                <form onSubmit={handleForgotPasswordRequest} className="space-y-4">
                  <p className="text-xs text-stone-400">
                    Enter your account email. If registered, access instructions will be dispatched.
                  </p>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-300 uppercase tracking-wider mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="architect@example.com"
                      className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="w-full bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs py-2.5 rounded-xl shadow-sm transition-all"
                  >
                    {resetLoading ? 'Dispatching...' : 'Request Password Reset'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handlePasswordResetSubmit} className="space-y-3">
                  <p className="text-xs text-stone-400">
                    Enter your new secure password for <b>{resetEmail}</b>:
                  </p>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-300 uppercase tracking-wider mb-1">New Password</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-300 uppercase tracking-wider mb-1">Security Token / Code (Optional)</label>
                    <input
                      type="text"
                      value={resetToken}
                      onChange={(e) => setResetToken(e.target.value)}
                      placeholder="Leave empty or enter code"
                      className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="w-full bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs py-2.5 rounded-xl shadow-sm transition-all"
                  >
                    {resetLoading ? 'Updating Password...' : 'Save New Password & Sign In'}
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
