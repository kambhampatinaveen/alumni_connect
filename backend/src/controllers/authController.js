const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Alumni = require('../models/Alumni');
const Student = require('../models/Student');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/jwt');
const { validatePhoneNumber, validateEmail, validateStudentDepartment } = require('../utils/validators');
const { notifyAdmins } = require('../utils/notificationHelper');

// Self-registration for Alumni & Students ONLY (Admin public signup restricted)
async function register(req, res) {
  try {
    const { name, email, phone, password, role, department } = req.body || {};

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
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({ token, user: safeUser });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ error: err.message || 'Registration failed.' });
  }
}

// Role-enforced Login
async function login(req, res) {
  try {
    const { email, password, pin, selectedRole, role } = req.body || {};
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
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({ token, user: safeUser });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
}

// Fetch authenticated user profile
async function getMe(req, res) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
}

// Profile update (Role cannot be changed)
async function updateProfile(req, res) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const {
      name, phone, company, designation, batch, department,
      location, bio, about, skills, linkedin, github, avatar
    } = req.body || {};

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
}

module.exports = {
  register,
  login,
  getMe,
  updateProfile
};
