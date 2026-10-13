import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BASE_URL } from '../../lib/api.js';

const FALLBACK_CHANNELS = [
  {
    id: 'general-architecture',
    slug: 'general-architecture',
    name: 'general-architecture',
    topic: 'Landscape spatial design, zoning regulations, and master planning concepts',
    pinned: '📌 Welcome to the 2026 Studio! Share portfolio drafts, field challenges, and project milestones.',
    membersCount: 428
  },
  {
    id: 'site-grading-swales',
    slug: 'site-grading-swales',
    name: 'site-grading-swales',
    topic: 'Topographical contours, cut-and-fill balance, and stormwater management',
    pinned: '📌 Tip: Always verify benchmark elevation before calculating run-to-rise swale invert depths.',
    membersCount: 312
  },
  {
    id: 'hardscape-masonry',
    slug: 'hardscape-masonry',
    name: 'hardscape-masonry',
    topic: 'Dry-stack vs mortared stone, retaining wall footers, and geogrid ties',
    pinned: '📌 Specification: Hydrostatic weep holes must be set at 6-8ft intervals with crushed washed gravel backfill.',
    membersCount: 289
  },
  {
    id: 'botanical-lighting',
    slug: 'botanical-lighting',
    name: 'botanical-lighting',
    topic: 'Xeriscaping, native plant matrices, micro-climates, and low-voltage lumen schemes',
    pinned: '📌 Recommended Kelvin: 2700K warm white for foliage uplighting, 3000K for stone column washes.',
    membersCount: 205
  },
  {
    id: 'ask-instructors',
    slug: 'ask-instructors',
    name: 'ask-instructors',
    topic: 'Direct Q&A with masterclass faculty and licensed landscape architects',
    pinned: '📌 Instructors host live studio critique sessions every Tuesday & Thursday at 6:00 PM EST.',
    membersCount: 450
  }
];

