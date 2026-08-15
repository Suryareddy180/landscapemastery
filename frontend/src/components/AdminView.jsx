import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function AdminView({ user, onNavigate, token }) {
  const [activeTab, setActiveTab] = useState('analytics');
  const [analytics, setAnalytics] = useState({
    studentCount: 128,
    totalRevenue: 63872,
    shortVideoCount: 12,
    longVideoCount: 4,
    pdfCount: 8,
    totalContent: 24
  });

  const [settings, setSettings] = useState({
    heroTitle: 'Master the Art of Landscape Architecture',
    heroSubtitle: 'Elevate your architectural vision. Access industry-leading video modules, spatial planning frameworks, and achieve complete mastery.',
    logoSize: 48,
    logoFitMode: 'auto',
    coursePrice: 499
  });

  const [contentList, setContentList] = useState([
    { id: 1, title: 'The Foundation of Space & Spatial Layouts', content_type: 'long_video', duration: '2 hrs 15 mins', cost: '499.00', url: 'https://example.com/video1.mp4' },
    { id: 2, title: 'Quick Hardscape Material Specs Blueprint', content_type: 'pdf', duration: '12 Pages PDF', cost: '0.00', url: 'https://example.com/blueprint1.pdf' },
    { id: 3, title: 'Botanical Lighting Accent Technique', content_type: 'short_video', duration: '8 mins', cost: '0.00', url: 'https://example.com/video2.mp4' },
  ]);

  const [students, setStudents] = useState([
    { email: 'suryareddynallimilli@gmail.com', phone: '+91 9876543210', paid: true, created_at: '2026-08-15' },
    { email: 'architect@example.com', phone: '+1 555-0192', paid: true, created_at: '2026-08-14' },
  ]);

  const [newContent, setNewContent] = useState({
    title: '',
    content_type: 'short_video',
    url: '',
    duration: '10 mins',
    cost: '0.00'
  });

  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      if (token) {
        const headers = { 'Authorization': `Bearer ${token}` };
        
        const analyticsRes = await fetch('http://localhost:8000/api/admin/analytics/', { headers });
        if (analyticsRes.ok) {
          const data = await analyticsRes.json();
          setAnalytics(data);
        }

        const settingsRes = await fetch('http://localhost:8000/api/admin/settings/', { headers });
        if (settingsRes.ok) {
          const data = await settingsRes.json();
          setSettings(data);
        }

        const contentRes = await fetch('http://localhost:8000/api/admin/content/', { headers });
        if (contentRes.ok) {
          const data = await contentRes.json();
          if (data.content && data.content.length > 0) {
            setContentList(data.content);
          }
        }

        const studentsRes = await fetch('http://localhost:8000/api/admin/students/', { headers });
        if (studentsRes.ok) {
          const data = await studentsRes.json();
          if (data.students && data.students.length > 0) {
            setStudents(data.students);
          }
        }
      }
    } catch (e) {
      console.log('Using local fallback state for admin view');
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      if (token) {
        await fetch('http://localhost:8000/api/admin/settings/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(settings)
        });
      }
    } catch (err) {
      console.error(err);
    }
    setSavingSettings(false);
  };

  const handleAddContent = async (e) => {
    e.preventDefault();
    if (!newContent.title) return;

    try {
      if (token) {
        const res = await fetch('http://localhost:8000/api/admin/content/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(newContent)
        });
        if (res.ok) {
          fetchData();
        }
      } else {
        setContentList([...contentList, { ...newContent, id: Date.now() }]);
      }
      setNewContent({ title: '', content_type: 'short_video', url: '', duration: '10 mins', cost: '0.00' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteContent = async (id) => {
    try {
      if (token) {
        await fetch(`http://localhost:8000/api/admin/content/${id}/`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchData();
      } else {
        setContentList(contentList.filter(item => item.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl mb-8 flex flex-col md:flex-row justify-between items-center gap-4 border border-emerald-900/20 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-container text-white flex items-center font-bold justify-center text-xl shadow-lg">
            A
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-headline-md text-2xl font-bold text-on-surface">Executive Admin Portal</h1>
              <span className="bg-emerald-500/20 text-emerald-800 text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                System Admin
              </span>
            </div>
            <p className="text-on-surface-variant text-sm mt-0.5">Logged in as {user?.email || 'admin@landscapemastery.com'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => onNavigate('v3')}
            className="px-4 py-2 bg-surface-container-high rounded-xl text-on-surface font-semibold text-sm hover:bg-surface-container transition-all"
          >
            Student Portal Preview
          </button>
          <button 
            onClick={() => onNavigate('v1')}
            className="px-4 py-2 bg-rose-500/10 text-rose-700 hover:bg-rose-500/20 rounded-xl font-semibold text-sm transition-all"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 border-b border-outline-variant/30">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-5 py-3 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${
            activeTab === 'analytics'
              ? 'bg-primary-container text-white shadow-lg'
              : 'text-on-surface-variant hover:bg-surface-container-low'
          }`}
        >
          <span className="material-symbols-outlined text-lg">analytics</span>
          Dashboard Analytics
        </button>

        <button
          onClick={() => setActiveTab('content')}
          className={`px-5 py-3 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${
            activeTab === 'content'
              ? 'bg-primary-container text-white shadow-lg'
              : 'text-on-surface-variant hover:bg-surface-container-low'
          }`}
        >
          <span className="material-symbols-outlined text-lg">video_library</span>
          Content Management (Video &amp; PDF)
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-5 py-3 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${
            activeTab === 'settings'
              ? 'bg-primary-container text-white shadow-lg'
              : 'text-on-surface-variant hover:bg-surface-container-low'
          }`}
        >
          <span className="material-symbols-outlined text-lg">settings</span>
          Landing Page &amp; Logo Adjuster
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className={`px-5 py-3 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${
            activeTab === 'students'
              ? 'bg-primary-container text-white shadow-lg'
              : 'text-on-surface-variant hover:bg-surface-container-low'
          }`}
        >
          <span className="material-symbols-outlined text-lg">group</span>
          Student Roster ({students.length})
        </button>
      </div>

      {/* TAB 1: ANALYTICS DASHBOARD */}
      {activeTab === 'analytics' && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="glass-card p-6 rounded-2xl border border-white/70 shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <span className="text-on-surface-variant text-sm font-semibold uppercase tracking-wider">Total Students</span>
                <span className="material-symbols-outlined text-emerald-600 bg-emerald-100 p-2 rounded-xl">group</span>
              </div>
              <div className="text-3xl font-bold text-on-surface">{analytics.studentCount}</div>
              <p className="text-xs text-emerald-700 font-semibold mt-2">↑ 100% Verified Paid Enrollees</p>
            </div>

            <div className="glass-card p-6 rounded-2xl border border-white/70 shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <span className="text-on-surface-variant text-sm font-semibold uppercase tracking-wider">Total Revenue</span>
                <span className="material-symbols-outlined text-emerald-600 bg-emerald-100 p-2 rounded-xl">payments</span>
              </div>
              <div className="text-3xl font-bold text-on-surface">₹{analytics.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-emerald-700 font-semibold mt-2">Lifetime Access Sales</p>
            </div>

            <div className="glass-card p-6 rounded-2xl border border-white/70 shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <span className="text-on-surface-variant text-sm font-semibold uppercase tracking-wider">Videos Published</span>
                <span className="material-symbols-outlined text-emerald-600 bg-emerald-100 p-2 rounded-xl">movie</span>
              </div>
              <div className="text-3xl font-bold text-on-surface">{analytics.shortVideoCount + analytics.longVideoCount}</div>
              <p className="text-xs text-on-surface-variant mt-2">{analytics.longVideoCount} Masterclasses (2h+) • {analytics.shortVideoCount} Short Clips</p>
            </div>

            <div className="glass-card p-6 rounded-2xl border border-white/70 shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <span className="text-on-surface-variant text-sm font-semibold uppercase tracking-wider">PDF Blueprints</span>
                <span className="material-symbols-outlined text-emerald-600 bg-emerald-100 p-2 rounded-xl">picture_as_pdf</span>
              </div>
              <div className="text-3xl font-bold text-on-surface">{analytics.pdfCount}</div>
              <p className="text-xs text-on-surface-variant mt-2">Downloadable Architectural Guides</p>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-white/70">
            <h3 className="text-lg font-bold text-on-surface mb-4">Platform Performance &amp; Engagement Overview</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm font-semibold text-on-surface mb-1">
                  <span>Long Masterclasses Completion Rate (2+ Hours)</span>
                  <span>94.2%</span>
                </div>
                <div className="w-full h-3 bg-surface-container rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-600 rounded-full w-[94%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm font-semibold text-on-surface mb-1">
                  <span>PDF Blueprint Downloads</span>
                  <span>88.5%</span>
                </div>
                <div className="w-full h-3 bg-surface-container rounded-full overflow-hidden">
                  <div className="h-full bg-teal-600 rounded-full w-[88%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm font-semibold text-on-surface mb-1">
                  <span>DRM Anti-Piracy Watermark Active Streams</span>
                  <span>100%</span>
                </div>
                <div className="w-full h-3 bg-surface-container rounded-full overflow-hidden">
                  <div className="h-full bg-primary-container rounded-full w-[100%]" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* TAB 2: CONTENT MANAGEMENT (VIDEOS & PDF) */}
      {activeTab === 'content' && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          <div className="glass-panel p-6 rounded-2xl border border-white/70">
            <h2 className="text-lg font-bold text-on-surface mb-4">Post &amp; Publish New Educational Content</h2>
            <form onSubmit={handleAddContent} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Masterclass: Earthwork Layouts & Structural Planning"
                  value={newContent.title}
                  onChange={(e) => setNewContent({ ...newContent, title: e.target.value })}
                  className="w-full input-field p-3 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Content Type</label>
                <select
                  value={newContent.content_type}
                  onChange={(e) => setNewContent({ ...newContent, content_type: e.target.value })}
                  className="w-full input-field p-3 rounded-xl text-sm"
                >
                  <option value="short_video">Short Video (1 - 10 mins)</option>
                  <option value="long_video">Long Video / Masterclass (2+ hours)</option>
                  <option value="pdf">PDF Blueprint / Document Download</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Duration / Page Count</label>
                <input
                  type="text"
                  placeholder="e.g. 2 hrs 45 mins or 18 Pages PDF"
                  value={newContent.duration}
                  onChange={(e) => setNewContent({ ...newContent, duration: e.target.value })}
                  className="w-full input-field p-3 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Content URL / File Link</label>
                <input
                  type="text"
                  placeholder="https://cdn.landscapemastery.com/files/module_masterclass.mp4"
                  value={newContent.url}
                  onChange={(e) => setNewContent({ ...newContent, url: e.target.value })}
                  className="w-full input-field p-3 rounded-xl text-sm"
                />
              </div>

              <div className="md:col-span-2 flex justify-end">
                <button
                  type="submit"
                  className="btn-primary px-6 py-3 rounded-xl text-sm font-semibold flex items-center gap-2"
                >
                  <span className="material-symbols-outlined">cloud_upload</span>
                  Publish Resource
                </button>
              </div>
            </form>
          </div>

          {/* Content List Table */}
          <div className="glass-panel p-6 rounded-2xl border border-white/70 overflow-x-auto">
            <h2 className="text-lg font-bold text-on-surface mb-4">Published Platform Resources</h2>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-outline-variant/30 text-on-surface-variant font-semibold">
                  <th className="py-3 px-2">Title</th>
                  <th className="py-3 px-2">Type</th>
                  <th className="py-3 px-2">Duration</th>
                  <th className="py-3 px-2">Price</th>
                  <th className="py-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {contentList.map((item) => (
                  <tr key={item.id} className="border-b border-outline-variant/20 hover:bg-surface-container-low/50">
                    <td className="py-4 px-2 font-medium text-on-surface">{item.title}</td>
                    <td className="py-4 px-2">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        item.content_type === 'long_video' ? 'bg-indigo-100 text-indigo-800' :
                        item.content_type === 'pdf' ? 'bg-amber-100 text-amber-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {item.content_type === 'long_video' ? 'Long Video (2h+)' : item.content_type === 'pdf' ? 'PDF Document' : 'Short Video'}
                      </span>
                    </td>
                    <td className="py-4 px-2 text-on-surface-variant">{item.duration}</td>
                    <td className="py-4 px-2 font-semibold text-emerald-800">${item.cost}</td>
                    <td className="py-4 px-2 text-right">
                      <button
                        onClick={() => handleDeleteContent(item.id)}
                        className="text-rose-600 hover:text-rose-800 font-semibold text-xs bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* TAB 3: LANDING PAGE & LOGO ADJUSTER */}
      {activeTab === 'settings' && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          <div className="glass-panel p-6 rounded-2xl border border-white/70">
            <h2 className="text-lg font-bold text-on-surface mb-2">Landing Page &amp; Brand Logo Customization</h2>
            <p className="text-xs text-on-surface-variant mb-6">Adjust your brand logo dimensions, fit mode, and main hero headline in real-time.</p>

            <form onSubmit={handleSaveSettings} className="space-y-6">
              {/* Interactive Logo Sizer */}
              <div className="p-4 bg-surface-container-low/70 rounded-xl border border-outline-variant/30 space-y-4">
                <div className="flex justify-between items-center">
                  <label className="font-semibold text-sm text-on-surface">Header Brand Logo Height: <span className="text-emerald-700 font-bold">{settings.logoSize}px</span></label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, logoFitMode: 'auto' })}
                      className={`text-xs font-semibold px-3 py-1 rounded-lg ${settings.logoFitMode === 'auto' ? 'bg-primary-container text-white' : 'bg-surface-container text-on-surface'}`}
                    >
                      Auto-Adjust
                    </button>
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, logoFitMode: 'manual' })}
                      className={`text-xs font-semibold px-3 py-1 rounded-lg ${settings.logoFitMode === 'manual' ? 'bg-primary-container text-white' : 'bg-surface-container text-on-surface'}`}
                    >
                      Manual Scale
                    </button>
                  </div>
                </div>

                <input
                  type="range"
                  min="28"
                  max="120"
                  value={settings.logoSize}
                  onChange={(e) => setSettings({ ...settings, logoSize: parseInt(e.target.value) })}
                  className="w-full accent-primary-container cursor-pointer"
                />

                <div className="flex items-center gap-4 pt-2">
                  <span className="text-xs font-semibold text-on-surface-variant">Live Preview:</span>
                  <div className="p-3 bg-surface-container rounded-xl border border-white flex items-center">
                    <img 
                      src="/lm_logo.png" 
                      alt="Brand Logo Preview" 
                      style={{ height: `${settings.logoSize}px`, width: settings.logoFitMode === 'auto' ? 'auto' : `${settings.logoSize * 1.5}px` }}
                      className="object-contain transition-all duration-200"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Hero Title</label>
                <input
                  type="text"
                  value={settings.heroTitle}
                  onChange={(e) => setSettings({ ...settings, heroTitle: e.target.value })}
                  className="w-full input-field p-3 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Hero Subtitle</label>
                <textarea
                  rows="3"
                  value={settings.heroSubtitle}
                  onChange={(e) => setSettings({ ...settings, heroSubtitle: e.target.value })}
                  className="w-full input-field p-3 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Course Price ($ / ₹)</label>
                <input
                  type="number"
                  value={settings.coursePrice}
                  onChange={(e) => setSettings({ ...settings, coursePrice: parseFloat(e.target.value) })}
                  className="w-full input-field p-3 rounded-xl text-sm"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="btn-primary px-6 py-3 rounded-xl text-sm font-semibold flex items-center gap-2"
                >
                  <span className="material-symbols-outlined">save</span>
                  {savingSettings ? 'Saving...' : 'Save Site Settings'}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      )}

      {/* TAB 4: STUDENT ROSTER */}
      {activeTab === 'students' && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          <div className="glass-panel p-6 rounded-2xl border border-white/70 overflow-x-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-on-surface">Verified Enrolled Students</h2>
              <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full uppercase">
                {students.length} Verified Enrollees
              </span>
            </div>

            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-outline-variant/30 text-on-surface-variant font-semibold">
                  <th className="py-3 px-2">Student Email</th>
                  <th className="py-3 px-2">Phone / Password</th>
                  <th className="py-3 px-2">Enrollment Date</th>
                  <th className="py-3 px-2">Payment Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map((std, idx) => (
                  <tr key={idx} className="border-b border-outline-variant/20 hover:bg-surface-container-low/50">
                    <td className="py-4 px-2 font-medium text-on-surface">{std.email}</td>
                    <td className="py-4 px-2 font-mono text-on-surface-variant">{std.phone || 'N/A'}</td>
                    <td className="py-4 px-2 text-on-surface-variant">{std.created_at || 'Recent'}</td>
                    <td className="py-4 px-2">
                      <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full">
                        ✓ PAID &amp; VERIFIED
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
