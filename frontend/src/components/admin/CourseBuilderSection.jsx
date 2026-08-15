import React, { useState, useEffect } from 'react';

export default function CourseBuilderSection({ token }) {
  const [courses, setCourses] = useState([
    {
      id: 1,
      title: 'Landscape Architecture Executive Curriculum',
      slug: 'landscape-architecture-executive',
      price: '499.00',
      status: 'PUBLISHED',
      modules: [
        {
          id: 101,
          title: 'Module 1: Spatial Planning & Site Analysis',
          order: 1,
          lessons: [
            {
              id: 1001,
              title: 'Lesson 1.1: Environmental Topography & Earthwork Layouts',
              order: 1,
              assets: [
                { id: 501, title: 'Executive Masterclass Video (2h 45m)', asset_type: 'long_video', duration: '2 hrs 45 mins' },
                { id: 502, title: 'Hardscape Layout Spec Sheet PDF', asset_type: 'pdf', duration: '14 Pages PDF' }
              ]
            }
          ]
        }
      ]
    }
  ]);

  const [selectedCourse, setSelectedCourse] = useState(courses[0]);
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCoursePrice, setNewCoursePrice] = useState('499.00');
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [activeModuleId, setActiveModuleId] = useState(null);
  const [newAsset, setNewAsset] = useState({ title: '', asset_type: 'long_video', duration: '2 hrs', url: '' });
  const [activeLessonId, setActiveLessonId] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      if (token) {
        const res = await fetch('http://localhost:8000/api/admin/courses/', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.courses && data.courses.length > 0) {
            setCourses(data.courses);
            if (!selectedCourse) setSelectedCourse(data.courses[0]);
          }
        }
      }
    } catch (e) {
      console.log('Using local course state');
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!newCourseTitle) return;

    try {
      if (token) {
        const res = await fetch('http://localhost:8000/api/admin/courses/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ title: newCourseTitle, price: newCoursePrice })
        });
        if (res.ok) fetchCourses();
      } else {
        const newC = { id: Date.now(), title: newCourseTitle, price: newCoursePrice, status: 'PUBLISHED', modules: [] };
        setCourses([...courses, newC]);
        setSelectedCourse(newC);
      }
      setNewCourseTitle('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddModule = (e) => {
    e.preventDefault();
    if (!newModuleTitle || !selectedCourse) return;

    const newMod = { id: Date.now(), title: newModuleTitle, order: (selectedCourse.modules?.length || 0) + 1, lessons: [] };
    const updatedModules = [...(selectedCourse.modules || []), newMod];
    const updatedCourse = { ...selectedCourse, modules: updatedModules };
    
    setSelectedCourse(updatedCourse);
    setCourses(courses.map(c => c.id === selectedCourse.id ? updatedCourse : c));
    setNewModuleTitle('');
  };

  const handleAddLesson = (modId, e) => {
    e.preventDefault();
    if (!newLessonTitle || !selectedCourse) return;

    const updatedModules = selectedCourse.modules.map(mod => {
      if (mod.id === modId) {
        const newLes = { id: Date.now(), title: newLessonTitle, order: mod.lessons.length + 1, assets: [] };
        return { ...mod, lessons: [...mod.lessons, newLes] };
      }
      return mod;
    });

    const updatedCourse = { ...selectedCourse, modules: updatedModules };
    setSelectedCourse(updatedCourse);
    setCourses(courses.map(c => c.id === selectedCourse.id ? updatedCourse : c));
    setNewLessonTitle('');
    setActiveModuleId(null);
  };

  const handleAddAsset = (lesId, e) => {
    e.preventDefault();
    if (!newAsset.title || !selectedCourse) return;

    const updatedModules = selectedCourse.modules.map(mod => {
      const updatedLessons = mod.lessons.map(les => {
        if (les.id === lesId) {
          const createdAsset = { id: Date.now(), ...newAsset };
          return { ...les, assets: [...(les.assets || []), createdAsset] };
        }
        return les;
      });
      return { ...mod, lessons: updatedLessons };
    });

    const updatedCourse = { ...selectedCourse, modules: updatedModules };
    setSelectedCourse(updatedCourse);
    setCourses(courses.map(c => c.id === selectedCourse.id ? updatedCourse : c));
    setNewAsset({ title: '', asset_type: 'long_video', duration: '2 hrs', url: '' });
    setActiveLessonId(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-700 text-2xl">auto_stories</span>
            Hierarchical Course &amp; Curriculum Builder
          </h1>
          <p className="text-xs text-stone-500 mt-1">Structure courses, modules, lessons, and attach short/long video masterclasses or PDF blueprints.</p>
        </div>

        <form onSubmit={handleCreateCourse} className="flex gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="New Course Title..."
            value={newCourseTitle}
            onChange={(e) => setNewCourseTitle(e.target.value)}
            className="bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 text-xs text-stone-900 focus:border-emerald-600 focus:bg-white focus:outline-none"
          />
          <button type="submit" className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all shadow-sm">
            Create Course
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Course List Left */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-3">
          <h2 className="text-xs font-bold text-stone-700 uppercase tracking-wider">All Platform Courses ({courses.length})</h2>
          <div className="space-y-2">
            {courses.map(c => (
              <div
                key={c.id}
                onClick={() => setSelectedCourse(c)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedCourse?.id === c.id
                    ? 'bg-emerald-50/80 border-emerald-500/80 text-emerald-950 shadow-sm'
                    : 'bg-stone-50/60 border-stone-200 text-stone-600 hover:bg-stone-100/70 hover:border-stone-300'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-xs leading-tight text-stone-900">{c.title}</span>
                  <span className="text-xs font-bold text-emerald-700">₹{c.price}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-stone-500">
                  <span className="bg-white border border-stone-200 px-2 py-0.5 rounded-full uppercase font-semibold text-stone-700">{c.status}</span>
                  <span>{c.modules?.length || 0} Modules</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Course Structure Right */}
        <div className="lg:col-span-8 space-y-6">
          {selectedCourse ? (
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-stone-200">
                <div>
                  <h2 className="text-lg font-bold text-stone-900">{selectedCourse.title}</h2>
                  <span className="text-xs font-mono text-emerald-700">/{selectedCourse.slug}</span>
                </div>
                <span className="bg-emerald-100 text-emerald-800 font-semibold text-xs px-3 py-1 rounded-full uppercase">
                  Published &amp; Active
                </span>
              </div>

              {/* Add Module Form */}
              <form onSubmit={handleAddModule} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter Module Title (e.g. Module 2: Earthworks & Drainage)..."
                  value={newModuleTitle}
                  onChange={(e) => setNewModuleTitle(e.target.value)}
                  className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 text-xs text-stone-900 focus:border-emerald-600 focus:bg-white focus:outline-none"
                />
                <button type="submit" className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-5 py-2 rounded-xl transition-all shadow-sm">
                  + Add Module
                </button>
              </form>

              {/* Modules & Lessons Tree */}
              <div className="space-y-4">
                {selectedCourse.modules && selectedCourse.modules.map(mod => (
                  <div key={mod.id} className="bg-stone-50 rounded-xl p-5 border border-stone-200/80 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-xs text-stone-900">{mod.title}</span>
                      <button
                        onClick={() => setActiveModuleId(activeModuleId === mod.id ? null : mod.id)}
                        className="text-xs font-semibold text-stone-700 bg-white hover:bg-stone-100 border border-stone-200 px-3 py-1 rounded-lg shadow-sm"
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
                        <button type="submit" className="bg-emerald-700 text-white text-xs px-3 py-1.5 rounded-lg font-semibold shadow-sm">
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
                              className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200"
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
                              <button type="submit" className="bg-emerald-700 text-white text-xs font-semibold p-2 rounded-lg shadow-sm">
                                Attach Media
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
                ))}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-stone-400 bg-white rounded-2xl border border-stone-200 shadow-sm">
              Select a course on the left to edit modules and lessons.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
