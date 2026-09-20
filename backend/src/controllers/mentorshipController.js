const Mentorship = require('../models/Mentorship');
const Alumni = require('../models/Alumni');
const Student = require('../models/Student');
const User = require('../models/User');
const { resolveMentorshipParticipants } = require('../utils/mentorshipHelper');
const { createNotification, notifyAdmins } = require('../utils/notificationHelper');

async function getMentorships(req, res) {
  try {
    let query = {};
    if (req.user.role === 'alumni') {
      const alumniDoc = await Alumni.findOne({ userId: req.user.id });
      const ids = [req.user.id];
      if (alumniDoc) ids.push(alumniDoc._id);
      query.alumniId = { $in: ids };
    } else if (req.user.role === 'student') {
      const studentDoc = await Student.findOne({ userId: req.user.id });
      const ids = [req.user.id];
      if (studentDoc) ids.push(studentDoc._id);
      query.studentId = { $in: ids };
    }
    // Admin view monitors all mentorship relationships

    const rawList = await Mentorship.find(query).sort({ updatedAt: -1 });
    const list = await Promise.all(rawList.map(m => resolveMentorshipParticipants(m)));

    res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch mentorships' });
  }
}

async function getMentorshipById(req, res) {
  try {
    const item = await Mentorship.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Mentorship not found' });
    const resolved = await resolveMentorshipParticipants(item);
    res.json({ success: true, data: resolved });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch mentorship' });
  }
}

