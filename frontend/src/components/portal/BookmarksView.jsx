import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DEFAULT_BOOKMARKED_LESSONS = [
  {
    id: 'lesson-topo-survey',
    courseId: 'landscape-mastery-flagship',
    courseTitle: 'Landscape Architecture Masterclass 2026',
    lessonTitle: 'Topographical Surveying & Slope Calculations',
    moduleTitle: 'Module 1: Site Topography & Grading',
    duration: '24:18',
    timestamp: '14:32',
    category: 'Grading',
    note: 'Remember: minimum 2% foundation pitch for first 10ft. Critical for avoiding basement water ingress.',
    dateAdded: '2026-10-10'
  },
  {
    id: 'lesson-retaining-wall',
    courseId: 'landscape-mastery-flagship',
    courseTitle: 'Landscape Architecture Masterclass 2026',
    lessonTitle: 'Cantilever Retaining Wall Engineering & Drainage',
    moduleTitle: 'Module 2: Hardscape Masonry & Engineering',
    duration: '31:45',
    timestamp: '08:15',
    category: 'Masonry',
    note: 'Geogrid reinforcement length must equal at least 70% of the total wall height above base.',
    dateAdded: '2026-10-11'
  },
  {
    id: 'lesson-french-drains',
    courseId: 'drainage-grading-pro',
    courseTitle: 'Advanced Site Grading & Stormwater Engineering',
    lessonTitle: 'Sub-Surface French Drains & Catchment Pits',
    moduleTitle: 'Module 3: Stormwater Management',
    duration: '19:50',
    timestamp: '05:40',
    category: 'Drainage',
    note: 'Perforated holes must face DOWNward into the crushed aggregate bedding, not upwards.',
    dateAdded: '2026-10-12'
  }
];

const DEFAULT_FIELD_NOTES = [
  {
    id: 'note-1',
    title: 'Site Pitch & Swale Formulas',
    category: 'Grading',
    tags: ['Slope', 'Contour', 'Formulas'],
    pinned: true,
    content: `### Swale Calculation Cheat Sheet
- **Formula:** Slope (%) = (Elevation Change / Horizontal Distance) * 100
- **Lawn Drainage Minimum:** 1.5% to 2.0%
- **Swale Centerline Minimum:** 1.0% (paved), 2.0% (turfgrass)
- **Driveway Maximum:** 12% to 15% (avoid transitions > 8% without easing crest curves)

*Field Inspection Tip:* Check for standing water after 24 hours of 1-inch rainfall event. If ponding > 2 inches remains, re-cut the swale base or install perforated sub-surface catch basin.`,
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: 'note-2',
    title: 'Retaining Wall Hydrostatic Relief Specification',
    category: 'Masonry',
    tags: ['Walls', 'Hydrostatic', 'Backfill'],
    pinned: true,
    content: `### Wall Hydrostatic Pressure Prevention
1. **Aggregates:** 3/4-inch washed, angular crushed gravel backfill (clean, no fines) extending 12 inches behind wall face.
2. **Drain Pipe:** 4-inch SDR-35 perforated pipe wrapped in non-woven geotextile sock at footer level.
3. **Weep Holes:** Placed every 6 to 8 feet horizontally, 2 to 3 inches above finished grade grade.
4. **Cap Stone:** Secure with high-tensile polyurethane masonry adhesive (continuous bead, weather resistant).`,
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 'note-3',
    title: 'Botanical Micro-Climate Lighting Matrix',
    category: 'Horticulture',
    tags: ['Planting', 'Sun Exposure', 'Soil'],
    pinned: false,
    content: `### Sun Exposure Micro-Zones
- **Full Sun:** 6+ hours direct unfiltered sunlight (Southern / Western exposures)
- **Partial Shade:** 3 to 6 hours sunlight, protected from peak afternoon solar heat (Eastern exposures)
- **Full Shade:** < 3 hours direct sun or dappled canopy light (Northern exposures, narrow courtyards)

*Root Ball Soil Prep:* Dig planting hole 2x to 3x wider than root ball diameter, but never deeper than the root flare.`,
    updatedAt: new Date(Date.now() - 3600000 * 48).toISOString()
  }
];

