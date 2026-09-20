const Alumni = require('../models/Alumni');
const Student = require('../models/Student');
const Event = require('../models/Event');
const Mentorship = require('../models/Mentorship');
const Referral = require('../models/Referral');
const { applyInactivityCheck } = require('../utils/inactivityHelper');

async function getOverview(req, res) {
  try {
    await applyInactivityCheck();

    const totalAlumni = await Alumni.countDocuments();
    const activeAlumni = await Alumni.countDocuments({ status: { $in: ['ACTIVE', 'Active', 'Verified'] } });
    const inactiveAlumni = totalAlumni - activeAlumni;

    const totalStudents = await Student.countDocuments();
    const activeStudents = await Student.countDocuments({ status: { $in: ['ACTIVE', 'Active', 'Enrolled'] } });
    const inactiveStudents = totalStudents - activeStudents;

    const totalEvents = await Event.countDocuments();
    const totalMentorships = await Mentorship.countDocuments();
    const totalReferrals = await Referral.countDocuments();

    // Department breakdown
    const branchCounts = await Alumni.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } }
    ]);

    const departmentData = branchCounts.map(b => ({
      department: b._id || 'Other',
      count: b.count,
      percentage: totalAlumni > 0 ? Number(((b.count / totalAlumni) * 100).toFixed(1)) : 0
    }));

    const topEngagedAlumni = await Alumni.find().sort({ engagementScore: -1 }).limit(5);

    res.json({
      totalAlumni,
      totalAlumniGrowth: 0,
      activeAlumni,
      activeAlumniGrowth: 0,
      inactiveAlumni,
      totalStudents,
      totalStudentsGrowth: 0,
      activeStudents,
      activeStudentsGrowth: 0,
      inactiveStudents,
      totalEvents,
      totalMentorships,
      totalReferrals,
      mentors: activeAlumni,
      mentorsGrowth: 0,
      connections: totalMentorships * 2,
      connectionsGrowth: 0,
      conversations: totalEvents + totalMentorships,
      departmentData,
      topEngagedAlumni
    });
  } catch (err) {
    console.error('Analytics overview error:', err.message);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
}

async function getByDepartment(req, res) {
  try {
    const totalAlumni = await Alumni.countDocuments();
    const branchCounts = await Alumni.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } }
    ]);

    const data = branchCounts.map(b => ({
      department: b._id || 'Other',
      count: b.count,
      percentage: totalAlumni > 0 ? Number(((b.count / totalAlumni) * 100).toFixed(1)) : 0
    }));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch department analytics' });
  }
}

async function getByIndustry(req, res) {
  try {
    const totalAlumni = await Alumni.countDocuments();
    const alumniRecords = await Alumni.find({}, 'company role designation industry').lean();

    const industryCounts = {};
    alumniRecords.forEach(a => {
      let ind = a.industry;
      if (!ind || ind.trim() === '') {
        const comp = (a.company || '').toLowerCase();
        const role = (a.role || a.designation || '').toLowerCase();
        if (comp.includes('google') || comp.includes('microsoft') || comp.includes('amazon') || comp.includes('tech') || role.includes('software') || role.includes('engineer') || role.includes('developer')) {
          ind = 'Technology';
        } else if (comp.includes('hospital') || comp.includes('health') || comp.includes('pharma')) {
          ind = 'Healthcare';
        } else if (comp.includes('bank') || comp.includes('capital') || comp.includes('finance')) {
          ind = 'Financial Services';
        } else if (comp.includes('school') || comp.includes('university') || comp.includes('college')) {
          ind = 'Education';
        } else if (comp.includes('research') || comp.includes('lab')) {
          ind = 'Research';
        } else if (a.company && a.company.trim()) {
          ind = a.company.trim();
        } else {
          ind = 'Technology';
        }
      }
      industryCounts[ind] = (industryCounts[ind] || 0) + 1;
    });

    const data = Object.entries(industryCounts).map(([industry, count]) => ({
      industry,
      count,
      percentage: totalAlumni > 0 ? Number(((count / totalAlumni) * 100).toFixed(1)) : 0
    }));

    res.json(data.sort((a, b) => b.count - a.count));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch industry analytics' });
  }
}

async function getEngagementTrend(req, res) {
  try {
    const alumniCount = await Alumni.countDocuments();
    const eventCount = await Event.countDocuments();
    res.json([
      { month: 'Jan', activeUsers: alumniCount, events: eventCount },
      { month: 'Feb', activeUsers: alumniCount, events: eventCount },
      { month: 'Mar', activeUsers: alumniCount, events: eventCount },
      { month: 'Apr', activeUsers: alumniCount, events: eventCount }
    ]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch engagement trend' });
  }
}

async function getMentorshipDomains(req, res) {
  try {
    const domains = await Mentorship.aggregate([
      { $group: { _id: '$domain', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const data = domains.map(d => ({ domain: d._id || 'General', count: d.count }));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch mentorship domains' });
  }
}

async function getEventParticipation(req, res) {
  try {
    const events = await Event.find().lean();
    
    // Group events dynamically by quarter from actual MongoDB events
    const quarters = ['Q1 2025', 'Q2 2025', 'Q3 2025', 'Q4 2025'];
    const breakdown = quarters.map(q => ({ month: q, webinars: 0, workshops: 0, reunions: 0 }));

    events.forEach(ev => {
      const d = new Date(ev.date);
      const m = d.getMonth();
      let qIdx = Math.floor(m / 3);
      if (qIdx < 0 || qIdx > 3) qIdx = 0;

      const type = (ev.type || '').toLowerCase();
      const pCount = Array.isArray(ev.participants) ? ev.participants.length : 1;

      if (type.includes('webinar') || type.includes('seminar') || type.includes('talk')) {
        breakdown[qIdx].webinars += pCount;
      } else if (type.includes('workshop') || type.includes('hands-on') || type.includes('tech')) {
        breakdown[qIdx].workshops += pCount;
      } else {
        breakdown[qIdx].reunions += pCount;
      }
    });

    res.json(breakdown);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch event participation' });
  }
}

module.exports = {
  getOverview,
  getByDepartment,
  getByIndustry,
  getEngagementTrend,
  getMentorshipDomains,
  getEventParticipation
};
