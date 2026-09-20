const bcrypt = require('bcrypt');
const Alumni = require('../models/Alumni');
const User = require('../models/User');
const { validatePhoneNumber, validateEmail } = require('../utils/validators');
const { applyInactivityCheck } = require('../utils/inactivityHelper');

async function getAlumni(req, res) {
  try {
    await applyInactivityCheck();
    const { search, department, batch, company, status } = req.query;
    const query = {};

    if (status && status !== 'All') {
      query.status = status;
    }
    if (department && department !== 'All') {
      query.department = department;
    }
    if (batch && batch !== 'All') {
      query.batch = batch;
    }
    if (company && company !== 'All') {
      query.company = company;
    }
    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { company: searchRegex },
        { role: searchRegex },
        { department: searchRegex }
      ];
    }

    const list = await Alumni.find(query)
      .populate('userId', 'name email phone avatar department company designation role batch')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch alumni' });
  }
}

async function createAlumnus(req, res) {
  try {
    const {
      name, email, pin, password, phone, rollNumber, branch,
      college, company, role, designation, ctc, batch, department, location,
      skills, domain, mentorshipDomain, bio, availability
    } = req.body || {};

    const credential = pin !== undefined ? pin : password;
    if (!name || !String(name).trim() || !email || !String(email).trim() || credential === undefined || credential === null || !String(credential).trim()) {
      return res.status(400).json({ error: 'Name, email, and PIN are required.' });
    }

    const trimmedPin = String(credential).trim();
    if (trimmedPin.length < 4) {
      return res.status(400).json({ error: 'Login PIN must be at least 4 digits.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const emailErr = validateEmail(cleanEmail);
    if (emailErr) {
      return res.status(400).json({ error: emailErr });
    }

    if (phone !== undefined && phone !== '') {
      const phoneErr = validatePhoneNumber(phone);
      if (phoneErr) return res.status(400).json({ error: phoneErr });
    }

    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(409).json({ error: 'This email is already registered.' });
    }

    const passwordHash = await bcrypt.hash(trimmedPin, 10);
    const now = new Date();

    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      phone: (phone || '').trim(),
      passwordHash,
      role: 'alumni',
      status: 'ACTIVE',
      last_login: now,
      department: department || branch || 'Computer Science',
      company: company || '',
      designation: designation || role || 'Software Engineer',
      batch: batch || '2023',
      location: location || '',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4f46e5&color=fff&size=150`
    });

    const parsedSkills = Array.isArray(skills)
      ? skills
      : (skills ? String(skills).split(',').map(s => s.trim()).filter(Boolean) : []);

    const newAlumnus = await Alumni.create({
      userId: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      rollNumber: rollNumber || '',
      branch: branch || department || 'CSE',
      college: college || 'KIET',
      company: company || '',
      role: role || designation || 'Software Engineer',
      designation: designation || role || 'Software Engineer',
      ctc: ctc || '12 LPA',
      batch: batch || '2023',
      department: department || branch || 'Computer Science',
      location: location || '',
      skills: parsedSkills,
      mentorshipDomain: domain || mentorshipDomain || 'Software Development & Placement',
      bio: bio || '',
      availability: availability || 'Available for Mentorship',
      status: 'ACTIVE',
      last_login: now,
      avatar: user.avatar
    });

    res.status(201).json({ success: true, data: newAlumnus });
  } catch (err) {
    console.error('Create Alumnus error:', err.message);
    res.status(400).json({ error: err.message });
  }
}

async function updateAlumnus(req, res) {
  try {
    let alumnus = null;
    try {
      alumnus = await Alumni.findById(req.params.id);
    } catch (e) {}
    if (!alumnus) {
      alumnus = await Alumni.findOne({ userId: req.params.id });
    }
    if (!alumnus) return res.status(404).json({ error: 'Alumnus not found' });

    const { pin, password, ...rest } = req.body || {};

    // Find linked User account
    let user = alumnus.userId ? await User.findById(alumnus.userId) : null;
    if (!user && alumnus.email) {
      user = await User.findOne({ email: alumnus.email });
      if (user) alumnus.userId = user._id;
    }

    // Email update & uniqueness validation
    if (rest.email !== undefined) {
      const cleanEmail = String(rest.email).toLowerCase().trim();
      const emailErr = validateEmail(cleanEmail);
      if (emailErr) return res.status(400).json({ error: emailErr });

      const excludeUserId = user ? user._id : alumnus.userId;
      const emailInUse = await User.findOne({ 
        email: cleanEmail, 
        _id: { $ne: excludeUserId } 
      });
      if (emailInUse) {
        return res.status(409).json({ error: 'This email is already registered.' });
      }
      alumnus.email = cleanEmail;
      if (user) user.email = cleanEmail;
    }

    // Phone validation
    if (rest.phone !== undefined && rest.phone !== '') {
      const phoneErr = validatePhoneNumber(rest.phone);
      if (phoneErr) return res.status(400).json({ error: phoneErr });
      alumnus.phone = String(rest.phone).trim();
      if (user) user.phone = alumnus.phone;
    }

    // Name update
    if (rest.name !== undefined) {
      if (!rest.name || !String(rest.name).trim()) {
        return res.status(400).json({ error: 'Name is required.' });
      }
      alumnus.name = String(rest.name).trim();
      if (user) user.name = alumnus.name;
    }

    // Status, company, department, role updates
    if (rest.status !== undefined) {
      alumnus.status = rest.status;
      if (user) user.status = rest.status;
    }
    if (rest.company !== undefined) {
      alumnus.company = rest.company;
      if (user) user.company = rest.company;
    }
    if (rest.department !== undefined || rest.branch !== undefined) {
      const dept = rest.department || rest.branch;
      alumnus.department = dept;
      alumnus.branch = dept;
      if (user) user.department = dept;
    }
    if (rest.role !== undefined || rest.designation !== undefined) {
      const r = rest.role || rest.designation;
      alumnus.role = r;
      alumnus.designation = r;
      if (user) user.designation = r;
    }
    if (rest.ctc !== undefined) alumnus.ctc = rest.ctc;
    if (rest.rollNumber !== undefined) alumnus.rollNumber = rest.rollNumber;
    if (rest.college !== undefined) alumnus.college = rest.college;
    if (rest.batch !== undefined) {
      alumnus.batch = rest.batch;
      if (user) user.batch = rest.batch;
    }
    if (rest.bio !== undefined) alumnus.bio = rest.bio;
    if (rest.availability !== undefined) alumnus.availability = rest.availability;
    if (rest.skills !== undefined) {
      alumnus.skills = Array.isArray(rest.skills)
        ? rest.skills
        : String(rest.skills).split(',').map(s => s.trim()).filter(Boolean);
    }

    // PIN / Password update
    const credential = pin !== undefined ? pin : password;
    if (credential !== undefined && credential !== null && String(credential).trim() !== '') {
      const trimmedPin = String(credential).trim();
      if (trimmedPin.length < 4) {
        return res.status(400).json({ error: 'Login PIN must be at least 4 digits.' });
      }
      if (user) {
        user.passwordHash = await bcrypt.hash(trimmedPin, 10);
      }
    }

    await alumnus.save();
    if (user) {
      await user.save();
    }

    res.json({ success: true, data: alumnus });
  } catch (err) {
    console.error('Update Alumnus error:', err.message);
    res.status(400).json({ error: err.message });
  }
}

async function deleteAlumnus(req, res) {
  try {
    let alumnus = null;
    try {
      alumnus = await Alumni.findById(req.params.id);
    } catch (e) {}
    if (!alumnus) {
      alumnus = await Alumni.findOne({ userId: req.params.id });
    }
    if (!alumnus) return res.status(404).json({ error: 'Alumnus not found' });

    if (alumnus.userId) {
      await User.findByIdAndDelete(alumnus.userId);
    }
    await Alumni.findByIdAndDelete(alumnus._id);
    res.json({ success: true, message: 'Alumnus deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = {
  getAlumni,
  createAlumnus,
  updateAlumnus,
  deleteAlumnus
};
