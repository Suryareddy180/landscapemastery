import React, { useState, useEffect } from 'react';
import { BASE_URL } from '../../lib/api.js';

export default function AnnouncementManagementSection({ token, user }) {
  const [announcements, setAnnouncements] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState(null);

  // New Broadcast Announcement Form
  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    message: '',
    course_id: '',
    active: true
  });

  // Direct Community Announcement Form
  const [communityModalOpen, setCommunityModalOpen] = useState(false);
  const [communityMsg, setCommunityMsg] = useState({
    channel: 'announcements',
    content: '',
    pinned: true
  });
  const [sendingCommunityMsg, setSendingCommunityMsg] = useState(false);

  const authToken = token || localStorage.getItem('lm_auth_token') || localStorage.getItem('admin_token') || '';

  const showToast = (text, type = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/admin/announcements/`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data.announcements || []);
      }
    } catch (e) {
      console.error('Failed to fetch announcements:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/admin/courses/`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCourses(data.courses || []);
      }
    } catch (e) {
      console.error('Failed to fetch courses:', e);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
    fetchCourses();
  }, [authToken]);

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    if (!newAnnouncement.title.trim() || !newAnnouncement.message.trim()) {
      showToast('Title and message are required.', 'error');
      return;
    }
    setCreating(true);

    try {
      const res = await fetch(`${BASE_URL}/api/admin/announcements/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(newAnnouncement)
      });
      const data = await res.json();

      if (res.ok) {
        showToast('Announcement successfully broadcasted to student portal!');
        setModalOpen(false);
        setNewAnnouncement({ title: '', message: '', course_id: '', active: true });
        fetchAnnouncements();
      } else {
        showToast(data.error || 'Failed to publish announcement.', 'error');
      }
    } catch (e) {
      showToast('Network error publishing announcement.', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (id, currentActive) => {
    try {
      const res = await fetch(`${BASE_URL}/api/admin/announcements/${id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ active: !currentActive })
      });
      if (res.ok) {
        showToast(`Announcement status toggled to ${!currentActive ? 'ACTIVE' : 'INACTIVE'}!`);
        fetchAnnouncements();
      } else {
        showToast('Failed to update status.', 'error');
      }
    } catch (e) {
      showToast('Network error updating status.', 'error');
    }
  };

  const handleDeleteAnnouncement = async (id, title) => {
    if (!window.confirm(`Permanently remove announcement: "${title}"?`)) return;

    try {
      const res = await fetch(`${BASE_URL}/api/admin/announcements/${id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) {
        showToast('Announcement deleted.');
        fetchAnnouncements();
      } else {
        showToast('Failed to delete announcement.', 'error');
      }
    } catch (e) {
      showToast('Network error deleting announcement.', 'error');
    }
  };

  const handleSendCommunityMessage = async (e) => {
    e.preventDefault();
    if (!communityMsg.content.trim()) return;
    setSendingCommunityMsg(true);

    try {
      const res = await fetch(`${BASE_URL}/api/community/channels/${communityMsg.channel}/messages/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          content: communityMsg.content.trim(),
          is_announcement: true
        })
      });
      const data = await res.json();

      if (res.ok) {
        showToast(`Official update posted to #${communityMsg.channel}!`);
        setCommunityModalOpen(false);
        setCommunityMsg({ channel: 'announcements', content: '', pinned: true });
      } else {
        showToast(data.error || 'Failed to dispatch community message.', 'error');
      }
    } catch (e) {
      showToast('Network error posting to community channel.', 'error');
    } finally {
      setSendingCommunityMsg(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-800 text-2xl">campaign</span>
            <h1 className="text-xl font-bold text-stone-900">Broadcast &amp; Studio Announcements</h1>
            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Faculty Studio
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Dispatch urgent curriculum updates, studio workshop invitations, and pin announcements directly to student portals and community channels.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setCommunityModalOpen(true)}
            className="bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer border border-stone-200"
          >
            <span className="material-symbols-outlined text-sm text-emerald-800">forum</span>
            <span>Post to #announcements</span>
          </button>

          <button
            onClick={() => setModalOpen(true)}
            className="bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">add_alert</span>
            <span>+ New Portal Announcement</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-900' 
            : 'bg-rose-50 border border-rose-200 text-rose-900'
        }`}>
          <span className="material-symbols-outlined text-sm">
            {statusMessage.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Total Broadcasts</span>
            <span className="material-symbols-outlined text-emerald-700 bg-emerald-50 p-2 rounded-xl border border-emerald-200">campaign</span>
          </div>
          <div className="text-2xl font-bold text-stone-900">{announcements.length}</div>
          <p className="text-[11px] text-stone-500 mt-1">Archived announcements</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Active on Portal</span>
            <span className="material-symbols-outlined text-emerald-700 bg-emerald-50 p-2 rounded-xl border border-emerald-200">visibility</span>
          </div>
          <div className="text-2xl font-bold text-emerald-800">
            {announcements.filter(a => a.active).length}
          </div>
          <p className="text-[11px] text-emerald-700 font-semibold mt-1">Visible to enrolled students</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Community Channels</span>
            <span className="material-symbols-outlined text-emerald-700 bg-emerald-50 p-2 rounded-xl border border-emerald-200">forum</span>
          </div>
          <div className="text-2xl font-bold text-stone-900">#announcements</div>
          <p className="text-[11px] text-stone-500 mt-1">Instant broadcast feed</p>
        </div>
      </div>

      {/* Announcements Table */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm overflow-x-auto space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-bold text-stone-900">Portal Announcements Registry</h2>
        </div>

        {loading ? (
          <div className="text-center py-12 text-stone-400 text-xs">Loading announcements...</div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-stone-200 rounded-2xl space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-2xl">campaign</span>
            </div>
            <p className="text-xs font-semibold text-stone-600">No portal announcements posted yet.</p>
            <button
              onClick={() => setModalOpen(true)}
              className="bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer shadow-sm"
            >
              + Create First Announcement
            </button>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-200 text-stone-500 uppercase font-semibold">
                <th className="py-3 px-3">Title &amp; Message</th>
                <th className="py-3 px-3">Scope</th>
                <th className="py-3 px-3">Author</th>
                <th className="py-3 px-3">Posted Date</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {announcements.map((a) => (
                <tr key={a.id} className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                  <td className="py-4 px-3 max-w-md">
                    <div className="font-bold text-stone-900 text-sm mb-1">{a.title}</div>
                    <div className="text-stone-600 text-xs line-clamp-2 leading-relaxed">{a.message}</div>
                  </td>
                  <td className="py-4 px-3">
                    <span className="text-[10px] font-bold bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md">
                      {a.course_title || 'All Architecture Students'}
                    </span>
                  </td>
                  <td className="py-4 px-3 font-mono text-[11px] text-stone-600">
                    {a.created_by_email?.split('@')[0] || 'Faculty Instructor'}
                  </td>
                  <td className="py-4 px-3 text-stone-500 text-[11px] whitespace-nowrap">
                    {a.created_at || 'Recent'}
                  </td>
                  <td className="py-4 px-3">
                    <button
                      onClick={() => handleToggleActive(a.id, a.active)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase cursor-pointer border ${
                        a.active 
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                          : 'bg-stone-100 text-stone-500 border-stone-300'
                      }`}
                    >
                      {a.active ? '✓ ACTIVE' : 'INACTIVE'}
                    </button>
                  </td>
                  <td className="py-4 px-3 text-right">
                    <button
                      onClick={() => handleDeleteAnnouncement(a.id, a.title)}
                      className="text-rose-600 hover:underline font-semibold cursor-pointer"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* CREATE BROADCAST ANNOUNCEMENT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-stone-200 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-800 text-2xl">campaign</span>
                <h3 className="font-bold text-base text-stone-900">New Broadcast Announcement</h3>
              </div>
              <button 
                onClick={() => setModalOpen(false)} 
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Announcement Title
                </label>
                <input
                  type="text"
                  required
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                  placeholder="e.g. Live Topography Studio Workshop This Saturday 10:00 AM"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Target Audience / Course
                </label>
                <select
                  value={newAnnouncement.course_id}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, course_id: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 font-semibold focus:bg-white focus:border-emerald-600 focus:outline-none cursor-pointer"
                >
                  <option value="">All Enrolled Students (Global Announcement)</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Announcement Message
                </label>
                <textarea
                  rows="4"
                  required
                  value={newAnnouncement.message}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
                  placeholder="Enter the full announcement text, agenda points, Zoom link, or curriculum updates..."
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-xs text-stone-900 focus:bg-white focus:border-emerald-600 focus:outline-none resize-none leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="activeCheck"
                  checked={newAnnouncement.active}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, active: e.target.checked })}
                  className="rounded accent-emerald-800 cursor-pointer"
                />
                <label htmlFor="activeCheck" className="text-xs font-semibold text-stone-800 cursor-pointer">
                  Publish as active immediately on student dashboards
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs px-5 py-2 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {creating ? 'Broadcasting...' : 'Broadcast Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DISPATCH TO COMMUNITY CHANNEL MODAL */}
      {communityModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-stone-200 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-800 text-2xl">forum</span>
                <h3 className="font-bold text-base text-stone-900">Post Official Community Message</h3>
              </div>
              <button 
                onClick={() => setCommunityModalOpen(false)} 
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSendCommunityMessage} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Destination Channel
                </label>
                <select
                  value={communityMsg.channel}
                  onChange={(e) => setCommunityMsg({ ...communityMsg, channel: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 font-semibold focus:bg-white focus:border-emerald-600 focus:outline-none cursor-pointer"
                >
                  <option value="announcements">#announcements (Read-Only Channel for Students)</option>
                  <option value="general">#general (Main Studio Discussion)</option>
                  <option value="critiques">#critiques (Design Peer Review)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Message Content
                </label>
                <textarea
                  rows="4"
                  required
                  value={communityMsg.content}
                  onChange={(e) => setCommunityMsg({ ...communityMsg, content: e.target.value })}
                  placeholder="Type an announcement or message from the faculty..."
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-xs text-stone-900 focus:bg-white focus:border-emerald-600 focus:outline-none resize-none leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pinCheck"
                  checked={communityMsg.pinned}
                  onChange={(e) => setCommunityMsg({ ...communityMsg, pinned: e.target.checked })}
                  className="rounded accent-emerald-800 cursor-pointer"
                />
                <label htmlFor="pinCheck" className="text-xs font-semibold text-stone-800 cursor-pointer">
                  Display with Official Instructor badge
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setCommunityModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingCommunityMsg}
                  className="bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs px-5 py-2 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {sendingCommunityMsg ? 'Dispatching...' : 'Dispatch Message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