async function requestMentorship(req, res) {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Only students can request mentorships.' });
  }

  try {
    const { alumniId, domain, goal } = req.body;
    if (!alumniId) return res.status(400).json({ error: 'Alumni ID is required.' });

    // Resolve Alumni User ID (whether alumniId is Alumni._id or User._id)
    let targetAlumniUserId = null;
    let targetAlumniDoc = null;
    let targetUserDoc = null;

    try {
      targetAlumniDoc = await Alumni.findById(alumniId);
    } catch (e) {}

    if (targetAlumniDoc && targetAlumniDoc.userId) {
      targetAlumniUserId = targetAlumniDoc.userId;
      targetUserDoc = await User.findById(targetAlumniDoc.userId);
    } else {
      try {
        targetUserDoc = await User.findById(alumniId);
        if (targetUserDoc && targetUserDoc.role === 'alumni') {
          targetAlumniUserId = targetUserDoc._id;
          targetAlumniDoc = await Alumni.findOne({ userId: targetUserDoc._id });
        }
      } catch (e) {}
    }

    if (!targetAlumniUserId) {
      return res.status(404).json({ error: 'Selected alumni mentor not found.' });
    }

    const resolvedDomain =
      domain ||
      targetAlumniDoc?.department ||
      targetAlumniDoc?.branch ||
      targetUserDoc?.department ||
      'AID';

    const mentorship = await Mentorship.create({
      studentId: req.user.id,
      alumniId: targetAlumniUserId,
      domain: resolvedDomain,
      goal: goal || '',
      status: 'requested',
      sessions: []
    });

    // Notify Alumni of mentorship request with real Student name
    await createNotification({
      recipient: targetAlumniUserId,
      recipientRole: 'alumni',
      title: 'New Mentorship Request',
      message: `${req.user.name} sent you a mentorship request.`,
      type: 'mentorship_request',
      relatedId: mentorship._id,
      relatedType: 'Mentorship',
      metadata: {
        mentorshipId: mentorship._id,
        studentName: req.user.name,
        studentId: req.user.id,
        domain: resolvedDomain
      }
    });

    // Administrative notification to Admin
    await notifyAdmins({
      title: 'New Mentorship Request',
      message: `${req.user.name} requested mentorship with ${targetAlumniDoc?.name || targetUserDoc?.name || 'Alumni'}.`,
      type: 'mentorship_request',
      relatedId: mentorship._id,
      relatedType: 'Mentorship',
      metadata: {
        mentorshipId: mentorship._id,
        studentName: req.user.name,
        alumniName: targetAlumniDoc?.name || targetUserDoc?.name || 'Alumni'
      }
    });

    const populated = await resolveMentorshipParticipants(mentorship);
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function updateMentorship(req, res) {
  try {
    const mentorship = await Mentorship.findById(req.params.id);
    if (!mentorship) return res.status(404).json({ error: 'Mentorship not found' });

    const { status, feedback } = req.body;
    if (status) mentorship.status = status;
    if (feedback !== undefined) mentorship.feedback = feedback;

    await mentorship.save();

    // Notifications on mentorship accept / decline / status change
    if (status) {
      const statusLower = status.toLowerCase();
      const isAccepted = ['accepted', 'active'].includes(statusLower);
      const isDeclined = ['rejected', 'declined'].includes(statusLower);

      // Resolve real names
      const alumniDoc = await Alumni.findOne({ userId: mentorship.alumniId }) || await User.findById(mentorship.alumniId);
      const alumniName = alumniDoc?.name || req.user.name || 'Alumni Mentor';

      const studentDoc = await Student.findOne({ userId: mentorship.studentId }) || await User.findById(mentorship.studentId);
      const studentName = studentDoc?.name || 'Student';

      if (isAccepted) {
        // Notify Student
        await createNotification({
          recipient: mentorship.studentId,
          recipientRole: 'student',
          title: 'Mentorship Request Accepted',
          message: `${alumniName} accepted your mentorship request.`,
          type: 'mentorship_accept',
          relatedId: mentorship._id,
          relatedType: 'Mentorship',
          metadata: { mentorshipId: mentorship._id, alumniName }
        });

        // Notify Admins
        await notifyAdmins({
          title: 'Mentorship Request Accepted',
          message: `${alumniName} accepted mentorship request from ${studentName}.`,
          type: 'mentorship_accept',
          relatedId: mentorship._id,
          relatedType: 'Mentorship',
          metadata: { mentorshipId: mentorship._id, alumniName, studentName }
        });
      } else if (isDeclined) {
        // Notify Student
        await createNotification({
          recipient: mentorship.studentId,
          recipientRole: 'student',
          title: 'Mentorship Request Declined',
          message: `${alumniName} declined your mentorship request.`,
          type: 'mentorship_decline',
          relatedId: mentorship._id,
          relatedType: 'Mentorship',
          metadata: { mentorshipId: mentorship._id, alumniName }
        });
      } else {
        await createNotification({
          recipient: mentorship.studentId,
          recipientRole: 'student',
          title: 'Mentorship Status Updated',
          message: `Your mentorship request status was updated to: ${status.toUpperCase()}`,
          type: 'mentorship',
          relatedId: mentorship._id,
          relatedType: 'Mentorship',
          metadata: { mentorshipId: mentorship._id, status }
        });
      }
    }

    const populated = await resolveMentorshipParticipants(mentorship);
    res.json({ success: true, data: populated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function addSession(req, res) {
  try {
    const mentorship = await Mentorship.findById(req.params.id);
    if (!mentorship) return res.status(404).json({ error: 'Mentorship relationship not found' });

    if (req.user.role !== 'alumni' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only mentors can log sessions' });
    }

    const { topic, date, time, meetingLink, notes } = req.body;
    if (!topic || !date) {
      return res.status(400).json({ error: 'Topic and session date are required.' });
    }

    // Date validation: no past dates
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const sessionDate = new Date(date);

    if (isNaN(sessionDate.getTime()) || sessionDate < todayStart) {
      return res.status(400).json({ error: 'Session date cannot be in the past. Please select today or a future date.' });
    }

    const sessionObj = {
      topic: topic.trim(),
      date: sessionDate,
      time: time || '10:00 AM',
      meetingLink: meetingLink || '',
      notes: notes || '',
      status: 'scheduled'
    };

    mentorship.sessions.push(sessionObj);
    await mentorship.save();

    // Create Notification for Student Mentee
    const menteeId = mentorship.studentId._id || mentorship.studentId;
    const formattedDate = sessionDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    await createNotification({
      recipient: menteeId,
      recipientRole: 'student',
      title: 'New Mentorship Session',
      message: `${req.user.name} scheduled a mentorship session for ${formattedDate}.`,
      type: 'session',
      relatedId: mentorship._id,
      relatedType: 'Mentorship',
      metadata: { mentorshipId: mentorship._id, topic: topic.trim(), date: sessionDate }
    });

    const populated = await resolveMentorshipParticipants(mentorship);
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    console.error('Log session error:', err.message);
    res.status(400).json({ error: err.message });
  }
}

module.exports = {
  getMentorships,
  getMentorshipById,
  requestMentorship,
  updateMentorship,
  addSession
};
