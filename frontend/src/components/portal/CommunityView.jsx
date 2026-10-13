import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CHANNELS = [
  {
    id: 'general-architecture',
    name: 'general-architecture',
    topic: 'Landscape spatial design, zoning regulations, and master planning concepts',
    pinned: '📌 Welcome to the 2026 Studio! Share portfolio drafts, field challenges, and project milestones.',
    membersCount: 428
  },
  {
    id: 'site-grading-swales',
    name: 'site-grading-swales',
    topic: 'Topographical contours, cut-and-fill balance, and stormwater management',
    pinned: '📌 Tip: Always verify benchmark elevation before calculating run-to-rise swale invert depths.',
    membersCount: 312
  },
  {
    id: 'hardscape-masonry',
    name: 'hardscape-masonry',
    topic: 'Dry-stack vs mortared stone, retaining wall footers, and geogrid ties',
    pinned: '📌 Specification: Hydrostatic weep holes must be set at 6-8ft intervals with crushed washed gravel backfill.',
    membersCount: 289
  },
  {
    id: 'botanical-lighting',
    name: 'botanical-lighting',
    topic: 'Xeriscaping, native plant matrices, micro-climates, and low-voltage lumen schemes',
    pinned: '📌 Recommended Kelvin: 2700K warm white for foliage uplighting, 3000K for stone column washes.',
    membersCount: 205
  },
  {
    id: 'ask-instructors',
    name: 'ask-instructors',
    topic: 'Direct Q&A with masterclass faculty and licensed landscape architects',
    pinned: '📌 Instructors host live studio critique sessions every Tuesday & Thursday at 6:00 PM EST.',
    membersCount: 450
  }
];

const INITIAL_MESSAGES = {
  'general-architecture': [
    {
      id: 'm1',
      sender: 'Marcus Vance, RLA',
      role: 'Lead Faculty',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      time: '10:14 AM',
      text: 'Good morning practitioners. For the courtyard schematic assignment, pay close attention to negative space around primary specimen trees. Do not crowd the root zone with dense hardscape paving.',
      reactions: { '👍': 14, '🔥': 5, '💡': 8 }
    },
    {
      id: 'm2',
      sender: 'Elena Rostova',
      role: 'Architect',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
      time: '10:28 AM',
      text: 'Agreed! In our recent Mediterranean villa project, we maintained a 12-foot permeable gravel circle around mature olive trees with sub-surface aeration rings.',
      reactions: { '💡': 6, '📐': 4 }
    },
    {
      id: 'm3',
      sender: 'David Chen',
      role: 'Student',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      time: '11:02 AM',
      text: 'Has anyone tested using permeable resin-bound aggregate right up to the tree grate? Does it allow sufficient gas exchange for oaks?',
      reactions: { '👍': 2 }
    },
    {
      id: 'm4',
      sender: 'Marcus Vance, RLA',
      role: 'Lead Faculty',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      time: '11:15 AM',
      text: 'David, it depends heavily on the aggregate binder. Polyurethane matrix maintains ~20% void ratio which works well, but epoxy binders will clog over time with organic silt. Better to install vertical perforated aeration tubes around the drip line.',
      reactions: { '🔥': 9, '💡': 11 }
    }
  ],
  'site-grading-swales': [
    {
      id: 'm-sg-1',
      sender: 'Sarah Jenkins, PE',
      role: 'Civil Engineer',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80',
      time: '09:20 AM',
      text: 'When calculating rational method runoff Q = C * I * A, remember to bump the runoff coefficient C from 0.20 to 0.35 if the lawn sits on compacted subsoil post-construction.',
      reactions: { '💡': 12, '📐': 7 }
    },
    {
      id: 'm-sg-2',
      sender: 'Carlos Mendez',
      role: 'Student',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
      time: '09:45 AM',
      text: 'That explains why my initial swale depth calculation overflowed during the 10-year storm simulation. Updating my grading profile now.',
      reactions: { '👍': 4 }
    }
  ],
  'hardscape-masonry': [
    {
      id: 'm-hm-1',
      sender: 'Vikram Patel',
      role: 'Masonry Specialist',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&auto=format&fit=crop&q=80',
      time: '08:10 AM',
      text: 'Rule of thumb: Any segmental retaining wall exceeding 4 feet in height MUST include stamped structural engineering calculations with biaxial geogrid reinforcement.',
      reactions: { '👍': 18, '🔥': 6 }
    }
  ],
  'botanical-lighting': [
    {
      id: 'm-bl-1',
      sender: 'Amara Okafor',
      role: 'Lighting Designer',
      avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&auto=format&fit=crop&q=80',
      time: '07:30 AM',
      text: 'Avoid mounting spotlights directly on tree trunks with rigid screws. Use stainless steel tree-friendly bungee straps that expand as the trunk caliper grows.',
      reactions: { '💡': 15, '👍': 9 }
    }
  ],
  'ask-instructors': [
    {
      id: 'm-ai-1',
      sender: 'Marcus Vance, RLA',
      role: 'Lead Faculty',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      time: 'Yesterday',
      text: 'Welcome to Office Hours! Drop your CAD drawing queries or grading balance questions here. We answer all questions within 4 hours during business days.',
      reactions: { '👍': 22 }
    }
  ]
};

