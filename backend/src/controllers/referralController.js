const Referral = require('../models/Referral');
const Mentorship = require('../models/Mentorship');
const User = require('../models/User');
const { createNotification, notifyAdmins } = require('../utils/notificationHelper');

async function getReferrals(req, res) {
  try {
    let list = [];
    if (req.user.role === 'alumni') {
      list = await Referral.find({ alumniId: req.user.id })
        .populate('alumniId', 'name email company designation avatar')
        .populate('studentId', 'name email phone rollNumber department batch avatar')
        .populate('applications.studentId', 'name email phone rollNumber department batch avatar')
        .sort({ createdAt: -1 });
    } else if (req.user.role === 'student') {
      // Backend security: Students only see referrals from alumni they are connected with (Mentorship status active/completed)
      const connectedMentorships = await Mentorship.find({
        studentId: req.user.id,
        status: { $in: ['active', 'completed'] }
      });
      const connectedAlumniIds = connectedMentorships.map(m => m.alumniId);

      const rawList = await Referral.find({
        $or: [
          { alumniId: { $in: connectedAlumniIds } },
          { studentId: req.user.id },
          { 'applications.studentId': req.user.id }
        ]
      })
        .populate('alumniId', 'name email company designation avatar')
        .populate('studentId', 'name email phone rollNumber department batch avatar')
        .populate('applications.studentId', 'name email phone rollNumber department batch avatar')
        .sort({ createdAt: -1 });

      list = rawList.map(item => {
        const doc = item.toJSON();
        const myApp = (item.applications || []).find(
          a => a.studentId && a.studentId.toString() === req.user.id.toString()
        );
        if (myApp) {
          doc.status = myApp.status;
        }
        return doc;
      });
    } else {
      // Admin sees all referrals in pipeline view
      list = await Referral.find()
        .populate('alumniId', 'name email company designation avatar')
        .populate('studentId', 'name email phone rollNumber department batch avatar')
        .populate('applications.studentId', 'name email phone rollNumber department batch avatar')
        .sort({ createdAt: -1 });
    }

    res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    console.error('Fetch referrals error:', err);
    res.status(500).json({ error: 'Failed to fetch referrals' });
  }
}