export default function BookmarksView({ onJumpToLesson, enrolledCourses = [] }) {
  const [activeTab, setActiveTab] = useState('saved-lessons'); // 'saved-lessons' | 'field-notes'
  
  // Bookmarks State
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      const stored = localStorage.getItem('lm_portal_bookmarks');
      return stored ? JSON.parse(stored) : DEFAULT_BOOKMARKED_LESSONS;
    } catch {
      return DEFAULT_BOOKMARKED_LESSONS;
    }
  });

  // Notes State
  const [notes, setNotes] = useState(() => {
    try {
      const stored = localStorage.getItem('lm_portal_field_notes');
      return stored ? JSON.parse(stored) : DEFAULT_FIELD_NOTES;
    } catch {
      return DEFAULT_FIELD_NOTES;
    }
  });

  const [selectedNoteId, setSelectedNoteId] = useState(() => {
    const defaultList = notes.length > 0 ? notes[0].id : null;
    return defaultList;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [copiedNoteId, setCopiedNoteId] = useState(null);

  // Sync Bookmarks
  useEffect(() => {
    try {
      localStorage.setItem('lm_portal_bookmarks', JSON.stringify(bookmarks));
    } catch (e) {
      console.warn('Failed to persist bookmarks to localStorage', e);
    }
  }, [bookmarks]);

  // Sync Notes
  useEffect(() => {
    try {
      localStorage.setItem('lm_portal_field_notes', JSON.stringify(notes));
    } catch (e) {
      console.warn('Failed to persist notes to localStorage', e);
    }
  }, [notes]);

  const activeNote = useMemo(() => {
    return notes.find(n => n.id === selectedNoteId) || notes[0] || null;
  }, [notes, selectedNoteId]);

  // Categories for filtering
  const allCategories = useMemo(() => {
    if (activeTab === 'saved-lessons') {
      const set = new Set(bookmarks.map(b => b.category).filter(Boolean));
      return ['All', ...Array.from(set)];
    } else {
      const set = new Set(notes.map(n => n.category).filter(Boolean));
      return ['All', ...Array.from(set)];
    }
  }, [activeTab, bookmarks, notes]);

  // Filtered Bookmarks
  const filteredBookmarks = useMemo(() => {
    return bookmarks.filter(b => {
      const matchesCategory = selectedCategory === 'All' || b.category === selectedCategory;
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q ||
        b.lessonTitle.toLowerCase().includes(q) ||
        b.courseTitle.toLowerCase().includes(q) ||
        (b.note && b.note.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [bookmarks, selectedCategory, searchQuery]);

  // Filtered Notes
  const filteredNotes = useMemo(() => {
    return notes.filter(n => {
      const matchesCategory = selectedCategory === 'All' || n.category === selectedCategory;
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q ||
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        (n.tags && n.tags.some(t => t.toLowerCase().includes(q)));
      return matchesCategory && matchesSearch;
    }).sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });
  }, [notes, selectedCategory, searchQuery]);

  const handleRemoveBookmark = (id) => {
    setBookmarks(prev => prev.filter(b => b.id !== id));
  };

  const handleCreateNote = () => {
    const newNote = {
      id: `note-${Date.now()}`,
      title: 'Untitled Field Note',
      category: 'Grading',
      tags: ['FieldSpec'],
      pinned: false,
      content: '### New Field Note\n\nEnter site specs, elevation offsets, or plant schedule notes here...',
      updatedAt: new Date().toISOString()
    };
    setNotes(prev => [newNote, ...prev]);
    setSelectedNoteId(newNote.id);
  };

  const handleUpdateActiveNote = (field, value) => {
    if (!activeNote) return;
    setIsSavingNote(true);
    setNotes(prev => prev.map(n => {
      if (n.id === activeNote.id) {
        return {
          ...n,
          [field]: value,
          updatedAt: new Date().toISOString()
        };
      }
      return n;
    }));
    setTimeout(() => {
      setIsSavingNote(false);
    }, 400);
  };

  const handleDeleteNote = (id) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    if (selectedNoteId === id) {
      const remaining = notes.filter(n => n.id !== id);
      setSelectedNoteId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const handleTogglePin = (id) => {
    setNotes(prev => prev.map(n => {
      if (n.id === id) {
        return { ...n, pinned: !n.pinned };
      }
      return n;
    }));
  };

  const handleCopyNote = (note) => {
    if (!note) return;
    const text = `${note.title}\n\n${note.content}`;
    navigator.clipboard?.writeText(text);
    setCopiedNoteId(note.id);
    setTimeout(() => setCopiedNoteId(null), 2000);
  };

  const handleExportNotebook = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(notes, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Architect_Field_Notes_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Top Header & View Switcher */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2">
            <span className="material-symbols-outlined text-[15px]">bookmark</span>
            Study Vault & Field Notebook
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Bookmarks & Personal Knowledge</h1>
          <p className="text-sm text-slate-500 mt-1">
            Access your saved course lectures, timestamped field references, and real-time architectural specifications.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-xl self-start md:self-auto">
          <button
            onClick={() => { setActiveTab('saved-lessons'); setSelectedCategory('All'); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'saved-lessons'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">menu_book</span>
            Saved Lessons ({bookmarks.length})
          </button>
          <button
            onClick={() => { setActiveTab('field-notes'); setSelectedCategory('All'); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'field-notes'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">edit_note</span>
            Field Notebook ({notes.length})
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-2xs">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
            search
          </span>
          <input
            type="text"
            placeholder={activeTab === 'saved-lessons' ? 'Search bookmarked lessons or notes...' : 'Search field notes, formulas, tags...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 rounded-lg border border-slate-200 focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all text-slate-800 placeholder-slate-400"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {allCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {activeTab === 'field-notes' && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCreateNote}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-all whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              New Note
            </button>
            <button
              onClick={handleExportNotebook}
              title="Export All Notes"
              className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {activeTab === 'saved-lessons' ? (
        // Saved Lessons Gallery
        <div>
          {filteredBookmarks.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200 p-8">
              <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">bookmark_border</span>
              <h3 className="text-base font-semibold text-slate-800">No Bookmarked Lessons Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                {searchQuery
                  ? 'No lessons matched your search query. Try resetting your search filters.'
                  : 'While watching any course lecture, tap the bookmark icon in the video workspace to save lessons directly to your vault.'}
              </p>
              {bookmarks.length === 0 && (
                <button
                  onClick={() => setBookmarks(DEFAULT_BOOKMARKED_LESSONS)}
                  className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold rounded-lg transition-all"
                >
                  Load Recommended Study Bookmarks
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredBookmarks.map((bookmark) => (
                <motion.div
                  key={bookmark.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 flex flex-col justify-between hover:shadow-md transition-all group"
                >
                  <div>
                    {/* Header: Category & Duration */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700">
                        {bookmark.category || 'Architecture'}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                        <span className="material-symbols-outlined text-[14px]">schedule</span>
                        {bookmark.duration}
                      </div>
                    </div>

                    {/* Lesson Title */}
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {bookmark.lessonTitle}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                      {bookmark.moduleTitle} • {bookmark.courseTitle}
                    </p>

                    {/* Bookmark Note */}
                    {bookmark.note && (
                      <div className="mt-3.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 leading-relaxed font-mono">
                        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">sticky_note_2</span>
                          Saved Timestamp {bookmark.timestamp}
                        </div>
                        {bookmark.note}
                      </div>
                    )}
                  </div>

                  {/* Actions Bottom Bar */}
                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => onJumpToLesson && onJumpToLesson(bookmark)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">play_circle</span>
                      Jump to Lecture
                    </button>
                    <button
                      onClick={() => handleRemoveBookmark(bookmark.id)}
                      title="Remove from Bookmarks"
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                    >
                      <span className="material-symbols-outlined text-[18px]">bookmark_remove</span>
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      ) : (
        // Field Notebook Dual-Pane Layout
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Notes Sidebar List (5 columns) */}
          <div className="lg:col-span-5 space-y-3">
            {filteredNotes.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center">
                <p className="text-xs text-slate-400">No notes found. Create your first note above!</p>
              </div>
            ) : (
              filteredNotes.map((note) => {
                const isSelected = selectedNoteId === note.id;
                return (
                  <div
                    key={note.id}
                    onClick={() => setSelectedNoteId(note.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/50 border-blue-400 shadow-xs'
                        : 'bg-white border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {note.pinned && (
                          <span className="material-symbols-outlined text-[14px] text-amber-500 fill-1">
                            push_pin
                          </span>
                        )}
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {note.category}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(note.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 mt-2 line-clamp-1">
                      {note.title || 'Untitled Note'}
                    </h4>

                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {note.content.replace(/[#*`_]/g, '')}
                    </p>

                    {note.tags && note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2.5">
                        {note.tags.map(tag => (
                          <span key={tag} className="text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Active Note Editor (7 columns) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
            {activeNote ? (
              <div className="space-y-4">
                {/* Editor Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-full ${isSavingNote ? 'bg-amber-400 animate-ping' : 'bg-emerald-500'}`} />
                      {isSavingNote ? 'Saving...' : 'Saved to Cloud'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleTogglePin(activeNote.id)}
                      title={activeNote.pinned ? 'Unpin' : 'Pin Note'}
                      className={`p-1.5 rounded-lg text-xs transition-all ${
                        activeNote.pinned ? 'bg-amber-50 text-amber-600' : 'text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">push_pin</span>
                    </button>
                    <button
                      onClick={() => handleCopyNote(activeNote)}
                      title="Copy Note Text"
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {copiedNoteId === activeNote.id ? 'check' : 'content_copy'}
                      </span>
                    </button>
                    <button
                      onClick={() => handleDeleteNote(activeNote.id)}
                      title="Delete Note"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>

                {/* Note Title Input */}
                <input
                  type="text"
                  value={activeNote.title}
                  onChange={(e) => handleUpdateActiveNote('title', e.target.value)}
                  placeholder="Note Title..."
                  className="w-full text-xl font-bold text-slate-900 focus:outline-hidden border-b border-transparent focus:border-blue-400 pb-1"
                />

                {/* Category & Tags Selector */}
                <div className="flex items-center gap-3">
                  <select
                    value={activeNote.category}
                    onChange={(e) => handleUpdateActiveNote('category', e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-medium focus:outline-hidden"
                  >
                    <option value="Grading">Grading & Topography</option>
                    <option value="Masonry">Hardscape & Masonry</option>
                    <option value="Drainage">Drainage Systems</option>
                    <option value="Horticulture">Horticulture & Lighting</option>
                    <option value="CAD">CAD Blueprints & Drafting</option>
                  </select>

                  <input
                    type="text"
                    value={activeNote.tags ? activeNote.tags.join(', ') : ''}
                    onChange={(e) => {
                      const tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
                      handleUpdateActiveNote('tags', tags);
                    }}
                    placeholder="Tags (comma separated)..."
                    className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-600 focus:outline-hidden"
                  />
                </div>

                {/* Note Body Textarea */}
                <textarea
                  value={activeNote.content}
                  onChange={(e) => handleUpdateActiveNote('content', e.target.value)}
                  rows={14}
                  placeholder="Type architectural field notes, formulas, site observations..."
                  className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 font-mono leading-relaxed focus:bg-white focus:outline-hidden focus:border-blue-500 transition-all resize-y"
                />
              </div>
            ) : (
              <div className="py-20 text-center text-slate-400">
                <span className="material-symbols-outlined text-4xl mb-2">description</span>
                <p className="text-xs">Select or create a note to start editing.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
