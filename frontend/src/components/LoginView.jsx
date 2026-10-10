import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MagneticButton from './MagneticButton.jsx';
import { BASE_URL } from '../lib/api.js';

export default function LoginView({ onNavigate, onLoginSuccess, logoUrl, isAdminPortal = false }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Password Recovery State
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [resetStep, setResetStep] = useState('request'); // 'request' | 'submit'
  const [resetMessage, setResetMessage] = useState(null);
  const [resetLoading, setResetLoading] = useState(false);

  const executeAuth = async (loginEmail, loginPwd) => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${BASE_URL}/api/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail.trim().toLowerCase(), password: loginPwd })
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok && data.token) {
        // Also persist admin_token for company admin sync
        if (data.user && ['SUPER_ADMIN', 'CONTENT_MANAGER', 'SUPPORT_ADMIN', 'ADMIN'].includes(data.user.role)) {
          localStorage.setItem('admin_token', data.token);
        }
        if (onLoginSuccess) {
          onLoginSuccess(data);
        } else {
          onNavigate(['SUPER_ADMIN', 'CONTENT_MANAGER', 'SUPPORT_ADMIN', 'ADMIN'].includes(data.user?.role) ? 'admin' : 'v3');
        }
      } else {
        setError(data.error || 'Invalid email address or password.');
      }
    } catch (err) {
      console.error('Authentication network error:', err);
      setLoading(false);
      setError('Unable to connect to the authentication server. Please verify your connection.');
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
      setResetMessage({ type: 'success', text: data.message || 'If an account exists with this email, recovery instructions have been dispatched.' });
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
      className="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-[#FAF9F5] via-[#F4F3ED] to-[#ECEAE3] text-stone-900 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 min-h-[calc(100vh-80px)] relative overflow-hidden selection:bg-emerald-200 selection:text-emerald-900"
    >
      {/* Ambient Lighting Accents */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[380px] rounded-full blur-[140px] pointer-events-none opacity-40"
        style={{ background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)' }}
      />
      <div 
        className="absolute bottom-10 right-10 w-96 h-96 rounded-full blur-[130px] pointer-events-none opacity-30"
        style={{ background: 'radial-gradient(circle, rgba(217, 119, 6, 0.08) 0%, transparent 70%)' }}
      />

      <div className="max-w-md w-full z-10 space-y-4 sm:space-y-5">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-white border border-stone-200/90 shadow-[0_4px_16px_rgba(28,25,23,0.06)] ring-1 ring-stone-900/5 flex items-center justify-center p-2 overflow-hidden">
            <img 
              src={(logoUrl && (logoUrl.startsWith('/media/') ? `${BASE_URL}${logoUrl}` : logoUrl)) || '/lm_logo.png'} 
              alt="Landscape Mastery Logo" 
              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/lm_logo.png'; }}
              className="w-10 h-10 object-contain max-w-[40px] max-h-[40px]" 
            />
          </div>
          <div>
            <div className="flex items-center justify-center gap-2 mb-0.5">
              <h1 className="font-serif text-2xl font-bold text-stone-900 tracking-tight">
                Landscape Mastery
              </h1>
              {isAdminPortal && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Admin
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500">
              {isAdminPortal 
                ? 'Sign in with an authorized administrative account' 
                : 'Architectural Masterclass & Student Portal'}
            </p>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-rose-50 border border-rose-200/90 text-rose-800 text-xs font-semibold rounded-2xl text-center shadow-sm flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-base text-rose-600">error</span>
            <span>{error}</span>
          </motion.div>
        )}

        {/* Production Sign In Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="bg-white/95 border border-stone-200/90 rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(28,25,23,0.07),0_1px_2px_rgba(28,25,23,0.04)] backdrop-blur-xl space-y-5 ring-1 ring-stone-900/[0.03]"
        >
          <div>
            <h2 className="font-serif text-lg sm:text-xl font-bold text-stone-900">
              {isAdminPortal ? 'Administrator Sign In' : 'Sign In to Your Account'}
            </h2>
            <p className="text-xs text-stone-500 mt-1 leading-relaxed">
              {isAdminPortal
                ? 'Enter your director credentials to access masterclass configuration and governance.'
                : 'Enter your credentials to access your masterclasses and learning modules.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <span className="material-symbols-outlined text-base">mail</span>
                </div>
                <input 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-stone-50/80 border border-stone-200 hover:border-stone-300 focus:bg-white rounded-xl pl-10 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 transition-all shadow-xs" 
                  type="email"
                  placeholder="name@domain.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
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
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <span className="material-symbols-outlined text-base">lock</span>
                </div>
                <input 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-stone-50/80 border border-stone-200 hover:border-stone-300 focus:bg-white rounded-xl pl-10 pr-10 py-2.5 sm:py-3 text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 transition-all shadow-xs" 
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-700 cursor-pointer transition-colors"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  <span className="material-symbols-outlined text-base">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <div className="pt-2">
              <MagneticButton 
                type="submit" 
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 hover:from-emerald-700 hover:to-teal-700 text-white py-3 sm:py-3.5 rounded-xl font-semibold text-xs sm:text-sm cursor-pointer shadow-md shadow-emerald-900/15 hover:shadow-lg hover:shadow-emerald-900/25 flex justify-center items-center gap-2 transition-all duration-200 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">login</span>
                    <span>Sign In to Portal</span>
                  </>
                )}
              </MagneticButton>
            </div>
          </form>

          <div className="pt-4 border-t border-stone-100 flex flex-col gap-2 text-center text-xs">
            <button
              onClick={() => onNavigate('v1')}
              className="text-stone-500 hover:text-stone-900 transition-colors font-medium cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
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
              className="bg-white rounded-3xl p-7 max-w-sm w-full shadow-2xl border border-stone-200/90 space-y-4 text-stone-900 ring-1 ring-stone-900/5"
            >
              <div className="flex justify-between items-center">
                <h3 className="font-serif text-lg font-bold text-stone-900">Account Recovery</h3>
                <button 
                  onClick={() => setForgotModalOpen(false)}
                  className="text-stone-400 hover:text-stone-700 cursor-pointer p-1"
                >
                  <span className="material-symbols-outlined">close</span>
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
                    className="w-full bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs py-2.5 rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
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
                    className="w-full bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs py-2.5 rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
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