const SIMULATED_REPLIES = [
  "Excellent point! Make sure to verify that against local municipal stormwater ordinances.",
  "That's a very common field challenge. In our practice, we solve that with a dual-stage bioretention basin.",
  "Check out Module 2, Lesson 4 for the detailed step-by-step CAD drafting blueprint on this exact detail.",
  "Great question! Keep in mind the soil compaction testing requirements (ASTM D1557) before laying your stone base.",
  "Love this observation! Adding this to our studio whiteboard for tomorrow's review session."
];

export default function CommunityView() {
  const [selectedChannelId, setSelectedChannelId] = useState('general-architecture');
  const [messagesByChannel, setMessagesByChannel] = useState(() => {
    try {
      const stored = localStorage.getItem('lm_portal_community_messages');
      return stored ? JSON.parse(stored) : INITIAL_MESSAGES;
    } catch {
      return INITIAL_MESSAGES;
    }
  });
  
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeOnlineCount, setActiveOnlineCount] = useState(26);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Sync with localStorage
  useEffect(() => {
    try {
      localStorage.setItem('lm_portal_community_messages', JSON.stringify(messagesByChannel));
    } catch (e) {
      console.warn('Failed to persist community messages', e);
    }
  }, [messagesByChannel]);

  // Gentle online presence fluctuation to simulate live peers
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveOnlineCount(prev => Math.max(18, Math.min(38, prev + (Math.random() > 0.5 ? 1 : -1))));
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const activeChannel = CHANNELS.find(c => c.id === selectedChannelId) || CHANNELS[0];
  const activeMessages = messagesByChannel[selectedChannelId] || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedChannelId, activeMessages.length]);

  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!newMessage.trim()) return;

    const userMsg = {
      id: `usr-${Date.now()}`,
      sender: 'You (Student Architect)',
      role: 'Practitioner',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: newMessage.trim(),
      reactions: {}
    };

    setMessagesByChannel(prev => ({
      ...prev,
      [selectedChannelId]: [...(prev[selectedChannelId] || []), userMsg]
    }));

    const sentText = newMessage.trim();
    setNewMessage('');

    // Trigger realistic peer reaction / response after 2 seconds
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const randomReply = SIMULATED_REPLIES[Math.floor(Math.random() * SIMULATED_REPLIES.length)];
      const botMsg = {
        id: `bot-${Date.now()}`,
        sender: 'Marcus Vance, RLA',
        role: 'Lead Faculty',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: randomReply,
        reactions: { '👍': 1 }
      };

      setMessagesByChannel(prev => ({
        ...prev,
        [selectedChannelId]: [...(prev[selectedChannelId] || []), botMsg]
      }));
    }, 2200);
  };

  const handleToggleReaction = (msgId, emoji) => {
    setMessagesByChannel(prev => {
      const channelMsgs = prev[selectedChannelId] || [];
      const updated = channelMsgs.map(m => {
        if (m.id !== msgId) return m;
        const currentCount = m.reactions?.[emoji] || 0;
        return {
          ...m,
          reactions: {
            ...m.reactions,
            [emoji]: currentCount + 1
          }
        };
      });
      return {
        ...prev,
        [selectedChannelId]: updated
      };
    });
  };

  const filteredMessages = activeMessages.filter(m => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return m.text.toLowerCase().includes(q) || m.sender.toLowerCase().includes(q);
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col h-[750px]">
      {/* Top Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-xs">
            #
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">#{activeChannel.name}</h2>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {activeOnlineCount} Online
              </span>
            </div>
            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{activeChannel.topic}</p>
          </div>
        </div>

        {/* Message Search */}
        <div className="relative w-full sm:w-64">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base">
            search
          </span>
          <input
            type="text"
            placeholder="Search discussion..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white rounded-lg border border-slate-200 focus:outline-hidden focus:border-blue-500 text-slate-800"
          />
        </div>
      </div>

      {/* Main Split Layout: Channels Rail (left) + Chat Stream (right) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Channels Navigation Rail */}
        <div className="w-56 sm:w-64 border-r border-slate-200/80 bg-slate-50/70 p-3 overflow-y-auto hidden md:block">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-2">
            Discussions & Rooms
          </div>
          <div className="space-y-1">
            {CHANNELS.map(ch => {
              const isSelected = ch.id === selectedChannelId;
              const msgCount = (messagesByChannel[ch.id] || []).length;
              return (
                <button
                  key={ch.id}
                  onClick={() => setSelectedChannelId(ch.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="opacity-70 font-mono">#</span>
                    <span className="truncate">{ch.name}</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isSelected ? 'bg-blue-700 text-blue-100' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {msgCount}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Studio Info */}
          <div className="mt-8 p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-1">
              <span className="material-symbols-outlined text-blue-600 text-base">verified</span>
              Live Architecture Studio
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Connect in real-time with certified civil engineers, site superintendents, and landscape masters.
            </p>
          </div>
        </div>

        {/* Chat Feed */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          {/* Pinned Channel Notice */}
          {activeChannel.pinned && (
            <div className="px-5 py-2.5 bg-blue-50/60 border-b border-blue-100 text-xs text-blue-900 flex items-center justify-between gap-3">
              <span className="truncate font-medium">{activeChannel.pinned}</span>
              <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider whitespace-nowrap">Pinned</span>
            </div>
          )}

          {/* Messages Scroll Area */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            {filteredMessages.length === 0 ? (
              <div className="py-20 text-center text-slate-400">
                <span className="material-symbols-outlined text-4xl mb-1">chat</span>
                <p className="text-xs">No messages found in #{activeChannel.name}. Start the discussion below!</p>
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const isInstructor = msg.role?.includes('Faculty') || msg.role?.includes('Engineer');
                return (
                  <div key={msg.id} className="flex items-start gap-3 group">
                    <img
                      src={msg.avatar}
                      alt={msg.sender}
                      className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200 shadow-2xs"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-900">{msg.sender}</span>
                        {msg.role && (
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            isInstructor
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {msg.role}
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400 font-mono ml-auto">{msg.time}</span>
                      </div>

                      <div className="text-xs sm:text-sm text-slate-700 bg-slate-50/80 rounded-2xl p-3 border border-slate-100 leading-relaxed break-words">
                        {msg.text}
                      </div>

                      {/* Reactions & Add Reaction Pill */}
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        {Object.entries(msg.reactions || {}).map(([emoji, count]) => (
                          count > 0 && (
                            <button
                              key={emoji}
                              onClick={() => handleToggleReaction(msg.id, emoji)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 hover:bg-blue-50 text-[11px] text-slate-700 border border-slate-200/60 transition-all cursor-pointer"
                            >
                              <span>{emoji}</span>
                              <span className="font-semibold text-[10px]">{count}</span>
                            </button>
                          )
                        ))}

                        {/* Quick Reaction Bar on Hover */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 pl-1">
                          {['👍', '🔥', '💡', '📐'].map(emoji => (
                            <button
                              key={emoji}
                              onClick={() => handleToggleReaction(msg.id, emoji)}
                              className="text-xs p-1 hover:bg-slate-100 rounded transition-all"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Simulated Peer Typing Indicator */}
            {isTyping && (
              <div className="flex items-center gap-2 text-xs text-slate-400 italic py-1">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
                </div>
                <span>Marcus Vance, RLA is typing...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Message Input Bar */}
          <div className="p-3 sm:p-4 border-t border-slate-200/80 bg-slate-50/50">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={`Message #${activeChannel.name}... (Press Enter to send)`}
                className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-white rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-2xs text-slate-900 placeholder-slate-400"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className={`flex items-center justify-center p-2.5 rounded-xl font-bold transition-all shadow-xs ${
                  newMessage.trim()
                    ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">send</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
