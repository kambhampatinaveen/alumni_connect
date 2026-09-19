const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Alumni = require('../models/Alumni');
const Student = require('../models/Student');

/**
 * Resolves any ID (User, Alumni, or Student ID) to the canonical User._id
 */
async function resolveUserId(id) {
  if (!id) return null;
  const rawId = typeof id === 'object' && id._id ? id._id.toString() : id.toString();

  if (!mongoose.Types.ObjectId.isValid(rawId)) {
    return null;
  }

  // 1. Direct User check
  const user = await User.findById(rawId).select('_id role name');
  if (user) return { userId: user._id, role: user.role, name: user.name };

  // 2. Check Alumni collection
  const alumni = await Alumni.findById(rawId).select('userId name');
  if (alumni && alumni.userId) {
    const userFromAlum = await User.findById(alumni.userId).select('_id role name');
    if (userFromAlum) return { userId: userFromAlum._id, role: userFromAlum.role, name: userFromAlum.name || alumni.name };
    return { userId: alumni.userId, role: 'alumni', name: alumni.name };
  }

  // 3. Check Student collection
  const student = await Student.findById(rawId).select('userId name');
  if (student && student.userId) {
    const userFromStud = await User.findById(student.userId).select('_id role name');
    if (userFromStud) return { userId: userFromStud._id, role: userFromStud.role, name: userFromStud.name || student.name };
    return { userId: student.userId, role: 'student', name: student.name };
  }

  return null;
}

/**
 * Centralized notification creation with duplicate protection and recipient resolution.
 */
async function createNotification({
  recipient,
  userId,
  recipientRole,
  type = 'general',
  title,
  message = '',
  relatedId = null,
  relatedType = null,
  metadata = {}
}) {
  try {
    const target = recipient || userId;
    if (!target) {
      console.warn('[NotificationHelper] Missing recipient for notification:', title);
      return null;
    }

    const resolved = await resolveUserId(target);
    if (!resolved || !resolved.userId) {
      console.warn('[NotificationHelper] Could not resolve recipient user ID for:', target);
      return null;
    }

    const actualUserId = resolved.userId;
    const finalRole = (recipientRole || resolved.role || 'student').toLowerCase();

    // Duplicate protection: prevent creating identical notifications within 15 seconds
    const fifteenSecondsAgo = new Date(Date.now() - 15 * 1000);
    const duplicateQuery = {
      $or: [{ userId: actualUserId }, { recipient: actualUserId }],
      type,
      title,
      unread: true,
      createdAt: { $gte: fifteenSecondsAgo }
    };
    if (relatedId) {
      duplicateQuery.relatedId = relatedId;
    }

    const recentDup = await Notification.findOne(duplicateQuery);
    if (recentDup) {
      return recentDup;
    }

    const notif = await Notification.create({
      userId: actualUserId,
      recipient: actualUserId,
      recipientRole: finalRole,
      type,
      title: title.trim(),
      message: (message || '').trim(),
      relatedId: relatedId || (metadata && metadata.id) || null,
      relatedType: relatedType || null,
      unread: true,
      isRead: false,
      metadata: metadata || {}
    });

    return notif;
  } catch (err) {
    console.error('[NotificationHelper] Error creating notification:', err.message);
    return null;
  }
}

/**
 * Dispatches an administrative notification to all active Admin users.
 */
async function notifyAdmins({
  type = 'admin_notice',
  title,
  message = '',
  relatedId = null,
  relatedType = null,
  metadata = {}
}) {
  try {
    const admins = await User.find({ role: 'admin' }).select('_id');
    const promises = admins.map(admin =>
      createNotification({
        recipient: admin._id,
        recipientRole: 'admin',
        type,
        title,
        message,
        relatedId,
        relatedType,
        metadata
      })
    );
    return await Promise.all(promises);
  } catch (err) {
    console.error('[NotificationHelper] Error notifying admins:', err.message);
    return [];
  }
}

/**
 * Dispatches notification to a specific single user.
 */
async function notifyUser(recipient, options) {
  return createNotification({ recipient, ...options });
}

/**
 * Dispatches notification to multiple users.
 */
async function notifyMultipleUsers(recipients, options) {
  if (!Array.isArray(recipients) || recipients.length === 0) return [];
  const promises = recipients.map(r => createNotification({ recipient: r, ...options }));
  return Promise.all(promises);
}

module.exports = {
  createNotification,
  notifyAdmins,
  notifyUser,
  notifyMultipleUsers,
  resolveUserId
};
