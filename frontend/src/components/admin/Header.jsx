import React, { useState, useRef, useEffect } from 'react';
import { 
  RefreshCw, 
  Bell, 
  Search, 
  Sparkles, 
  Menu, 
  X,
  CheckCircle2, 
  Briefcase, 
  Calendar, 
  MessageSquare, 
  Users, 
  UserCheck, 
  Award, 
  Check, 
  ArrowLeft,
  LogOut,
  User,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { useNotifications } from '../../context/NotificationContext';
import notificationApi from '../../api/notificationApi';
import EditProfileModal from '../common/EditProfileModal';

export default function Header({ 
  title, 
  subtitle, 
  onRefresh, 
  isRefreshing, 
  onToggleSidebar, 
  onBack, 
  searchQuery = '', 
  onSearchChange, 
  searchPlaceholder = 'Search by name, company, role, skills...' 
}) {
  const { user, role, logout } = useAuth();
  const { notifications, requests, acceptMentorshipRequest, declineMentorshipRequest, markNotificationRead, markAllNotificationsRead, setNotifications } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState(null); // Full notification detail modal state
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const profileMenuRef = useRef(null);

  const activeRole = role || 'admin';
  const currentNotifs = (notifications && notifications[activeRole]) || [];
  const unreadCount = currentNotifs.filter(n => n.unread).length;

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = () => {
    markAllNotificationsRead(activeRole);
  };

  const handleSelectNotif = (notif) => {
    // Set selected notification modal
    setSelectedNotif(notif);
    setShowNotifications(false);

    // Mark as read when clicked (persisted to MongoDB)
    markNotificationRead(activeRole, notif.id);
  };

  const handleNavigateFromNotif = (notif) => {
    setSelectedNotif(null);
    if (!notif) return;
    const type = (notif.type || '').toLowerCase();
    const notifTitle = (notif.title || '').toLowerCase();

    if (type.includes('mentorship') || notifTitle.includes('mentorship')) {
      window.dispatchEvent(new CustomEvent('navigate-tab', { detail: 'mentorship' }));
    } else if (type.includes('referral') || notifTitle.includes('referral')) {
      window.dispatchEvent(new CustomEvent('navigate-tab', { detail: 'referrals' }));
    } else if (type.includes('event') || notifTitle.includes('event')) {
      window.dispatchEvent(new CustomEvent('navigate-tab', { detail: activeRole === 'admin' ? 'manage-events' : 'events' }));
    } else if (type.includes('registration') || notifTitle.includes('registration')) {
      if (notifTitle.includes('student')) {
        window.dispatchEvent(new CustomEvent('navigate-tab', { detail: 'students' }));
      } else if (notifTitle.includes('alumni')) {
        window.dispatchEvent(new CustomEvent('navigate-tab', { detail: 'alumni' }));
      }
    }
  };

  const dismissNotif = (e, id) => {
    e.stopPropagation();
    setNotifications(prev => ({
      ...prev,
      admin: (prev.admin || []).filter(n => n.id !== id && n._id !== id),
      alumni: (prev.alumni || []).filter(n => n.id !== id && n._id !== id),
      student: (prev.student || []).filter(n => n.id !== id && n._id !== id)
    }));
    try {
      notificationApi.deleteNotification(id);
    } catch (err) {}
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-20 px-4 sm:px-6 flex items-center justify-between shadow-xs gap-3">
      <div className="flex items-center gap-3 min-w-0">
        {/* 3-Line Hamburger Menu Toggle Button - Exclusively toggles sidebar */}
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

        {/* Dedicated Back Button if onBack is provided */}
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer border border-slate-200/80 text-xs font-semibold shadow-xs shrink-0"
            title="Back to Admin Analytics"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">Back</span>
          </button>
        )}

        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate">{title}</h1>
          {subtitle && <p className="text-[11px] sm:text-xs text-slate-500 font-medium hidden lg:block truncate">{subtitle}</p>}
        </div>
      </div>

      {/* Integrated Header Search Bar */}
      {onSearchChange && (
        <div className="relative flex-1 max-w-sm hidden md:block">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      <div className="flex items-center gap-3 shrink-0 relative">
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            title="Refresh analytics data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
            <span className="hidden sm:inline">Refresh Data</span>
          </button>
        )}

        {/* Notification Bell Symbol Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer border border-slate-200/80 shadow-xs relative flex items-center justify-center"
            title="Notifications & Activity Alerts"
          >
            <Bell className="w-4.5 h-4.5 text-slate-700" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] font-extrabold flex items-center justify-center animate-pulse border-2 border-white shadow-sm">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown Box */}
          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 z-50 space-y-3 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-indigo-600" />
                  <h4 className="font-extrabold text-sm text-slate-900 capitalize">{activeRole} Notifications</h4>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[10px] font-bold border border-red-200">
                      {unreadCount} New
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3 h-3" />
                      <span>Mark read</span>
                    </button>
                  )}
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Notification List */}
              <div className="space-y-2.5 max-h-80 overflow-y-auto custom-scrollbar pr-1">
                {currentNotifs.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs">No active notifications</div>
                ) : (
                  currentNotifs.map((notif) => {
                    const IconComp = notif.icon;
                    return (
                      <div
                        key={notif.id}
                        onClick={() => handleSelectNotif(notif)}
                        className={`p-3 rounded-xl border transition-all flex items-start gap-3 relative group cursor-pointer hover:border-indigo-300 hover:shadow-xs ${
                          notif.unread ? 'bg-indigo-50/50 border-indigo-200 font-medium' : 'bg-slate-50/50 border-slate-100'
                        }`}
                      >
                        <div className={`p-2 rounded-xl ${notif.color} shrink-0 mt-0.5 border`}>
                          <IconComp className="w-3.5 h-3.5" />
                        </div>

                        <div className="space-y-0.5 flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h5 className="font-bold text-slate-900 text-xs truncate group-hover:text-indigo-600 transition-colors">{notif.title}</h5>
                            <span className="text-[10px] font-semibold text-slate-400 shrink-0">{notif.time}</span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-snug line-clamp-2">{notif.desc}</p>
                          <span className="text-[10px] text-indigo-600 font-bold hover:underline inline-block mt-0.5">Click to open detail →</span>
                        </div>

                        <button
                          onClick={(e) => dismissNotif(e, notif.id)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 p-0.5 transition-opacity cursor-pointer"
                          title="Dismiss notification"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400">Role: <strong className="uppercase text-slate-700 font-bold">{activeRole}</strong></span>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ─── FULL NOTIFICATION DETAIL POPUP MODAL ─────────────────────────────── */}
        {selectedNotif && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-6 shadow-2xl relative text-slate-900 animate-in zoom-in-95 duration-150">
              <button 
                onClick={() => setSelectedNotif(null)}
                className="absolute top-6 right-6 p-2 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-start gap-3.5 border-b border-slate-100 pb-4">
                <div className={`p-3 rounded-2xl ${selectedNotif.color} shrink-0 border`}>
                  {React.createElement(selectedNotif.icon, { className: "w-6 h-6" })}
                </div>
                <div className="space-y-0.5 min-w-0 pr-6">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-200">
                      Notification Alert
                    </span>
                    <span className="text-[11px] text-slate-400 font-semibold">{selectedNotif.time}</span>
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900 leading-snug">{selectedNotif.title}</h3>
                </div>
              </div>

              {/* Sender Info & Detailed Message Body */}
              <div className="space-y-4">
                {selectedNotif.sender && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 flex items-center gap-3">
                    <img 
                      src={selectedNotif.avatar} 
                      alt={selectedNotif.sender} 
                      className="w-11 h-11 rounded-xl object-cover border border-slate-300 shrink-0" 
                    />
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">{selectedNotif.sender}</h4>
                      <p className="text-[11px] text-slate-500 font-medium">{selectedNotif.senderRole}</p>
                    </div>
                  </div>
                )}

                <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-2">
                  <span className="text-xs font-bold text-indigo-900 block">Message Details:</span>
                  <p className="text-xs text-slate-800 leading-relaxed font-medium">
                    "{selectedNotif.fullMessage || selectedNotif.desc}"
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  onClick={() => setSelectedNotif(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
                
                {(() => {
                  const targetReq = (requests || []).find(r => r.id === selectedNotif.reqId || r.studentName === selectedNotif.sender);
                  const reqStatus = targetReq ? targetReq.status : (selectedNotif.status || 'pending');

                  if (reqStatus === 'accepted') {
                    return (
                      <div className="flex items-center gap-2">
                        <span className="px-3.5 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5" />
                          <span>Mentorship Accepted</span>
                        </span>
                        <button
                          onClick={() => {
                            setSelectedNotif(null);
                            window.dispatchEvent(new CustomEvent('navigate-tab', { detail: 'chat' }));
                          }}
                          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/20 cursor-pointer flex items-center gap-1.5 transition-all"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Open Chat →</span>
                        </button>
                      </div>
                    );
                  }

                  if (reqStatus === 'rejected') {
                    return (
                      <span className="px-3.5 py-1.5 rounded-xl bg-rose-100 text-rose-700 border border-rose-300 text-xs font-bold">
                        Mentorship Declined
                      </span>
                    );
                  }

                  if (selectedNotif.title?.includes('Mentorship') || selectedNotif.title?.includes('Request') || selectedNotif.actionText?.includes('Review Mentorship Request')) {
                    return (
                      <>
                        <button
                          onClick={() => {
                            const reqId = targetReq?.id || selectedNotif.reqId || selectedNotif.sender;
                            declineMentorshipRequest(reqId);
                            setSelectedNotif(null);
                          }}
                          className="px-4 py-2 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-700 text-xs font-bold transition-colors cursor-pointer"
                        >
                          Decline
                        </button>

                        <button
                          onClick={() => {
                            const reqId = targetReq?.id || selectedNotif.reqId || selectedNotif.sender;
                            acceptMentorshipRequest(reqId, user?.name || 'Sarah Jenkins');
                            setSelectedNotif(null);
                            // Automatically open chat tab!
                            window.dispatchEvent(new CustomEvent('navigate-tab', { detail: 'chat' }));
                          }}
                          className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Accept & Chat</span>
                        </button>
                      </>
                    );
                  }

                  return (
                    <button
                      onClick={() => handleNavigateFromNotif(selectedNotif)}
                      className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 cursor-pointer flex items-center gap-1.5"
                    >
                      <span>{selectedNotif.actionText || 'Take Action'}</span>
                      <span>→</span>
                    </button>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

        {/* User Badge & Profile Menu Dropdown */}
        <div className="relative" ref={profileMenuRef}>
          <button
            type="button"
            onClick={() => setShowProfileMenu(prev => !prev)}
            className="flex items-center gap-3 p-1.5 rounded-2xl hover:bg-slate-100 transition-colors cursor-pointer border border-transparent hover:border-slate-200 focus:outline-none"
            title="User Profile Menu"
          >
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={user?.name}
              className="w-8 h-8 rounded-full object-cover border border-slate-300 shadow-xs shrink-0"
            />
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-900 leading-tight">{user?.name}</span>
              <span className="text-[10px] uppercase font-bold text-[#0F4C81] leading-tight">{role}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200/90 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in-50 duration-150">
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <p className="text-xs font-extrabold text-slate-900 truncate">{user?.name}</p>
                <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                  role === 'admin'
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    : role === 'alumni'
                    ? 'bg-sky-50 text-sky-700 border border-sky-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  {role === 'admin' ? 'Administrator' : role === 'alumni' ? 'Alumni Mentor' : 'Student'}
                </span>
                <p className="text-[10px] text-slate-400 truncate mt-1">{user?.email}</p>
              </div>

              {/* Alumni and Student get Edit Profile */}
              {(role === 'alumni' || role === 'student') && (
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    setShowEditProfile(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer text-left"
                >
                  <User className="w-4 h-4 text-[#0F4C81]" />
                  <span>Edit Profile</span>
                </button>
              )}

              {/* All roles can Logout from this menu */}
              <button
                type="button"
                onClick={() => {
                  setShowProfileMenu(false);
                  logout();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer text-left"
              >
                <LogOut className="w-4 h-4 text-rose-500" />
                <span>Logout / Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal for Alumni and Students */}
      <EditProfileModal
        isOpen={showEditProfile}
        onClose={() => setShowEditProfile(false)}
      />
    </header>
  );
}
