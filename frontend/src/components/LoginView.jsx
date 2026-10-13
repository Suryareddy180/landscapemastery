import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowLeft, ArrowRight,
  Sparkles, KeyRound, CheckCircle2, AlertCircle, Compass, BookOpen,
  X, Check
} from 'lucide-react';
import { BASE_URL } from '../lib/api.js';

export default function LoginView({ onNavigate, onLoginSuccess, logoUrl, isAdminPortal = false }) {
  const isAdmin = Boolean(isAdminPortal);
  const [email, setEmail] = useState(() => localStorage.getItem('lm_remembered_email') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberEmail, setRememberEmail] = useState(Boolean(localStorage.getItem('lm_remembered_email')));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Password Recovery State
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [resetMessage, setResetMessage] = useState(null);
  const [resetLoading, setResetLoading] = useState(false);

  // Registration State
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [regData, setRegData] = useState({
    role: 'STUDENT',
    full_name: '',
    email: '',
    phone: '',
    password: '',
    qualification: 'B.Tech',
    branch: '',
    passout_year: '2026',
    college_name: '',
    company_name: '',
    department: '',
    designation: '',
    household_name: '',
    residential_address: ''
  });
  const [regLoading, setRegLoading] = useState(false);

  const executeAuth = async (loginEmail, loginPwd) => {
    setLoading(true);
    setError('');

    try {
      const cleanEmail = loginEmail.trim().toLowerCase();

      if (rememberEmail) {
        localStorage.setItem('lm_remembered_email', cleanEmail);
      } else {
        localStorage.removeItem('lm_remembered_email');
      }

      let res = await fetch(`${BASE_URL}/api/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: loginPwd })
      });

      // If /api/login/ returns 405 or 404, seamlessly fall back to /api/admin/login
      if (res.status === 405 || res.status === 404) {
        res = await fetch(`${BASE_URL}/api/admin/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, username: cleanEmail, password: loginPwd })
        });
      }

      let data = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }
      setLoading(false);

      const authToken = data.token || data.access;
      if (res.ok && authToken) {
        // Also persist admin_token for company admin sync
        if (data.user && ['SUPER_ADMIN', 'CONTENT_MANAGER', 'SUPPORT_ADMIN', 'ADMIN'].includes(data.user.role)) {
          localStorage.setItem('admin_token', authToken);
        }
        const authPayload = { ...data, token: authToken };
        if (onLoginSuccess) {
          onLoginSuccess(authPayload);
        } else {
          onNavigate(['SUPER_ADMIN', 'CONTENT_MANAGER', 'SUPPORT_ADMIN', 'ADMIN'].includes(data.user?.role) ? 'admin' : 'v3');
        }
      } else {
        if (res.status === 401 || res.status === 400) {
          setError(data.error || data.detail || 'Invalid email address or password. Please verify your credentials.');
        } else if (res.status >= 500) {
          setError('Authentication server is warming up or updating. Please retry in a few seconds.');
        } else {
          setError(data.error || data.detail || `Authentication failed (${res.status}). Please try again.`);
        }
      }
    } catch (err) {
      console.error('Authentication network error:', err);
      setLoading(false);
      setError('Unable to reach the authentication service. Please check your network connection and retry.');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both your registered email address and password.');
      return;
    }
    executeAuth(email, password);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegLoading(true);
    setError('');

    if (!regData.email || !regData.password || !regData.full_name) {
      setError('Please provide your full name, email address, and a secure password.');
      setRegLoading(false);
      return;
    }

    if (regData.password.length < 8) {
      setError('Password must contain at least 8 characters.');
      setRegLoading(false);
      return;
    }
    if (!/[A-Z]/.test(regData.password) || !/[a-z]/.test(regData.password) || !/[0-9]/.test(regData.password)) {
      setError('Password must include at least one uppercase letter, one lowercase letter, and one number.');
      setRegLoading(false);
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/api/auth/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regData)
      });
      const data = await res.json();
      setRegLoading(false);

      if (res.ok && data.token) {
        if (onLoginSuccess) {
          onLoginSuccess(data);
        } else {
          onNavigate('v3');
        }
      } else {
        setError(data.error || 'Failed to create account. Please check the details provided.');
      }
    } catch (err) {
      console.error('Registration network error:', err);
      setRegLoading(false);
      setError('Unable to reach registration server. Please try again.');
    }
  };

  const handleForgotPasswordRequest = async (e) => {
    e.preventDefault();
    if (!resetEmail) return;
    setResetLoading(true);
    setResetMessage(null);

    try {
      const res = await fetch(`${BASE_URL}/api/auth/forgot-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail.trim().toLowerCase() })
      });
      const data = await res.json();
      setResetLoading(false);

      if (res.ok) {
        setResetMessage({
          type: 'success',
          text: data.message || 'If an account matches this email, secure password reset instructions have been dispatched.'
        });
        setResetStep('submit');
      } else {
        setResetMessage({
          type: 'error',
          text: data.error || 'Unable to process reset request. Please check the email format.'
        });
      }
    } catch (err) {
      setResetLoading(false);
      setResetMessage({ type: 'error', text: 'Network connection issue. Please retry in a moment.' });
    }
  };

  const handlePasswordResetSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword) return;
    setResetLoading(true);
    setResetMessage(null);

    try {
      const res = await fetch(`${BASE_URL}/api/auth/reset-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail.trim().toLowerCase(), new_password: newPassword, token: resetToken })
      });
      const data = await res.json();
      setResetLoading(false);

      if (res.ok) {
        setResetMessage({ type: 'success', text: 'Password successfully updated! You may now sign in with your new password.' });
        setTimeout(() => {
          setForgotModalOpen(false);
          setResetStep('request');
          setResetMessage(null);
        }, 2200);
      } else {
        setResetMessage({ type: 'error', text: data.error || 'Password reset failed. Invalid or expired token.' });
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
      className="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-[#FAF9F5] via-[#F5F4EC] to-[#ECE9DF] text-stone-900 px-4 sm:px-6 lg:px-8 py-8 sm:py-12 min-h-[calc(100vh-80px)] relative overflow-hidden selection:bg-emerald-200 selection:text-emerald-900"
    >
      {/* Architectural Blueprint Grid Pattern */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.4]"
        style={{
          backgroundImage: 'radial-gradient(#064e3b12 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />

      {/* Luxury Ambient Lighting Glows */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[720px] h-[380px] rounded-full blur-[140px] pointer-events-none opacity-45"
        style={{ background: 'radial-gradient(circle, rgba(16, 185, 129, 0.16) 0%, transparent 70%)' }}
      />
      <div
        className="absolute bottom-6 right-8 w-[420px] h-[420px] rounded-full blur-[130px] pointer-events-none opacity-35"
        style={{ background: 'radial-gradient(circle, rgba(217, 119, 6, 0.1) 0%, transparent 70%)' }}
      />
      <div
        className="absolute top-1/3 -left-20 w-80 h-80 rounded-full blur-[120px] pointer-events-none opacity-25"
        style={{ background: 'radial-gradient(circle, rgba(13, 148, 136, 0.12) 0%, transparent 70%)' }}
      />

      <div className="max-w-[460px] w-full z-10 space-y-5 sm:space-y-6">
        
        {/* Brand Crest & Heading */}
        <div className="text-center space-y-3">
          <div className="relative inline-block">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-white border border-stone-200/90 shadow-[0_8px_24px_rgba(28,25,23,0.08)] ring-1 ring-emerald-900/10 flex items-center justify-center p-2.5 transition-transform duration-300 hover:scale-105">
              <img
                src={(logoUrl && (logoUrl.startsWith('/media/') ? `${BASE_URL}${logoUrl}` : logoUrl)) || '/lm_logo.png'}
                alt="Landscape Mastery Logo"
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/lm_logo.png'; }}
                className="w-11 h-11 object-contain"
              />
            </div>
            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center ring-2 ring-white shadow-sm">
              <Sparkles className="w-2.5 h-2.5" />
            </span>
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/5 border border-emerald-900/10 text-emerald-900 text-[11px] font-bold tracking-widest uppercase mb-2">
              {isAdmin ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Director Console</span>
                </>
              ) : (
                <>
                  <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Student Learning Portal</span>
                </>
              )}
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-black text-stone-900 tracking-tight leading-tight">
              Landscape Mastery
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 mt-1">
              {isAdmin
                ? 'Authorized director access & masterclass governance'
                : 'Sign in to access your architectural masterclass lessons & video streams'}
            </p>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3.5 bg-rose-50 border border-rose-200/90 text-rose-800 text-xs font-semibold rounded-2xl shadow-sm flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed flex-1">{error}</div>
          </motion.div>
        )}

        {/* Master Authentication Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="bg-white/95 border border-stone-200/90 rounded-3xl p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(28,25,23,0.08),0_1px_3px_rgba(28,25,23,0.04)] backdrop-blur-2xl space-y-5 ring-1 ring-stone-900/[0.04] relative"
        >
          {/* Card Context Ribbon & Tab Toggle */}
          <div className="pb-4 border-b border-stone-100 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-lg sm:text-xl font-bold text-stone-900">
                  {isAdmin
                    ? 'Administrator Sign In'
                    : (authMode === 'login' ? 'Account Sign In' : 'Create New Account')}
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  {isAdmin
                    ? 'Enter your director credentials to access the console.'
                    : (authMode === 'login'
                      ? 'Enter your registered credentials to resume learning.'
                      : 'Register your Student, Employee, or Household profile.')}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 shrink-0">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>{isAdmin ? 'Director' : (authMode === 'login' ? 'Member' : 'Universal')}</span>
              </span>
            </div>

            {/* Login / Register Toggle Tabs (For non-admin portal) */}
            {!isAdmin && (
              <div className="flex bg-stone-100/80 p-1 rounded-xl text-xs font-bold text-stone-600">
                <button
                  type="button"
                  onClick={() => { setAuthMode('login'); setError(''); }}
                  className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                    authMode === 'login'
                      ? 'bg-white text-emerald-950 shadow-2xs font-extrabold'
                      : 'hover:text-stone-900'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode('register'); setError(''); }}
                  className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                    authMode === 'register'
                      ? 'bg-white text-emerald-950 shadow-2xs font-extrabold'
                      : 'hover:text-stone-900'
                  }`}
                >
                  Create Account
                </button>
              </div>
            )}
          </div>

          {authMode === 'login' ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider pl-0.5">
                {isAdmin ? 'Administrator Email' : 'Student Email Address'}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400 group-focus-within:text-emerald-700 transition-colors">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-stone-50/90 border border-stone-200/90 hover:border-stone-300 focus:bg-white rounded-xl pl-10 pr-4 py-3 text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 transition-all shadow-xs"
                  type="email"
                  placeholder={isAdmin ? "admin@domain.com" : "student@domain.com"}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center pl-0.5">
                <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => { setForgotModalOpen(true); setResetEmail(email); }}
                  className="text-[11px] text-emerald-700 hover:text-emerald-800 transition-colors font-semibold cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400 group-focus-within:text-emerald-700 transition-colors">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-stone-50/90 border border-stone-200/90 hover:border-stone-300 focus:bg-white rounded-xl pl-10 pr-11 py-3 text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 transition-all shadow-xs"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-700 cursor-pointer transition-colors"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-stone-600 select-none">
                <input
                  type="checkbox"
                  checked={rememberEmail}
                  onChange={(e) => setRememberEmail(e.target.checked)}
                  className="w-4 h-4 rounded border-stone-300 text-emerald-700 focus:ring-emerald-600/20 cursor-pointer"
                />
                <span>Remember this email</span>
              </label>
            </div>

            {/* Primary Sign In Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-emerald-950 via-emerald-800 to-teal-900 hover:from-emerald-900 hover:to-teal-800 text-white font-bold text-xs sm:text-sm tracking-wide shadow-lg shadow-emerald-950/20 hover:shadow-xl hover:shadow-emerald-950/30 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60 disabled:hover:scale-100"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>{isAdmin ? 'Sign In to Admin Operations' : 'Sign In to Portal'}</span>
                    <ArrowRight className="w-4 h-4 opacity-90" />
                  </>
                )}
              </button>
            </div>
          </form>
          ) : (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            {/* Account Type Selector */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider pl-0.5">
                Account Type <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'STUDENT', label: 'Student' },
                  { id: 'EMPLOYEE', label: 'Employee' },
                  { id: 'HOUSEHOLD', label: 'Household' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setRegData({ ...regData, role: item.id })}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      regData.role === item.id
                        ? 'bg-emerald-900 text-white border-emerald-900 shadow-sm'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Full Name */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider pl-0.5">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                required
                type="text"
                value={regData.full_name}
                onChange={(e) => setRegData({ ...regData, full_name: e.target.value })}
                placeholder="e.g. Surya Prakash Reddy Nallimilli"
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
              />
            </div>

            {/* Email Address */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider pl-0.5">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                required
                type="email"
                value={regData.email}
                onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                placeholder="name@domain.com"
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
              />
            </div>

            {/* Mobile Number */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider pl-0.5">
                Mobile Number
              </label>
              <input
                type="tel"
                value={regData.phone}
                onChange={(e) => setRegData({ ...regData, phone: e.target.value })}
                placeholder="+91 8074290125"
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
              />
            </div>

            {/* Role-Specific Fields */}
            {regData.role === 'STUDENT' && (
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-stone-100">
                <div>
                  <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">Qualification</label>
                  <select
                    value={regData.qualification}
                    onChange={(e) => setRegData({ ...regData, qualification: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-2 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-emerald-600 cursor-pointer"
                  >
                    <option value="B.Tech">B.Tech</option>
                    <option value="B.Arch">B.Arch</option>
                    <option value="B.Des">B.Des</option>
                    <option value="B.Sc">B.Sc</option>
                    <option value="M.Tech">M.Tech</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">College Name</label>
                  <input
                    type="text"
                    value={regData.college_name}
                    onChange={(e) => setRegData({ ...regData, college_name: e.target.value })}
                    placeholder="Sri Vasavi Eng College"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-2 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>
            )}

            {regData.role === 'EMPLOYEE' && (
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-stone-100">
                <div>
                  <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">Company</label>
                  <input
                    type="text"
                    value={regData.company_name}
                    onChange={(e) => setRegData({ ...regData, company_name: e.target.value })}
                    placeholder="3CAPSTECH"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-2 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">Department</label>
                  <input
                    type="text"
                    value={regData.department}
                    onChange={(e) => setRegData({ ...regData, department: e.target.value })}
                    placeholder="Engineering / Cloud"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-2 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>
            )}

            {regData.role === 'HOUSEHOLD' && (
              <div className="pt-1 border-t border-stone-100 space-y-2">
                <div>
                  <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">Household Name / Title</label>
                  <input
                    type="text"
                    value={regData.household_name}
                    onChange={(e) => setRegData({ ...regData, household_name: e.target.value })}
                    placeholder="Sharma Residence"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-2 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>
            )}

            {/* Password */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider pl-0.5">
                Password <span className="text-rose-500">*</span>
              </label>
              <input
                required
                type="password"
                value={regData.password}
                onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                placeholder="Min 8 chars, uppercase, lowercase, number"
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
              />
            </div>

            <button
              type="submit"
              disabled={regLoading}
              className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-emerald-950 via-emerald-800 to-teal-900 hover:from-emerald-900 hover:to-teal-800 text-white font-bold text-xs sm:text-sm tracking-wide shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {regLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create {regData.role === 'STUDENT' ? 'Student' : (regData.role === 'EMPLOYEE' ? 'Employee' : 'Household')} Account</span>
                  <ArrowRight className="w-4 h-4 opacity-90" />
                </>
              )}
            </button>
          </form>
          )}

          {/* Card Bottom Links */}
          <div className="pt-3 border-t border-stone-100 flex flex-col gap-2 text-center text-xs">
            <button
              onClick={() => onNavigate('v1')}
              className="text-stone-500 hover:text-stone-900 transition-colors font-medium cursor-pointer inline-flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Landscape Mastery Landing</span>
            </button>
          </div>
        </motion.div>
      </div>

      {/* Forgot Password Recovery Modal */}
      <AnimatePresence>
        {forgotModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl border border-stone-200/90 space-y-4 text-stone-900 ring-1 ring-stone-900/5"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <h3 className="font-serif text-lg font-bold text-stone-900">Account Recovery</h3>
                </div>
                <button
                  onClick={() => setForgotModalOpen(false)}
                  className="text-stone-400 hover:text-stone-700 cursor-pointer p-1 rounded-lg hover:bg-stone-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {resetMessage && (
                <div className={`p-3 rounded-xl text-xs font-semibold ${
                  resetMessage.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' :
                  'bg-rose-50 border border-rose-200 text-rose-800'
                }`}>
                  {resetMessage.text}
                </div>
              )}

              {resetStep === 'request' ? (
                <form onSubmit={handleForgotPasswordRequest} className="space-y-4">
                  <p className="text-xs text-stone-500 leading-relaxed">
                    Enter your account email. If registered, secure recovery instructions will be dispatched.
                  </p>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="name@domain.com"
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="w-full bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs py-3 rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    {resetLoading ? 'Dispatching...' : 'Request Password Reset'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handlePasswordResetSubmit} className="space-y-3">
                  <p className="text-xs text-stone-500 leading-relaxed">
                    Enter your new secure password for <b>{resetEmail}</b>:
                  </p>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">New Password</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">Security Token / Code (Optional)</label>
                    <input
                      type="text"
                      value={resetToken}
                      onChange={(e) => setResetToken(e.target.value)}
                      placeholder="Leave empty or enter code"
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="w-full bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs py-3 rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
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
