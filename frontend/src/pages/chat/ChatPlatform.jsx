import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../lib/auth';
import { 
  getConversations, 
  getMessages, 
  sendMessage, 
  markMessagesRead 
} from '../../api/messageApi';
import { 
  Search, 
  Send, 
  MessageSquare, 
  RefreshCw, 
  Menu,
  CheckCheck,
  Clock,
  ShieldAlert,
  UserCheck
} from 'lucide-react';

export default function ChatPlatform({ onBack, onToggleSidebar }) {
  const { user, role } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [search, setSearch] = useState('');
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const messagesEndRef = useRef(null);
  const activeIdRef = useRef(activeId);
  activeIdRef.current = activeId;

  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    }
  }, []);

  // ─── Fetch Conversations ────────────────────────────────────────────────────
  const fetchConversations = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoadingConvs(true);
    try {
      const res = await getConversations();
      const list = res?.data?.data || [];
      setConversations(list);

      // Auto-select first conversation if none selected yet or previous activeId no longer exists
      if (list.length > 0) {
        if (!activeIdRef.current || !list.some(c => c.id === activeIdRef.current)) {
          setActiveId(list[0].id);
        }
      } else {
        setActiveId(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      if (!isSilent) setLoadingConvs(false);
    }
  }, []);

  // ─── Fetch Messages for Active Mentorship ────────────────────────────────────
  const fetchActiveMessages = useCallback(async (mentorshipId, isSilent = false) => {
    if (!mentorshipId) return;
    if (!isSilent) setLoadingMessages(true);
    try {
      const res = await getMessages(mentorshipId);
      const msgs = res?.data?.data || [];
      setMessages(msgs);

      // Update conversation's unread count in state
      setConversations(prev => prev.map(c => 
        c.id === mentorshipId ? { ...c, unreadCount: 0 } : c
      ));

      if (!isSilent) {
        setTimeout(() => scrollToBottom(false), 50);
      }
    } catch (err) {
      console.error('Failed to load messages for mentorship:', mentorshipId, err);
    } finally {
      if (!isSilent) setLoadingMessages(false);
    }
  }, [scrollToBottom]);

  // Initial Load
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // When activeId changes, load its messages
  useEffect(() => {
    if (activeId) {
      fetchActiveMessages(activeId, false);
      markMessagesRead(activeId).catch(() => {});
    } else {
      setMessages([]);
    }
  }, [activeId, fetchActiveMessages]);

  // ─── Polling: Messages every 3s, Conversations every 10s ─────────────────────
  useEffect(() => {
    const msgInterval = setInterval(() => {
      if (activeIdRef.current) {
        fetchActiveMessages(activeIdRef.current, true);
      }
    }, 3000);

    const convInterval = setInterval(() => {
      fetchConversations(true);
    }, 10000);

    return () => {
      clearInterval(msgInterval);
      clearInterval(convInterval);
    };
  }, [fetchActiveMessages, fetchConversations]);

  // ─── Manual Refresh Handler ──────────────────────────────────────────────────
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchConversations(false);
      if (activeIdRef.current) {
        await fetchActiveMessages(activeIdRef.current, false);
      }
    } finally {
      setTimeout(() => setRefreshing(false), 400);
    }
  };

  // ─── Send Message ────────────────────────────────────────────────────────────
  const handleSendMessage = async (e) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || !activeId || sending) return;

    const currentActiveConv = conversations.find(c => c.id === activeId);
    if (!currentActiveConv) return;

    // Optimistic message append
    const currentUserId = user?.id || user?._id;
    const tempId = 'temp-' + Date.now();
    const optimisticMessage = {
      _id: tempId,
      mentorshipId: activeId,
      senderId: currentUserId,
      receiverId: currentActiveConv.partner?.id,
      text: trimmed,
      createdAt: new Date().toISOString(),
      read: false,
      isOptimistic: true
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setInputText('');
    setSending(true);
    setTimeout(() => scrollToBottom(true), 30);

    try {
      const res = await sendMessage(activeId, trimmed);
      const savedMessage = res?.data?.data;

      // Replace optimistic message with saved one
      if (savedMessage) {
        setMessages(prev => prev.map(m => m._id === tempId ? savedMessage : m));
      }

      // Update conversations list latest message
      setConversations(prev => prev.map(c => {
        if (c.id === activeId) {
          return {
            ...c,
            lastMessage: savedMessage || {
              text: trimmed,
              senderId: currentUserId,
              createdAt: new Date().toISOString()
            },
            updatedAt: new Date().toISOString()
          };
        }
        return c;
      }));
    } catch (err) {
      console.error('Failed to send message:', err);
      // Remove failed optimistic message
      setMessages(prev => prev.filter(m => m._id !== tempId));
      alert(err.response?.data?.error || 'Failed to send message. Please verify mentorship status.');
    } finally {
      setSending(false);
      setTimeout(() => scrollToBottom(true), 50);
    }
  };

  // ─── Format Time Helper ─────────────────────────────────────────────────────
  const formatTime = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  // ─── Get Initials Helper ────────────────────────────────────────────────────
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  // ─── Active Conversation Selection ──────────────────────────────────────────
  const activeConv = conversations.find(c => c.id === activeId) || null;

  // ─── Filter Conversations by Search ─────────────────────────────────────────
  const filteredConversations = conversations.filter(c => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    const name = c.partner?.name?.toLowerCase() || '';
    const email = c.partner?.email?.toLowerCase() || '';
    const roleStr = c.partner?.role?.toLowerCase() || '';
    const dept = c.partner?.department?.toLowerCase() || '';
    const company = c.partner?.company?.toLowerCase() || '';
    return name.includes(q) || email.includes(q) || roleStr.includes(q) || dept.includes(q) || company.includes(q);
  });

  return (
    <div className="flex-1 min-w-0 bg-[#EBF3FA] pb-12 min-h-screen flex flex-col">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (onToggleSidebar) onToggleSidebar();
            }}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer border border-slate-200/80 shadow-xs shrink-0"
            title="Toggle Navigation Sidebar"
          >
            <Menu className="w-5 h-5 text-slate-800" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-purple-600" />
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {role === 'student' ? 'Student Messages' : (role === 'alumni' ? 'Alumni Messages' : 'Messages')}
              </h1>
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                role === 'student' 
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                  : 'bg-purple-100 text-purple-800 border border-purple-300'
              }`}>
                {role === 'student' ? 'Student Portal' : (role === 'alumni' ? 'Alumni Portal' : 'Admin Portal')}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {role === 'student' 
                ? 'Direct 1-on-1 real-time chat with your connected alumni mentors.' 
                : (role === 'alumni'
                    ? 'Direct 1-on-1 real-time chat with your accepted student mentees.'
                    : 'Direct 1-on-1 real-time communication platform.')}
            </p>
          </div>
        </div>

        <button 
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer shadow-2xs"
          title="Refresh messages and conversations"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-purple-600' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <main className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full flex-1 flex flex-col">
        {/* Main Chat Box Container */}
        <div className="flex-1 min-h-[640px] grid grid-cols-1 md:grid-cols-12 rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-xs">
          
          {/* Left Column: Contact List */}
          <div className="md:col-span-4 border-r border-slate-200 flex flex-col bg-white">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder={role === 'student' ? "Search alumni mentors..." : "Search student mentees..."}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                />
              </div>
            </div>

            <div className="p-2.5 bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 px-4 flex items-center justify-between">
              <span>
                {role === 'student' 
                  ? 'Connected Alumni Mentors' 
                  : (role === 'alumni' ? 'Connected Student Mentees' : 'Connected Users')}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-extrabold">
                {filteredConversations.length} Active
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
              {loadingConvs && conversations.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading active conversations...</div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  {search 
                    ? 'No matching conversations found.' 
                    : (role === 'student'
                        ? 'No connected alumni mentors yet. Mentorship chat is enabled once an alumni accepts your request.'
                        : (role === 'alumni'
                            ? 'No connected student mentees yet. Chat will appear here when you accept student mentorship requests.'
                            : 'No active mentorship conversations.'))}
                </div>
              ) : (
                filteredConversations.map(conv => {
                  const isActive = activeConv && conv.id === activeConv.id;
                  const partner = conv.partner || {};
                  const lastMsg = conv.lastMessage;
                  const initials = getInitials(partner.name);
                  const isMe = lastMsg && String(lastMsg.senderId) === String(user?.id || user?._id);

                  // Subtitle / designation
                  const designation = role === 'student'
                    ? [partner.role || 'Alumni Mentor', partner.company].filter(Boolean).join(' • ')
                    : ['Student Mentee', partner.department, partner.batch ? `Batch ${partner.batch}` : null].filter(Boolean).join(' • ');

                  return (
                    <button
                      key={conv.id}
                      onClick={() => setActiveId(conv.id)}
                      className={`w-full p-3.5 flex items-center gap-3 text-left rounded-xl transition-all cursor-pointer ${
                        isActive 
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20' 
                          : 'hover:bg-slate-50 text-slate-900'
                      }`}
                    >
                      {/* Circle Badge Avatar */}
                      <div className="relative shrink-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                          isActive 
                            ? 'bg-purple-500 text-white border-2 border-purple-400' 
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {initials}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className={`font-bold text-xs truncate ${isActive ? 'text-white' : 'text-slate-900'}`}>
                            {partner.name || 'Unknown User'}
                          </h4>
                          {lastMsg && lastMsg.createdAt && (
                            <span className={`text-[10px] shrink-0 font-medium ${isActive ? 'text-purple-200' : 'text-slate-400'}`}>
                              {formatTime(lastMsg.createdAt)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <p className={`text-[11px] truncate font-medium ${
                            isActive ? 'text-purple-100' : 'text-slate-400'
                          }`}>
                            {lastMsg ? `${isMe ? 'You: ' : ''}${lastMsg.text}` : designation}
                          </p>
                          {conv.unreadCount > 0 && !isActive && (
                            <span className="ml-2 px-1.5 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-extrabold shrink-0">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Panel: Active Chat Window */}
          <div className="md:col-span-8 flex flex-col bg-white justify-between">
            {/* Top Chat Header */}
            {activeConv ? (
              <div className="p-4 px-6 border-b border-slate-100 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                    {getInitials(activeConv.partner?.name)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      {activeConv.partner?.name || 'Conversation'}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">
                      {role === 'student'
                        ? [activeConv.partner?.role || 'Alumni Mentor', activeConv.partner?.company ? `at ${activeConv.partner.company}` : '', activeConv.partner?.department].filter(Boolean).join(' • ')
                        : ['Student Mentee', activeConv.partner?.department, activeConv.partner?.batch ? `Batch ${activeConv.partner.batch}` : null].filter(Boolean).join(' • ')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-700">
                    <UserCheck className="w-3 h-3" />
                    <span>Active Mentorship</span>
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 px-6 border-b border-slate-100 flex items-center justify-between bg-white">
                <div className="text-xs font-semibold text-slate-400">No conversation selected</div>
              </div>
            )}

            {/* Messages Feed or Empty State */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 flex flex-col justify-start items-stretch">
              {!activeConv ? (
                /* No Conversation Selected */
                <div className="flex flex-col items-center justify-center text-center my-auto p-8">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-300 mb-3">
                    <MessageSquare className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-base">
                    {conversations.length === 0 ? 'No Active Mentorships' : 'Select a Conversation'}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-1 max-w-sm">
                    {conversations.length === 0 
                      ? (role === 'student'
                          ? 'Once an alumni accepts your 1-to-1 mentorship request, your direct chat channel opens here automatically.'
                          : (role === 'alumni'
                              ? 'Once you accept student 1-to-1 mentorship requests, your direct chat channel opens here automatically.'
                              : 'No active mentorship conversations found.'))
                      : 'Choose a contact from the list on the left to start chatting.'}
                  </p>
                </div>
              ) : loadingMessages && messages.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 my-auto">Loading message history...</div>
              ) : messages.length === 0 ? (
                /* Empty State for Selected Conversation */
                <div className="flex flex-col items-center justify-center text-center my-auto p-8">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-300 mb-3">
                    <MessageSquare className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-base">No messages yet</h3>
                  <p className="text-xs text-slate-400 font-medium mt-1">
                    Send a greeting to start your conversation with {activeConv.partner?.name || 'your contact'}!
                  </p>
                </div>
              ) : (
                /* Messages Feed */
                <div className="w-full space-y-3.5 my-0">
                  {messages.map(msg => {
                    const currentUserId = user?.id || user?._id;
                    const isMe = String(msg.senderId) === String(currentUserId);
                    const timeStr = formatTime(msg.createdAt);

                    return (
                      <div 
                        key={msg._id || msg.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div 
                          className={`max-w-md px-4 py-3 rounded-2xl text-xs font-medium leading-relaxed break-words whitespace-pre-wrap ${
                            isMe 
                              ? 'bg-purple-600 text-white rounded-tr-none shadow-xs' 
                              : 'bg-slate-100 text-slate-800 rounded-tl-none'
                          }`}
                        >
                          {msg.text}
                        </div>
                        <div className={`flex items-center gap-1 mt-1 px-1 text-[10px] text-slate-400 font-semibold ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <span>{timeStr}</span>
                          {isMe && (
                            <CheckCheck className={`w-3.5 h-3.5 ${msg.read ? 'text-purple-600' : 'text-slate-300'}`} />
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message Input Box */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 bg-white flex items-center gap-3">
              <input 
                type="text"
                disabled={!activeConv || sending}
                placeholder={activeConv ? `Type your message to ${activeConv.partner?.name || ''}... (Press Enter to send)` : "Select a conversation to start chatting..."}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40 disabled:opacity-50"
              />

              <button
                type="submit"
                disabled={!inputText.trim() || !activeConv || sending}
                className="px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold shadow-xs flex items-center gap-2 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{sending ? 'Sending...' : 'Send'}</span>
              </button>
            </form>

          </div>
        </div>
      </main>
    </div>
  );
}
