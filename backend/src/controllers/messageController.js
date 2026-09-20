const Message = require('../models/Message');
const Mentorship = require('../models/Mentorship');
const Alumni = require('../models/Alumni');
const Student = require('../models/Student');
const {
  resolveMentorshipParticipants,
  getMentorshipParticipantUserIds
} = require('../utils/mentorshipHelper');
const { createNotification } = require('../utils/notificationHelper');

async function getConversations(req, res) {
  try {
    if (req.user.role === 'admin') {
      return res.json({ success: true, count: 0, data: [] });
    }

    let query = {};
    if (req.user.role === 'alumni') {
      const alumniDoc = await Alumni.findOne({ userId: req.user.id });
      const ids = [req.user.id];
      if (alumniDoc) ids.push(alumniDoc._id);
      query = {
        alumniId: { $in: ids },
        status: { $in: ['active', 'accepted', 'Active', 'Accepted'] }
      };
    } else if (req.user.role === 'student') {
      const studentDoc = await Student.findOne({ userId: req.user.id });
      const ids = [req.user.id];
      if (studentDoc) ids.push(studentDoc._id);
      query = {
        studentId: { $in: ids },
        status: { $in: ['active', 'accepted', 'Active', 'Accepted'] }
      };
    } else {
      return res.json({ success: true, count: 0, data: [] });
    }

    const rawMentorships = await Mentorship.find(query).sort({ updatedAt: -1 });
    const conversations = await Promise.all(
      rawMentorships.map(async (m) => {
        const resolved = await resolveMentorshipParticipants(m);
        const isStudent = req.user.role === 'student';
        const partner = isStudent
          ? {
              id: resolved.alumniId?._id || resolved.alumniId?.id || m.alumniId,
              name: resolved.alumniId?.name || 'Alumni Mentor',
              email: resolved.alumniId?.email || '',
              role: resolved.alumniId?.role || resolved.alumniId?.designation || 'Alumni Mentor',
              avatar: resolved.alumniId?.avatar || '',
              department: resolved.alumniId?.department || 'AID',
              company: resolved.alumniId?.company || '',
              batch: resolved.alumniId?.batch || ''
            }
          : {
              id: resolved.studentId?._id || resolved.studentId?.id || m.studentId,
              name: resolved.studentId?.name || 'Student Mentee',
              email: resolved.studentId?.email || '',
              role: 'Student Mentee',
              avatar: resolved.studentId?.avatar || '',
              department: resolved.studentId?.department || 'AID',
              company: '',
              batch: resolved.studentId?.batch || ''
            };

        const lastMessage = await Message.findOne({ mentorshipId: m._id }).sort({ createdAt: -1 });
        const unreadCount = await Message.countDocuments({
          mentorshipId: m._id,
          receiverId: req.user.id,
          read: false
        });

        return {
          id: m._id,
          mentorshipId: m._id,
          domain: m.domain || '',
          status: m.status,
          partner,
          lastMessage: lastMessage
            ? {
                _id: lastMessage._id,
                text: lastMessage.text,
                senderId: lastMessage.senderId,
                createdAt: lastMessage.createdAt,
                read: lastMessage.read
              }
            : null,
          unreadCount,
          updatedAt: lastMessage ? lastMessage.createdAt : (m.updatedAt || m.createdAt)
        };
      })
    );

    conversations.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    res.json({ success: true, count: conversations.length, data: conversations });
  } catch (err) {
    console.error('Fetch conversations error:', err);
    res.status(500).json({ error: 'Failed to fetch conversations.' });
  }
}

async function getUnreadCount(req, res) {
  try {
    const unreadCount = await Message.countDocuments({ receiverId: req.user.id, read: false });
    res.json({ success: true, count: unreadCount });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get unread count.' });
  }
}

