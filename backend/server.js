require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

const connectDB = require('./src/config/db');
const seedDatabase = require('./src/seed/seedData');

const User = require('./src/models/User');
const Alumni = require('./src/models/Alumni');
const Student = require('./src/models/Student');
const Event = require('./src/models/Event');
const Mentorship = require('./src/models/Mentorship');
const MentorClass = require('./src/models/MentorClass');
const Referral = require('./src/models/Referral');
const Notification = require('./src/models/Notification');
const Participation = require('./src/models/Participation');
const Message = require('./src/models/Message');
const {
  createNotification,
  notifyAdmins,
  notifyUser,
  notifyMultipleUsers
} = require('./src/utils/notificationHelper');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'alumniconnect_super_secret_key_2024';

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || /^http:\/\/localhost:\d+$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

// ─── 30-Day Inactivity Sync Helper ──────────────────────────────────────────
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

// ─── Token Verification Middleware ──────────────────────────────────────────
function verifyToken(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }
  try {
    const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    if (decoded && decoded.role) {
      decoded.role = String(decoded.role).toLowerCase().trim();
    }
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
}

function optionalToken(req, res, next) {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET);
      if (decoded && decoded.role) {
        decoded.role = String(decoded.role).toLowerCase().trim();
      }
      req.user = decoded;
    } catch (e) {
      // ignore invalid token in optional check
    }
  }
  next();
}

function requireAdmin(req, res, next) {
  const role = String(req.user?.role || '').toLowerCase().trim();
  if (!req.user || role !== 'admin') {
    return res.status(403).json({ error: 'Access denied: Administrator privileges required.' });
  }
  next();
}

// ─── Validation Helpers ───────────────────────────────────────────────────────
function validatePhoneNumber(phone) {
  if (!phone || typeof phone !== 'string') {
    return 'Phone number must contain exactly 10 digits.';
  }
  const trimmed = phone.trim();
  if (/[^\d]/.test(trimmed)) {
    return 'Phone number must contain only digits.';
  }
  if (trimmed.length !== 10 || !/^[0-9]{10}$/.test(trimmed)) {
    return 'Phone number must contain exactly 10 digits.';
  }
  return null;
}

function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return 'Email address is required.';
  }
  const trimmed = email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return 'Invalid email address format.';
  }
  return null;
}

const VALID_STUDENT_DEPARTMENTS = ['AID', 'CSD', 'CSC', 'CSM', 'CAI'];
function validateStudentDepartment(dept) {
  if (!dept || typeof dept !== 'string' || !VALID_STUDENT_DEPARTMENTS.includes(dept.trim())) {
    return 'Invalid department. Allowed departments are: AID, CSD, CSC, CSM, CAI.';
  }
  return null;
}

function validateGpa(gpa) {
  if (gpa === undefined || gpa === null || String(gpa).trim() === '') {
    return 'GPA is required.';
  }
  const numericGpa = Number(gpa);
  if (!Number.isFinite(numericGpa) || numericGpa < 0 || numericGpa > 10) {
    return 'GPA must be a number between 0 and 10.';
  }
  return null;
}

function validateClassYear(batch) {
  if (batch === undefined || batch === null || !String(batch).trim()) {
    return 'Class Year is required.';
  }
  return null;
}

function parseTimeString(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') {
    return { startHour: 10, startMin: 0, endHour: 12, endMin: 0 };
  }

  // Normalize and split on " - ", " – ", " — ", " to "
  const parts = timeStr.split(/\s*(?:–|—|-|to)\s*/i);

  function parseSingleTime(str) {
    if (!str) return null;
    const clean = str.trim();
    // 12-hour AM/PM: e.g. "10:00 AM", "2:30 PM", "2 PM", "02:00 PM"
    const match12 = clean.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
    if (match12) {
      let h = parseInt(match12[1], 10);
      const m = match12[2] ? parseInt(match12[2], 10) : 0;
      const meridiem = match12[3] ? match12[3].toUpperCase() : null;
      if (meridiem === 'PM' && h < 12) h += 12;
      if (meridiem === 'AM' && h === 12) h = 0;
      return { hour: h, min: m };
    }
    // 24-hour: e.g. "14:00", "09:30"
    const match24 = clean.match(/^(\d{1,2}):(\d{2})$/);
    if (match24) {
      return { hour: parseInt(match24[1], 10), min: parseInt(match24[2], 10) };
    }
    return null;
  }

  const startParsed = parseSingleTime(parts[0]);
  const endParsed = parts[1] ? parseSingleTime(parts[1]) : null;

  const startHour = startParsed ? startParsed.hour : 10;
  const startMin = startParsed ? startParsed.min : 0;

  let endHour;
  let endMin;
  if (endParsed) {
    endHour = endParsed.hour;
    endMin = endParsed.min;
    if (endHour < startHour && endHour < 12) {
      endHour += 12;
    }
  } else {
    // Default duration: 2 hours
    endHour = startHour + 2;
    endMin = startMin;
  }

  return { startHour, startMin, endHour, endMin };
}

