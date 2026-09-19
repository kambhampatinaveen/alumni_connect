import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import notificationApi from '../api/notificationApi';
import { 
  CheckCircle2, 
  Briefcase, 
  Calendar, 
  MessageSquare, 
  Users, 
  Award, 
  UserCheck, 
  Sparkles 
} from 'lucide-react';

const NotificationContext = createContext(null);

function formatTimeAgo(dateInput) {
  if (!dateInput) return 'Just now';
  const now = new Date();
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return 'Just now';

  const diffInSeconds = Math.floor((now - date) / 1000);
  if (diffInSeconds < 45) return 'Just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function getNotificationMeta(n) {
  const type = (n.type || '').toLowerCase();
  const title = (n.title || '').toLowerCase();

  if (type.includes('mentorship') || title.includes('mentorship')) {
    if (title.includes('accepted')) {
      return { icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600 border-emerald-200' };
    }
    if (title.includes('declined')) {
      return { icon: Users, color: 'bg-rose-50 text-rose-600 border-rose-200' };
    }
    return { icon: Users, color: 'bg-blue-50 text-blue-600 border-blue-200' };
  }

  if (type.includes('session') || title.includes('session')) {
    return { icon: Sparkles, color: 'bg-purple-50 text-purple-600 border-purple-200' };
  }

  if (type.includes('referral') || title.includes('referral')) {
    return { icon: Briefcase, color: 'bg-amber-50 text-amber-600 border-amber-200' };
  }

  if (type.includes('event') || title.includes('event')) {
    return { icon: Calendar, color: 'bg-indigo-50 text-indigo-600 border-indigo-200' };
  }

  if (type.includes('user_registration') || title.includes('registration')) {
    return { icon: UserCheck, color: 'bg-cyan-50 text-cyan-600 border-cyan-200' };
  }

  return { icon: CheckCircle2, color: 'bg-indigo-50 text-indigo-600 border-indigo-200' };
}

export function NotificationProvider({ children }) {
  let user = null;
  let role = null;
  try {
    const auth = useAuth();
    user = auth?.user;
    role = auth?.role;
  } catch (e) {}

  // Shared requests state between Student & Alumni
  const [requests, setRequests] = useState([]);

  // Shared Notifications state across roles
  const [notifications, setNotifications] = useState({
    student: [],
    alumni: [],
    admin: []
  });

  // Shared Chat Conversations state separated by role (Alumni vs Student)
  const [chatConversations, setChatConversations] = useState({
    alumni: [],
    student: []
  });
  const [activeChatId, setActiveChatId] = useState(null);

  // Fetch live notifications from backend MongoDB store
  const fetchLiveNotifications = async () => {
    try {
      const res = await notificationApi.getNotifications();
      const list = res.data?.data || [];
      if (Array.isArray(list)) {
        const mapped = list.map(n => {
          const { icon, color } = getNotificationMeta(n);
          return {
            id: n.id || n._id,
            _id: n._id || n.id,
            title: n.title,
            desc: n.message,
            fullMessage: n.message,
            message: n.message,
            type: n.type,
            relatedId: n.relatedId || n.metadata?.mentorshipId || n.metadata?.referralId || n.metadata?.eventId,
            relatedType: n.relatedType,
            metadata: n.metadata || {},
            sender: n.metadata?.studentName || n.metadata?.alumniName || n.metadata?.participantName || (n.recipientRole === 'admin' ? 'Administration' : 'AlumniConnect System'),
            senderRole: n.metadata?.domain ? `${n.metadata.domain} Mentorship` : (n.recipientRole === 'admin' ? 'Platform Alert' : 'AlumniConnect System'),
            avatar: n.metadata?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            time: formatTimeAgo(n.createdAt || n.date),
            rawDate: n.createdAt || n.date,
            unread: n.unread !== false && !n.isRead,
            actionText: n.type === 'mentorship_request' ? 'Review Mentorship Request' : 'View Details',
            icon,
            color
          };
        });

        const activeUserRole = (role || user?.role || 'admin').toLowerCase();
        setNotifications(prev => ({
          ...prev,
          admin: mapped,
          alumni: mapped,
          student: mapped,
          [activeUserRole]: mapped
        }));
      }
    } catch (err) {
      // ignore when not authenticated
    }
  };

  useEffect(() => {
    fetchLiveNotifications();
    const interval = setInterval(fetchLiveNotifications, 4000);

    const handleRefresh = () => fetchLiveNotifications();
    window.addEventListener('refresh-notifications', handleRefresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener('refresh-notifications', handleRefresh);
    };
  }, [user?._id, user?.id, role]);

  // 1. Dispatch Request from Student -> Alumni Dashboard & Notifications
  const sendMentorshipRequest = ({ studentName = 'Alex Rivera', alumniName = 'PAVANI KADARI', topic = '1-on-1 Guidance & Placement Review', note = '' }) => {
    const newReqId = `REQ-${Date.now()}`;

    // Add to requests list so Alumni Dashboard displays it
    const newReq = {
      id: newReqId,
      studentName,
      studentDept: 'Computer Science',
      studentBatch: '2025',
      alumniName,
      topic,
      note: note || `Hi ${alumniName}, I am a student seeking career guidance and placement advice.`,
      date: 'Just now',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
      status: 'pending'
    };

    setRequests(prev => [newReq, ...prev]);

    // Add to Alumni Notifications
    const newAlumniNotif = {
      id: `NOTIF-A-${Date.now()}`,
      reqId: newReqId,
      title: 'New Mentorship Request Received 📩',
      desc: `${studentName} sent a 1-on-1 mentorship request to ${alumniName}.`,
      fullMessage: `Student ${studentName} (Computer Science, Class of 2025) sent a mentorship request to ${alumniName}. Note: "${note || 'Seeking career guidance and placement advice.'}"`,
      sender: studentName,
      senderRole: 'Computer Science Student (Class of 2025)',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
      time: 'Just now',
      unread: true,
      status: 'pending',
      actionText: 'Review Mentorship Request',
      icon: Users,
      color: 'bg-blue-50 text-blue-600 border-blue-200'
    };

    setNotifications(prev => ({
      ...prev,
      alumni: [newAlumniNotif, ...(prev.alumni || [])]
    }));

    // Synchronize initial conversation entries for both Student and Alumni
    setChatConversations(prev => {
      const alumniList = prev.alumni || [];
      const studentList = prev.student || [];

      const alumniTargetConvId = `CONV-A-${Date.now()}`;
      const studentTargetConvId = `CONV-S-${Date.now()}`;
      const currentTime = 'Just now';

      const studentConvExists = studentList.find(c => c.name.toLowerCase() === alumniName.toLowerCase());
      const updatedStudentList = studentConvExists ? studentList : [
        {
          id: studentTargetConvId,
          name: alumniName,
          role: 'Alumni',
          email: `${alumniName.toLowerCase().replace(/\s+/g, '.')}@alumniconnect.edu`,
          designation: `${alumniName} • Alumni Mentor`,
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
          initials: alumniName.charAt(0).toUpperCase(),
          online: true,
          lastSeen: 'Active now',
          messages: [
            {
              id: Date.now(),
              sender: 'me',
              text: note || `Hi ${alumniName}! I sent a mentorship request.`,
              time: currentTime
            }
          ]
        },
        ...studentList
      ];

      const alumniConvExists = alumniList.find(c => c.name.toLowerCase() === studentName.toLowerCase());
      const updatedAlumniList = alumniConvExists ? alumniList : [
        {
          id: alumniTargetConvId,
          name: studentName,
          role: 'Student',
          email: `${studentName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
          designation: `Student • ${studentName}`,
          avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
          initials: studentName.charAt(0).toUpperCase(),
          online: true,
          lastSeen: 'Active now',
          messages: [
            {
              id: Date.now(),
              sender: 'them',
              text: note || `Hi! Sent a mentorship request.`,
              time: currentTime
            }
          ]
        },
        ...alumniList
      ];

      return {
        alumni: updatedAlumniList,
        student: updatedStudentList
      };
    });
  };

  // 2. Send Chat Message with automatic 2-way cross-sync between Student and Alumni
  const sendChatMessage = ({ text, senderRole = 'student', currentConv, currentUserName = 'g.uma' }) => {
    if (!text || !text.trim() || !currentConv) return;

    const formattedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const msgId = Date.now();

    setChatConversations(prev => {
      const alumniList = Array.isArray(prev.alumni) ? [...prev.alumni] : [];
      const studentList = Array.isArray(prev.student) ? [...prev.student] : [];

      if (senderRole === 'student') {
        // Current sender is STUDENT (e.g. g.uma) sending to ALUMNI (currentConv.name)
        const targetAlumniName = currentConv.name;

        // A. Append message as 'me' in Student's conversation list
        const updatedStudentList = studentList.map(c => {
          if (c.id === currentConv.id || c.name.toLowerCase() === targetAlumniName.toLowerCase()) {
            return {
              ...c,
              messages: [...(c.messages || []), { id: msgId, sender: 'me', text: text.trim(), time: formattedTime }]
            };
          }
          return c;
        });

        // B. Append message as 'them' in Alumni's conversation list for this student
        let alumniFound = false;
        let updatedAlumniList = alumniList.map(c => {
          if (
            c.name.toLowerCase() === currentUserName.toLowerCase() ||
            c.name.toLowerCase().includes(currentUserName.toLowerCase()) ||
            currentUserName.toLowerCase().includes(c.name.toLowerCase())
          ) {
            alumniFound = true;
            return {
              ...c,
              messages: [...(c.messages || []), { id: msgId + 1, sender: 'them', text: text.trim(), time: formattedTime }]
            };
          }
          return c;
        });

        if (!alumniFound) {
          // Create student conversation entry inside alumni list
          updatedAlumniList = [
            {
              id: `CONV-A-${Date.now()}`,
              name: currentUserName,
              role: 'Student',
              email: `${currentUserName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
              designation: `Student • ${currentUserName}`,
              avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
              initials: currentUserName.charAt(0).toUpperCase(),
              online: true,
              lastSeen: 'Active now',
              messages: [{ id: msgId + 1, sender: 'them', text: text.trim(), time: formattedTime }]
            },
            ...alumniList
          ];
        }

        return {
          alumni: updatedAlumniList,
          student: updatedStudentList
        };

      } else {
        // Current sender is ALUMNI (e.g. JOTHSNA PANDRAKI) sending to STUDENT (currentConv.name)
        const targetStudentName = currentConv.name;

        // A. Append message as 'me' in Alumni's conversation list
        const updatedAlumniList = alumniList.map(c => {
          if (c.id === currentConv.id || c.name.toLowerCase() === targetStudentName.toLowerCase()) {
            return {
              ...c,
              messages: [...(c.messages || []), { id: msgId, sender: 'me', text: text.trim(), time: formattedTime }]
            };
          }
          return c;
        });

        // B. Append message as 'them' in Student's conversation list for this alumni
        let studentFound = false;
        let updatedStudentList = studentList.map(c => {
          if (
            c.name.toLowerCase() === currentUserName.toLowerCase() ||
            c.name.toLowerCase().includes(currentUserName.toLowerCase()) ||
            currentUserName.toLowerCase().includes(c.name.toLowerCase())
          ) {
            studentFound = true;
            return {
              ...c,
              messages: [...(c.messages || []), { id: msgId + 1, sender: 'them', text: text.trim(), time: formattedTime }]
            };
          }
          return c;
        });

        if (!studentFound) {
          // Create alumni conversation entry inside student list
          updatedStudentList = [
            {
              id: `CONV-S-${Date.now()}`,
              name: currentUserName,
              role: 'Alumni',
              email: `${currentUserName.toLowerCase().replace(/\s+/g, '.')}@alumniconnect.edu`,
              designation: `${currentUserName} • Alumni Mentor`,
              avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
              initials: currentUserName.charAt(0).toUpperCase(),
              online: true,
              lastSeen: 'Active now',
              messages: [{ id: msgId + 1, sender: 'them', text: text.trim(), time: formattedTime }]
            },
            ...studentList
          ];
        }

        return {
          alumni: updatedAlumniList,
          student: updatedStudentList
        };
      }
    });
  };

  // 2. Accept Request from Alumni -> Triggers Notification back to Student & Adds to Chat
  const acceptMentorshipRequest = (requestId, alumniName = 'Alumni Mentor') => {
    let targetStudent = 'Alex Rivera';
    let targetAlumni = alumniName;
    let targetAvatar = 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150';

    setRequests(prev => prev.map(r => {
      if (r.id === requestId || r.studentName === requestId) {
        targetStudent = r.studentName || 'Alex Rivera';
        if (r.alumniName) targetAlumni = r.alumniName;
        if (r.avatar) targetAvatar = r.avatar;
        return { ...r, status: 'accepted' };
      }
      return r;
    }));

    // Sync status in alumni notifications list
    setNotifications(prev => ({
      ...prev,
      alumni: (prev.alumni || []).map(n => {
        if (n.reqId === requestId || n.sender === targetStudent || n.id === requestId) {
          return { ...n, status: 'accepted', title: 'Mentorship Request Accepted ✓' };
        }
        return n;
      })
    }));

    // Add to Chat Conversations for both Alumni and Student
    setChatConversations(prev => {
      const alumniList = prev.alumni || [];
      const studentList = prev.student || [];

      const alumniConvExists = alumniList.find(c => c.name.toLowerCase() === targetStudent.toLowerCase());
      const newAlumniConvId = alumniConvExists ? alumniConvExists.id : `CONV-A-${Date.now()}`;
      const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const updatedAlumniList = alumniConvExists 
        ? alumniList 
        : [
            {
              id: newAlumniConvId,
              name: targetStudent,
              role: 'Student',
              email: `${targetStudent.toLowerCase().replace(/\s+/g, '.')}@example.com`,
              designation: `Student • ${targetStudent.toLowerCase().replace(/\s+/g, '.')}@example.com`,
              avatar: targetAvatar,
              initials: targetStudent.charAt(0).toUpperCase(),
              online: true,
              lastSeen: 'Active now',
              messages: [
                {
                  id: Date.now(),
                  sender: 'them',
                  text: `Hi! Thank you for accepting my mentorship request. Excited to learn from you!`,
                  time: currentTime
                },
                {
                  id: Date.now() + 1,
                  sender: 'me',
                  text: `Welcome ${targetStudent}! Happy to help with career guidance and placement advice.`,
                  time: currentTime
                }
              ]
            },
            ...alumniList
          ];

      const studentConvExists = studentList.find(c => c.name.toLowerCase() === targetAlumni.toLowerCase());
      const newStudentConvId = studentConvExists ? studentConvExists.id : `CONV-S-${Date.now()}`;
      const updatedStudentList = studentConvExists 
        ? studentList 
        : [
            {
              id: newStudentConvId,
              name: targetAlumni,
              role: 'Alumni',
              email: `${targetAlumni.toLowerCase().replace(/\s+/g, '.')}@alumniconnect.edu`,
              designation: `${targetAlumni} • Alumni Mentor`,
              avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
              initials: targetAlumni.charAt(0).toUpperCase(),
              online: true,
              lastSeen: 'Active now',
              messages: [
                {
                  id: Date.now(),
                  sender: 'me',
                  text: `Hi! Thank you for accepting my mentorship request. Excited to learn from you!`,
                  time: currentTime
                },
                {
                  id: Date.now() + 1,
                  sender: 'them',
                  text: `Welcome ${targetStudent}! Happy to help with career guidance and placement advice.`,
                  time: currentTime
                }
              ]
            },
            ...studentList
          ];

      setActiveChatId(newAlumniConvId);

      return {
        alumni: updatedAlumniList,
        student: updatedStudentList
      };
    });

    // Add Notification to Student
    const newStudentNotif = {
      id: `NOTIF-S-${Date.now()}`,
      reqId: requestId,
      title: 'Mentorship Request Accepted! 🎉',
      desc: `${targetAlumni} accepted your 1-on-1 mentorship request.`,
      fullMessage: `Great news ${targetStudent}! ${targetAlumni} has officially accepted your mentorship request. You can now schedule 1-on-1 sessions, join video calls, and communicate directly in the Chat platform!`,
      sender: targetAlumni,
      senderRole: 'Verified Alumni Mentor',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      time: 'Just now',
      unread: true,
      status: 'accepted',
      actionText: 'Open Direct Chat',
      icon: CheckCircle2,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200'
    };

    setNotifications(prev => ({
      ...prev,
      student: [newStudentNotif, ...(prev.student || [])]
    }));
  };

  // 3. Decline Request
  const declineMentorshipRequest = (requestId) => {
    setRequests(prev => prev.map(r => (r.id === requestId || r.studentName === requestId) ? { ...r, status: 'rejected' } : r));
    setNotifications(prev => ({
      ...prev,
      alumni: (prev.alumni || []).map(n => {
        if (n.reqId === requestId || n.sender === requestId || n.id === requestId) {
          return { ...n, status: 'rejected' };
        }
        return n;
      })
    }));
  };

  // 4. Mark notification read (optimistic + MongoDB update)
  const markNotificationRead = async (roleKey, id) => {
    setNotifications(prev => {
      const updateList = (list = []) => list.map(n => n.id === id || n._id === id ? { ...n, unread: false, isRead: true } : n);
      return {
        ...prev,
        admin: updateList(prev.admin),
        alumni: updateList(prev.alumni),
        student: updateList(prev.student)
      };
    });

    try {
      if (id) {
        await notificationApi.markNotificationAsRead(id);
      }
    } catch (err) {
      console.warn('[NotificationContext] Failed to mark notification read:', err.message);
    }
  };

  // 5. Mark all read (optimistic + MongoDB update)
  const markAllNotificationsRead = async (roleKey) => {
    setNotifications(prev => {
      const updateList = (list = []) => list.map(n => ({ ...n, unread: false, isRead: true }));
      return {
        ...prev,
        admin: updateList(prev.admin),
        alumni: updateList(prev.alumni),
        student: updateList(prev.student)
      };
    });

    try {
      await notificationApi.markAllNotificationsAsRead();
    } catch (err) {
      console.warn('[NotificationContext] Failed to mark all notifications read:', err.message);
    }
  };

  return (
    <NotificationContext.Provider value={{
      requests,
      notifications,
      chatConversations,
      setChatConversations,
      activeChatId,
      setActiveChatId,
      sendMentorshipRequest,
      sendChatMessage,
      acceptMentorshipRequest,
      declineMentorshipRequest,
      markNotificationRead,
      markAllNotificationsRead,
      refreshNotifications: fetchLiveNotifications,
      fetchLiveNotifications,
      setNotifications,
      setRequests
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
}

export default NotificationContext;
