import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, Phone, Calendar, GraduationCap, Briefcase, Home,
  Lock, Trash2, Camera, Upload, X, Check, AlertTriangle, ShieldCheck,
  Eye, EyeOff, RefreshCw, KeyRound, CheckCircle2, AlertCircle, ChevronRight
} from 'lucide-react';
import { BASE_URL } from '../lib/api.js';

export default function ProfileModal({
  isOpen,
  onClose,
  token,
  user,
  onUserUpdated,
  onLogout
}) {
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'security' | 'delete'
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Edit Profile Form State
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    dob: '',
    email: '',
    // Student fields
    qualification: '',
    branch: '',
    passout_year: '',
    college_name: '',
    student_status: 'Still Studying',
    student_id: '',
    // Employee fields
    employee_id: '',
    company_name: '',
    department: '',
    designation: '',
    employment_status: 'Full-Time',
    // Household fields
    household_name: '',
    household_id: '',
    primary_contact_name: '',
    residential_address: '',
    member_count: 1
  });

  // Password Change Form State
  const [pwdData, setPwdData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState(null);
  const [pwdSuccess, setPwdSuccess] = useState(null);

  // Delete Account Form State
  const [deletePwd, setDeletePwd] = useState('');
  const [acknowledgeDelete, setAcknowledgeDelete] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  // Avatar Upload State
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen && token) {
      fetchProfile();
      setActiveTab('profile');
      setError(null);
      setSuccessMsg(null);
      setPwdError(null);
      setPwdSuccess(null);
      setDeleteError(null);
    }
  }, [isOpen, token]);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/api/profile/`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setFormData({
          full_name: data.full_name || '',
          phone: data.phone || '',
          dob: data.dob || '',
          email: data.email || '',
          qualification: data.qualification || '',
          branch: data.branch || '',
          passout_year: data.passout_year || '',
          college_name: data.college_name || '',
          student_status: data.student_status || 'Still Studying',
          student_id: data.student_id || '',
          employee_id: data.employee_id || '',
          company_name: data.company_name || '',
          department: data.department || '',
          designation: data.designation || '',
          employment_status: data.employment_status || 'Full-Time',
          household_name: data.household_name || '',
          household_id: data.household_id || '',
          primary_contact_name: data.primary_contact_name || '',
          residential_address: data.residential_address || '',
          member_count: data.member_count || 1
        });
        setAvatarPreview(data.avatar ? (data.avatar.startsWith('http') ? data.avatar : `${BASE_URL}${data.avatar}`) : null);
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || 'Failed to load profile details.');
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
      setError('Unable to reach backend profile service.');
    } finally {
      setLoading(false);
    }
  };

  // --- Handle Avatar File Selection ---
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (5 MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Selected image exceeds the 5 MB maximum size limit.');
      return;
    }

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Only JPG, PNG, and WebP image formats are permitted.');
      return;
    }

    // Create local preview immediately
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);

    // Upload to server
    setAvatarLoading(true);
    setError(null);
    setSuccessMsg(null);

    const uploadData = new FormData();
    uploadData.append('avatar', file);

    try {
      const res = await fetch(`${BASE_URL}/api/profile/upload-picture/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: uploadData
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg('Profile picture updated successfully!');
        if (data.profile) {
          setProfile(data.profile);
          const fullAvatarUrl = data.profile.avatar ? (data.profile.avatar.startsWith('http') ? data.profile.avatar : `${BASE_URL}${data.profile.avatar}`) : null;
          setAvatarPreview(fullAvatarUrl);
          if (onUserUpdated) {
            onUserUpdated({ ...user, avatar: fullAvatarUrl });
          }
        }
      } else {
        setError(data.error || 'Failed to upload image.');
        setAvatarPreview(profile?.avatar ? (profile.avatar.startsWith('http') ? profile.avatar : `${BASE_URL}${profile.avatar}`) : null);
      }
    } catch (err) {
      console.error('Avatar upload error:', err);
      setError('Network error while uploading profile picture.');
    } finally {
      setAvatarLoading(false);
    }
  };

  // --- Handle Avatar Removal ---
  const handleRemoveAvatar = async () => {
    if (!profile?.avatar && !avatarPreview) return;
    setAvatarLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`${BASE_URL}/api/profile/picture/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setAvatarPreview(null);
        setSuccessMsg('Profile picture removed. Default avatar restored.');
        if (data.profile) {
          setProfile(data.profile);
          if (onUserUpdated) {
            onUserUpdated({ ...user, avatar: null });
          }
        }
      } else {
        setError(data.error || 'Failed to remove profile picture.');
      }
    } catch (err) {
      setError('Network error removing picture.');
    } finally {
      setAvatarLoading(false);
    }
  };

  // --- Save Profile Changes (PATCH) ---
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    // Validation
    if (!formData.full_name.trim()) {
      setError('Full Name is required.');
      setSaving(false);
      return;
    }
    if (!formData.phone.trim()) {
      setError('Mobile Number is required.');
      setSaving(false);
      return;
    }
    if (formData.dob) {
      const today = new Date().toISOString().split('T')[0];
      if (formData.dob > today) {
        setError('Date of Birth cannot be in the future.');
        setSaving(false);
        return;
      }
    }

    try {
      const res = await fetch(`${BASE_URL}/api/profile/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg('Profile details saved successfully!');
        if (data.profile) {
          setProfile(data.profile);
          if (onUserUpdated) {
            onUserUpdated({
              ...user,
              name: data.profile.full_name,
              phone: data.profile.phone,
              email: data.profile.email
            });
          }
        }
      } else {
        setError(data.error || 'Failed to update profile.');
      }
    } catch (err) {
      console.error('Save profile error:', err);
      setError('Network error saving profile changes.');
    } finally {
      setSaving(false);
    }
  };

  // --- Change Password Flow ---
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdLoading(true);
    setPwdError(null);
    setPwdSuccess(null);

    // Client-side validations
    if (!pwdData.current_password) {
      setPwdError('Please enter your current password.');
      setPwdLoading(false);
      return;
    }
    if (pwdData.new_password.length < 8) {
      setPwdError('New password must contain at least 8 characters.');
      setPwdLoading(false);
      return;
    }
    if (!/[A-Z]/.test(pwdData.new_password)) {
      setPwdError('New password must include at least one uppercase letter (A-Z).');
      setPwdLoading(false);
      return;
    }
    if (!/[a-z]/.test(pwdData.new_password)) {
      setPwdError('New password must include at least one lowercase letter (a-z).');
      setPwdLoading(false);
      return;
    }
    if (!/[0-9]/.test(pwdData.new_password)) {
      setPwdError('New password must include at least one numeric digit (0-9).');
      setPwdLoading(false);
      return;
    }
    if (pwdData.new_password !== pwdData.confirm_password) {
      setPwdError('New password and confirmation password do not match.');
      setPwdLoading(false);
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/api/profile/change-password/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(pwdData)
      });
      const data = await res.json();
      if (res.ok) {
        setPwdSuccess('Password changed successfully! Keep your new credentials safe.');
        setPwdData({ current_password: '', new_password: '', confirm_password: '' });
        // Update stored token if refreshed
        if (data.token) {
          localStorage.setItem('lm_auth_token', data.token);
        }
      } else {
        setPwdError(data.error || 'Unable to update password. Verify current password.');
      }
    } catch (err) {
      setPwdError('Network error while changing password.');
    } finally {
      setPwdLoading(false);
    }
  };

  // --- Delete Account Flow ---
  const handleExecuteDelete = async () => {
    setDeleteLoading(true);
    setDeleteError(null);

    if (!acknowledgeDelete) {
      setDeleteError('You must acknowledge that account deletion cannot be undone.');
      setDeleteLoading(false);
      setConfirmModalOpen(false);
      return;
    }
    if (!deletePwd) {
      setDeleteError('Please enter your current password to verify identity.');
      setDeleteLoading(false);
      setConfirmModalOpen(false);
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/api/profile/delete-account/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          password: deletePwd,
          acknowledge: acknowledgeDelete
        })
      });
      const data = await res.json();
      if (res.ok) {
        setConfirmModalOpen(false);
        onClose();
        if (onLogout) {
          onLogout();
        }
      } else {
        setConfirmModalOpen(false);
        setDeleteError(data.error || 'Account deletion failed. Verify your password.');
      }
    } catch (err) {
      setConfirmModalOpen(false);
      setDeleteError('Network error during account deletion.');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!isOpen) return null;

  const role = profile?.role || user?.role || 'STUDENT';
  const roleLabel = {
    STUDENT: 'Student Scholar',
    EMPLOYEE: 'Corporate Employee',
    HOUSEHOLD: 'Household Resident',
    SUPER_ADMIN: 'Super Administrator',
    INSTRUCTOR: 'Course Instructor',
    CONTENT_MANAGER: 'Content Manager',
    SUPPORT_ADMIN: 'Support Admin',
    ADMIN: 'Administrator'
  }[role] || role;

  const roleBadgeColor = {
    STUDENT: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    EMPLOYEE: 'bg-blue-50 text-blue-800 border-blue-200',
    HOUSEHOLD: 'bg-amber-50 text-amber-800 border-amber-200',
    SUPER_ADMIN: 'bg-purple-50 text-purple-800 border-purple-200',
    INSTRUCTOR: 'bg-emerald-100/80 text-emerald-900 border-emerald-300 font-bold',
    ADMIN: 'bg-purple-50 text-purple-800 border-purple-200'
  }[role] || 'bg-stone-50 text-stone-800 border-stone-200';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 xs:p-3 sm:p-5 overflow-y-auto bg-stone-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-3xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-stone-200/90 overflow-hidden flex flex-col max-h-[94vh] text-stone-900"
      >
        {/* ============================================================== */}
        {/* HEADER & AVATAR BANNER                                         */}
        {/* ============================================================== */}
        <div className="relative bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 p-4 sm:p-8 text-white flex-shrink-0">
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-3 right-3 sm:top-5 sm:right-5 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-sm z-10"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5">
            {/* Circular Avatar with Camera Overlay */}
            <div className="relative group flex-shrink-0">
              <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full border-4 border-white/30 shadow-xl overflow-hidden bg-stone-100 flex items-center justify-center relative">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt={formData.full_name || 'User Avatar'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white text-2xl sm:text-3xl font-serif font-bold">
                    {(formData.full_name || profile?.email || 'U')[0]?.toUpperCase()}
                  </div>
                )}
                {avatarLoading && (
                  <div className="absolute inset-0 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 text-white animate-spin" />
                  </div>
                )}
              </div>

              {/* Upload Trigger Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarLoading}
                title="Upload or change profile picture"
                className="absolute bottom-0 right-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg flex items-center justify-center transition-transform hover:scale-110 cursor-pointer border-2 border-white"
              >
                <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* User Meta Information */}
            <div className="flex-1 text-center sm:text-left space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-lg sm:text-2xl font-serif font-bold tracking-tight text-white truncate max-w-full">
                  {formData.full_name || profile?.email || 'Account Profile'}
                </h2>
                <span className={`text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border ${roleBadgeColor}`}>
                  {roleLabel}
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 text-xs text-emerald-100/90 font-medium">
                <span className="flex items-center gap-1.5 truncate max-w-full">
                  <Mail className="w-3.5 h-3.5 text-emerald-300 flex-shrink-0" />
                  <span className="truncate">{profile?.email}</span>
                  {profile?.email_verified ? (
                    <span className="inline-flex items-center gap-0.5 text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-full border border-emerald-400/30 flex-shrink-0">
                      <Check className="w-2.5 h-2.5" /> Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-full border border-amber-400/30 flex-shrink-0">
                      Unverified
                    </span>
                  )}
                </span>
                {profile?.created_at && (
                  <span className="flex items-center gap-1 opacity-75">
                    <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                    Member since {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                )}
              </div>

              {/* Avatar management actions */}
              {avatarPreview && (
                <div className="pt-1 flex items-center justify-center sm:justify-start gap-2">
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    disabled={avatarLoading}
                    className="text-[11px] text-rose-200 hover:text-white underline cursor-pointer transition-colors"
                  >
                    Remove picture &amp; restore default
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* NAVIGATION TABS                                                */}
        {/* ============================================================== */}
        <div className="flex border-b border-stone-200 bg-stone-50/80 px-3 sm:px-6 gap-1 sm:gap-2 text-xs font-bold text-stone-600 flex-shrink-0 overflow-x-auto no-scrollbar">
          <button
            onClick={() => { setActiveTab('profile'); setError(null); setSuccessMsg(null); }}
            className={`py-3 px-2 sm:px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer text-xs ${
              activeTab === 'profile'
                ? 'border-emerald-800 text-emerald-950 bg-white font-extrabold shadow-2xs'
                : 'border-transparent hover:text-stone-900 hover:bg-stone-100/60'
            }`}
          >
            <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-700" />
            <span>Profile Details</span>
          </button>
          <button
            onClick={() => { setActiveTab('security'); setPwdError(null); setPwdSuccess(null); }}
            className={`py-3 px-2 sm:px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer text-xs ${
              activeTab === 'security'
                ? 'border-emerald-800 text-emerald-950 bg-white font-extrabold shadow-2xs'
                : 'border-transparent hover:text-stone-900 hover:bg-stone-100/60'
            }`}
          >
            <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-700" />
            <span>Security &amp; Password</span>
          </button>
          <button
            onClick={() => { setActiveTab('delete'); setDeleteError(null); }}
            className={`py-3 px-2 sm:px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer text-xs ${
              activeTab === 'delete'
                ? 'border-rose-600 text-rose-800 bg-white font-extrabold shadow-2xs'
                : 'border-transparent hover:text-rose-700 hover:bg-stone-100/60'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-600" />
            <span>Delete Account</span>
          </button>
        </div>

        {/* ============================================================== */}
        {/* TAB CONTENTS (SCROLLABLE BODY)                                 */}
        {/* ============================================================== */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">

          {/* Global Alert Banners */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ------------------------------------------------------------ */}
          {/* TAB 1: PROFILE DETAILS (COMMON + ROLE-SPECIFIC)             */}
          {/* ------------------------------------------------------------ */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-6">

              {/* Section 1: Common Personal Details */}
              <div className="space-y-4">
                <div className="border-b border-stone-200 pb-2 flex items-center justify-between">
                  <h3 className="font-serif text-base font-bold text-stone-900 flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-800" />
                    <span>Personal Information</span>
                  </h3>
                  <span className="text-[11px] text-stone-400 font-mono">Shared Identity</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                      Mobile Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      max={new Date().toISOString().split('T')[0]}
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Role-Specific Details */}
              {role === 'STUDENT' && (
                <div className="space-y-4 pt-2">
                  <div className="border-b border-stone-200 pb-2 flex items-center justify-between">
                    <h3 className="font-serif text-base font-bold text-stone-900 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-emerald-800" />
                      <span>Academic &amp; Student Information</span>
                    </h3>
                    <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      ID: {formData.student_id || `STU-${user?.id || 1}`}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                        Qualification
                      </label>
                      <select
                        value={formData.qualification}
                        onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10 font-medium cursor-pointer"
                      >
                        <option value="">Select Qualification</option>
                        <option value="B.Tech">B.Tech (Bachelor of Technology)</option>
                        <option value="B.Arch">B.Arch (Bachelor of Architecture)</option>
                        <option value="B.Des">B.Des (Bachelor of Design)</option>
                        <option value="B.Sc">B.Sc (Bachelor of Science)</option>
                        <option value="M.Tech">M.Tech (Master of Technology)</option>
                        <option value="M.Arch">M.Arch (Master of Architecture)</option>
                        <option value="Diploma">Diploma / Polytechnic</option>
                        <option value="Other">Other Specialized Program</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                        Branch / Department
                      </label>
                      <input
                        type="text"
                        value={formData.branch}
                        onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                        College / University Name
                      </label>
                      <input
                        type="text"
                        value={formData.college_name}
                        onChange={(e) => setFormData({ ...formData, college_name: e.target.value })}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10 font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                          Passout Year
                        </label>
                        <input
                          type="number"
                          min="1950"
                          max="2040"
                          value={formData.passout_year}
                          onChange={(e) => setFormData({ ...formData, passout_year: e.target.value })}
                          className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                          Status
                        </label>
                        <select
                          value={formData.student_status}
                          onChange={(e) => setFormData({ ...formData, student_status: e.target.value })}
                          className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10 font-medium cursor-pointer"
                        >
                          <option value="Still Studying">Still Studying</option>
                          <option value="Graduated">Graduated</option>
                          <option value="Post-Graduate">Post-Graduate</option>
                          <option value="Interning">Interning</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Section 2: Employee Specific Details */}
              {(role === 'EMPLOYEE' || ['SUPER_ADMIN', 'INSTRUCTOR', 'CONTENT_MANAGER', 'SUPPORT_ADMIN', 'ADMIN'].includes(role)) && (
                <div className="space-y-4 pt-2">
                  <div className="border-b border-stone-200 pb-2 flex items-center justify-between">
                    <h3 className="font-serif text-base font-bold text-stone-900 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-blue-700" />
                      <span>Corporate &amp; Employment Details</span>
                    </h3>
                    <span className="text-[11px] text-blue-700 font-bold bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                      ID: {formData.employee_id || `EMP-${user?.id || 1}`}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                        Company / Organization
                      </label>
                      <input
                        type="text"
                        value={formData.company_name}
                        onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700/10 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                        Department
                      </label>
                      <input
                        type="text"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700/10 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                        Designation
                      </label>
                      <input
                        type="text"
                        value={formData.designation}
                        onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700/10 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                        Employment Status
                      </label>
                      <select
                        value={formData.employment_status}
                        onChange={(e) => setFormData({ ...formData, employment_status: e.target.value })}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700/10 font-medium cursor-pointer"
                      >
                        <option value="Full-Time">Full-Time Employee</option>
                        <option value="Part-Time">Part-Time</option>
                        <option value="Contract">Contract / Consultant</option>
                        <option value="Probation">On Probation</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Section 2: Household Specific Details */}
              {role === 'HOUSEHOLD' && (
                <div className="space-y-4 pt-2">
                  <div className="border-b border-stone-200 pb-2 flex items-center justify-between">
                    <h3 className="font-serif text-base font-bold text-stone-900 flex items-center gap-2">
                      <Home className="w-4 h-4 text-amber-700" />
                      <span>Household &amp; Residential Details</span>
                    </h3>
                    <span className="text-[11px] text-amber-700 font-bold bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                      ID: {formData.household_id || `HH-${user?.id || 1}`}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                        Household Name / Title
                      </label>
                      <input
                        type="text"
                        value={formData.household_name}
                        onChange={(e) => setFormData({ ...formData, household_name: e.target.value })}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-700/10 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                        Primary Contact Name
                      </label>
                      <input
                        type="text"
                        value={formData.primary_contact_name}
                        onChange={(e) => setFormData({ ...formData, primary_contact_name: e.target.value })}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-700/10 font-medium"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                        Residential Address
                      </label>
                      <textarea
                        rows={2}
                        value={formData.residential_address}
                        onChange={(e) => setFormData({ ...formData, residential_address: e.target.value })}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-700/10 font-medium resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                        Number of Household Members
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={formData.member_count}
                        onChange={(e) => setFormData({ ...formData, member_count: e.target.value })}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-700/10 font-medium"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Profile Changes Button */}
              <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-white font-bold text-xs tracking-wide shadow-md shadow-emerald-950/20 hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save Profile Details</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          )}

          {/* ------------------------------------------------------------ */}
          {/* TAB 2: SECURITY & PASSWORD CHANGE                            */}
          {/* ------------------------------------------------------------ */}
          {activeTab === 'security' && (
            <form onSubmit={handleChangePassword} className="space-y-6 max-w-xl mx-auto">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto mb-2 border border-emerald-100">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-lg font-bold text-stone-900">Change Account Password</h3>
                <p className="text-xs text-stone-500 max-w-md mx-auto">
                  Ensure your account remains safe by choosing an 8+ character password containing uppercase, lowercase, and numbers.
                </p>
              </div>

              {pwdError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{pwdError}</span>
                </div>
              )}
              {pwdSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{pwdSuccess}</span>
                </div>
              )}

              <div className="space-y-4">
                {/* Current Password */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                    Current Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPwd ? 'text' : 'password'}
                      required
                      value={pwdData.current_password}
                      onChange={(e) => setPwdData({ ...pwdData, current_password: e.target.value })}
                      placeholder="Enter current password"
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 pr-10 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                    >
                      {showCurrentPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                    New Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPwd ? 'text' : 'password'}
                      required
                      value={pwdData.new_password}
                      onChange={(e) => setPwdData({ ...pwdData, new_password: e.target.value })}
                      placeholder="Min 8 chars, uppercase, lowercase, number"
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 pr-10 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPwd(!showNewPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                    >
                      {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                    Confirm New Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPwd ? 'text' : 'password'}
                      required
                      value={pwdData.confirm_password}
                      onChange={(e) => setPwdData({ ...pwdData, confirm_password: e.target.value })}
                      placeholder="Re-type new password"
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 pr-10 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                    >
                      {showConfirmPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Requirements Indicators */}
                <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-1.5 text-[11px] text-stone-600">
                  <span className="font-bold text-stone-800 block mb-1">Password Policy Requirements:</span>
                  <div className="flex items-center gap-2">
                    <Check className={`w-3.5 h-3.5 ${pwdData.new_password.length >= 8 ? 'text-emerald-600 font-bold' : 'text-stone-300'}`} />
                    <span className={pwdData.new_password.length >= 8 ? 'text-emerald-900 font-semibold' : ''}>Minimum 8 characters length</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className={`w-3.5 h-3.5 ${/[A-Z]/.test(pwdData.new_password) ? 'text-emerald-600 font-bold' : 'text-stone-300'}`} />
                    <span className={/[A-Z]/.test(pwdData.new_password) ? 'text-emerald-900 font-semibold' : ''}>At least one uppercase character (A-Z)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className={`w-3.5 h-3.5 ${/[a-z]/.test(pwdData.new_password) ? 'text-emerald-600 font-bold' : 'text-stone-300'}`} />
                    <span className={/[a-z]/.test(pwdData.new_password) ? 'text-emerald-900 font-semibold' : ''}>At least one lowercase character (a-z)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className={`w-3.5 h-3.5 ${/[0-9]/.test(pwdData.new_password) ? 'text-emerald-600 font-bold' : 'text-stone-300'}`} />
                    <span className={/[0-9]/.test(pwdData.new_password) ? 'text-emerald-900 font-semibold' : ''}>At least one numeric digit (0-9)</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={pwdLoading}
                className="w-full py-3 px-5 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-white font-bold text-xs tracking-wide shadow-md shadow-emerald-950/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {pwdLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying &amp; Updating...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Update Account Password</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* ------------------------------------------------------------ */}
          {/* TAB 3: DELETE ACCOUNT                                        */}
          {/* ------------------------------------------------------------ */}
          {activeTab === 'delete' && (
            <div className="space-y-6 max-w-xl mx-auto">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
                  <AlertTriangle className="w-7 h-7" />
                </div>
                <h3 className="font-serif text-lg font-bold text-rose-950">Danger Zone: Delete Account</h3>
                <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
                  Once your account is deleted, your courses, active progress, certificate access, and personal credentials will be revoked immediately.
                </p>
              </div>

              {deleteError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{deleteError}</span>
                </div>
              )}

              <div className="p-5 rounded-2xl bg-rose-50/50 border border-rose-200 space-y-4">
                <div className="space-y-2 text-xs text-stone-700 leading-relaxed">
                  <p className="font-bold text-rose-900">Before proceeding, please note:</p>
                  <ul className="list-disc pl-5 space-y-1 text-stone-600">
                    <li>Your access to enrolled video modules and materials will be terminated.</li>
                    <li>Financial transaction records will remain archived securely for tax and statutory accounting compliance.</li>
                    <li>Uploaded personal images and credentials will be purged permanently.</li>
                  </ul>
                </div>

                {/* Mandatory Checkbox */}
                <label className="flex items-start gap-3 p-3 rounded-xl bg-white border border-rose-200 cursor-pointer hover:bg-rose-50/30 transition-colors">
                  <input
                    type="checkbox"
                    checked={acknowledgeDelete}
                    onChange={(e) => setAcknowledgeDelete(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-rose-600 rounded border-stone-300 focus:ring-rose-500 cursor-pointer"
                  />
                  <span className="text-xs font-medium text-stone-800 select-none">
                    I understand that deleting my account will remove my access to the courses and resources provided.
                  </span>
                </label>

                {/* Identity Re-verification */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                    Confirm Your Password <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={deletePwd}
                    onChange={(e) => setDeletePwd(e.target.value)}
                    placeholder="Enter current password to confirm identity"
                    className="w-full bg-white border border-rose-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-rose-600 focus:ring-2 focus:ring-rose-600/10 font-medium"
                  />
                </div>
              </div>

              <button
                type="button"
                disabled={!acknowledgeDelete || !deletePwd || deleteLoading}
                onClick={() => setConfirmModalOpen(true)}
                className="w-full py-3 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs tracking-wide shadow-md shadow-rose-900/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete My Account</span>
              </button>
            </div>
          )}

        </div>
      </motion.div>

      {/* ============================================================== */}
      {/* FINAL ACCOUNT DELETION CONFIRMATION DIALOG                     */}
      {/* ============================================================== */}
      <AnimatePresence>
        {confirmModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-60 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-stone-200 space-y-4 text-stone-900"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="text-center space-y-1.5">
                <h4 className="font-serif text-lg font-bold text-stone-900">Are you absolutely sure?</h4>
                <p className="text-xs text-stone-500 leading-relaxed">
                  This action is final and will deactivate your user account immediately. You will lose access to all your masterclasses and blueprints.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmModalOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  Keep Account
                </button>
                <button
                  type="button"
                  disabled={deleteLoading}
                  onClick={handleExecuteDelete}
                  className="w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs tracking-wide shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {deleteLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>Yes, Delete Account</span>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
