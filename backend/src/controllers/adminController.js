const User = require('../models/User');
const Alumni = require('../models/Alumni');
const Student = require('../models/Student');
const seedDatabase = require('../seed/seedData');

async function healthCheck(req, res) {
  try {
    const usersCount = await User.countDocuments();
    res.json({
      status: 'ok',
      database: 'connected',
      usersCount,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
}

async function simulateInactivity(req, res) {
  try {
    const days = req.body.days || 35;
    const pastDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));

    const s = await Student.findById(req.params.id);
    if (s) {
      s.last_login = pastDate;
      s.status = 'INACTIVE';
      await s.save();
      await User.findByIdAndUpdate(s.userId, { last_login: pastDate, status: 'INACTIVE' });
    }

    const a = await Alumni.findById(req.params.id);
    if (a) {
      a.last_login = pastDate;
      a.status = 'INACTIVE';
      await a.save();
      await User.findByIdAndUpdate(a.userId, { last_login: pastDate, status: 'INACTIVE' });
    }

    res.json({ success: true, message: `Simulated ${days} days inactivity for ${req.params.id}` });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function resetData(req, res) {
  try {
    await seedDatabase(true);
    res.json({ success: true, message: 'All demo and development data reset and baseline seeded.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset data: ' + err.message });
  }
}

module.exports = {
  healthCheck,
  simulateInactivity,
  resetData
};