function getEventStartAndEndTime(ev) {
  if (!ev || !ev.date) return null;
  const rawDate = new Date(ev.date);
  if (isNaN(rawDate.getTime())) return null;

  let year, month, day;
  if (typeof ev.date === 'string') {
    const datePart = ev.date.split('T')[0];
    const parts = datePart.split('-').map(Number);
    if (parts.length === 3) {
      year = parts[0];
      month = parts[1] - 1;
      day = parts[2];
    }
  }
  if (!year) {
    year = rawDate.getFullYear();
    month = rawDate.getMonth();
    day = rawDate.getDate();
  }

  const { startHour, startMin, endHour, endMin } = parseTimeString(ev.time);

  const startDate = new Date(year, month, day, startHour, startMin, 0, 0);
  const endDate = new Date(year, month, day, endHour, endMin, 0, 0);

  return { startDate, endDate };
}

function calculateEventStatus(ev) {
  if (!ev) return 'UPCOMING';
  if (ev.status === 'CANCELLED') return 'CANCELLED';
  const range = getEventStartAndEndTime(ev);
  if (!range) return 'UPCOMING';

  const now = new Date();
  if (now < range.startDate) {
    return 'UPCOMING';
  } else if (now <= range.endDate) {
    return 'ONGOING';
  } else {
    return 'COMPLETED';
  }
}

function sanitizeEventForUser(ev, user) {
  const item = ev.toJSON ? ev.toJSON() : { ...ev };
  item.status = calculateEventStatus(ev);

  const userIdStr = user?.id ? user.id.toString() : '';
  const isCreator = Boolean(
    userIdStr &&
    ev.createdBy &&
    (ev.createdBy._id || ev.createdBy).toString() === userIdStr
  );
  const isAdmin = Boolean(user && user.role === 'admin');
  const isRegistered = Boolean(
    userIdStr &&
    Array.isArray(ev.participants) &&
    ev.participants.some(p => (p._id || p).toString() === userIdStr)
  );

  item.isRegistered = isRegistered;
  item.isCreator = isCreator;

  const isOngoing = item.status === 'ONGOING';
  const rawMeetingLink = (ev.meetingLink || item.meetingLink || '').trim();
  const hasLink = Boolean(item.mode === 'Online' && rawMeetingLink);

  item.hasMeetingLink = hasLink;

  // Authorization check for meeting link:
  // Admin or Creator can always access meetingLink (to view/edit/manage)
  // Registered normal user can access meetingLink ONLY WHEN event is ONGOING
  const canAccessMeetingLink = isCreator || isAdmin || (isRegistered && isOngoing);

  if (item.mode === 'Online') {
    if (canAccessMeetingLink && rawMeetingLink) {
      item.meetingLink = rawMeetingLink;
      item.canJoinMeeting = Boolean(isOngoing);
    } else {
      item.meetingLink = '';
      item.canJoinMeeting = false;
    }
  } else {
    item.meetingLink = '';
    item.canJoinMeeting = false;
  }

  return item;
}

// ─── Auth Routes ─────────────────────────────────────────────────────────────