export default function CommunityView({ token, user, onOpenAdminCommunity }) {
  const isModerator = user && ['SUPER_ADMIN', 'CONTENT_MANAGER', 'ADMIN'].includes(user.role);

  const [channels, setChannels] = useState(FALLBACK_CHANNELS);
  const [selectedChannelId, setSelectedChannelId] = useState('general-architecture');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeOnlineCount, setActiveOnlineCount] = useState(28);
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [actionNotice, setActionNotice] = useState(null);
  const messagesEndRef = useRef(null);

  // Load Channels from Backend or Fallback
  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/community/channels/`);
      if (res.ok) {
        const data = await res.json();
        if (data.channels && data.channels.length > 0) {
          setChannels(data.channels);
        }
      }
    } catch (e) {
      console.warn('Using offline channels fallback', e);
    }
  };

  // Load Channel Messages
  useEffect(() => {
    fetchMessages(selectedChannelId);
  }, [selectedChannelId]);

  const fetchMessages = async (slug) => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${BASE_URL}/api/community/channels/${slug}/messages/`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.messages) {
          setMessages(data.messages);
          return;
        }
      }
    } catch (e) {
      console.warn('Network error fetching messages, falling back to cached state', e);
    }

    // Local cached fallback
    try {
      const stored = localStorage.getItem(`lm_comm_${slug}`);
      if (stored) {
        setMessages(JSON.parse(stored));
      } else {
        // Initial mock message for clean UX
        setMessages([
          {
            id: `init-${slug}`,
            sender: 'Marcus Vance, RLA',
            role: 'Lead Faculty',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
            time: '10:15 AM',
            text: `Welcome to #${slug}. Share site observations, technical specifications, and project questions.`,
            reactions: { '👍': 12, '💡': 8 }
          }
        ]);
      }
    } catch {
      setMessages([]);
    }
  };

  const showNotice = (text, type = 'info') => {
    setActionNotice({ text, type });
    setTimeout(() => setActionNotice(null), 3500);
  };

  // Gentle online presence simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveOnlineCount(prev => Math.max(19, Math.min(42, prev + (Math.random() > 0.5 ? 1 : -1))));
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  const activeChannel = channels.find(c => (c.slug || c.id) === selectedChannelId) || channels[0] || FALLBACK_CHANNELS[0];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedChannelId, messages.length]);

  // Send Message
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!newMessage.trim() || isSending) return;

    const textToSend = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    const optimisticMsg = {
      id: `tmp-${Date.now()}`,
      sender: user?.name || user?.full_name || (user?.email ? user.email.split('@')[0] : 'You (Student Architect)'),
      sender_email: user?.email || '',
      role: isModerator ? (user.role === 'SUPER_ADMIN' ? 'Portal Super Admin' : 'Content Manager') : 'Student Architect',
      is_moderator: isModerator,
      avatar: user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: textToSend,
      reactions: {}
    };

    setMessages(prev => [...prev, optimisticMsg]);

    try {
      if (token) {
        const res = await fetch(`${BASE_URL}/api/community/channels/${activeChannel.slug || selectedChannelId}/post/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ content: textToSend })
        });

        if (res.ok) {
          const resData = await res.json();
          if (resData.data) {
            setMessages(prev => prev.map(m => m.id === optimisticMsg.id ? resData.data : m));
          }
        } else {
          const errData = await res.json();
          showNotice(errData.error || 'Failed to post message', 'error');
        }
      } else {
        // Cache locally for guest/preview
        localStorage.setItem(`lm_comm_${selectedChannelId}`, JSON.stringify([...messages, optimisticMsg]));
      }
    } catch {
      // Offline fallback
    } finally {
      setIsSending(false);
    }
  };

  // Toggle Reactions
  const handleToggleReaction = async (msgId, emoji) => {
    setMessages(prev => prev.map(m => {
      if (m.id !== msgId) return m;
      const rx = m.reactions || {};
      return {
        ...m,
        reactions: {
          ...rx,
          [emoji]: (rx[emoji] || 0) + 1
        }
      };
    }));

    if (token && typeof msgId === 'number') {
      try {
        await fetch(`${BASE_URL}/api/community/messages/${msgId}/react/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ emoji })
        });
      } catch {
        // Silent reaction sync
      }
    }
  };

  // Student: Flag / Report Message
  const handleFlagMessage = async (msgId) => {
    if (!token) {
      showNotice('Please log in to report messages', 'error');
      return;
    }
    try {
      const res = await fetch(`${BASE_URL}/api/community/messages/${msgId}/flag/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason: 'Reported by studio student' })
      });
      if (res.ok) {
        showNotice('Message reported to Content Managers & Super Admins for review.', 'success');
      }
    } catch {
      showNotice('Report submitted.', 'info');
    }
  };

  // MODERATOR ACTIONS (SUPER_ADMIN & CONTENT_MANAGER)
  const handleModAction = async (msgId, action) => {
    if (!token || !isModerator) return;

    try {
      const res = await fetch(`${BASE_URL}/api/admin/community/messages/${msgId}/moderate/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });

      if (res.ok) {
        if (action === 'delete') {
          setMessages(prev => prev.filter(m => m.id !== msgId));
          showNotice('Message deleted by studio moderator.', 'success');
        } else if (action === 'pin') {
          setMessages(prev => prev.map(m => m.id === msgId ? { ...m, is_pinned: true } : m));
          showNotice('Message pinned to channel header.', 'success');
        } else if (action === 'unpin') {
          setMessages(prev => prev.map(m => m.id === msgId ? { ...m, is_pinned: false } : m));
          showNotice('Message unpinned.', 'info');
        }
      }
    } catch {
      showNotice('Moderation action failed', 'error');
    }
  };

  // Mute member action by moderator
  const handleMuteMember = async (senderId, senderEmail) => {
    if (!token || !isModerator || !senderId) return;
    if (!window.confirm(`Mute user ${senderEmail} from posting in all community channels?`)) return;

    try {
      const res = await fetch(`${BASE_URL}/api/admin/community/members/${senderId}/moderate/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'mute', reason: 'Direct moderator intervention' })
      });

      if (res.ok) {
        showNotice(`Member ${senderEmail} has been muted.`, 'success');
      }
    } catch {
      showNotice('Failed to mute user', 'error');
    }
  };

  const filteredMessages = messages.filter(m => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (m.text && m.text.toLowerCase().includes(q)) || (m.sender && m.sender.toLowerCase().includes(q));
  });

  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 shadow-xs overflow-hidden flex flex-col h-[750px]">
      {/* Toast Notice */}
      <AnimatePresence>
        {actionNotice && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`px-4 py-2 text-xs font-semibold flex items-center justify-between border-b ${
              actionNotice.type === 'error' ? 'bg-rose-50 text-rose-800 border-rose-200' :
              actionNotice.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
              'bg-blue-50 text-blue-800 border-blue-200'
            }`}
          >
            <span>{actionNotice.text}</span>
            <button onClick={() => setActionNotice(null)} className="font-bold opacity-60 hover:opacity-100">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODERATOR BANNER (Super Admin & Content Manager only) */}
      {isModerator && (
        <div className="px-5 py-2.5 bg-gradient-to-r from-emerald-900 to-stone-900 text-white flex items-center justify-between text-xs shadow-inner">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-400 text-base">verified_user</span>
            <span className="font-bold tracking-tight">
              Community Moderator Rights Enabled
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-700/80 text-[10px] uppercase font-bold text-emerald-100">
              {user?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Content Manager'}
            </span>
          </div>

          {onOpenAdminCommunity && (
            <button
              onClick={onOpenAdminCommunity}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
            >
              <span>Open Admin Community Console</span>
              <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </button>
          )}
        </div>
      )}

      {/* Top Bar */}
      <div className="p-4 sm:p-5 border-b border-stone-200 bg-stone-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-xs">
            #
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-stone-900 tracking-tight">#{activeChannel.name}</h2>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-100">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {activeOnlineCount} Online
              </span>
              {activeChannel.is_read_only && (
                <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200">
                  🔒 Read-Only
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 line-clamp-1 mt-0.5">{activeChannel.topic}</p>
          </div>
        </div>

        {/* Message Search */}
        <div className="relative w-full sm:w-64">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-base">
            search
          </span>
          <input
            type="text"
            placeholder="Search discussion..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white rounded-lg border border-stone-200 focus:outline-hidden focus:border-blue-500 text-stone-800"
          />
        </div>
      </div>

      {/* Main Split Layout: Channels Rail (left) + Chat Stream (right) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Channels Navigation Rail */}
        <div className="w-56 sm:w-64 border-r border-stone-200 bg-stone-50/70 p-3 overflow-y-auto hidden md:block">
          <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400 px-3 py-2 flex items-center justify-between">
            <span>Discussions & Rooms</span>
            <span className="font-mono text-[10px] text-stone-400">{channels.length}</span>
          </div>

          <div className="space-y-1">
            {channels.map(ch => {
              const chSlug = ch.slug || ch.id;
              const isSelected = chSlug === selectedChannelId;
              return (
                <button
                  key={chSlug}
                  onClick={() => setSelectedChannelId(chSlug)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-2xs font-bold'
                      : 'text-stone-600 hover:bg-stone-200/60 hover:text-stone-900'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="opacity-70 font-mono">#</span>
                    <span className="truncate">{ch.name}</span>
                  </div>
                  {ch.is_read_only && (
                    <span className="text-[10px] opacity-80">🔒</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Studio Info */}
          <div className="mt-8 p-3.5 rounded-xl bg-white border border-stone-200 shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-bold text-stone-800 mb-1">
              <span className="material-symbols-outlined text-blue-600 text-base">verified</span>
              Live Architecture Studio
            </div>
            <p className="text-[11px] text-stone-500 leading-relaxed">
              Moderated by licensed landscape faculty and certified superintendents.
            </p>
          </div>
        </div>

        {/* Chat Feed */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          {/* Pinned Channel Notice */}
          {(activeChannel.pinned || activeChannel.pinned_announcement) && (
            <div className="px-5 py-2.5 bg-blue-50/60 border-b border-blue-100 text-xs text-blue-900 flex items-center justify-between gap-3">
              <span className="truncate font-medium">
                {activeChannel.pinned || activeChannel.pinned_announcement}
              </span>
              <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider whitespace-nowrap">Pinned</span>
            </div>
          )}

          {/* Messages Scroll Area */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            {filteredMessages.length === 0 ? (
              <div className="py-20 text-center text-stone-400">
                <span className="material-symbols-outlined text-4xl mb-1">chat</span>
                <p className="text-xs">No messages in #{activeChannel.name}. Start the discussion below!</p>
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const isInstructor = msg.is_moderator || msg.role?.includes('Faculty') || msg.role?.includes('Manager') || msg.role?.includes('Admin');
                return (
                  <div key={msg.id} className="flex items-start gap-3 group relative">
                    <img
                      src={msg.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
                      alt={msg.sender}
                      className="w-9 h-9 rounded-full object-cover shrink-0 border border-stone-200 shadow-2xs"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-stone-900">{msg.sender}</span>
                        {msg.role && (
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            isInstructor
                              ? 'bg-amber-100 text-amber-900 font-bold border border-amber-200'
                              : 'bg-stone-100 text-stone-600'
                          }`}>
                            {msg.role}
                          </span>
                        )}
                        {msg.is_pinned && (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            📌 Pinned
                          </span>
                        )}
                        <span className="text-[11px] text-stone-400 font-mono ml-auto">{msg.time}</span>
                      </div>

                      <div className="text-xs sm:text-sm text-stone-700 bg-stone-50/80 rounded-2xl p-3 border border-stone-100 leading-relaxed break-words">
                        {msg.text}
                      </div>

                      {/* Reactions & Hover Action Bar */}
                      <div className="flex items-center justify-between gap-2 mt-2">
                        {/* Reactions Bar */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {Object.entries(msg.reactions || {}).map(([emoji, count]) => (
                            count > 0 && (
                              <button
                                key={emoji}
                                onClick={() => handleToggleReaction(msg.id, emoji)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-stone-100 hover:bg-blue-50 text-[11px] text-stone-700 border border-stone-200/60 transition-all cursor-pointer"
                              >
                                <span>{emoji}</span>
                                <span className="font-semibold text-[10px]">{count}</span>
                              </button>
                            )
                          ))}

                          {/* Quick Reaction Emoji Picker */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 pl-1">
                            {['👍', '🔥', '💡', '📐'].map(emoji => (
                              <button
                                key={emoji}
                                onClick={() => handleToggleReaction(msg.id, emoji)}
                                className="text-xs p-1 hover:bg-stone-100 rounded transition-all cursor-pointer"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Message Actions (Report / Moderator Tools) */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                          {/* Student Report Flag */}
                          {!isModerator && (
                            <button
                              onClick={() => handleFlagMessage(msg.id)}
                              title="Report message"
                              className="p-1 text-stone-400 hover:text-amber-600 rounded cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[15px]">flag</span>
                            </button>
                          )}

                          {/* Super Admin & Content Manager Mod Menu */}
                          {isModerator && (
                            <>
                              <button
                                onClick={() => handleModAction(msg.id, msg.is_pinned ? 'unpin' : 'pin')}
                                title={msg.is_pinned ? 'Unpin' : 'Pin to channel'}
                                className="p-1 text-stone-400 hover:text-amber-600 rounded cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[15px]">
                                  {msg.is_pinned ? 'push_pin' : 'keep'}
                                </span>
                              </button>
                              <button
                                onClick={() => handleModAction(msg.id, 'delete')}
                                title="Delete message (Moderator)"
                                className="p-1 text-stone-400 hover:text-rose-600 rounded cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[15px]">delete</span>
                              </button>
                              {msg.sender_id && (
                                <button
                                  onClick={() => handleMuteMember(msg.sender_id, msg.sender_email || msg.sender)}
                                  title="Mute user from studio"
                                  className="p-1 text-stone-400 hover:text-rose-600 rounded cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-[15px]">volume_off</span>
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Message Input Bar */}
          <div className="p-3 sm:p-4 border-t border-stone-200 bg-stone-50/50">
            {activeChannel.is_read_only && !isModerator ? (
              <div className="py-2.5 px-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-base">lock</span>
                <span>This channel is currently read-only. Only course instructors and faculty can post.</span>
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={`Message #${activeChannel.name}... (Press Enter to send)`}
                  className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-white rounded-xl border border-stone-200 focus:outline-hidden focus:border-blue-500 shadow-2xs text-stone-900 placeholder-stone-400"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || isSending}
                  className={`flex items-center justify-center p-2.5 rounded-xl font-bold transition-all shadow-xs ${
                    newMessage.trim() && !isSending
                      ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                      : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">send</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
