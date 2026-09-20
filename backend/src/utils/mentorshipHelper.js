/**
 * Mentorship participant resolution and authorization helpers
 */

const User = require('../models/User');
const Alumni = require('../models/Alumni');
const Student = require('../models/Student');
const Mentorship = require('../models/Mentorship');

async function resolveMentorshipParticipants(m) {
  if (!m) return m;
  const obj = m.toObject ? m.toObject() : { ...m };

  // 1. Resolve Alumni
  const rawAlumId = obj.alumniId?._id || obj.alumniId?.id || obj.alumniId || (m._doc && (m._doc.alumniId?._id || m._doc.alumniId));
  let alDoc = null;
  let alUser = null;

  if (rawAlumId) {
    try {
      alDoc = await Alumni.findById(rawAlumId);
      if (!alDoc) {
        alDoc = await Alumni.findOne({ userId: rawAlumId });
      }

      if (alDoc && alDoc.userId) {
        alUser = await User.findById(alDoc.userId);
        // If DB had Alumni._id instead of User._id, normalize in DB
        if (String(rawAlumId) === String(alDoc._id) && m._id) {
          Mentorship.updateOne({ _id: m._id }, { alumniId: alDoc.userId }).catch(() => {});
        }
      } else {
        alUser = await User.findById(rawAlumId);
        if (alUser && !alDoc) {
          alDoc = await Alumni.findOne({ userId: alUser._id });
        }
      }
    } catch (e) {
      console.warn('Alumni lookup error in resolveMentorshipParticipants:', e.message);
    }
  }

  const alumniName =
    alDoc?.name?.trim() ||
    alUser?.name?.trim() ||
    obj.alumniId?.name?.trim() ||
    obj.alumni?.name?.trim() ||
    obj.alumniId?.user?.name?.trim() ||
    obj.alumni?.user?.name?.trim() ||
    obj.alumniId?.userId?.name?.trim() ||
    obj.alumni?.userId?.name?.trim() ||
    'Unknown Alumni';

  const alumniEmail = alDoc?.email || alUser?.email || obj.alumniId?.email || obj.alumni?.email || '';
  const alumniPhone = alDoc?.phone || alUser?.phone || obj.alumniId?.phone || '';
  const alumniDept =
    alDoc?.department ||
    alDoc?.branch ||
    alUser?.department ||
    obj.alumniId?.department ||
    'AID';
  const alumniCompany = alDoc?.company || alUser?.company || obj.alumniId?.company || '';
  const alumniRole =
    alDoc?.role ||
    alDoc?.designation ||
    alUser?.designation ||
    obj.alumniId?.role ||
    'Alumni Mentor';
  const alumniBatch = alDoc?.batch || alUser?.batch || obj.alumniId?.batch || '';
  const alumniAvatar = alDoc?.avatar || alUser?.avatar || obj.alumniId?.avatar || '';

  const safeAlumUser = alUser
    ? (alUser.toJSON ? alUser.toJSON() : alUser)
    : { _id: rawAlumId, id: rawAlumId, name: alumniName, email: alumniEmail, role: 'alumni' };

  obj.alumniId = {
    _id: alUser?._id || alDoc?.userId || rawAlumId,
    id: alUser?._id || alDoc?.userId || rawAlumId,
    name: alumniName,
    email: alumniEmail,
    phone: alumniPhone,
    department: alumniDept,
    branch: alDoc?.branch || alumniDept,
    company: alumniCompany,
    role: alumniRole,
    designation: alumniRole,
    batch: alumniBatch,
    avatar: alumniAvatar,
    user: safeAlumUser,
    userId: safeAlumUser
  };
  obj.alumni = obj.alumniId;
  obj.mentor = obj.alumniId;

  // 2. Resolve Student
  const rawStudId = obj.studentId?._id || obj.studentId?.id || obj.studentId || (m._doc && (m._doc.studentId?._id || m._doc.studentId));
  let stDoc = null;
  let stUser = null;

  if (rawStudId) {
    try {
      stDoc = await Student.findById(rawStudId);
      if (!stDoc) {
        stDoc = await Student.findOne({ userId: rawStudId });
      }

      if (stDoc && stDoc.userId) {
        stUser = await User.findById(stDoc.userId);
        if (String(rawStudId) === String(stDoc._id) && m._id) {
          Mentorship.updateOne({ _id: m._id }, { studentId: stDoc.userId }).catch(() => {});
        }
      } else {
        stUser = await User.findById(rawStudId);
        if (stUser && !stDoc) {
          stDoc = await Student.findOne({ userId: stUser._id });
        }
      }
    } catch (e) {
      console.warn('Student lookup error in resolveMentorshipParticipants:', e.message);
    }
  }

  const studentName =
    stDoc?.name?.trim() ||
    stUser?.name?.trim() ||
    obj.studentId?.name?.trim() ||
    obj.student?.name?.trim() ||
    obj.studentId?.user?.name?.trim() ||
    obj.student?.user?.name?.trim() ||
    obj.studentId?.userId?.name?.trim() ||
    obj.student?.userId?.name?.trim() ||
    'Unknown Student';

  const studentEmail = stDoc?.email || stUser?.email || obj.studentId?.email || obj.student?.email || '';
  const studentPhone = stDoc?.phone || stUser?.phone || obj.studentId?.phone || '';
  const studentDept =
    stDoc?.department ||
    stUser?.department ||
    obj.studentId?.department ||
    'AID';
  const studentBatch = stDoc?.batch || stUser?.batch || obj.studentId?.batch || '';
  const studentRoll = stDoc?.rollNumber || stUser?.rollNumber || obj.studentId?.rollNumber || '';
  const studentAvatar = stDoc?.avatar || stUser?.avatar || obj.studentId?.avatar || '';

  const safeStudUser = stUser
    ? (stUser.toJSON ? stUser.toJSON() : stUser)
    : { _id: rawStudId, id: rawStudId, name: studentName, email: studentEmail, role: 'student' };

  obj.studentId = {
    _id: stUser?._id || stDoc?.userId || rawStudId,
    id: stUser?._id || stDoc?.userId || rawStudId,
    name: studentName,
    email: studentEmail,
    phone: studentPhone,
    department: studentDept,
    batch: studentBatch,
    rollNumber: studentRoll,
    avatar: studentAvatar,
    user: safeStudUser,
    userId: safeStudUser
  };
  obj.student = obj.studentId;
  obj.mentee = obj.studentId;

  return obj;
}