async function createReferral(req, res) {
  if (req.user.role !== 'alumni' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only alumni or admin can submit job referrals.' });
  }

  try {
    const { company, role, jobTitle, applicationLink, notes, studentId } = req.body;
    const titleToUse = (jobTitle || role || '').trim();

    if (!company || !company.trim()) {
      return res.status(400).json({ error: 'Hiring Company / Organization is required.' });
    }
    if (!titleToUse) {
      return res.status(400).json({ error: 'Job Title / Position is required.' });
    }
    if (!applicationLink || !applicationLink.trim()) {
      return res.status(400).json({ error: 'Link to Apply for Job (URL) is required.' });
    }

    const referralData = {
      alumniId: req.user.id,
      company: company.trim(),
      jobTitle: titleToUse,
      applicationLink: applicationLink.trim(),
      notes: notes || '',
      status: 'Pending'
    };

    if (studentId) {
      referralData.studentId = studentId;
    }

    const referral = await Referral.create(referralData);

    // Find all students connected with this Alumni
    const connectedMentorships = await Mentorship.find({
      alumniId: req.user.id,
      status: { $in: ['active', 'completed'] }
    });

    // Notify student directly if studentId is provided
    if (studentId) {
      await createNotification({
        recipient: studentId,
        recipientRole: 'student',
        title: 'New Job Referral',
        message: `${req.user.name} referred you for ${titleToUse} at ${company.trim()}.`,
        type: 'referral',
        relatedId: referral._id,
        relatedType: 'Referral',
        metadata: { referralId: referral._id, company: company.trim(), jobTitle: titleToUse }
      });
    }

    // Also notify connected students
    for (const m of connectedMentorships) {
      if (studentId && m.studentId.toString() === studentId.toString()) continue;
      await createNotification({
        recipient: m.studentId,
        recipientRole: 'student',
        title: 'New Job Referral',
        message: `${req.user.name} referred you for ${titleToUse} at ${company.trim()}.`,
        type: 'referral',
        relatedId: referral._id,
        relatedType: 'Referral',
        metadata: { referralId: referral._id, company: company.trim(), jobTitle: titleToUse }
      });
    }

    // Administrative notification to Admin
    const targetStudentDoc = studentId ? await User.findById(studentId) : null;
    await notifyAdmins({
      title: 'New Job Referral',
      message: `${req.user.name} submitted a job referral for ${targetStudentDoc?.name || titleToUse} at ${company.trim()}.`,
      type: 'referral',
      relatedId: referral._id,
      relatedType: 'Referral',
      metadata: { referralId: referral._id, company: company.trim(), jobTitle: titleToUse }
    });

    const populated = await Referral.findById(referral._id)
      .populate('alumniId', 'name email company designation avatar')
      .populate('studentId', 'name email phone rollNumber department batch avatar');

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function updateReferralStatus(req, res) {
  if (req.user.role === 'alumni') {
    return res.status(403).json({
      error: 'Referral status is read-only for alumni; only the referred student updates pipeline status.'
    });
  }

  try {
    const referral = await Referral.findById(req.params.id);
    if (!referral) return res.status(404).json({ error: 'Referral not found' });

    // Verify student is connected to the referring alumni or assigned to referral
    if (req.user.role === 'student') {
      const isAssigned = referral.studentId && referral.studentId.toString() === req.user.id.toString();
      const isConnected = await Mentorship.findOne({
        studentId: req.user.id,
        alumniId: referral.alumniId,
        status: { $in: ['active', 'completed'] }
      });

      if (!isAssigned && !isConnected) {
        return res.status(403).json({ error: 'You are not eligible to update this referral.' });
      }
    }

    const { status } = req.body;
    const validStatuses = ['pending', 'shortlisted', 'selected', 'rejected'];
    if (!status || !validStatuses.includes(status.toLowerCase())) {
      return res.status(400).json({ error: 'Invalid status. Must be pending, shortlisted, selected, or rejected' });
    }

    const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

    // Update or push into student's applications
    if (!Array.isArray(referral.applications)) {
      referral.applications = [];
    }
    const appEntry = referral.applications.find(
      a => a.studentId && a.studentId.toString() === req.user.id.toString()
    );
    if (appEntry) {
      appEntry.status = formattedStatus;
      appEntry.updatedAt = new Date();
    } else {
      referral.applications.push({
        studentId: req.user.id,
        status: formattedStatus,
        updatedAt: new Date()
      });
    }

    referral.status = formattedStatus;
    await referral.save();

    // Notify Alumni when student updates status
    await createNotification({
      recipient: referral.alumniId,
      recipientRole: 'alumni',
      title: 'Referral Status Updated',
      message: `${req.user.name} updated the referral status for ${referral.jobTitle} at ${referral.company} to ${formattedStatus}.`,
      type: 'referral_status',
      relatedId: referral._id,
      relatedType: 'Referral',
      metadata: { referralId: referral._id, status: formattedStatus }
    });

    // Notify Admins
    await notifyAdmins({
      title: 'Referral Status Updated',
      message: `${req.user.name} updated referral status for ${referral.company} to ${formattedStatus}.`,
      type: 'referral_status',
      relatedId: referral._id,
      relatedType: 'Referral',
      metadata: { referralId: referral._id, status: formattedStatus, studentName: req.user.name }
    });

    const populated = await Referral.findById(referral._id)
      .populate('alumniId', 'name email company designation avatar')
      .populate('studentId', 'name email phone rollNumber department batch avatar');

    const result = populated.toJSON();
    result.status = formattedStatus;

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = {
  getReferrals,
  createReferral,
  updateReferralStatus
};
