import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, AlertCircle, ShieldCheck, Mail, Lock, Phone, User,
  GraduationCap, Building2, Home, ArrowRight, ArrowLeft, X, RefreshCw,
  Sparkles, Tag
} from 'lucide-react';
import { BASE_URL } from '../lib/api.js';

export default function EnrollView({ onNavigate, siteSettings, onLoginSuccess, initialCourse }) {
  // Multi-course state
  const [catalogCourses, setCatalogCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(initialCourse || null);

  // Learner & Billing Details
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [accountType, setAccountType] = useState('STUDENT'); // STUDENT | EMPLOYEE | HOUSEHOLD

  // Student-specific fields
  const [qualification, setQualification] = useState('');
  const [branch, setBranch] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [passoutYear, setPassoutYear] = useState('');
  const [studentStatus, setStudentStatus] = useState('');

  // Employee-specific fields
  const [companyName, setCompanyName] = useState('');
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');

  // Household-specific fields
  const [householdName, setHouseholdName] = useState('');
  const [residentialAddress, setResidentialAddress] = useState('');
  const [memberCount, setMemberCount] = useState(2);

  // Checkout and discount state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMessage, setCouponMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [paymentResult, setPaymentResult] = useState(null);

  // Fetch course catalog on mount
  useEffect(() => {
    fetchCatalog();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const fetchCatalog = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/public/courses/`);
      if (res.ok) {
        const data = await res.json();
        const courses = data.courses || [];
        setCatalogCourses(courses);
        resolveCourseFromUrlOrList(courses);
      }
    } catch (e) {
      // Silently fall back
    }
  };

  const resolveCourseFromUrlOrList = (courses) => {
    if (!courses || courses.length === 0) return;

    if (initialCourse) {
      const matched = courses.find(c => c.id === initialCourse.id) || initialCourse;
      setSelectedCourse(matched);
      return;
    }

    // Check search params
    const searchParams = new URLSearchParams(window.location.search);
    const courseParam = searchParams.get('course') || searchParams.get('course_id') || searchParams.get('id');

    // Also check path segments like /enroll/1 or /courses/1/enroll
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    let pathCourseId = null;
    const enrollIdx = pathParts.indexOf('enroll');
    const coursesIdx = pathParts.indexOf('courses');
    if (enrollIdx !== -1 && pathParts[enrollIdx + 1] && !isNaN(pathParts[enrollIdx + 1])) {
      pathCourseId = pathParts[enrollIdx + 1];
    } else if (coursesIdx !== -1 && pathParts[coursesIdx + 1] && !isNaN(pathParts[coursesIdx + 1])) {
      pathCourseId = pathParts[coursesIdx + 1];
    }

    const targetId = courseParam || pathCourseId;
    if (targetId) {
      const found = courses.find(c => 
        String(c.id) === String(targetId) ||
        c.title.toLowerCase().includes(String(targetId).toLowerCase())
      );
      if (found) {
        setSelectedCourse(found);
        return;
      }
    }

    // Default to first course if none selected
    if (!selectedCourse && courses.length > 0) {
      setSelectedCourse(courses[0]);
    }
  };

  const handleSelectCourse = (course) => {
    if (!course) return;
    setSelectedCourse(course);
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponMessage(null);
    setStatusMessage(null);

    // Update URL query parameter cleanly
    try {
      const currentPath = window.location.pathname;
      const isLmPath = currentPath.startsWith('/landscapemastery');
      const targetBase = isLmPath ? '/landscapemastery/enroll' : '/enroll';
      const targetUrl = `${targetBase}?course=${course.id}`;
      if (currentPath + window.location.search !== targetUrl) {
        window.history.pushState({ courseId: course.id }, '', targetUrl);
      }
    } catch (e) {
      // Continue safely
    }
  };

  const basePrice = selectedCourse ? (selectedCourse.discount_price || selectedCourse.price) : (siteSettings?.coursePrice || 499);
  const discountPct = appliedCoupon?.discount_pct || 0;
  const price = discountPct > 0 ? Math.round(basePrice * (1 - discountPct / 100)) : basePrice;

  // COUPON VALIDATION HANDLER
  const handleApplyCoupon = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!couponCode.trim()) {
      setCouponMessage({ type: 'error', text: 'Please enter a coupon code to apply.' });
      return;
    }

    setCouponLoading(true);
    setCouponMessage(null);

    try {
      const res = await fetch(`${BASE_URL}/api/checkout/coupon/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim().toUpperCase() })
      });

      const data = await res.json();
      setCouponLoading(false);

      if (res.ok && data.valid) {
        setAppliedCoupon(data);
        setCouponMessage({ type: 'success', text: `✓ Coupon ${data.code} applied! ${data.discount_pct}% discount applied.` });
      } else {
        setAppliedCoupon(null);
        setCouponMessage({ type: 'error', text: data.error || 'Invalid or expired coupon code.' });
      }
    } catch (err) {
      setCouponLoading(false);
      setCouponMessage({ type: 'error', text: 'Failed to validate coupon. Please try again.' });
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponMessage(null);
  };

  // PAYMENT FLOW: Strict Server-Side Verification & Automated Account Provisioning
  const handlePayment = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    // Frontend Validations
    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    if (!cleanName) {
      setStatusMessage({ type: 'error', text: 'Please enter your Full Name for certificate generation & account setup.' });
      return;
    }
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid email address where account credentials will be sent.' });
      return;
    }
    if (!cleanPhone || cleanPhone.length < 8) {
      setStatusMessage({ type: 'error', text: 'Please provide a valid mobile number with country code.' });
      return;
    }

    // Role-specific validations
    if (accountType === 'STUDENT' && !collegeName.trim()) {
      setStatusMessage({ type: 'error', text: 'Please provide your College / Institute Name.' });
      return;
    }
    if (accountType === 'EMPLOYEE' && (!companyName.trim() || !designation.trim())) {
      setStatusMessage({ type: 'error', text: 'Please provide both your Organization / Company and Designation.' });
      return;
    }
    if (accountType === 'HOUSEHOLD' && !householdName.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter your Household Name or Primary Contact.' });
      return;
    }

    setLoading(true);
    setStatusMessage(null);

    const learnerPayload = {
      full_name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      account_type: accountType,
      course_id: selectedCourse?.id || null,
      coupon_code: couponCode.trim(),
      // Student details
      qualification: qualification.trim(),
      branch: branch.trim(),
      college_name: collegeName.trim(),
      passout_year: passoutYear,
      student_status: studentStatus,
      // Employee details
      company_name: companyName.trim(),
      department: department.trim(),
      designation: designation.trim(),
      // Household details
      household_name: householdName.trim(),
      residential_address: residentialAddress.trim(),
      member_count: memberCount
    };

    try {
      const response = await fetch(`${BASE_URL}/api/checkout/session/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(learnerPayload)
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        setLoading(false);
        setStatusMessage({ type: 'error', text: errData.error || 'Unable to initialize checkout session. Please check details.' });
        return;
      }

      const data = await response.json();
      const razorpayKey = data.keyId || '';

      if (!window.Razorpay || !razorpayKey) {
        setLoading(false);
        setStatusMessage({
          type: 'error',
          text: 'Payment Gateway is in configuration mode. Please contact support at contact@landscapemastery.com.'
        });
        return;
      }

      const calculatedAmount = Math.round(price * 100);

      const options = {
        key: razorpayKey,
        amount: calculatedAmount,
        currency: 'INR',
        order_id: data.orderId,
        name: 'Landscape Mastery',
        description: selectedCourse ? `${selectedCourse.title} - Lifetime Access` : 'Executive Architecture Masterclass',
        image: '/lm_logo.png',
        notes: {
          course_id: selectedCourse?.id || '',
          course_title: selectedCourse?.title || 'Landscape Mastery',
          account_type: accountType,
          full_name: cleanName
        },
        prefill: {
          name: cleanName,
          email: cleanEmail,
          contact: cleanPhone
        },
        theme: {
          color: '#064e3b',
        },
        handler: async function (razorpayResponse) {
          try {
            setStatusMessage({ type: 'info', text: 'Authoritatively verifying payment & provisioning credentials...' });
            const verifyRes = await fetch(`${BASE_URL}/api/checkout/verify/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: razorpayResponse.razorpay_order_id,
                razorpay_payment_id: razorpayResponse.razorpay_payment_id,
                razorpay_signature: razorpayResponse.razorpay_signature,
                email: cleanEmail,
                full_name: cleanName,
                phone: cleanPhone,
                account_type: accountType,
                course_id: selectedCourse?.id || null,
                coupon_code: couponCode.trim(),
                qualification: qualification.trim(),
                branch: branch.trim(),
                college_name: collegeName.trim(),
                passout_year: passoutYear,
                student_status: studentStatus,
                company_name: companyName.trim(),
                department: department.trim(),
                designation: designation.trim(),
                household_name: householdName.trim(),
                residential_address: residentialAddress.trim(),
                member_count: memberCount
              })
            });

            const verifyData = await verifyRes.json();
            setLoading(false);

            if (verifyRes.ok && verifyData.success) {
              setPaymentResult({
                type: 'success',
                courseTitle: verifyData.course_title || selectedCourse?.title || 'Executive Masterclass',
                email: verifyData.email,
                orderId: verifyData.order_id,
                paymentId: verifyData.payment_id,
                isNewUser: verifyData.is_new_user,
                authData: verifyData.auth_data || null
              });
              setStatusMessage(null);
            } else {
              setPaymentResult({
                type: 'failed',
                message: verifyData.error || 'Payment signature verification failed. Please contact support.'
              });
            }
          } catch (verifyErr) {
            setLoading(false);
            setPaymentResult({
              type: 'failed',
              message: 'Network error while verifying payment status. If your card was charged, contact support at contact@landscapemastery.com.'
            });
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            setStatusMessage({
              type: 'warning',
              text: 'Checkout closed. You can retry payment whenever you are ready.'
            });
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (failResponse) {
        setLoading(false);
        setPaymentResult({
          type: 'failed',
          message: failResponse.error?.description || 'Payment was declined by bank or card issuer.'
        });
      });
      rzp.open();

    } catch (err) {
      setLoading(false);
      setStatusMessage({ type: 'error', text: 'Network connection error. Please try again.' });
    }
  };

  return (
    <div className="py-8 sm:py-14 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Top Back Navigation Bar */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            if (onNavigate) {
              onNavigate('v1');
              setTimeout(() => {
                const el = document.getElementById('course-catalog');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 120);
            }
          }}
          className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-900 hover:text-emerald-700 bg-white hover:bg-stone-50 border border-stone-200 px-4 py-2 rounded-full transition-all shadow-xs cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Course Library</span>
        </button>

        <span className="text-[11px] font-mono text-stone-500 uppercase tracking-widest hidden sm:inline-block">
          Official Executive Enrollment Portal
        </span>
      </div>

      {/* Main Dedicated Photo 2 Enrollment Container */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-br from-[#063327] via-[#022119] to-[#01140f] text-white rounded-3xl p-6 sm:p-10 shadow-[0_24px_70px_-12px_rgba(2,44,33,0.5)] border border-emerald-500/25 relative overflow-hidden">
          {/* Subtle Ambient Radial Lighting */}
          <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Section Header with Live Course & Investment Details (Photo 2 Header) */}
          <div className="relative z-10 text-center max-w-2xl mx-auto mb-8 space-y-3">
            <div className="inline-flex items-center gap-2 bg-emerald-900/80 text-emerald-200 text-[11px] font-bold px-3.5 py-1.5 rounded-full uppercase tracking-widest border border-emerald-600/40 shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{selectedCourse ? selectedCourse.title : 'Executive Architectural Access'}</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4.5xl font-bold text-white tracking-tight">
              {selectedCourse ? `Enroll in ${selectedCourse.title}` : 'Instant Course Enrollment'}
            </h1>

            <p className="text-xs sm:text-sm text-emerald-100/80 font-light leading-relaxed">
              Complete your registration below. Upon verified payment, your learner portal account is created automatically and credentials are sent to your email.
            </p>

            {/* Live Pricing Ribbon */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <div className="inline-flex items-baseline gap-2 bg-emerald-950/80 border border-emerald-500/30 px-5 py-2 rounded-2xl shadow-inner">
                <span className="text-3xl sm:text-4xl font-bold font-serif text-white tracking-tight">₹{price}</span>
                {(discountPct > 0 || (selectedCourse && selectedCourse.discount_price < selectedCourse.price)) ? (
                  <span className="text-sm line-through text-emerald-400/60 font-sans">
                    ₹{selectedCourse ? selectedCourse.price : basePrice}
                  </span>
                ) : null}
                <span className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider ml-1">
                  • Lifetime Access
                </span>
                {discountPct > 0 && (
                  <span className="text-[10px] font-bold bg-emerald-400 text-emerald-950 px-2 py-0.5 rounded-full uppercase tracking-wider ml-1 shadow-sm">
                    {discountPct}% OFF
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Enhanced Executive White Form Card (Photo 2 Card) */}
          <div className="relative z-10 bg-white text-stone-900 p-6 sm:p-10 rounded-3xl shadow-2xl border border-stone-100 space-y-6">
            <div className="flex flex-wrap justify-between items-center pb-4 border-b border-stone-100 gap-2">
              <div>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">
                  Enrollment Details
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  {selectedCourse ? selectedCourse.title : 'Select a course or enroll directly.'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-[11px] font-bold px-2.5 py-1 rounded-md border border-emerald-200">
                  <span className="material-symbols-outlined text-xs">lock</span>
                  256-Bit SSL
                </span>
                <span className="inline-flex items-center gap-1 bg-stone-100 text-stone-700 text-[11px] font-bold px-2.5 py-1 rounded-md border border-stone-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  Auto-Account
                </span>
              </div>
            </div>

            {statusMessage && (
              <div className={`p-4 rounded-xl text-xs sm:text-sm font-semibold ${
                statusMessage.type === 'error' ? 'bg-rose-50 border border-rose-200 text-rose-800' :
                statusMessage.type === 'warning' ? 'bg-amber-50 border border-amber-200 text-amber-900' :
                'bg-emerald-50 border border-emerald-200 text-emerald-900'
              }`}>
                {statusMessage.text}
              </div>
            )}

            <form onSubmit={handlePayment} className="space-y-6">
              {/* Course Selection Dropdown */}
              {catalogCourses.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Course Selection <span className="text-emerald-700">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={selectedCourse?.id || ''}
                      onChange={(e) => {
                        const found = catalogCourses.find(c => c.id === Number(e.target.value));
                        if (found) handleSelectCourse(found);
                      }}
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-3 text-xs sm:text-sm font-semibold text-stone-900 focus:outline-none focus:border-emerald-700 focus:bg-white transition-all cursor-pointer"
                    >
                      <option value="" disabled>-- Select a Course from Catalog --</option>
                      {catalogCourses.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.title} — ₹{c.discount_price || c.price}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* 1. Account Type Selector */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                  1. Learner Classification <span className="text-emerald-700">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'STUDENT', label: 'Student', sub: 'University / College', icon: GraduationCap },
                    { id: 'EMPLOYEE', label: 'Employee', sub: 'Corporate / Firm', icon: Building2 },
                    { id: 'HOUSEHOLD', label: 'Household', sub: 'Family / Individual', icon: Home }
                  ].map((item) => {
                    const Icon = item.icon;
                    const isSelected = accountType === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setAccountType(item.id)}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                          isSelected
                            ? 'bg-gradient-to-br from-emerald-950 to-emerald-900 text-white border-emerald-900 shadow-md ring-2 ring-emerald-500/30'
                            : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100 hover:border-stone-300'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <Icon className={`w-5 h-5 ${isSelected ? 'text-emerald-300' : 'text-stone-500'}`} />
                          {isSelected && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
                        </div>
                        <div>
                          <div className={`text-xs sm:text-sm font-bold ${isSelected ? 'text-white' : 'text-stone-900'}`}>
                            {item.label}
                          </div>
                          <div className={`text-[11px] ${isSelected ? 'text-emerald-200/80' : 'text-stone-400'}`}>
                            {item.sub}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Personal & Contact Information */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                  2. Personal &amp; Contact Information <span className="text-emerald-700">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {/* Full Name */}
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Full Name <span className="text-emerald-700">*</span>
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">person</span>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-emerald-700 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  {/* Email Address */}
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Email Address <span className="text-emerald-700">*</span>
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">mail</span>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-emerald-700 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  {/* Mobile Number */}
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Mobile Number <span className="text-emerald-700">*</span>
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">phone_iphone</span>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-emerald-700 focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                </div>
                <span className="text-[10.5px] text-stone-400 mt-1 block">
                  Access credentials and order invoices will be delivered to this email and mobile number.
                </span>
              </div>

              {/* 3. Role-Specific Profile Details */}
              {/* Conditional Fields: STUDENT */}
              {accountType === 'STUDENT' && (
                <div className="p-4 sm:p-5 bg-stone-50/90 rounded-2xl border border-stone-200/90 space-y-3.5">
                  <div className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-emerald-700" />
                    <span>3. Student Academic Profile</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">Qualification</label>
                      <select
                        value={qualification}
                        onChange={(e) => setQualification(e.target.value)}
                        className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-emerald-700 cursor-pointer"
                      >
                        <option value="">Select Qualification</option>
                        <option value="B.Arch">B.Arch</option>
                        <option value="B.Tech">B.Tech</option>
                        <option value="B.Des">B.Des</option>
                        <option value="B.Sc">B.Sc</option>
                        <option value="M.Arch">M.Arch</option>
                        <option value="M.Tech">M.Tech</option>
                        <option value="Diploma">Diploma</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">Passout Year</label>
                      <select
                        value={passoutYear}
                        onChange={(e) => setPassoutYear(e.target.value)}
                        className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-emerald-700 cursor-pointer"
                      >
                        <option value="">Select Passout Year</option>
                        <option value="2027">2027</option>
                        <option value="2026">2026</option>
                        <option value="2025">2025</option>
                        <option value="2024">2024</option>
                        <option value="2023">2023</option>
                        <option value="Earlier">Earlier</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">Branch / Dept</label>
                      <input
                        type="text"
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                        className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-emerald-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">Current Status</label>
                      <select
                        value={studentStatus}
                        onChange={(e) => setStudentStatus(e.target.value)}
                        className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-emerald-700 cursor-pointer"
                      >
                        <option value="">Select Current Status</option>
                        <option value="Still Studying">Still Studying</option>
                        <option value="Internship">Internship</option>
                        <option value="Freelancer">Freelancer</option>
                        <option value="Employed">Employed</option>
                        <option value="Seeking Opportunities">Seeking Opportunities</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      College / University Name <span className="text-emerald-700">*</span>
                    </label>
                    <input
                      type="text"
                      required={accountType === 'STUDENT'}
                      value={collegeName}
                      onChange={(e) => setCollegeName(e.target.value)}
                      className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-emerald-700"
                    />
                  </div>
                </div>
              )}

              {/* Conditional Fields: EMPLOYEE */}
              {accountType === 'EMPLOYEE' && (
                <div className="p-4 sm:p-5 bg-stone-50/90 rounded-2xl border border-stone-200/90 space-y-3.5">
                  <div className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-700" />
                    <span>3. Corporate / Employment Details</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                        Company / Organization <span className="text-emerald-700">*</span>
                      </label>
                      <input
                        type="text"
                        required={accountType === 'EMPLOYEE'}
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-emerald-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">Department</label>
                      <input
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-emerald-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                        Designation <span className="text-emerald-700">*</span>
                      </label>
                      <input
                        type="text"
                        required={accountType === 'EMPLOYEE'}
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-emerald-700"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Conditional Fields: HOUSEHOLD */}
              {accountType === 'HOUSEHOLD' && (
                <div className="p-4 sm:p-5 bg-stone-50/90 rounded-2xl border border-stone-200/90 space-y-3.5">
                  <div className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-2">
                    <Home className="w-4 h-4 text-emerald-700" />
                    <span>3. Household Learner Details</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                        Household Name / Contact <span className="text-emerald-700">*</span>
                      </label>
                      <input
                        type="text"
                        required={accountType === 'HOUSEHOLD'}
                        value={householdName}
                        onChange={(e) => setHouseholdName(e.target.value)}
                        className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-emerald-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">Residential Address</label>
                      <input
                        type="text"
                        value={residentialAddress}
                        onChange={(e) => setResidentialAddress(e.target.value)}
                        className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-emerald-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">Family Learners</label>
                      <select
                        value={memberCount}
                        onChange={(e) => setMemberCount(Number(e.target.value))}
                        className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-emerald-700 cursor-pointer"
                      >
                        <option value={1}>1 Learner</option>
                        <option value={2}>2 Learners</option>
                        <option value={3}>3 Learners</option>
                        <option value={4}>4+ Learners</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. Privilege Coupon Code & Order Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start pt-2">
                {/* Coupon Code Input & Styled Apply Button */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                      Have a Privilege Coupon?
                    </label>
                    {appliedCoupon && (
                      <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 shadow-2xs">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{appliedCoupon.discount_pct}% Discount Applied</span>
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => {
                          setCouponCode(e.target.value.toUpperCase());
                          if (appliedCoupon && e.target.value.toUpperCase() !== appliedCoupon.code) {
                            setAppliedCoupon(null);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleApplyCoupon();
                          }
                        }}
                        className="w-full bg-white border border-stone-300 hover:border-stone-400 focus:bg-white rounded-xl pl-9 pr-3 py-2.5 text-xs font-mono font-bold text-stone-900 focus:outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10 uppercase transition-all shadow-xs"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={appliedCoupon ? handleRemoveCoupon : handleApplyCoupon}
                      disabled={couponLoading}
                      className={`px-5 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer min-w-[92px] active:scale-[0.98] ${
                        appliedCoupon
                          ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 shadow-xs'
                          : couponCode.trim()
                          ? 'bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 hover:from-emerald-950 hover:to-teal-950 text-white shadow-md shadow-emerald-950/20 hover:shadow-lg hover:shadow-emerald-950/30 hover:scale-[1.01] border border-emerald-800'
                          : 'bg-emerald-950/5 hover:bg-emerald-950/10 text-emerald-900 border border-emerald-900/15 hover:border-emerald-900/25 shadow-xs'
                      }`}
                    >
                      {couponLoading ? (
                        <div className="w-3.5 h-3.5 border-2 border-emerald-800/30 border-t-emerald-800 rounded-full animate-spin" />
                      ) : appliedCoupon ? (
                        <>
                          <X className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Apply</span>
                        </>
                      )}
                    </button>
                  </div>

                  {couponMessage && (
                    <div className={`mt-2 p-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border shadow-2xs ${
                      couponMessage.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200/90'
                        : 'bg-rose-50 text-rose-800 border-rose-200/90'
                    }`}>
                      {couponMessage.type === 'success' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      )}
                      <span>{couponMessage.text}</span>
                    </div>
                  )}
                </div>

                {/* Investment Summary Box */}
                <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/90 space-y-2">
                  <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                    Investment Breakdown
                  </div>
                  <div className="flex justify-between text-xs text-stone-600">
                    <span>Base Course Price</span>
                    <span className="font-semibold">₹{selectedCourse ? selectedCourse.price : basePrice}</span>
                  </div>
                  {discountPct > 0 && (
                    <div className="flex justify-between text-xs text-emerald-700 font-semibold">
                      <span>Privilege Coupon Discount ({discountPct}%)</span>
                      <span>-₹{Math.round(basePrice * (discountPct / 100))}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-stone-200 flex justify-between items-baseline">
                    <span className="text-xs font-bold text-stone-900 uppercase">Total Payable</span>
                    <span className="text-xl font-bold font-serif text-emerald-950">₹{price}</span>
                  </div>
                </div>
              </div>

              {/* Instant Automated Provisioning Notice */}
              <div className="p-4 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl text-xs text-emerald-900 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Instant Automated Account Provisioning:</strong> Your learner portal account is created automatically upon verified payment. Temporary access credentials and login instructions will be delivered immediately to <strong>{email || 'your email'}</strong>.
                </div>
              </div>

              {/* Submit / Proceed to Payment Button */}
              <button
                type="submit"
                disabled={loading || (!selectedCourse && catalogCourses.length > 0)}
                className="w-full bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-950 hover:from-emerald-800 hover:to-emerald-900 text-white font-semibold text-sm sm:text-base py-4 rounded-2xl shadow-xl shadow-emerald-950/25 transition-all flex items-center justify-center gap-2.5 cursor-pointer btn-shine disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-lg">lock</span>
                <span>{loading ? 'Initializing Secure Payment Gateway...' : `Proceed to Secure Payment • ₹${price}`}</span>
              </button>

              {/* Trust & Verification Badges */}
              <div className="pt-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] text-stone-500 font-semibold uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-emerald-700 text-sm">verified</span>
                  Razorpay Verified Gateway
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-emerald-700 text-sm">lock</span>
                  256-Bit SSL Encryption
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-emerald-700 text-sm">credit_card</span>
                  UPI, Cards &amp; NetBanking
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-emerald-700 text-sm">all_inclusive</span>
                  Zero Recurring Fees
                </span>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* POST-PAYMENT RESULT MODAL */}
      <AnimatePresence>
        {paymentResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-stone-950/60 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6"
          >
            <motion.div
              initial={{ scale: 0.94, y: 16, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.94, y: 16, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-stone-200/90 overflow-hidden ring-1 ring-stone-900/5 text-stone-900 relative"
            >
              {paymentResult.type === 'success' ? (
                <div>
                  <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-900 text-white p-6 sm:p-7 relative overflow-hidden text-center">
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mb-3.5 shadow-inner">
                        <CheckCircle2 className="w-9 h-9 text-emerald-300" />
                      </div>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400/20 text-emerald-200 text-[10px] font-bold tracking-widest uppercase mb-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Payment Verified</span>
                      </div>
                      <h3 className="font-serif text-2xl font-bold tracking-tight">Payment Successful!</h3>
                      <p className="text-xs text-emerald-100/90 mt-1 max-w-xs">
                        Your masterclass enrollment is confirmed and your account is active.
                      </p>
                    </div>
                  </div>

                  <div className="p-6 sm:p-7 space-y-4">
                    <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-4 text-xs space-y-2">
                      <div className="flex justify-between items-center py-1 border-b border-stone-200/60">
                        <span className="text-stone-500 font-medium">Enrolled Course:</span>
                        <span className="font-bold text-stone-900 text-right truncate max-w-[240px]">{paymentResult.courseTitle}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-stone-200/60">
                        <span className="text-stone-500 font-medium">Order Reference:</span>
                        <span className="font-mono font-bold text-stone-800 text-[11px]">{paymentResult.orderId}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-stone-200/60">
                        <span className="text-stone-500 font-medium">Payment ID:</span>
                        <span className="font-mono text-stone-600 text-[11px]">{paymentResult.paymentId}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-stone-500 font-medium">Registered Login ID:</span>
                        <span className="font-bold text-emerald-950">{paymentResult.email}</span>
                      </div>
                    </div>

                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-950 space-y-2">
                      <div className="flex items-start gap-2.5">
                        <Mail className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-bold block text-emerald-900">Account Access Instructions Dispatched</strong>
                          <span className="text-[11px] text-emerald-800 leading-relaxed block mt-0.5">
                            We have automatically provisioned your account. Your login credentials and first-time access instructions have been sent to <b>{paymentResult.email}</b>.
                          </span>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-emerald-200/60 flex items-center gap-2 text-[10px] text-emerald-700 font-medium">
                        <Lock className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>For your security, your temporary password is not displayed on this screen.</span>
                      </div>
                    </div>

                    <div className="pt-2 space-y-2">
                      <button
                        type="button"
                        onClick={() => {
                          const auth = paymentResult.authData;
                          setPaymentResult(null);
                          if (auth && onLoginSuccess) {
                            onLoginSuccess(auth);
                          } else if (onNavigate) {
                            onNavigate('v2');
                          }
                        }}
                        className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-emerald-950 via-emerald-800 to-teal-900 hover:from-emerald-900 hover:to-teal-800 text-white font-bold text-xs sm:text-sm tracking-wide shadow-lg shadow-emerald-950/20 hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>Proceed to Student Login</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>

                      <p className="text-[10px] text-center text-stone-400">
                        Need help? Contact support at <a href="mailto:contact@landscapemastery.com" className="underline hover:text-stone-700">contact@landscapemastery.com</a>
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 sm:p-7 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center">
                        <AlertCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-serif text-xl font-bold text-stone-900">Payment Not Completed</h3>
                        <p className="text-xs text-stone-500">The transaction was cancelled or declined.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPaymentResult(null)}
                      className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-4 bg-rose-50/70 border border-rose-200/80 rounded-2xl text-xs text-rose-900 leading-relaxed">
                    <strong>Transaction Notice:</strong> {paymentResult.message || 'Payment was declined by your bank or checkout was interrupted. Your account was not charged.'}
                  </div>

                  <p className="text-xs text-stone-600">
                    Your details have been preserved. You can retry payment with a different UPI app, credit/debit card, or net banking.
                  </p>

                  <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentResult(null);
                        handlePayment({ preventDefault: () => {} });
                      }}
                      className="flex-1 py-3 px-4 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retry Payment</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentResult(null)}
                      className="py-3 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs transition-all cursor-pointer"
                    >
                      Return to Checkout
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
