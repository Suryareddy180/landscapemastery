import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

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
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-950/70 p-6 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-400 text-2xl">auto_stories</span>
            Hierarchical Course &amp; Curriculum Builder
          </h1>
          <p className="text-xs text-slate-400 mt-1">Structure courses, modules, lessons, and attach short/long video masterclasses or PDF blueprints.</p>
        </div>

        <form onSubmit={handleCreateCourse} className="flex gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="New Course Title..."
            value={newCourseTitle}
            onChange={(e) => setNewCourseTitle(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
          />
          <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all">
            Create Course
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Course List Left */}
        <div className="lg:col-span-4 bg-slate-950/70 p-6 rounded-2xl border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">All Platform Courses ({courses.length})</h2>
          <div className="space-y-2">
            {courses.map(c => (
              <div
                key={c.id}
                onClick={() => setSelectedCourse(c)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedCourse?.id === c.id
                    ? 'bg-emerald-950/50 border-emerald-500/60 text-white shadow-lg'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-sm leading-tight">{c.title}</span>
                  <span className="text-xs font-semibold text-emerald-400">${c.price}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <span className="bg-slate-800 px-2 py-0.5 rounded-full uppercase">{c.status}</span>
                  <span>{c.modules?.length || 0} Modules</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Course Structure Right */}
        <div className="lg:col-span-8 space-y-6">
          {selectedCourse ? (
            <div className="bg-slate-950/70 p-6 rounded-2xl border border-slate-800 space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedCourse.title}</h2>
                  <span className="text-xs font-mono text-emerald-400">/{selectedCourse.slug}</span>
                </div>
                <span className="bg-emerald-600/20 text-emerald-300 font-semibold text-xs px-3 py-1 rounded-full uppercase">
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
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
                <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition-all">
                  + Add Module
                </button>
              </form>

              {/* Modules & Lessons Tree */}
              <div className="space-y-4">
                {selectedCourse.modules && selectedCourse.modules.map(mod => (
                  <div key={mod.id} className="bg-slate-900/80 rounded-xl p-5 border border-slate-800 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-sm text-emerald-400">{mod.title}</span>
                      <button
                        onClick={() => setActiveModuleId(activeModuleId === mod.id ? null : mod.id)}
                        className="text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded-lg"
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
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                        />
                        <button type="submit" className="bg-emerald-600 text-white text-xs px-3 py-1.5 rounded-lg font-semibold">
                          Save Lesson
                        </button>
                      </form>
                    )}

                    {/* Lessons List */}
                    <div className="space-y-3 pl-4 border-l-2 border-emerald-800/40">
                      {mod.lessons && mod.lessons.map(les => (
                        <div key={les.id} className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-xs text-slate-200">{les.title}</span>
                            <button
                              onClick={() => setActiveLessonId(activeLessonId === les.id ? null : les.id)}
                              className="text-[11px] font-semibold text-teal-300 bg-teal-950/60 hover:bg-teal-900/60 px-2.5 py-1 rounded-lg border border-teal-800/40"
                            >
                              + Attach Video/PDF
                            </button>
                          </div>

                          {/* Add Media Asset Form */}
                          {activeLessonId === les.id && (
                            <form onSubmit={(e) => handleAddAsset(les.id, e)} className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-900 p-3 rounded-lg border border-slate-800">
                              <input
                                type="text"
                                placeholder="Asset Title..."
                                value={newAsset.title}
                                onChange={(e) => setNewAsset({ ...newAsset, title: e.target.value })}
                                className="bg-slate-950 border border-slate-800 text-xs text-white p-2 rounded-lg"
                              />
                              <select
                                value={newAsset.asset_type}
                                onChange={(e) => setNewAsset({ ...newAsset, asset_type: e.target.value })}
                                className="bg-slate-950 border border-slate-800 text-xs text-white p-2 rounded-lg"
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
                                className="bg-slate-950 border border-slate-800 text-xs text-white p-2 rounded-lg"
                              />
                              <button type="submit" className="bg-emerald-600 text-white text-xs font-semibold p-2 rounded-lg">
                                Attach Media
                              </button>
                            </form>
                          )}

                          {/* Attached Media Assets */}
                          <div className="space-y-1.5">
                            {les.assets && les.assets.map(asset => (
                              <div key={asset.id} className="flex justify-between items-center bg-slate-900/90 p-2.5 rounded-lg text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="material-symbols-outlined text-sm text-emerald-400">
                                    {asset.asset_type === 'pdf' ? 'picture_as_pdf' : 'play_circle'}
                                  </span>
                                  <span className="font-medium text-slate-300">{asset.title}</span>
                                </div>
                                <span className="text-[10px] font-bold bg-slate-800 px-2 py-0.5 rounded text-slate-400">
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
            <div className="p-12 text-center text-slate-500 bg-slate-950/70 rounded-2xl border border-slate-800">
              Select a course on the left to edit modules and lessons.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
