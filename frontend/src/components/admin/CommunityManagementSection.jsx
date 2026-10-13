import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BASE_URL } from '../../lib/api.js';

export default function CommunityManagementSection({ token }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'channels' | 'moderation' | 'members'
  const [stats, setStats] = useState({
    total_channels: 5,
    active_channels: 5,
    total_messages: 0,
    flagged_messages: 0,
    muted_members: 0,
    active_participants: 0
  });
  const [channels, setChannels] = useState([]);
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [flaggedQueue, setFlaggedQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState(null);

  // Channel Creation Modal State
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [newChannel, setNewChannel] = useState({
    name: '',
    slug: '',
    topic: '',
    pinned_announcement: '',
    is_read_only: false
  });

  // Filter States
  const [selectedChannelFilter, setSelectedChannelFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [flaggedOnly, setFlaggedOnly] = useState(false);

  // Member Modal State
  const [selectedMember, setSelectedMember] = useState(null);
  const [customRoleInput, setCustomRoleInput] = useState('');
  const [muteReasonInput, setMuteReasonInput] = useState('');

  useEffect(() => {
    fetchCommunityData();
  }, [token]);

  const fetchCommunityData = async () => {
    setLoading(true);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // 1. Fetch Overview Stats
      const overviewRes = await fetch(`${BASE_URL}/api/admin/community/overview/`, { headers });
      if (overviewRes.ok) {
        const overviewData = await overviewRes.json();
        if (overviewData.stats) setStats(overviewData.stats);
        if (overviewData.flagged_queue) setFlaggedQueue(overviewData.flagged_queue);
      }

      // 2. Fetch Channels
      const channelsRes = await fetch(`${BASE_URL}/api/admin/community/channels/`, { headers });
      if (channelsRes.ok) {
        const chData = await channelsRes.json();
        setChannels(chData.channels || []);
      }

      // 3. Fetch Messages
      const msgsRes = await fetch(`${BASE_URL}/api/admin/community/messages/`, { headers });
      if (msgsRes.ok) {
        const mData = await msgsRes.json();
        setMessages(mData.messages || []);
      }

      // 4. Fetch Members
      const membersRes = await fetch(`${BASE_URL}/api/admin/community/members/`, { headers });
      if (membersRes.ok) {
        const memData = await membersRes.json();
        setMembers(memData.members || []);
      }
    } catch (err) {
      console.error('Error fetching community management data:', err);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (text, type = 'success') => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg(null), 4000);
  };

  // Channel Creation
  const handleCreateChannel = async (e) => {
    e.preventDefault();
    if (!newChannel.name) return;

    try {
      const res = await fetch(`${BASE_URL}/api/admin/community/channels/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newChannel)
      });

      const data = await res.json();
      if (res.ok) {
        showNotification(`Channel #${data.channel.slug} created successfully!`);
        setShowCreateChannelModal(false);
        setNewChannel({ name: '', slug: '', topic: '', pinned_announcement: '', is_read_only: false });
        fetchCommunityData();
      } else {
        showNotification(data.error || 'Failed to create channel', 'error');
      }
    } catch (e) {
      showNotification('Network error creating channel', 'error');
    }
  };

  // Toggle Read-Only / Active on Channel
  const handleToggleChannelStatus = async (channel, field) => {
    const updatedValue = !channel[field];
    try {
      const res = await fetch(`${BASE_URL}/api/admin/community/channels/${channel.slug}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ [field]: updatedValue })
      });

      if (res.ok) {
        showNotification(`Channel #${channel.slug} updated.`);
        setChannels(prev => prev.map(c => c.slug === channel.slug ? { ...c, [field]: updatedValue } : c));
      }
    } catch {
      showNotification('Update failed', 'error');
    }
  };

  // Delete Channel
  const handleDeleteChannel = async (slug) => {
    if (!window.confirm(`Are you sure you want to delete #${slug}? All discussions in this room will be permanently removed.`)) {
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/api/admin/community/channels/${slug}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        showNotification(`Channel #${slug} deleted.`);
        setChannels(prev => prev.filter(c => c.slug !== slug));
      }
    } catch {
      showNotification('Failed to delete channel', 'error');
    }
  };

  // Message Moderation: Delete, Pin, Dismiss Flag
  const handleModerateMessage = async (msgId, action) => {
    try {
      const res = await fetch(`${BASE_URL}/api/admin/community/messages/${msgId}/moderate/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });

      const data = await res.json();
      if (res.ok) {
        showNotification(data.message || `Action ${action} completed.`);
        if (action === 'delete') {
          setMessages(prev => prev.filter(m => m.id !== msgId));
          setFlaggedQueue(prev => prev.filter(m => m.id !== msgId));
        } else if (action === 'pin' || action === 'unpin') {
          setMessages(prev => prev.map(m => m.id === msgId ? { ...m, is_pinned: action === 'pin' } : m));
        } else if (action === 'dismiss_flag') {
          setMessages(prev => prev.map(m => m.id === msgId ? { ...m, is_flagged: false, flagged_count: 0 } : m));
          setFlaggedQueue(prev => prev.filter(m => m.id !== msgId));
        }
      } else {
        showNotification(data.error || 'Moderation action failed', 'error');
      }
    } catch {
      showNotification('Failed to moderate message', 'error');
    }
  };

  // Member Moderation: Mute / Unmute
  const handleToggleMuteMember = async (member) => {
    const action = member.is_muted ? 'unmute' : 'mute';
    try {
      const res = await fetch(`${BASE_URL}/api/admin/community/members/${member.id}/moderate/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          action,
          reason: action === 'mute' ? (muteReasonInput || 'Studio policy violation') : ''
        })
      });

      const data = await res.json();
      if (res.ok) {
        showNotification(data.message);
        setMembers(prev => prev.map(m => m.id === member.id ? { ...m, is_muted: action === 'mute' } : m));
        setSelectedMember(null);
        setMuteReasonInput('');
      } else {
        showNotification(data.error || 'Action failed', 'error');
      }
    } catch {
      showNotification('Network error moderating member', 'error');
    }
  };

  // Update Member Custom Badge / Role Title
  const handleUpdateRoleTitle = async (memberId) => {
    try {
      const res = await fetch(`${BASE_URL}/api/admin/community/members/${memberId}/moderate/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'update_title',
          custom_role_title: customRoleInput
        })
      });

      const data = await res.json();
      if (res.ok) {
        showNotification(data.message);
        setMembers(prev => prev.map(m => m.id === memberId ? { ...m, custom_role_title: customRoleInput } : m));
        setSelectedMember(null);
        setCustomRoleInput('');
      }
    } catch {
      showNotification('Failed to update member role title', 'error');
    }
  };

  // Filtered Messages
  const filteredMessages = messages.filter(m => {
    const matchesChannel = selectedChannelFilter === 'all' || m.channel_slug === selectedChannelFilter;
    const matchesFlag = !flaggedOnly || m.is_flagged;
    const q = searchQuery.toLowerCase();
    const matchesQuery = !q || m.content.toLowerCase().includes(q) || m.sender_email.toLowerCase().includes(q);
    return matchesChannel && matchesFlag && matchesQuery;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {statusMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-xl border flex items-center justify-between shadow-md ${
              statusMsg.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">
                {statusMsg.type === 'error' ? 'error' : 'check_circle'}
              </span>
              <span className="text-xs font-semibold">{statusMsg.text}</span>
            </div>
            <button onClick={() => setStatusMsg(null)} className="text-xs font-bold opacity-60 hover:opacity-100">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold mb-2">
            <span className="material-symbols-outlined text-[15px]">verified_user</span>
            Content Manager & Super Admin Moderation Hub
          </div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Studio Community Management</h1>
          <p className="text-xs text-stone-500 mt-1">
            Govern public discussion channels, moderate flagged messages, manage instructor role badges, and maintain academic discourse standards.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 bg-stone-100 p-1.5 rounded-xl self-start md:self-auto">
          {[
            { id: 'overview', label: 'Overview', icon: 'dashboard' },
            { id: 'channels', label: `Channels (${channels.length})`, icon: 'forum' },
            { id: 'moderation', label: `Messages (${messages.length})`, icon: 'shield' },
            { id: 'members', label: `Members (${members.length})`, icon: 'group' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase text-stone-400 block mb-1">Total Channels</span>
          <span className="text-xl font-bold text-stone-900">{stats.total_channels}</span>
          <span className="text-[10px] text-emerald-700 block mt-1 font-semibold">Active & Live</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase text-stone-400 block mb-1">Total Messages</span>
          <span className="text-xl font-bold text-stone-900">{stats.total_messages}</span>
          <span className="text-[10px] text-stone-500 block mt-1 font-mono">Discussions recorded</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase text-stone-400 block mb-1">Flagged Queue</span>
          <span className={`text-xl font-bold ${stats.flagged_messages > 0 ? 'text-amber-600' : 'text-stone-900'}`}>
            {stats.flagged_messages}
          </span>
          <span className="text-[10px] text-amber-700 block mt-1 font-semibold">Requires Review</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase text-stone-400 block mb-1">Muted Members</span>
          <span className={`text-xl font-bold ${stats.muted_members > 0 ? 'text-rose-600' : 'text-stone-900'}`}>
            {stats.muted_members}
          </span>
          <span className="text-[10px] text-rose-700 block mt-1 font-semibold">Sanctions Active</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase text-stone-400 block mb-1">Participants</span>
          <span className="text-xl font-bold text-stone-900">{stats.active_participants}</span>
          <span className="text-[10px] text-stone-500 block mt-1">Unique student authors</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase text-stone-400 block mb-1">Studio Status</span>
          <span className="text-sm font-bold text-emerald-700 flex items-center gap-1.5 mt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Synced
          </span>
          <span className="text-[10px] text-stone-400 block mt-1">Real-time DB</span>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: OVERVIEW & FLAGGED QUEUE                                */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Flagged Review Queue (7 columns) */}
          <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-600 text-xl">flag</span>
                <h3 className="font-bold text-base text-stone-900">Urgent Moderation Queue</h3>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                {flaggedQueue.length} pending
              </span>
            </div>

            {flaggedQueue.length === 0 ? (
              <div className="py-12 text-center text-stone-400">
                <span className="material-symbols-outlined text-4xl text-emerald-500 mb-2">check_circle</span>
                <p className="text-sm font-semibold text-stone-700">All Clear</p>
                <p className="text-xs text-stone-400 mt-1">No reported or flagged community messages currently require action.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {flaggedQueue.map(item => (
                  <div key={item.id} className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
                        <span className="font-bold text-stone-800">#{item.channel} • {item.sender}</span>
                        <span className="font-mono text-[11px]">{item.created_at}</span>
                      </div>
                      <p className="text-xs text-stone-800 bg-white p-3 rounded-lg border border-amber-100 font-mono">
                        "{item.content}"
                      </p>
                      {item.moderation_note && (
                        <div className="mt-2 text-[11px] text-amber-800 font-semibold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">report</span>
                          Reason: {item.moderation_note} ({item.flagged_count} reports)
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-amber-200/60 justify-end">
                      <button
                        onClick={() => handleModerateMessage(item.id, 'dismiss_flag')}
                        className="px-3 py-1.5 rounded-lg bg-white border border-stone-200 hover:bg-stone-50 text-xs font-semibold text-stone-700 transition-all cursor-pointer"
                      >
                        Dismiss Flag
                      </button>
                      <button
                        onClick={() => handleModerateMessage(item.id, 'delete')}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
                      >
                        Delete Message
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Studio Guidelines & Actions (5 columns) */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
              <h3 className="font-bold text-base text-stone-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-800">gavel</span>
                Content Governance Policies
              </h3>
              <div className="text-xs text-stone-600 space-y-2.5 leading-relaxed">
                <p>
                  <strong>Role Delegation:</strong> Only <code>SUPER_ADMIN</code> and <code>CONTENT_MANAGER</code> possess moderation keys to delete student content, pin announcements, and apply member mutes.
                </p>
                <p>
                  <strong>Read-Only Rooms:</strong> Use read-only flags on channels like <code>#announcements</code> or <code>#ask-instructors</code> during live webinars to avoid unmoderated spam.
                </p>
                <p>
                  <strong>Audit Logging:</strong> Every deletion, ban, and channel modification automatically generates an entry in the Cryptographic Security Audit Log with timestamp and IP attribution.
                </p>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center gap-2">
                <button
                  onClick={() => setShowCreateChannelModal(true)}
                  className="flex-1 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  Create Channel
                </button>
                <button
                  onClick={fetchCommunityData}
                  title="Refresh Data"
                  className="p-2 border border-stone-200 hover:bg-stone-50 text-stone-600 rounded-xl transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">refresh</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: CHANNELS MANAGER                                        */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'channels' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-stone-200 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-stone-900">Studio Channels</h3>
              <p className="text-xs text-stone-500 mt-0.5">Configure live rooms, topics, read-only permissions, and pinned banners.</p>
            </div>
            <button
              onClick={() => setShowCreateChannelModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              New Channel
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50 text-stone-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4">Topic / Description</th>
                  <th className="py-3 px-4">Messages</th>
                  <th className="py-3 px-4">Mode</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {channels.map(ch => (
                  <tr key={ch.id || ch.slug} className="border-b border-stone-100 hover:bg-stone-50/70 transition-colors">
                    <td className="py-4 px-4 font-bold text-stone-900">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-mono font-bold">
                          #
                        </span>
                        <div>
                          <span className="font-bold text-sm block">#{ch.name}</span>
                          <span className="text-[10px] text-stone-400 font-mono">slug: {ch.slug}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-stone-600 max-w-xs truncate">
                      <div className="truncate font-medium">{ch.topic || 'No topic configured'}</div>
                      {ch.pinned_announcement && (
                        <span className="text-[10px] text-amber-700 block truncate mt-0.5 font-sans">
                          {ch.pinned_announcement}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 font-mono font-bold text-stone-800">
                      {ch.message_count || 0}
                    </td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => handleToggleChannelStatus(ch, 'is_read_only')}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-all cursor-pointer ${
                          ch.is_read_only
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {ch.is_read_only ? '🔒 Read-Only' : '💬 Open Discussion'}
                      </button>
                    </td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => handleToggleChannelStatus(ch, 'is_active')}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-all cursor-pointer ${
                          ch.is_active
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-stone-100 text-stone-500'
                        }`}
                      >
                        {ch.is_active ? 'Active' : 'Archived'}
                      </button>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => handleDeleteChannel(ch.slug)}
                        title="Delete Channel"
                        className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: MESSAGE MODERATION                                      */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'moderation' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden space-y-4 p-5">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-sm">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-base">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search messages by content or author..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs bg-stone-50 rounded-lg border border-stone-200 focus:outline-hidden focus:border-emerald-600 text-stone-800"
                />
              </div>

              <select
                value={selectedChannelFilter}
                onChange={(e) => setSelectedChannelFilter(e.target.value)}
                className="text-xs bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-stone-700 font-semibold focus:outline-hidden"
              >
                <option value="all">All Channels</option>
                {channels.map(c => (
                  <option key={c.slug} value={c.slug}>#{c.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setFlaggedOnly(!flaggedOnly)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  flaggedOnly
                    ? 'bg-amber-600 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">flag</span>
                Flagged Only
              </button>
            </div>
          </div>

          {/* Messages Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50 text-stone-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Author</th>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4">Content</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMessages.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-stone-400">
                      No messages matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredMessages.map(m => (
                    <tr key={m.id} className="border-b border-stone-100 hover:bg-stone-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-stone-900">{m.sender_name}</div>
                        <div className="text-[10px] text-stone-400 font-mono">{m.sender_email}</div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-blue-700">
                        #{m.channel_name || m.channel_slug}
                      </td>
                      <td className="py-3 px-4 max-w-md">
                        <p className="text-xs text-stone-800 line-clamp-2 leading-relaxed">
                          {m.content}
                        </p>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-stone-400 whitespace-nowrap">
                        {m.created_at}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {m.is_pinned && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold mr-1">
                            📌 Pinned
                          </span>
                        )}
                        {m.is_flagged && (
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-full text-[10px] font-bold">
                            ⚠️ Flagged ({m.flagged_count})
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleModerateMessage(m.id, m.is_pinned ? 'unpin' : 'pin')}
                            title={m.is_pinned ? 'Unpin Message' : 'Pin to Channel Header'}
                            className="p-1.5 text-stone-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              {m.is_pinned ? 'push_pin' : 'keep'}
                            </span>
                          </button>
                          {m.is_flagged && (
                            <button
                              onClick={() => handleModerateMessage(m.id, 'dismiss_flag')}
                              title="Dismiss Report"
                              className="p-1.5 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[18px]">check</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleModerateMessage(m.id, 'delete')}
                            title="Delete Message"
                            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 4: MEMBER GOVERNANCE & ROLES                               */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'members' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div>
              <h3 className="font-bold text-base text-stone-900">Member Directory & Roles</h3>
              <p className="text-xs text-stone-500 mt-0.5">Assign specialized faculty badges and issue moderation mutes.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50 text-stone-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4">Account Type</th>
                  <th className="py-3 px-4">Community Badge Title</th>
                  <th className="py-3 px-4">Messages</th>
                  <th className="py-3 px-4">Posting Status</th>
                  <th className="py-3 px-4 text-right">Sanctions / Roles</th>
                </tr>
              </thead>
              <tbody>
                {members.map(mem => (
                  <tr key={mem.id} className="border-b border-stone-100 hover:bg-stone-50/70 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-bold text-stone-900">{mem.full_name || mem.email.split('@')[0]}</div>
                      <div className="text-[10px] text-stone-400 font-mono">{mem.email}</div>
                    </td>
                    <td className="py-4 px-4 font-mono text-stone-700">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        mem.role === 'SUPER_ADMIN' ? 'bg-amber-100 text-amber-900' :
                        mem.role === 'CONTENT_MANAGER' ? 'bg-blue-100 text-blue-900' :
                        'bg-stone-100 text-stone-700'
                      }`}>
                        {mem.role}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md text-[11px]">
                        {mem.custom_role_title || (
                          mem.role === 'SUPER_ADMIN' ? 'Lead Faculty' :
                          mem.role === 'CONTENT_MANAGER' ? 'Content Moderator' :
                          'Student Architect'
                        )}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-mono font-bold text-stone-800">
                      {mem.messages_count || 0}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        mem.is_muted
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {mem.is_muted ? 'MUTED' : 'ACTIVE'}
                      </span>
                      {mem.mute_reason && (
                        <span className="block text-[10px] text-rose-600 mt-0.5 italic">{mem.mute_reason}</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedMember(mem);
                          setCustomRoleInput(mem.custom_role_title || '');
                        }}
                        className="px-2.5 py-1 text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg mr-2 transition-all cursor-pointer"
                      >
                        Set Badge
                      </button>
                      <button
                        onClick={() => handleToggleMuteMember(mem)}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                          mem.is_muted
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-rose-50 hover:bg-rose-100 text-rose-700'
                        }`}
                      >
                        {mem.is_muted ? 'Unmute' : 'Mute'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: CREATE NEW CHANNEL                                      */}
      {/* ------------------------------------------------------------- */}
      {showCreateChannelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-800">forum</span>
                <h3 className="font-bold text-lg text-stone-900">Create Studio Channel</h3>
              </div>
              <button
                onClick={() => setShowCreateChannelModal(false)}
                className="text-stone-400 hover:text-stone-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateChannel} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">Channel Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. landscape-lighting-schemes"
                  value={newChannel.name}
                  onChange={(e) => setNewChannel({ ...newChannel, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-stone-50 rounded-lg border border-stone-200 focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">Topic / Description</label>
                <input
                  type="text"
                  placeholder="e.g. Low voltage lighting circuits, kelvin spectrums, fixture schedules"
                  value={newChannel.topic}
                  onChange={(e) => setNewChannel({ ...newChannel, topic: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-stone-50 rounded-lg border border-stone-200 focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">Pinned Studio Announcement</label>
                <textarea
                  rows={3}
                  placeholder="📌 Initial notice displayed at the top of the chat room..."
                  value={newChannel.pinned_announcement}
                  onChange={(e) => setNewChannel({ ...newChannel, pinned_announcement: e.target.value })}
                  className="w-full p-3 text-xs bg-stone-50 rounded-lg border border-stone-200 focus:outline-hidden focus:border-emerald-600 font-sans"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="readonly_toggle"
                  checked={newChannel.is_read_only}
                  onChange={(e) => setNewChannel({ ...newChannel, is_read_only: e.target.checked })}
                  className="rounded border-stone-300 text-emerald-800 focus:ring-emerald-500"
                />
                <label htmlFor="readonly_toggle" className="text-xs text-stone-700 font-semibold cursor-pointer">
                  Read-Only Channel (Students can view, only staff & faculty can post)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowCreateChannelModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Create Channel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: CUSTOM BADGE / ROLE TITLE                               */}
      {/* ------------------------------------------------------------- */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-bold text-base text-stone-900">
                Set Badge Title for {selectedMember.email}
              </h3>
              <button onClick={() => setSelectedMember(null)} className="text-stone-400 font-bold">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">Custom Role Badge Title</label>
                <input
                  type="text"
                  placeholder="e.g. Lead Faculty, Civil Engineer, Senior Superintendent"
                  value={customRoleInput}
                  onChange={(e) => setCustomRoleInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-stone-50 rounded-lg border border-stone-200 focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  onClick={() => setSelectedMember(null)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpdateRoleTitle(selectedMember.id)}
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Save Badge
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
