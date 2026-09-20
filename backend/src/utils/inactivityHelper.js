/**
 * 30-Day Inactivity Sync Helper
 */

const User = require('../models/User');
const Alumni = require('../models/Alumni');
const Student = require('../models/Student');

async function applyInactivityCheck() {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Flag as INACTIVE if last_login was 30+ days ago
    await User.updateMany(
      { role: { $in: ['alumni', 'student'] }, last_login: { $lt: thirtyDaysAgo }, status: 'ACTIVE' },
      { status: 'INACTIVE' }
    );
    await Alumni.updateMany(
      { last_login: { $lt: thirtyDaysAgo }, status: { $in: ['ACTIVE', 'Active', 'Verified'] } },
      { status: 'INACTIVE' }
    );
    await Student.updateMany(
      { last_login: { $lt: thirtyDaysAgo }, status: { $in: ['ACTIVE', 'Active', 'Enrolled'] } },
      { status: 'INACTIVE' }
    );

    // Ensure users active within 30 days remain ACTIVE unless blocked
    await User.updateMany(
      { role: { $in: ['alumni', 'student'] }, last_login: { $gte: thirtyDaysAgo }, status: 'INACTIVE' },
      { status: 'ACTIVE' }
    );
    await Alumni.updateMany(
      { last_login: { $gte: thirtyDaysAgo }, status: 'INACTIVE' },
      { status: 'ACTIVE' }
    );
    await Student.updateMany(
      { last_login: { $gte: thirtyDaysAgo }, status: 'INACTIVE' },
      { status: 'ACTIVE' }
    );
  } catch (err) {
    console.error('Inactivity check error:', err.message);
  }
}

module.exports = {
  applyInactivityCheck
};