// Self-registration for Alumni & Students ONLY (Admin public signup removed)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, phone, password, role, department } = req.body;

    if (role === 'admin') {
      return res.status(403).json({
        error: 'Public registration is restricted to Alumni and Students. Administrators are predefined.'
      });
    }

    if (!role || !['alumni', 'student'].includes(role)) {
      return res.status(400).json({ error: 'Role must be either alumni or student.' });
    }

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    // Phone validation for signup
    const phoneErr = validatePhoneNumber(phone);
    if (phoneErr) {
      return res.status(400).json({ error: phoneErr });
    }

    // Student department validation if provided
    if (role === 'student' && department) {
      const deptErr = validateStudentDepartment(department);
      if (deptErr) {
        return res.status(400).json({ error: deptErr });
      }
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(409).json({ error: 'This email is already registered.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date();
    const deptToUse = department || 'AID';

    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      phone: (phone || '').trim(),
      passwordHash,
      role,
      status: 'ACTIVE',
      last_login: now,
      department: deptToUse,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&size=150`
    });

    if (role === 'alumni') {
      await Alumni.create({
        userId: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        department: deptToUse,
        branch: deptToUse,
        status: 'ACTIVE',
        last_login: now,
        avatar: user.avatar
      });
    } else if (role === 'student') {
      await Student.create({
        userId: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        department: deptToUse,
        status: 'ACTIVE',
        last_login: now,
        avatar: user.avatar
      });
    }

    // Notify Admins of new account registration
    await notifyAdmins({
      type: 'user_registration',
      title: role === 'student' ? 'New Student Registration' : 'New Alumni Registration',
      message: role === 'student'
        ? `A new student account was registered: ${user.name}.`
        : `A new alumni account was registered: ${user.name}.`,
      relatedId: user._id,
      relatedType: 'User',
      metadata: { userId: user._id, role, name: user.name, email: cleanEmail }
    });

    const safeUser = user.toJSON();
    const token = jwt.sign(
      { id: user._id, _id: user._id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ token, user: safeUser });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ error: err.message || 'Registration failed.' });
  }
});

// Role-enforced Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, pin, selectedRole, role } = req.body;
    const credential = password !== undefined ? password : pin;
    const targetRole = selectedRole || role;

    if (!email || credential === undefined) {
      return res.status(400).json({ error: 'Incorrect email or password.' });
    }

    if (targetRole && !['admin', 'alumni', 'student'].includes(String(targetRole).toLowerCase())) {
      return res.status(400).json({ error: 'Incorrect email or password.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(401).json({ error: 'Incorrect email or password.' });
    }

    const isMatch = await bcrypt.compare(String(credential), user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect email or password.' });
    }

    // Role verification: when a targetRole is specified, ensure it matches the user's role
    if (targetRole && user.role.toLowerCase() !== targetRole.toLowerCase()) {
      return res.status(401).json({ error: 'Incorrect email or password.' });
    }

    // Update last_login and ensure ACTIVE status upon login
    const now = new Date();
    user.last_login = now;
    user.status = 'ACTIVE';
    await user.save();

    if (user.role === 'alumni') {
      await Alumni.updateOne({ userId: user._id }, { last_login: now, status: 'ACTIVE' });
    } else if (user.role === 'student') {
      await Student.updateOne({ userId: user._id }, { last_login: now, status: 'ACTIVE' });
    }

    const safeUser = user.toJSON();
    const token = jwt.sign(
      { id: user._id, _id: user._id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, user: safeUser });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

app.get('/api/auth/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Profile update (Role cannot be changed)
app.put('/api/auth/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const {
      name, phone, company, designation, batch, department,
      location, bio, about, skills, linkedin, github, avatar
    } = req.body;

    if (name) user.name = name.trim();
    if (phone !== undefined && phone !== '') {
      const phoneErr = validatePhoneNumber(phone);
      if (phoneErr) return res.status(400).json({ error: phoneErr });
      user.phone = phone.trim();
    }
    if (company !== undefined) user.company = company.trim();
    if (designation !== undefined) user.designation = designation.trim();
    if (batch !== undefined) user.batch = batch.trim();
    if (department !== undefined && department !== '') {
      if (user.role === 'student') {
        const deptErr = validateStudentDepartment(department);
        if (deptErr) return res.status(400).json({ error: deptErr });
      }
      user.department = department.trim();
    }
    if (location !== undefined) user.location = location.trim();
    if (bio !== undefined) user.bio = bio.trim();
    if (about !== undefined) user.about = about.trim();
    if (skills !== undefined) user.skills = Array.isArray(skills) ? skills : [];
    if (linkedin !== undefined) user.linkedin = linkedin.trim();
    if (github !== undefined) user.github = github.trim();
    if (avatar) user.avatar = avatar;

    await user.save();

    // Sync corresponding Alumni or Student doc
    if (user.role === 'alumni') {
      await Alumni.updateOne(
        { userId: user._id },
        {
          name: user.name,
          phone: user.phone,
          company: user.company,
          designation: user.designation,
          batch: user.batch,
          department: user.department,
          location: user.location,
          avatar: user.avatar,
          skills: user.skills
        }
      );
    } else if (user.role === 'student') {
      await Student.updateOne(
        { userId: user._id },
        {
          name: user.name,
          phone: user.phone,
          department: user.department,
          batch: user.batch,
          avatar: user.avatar,
          skills: user.skills
        }
      );
    }

    res.json({ success: true, user: user.toJSON() });
  } catch (err) {
    console.error('Update profile error:', err.message);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// ─── Alumni Management Routes ────────────────────────────────────────────────
app.get('/api/alumni', async (req, res) => {
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
});

app.post('/api/alumni', verifyToken, requireAdmin, async (req, res) => {
  try {
    const {
      name, email, pin, password, phone, rollNumber, branch,
      college, company, role, designation, ctc, batch, department, location,
      skills, domain, mentorshipDomain, bio, availability
    } = req.body;

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
});

app.put('/api/alumni/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    let alumnus = null;
    try {
      alumnus = await Alumni.findById(req.params.id);
    } catch (e) {}
    if (!alumnus) {
      alumnus = await Alumni.findOne({ userId: req.params.id });
    }
    if (!alumnus) return res.status(404).json({ error: 'Alumnus not found' });

    const { pin, password, ...rest } = req.body;

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
});

app.delete('/api/alumni/:id', verifyToken, requireAdmin, async (req, res) => {
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
});

// ─── Student Management Routes ───────────────────────────────────────────────
app.get('/api/students', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'alumni') {
    return res.status(403).json({ error: 'Access denied: Directory access requires Administrator or Alumni account.' });
  }
  try {
    await applyInactivityCheck();
    const { search, department, batch, status } = req.query;
    const query = {};

    if (status && status !== 'All') query.status = status;
    if (department && department !== 'All') query.department = department;
    if (batch && batch !== 'All') query.batch = batch;
    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { rollNumber: searchRegex },
        { department: searchRegex }
      ];
    }

    const list = await Student.find(query).sort({ createdAt: -1 });
    res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

app.post('/api/students', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { name, email, pin, password, phone, rollNumber, department, batch, gpa } = req.body;
    const credential = pin !== undefined ? pin : password;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Student Name is required.' });
    }

    const emailErr = validateEmail(email);
    if (emailErr) {
      return res.status(400).json({ error: emailErr });
    }

    const phoneErr = validatePhoneNumber(phone);
    if (phoneErr) {
      return res.status(400).json({ error: phoneErr });
    }

    if (credential === undefined || credential === null || String(credential).trim().length < 4) {
      return res.status(400).json({ error: 'Login PIN is required and must be at least 4 digits.' });
    }

    const deptToUse = department || 'AID';
    const deptErr = validateStudentDepartment(deptToUse);
    if (deptErr) {
      return res.status(400).json({ error: deptErr });
    }

    const classYearErr = validateClassYear(batch);
    if (classYearErr) return res.status(400).json({ error: classYearErr });

    const gpaErr = validateGpa(gpa);
    if (gpaErr) return res.status(400).json({ error: gpaErr });

    const cleanEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(409).json({ error: 'This email is already registered.' });
    }

    const passwordHash = await bcrypt.hash(String(credential).trim(), 10);
    const now = new Date();

    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      phone: (phone || '').trim(),
      passwordHash,
      role: 'student',
      status: 'ACTIVE',
      last_login: now,
      department: deptToUse,
      batch: String(batch).trim(),
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=059669&color=fff&size=150`
    });

    let newStudent;
    try {
      newStudent = await Student.create({
        userId: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        rollNumber: rollNumber || '',
        department: deptToUse,
        batch: String(batch).trim(),
        gpa: String(gpa).trim(),
        status: 'ACTIVE',
        last_login: now,
        avatar: user.avatar
      });
    } catch (studentError) {
      await User.findByIdAndDelete(user._id);
      throw studentError;
    }

    res.status(201).json({ success: true, data: newStudent });
  } catch (err) {
    console.error('Create Student error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/students/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    let student = null;
    try {
      student = await Student.findById(req.params.id);
    } catch (e) {}
    if (!student) {
      student = await Student.findOne({ userId: req.params.id });
    }
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const { pin, password, ...rest } = req.body;

    // Find linked User account
    let user = student.userId ? await User.findById(student.userId) : null;
    if (!user && student.email) {
      user = await User.findOne({ email: student.email });
      if (user) student.userId = user._id;
    }

    // Email update & uniqueness validation
    if (rest.email !== undefined) {
      const cleanEmail = String(rest.email).toLowerCase().trim();
      const emailErr = validateEmail(cleanEmail);
      if (emailErr) return res.status(400).json({ error: emailErr });

      const excludeUserId = user ? user._id : student.userId;
      const emailInUse = await User.findOne({ 
        email: cleanEmail, 
        _id: { $ne: excludeUserId } 
      });
      if (emailInUse) {
        return res.status(409).json({ error: 'This email is already registered.' });
      }
      student.email = cleanEmail;
      if (user) user.email = cleanEmail;
    }

    // Phone validation
    if (rest.phone !== undefined) {
      const phoneErr = validatePhoneNumber(rest.phone);
      if (phoneErr) return res.status(400).json({ error: phoneErr });
      student.phone = String(rest.phone).trim();
      if (user) user.phone = student.phone;
    }

    // Department validation
    if (rest.department !== undefined) {
      const deptErr = validateStudentDepartment(rest.department);
      if (deptErr) return res.status(400).json({ error: deptErr });
      student.department = rest.department;
      if (user) user.department = rest.department;
    }

    // Name update
    if (rest.name !== undefined) {
      if (!rest.name || !String(rest.name).trim()) {
        return res.status(400).json({ error: 'Student Name is required.' });
      }
      student.name = String(rest.name).trim();
      if (user) user.name = student.name;
    }

    // Status update
    if (rest.status !== undefined) {
      student.status = rest.status;
      if (user) user.status = rest.status;
    }

    // Class Year / Batch update
    if (rest.batch !== undefined) {
      const classYearErr = validateClassYear(rest.batch);
      if (classYearErr) return res.status(400).json({ error: classYearErr });
      student.batch = rest.batch;
      if (user) user.batch = rest.batch;
    }

    // GPA update
    if (rest.gpa !== undefined) {
      const gpaErr = validateGpa(rest.gpa);
      if (gpaErr) return res.status(400).json({ error: gpaErr });
      student.gpa = rest.gpa;
    }

    // Roll Number update
    if (rest.rollNumber !== undefined) {
      student.rollNumber = rest.rollNumber;
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

    await student.save();
    if (user) {
      await user.save();
    }

    res.json({ success: true, data: student });
  } catch (err) {
    console.error('Update Student error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/students/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    let student = null;
    try {
      student = await Student.findById(req.params.id);
    } catch (e) {}
    if (!student) {
      student = await Student.findOne({ userId: req.params.id });
    }
    if (!student) return res.status(404).json({ error: 'Student not found' });

    if (student.userId) {
      await User.findByIdAndDelete(student.userId);
    }
    await Student.findByIdAndDelete(student._id);
    res.json({ success: true, message: 'Student deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── Events & Workshops Routes ───────────────────────────────────────────────
app.get('/api/events', optionalToken, async (req, res) => {
  try {
    const events = await Event.find()
      .populate('createdBy', 'name email role avatar company designation')
      .sort({ date: 1 });

    let formatted = events.map(ev => sanitizeEventForUser(ev, req.user));

    const { status } = req.query;
    if (status && status.toLowerCase() !== 'all') {
      const s = status.toLowerCase();
      if (s === 'registered') {
        formatted = formatted.filter(e => e.isRegistered);
      } else if (s === 'notregistered' || s === 'not registered' || s === 'not_registered') {
        formatted = formatted.filter(e => !e.isRegistered);
      } else {
        formatted = formatted.filter(e => e.status.toLowerCase() === s);
      }
    }

    res.json({ success: true, count: formatted.length, data: formatted });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

app.get('/api/events/:id', optionalToken, async (req, res) => {
  try {
    const ev = await Event.findById(req.params.id)
      .populate('createdBy', 'name email role avatar company designation')
      .populate('participants', 'name email role avatar');
    if (!ev) return res.status(404).json({ error: 'Event not found' });

    const item = sanitizeEventForUser(ev, req.user);
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

app.post('/api/events', verifyToken, async (req, res) => {
  if (req.user.role === 'student') {
    return res.status(403).json({ error: 'Students do not have permission to host or create events.' });
  }

  try {
    const { name, title, type, description, date, time, mode, location, meetingLink } = req.body;
    if (!date) {
      return res.status(400).json({ error: 'Event date is required.' });
    }

    // Date validation: no past dates
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const eventDate = new Date(date);

    if (isNaN(eventDate.getTime()) || eventDate < todayStart) {
      return res.status(400).json({ error: 'Event date cannot be in the past. Please select today or a future date.' });
    }

    let eventMode = 'Online';
    if (mode) {
      eventMode = String(mode).toLowerCase() === 'offline' ? 'Offline' : 'Online';
    } else if (location && location.toLowerCase() !== 'online' && !meetingLink) {
      eventMode = 'Offline';
    }

    if (eventMode === 'Online') {
      if (!meetingLink || !meetingLink.trim()) {
        return res.status(400).json({ error: 'Meeting link is required for Online events.' });
      }
      try {
        const parsedUrl = new URL(meetingLink.trim());
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
          throw new Error();
        }
      } catch (err) {
        return res.status(400).json({ error: 'Meeting link must be a valid HTTP or HTTPS URL.' });
      }
    } else {
      if (!location || !location.trim()) {
        return res.status(400).json({ error: 'Meeting location/venue is required for Offline events.' });
      }
    }

    const event = await Event.create({
      name: (name || title || 'Event').trim(),
      title: (title || name || 'Event').trim(),
      type: type || 'Technical Workshop',
      description: description || '',
      date: eventDate,
      time: time || '10:00 AM',
      mode: eventMode,
      location: eventMode === 'Offline' ? location.trim() : 'Online',
      meetingLink: eventMode === 'Online' ? meetingLink.trim() : '',
      createdBy: req.user.id,
      createdByRole: req.user.role,
      creatorName: req.user.name || 'Event Organizer',
      participants: []
    });

    const resItem = sanitizeEventForUser(event, req.user);

    // Administrative notification to Admin (if creator is not admin)
    if (req.user.role !== 'admin') {
      await notifyAdmins({
        type: 'event_created',
        title: 'New Event Created',
        message: `${req.user.name || 'An alumni'} created a new event: ${event.title || event.name}.`,
        relatedId: event._id,
        relatedType: 'Event',
        metadata: { eventId: event._id, eventName: event.title || event.name }
      });
    }

    // Broadcast notification to students and alumni
    try {
      const audience = await User.find({
        _id: { $ne: req.user.id },
        role: { $in: ['student', 'alumni'] }
      }).select('_id');

      for (const u of audience) {
        await createNotification({
          recipient: u._id,
          type: 'event_created',
          title: 'New Event Available',
          message: `A new event '${event.title || event.name}' has been published.`,
          relatedId: event._id,
          relatedType: 'Event',
          metadata: { eventId: event._id, eventName: event.title || event.name }
        });
      }
    } catch (broadcastErr) {
      console.error('Event broadcast notification error:', broadcastErr.message);
    }

    res.status(201).json({ success: true, data: resItem });
  } catch (err) {
    console.error('Create Event error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/events/:id', verifyToken, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const isCreator = event.createdBy.toString() === req.user.id.toString() ||
      (req.user.role === 'admin' && event.createdByRole === 'admin');

    if (!isCreator && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You do not have permission to edit this event.' });
    }

    if (req.body.date) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const eventDate = new Date(req.body.date);
      if (isNaN(eventDate.getTime()) || eventDate < todayStart) {
        return res.status(400).json({ error: 'Event date cannot be in the past.' });
      }
      event.date = eventDate;
    }

    if (req.body.mode) {
      const eventMode = String(req.body.mode).toLowerCase() === 'offline' ? 'Offline' : 'Online';
      event.mode = eventMode;
      if (eventMode === 'Online') {
        const link = req.body.meetingLink || event.meetingLink;
        if (!link || !link.trim()) {
          return res.status(400).json({ error: 'Meeting link is required for Online events.' });
        }
        try {
          const parsed = new URL(link.trim());
          if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error();
        } catch (e) {
          return res.status(400).json({ error: 'Meeting link must be a valid HTTP or HTTPS URL.' });
        }
        event.meetingLink = link.trim();
        event.location = 'Online';
      } else {
        const loc = req.body.location || (event.location !== 'Online' ? event.location : '');
        if (!loc || !loc.trim()) {
          return res.status(400).json({ error: 'Meeting location/venue is required for Offline events.' });
        }
        event.location = loc.trim();
        event.meetingLink = '';
      }
    } else {
      if (req.body.location) event.location = req.body.location;
      if (req.body.meetingLink !== undefined) event.meetingLink = req.body.meetingLink;
    }

    if (req.body.name) event.name = req.body.name;
    if (req.body.title) event.title = req.body.title;
    if (req.body.type) event.type = req.body.type;
    if (req.body.description !== undefined) event.description = req.body.description;
    if (req.body.time) event.time = req.body.time;
    if (req.body.status) event.status = req.body.status;

    await event.save();
    const updatedItem = sanitizeEventForUser(event, req.user);

    // Notify registered participants about event update
    if (Array.isArray(event.participants) && event.participants.length > 0) {
      for (const pId of event.participants) {
        await createNotification({
          recipient: pId,
          type: 'event_updated',
          title: 'Event Updated',
          message: `The event '${event.title || event.name}' has been updated.`,
          relatedId: event._id,
          relatedType: 'Event',
          metadata: { eventId: event._id, eventName: event.title || event.name }
        });
      }
    }

    res.json({ success: true, data: updatedItem });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/events/:id', verifyToken, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const isCreator = event.createdBy.toString() === req.user.id.toString() ||
      (req.user.role === 'admin' && event.createdByRole === 'admin');

    if (!isCreator && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You do not have permission to delete this event.' });
    }

    // Notify registered participants about event cancellation
    if (Array.isArray(event.participants) && event.participants.length > 0) {
      for (const pId of event.participants) {
        await createNotification({
          recipient: pId,
          type: 'event_cancelled',
          title: 'Event Cancelled',
          message: `The event '${event.title || event.name}' has been cancelled.`,
          relatedId: event._id,
          relatedType: 'Event',
          metadata: { eventId: event._id, eventName: event.title || event.name }
        });
      }
    }

    await Event.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Event Participation (Supports Student, Alumni, Admin)
app.post('/api/events/:id/participate', verifyToken, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const currentStatus = calculateEventStatus(event);
    if (currentStatus === 'COMPLETED') {
      return res.status(400).json({ error: 'This event has already ended. Registration is closed.' });
    }

    const userId = req.user.id;
    const alreadyInEvent = Array.isArray(event.participants) &&
      event.participants.some(p => (p._id || p).toString() === userId.toString());
    const existingParticipation = await Participation.findOne({
      eventId: event._id,
      userId: userId
    });

    if (alreadyInEvent || existingParticipation) {
      return res.status(400).json({ error: 'You are already registered for this event.' });
    }

    // Add to event.participants if not already present
    if (!alreadyInEvent) {
      event.participants.push(userId);
      await event.save();
    }

    // Create record in Participation collection with unique compound key
    try {
      await Participation.create({
        eventId: event._id,
        userId: userId,
        role: req.user.role || 'student',
        userName: req.user.name || '',
        userEmail: req.user.email || '',
        status: 'registered'
      });
    } catch (partErr) {
      if (partErr.code === 11000) {
        return res.status(400).json({ error: 'You are already registered for this event.' });
      }
      console.warn('Participation write warning:', partErr.message);
    }

    const item = sanitizeEventForUser(event, req.user);

    // 1. Notify event creator (organizer) if registrant is not creator
    if (event.createdBy && event.createdBy.toString() !== userId.toString()) {
      await createNotification({
        recipient: event.createdBy,
        type: 'event_registration',
        title: 'New Event Registration',
        message: `${req.user.name} registered for ${event.title || event.name}.`,
        relatedId: event._id,
        relatedType: 'Event',
        metadata: { eventId: event._id, participantId: userId, participantName: req.user.name }
      });
    }

    // 2. Notify Admins
    await notifyAdmins({
      type: 'event_registration',
      title: 'New Event Registration',
      message: `${req.user.name} registered for ${event.title || event.name}.`,
      relatedId: event._id,
      relatedType: 'Event',
      metadata: { eventId: event._id, participantId: userId, participantName: req.user.name }
    });

    res.status(201).json({ success: true, message: 'Registration completed successfully.', data: item });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// User event registration cancellation is disabled platform-wide
app.post('/api/events/:id/cancel', verifyToken, async (req, res) => {
  return res.status(403).json({ error: 'Event registration cancellation is not permitted.' });
});

// Helper to resolve and populate complete Student and Alumni names & profiles for Mentorships
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

// ─── 1-to-1 Mentorship Routes ────────────────────────────────────────────────
app.get('/api/mentorships', verifyToken, async (req, res) => {
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
    // Admin view monitors all mentorship relationships (Alumni — 1-to-1 Session — Student)

    const rawList = await Mentorship.find(query).sort({ updatedAt: -1 });
    const list = await Promise.all(rawList.map(m => resolveMentorshipParticipants(m)));

    res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch mentorships' });
  }
});

app.get('/api/mentorships/:id', verifyToken, async (req, res) => {
  try {
    const item = await Mentorship.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Mentorship not found' });
    const resolved = await resolveMentorshipParticipants(item);
    res.json({ success: true, data: resolved });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch mentorship' });
  }
});

// Student initiates mentorship request
app.post('/api/mentorships', verifyToken, async (req, res) => {
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
});

const handleUpdateMentorship = async (req, res) => {
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
};

app.put('/api/mentorships/:id', verifyToken, handleUpdateMentorship);
app.put('/api/mentorships/:id/status', verifyToken, handleUpdateMentorship);

// Alumni logs a session inside existing relationship
app.post('/api/mentorships/:id/sessions', verifyToken, async (req, res) => {
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
});

// ─── 1-to-1 Mentorship Chat / Messaging Routes ──────────────────────────────
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

// GET /api/messages/conversations - List active mentorship conversations for current user
app.get('/api/messages/conversations', verifyToken, async (req, res) => {
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
});

// GET /api/messages/unread-count - Total unread message count
app.get('/api/messages/unread-count', verifyToken, async (req, res) => {
  try {
    const unreadCount = await Message.countDocuments({ receiverId: req.user.id, read: false });
    res.json({ success: true, count: unreadCount });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get unread count.' });
  }
});

// GET /api/messages/:mentorshipId - Fetch message history for a mentorship
app.get('/api/messages/:mentorshipId', verifyToken, async (req, res) => {
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
});

// POST /api/messages - Send a message in a mentorship
app.post('/api/messages', verifyToken, async (req, res) => {
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
});

// PUT /api/messages/:mentorshipId/read - Mark messages as read
app.put('/api/messages/:mentorshipId/read', verifyToken, async (req, res) => {
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
});

// ─── Mentor Classes Routes ───────────────────────────────────────────────────
app.get('/api/mentor-classes', verifyToken, async (req, res) => {
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
});

app.post('/api/mentor-classes', verifyToken, async (req, res) => {
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
});

// ─── Referrals Routes ────────────────────────────────────────────────────────
app.get('/api/referrals', verifyToken, async (req, res) => {
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
});

// Alumni submits referral - automatically available to ALL connected students
app.post('/api/referrals', verifyToken, async (req, res) => {
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
});

// Student updates referral status (Read-only for Alumni)
app.put('/api/referrals/:id', verifyToken, async (req, res) => {
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
});

// ─── Notifications Routes ────────────────────────────────────────────────────
app.get('/api/notifications', verifyToken, async (req, res) => {
  try {
    const list = await Notification.find({
      $or: [{ userId: req.user.id }, { recipient: req.user.id }]
    })
      .sort({ createdAt: -1 })
      .limit(30);

    const unreadCount = await Notification.countDocuments({
      $or: [{ userId: req.user.id }, { recipient: req.user.id }],
      unread: true
    });

    res.json({ success: true, count: list.length, unreadCount, data: list });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

app.get('/api/notifications/unread-count', verifyToken, async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({
      $or: [{ userId: req.user.id }, { recipient: req.user.id }],
      unread: true
    });
    res.json({ success: true, unreadCount });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

const handleMarkAsRead = async (req, res) => {
  try {
    const item = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        $or: [{ userId: req.user.id }, { recipient: req.user.id }]
      },
      { unread: false, isRead: true },
      { returnDocument: 'after' }
    );
    if (!item) {
      return res.status(404).json({ error: 'Notification not found or access denied' });
    }
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
app.put('/api/notifications/:id/read', verifyToken, handleMarkAsRead);
app.patch('/api/notifications/:id/read', verifyToken, handleMarkAsRead);

const handleMarkAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { $or: [{ userId: req.user.id }, { recipient: req.user.id }] },
      { unread: false, isRead: true }
    );
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
app.put('/api/notifications/read-all', verifyToken, handleMarkAllRead);
app.patch('/api/notifications/read-all', verifyToken, handleMarkAllRead);

app.delete('/api/notifications/:id', verifyToken, async (req, res) => {
  try {
    await Notification.findOneAndDelete({
      _id: req.params.id,
      $or: [{ userId: req.user.id }, { recipient: req.user.id }]
    });
    res.json({ success: true, message: 'Notification dismissed' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── Analytics Routes (Dynamic MongoDB Aggregations) ────────────────────────
app.get('/api/analytics/overview', verifyToken, requireAdmin, async (req, res) => {
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
});

app.get('/api/analytics/by-department', verifyToken, requireAdmin, async (req, res) => {
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
});

app.get('/api/analytics/by-industry', verifyToken, requireAdmin, async (req, res) => {
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
});

app.get('/api/analytics/engagement-trend', verifyToken, requireAdmin, async (req, res) => {
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
});

app.get('/api/analytics/mentorship-domains', verifyToken, requireAdmin, async (req, res) => {
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
});

app.get('/api/analytics/event-participation', verifyToken, requireAdmin, async (req, res) => {
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

      const category = (ev.type || '').toLowerCase();
      const count = (ev.participants && ev.participants.length) || 1;

      if (category.includes('webinar')) {
        breakdown[qIdx].webinars += count;
      } else if (category.includes('workshop') || category.includes('technical') || category.includes('keynote')) {
        breakdown[qIdx].workshops += count;
      } else {
        breakdown[qIdx].reunions += count;
      }
    });

    res.json(breakdown);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch event participation' });
  }
});

// Health check
app.get('/api/health', async (_, res) => {
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
});

// Inactivity simulator route (Admin testing utility)
app.put('/api/admin/simulate-inactivity/:id', verifyToken, requireAdmin, async (req, res) => {
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
});

// Admin data reset route
app.post('/api/admin/reset-data', async (req, res) => {
  try {
    await seedDatabase(true);
    res.json({ success: true, message: 'All demo and development data reset and baseline seeded.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset data: ' + err.message });
  }
});

// ─── Server Startup & MongoDB Connection ────────────────────────────────────
async function startServer() {
  await connectDB();
  await seedDatabase(false);
  await applyInactivityCheck();

  app.listen(PORT, () => {
    console.log(`✅  AlumniConnect backend running on http://localhost:${PORT}`);
    console.log(`   → Connected to MongoDB. Database ready.`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