async function getMentorshipParticipantUserIds(mentorship, resolved) {
  let alumniUserId = String(resolved?.alumniId?._id || resolved?.alumniId?.id || '');
  let studentUserId = String(resolved?.studentId?._id || resolved?.studentId?.id || '');

  const rawAlumniId = mentorship.alumniId?._id || mentorship.alumniId;
  const rawStudentId = mentorship.studentId?._id || mentorship.studentId;

  const validAlumniIds = new Set([String(alumniUserId), String(rawAlumniId)].filter(Boolean));
  const validStudentIds = new Set([String(studentUserId), String(rawStudentId)].filter(Boolean));

  try {
    const alDoc = await Alumni.findOne({ $or: [{ _id: rawAlumniId }, { userId: rawAlumniId }] });
    if (alDoc) {
      validAlumniIds.add(String(alDoc._id));
      if (alDoc.userId) {
        validAlumniIds.add(String(alDoc.userId));
        alumniUserId = String(alDoc.userId);
      }
    }
  } catch (e) {}

  try {
    const stDoc = await Student.findOne({ $or: [{ _id: rawStudentId }, { userId: rawStudentId }] });
    if (stDoc) {
      validStudentIds.add(String(stDoc._id));
      if (stDoc.userId) {
        validStudentIds.add(String(stDoc.userId));
        studentUserId = String(stDoc.userId);
      }
    }
  } catch (e) {}

  return { alumniUserId, studentUserId, validAlumniIds, validStudentIds };
}

module.exports = {
  resolveMentorshipParticipants,
  getMentorshipParticipantUserIds
};
