import React, { useState, useEffect } from 'react';

export default function CourseBuilderSection({ token }) {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCoursePrice, setNewCoursePrice] = useState('499.00');
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [activeModuleId, setActiveModuleId] = useState(null);
  const [newAsset, setNewAsset] = useState({ title: '', asset_type: 'long_video', duration: '2 hrs', url: '' });
  const [activeLessonId, setActiveLessonId] = useState(null);
  const [mutationMessage, setMutationMessage] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const getAuthToken = () => token || localStorage.getItem('lm_auth_token') || '';

  useEffect(() => {
    fetchCourses();
  }, [token]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const authToken = getAuthToken();
      const headers = authToken ? { 'Authorization': `Bearer ${authToken}` } : {};
      const res = await fetch('http://localhost:8000/api/admin/courses/', { headers });
      if (res.ok) {
        const data = await res.json();
        const courseList = data.courses || [];
        setCourses(courseList);
        if (courseList.length > 0) {
          if (!selectedCourse) {
            loadCourseDetail(courseList[0].id);
          } else {
            // Check if selectedCourse still exists
            const exists = courseList.find(c => c.id === selectedCourse.id);
            if (exists) {
              loadCourseDetail(selectedCourse.id);
            } else {
              loadCourseDetail(courseList[0].id);
            }
          }
        } else {
          setSelectedCourse(null);
        }
      }
    } catch (e) {
      console.error('Failed to fetch courses:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadCourseDetail = async (courseId) => {
    try {
      const authToken = getAuthToken();
      const headers = authToken ? { 'Authorization': `Bearer ${authToken}` } : {};
      const res = await fetch(`http://localhost:8000/api/admin/courses/${courseId}/`, { headers });
      if (res.ok) {
        const data = await res.json();
        setSelectedCourse(data);
      }
    } catch (e) {
      console.error('Failed to load course details:', e);
    }
  };

  // ---------------------------------------------------------------------------
  // COURSE ACTIVATION / DEACTIVATION & STATUS MANAGEMENT
  // ---------------------------------------------------------------------------
  const handleUpdateCourseStatus = async (courseId, newStatus) => {
    setStatusUpdating(true);
    setMutationMessage(null);

    try {
      const authToken = getAuthToken();
      const headers = {
        'Content-Type': 'application/json',
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
      };
      const res = await fetch(`http://localhost:8000/api/admin/courses/${courseId}/`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        const statusLabel = newStatus === 'PUBLISHED' ? 'Activated & Published' : `Deactivated (${newStatus})`;
        setMutationMessage({
          type: 'success',
          text: `Course status successfully changed to "${statusLabel}"!`
        });
        await fetchCourses();
        if (selectedCourse?.id === courseId) {
          setSelectedCourse(prev => prev ? { ...prev, status: newStatus } : null);
        }
      } else {
        const errData = await res.json();
        setMutationMessage({ type: 'error', text: errData.error || 'Failed to update course status.' });
      }
    } catch (err) {
      console.error(err);
      setMutationMessage({ type: 'error', text: 'Network error while updating course status.' });
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleToggleActive = (course) => {
    if (!course) return;
    const isCurrentlyPublished = course.status === 'PUBLISHED';
    const nextStatus = isCurrentlyPublished ? 'DRAFT' : 'PUBLISHED';
    handleUpdateCourseStatus(course.id, nextStatus);
  };

  const handleDeleteCourse = async (courseId) => {
    if (!courseId) return;
    setLoading(true);
    setMutationMessage(null);

    try {
      const authToken = getAuthToken();
      const headers = authToken ? { 'Authorization': `Bearer ${authToken}` } : {};
      const res = await fetch(`http://localhost:8000/api/admin/courses/${courseId}/`, {
        method: 'DELETE',
        headers
      });

      if (res.ok) {
        setDeleteModalOpen(false);
        setMutationMessage({ type: 'success', text: 'Course successfully deleted.' });
        setSelectedCourse(null);
        await fetchCourses();
      } else {
        const errData = await res.json();
        setMutationMessage({ type: 'error', text: errData.error || 'Failed to delete course.' });
      }
    } catch (err) {
      console.error(err);
      setMutationMessage({ type: 'error', text: 'Network error while deleting course.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!newCourseTitle.trim()) {
      setMutationMessage({ type: 'error', text: 'Please enter a course title.' });
      return;
    }

    setLoading(true);
    setMutationMessage(null);

    try {
      const authToken = getAuthToken();
      const headers = {
        'Content-Type': 'application/json',
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
      };
      const res = await fetch('http://localhost:8000/api/admin/courses/', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: newCourseTitle.trim(),
          price: parseFloat(newCoursePrice) || 499.00
        })
      });

      const data = await res.json();

      if (res.ok && data.id) {
        const createdTitle = newCourseTitle.trim();
        setNewCourseTitle('');
        setMutationMessage({ type: 'success', text: `Course "${createdTitle}" created successfully!` });
        await fetchCourses();
        loadCourseDetail(data.id);
      } else {
        setMutationMessage({ type: 'error', text: data.error || 'Failed to create course.' });
      }
    } catch (err) {
      console.error(err);
      setMutationMessage({ type: 'error', text: 'Network error while creating course.' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddModule = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!newModuleTitle.trim() || !selectedCourse) return;

    try {
      const authToken = getAuthToken();
      const headers = {
        'Content-Type': 'application/json',
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
      };
      const res = await fetch(`http://localhost:8000/api/admin/courses/${selectedCourse.id}/modules/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ title: newModuleTitle.trim() })
      });

      if (res.ok) {
        setNewModuleTitle('');
        setMutationMessage({ type: 'success', text: 'Module successfully added and persisted!' });
        loadCourseDetail(selectedCourse.id);
      } else {
        const errData = await res.json();
        setMutationMessage({ type: 'error', text: errData.error || 'Failed to add module.' });
      }
    } catch (err) {
      console.error(err);
      setMutationMessage({ type: 'error', text: 'Failed to add module.' });
    }
  };

  const handleAddLesson = async (modId, e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!newLessonTitle.trim() || !selectedCourse) return;

    try {
      const authToken = getAuthToken();
      const headers = {
        'Content-Type': 'application/json',
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
      };
      const res = await fetch(`http://localhost:8000/api/admin/modules/${modId}/lessons/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ title: newLessonTitle.trim() })
      });

      if (res.ok) {
        setNewLessonTitle('');
        setActiveModuleId(null);
        setMutationMessage({ type: 'success', text: 'Lesson successfully added and persisted!' });
        loadCourseDetail(selectedCourse.id);
      } else {
        const errData = await res.json();
        setMutationMessage({ type: 'error', text: errData.error || 'Failed to add lesson.' });
      }
    } catch (err) {
      console.error(err);
      setMutationMessage({ type: 'error', text: 'Failed to add lesson.' });
    }
  };

  const handleAddAsset = async (lesId, e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!newAsset.title.trim() || !selectedCourse) return;

    try {
      const authToken = getAuthToken();
      const headers = {
        'Content-Type': 'application/json',
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
      };
      const res = await fetch(`http://localhost:8000/api/admin/lessons/${lesId}/assets/`, {
        method: 'POST',
        headers,
        body: JSON.stringify(newAsset)
      });

      if (res.ok) {
        setNewAsset({ title: '', asset_type: 'long_video', duration: '2 hrs', url: '' });
        setActiveLessonId(null);
        setMutationMessage({ type: 'success', text: 'Media asset successfully attached to lesson!' });
        loadCourseDetail(selectedCourse.id);
      } else {
        const errData = await res.json();
        setMutationMessage({ type: 'error', text: errData.error || 'Failed to attach asset.' });
      }
    } catch (err) {
      console.error(err);
      setMutationMessage({ type: 'error', text: 'Failed to attach asset.' });
    }
  };

  const isSelectedPublished = selectedCourse?.status === 'PUBLISHED';

  return (
    <div className="space-y-6 font-body-md">
      {/* Top Banner & Fast Creation Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-700 text-2xl">auto_stories</span>
            Hierarchical Course &amp; Curriculum Builder
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Build, activate, de-activate courses, modules, lessons, and attach DRM-ready masterclasses and PDF blueprints.
          </p>
        </div>

        <form onSubmit={handleCreateCourse} className="flex items-center gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="New Course Title..."
            value={newCourseTitle}
            onChange={(e) => setNewCourseTitle(e.target.value)}
            className="bg-stone-50 border border-stone-300 rounded-xl px-4 py-2 text-xs text-stone-900 focus:border-emerald-600 focus:bg-white focus:outline-none w-64 shadow-inner"
          />
          <button 
            type="submit" 
            disabled={loading}
            className="bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5 flex-shrink-0"
          >
            <span className="material-symbols-outlined text-sm">add_circle</span>
            {loading ? 'Creating...' : 'Create Course'}
          </button>
        </form>
      </div>

      {mutationMessage && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between shadow-sm ${
          mutationMessage.type === 'success' ? 'bg-emerald-50 border border-emerald-300 text-emerald-950' : 'bg-rose-50 border border-rose-300 text-rose-950'
        }`}>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">
              {mutationMessage.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <span>{mutationMessage.text}</span>
          </div>
          <button onClick={() => setMutationMessage(null)} className="text-stone-400 hover:text-stone-700">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Course List Left */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-bold text-stone-700 uppercase tracking-wider">All Courses ({courses.length})</h2>
            <span className="text-[10px] text-stone-400 font-semibold">Active Database</span>
          </div>

          <div className="space-y-2.5">
            {courses.length === 0 ? (
              <div className="p-8 text-center bg-stone-50 rounded-xl border border-dashed border-stone-300 space-y-2">
                <span className="material-symbols-outlined text-3xl text-stone-400">post_add</span>
                <p className="text-xs font-semibold text-stone-600">No courses created yet.</p>
                <p className="text-[11px] text-stone-400">Type a course title above and click <b>Create Course</b>.</p>
              </div>
            ) : (
              courses.map(c => {
                const isPub = c.status === 'PUBLISHED';
                const isSelected = selectedCourse?.id === c.id;

                return (
                  <div
                    key={c.id}
                    onClick={() => loadCourseDetail(c.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-emerald-50/90 border-emerald-600 text-emerald-950 shadow-sm ring-1 ring-emerald-600'
                        : 'bg-stone-50/60 border-stone-200 text-stone-600 hover:bg-stone-100 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <span className="font-bold text-xs leading-tight text-stone-900 line-clamp-2">{c.title}</span>
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-100/60 px-2 py-0.5 rounded flex-shrink-0">
                        ₹{c.price}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] pt-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-full font-bold uppercase border flex items-center gap-1 ${
                          isPub
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : c.status === 'DRAFT'
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-stone-200 text-stone-700 border-stone-300'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isPub ? 'bg-emerald-600 animate-pulse' : 'bg-amber-600'}`} />
                          {isPub ? 'Active' : `Deactive (${c.status})`}
                        </span>
                        <span className="text-stone-500">{c.modulesCount || 0} Modules</span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleActive(c);
                        }}
                        disabled={statusUpdating}
                        title={isPub ? 'Click to Deactivate Course' : 'Click to Activate & Publish Course'}
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                          isPub
                            ? 'bg-white hover:bg-amber-50 text-amber-800 border-amber-300 hover:border-amber-400'
                            : 'bg-emerald-800 hover:bg-emerald-700 text-white border-emerald-800'
                        }`}
                      >
                        {isPub ? 'Deactivate' : 'Publish'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Course Structure Right */}
        <div className="lg:col-span-8 space-y-6">
          {selectedCourse ? (
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-6">
              {/* Course Header with Status & Activation Controls */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-5 border-b border-stone-200 gap-4">
                <div>
                  <h2 className="text-lg font-bold text-stone-900">{selectedCourse.title}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-mono text-emerald-700">/{selectedCourse.slug}</span>
                    <span className="text-stone-300">•</span>
                    <span className="text-xs font-semibold text-stone-500">₹{selectedCourse.price}</span>
                  </div>
                </div>

                {/* Status & Deactivate/Activate Actions */}
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Status Dropdown */}
                  <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-300 rounded-xl px-3 py-1.5">
                    <span className="text-[11px] font-semibold text-stone-500">Status:</span>
                    <select
                      value={selectedCourse.status}
                      disabled={statusUpdating}
                      onChange={(e) => handleUpdateCourseStatus(selectedCourse.id, e.target.value)}
                      className="bg-transparent text-xs font-bold text-stone-800 focus:outline-none cursor-pointer"
                    >
                      <option value="PUBLISHED">PUBLISHED (Active &amp; Live)</option>
                      <option value="DRAFT">DRAFT (Deactivated)</option>
                      <option value="ARCHIVED">ARCHIVED (Deactivated)</option>
                    </select>
                  </div>

                  {/* 1-Click Toggle Active Button */}
                  <button
                    onClick={() => handleToggleActive(selectedCourse)}
                    disabled={statusUpdating}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                      isSelectedPublished
                        ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-emerald-800 hover:bg-emerald-700 text-white border border-emerald-800 shadow-md'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">
                      {isSelectedPublished ? 'pause_circle' : 'rocket_launch'}
                    </span>
                    <span>
                      {statusUpdating
                        ? 'Updating...'
                        : isSelectedPublished
                        ? 'Deactivate Course'
                        : 'Activate & Publish Course'}
                    </span>
                  </button>

                  {/* Delete Course Button */}
                  <button
                    onClick={() => setDeleteModalOpen(true)}
                    className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-stone-200 hover:border-rose-200 transition-colors cursor-pointer"
                    title="Delete Course"
                  >
                    <span className="material-symbols-outlined text-base">delete</span>
                  </button>
                </div>
              </div>

              {/* Deactivated Warning Alert Banner */}
              {!isSelectedPublished && (
                <div className="p-4 bg-amber-50/90 border border-amber-300 rounded-xl text-xs text-amber-950 flex items-start gap-3 shadow-xs">
                  <span className="material-symbols-outlined text-amber-700 text-lg flex-shrink-0 mt-0.5">
                    warning
                  </span>
                  <div className="flex-1 space-y-1">
                    <strong className="font-bold block">Course is currently Deactivated ({selectedCourse.status})</strong>
                    <p className="text-amber-800">
                      This course is hidden from the public website, enrollment checkout, and prospective students. Click <b>"Activate &amp; Publish Course"</b> above to make it live.
                    </p>
                  </div>
                  <button
                    onClick={() => handleUpdateCourseStatus(selectedCourse.id, 'PUBLISHED')}
                    className="bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-all shadow-xs cursor-pointer flex-shrink-0"
                  >
                    Make Live Now
                  </button>
                </div>
              )}

              {/* Add Module Form */}
              <form onSubmit={handleAddModule} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter Module Title (e.g. Module 1: Spatial Topography & Grading)..."
                  value={newModuleTitle}
                  onChange={(e) => setNewModuleTitle(e.target.value)}
                  className="flex-1 bg-stone-50 border border-stone-300 rounded-xl px-4 py-2 text-xs text-stone-900 focus:border-emerald-600 focus:bg-white focus:outline-none"
                />
                <button type="submit" className="bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs px-5 py-2 rounded-xl transition-all shadow-sm cursor-pointer">
                  + Add Module
                </button>
              </form>

              {/* Modules & Lessons Tree */}
              <div className="space-y-4">
                {selectedCourse.modules && selectedCourse.modules.length > 0 ? (
                  selectedCourse.modules.map(mod => (
                    <div key={mod.id} className="bg-stone-50 rounded-xl p-5 border border-stone-200/80 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-xs text-stone-900">{mod.title}</span>
                        <button
                          onClick={() => setActiveModuleId(activeModuleId === mod.id ? null : mod.id)}
                          className="text-xs font-semibold text-stone-700 bg-white hover:bg-stone-100 border border-stone-200 px-3 py-1 rounded-lg shadow-sm cursor-pointer"
                        >
                          + Add Lesson
                        </button>
                      </div>

                      {/* Add Lesson Form Popup */}
                      {activeModuleId === mod.id && (
                        <form onSubmit={(e) => handleAddLesson(mod.id, e)} className="flex gap-2 pt-2">
                          <input
                            type="text"
                            placeholder="Lesson Title..."
                            value={newLessonTitle}
                            onChange={(e) => setNewLessonTitle(e.target.value)}
                            className="flex-1 bg-white border border-stone-300 rounded-lg px-3 py-1.5 text-xs text-stone-900"
                          />
                          <button type="submit" className="bg-emerald-800 text-white text-xs px-3.5 py-1.5 rounded-lg font-semibold shadow-sm cursor-pointer">
                            Save Lesson
                          </button>
                        </form>
                      )}

                      {/* Lessons List */}
                      <div className="space-y-3 pl-4 border-l-2 border-emerald-600/40">
                        {mod.lessons && mod.lessons.map(les => (
                          <div key={les.id} className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="font-semibold text-xs text-stone-800">{les.title}</span>
                              <button
                                onClick={() => setActiveLessonId(activeLessonId === les.id ? null : les.id)}
                                className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 cursor-pointer"
                              >
                                + Attach Video/PDF
                              </button>
                            </div>

                            {/* Add Media Asset Form */}
                            {activeLessonId === les.id && (
                              <form onSubmit={(e) => handleAddAsset(les.id, e)} className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-stone-50 p-3 rounded-lg border border-stone-200">
                                <input
                                  type="text"
                                  placeholder="Asset Title..."
                                  value={newAsset.title}
                                  onChange={(e) => setNewAsset({ ...newAsset, title: e.target.value })}
                                  className="bg-white border border-stone-300 text-xs text-stone-900 p-2 rounded-lg"
                                />
                                <select
                                  value={newAsset.asset_type}
                                  onChange={(e) => setNewAsset({ ...newAsset, asset_type: e.target.value })}
                                  className="bg-white border border-stone-300 text-xs text-stone-900 p-2 rounded-lg"
                                >
                                  <option value="long_video">Long Masterclass Video (2+ hrs)</option>
                                  <option value="short_video">Short Video (1-10 mins)</option>
                                  <option value="pdf">PDF Blueprint / Document</option>
                                </select>
                                <input
                                  type="text"
                                  placeholder="Duration (e.g. 2h 30m)..."
                                  value={newAsset.duration}
                                  onChange={(e) => setNewAsset({ ...newAsset, duration: e.target.value })}
                                  className="bg-white border border-stone-300 text-xs text-stone-900 p-2 rounded-lg"
                                />
                                <input
                                  type="text"
                                  placeholder="Video URL or Cloud Link..."
                                  value={newAsset.url}
                                  onChange={(e) => setNewAsset({ ...newAsset, url: e.target.value })}
                                  className="bg-white border border-stone-300 text-xs text-stone-900 p-2 rounded-lg"
                                />
                                <button type="submit" className="sm:col-span-2 bg-emerald-800 text-white text-xs font-semibold p-2 rounded-lg shadow-sm cursor-pointer">
                                  Save &amp; Persist Asset
                                </button>
                              </form>
                            )}

                            {/* Attached Media Assets */}
                            <div className="space-y-1.5">
                              {les.assets && les.assets.map(asset => (
                                <div key={asset.id} className="flex justify-between items-center bg-stone-50 p-2.5 rounded-lg text-xs border border-stone-200/60">
                                  <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm text-emerald-700">
                                      {asset.asset_type === 'pdf' ? 'picture_as_pdf' : 'play_circle'}
                                    </span>
                                    <span className="font-medium text-stone-800">{asset.title}</span>
                                  </div>
                                  <span className="text-[10px] font-bold bg-white border border-stone-200 px-2 py-0.5 rounded text-stone-600">
                                    {asset.duration}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-stone-400 text-xs bg-stone-50 rounded-xl border border-stone-200">
                    No modules added to this course yet. Use the input above to add your first module.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-stone-400 bg-white rounded-2xl border border-stone-200 shadow-sm">
              {loading ? 'Loading course details...' : 'Select a course on the left to edit modules and lessons, or create a new course above.'}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && selectedCourse && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <span className="material-symbols-outlined text-2xl">delete_forever</span>
              <h3 className="font-bold text-base text-stone-900">Delete Course</h3>
            </div>
            <p className="text-xs text-stone-600">
              Are you sure you want to permanently delete <b>"{selectedCourse.title}"</b>? This will remove all associated modules, lessons, and assets.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold py-2.5 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteCourse(selectedCourse.id)}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold py-2.5 rounded-xl transition-colors cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
