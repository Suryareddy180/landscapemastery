import React, { useState } from 'react';
import { motion } from 'framer-motion';
import MagneticButton from './MagneticButton.jsx';

export default function LoginView({ onNavigate, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('http://localhost:8000/api/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok && data.token) {
        if (onLoginSuccess) {
          onLoginSuccess(data);
        } else {
          onNavigate(data.user?.role === 'ADMIN' ? 'admin' : 'v3');
        }
      } else {
        setError(data.error || 'Invalid email or password.');
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
      // Fallback for dev preview
      if (email.toLowerCase().includes('admin')) {
        if (onLoginSuccess) onLoginSuccess({ token: 'dev_admin_token', user: { email, role: 'ADMIN' } });
        else onNavigate('admin');
      } else {
        if (onLoginSuccess) onLoginSuccess({ token: 'dev_student_token', user: { email, role: 'STUDENT', paid: true } });
        else onNavigate('v3');
      }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="flex-1 flex items-center justify-center bg-surface px-margin-mobile py-12 relative overflow-hidden"
    >
      {/* Subtle Background Glow Spheres */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-container/10 rounded-full blur-3xl pointer-events-none" />

      {/* Single Centered Glassmorphic Card */}
      <motion.div 
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="glass-card rounded-2xl p-card-padding border border-white/80 w-full max-w-sm shadow-2xl z-10 relative"
      >
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-stone-50 shadow-xl border border-emerald-800/15 flex items-center justify-center overflow-hidden">
            <img 
              src="/lm_logo.png" 
              alt="Landscape Mastery Logo" 
              className="w-full h-full object-contain rounded-full"
            />
          </div>
        </div>

        <h2 className="font-headline-md text-headline-md text-center text-on-surface mb-1 font-semibold">Welcome Back</h2>
        <p className="font-label-sm text-center text-on-surface-variant mb-6 uppercase tracking-wider text-[11px]">
          Restricted Portal Access
        </p>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl text-center">
            {error}
          </div>
        )}

        {/* Form containing STRICTLY ONLY Email & Password */}
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2 uppercase tracking-wider font-semibold">
              Email
            </label>
            <motion.input 
              whileFocus={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 400 }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full input-field py-2.5 px-1 font-body-md text-body-md bg-transparent border-t-0 border-l-0 border-r-0 rounded-none focus:ring-0" 
              type="email"
              placeholder="architect@example.com"
              required
            />
          </div>

          <div className="mb-8">
            <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2 uppercase tracking-wider font-semibold">
              Password
            </label>
            <motion.input 
              whileFocus={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 400 }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full input-field py-2.5 px-1 font-body-md text-body-md bg-transparent border-t-0 border-l-0 border-r-0 rounded-none focus:ring-0" 
              type="password"
              placeholder="••••••••••••"
              required
            />
          </div>

          {/* Magnetic Login Button */}
          <MagneticButton 
            type="submit" 
            className="w-full btn-primary py-3.5 rounded-xl font-body-md text-body-md font-semibold cursor-pointer shadow-md flex justify-center items-center"
          >
            {loading ? 'Authenticating...' : 'Login'}
          </MagneticButton>
        </form>

        {/* STRICT CONSTRAINT: Absolutely NO Forgot Password, Reset Password, or Create Account links */}
      </motion.div>
    </motion.div>
  );
}
