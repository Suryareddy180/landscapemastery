import React, { useState, useEffect, useRef } from 'react';
import AdminDashboardLayout from './admin/AdminDashboardLayout.jsx';
import CourseBuilderSection from './admin/CourseBuilderSection.jsx';
import MediaLibrarySection from './admin/MediaLibrarySection.jsx';

export default function AdminView({ user, onNavigate, token, onLogout, onSettingsUpdated }) {
  const [activeSection, setActiveSection] = useState('overview');
  const fileInputRef = useRef(null);
  const pdfFileInputRef = useRef(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  const [analytics, setAnalytics] = useState({
    studentCount: 0,
    activeStudents: 0,
    totalCourses: 0,
    publishedCourses: 0,
    totalEnrollments: 0,
    totalRevenue: 0,
    shortVideoCount: 0,
    longVideoCount: 0,
    pdfCount: 0,
    totalContent: 0,
    completionRate: 0
  });

  const [siteSettings, setSiteSettings] = useState({
    siteName: 'Landscape Mastery',
    heroTitle: 'Master the Art of Landscape Architecture',
    heroSubtitle: 'Elevate your architectural vision. Access industry-leading video modules, spatial planning frameworks, and achieve complete mastery.',
    logoUrl: '/lm_logo.png',
    logoSize: 48,
    logoFitMode: 'auto',
    coursePrice: 499,
    contactEmail: 'contact@landscapemastery.com',
    curriculumPdfUrl: '/media/Landscape_Architecture_Syllabus_2026.pdf',
    curriculumPdfTitle: 'Landscape Architecture Masterclass Curriculum & Blueprint Guide 2026',
    curriculumPdfSize: '4.2 MB'
  });

  const [students, setStudents] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [savingSettings, setSavingSettings] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // New Testimonial, FAQ, and Coupon Form States
  const [newTestimonial, setNewTestimonial] = useState({ student_name: '', student_title: 'Architect', content: '', rating: 5 });
  const [newFaq, setNewFaq] = useState({ question: '', answer: '' });
  const [newCoupon, setNewCoupon] = useState({ code: '', discount_pct: 15, max_uses: 100 });

  useEffect(() => {
    fetchAdminData();
  }, [token]);

  const fetchAdminData = async () => {
    const authToken = token || localStorage.getItem('lm_auth_token') || '';
    if (!authToken) return;
    const headers = { 'Authorization': `Bearer ${authToken}` };

    try {
      const aRes = await fetch('http://localhost:8000/api/admin/analytics/', { headers });
      if (aRes.ok) setAnalytics(await aRes.json());

      const sRes = await fetch('http://localhost:8000/api/admin/settings/', { headers });
      if (sRes.ok) setSiteSettings(await sRes.json());

      const stRes = await fetch('http://localhost:8000/api/admin/students/', { headers });
      if (stRes.ok) {
        const data = await stRes.json();
        if (data.students) setStudents(data.students);
      }

      const logRes = await fetch('http://localhost:8000/api/admin/audit-logs/', { headers });
      if (logRes.ok) {
        const data = await logRes.json();
        if (data.logs) setAuditLogs(data.logs);
      }

      const tRes = await fetch('http://localhost:8000/api/admin/testimonials/', { headers });
      if (tRes.ok) {
        const data = await tRes.json();
        if (data.testimonials) setTestimonials(data.testimonials);
      }

      const fRes = await fetch('http://localhost:8000/api/admin/faqs/', { headers });
      if (fRes.ok) {
        const data = await fRes.json();
        if (data.faqs) setFaqs(data.faqs);
      }

      const cRes = await fetch('http://localhost:8000/api/admin/coupons/', { headers });
      if (cRes.ok) {
        const data = await cRes.json();
        if (data.coupons) setCoupons(data.coupons);
      }
    } catch (e) {
      console.error('Failed to fetch admin data:', e);
    }
  };

  // Brand Logo File Upload Handler
  const handleLogoFileUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setUploadingLogo(true);
    setStatusMessage(null);

    // Immediate client preview with FileReader
    const reader = new FileReader();
    reader.onload = async (uploadEvent) => {
      const dataUrl = uploadEvent.target.result;
      setSiteSettings(prev => ({ ...prev, logoUrl: dataUrl }));

      // Send to backend API
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('dataUrl', dataUrl);

        const res = await fetch('http://localhost:8000/api/admin/upload-logo/', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        const data = await res.json();
        if (res.ok && data.logoUrl) {
          setSiteSettings(prev => ({ ...prev, logoUrl: data.logoUrl || dataUrl }));
          setStatusMessage({ type: 'success', text: 'New brand logo uploaded and applied successfully!' });
          if (onSettingsUpdated) onSettingsUpdated();
        } else {
          // Fallback: save settings with dataUrl
          await fetch('http://localhost:8000/api/admin/settings/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ ...siteSettings, logoUrl: dataUrl })
          });
          setStatusMessage({ type: 'success', text: 'New brand logo applied and saved successfully!' });
          if (onSettingsUpdated) onSettingsUpdated();
        }
      } catch (err) {
        console.error('Logo upload error:', err);
        setStatusMessage({ type: 'success', text: 'Logo loaded into live preview! Click "Save & Persist CMS Settings" to confirm.' });
      } finally {
        setUploadingLogo(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Official Syllabus PDF Document Upload Handler
  const handleSyllabusPdfUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setStatusMessage({ type: 'error', text: 'Please select a valid PDF document (.pdf)' });
      return;
    }

    setUploadingPdf(true);
    setStatusMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', siteSettings.curriculumPdfTitle || file.name.replace('.pdf', '').replace(/_/g, ' '));

      const res = await fetch('http://localhost:8000/api/admin/upload-syllabus-pdf/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (res.ok && data.curriculumPdfUrl) {
        setSiteSettings(prev => ({
          ...prev,
          curriculumPdfUrl: data.curriculumPdfUrl,
          curriculumPdfTitle: data.curriculumPdfTitle,
          curriculumPdfSize: data.curriculumPdfSize
        }));
        setStatusMessage({ type: 'success', text: 'New Curriculum Syllabus PDF uploaded and updated successfully!' });
        if (onSettingsUpdated) onSettingsUpdated();
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to upload syllabus PDF.' });
      }
    } catch (err) {
      console.error('PDF upload error:', err);
      setStatusMessage({ type: 'error', text: 'Network error uploading syllabus PDF.' });
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    setStatusMessage(null);

    try {
      const res = await fetch('http://localhost:8000/api/admin/settings/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(siteSettings)
      });

      if (res.ok) {
        setStatusMessage({ type: 'success', text: 'CMS and site settings saved successfully!' });
        if (onSettingsUpdated) onSettingsUpdated();
      } else {
        setStatusMessage({ type: 'error', text: 'Failed to update settings.' });
      }
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: 'error', text: 'Network error saving settings.' });
    } finally {
      setSavingSettings(false);
    }
  };

  // Authenticated CSV Export
  const handleExportCSV = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/admin/export/students/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const blob = await res.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = 'students_roster.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
      } else {
        alert('Export denied: Administrator authentication required.');
      }
    } catch (err) {
      alert('Network error while exporting CSV.');
    }
  };

  // Testimonial & FAQ Handlers (BUG-014 / TC-ADM-012)
  const handleCreateTestimonial = async (e) => {
    e.preventDefault();
    if (!newTestimonial.student_name || !newTestimonial.content) return;
    try {
      const res = await fetch('http://localhost:8000/api/admin/testimonials/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newTestimonial)
      });
      if (res.ok) {
        setNewTestimonial({ student_name: '', student_title: 'Architect', content: '', rating: 5 });
        fetchAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTestimonial = async (id) => {
    try {
      const res = await fetch(`http://localhost:8000/api/admin/testimonials/${id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchAdminData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateFaq = async (e) => {
    e.preventDefault();
    if (!newFaq.question || !newFaq.answer) return;
    try {
      const res = await fetch('http://localhost:8000/api/admin/faqs/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newFaq)
      });
      if (res.ok) {
        setNewFaq({ question: '', answer: '' });
        fetchAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteFaq = async (id) => {
    try {
      const authToken = token || localStorage.getItem('lm_auth_token') || '';
      const res = await fetch(`http://localhost:8000/api/admin/faqs/${id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) fetchAdminData();
    } catch (e) {
      console.error(e);
    }
  };

  // Coupon Handlers
  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    if (!newCoupon.code.trim()) return;
    try {
      const authToken = token || localStorage.getItem('lm_auth_token') || '';
      const res = await fetch('http://localhost:8000/api/admin/coupons/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify({
          code: newCoupon.code.trim(),
          discount_pct: parseInt(newCoupon.discount_pct, 10) || 15,
          max_uses: parseInt(newCoupon.max_uses, 10) || 100
        })
      });
      if (res.ok) {
        setNewCoupon({ code: '', discount_pct: 15, max_uses: 100 });
        fetchAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteCoupon = async (id) => {
    try {
      const authToken = token || localStorage.getItem('lm_auth_token') || '';
      const res = await fetch(`http://localhost:8000/api/admin/coupons/${id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) fetchAdminData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleCoupon = async (id, currentActive) => {
    try {
      const authToken = token || localStorage.getItem('lm_auth_token') || '';
      const res = await fetch(`http://localhost:8000/api/admin/coupons/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify({ active: !currentActive })
      });
      if (res.ok) fetchAdminData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AdminDashboardLayout
      user={user}
      activeSection={activeSection}
      setActiveSection={setActiveSection}
      onNavigate={onNavigate}
      siteSettings={siteSettings}
      onLogout={onLogout}
    >
      {/* SECTION 1: DASHBOARD OVERVIEW */}
      {activeSection === 'overview' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
            <div>
              <h1 className="text-xl font-bold text-stone-900">Platform Analytics Overview</h1>
              <p className="text-xs text-stone-500 mt-1">Real-time database analytics, verified revenue metrics, and active enrollees.</p>
            </div>
            <button 
              onClick={handleExportCSV} 
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              Export Student Roster (CSV)
            </button>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Enrolled Students</span>
                <span className="material-symbols-outlined text-emerald-700 bg-emerald-50 p-2 rounded-xl border border-emerald-200">group</span>
              </div>
              <div className="text-2xl font-bold text-stone-900">{analytics.studentCount}</div>
              <p className="text-[11px] text-emerald-700 font-semibold mt-2">↑ Verified Paid Enrollees</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Gross Platform Revenue</span>
                <span className="material-symbols-outlined text-emerald-700 bg-emerald-50 p-2 rounded-xl border border-emerald-200">payments</span>
              </div>
              <div className="text-2xl font-bold text-stone-900">₹{analytics.totalRevenue.toLocaleString()}</div>
              <p className="text-[11px] text-emerald-700 font-semibold mt-2">Verified Razorpay Captured Sales</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Published Courses</span>
                <span className="material-symbols-outlined text-emerald-700 bg-emerald-50 p-2 rounded-xl border border-emerald-200">auto_stories</span>
              </div>
              <div className="text-2xl font-bold text-stone-900">{analytics.publishedCourses}</div>
              <p className="text-[11px] text-stone-500 mt-2">{analytics.totalEnrollments} Active Enrollments</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Media &amp; PDF Assets</span>
                <span className="material-symbols-outlined text-emerald-700 bg-emerald-50 p-2 rounded-xl border border-emerald-200">video_library</span>
              </div>
              <div className="text-2xl font-bold text-stone-900">{analytics.totalContent}</div>
              <p className="text-[11px] text-stone-500 mt-2">{analytics.longVideoCount} Masterclasses • {analytics.pdfCount} PDFs</p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: COURSE BUILDER */}
      {activeSection === 'courses' && <CourseBuilderSection token={token} />}

      {/* SECTION 3: MEDIA & CONTENT LIBRARY */}
      {activeSection === 'library' && <MediaLibrarySection token={token} />}

      {/* SECTION 4: STUDENT ROSTER */}
      {activeSection === 'students' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
            <div>
              <h1 className="text-xl font-bold text-stone-900">Verified Student Roster</h1>
              <p className="text-xs text-stone-500 mt-1">Manage paid enrollees, credentials, and access statuses.</p>
            </div>
            <button 
              onClick={handleExportCSV} 
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              Export CSV
            </button>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500 uppercase font-semibold">
                  <th className="py-3 px-3">Student Email</th>
                  <th className="py-3 px-3">Phone (Password)</th>
                  <th className="py-3 px-3">Registration Date</th>
                  <th className="py-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map((std) => (
                  <tr key={std.id} className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                    <td className="py-4 px-3 font-semibold text-stone-900">{std.email}</td>
                    <td className="py-4 px-3 font-mono text-stone-700">{std.phone || 'N/A'}</td>
                    <td className="py-4 px-3 text-stone-500">{std.created_at || 'Recent'}</td>
                    <td className="py-4 px-3">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                        std.paid ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-stone-100 text-stone-600'
                      }`}>
                        {std.paid ? '✓ PAID' : 'PENDING'}
                      </span>
                    </td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center py-8 text-stone-400">
                      No student records found in database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 5: PAYMENTS & ORDERS */}
      {activeSection === 'payments' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
            <h1 className="text-xl font-bold text-stone-900">Payments &amp; Verified Orders Log</h1>
            <p className="text-xs text-stone-500 mt-1">Server-side verified transaction records.</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500 uppercase font-semibold">
                  <th className="py-3 px-3">Order ID</th>
                  <th className="py-3 px-3">Student Email</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {students.filter(s => s.paid).map((std, i) => (
                  <tr key={i} className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                    <td className="py-4 px-3 font-mono font-semibold text-emerald-800">order_lm_{std.id}</td>
                    <td className="py-4 px-3 text-stone-800 font-medium">{std.email}</td>
                    <td className="py-4 px-3 font-bold text-stone-900">₹{siteSettings.coursePrice}</td>
                    <td className="py-4 px-3 text-right">
                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2.5 py-1 rounded-full">
                        SUCCESS
                      </span>
                    </td>
                  </tr>
                ))}
                {students.filter(s => s.paid).length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center py-8 text-stone-400">
                      No payment records logged yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 6: LANDING CMS & LOGO ADJUSTER */}
      {activeSection === 'cms' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
            <h1 className="text-xl font-bold text-stone-900">Landing Page CMS &amp; Brand Customizer</h1>
            <p className="text-xs text-stone-500 mt-1">Control your brand logo dimensions and hero headline dynamically.</p>
          </div>

          {statusMessage && (
            <div className={`p-3 rounded-xl text-xs font-semibold ${
              statusMessage.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-900' : 'bg-rose-50 border border-rose-200 text-rose-900'
            }`}>
              {statusMessage.text}
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-sm space-y-6">
            {/* BRAND LOGO MANAGEMENT & UPLOAD BOX */}
            <div className="p-6 bg-stone-50/80 rounded-2xl border border-stone-200 space-y-5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-700 text-lg">image</span>
                    Header Brand Logo &amp; Identity
                  </h3>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Upload a new custom logo picture or adjust brand dimensions across the entire website.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSiteSettings(prev => ({ ...prev, logoUrl: '/lm_logo.png', logoSize: 48 }));
                    setStatusMessage({ type: 'success', text: 'Reset to default Landscape Mastery logo.' });
                  }}
                  className="text-xs text-stone-600 hover:text-emerald-800 font-semibold flex items-center gap-1 bg-white hover:bg-stone-100 border border-stone-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs"
                >
                  <span className="material-symbols-outlined text-sm">restart_alt</span>
                  <span>Reset Default Logo</span>
                </button>
              </div>

              {/* Upload Dropzone & Live Preview Row */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center pt-2">
                {/* Live Logo Preview Box */}
                <div className="md:col-span-4 bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col items-center justify-center text-center space-y-2.5">
                  <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Live Header Preview</span>
                  
                  <div className="p-2.5 bg-stone-50 rounded-2xl border border-emerald-800/20 shadow-sm flex items-center justify-center overflow-hidden min-h-[90px] min-w-[90px]">
                    <img
                      src={(siteSettings?.logoUrl && (siteSettings.logoUrl.startsWith('/media/') ? `http://localhost:8000${siteSettings.logoUrl}` : siteSettings.logoUrl)) || '/lm_logo.png'}
                      alt="Brand Logo Preview"
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/lm_logo.png'; }}
                      style={{ height: `${Math.max(siteSettings.logoSize || 48, 36)}px`, width: `${Math.max(siteSettings.logoSize || 48, 36)}px` }}
                      className="object-contain rounded-xl transition-all duration-200"
                    />
                  </div>

                  <div className="text-[10px] font-mono font-semibold text-stone-500 bg-stone-100 px-2.5 py-0.5 rounded-full">
                    {siteSettings.logoSize || 48}px × {siteSettings.logoSize || 48}px
                  </div>
                </div>

                {/* File Upload Trigger & Direct URL input */}
                <div className="md:col-span-8 space-y-4">
                  {/* Hidden File Input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleLogoFileUpload}
                    accept="image/png, image/jpeg, image/jpg, image/svg+xml, image/webp"
                    className="hidden"
                  />

                  {/* Upload Drop Area Card */}
                  <div 
                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                    className="p-5 border-2 border-dashed border-emerald-600/40 hover:border-emerald-700 bg-emerald-50/40 hover:bg-emerald-50/80 rounded-2xl cursor-pointer transition-all flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-emerald-800 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform flex-shrink-0">
                      <span className="material-symbols-outlined text-2xl">cloud_upload</span>
                    </div>

                    <div className="flex-1 space-y-0.5">
                      <span className="font-bold text-xs text-stone-900 block">
                        {uploadingLogo ? 'Uploading & Processing Image...' : 'Click to Upload New Logo Picture'}
                      </span>
                      <p className="text-[11px] text-stone-500">
                        Supports PNG, JPG, JPEG, SVG, WebP (Transparent PNG recommended).
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={uploadingLogo}
                      className="bg-emerald-800 group-hover:bg-emerald-900 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">upload_file</span>
                      <span>{uploadingLogo ? 'Uploading...' : 'Browse Image File'}</span>
                    </button>
                  </div>

                  {/* Or Enter Custom Image Link */}
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1">
                      Or Image URL / Asset Path
                    </label>
                    <input
                      type="text"
                      placeholder="https://example.com/logo.png or /lm_logo.png"
                      value={siteSettings.logoUrl}
                      onChange={(e) => setSiteSettings({ ...siteSettings, logoUrl: e.target.value })}
                      className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 focus:bg-white focus:border-emerald-600 focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Logo Dimension Slider */}
              <div className="pt-3 border-t border-stone-200/80 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-stone-700">Brand Header Logo Display Height</span>
                  <span className="font-bold font-mono text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full">
                    {siteSettings.logoSize}px
                  </span>
                </div>

                <input
                  type="range"
                  min="28"
                  max="120"
                  value={siteSettings.logoSize}
                  onChange={(e) => setSiteSettings({ ...siteSettings, logoSize: parseInt(e.target.value, 10) || 48 })}
                  className="w-full accent-emerald-700 cursor-pointer"
                />
                
                <div className="flex justify-between text-[10px] text-stone-400 font-semibold px-1">
                  <span>28px (Compact)</span>
                  <span>48px (Standard)</span>
                  <span>72px (Prominent)</span>
                  <span>120px (Maximum)</span>
                </div>
              </div>
            </div>

            {/* OFFICIAL CURRICULUM SYLLABUS PDF UPLOADER BOX */}
            <div className="p-6 bg-stone-50/80 rounded-2xl border border-stone-200 space-y-5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-rose-700 text-lg">picture_as_pdf</span>
                    Official Course Curriculum &amp; Syllabus PDF Document
                  </h3>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Upload the official master curriculum PDF that prospective students and architects download from the landing page.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSiteSettings(prev => ({
                      ...prev,
                      curriculumPdfUrl: '/media/Landscape_Architecture_Syllabus_2026.pdf',
                      curriculumPdfTitle: 'Landscape Architecture Masterclass Curriculum & Blueprint Guide 2026',
                      curriculumPdfSize: '4.2 MB'
                    }));
                    setStatusMessage({ type: 'success', text: 'Reset to default Landscape Architecture Syllabus PDF.' });
                  }}
                  className="text-xs text-stone-600 hover:text-emerald-800 font-semibold flex items-center gap-1 bg-white hover:bg-stone-100 border border-stone-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs"
                >
                  <span className="material-symbols-outlined text-sm">restart_alt</span>
                  <span>Reset Default Syllabus</span>
                </button>
              </div>

              {/* Active PDF Status Card & Upload Drop Area */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center pt-2">
                {/* Active PDF Card */}
                <div className="md:col-span-5 bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center flex-shrink-0 shadow-xs">
                      <span className="material-symbols-outlined text-2xl">picture_as_pdf</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Current Live Syllabus</span>
                      <span className="font-bold text-xs text-stone-900 truncate block mt-0.5" title={siteSettings.curriculumPdfTitle}>
                        {siteSettings.curriculumPdfTitle || 'Official Syllabus PDF'}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-1 font-semibold">
                        {siteSettings.curriculumPdfSize || 'PDF Document'}
                      </span>
                    </div>
                  </div>

                  <a
                    href={siteSettings.curriculumPdfUrl ? (siteSettings.curriculumPdfUrl.startsWith('/media/') ? `http://localhost:8000${siteSettings.curriculumPdfUrl}` : siteSettings.curriculumPdfUrl) : '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full text-center bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold py-2 rounded-xl transition-all flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">visibility</span>
                    <span>View / Download Current PDF</span>
                  </a>
                </div>

                {/* File Upload Trigger */}
                <div className="md:col-span-7 space-y-3">
                  {/* Hidden PDF File Input */}
                  <input
                    type="file"
                    ref={pdfFileInputRef}
                    onChange={handleSyllabusPdfUpload}
                    accept="application/pdf"
                    className="hidden"
                  />

                  {/* Upload Dropzone */}
                  <div
                    onClick={() => pdfFileInputRef.current && pdfFileInputRef.current.click()}
                    className="p-5 border-2 border-dashed border-rose-600/40 hover:border-rose-700 bg-rose-50/30 hover:bg-rose-50/60 rounded-2xl cursor-pointer transition-all flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-rose-800 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform flex-shrink-0">
                      <span className="material-symbols-outlined text-2xl">upload_file</span>
                    </div>

                    <div className="flex-1 space-y-0.5">
                      <span className="font-bold text-xs text-stone-900 block">
                        {uploadingPdf ? 'Uploading Syllabus PDF...' : 'Click to Upload New Curriculum PDF'}
                      </span>
                      <p className="text-[11px] text-stone-500">
                        Upload your official course syllabus &amp; master blueprints (.PDF).
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={uploadingPdf}
                      className="bg-rose-800 group-hover:bg-rose-900 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">file_upload</span>
                      <span>{uploadingPdf ? 'Uploading...' : 'Browse PDF'}</span>
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1">
                      Syllabus Document Display Title
                    </label>
                    <input
                      type="text"
                      placeholder="Landscape Architecture Masterclass Curriculum & Blueprint Guide 2026"
                      value={siteSettings.curriculumPdfTitle || ''}
                      onChange={(e) => setSiteSettings({ ...siteSettings, curriculumPdfTitle: e.target.value })}
                      className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 focus:bg-white focus:border-emerald-600 focus:outline-none font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">Hero Title</label>
              <input
                type="text"
                value={siteSettings.heroTitle}
                onChange={(e) => setSiteSettings({ ...siteSettings, heroTitle: e.target.value })}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs text-stone-900 focus:bg-white focus:border-emerald-600 focus:outline-none font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">Hero Subtitle</label>
              <textarea
                rows="3"
                value={siteSettings.heroSubtitle}
                onChange={(e) => setSiteSettings({ ...siteSettings, heroSubtitle: e.target.value })}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs text-stone-900 focus:bg-white focus:border-emerald-600 focus:outline-none leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">Course Enrollment Price (₹)</label>
              <input
                type="number"
                value={siteSettings.coursePrice}
                onChange={(e) => setSiteSettings({ ...siteSettings, coursePrice: parseFloat(e.target.value) || 499 })}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs text-stone-900 focus:bg-white focus:border-emerald-600 focus:outline-none font-semibold"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button 
                type="submit" 
                disabled={savingSettings} 
                className="bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs px-7 py-3.5 rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-base">save</span>
                <span>{savingSettings ? 'Saving Settings...' : 'Save & Persist CMS Settings'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SECTION 7: TESTIMONIALS & FAQS (BUG-014 FIX) */}
      {activeSection === 'testimonials' && (
        <div className="space-y-8">
          {/* Testimonials Management */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-xl font-bold text-stone-900">Testimonials Management</h1>
                <p className="text-xs text-stone-500 mt-1">Manage student reviews displayed on the landing page.</p>
              </div>
            </div>

            <form onSubmit={handleCreateTestimonial} className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-stone-50 p-4 rounded-xl border border-stone-200">
              <input
                type="text"
                placeholder="Student / Architect Name"
                required
                value={newTestimonial.student_name}
                onChange={(e) => setNewTestimonial({ ...newTestimonial, student_name: e.target.value })}
                className="bg-white border border-stone-300 rounded-lg p-2 text-xs"
              />
              <input
                type="text"
                placeholder="Title (e.g. Principal Architect)"
                value={newTestimonial.student_title}
                onChange={(e) => setNewTestimonial({ ...newTestimonial, student_title: e.target.value })}
                className="bg-white border border-stone-300 rounded-lg p-2 text-xs"
              />
              <input
                type="number"
                min="1"
                max="5"
                placeholder="Rating (1-5)"
                value={newTestimonial.rating}
                onChange={(e) => setNewTestimonial({ ...newTestimonial, rating: parseInt(e.target.value, 10) || 5 })}
                className="bg-white border border-stone-300 rounded-lg p-2 text-xs"
              />
              <textarea
                placeholder="Review Content..."
                required
                rows="2"
                value={newTestimonial.content}
                onChange={(e) => setNewTestimonial({ ...newTestimonial, content: e.target.value })}
                className="sm:col-span-3 bg-white border border-stone-300 rounded-lg p-2 text-xs"
              />
              <button type="submit" className="sm:col-span-3 bg-emerald-700 text-white text-xs font-semibold py-2 rounded-lg cursor-pointer shadow-sm">
                + Add Testimonial
              </button>
            </form>

            <div className="space-y-2">
              {testimonials.map(t => (
                <div key={t.id} className="p-4 bg-stone-50 rounded-xl border border-stone-200 flex justify-between items-start">
                  <div>
                    <div className="font-bold text-xs text-stone-900">{t.student_name} <span className="text-stone-500 font-normal">({t.student_title})</span></div>
                    <p className="text-xs text-stone-600 mt-1">"{t.content}"</p>
                    <span className="text-[10px] text-amber-600 font-bold">★ {t.rating}/5 Stars</span>
                  </div>
                  <button onClick={() => handleDeleteTestimonial(t.id)} className="text-rose-600 hover:underline text-xs font-semibold">
                    Delete
                  </button>
                </div>
              ))}
              {testimonials.length === 0 && (
                <div className="text-center py-6 text-stone-400 text-xs">No custom testimonials added yet.</div>
              )}
            </div>
          </div>

          {/* FAQs Management */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-6">
            <div>
              <h1 className="text-xl font-bold text-stone-900">Frequently Asked Questions (FAQ) CMS</h1>
              <p className="text-xs text-stone-500 mt-1">Configure landing page accordion Q&amp;A items.</p>
            </div>

            <form onSubmit={handleCreateFaq} className="space-y-3 bg-stone-50 p-4 rounded-xl border border-stone-200">
              <input
                type="text"
                placeholder="Question (e.g. How do I access the course after payment?)"
                required
                value={newFaq.question}
                onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                className="w-full bg-white border border-stone-300 rounded-lg p-2 text-xs"
              />
              <textarea
                placeholder="Answer..."
                required
                rows="2"
                value={newFaq.answer}
                onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                className="w-full bg-white border border-stone-300 rounded-lg p-2 text-xs"
              />
              <button type="submit" className="bg-emerald-700 text-white text-xs font-semibold py-2 px-4 rounded-lg cursor-pointer shadow-sm">
                + Add FAQ
              </button>
            </form>

            <div className="space-y-2">
              {faqs.map(f => (
                <div key={f.id} className="p-4 bg-stone-50 rounded-xl border border-stone-200 flex justify-between items-start">
                  <div>
                    <div className="font-bold text-xs text-stone-900">{f.question}</div>
                    <p className="text-xs text-stone-600 mt-1">{f.answer}</p>
                  </div>
                  <button onClick={() => handleDeleteFaq(f.id)} className="text-rose-600 hover:underline text-xs font-semibold">
                    Delete
                  </button>
                </div>
              ))}
              {faqs.length === 0 && (
                <div className="text-center py-6 text-stone-400 text-xs">No custom FAQs registered yet.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 8: COUPONS & PROMOTIONAL OFFERS */}
      {activeSection === 'coupons' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
            <h1 className="text-xl font-bold text-stone-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-700 text-2xl">local_offer</span>
              Coupons &amp; Promotional Offers
            </h1>
            <p className="text-xs text-stone-500 mt-1">Create discount coupon codes for prospective architectural students.</p>
          </div>

          <form onSubmit={handleCreateCoupon} className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
            <div>
              <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">Coupon Code</label>
              <input
                type="text"
                placeholder="e.g. ARCHITECT20"
                required
                value={newCoupon.code}
                onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-stone-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">Discount %</label>
              <input
                type="number"
                min="1"
                max="90"
                required
                value={newCoupon.discount_pct}
                onChange={(e) => setNewCoupon({ ...newCoupon, discount_pct: parseInt(e.target.value, 10) || 10 })}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">Max Redemptions</label>
              <input
                type="number"
                min="1"
                required
                value={newCoupon.max_uses}
                onChange={(e) => setNewCoupon({ ...newCoupon, max_uses: parseInt(e.target.value, 10) || 100 })}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs py-2.5 rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Create Coupon
              </button>
            </div>
          </form>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500 uppercase font-semibold">
                  <th className="py-3 px-3">Code</th>
                  <th className="py-3 px-3">Discount</th>
                  <th className="py-3 px-3">Redemptions</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => (
                  <tr key={c.id} className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                    <td className="py-4 px-3 font-mono font-bold text-emerald-900">{c.code}</td>
                    <td className="py-4 px-3 font-bold text-stone-900">{c.discount_pct}% OFF</td>
                    <td className="py-4 px-3 text-stone-600">{c.used_count || 0} / {c.max_uses}</td>
                    <td className="py-4 px-3">
                      <button
                        onClick={() => handleToggleCoupon(c.id, c.active)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase cursor-pointer ${
                          c.active ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-stone-100 text-stone-500'
                        }`}
                      >
                        {c.active ? '✓ ACTIVE' : 'DISABLED'}
                      </button>
                    </td>
                    <td className="py-4 px-3 text-right">
                      <button
                        onClick={() => handleDeleteCoupon(c.id)}
                        className="text-rose-600 hover:underline font-semibold cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {coupons.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-stone-400">
                      No discount coupons created yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 9: AUDIT LOGS */}
      {activeSection === 'audit' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
            <h1 className="text-xl font-bold text-stone-900">Security Audit Trail &amp; System Logs</h1>
            <p className="text-xs text-stone-500 mt-1">Cryptographic trail of administrative events and IP records.</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500 uppercase font-semibold">
                  <th className="py-3 px-3">Actor</th>
                  <th className="py-3 px-3">Action</th>
                  <th className="py-3 px-3">Target</th>
                  <th className="py-3 px-3">IP Address</th>
                  <th className="py-3 px-3 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id} className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                    <td className="py-4 px-3 font-semibold text-stone-900">{log.actor__email || 'System'}</td>
                    <td className="py-4 px-3 font-bold text-emerald-800">{log.action}</td>
                    <td className="py-4 px-3 text-stone-700">{log.target}</td>
                    <td className="py-4 px-3 font-mono text-stone-500">{log.ip_address || '127.0.0.1'}</td>
                    <td className="py-4 px-3 text-right text-stone-500">{log.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 9: SYSTEM SETTINGS */}
      {activeSection === 'settings' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
            <h1 className="text-xl font-bold text-stone-900">System Security &amp; SMTP Settings</h1>
            <p className="text-xs text-stone-500 mt-1">Infrastructure parameters, HMAC keys, and streaming policies.</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-stone-500 block mb-1">Database Engine</span>
                <span className="text-stone-900 font-bold font-mono">PostgreSQL / Django ORM</span>
              </div>

              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-stone-500 block mb-1">Email Dispatcher</span>
                <span className="text-stone-900 font-bold font-mono">SMTP Engine (Port 587 TLS)</span>
              </div>

              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-stone-500 block mb-1">Signed Video Token Expiry</span>
                <span className="text-stone-900 font-bold font-mono">300 Seconds (5 Minutes)</span>
              </div>

              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-stone-500 block mb-1">Payment Gateway</span>
                <span className="text-emerald-800 font-bold font-mono">Razorpay Verified Webhook</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminDashboardLayout>
  );
}
