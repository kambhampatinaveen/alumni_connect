const bcrypt = require('bcrypt');
const Student = require('../models/Student');
const User = require('../models/User');
const {
  validatePhoneNumber,
  validateEmail,
  validateStudentDepartment,
  validateGpa,
  validateClassYear
} = require('../utils/validators');
const { applyInactivityCheck } = require('../utils/inactivityHelper');

async function getStudents(req, res) {
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
}

async function createStudent(req, res) {
  try {
    const { name, email, pin, password, phone, rollNumber, department, batch, gpa } = req.body || {};
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

    let gpaToUse = '3.8';
    if (gpa !== undefined && gpa !== null) {
      const gpaErr = validateGpa(gpa);
      if (gpaErr) return res.status(400).json({ error: gpaErr });
      gpaToUse = String(gpa).trim();
    }

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
        gpa: gpaToUse,
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
}

async function updateStudent(req, res) {
  try {
    let student = null;
    try {
      student = await Student.findById(req.params.id);
    } catch (e) {}
    if (!student) {
      student = await Student.findOne({ userId: req.params.id });
    }
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const { pin, password, ...rest } = req.body || {};

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
}

async function deleteStudent(req, res) {
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
}

module.exports = {
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent
};
