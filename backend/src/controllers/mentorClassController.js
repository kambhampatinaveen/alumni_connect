const MentorClass = require('../models/MentorClass');

async function getMentorClasses(req, res) {
  try {
    let query = {};
    if (req.user.role === 'student') {
      query = { $or: [{ targetType: 'all' }, { studentIds: req.user.id }] };
    } else if (req.user.role === 'alumni') {
      query = { createdBy: req.user.id };
    }

    const list = await MentorClass.find(query).sort({ date: 1 });
    res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch mentor classes' });
  }
}

async function createMentorClass(req, res) {
  try {
    const { title, description, date, time, meetingLink, targetType, selectedStudents } = req.body;
    if (!title || !date) {
      return res.status(400).json({ error: 'Title and date are required.' });
    }

    // Date validation: no past dates
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const classDate = new Date(date);

    if (isNaN(classDate.getTime()) || classDate < todayStart) {
      return res.status(400).json({ error: 'Mentor class date cannot be in the past. Please select today or a future date.' });
    }

    const mentorClass = await MentorClass.create({
      title: title.trim(),
      description: description || '',
      date: classDate,
      time: time || '10:00 AM',
      meetingLink: meetingLink || '',
      createdBy: req.user.id,
      creatorName: req.user.name || 'Mentor',
      targetType: targetType || 'all',
      studentIds: Array.isArray(selectedStudents) ? selectedStudents : []
    });

    res.status(201).json({ success: true, data: mentorClass });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = {
  getMentorClasses,
  createMentorClass
};