async function getMessages(req, res) {
  try {
    const mentorship = await Mentorship.findById(req.params.mentorshipId);
    if (!mentorship) {
      return res.status(404).json({ error: 'Mentorship not found.' });
    }

    const statusLower = (mentorship.status || '').toLowerCase();
    if (!['active', 'accepted'].includes(statusLower)) {
      return res.status(403).json({ error: 'Chat is only accessible for accepted mentorships.' });
    }

    const resolved = await resolveMentorshipParticipants(mentorship);
    const { validAlumniIds, validStudentIds } = await getMentorshipParticipantUserIds(mentorship, resolved);
    const isParticipant = validAlumniIds.has(String(req.user.id)) || validStudentIds.has(String(req.user.id));
    if (!isParticipant) {
      return res.status(403).json({ error: 'Access denied. You are not a participant in this mentorship.' });
    }

    // Mark unread messages sent to current user as read
    await Message.updateMany(
      { mentorshipId: mentorship._id, receiverId: req.user.id, read: false },
      { $set: { read: true, readAt: new Date() } }
    );

    const messages = await Message.find({ mentorshipId: mentorship._id }).sort({ createdAt: 1 });
    res.json({ success: true, count: messages.length, data: messages });
  } catch (err) {
    console.error('Fetch messages error:', err);
    res.status(500).json({ error: 'Failed to fetch messages.' });
  }
}

async function sendMessage(req, res) {
  try {
    const { mentorshipId, text } = req.body;
    if (!mentorshipId) {
      return res.status(400).json({ error: 'mentorshipId is required.' });
    }
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Message text cannot be empty.' });
    }

    const mentorship = await Mentorship.findById(mentorshipId);
    if (!mentorship) {
      return res.status(404).json({ error: 'Mentorship not found.' });
    }

    const statusLower = (mentorship.status || '').toLowerCase();
    if (!['active', 'accepted'].includes(statusLower)) {
      return res.status(403).json({ error: 'Chat is only accessible for accepted mentorships.' });
    }

    const resolved = await resolveMentorshipParticipants(mentorship);
    const { alumniUserId, studentUserId, validAlumniIds, validStudentIds } = await getMentorshipParticipantUserIds(mentorship, resolved);
    const isAlumni = validAlumniIds.has(String(req.user.id));
    const isStudent = validStudentIds.has(String(req.user.id));
    if (!isAlumni && !isStudent) {
      return res.status(403).json({ error: 'Access denied. You are not a participant in this mentorship.' });
    }

    const senderId = req.user.id;
    const receiverId = isAlumni ? studentUserId : alumniUserId;
    const receiverRole = isAlumni ? 'student' : 'alumni';

    const message = await Message.create({
      mentorshipId: mentorship._id,
      senderId,
      receiverId,
      text: text.trim(),
      read: false
    });

    await Mentorship.updateOne({ _id: mentorship._id }, { updatedAt: new Date() });

    // Send notification to receiver
    try {
      const senderName = req.user.name || (isAlumni ? resolved.alumniId.name : resolved.studentId.name);
      await createNotification({
        recipient: receiverId,
        recipientRole: receiverRole,
        title: 'New Message',
        message: `${senderName}: ${text.trim().substring(0, 60)}${text.trim().length > 60 ? '...' : ''}`,
        type: 'chat_message',
        relatedId: mentorship._id,
        relatedType: 'Mentorship',
        metadata: {
          mentorshipId: mentorship._id,
          messageId: message._id,
          senderId,
          senderName
        }
      });
    } catch (notifErr) {
      console.warn('Failed to send chat notification:', notifErr.message);
    }

    res.status(201).json({ success: true, data: message });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ error: 'Failed to send message.' });
  }
}

async function markAsRead(req, res) {
  try {
    const mentorship = await Mentorship.findById(req.params.mentorshipId);
    if (!mentorship) {
      return res.status(404).json({ error: 'Mentorship not found.' });
    }

    const resolved = await resolveMentorshipParticipants(mentorship);
    const { validAlumniIds, validStudentIds } = await getMentorshipParticipantUserIds(mentorship, resolved);
    const isParticipant = validAlumniIds.has(String(req.user.id)) || validStudentIds.has(String(req.user.id));
    if (!isParticipant) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    await Message.updateMany(
      { mentorshipId: mentorship._id, receiverId: req.user.id, read: false },
      { $set: { read: true, readAt: new Date() } }
    );

    res.json({ success: true, message: 'Messages marked as read.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark messages as read.' });
  }
}

module.exports = {
  getConversations,
  getUnreadCount,
  getMessages,
  sendMessage,
  markAsRead
};
